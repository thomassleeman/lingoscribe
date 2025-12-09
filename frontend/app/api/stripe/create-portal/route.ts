// app/api/stripe/create-portal/route.ts
// Creates a Stripe Customer Portal session for managing subscriptions

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

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
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get the user's subscription to find their Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "No subscription found. Please subscribe first.",
          redirectUrl: "/pricing",
        },
        { status: 404 }
      );
    }

    // Parse optional return URL from body
    let returnUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      const body = await request.json();
      if (body.returnUrl) {
        returnUrl = body.returnUrl;
      }
    } catch {
      // No body provided, use default return URL
    }

    // Ensure return URL goes to billing page
    if (!returnUrl.includes("/settings/billing")) {
      returnUrl = `${returnUrl}/settings/billing`;
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating portal session:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create portal session",
      },
      { status: 500 }
    );
  }
}
