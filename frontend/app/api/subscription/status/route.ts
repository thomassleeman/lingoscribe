// app/api/subscription/status/route.ts
// Returns the current user's subscription and usage status

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
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

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine for new users
      console.error("Error fetching subscription:", subError);
      throw subError;
    }

    // If no subscription, return appropriate response
    if (!subscription) {
      return NextResponse.json({
        status: "none",
        subscription: null,
        usage: null,
        access: {
          allowed: false,
          reason: "no_subscription",
          message: "You need a subscription to use transcription features.",
        },
      });
    }

    // Get current usage period
    const { data: usage, error: usageError } = await supabase
      .from("usage_periods")
      .select("*")
      .eq("user_id", user.id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .single();

    if (usageError && usageError.code !== "PGRST116") {
      console.error("Error fetching usage:", usageError);
    }

    // Calculate usage stats
    let usageStats = null;
    if (usage) {
      const percentUsed = Math.round(
        (usage.minutes_used / usage.minutes_limit) * 100
      );
      usageStats = {
        minutes_used: usage.minutes_used,
        minutes_limit: usage.minutes_limit,
        minutes_remaining: Math.max(
          0,
          usage.minutes_limit - usage.minutes_used
        ),
        percent_used: percentUsed,
        period_start: usage.period_start,
        period_end: usage.period_end,
      };
    }

    // Determine access status
    const access = determineAccess(subscription, usageStats);

    return NextResponse.json({
      status: subscription.status,
      subscription: {
        id: subscription.id,
        plan_name: subscription.plan_name,
        billing_interval: subscription.billing_interval,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at,
      },
      usage: usageStats,
      access,
    });
  } catch (error) {
    console.error("Error in subscription status:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get subscription status",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Access Control Logic
// ============================================================================

interface UsageStats {
  minutes_used: number;
  minutes_limit: number;
  minutes_remaining: number;
  percent_used: number;
  period_end: string;
}

interface Subscription {
  status: string;
  plan_name: string;
  current_period_end: string | null;
}

interface AccessResult {
  allowed: boolean;
  reason?: string;
  message: string;
  warning?: {
    level: "approaching" | "critical";
    percent_used: number;
    minutes_remaining: number;
    resets_at: string;
  };
}

function determineAccess(
  subscription: Subscription,
  usage: UsageStats | null
): AccessResult {
  // Check subscription status
  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return {
      allowed: false,
      reason: "payment_failed",
      message:
        "Your payment failed. Please update your payment method to continue.",
    };
  }

  if (subscription.status === "canceled") {
    return {
      allowed: false,
      reason: "canceled",
      message: "Your subscription has been canceled.",
    };
  }

  if (subscription.status !== "active") {
    return {
      allowed: false,
      reason: "inactive",
      message: "Your subscription is not active.",
    };
  }

  // Check usage
  if (!usage) {
    return {
      allowed: false,
      reason: "no_usage_period",
      message: "Unable to determine usage. Please contact support.",
    };
  }

  // Check if limit reached
  if (usage.minutes_remaining <= 0) {
    return {
      allowed: false,
      reason: "limit_reached",
      message: `You've used all your transcription minutes for this billing period. Resets on ${formatDate(usage.period_end)}.`,
    };
  }

  // Check for warnings
  if (usage.percent_used >= 90) {
    return {
      allowed: true,
      message: "OK",
      warning: {
        level: "critical",
        percent_used: usage.percent_used,
        minutes_remaining: usage.minutes_remaining,
        resets_at: usage.period_end,
      },
    };
  }

  if (usage.percent_used >= 80) {
    return {
      allowed: true,
      message: "OK",
      warning: {
        level: "approaching",
        percent_used: usage.percent_used,
        minutes_remaining: usage.minutes_remaining,
        resets_at: usage.period_end,
      },
    };
  }

  // All good
  return {
    allowed: true,
    message: "OK",
  };
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}
