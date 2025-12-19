// app/api/stripe/webhook/route.ts
// Handles Stripe webhook events for subscription lifecycle

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, getPlanFromPrice } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed");
  console.log("Session ID:", session.id);
  console.log("Session status:", session.status);
  console.log("Payment status:", session.payment_status);

  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log("User ID:", userId);
  console.log("Customer ID:", customerId);
  console.log("Subscription ID:", subscriptionId);

  if (!userId) {
    console.error("No supabase_user_id in session metadata");
    return;
  }

  // Fetch the full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  // Type assertion to access period properties
  const sub = subscription as any;

  console.log("Retrieved subscription status:", subscription.status);
  console.log("🔍 Full subscription object keys:", Object.keys(subscription));
  console.log("🔍 Subscription object sample:", {
    id: subscription.id,
    status: subscription.status,
    created: (subscription as any).created,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
    billing_cycle_anchor: sub.billing_cycle_anchor,
  });
  console.log("Subscription period start:", sub.current_period_start);
  console.log("Subscription period end:", sub.current_period_end);
  console.log(
    "Subscription start timestamp (ISO):",
    sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : "NULL"
  );
  console.log(
    "Subscription end timestamp (ISO):",
    sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : "NULL"
  );

  await upsertSubscription(userId, customerId, subscription);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log(`Processing subscription ${subscription.status}`);

  // Debug: Check what fields are in the subscription from webhook
  const sub = subscription as any;
  console.log("🔍 Webhook subscription keys:", Object.keys(subscription));
  console.log("🔍 Webhook subscription sample:", {
    id: subscription.id,
    status: subscription.status,
    created: sub.created,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
    billing_cycle_anchor: sub.billing_cycle_anchor,
  });

  const userId = subscription.metadata?.supabase_user_id;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!existingSub) {
      console.error("Cannot find user for subscription");
      return;
    }

    await upsertSubscription(existingSub.user_id, customerId, subscription);
  } else {
    await upsertSubscription(userId, customerId, subscription);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription deletion");

  const customerId = subscription.customer as string;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating canceled subscription:", error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Processing invoice.paid");

  // This handles subscription renewals
  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  if (!subscriptionId) {
    console.log("Invoice not related to subscription");
    return;
  }

  // Get the subscription to find user and create new usage period
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) {
    console.log("Subscription not found for invoice");
    return;
  }

  // Ensure status is active
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  // Check if we need to create a new usage period
  // This happens on renewal
  const periodStart = new Date(
    (invoice.period_start || invoice.created) * 1000
  );
  const periodEnd = new Date(
    (invoice.period_end || invoice.created + 30 * 24 * 60 * 60) * 1000
  );

  // Check if usage period already exists
  const { data: existingPeriod } = await supabaseAdmin
    .from("usage_periods")
    .select("id")
    .eq("user_id", subscription.user_id)
    .eq("period_start", periodStart.toISOString())
    .single();

  if (!existingPeriod) {
    // Create new usage period for the new billing cycle
    await supabaseAdmin.from("usage_periods").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      minutes_used: 0,
      minutes_limit: subscription.minutes_limit,
    });

    console.log("Created new usage period for renewal");
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed");

  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Mark subscription as past_due
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription to past_due:", error);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function upsertSubscription(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  // Type assertion for period properties
  const sub = subscription as any;

  // Get the price and determine plan details
  const priceItem = subscription.items.data[0];
  const price = priceItem.price;

  // Try to get plan details from price
  let planDetails = getPlanFromPrice(price);

  // Fallback if we can't determine plan
  if (!planDetails) {
    console.warn("Could not determine plan from price, using defaults");
    planDetails = {
      plan: "starter",
      interval: (price.recurring?.interval as "month" | "year") || "month",
      minutesLimit: 600,
    };
  }

  // Calculate period dates from billing_cycle_anchor
  // In Stripe API 2025-11-17.clover, current_period_start/end were removed
  // Use billing_cycle_anchor and interval to calculate period dates
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  if (sub.billing_cycle_anchor) {
    const anchorDate = new Date(sub.billing_cycle_anchor * 1000);
    periodStart = anchorDate.toISOString();

    // Calculate period end based on billing interval
    const endDate = new Date(anchorDate);
    if (planDetails.interval === "year") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // month
      endDate.setMonth(endDate.getMonth() + 1);
    }
    periodEnd = endDate.toISOString();

    console.log("✅ Calculated period from billing_cycle_anchor:", {
      anchor: sub.billing_cycle_anchor,
      periodStart,
      periodEnd,
      interval: planDetails.interval,
    });
  } else {
    console.log(
      `⚠️ Subscription ${subscription.id} has no billing_cycle_anchor`
    );
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: price.id,
    status: subscription.status,
    plan_name: planDetails.plan,
    billing_interval: planDetails.interval,
    minutes_limit: planDetails.minutesLimit,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  console.log("📝 About to upsert subscription with data:", {
    ...subscriptionData,
    current_period_start: subscriptionData.current_period_start || "NULL",
    current_period_end: subscriptionData.current_period_end || "NULL",
  });

  // Upsert subscription
  const { data: upsertedSub, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (subError) {
    console.error("Error upserting subscription:", subError);
    throw subError;
  }

  console.log("✅ Upserted subscription:", upsertedSub.id);

  // Create usage period if this is a new/renewed subscription
  if (
    subscription.status === "active" &&
    sub.current_period_start &&
    sub.current_period_end
  ) {
    await ensureUsagePeriod(
      userId,
      upsertedSub.id,
      new Date(sub.current_period_start * 1000),
      new Date(sub.current_period_end * 1000),
      planDetails.minutesLimit
    );
  }
}

async function ensureUsagePeriod(
  userId: string,
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date,
  minutesLimit: number
) {
  // Check if usage period exists
  const { data: existing } = await supabaseAdmin
    .from("usage_periods")
    .select("id")
    .eq("user_id", userId)
    .eq("period_start", periodStart.toISOString())
    .single();

  if (!existing) {
    const { error } = await supabaseAdmin.from("usage_periods").insert({
      user_id: userId,
      subscription_id: subscriptionId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      minutes_used: 0,
      minutes_limit: minutesLimit,
    });

    if (error) {
      console.error("Error creating usage period:", error);
    } else {
      console.log("Created usage period");
    }
  }
}
