// app/api/subscription/check/route.ts
// Checks if user has an active subscription (for polling after checkout)

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { hasSubscription: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check for active subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("id, status, plan_name")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // No subscription found yet
      return NextResponse.json({ hasSubscription: false });
    }

    const hasActiveSubscription =
      subscription.status === "active" || subscription.status === "past_due";

    return NextResponse.json({
      hasSubscription: hasActiveSubscription,
      subscription: hasActiveSubscription ? subscription : null,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { hasSubscription: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
