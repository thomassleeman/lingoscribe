// app/api/stripe/create-checkout/route.ts
// Creates a Stripe Checkout Session for new subscriptions

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  stripe,
  getOrCreateCustomer,
  getPriceByLookupKey,
  PRICE_TO_PLAN,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be logged in to subscribe",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { priceLookupKey } = body;

    if (!priceLookupKey) {
      return NextResponse.json(
        { error: "Bad Request", message: "priceLookupKey is required" },
        { status: 400 }
      );
    }

    // Validate the price lookup key
    if (!PRICE_TO_PLAN[priceLookupKey]) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid price lookup key" },
        { status: 400 }
      );
    }

    // Get the price from Stripe
    const price = await getPriceByLookupKey(priceLookupKey);

    if (!price) {
      return NextResponse.json(
        { error: "Not Found", message: "Price not found in Stripe" },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: "Conflict",
          message:
            "You already have an active subscription. Manage it in billing settings.",
          redirectUrl: "/settings/billing",
        },
        { status: 409 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      user.id,
      user.email!,
      user.user_metadata?.full_name
    );

    // Build success and cancel URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/checkout/cancel`;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
      // Tax collection (optional - configure in Stripe Dashboard)
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
