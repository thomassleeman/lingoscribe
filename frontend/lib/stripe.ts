// lib/stripe.ts
// Stripe client configuration and utilities

import Stripe from "stripe";

// ============================================================================
// Environment Variables
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

// ============================================================================
// Stripe Client (Server-side only)
// ============================================================================

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover", // Use latest stable API version
  typescript: true,
});

// ============================================================================
// Price Configuration
// ============================================================================

// These can be lookup keys or direct price IDs
// Using lookup keys is recommended as they're easier to manage
export const STRIPE_PRICES = {
  starter_monthly:
    process.env.STRIPE_PRICE_STARTER_MONTHLY || "starter_monthly",
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "starter_annual",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "pro_monthly",
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "pro_annual",
} as const;

export type PriceLookupKey = keyof typeof STRIPE_PRICES;

// Map price lookup keys to plan details
export const PRICE_TO_PLAN: Record<
  string,
  { plan: "starter" | "pro"; interval: "month" | "year"; minutesLimit: number }
> = {
  starter_monthly: { plan: "starter", interval: "month", minutesLimit: 600 },
  starter_annual: { plan: "starter", interval: "year", minutesLimit: 600 },
  pro_monthly: { plan: "pro", interval: "month", minutesLimit: 3000 },
  pro_annual: { plan: "pro", interval: "year", minutesLimit: 3000 },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a Stripe price by lookup key
 */
export async function getPriceByLookupKey(
  lookupKey: string
): Promise<Stripe.Price | null> {
  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });

    return prices.data[0] || null;
  } catch (error) {
    console.error("Error fetching price by lookup key:", error);
    return null;
  }
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // First, search for existing customer with this user ID in metadata
  const existingCustomers = await stripe.customers.search({
    query: `metadata["supabase_user_id"]:"${userId}"`,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer;
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {
      metadata: {
        supabase_user_id: params.userId,
      },
    },
    metadata: {
      supabase_user_id: params.userId,
    },
    // Collect billing address for tax purposes
    billing_address_collection: "required",
    // Allow promotion codes
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a Customer Portal session
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method", "items.data.price.product"],
    });
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return null;
  }
}

/**
 * Resume a subscription that was set to cancel
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return null;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get plan details from a Stripe price
 */
export function getPlanFromPrice(price: Stripe.Price): {
  plan: "starter" | "pro";
  interval: "month" | "year";
  minutesLimit: number;
} | null {
  // Check lookup key first
  if (price.lookup_key && PRICE_TO_PLAN[price.lookup_key]) {
    return PRICE_TO_PLAN[price.lookup_key];
  }

  // Fallback: check price ID in environment variables
  const priceId = price.id;

  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) {
    return { plan: "starter", interval: "month", minutesLimit: 600 };
  }
  if (priceId === process.env.STRIPE_PRICE_STARTER_ANNUAL) {
    return { plan: "starter", interval: "year", minutesLimit: 600 };
  }
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
    return { plan: "pro", interval: "month", minutesLimit: 3000 };
  }
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    return { plan: "pro", interval: "year", minutesLimit: 3000 };
  }

  console.warn("Unknown price ID:", priceId);
  return null;
}
