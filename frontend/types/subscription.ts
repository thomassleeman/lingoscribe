// types/subscription.ts
// TypeScript types for the Stripe subscription system

// ============================================================================
// Database Types (matches Supabase schema)
// ============================================================================

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "inactive";

export type PlanName = "starter" | "pro";

export type BillingInterval = "month" | "year";

export type SourceType = "youtube" | "upload" | "url";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  plan_name: PlanName;
  billing_interval: BillingInterval;
  minutes_limit: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsagePeriod {
  id: string;
  user_id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  minutes_used: number;
  minutes_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  usage_period_id: string | null;
  transcript_id: string | null;
  source_type: SourceType;
  source_identifier: string | null;
  minutes_charged: number;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SubscriptionWithUsage extends Subscription {
  usage: {
    minutes_used: number;
    minutes_limit: number;
    minutes_remaining: number;
    percent_used: number;
    period_end: string;
  } | null;
}

// ============================================================================
// Access Control Types
// ============================================================================

export type BlockReason =
  | "no_subscription"
  | "payment_failed"
  | "canceled"
  | "inactive"
  | "limit_reached";

export type WarningLevel = "approaching" | "critical";

export interface UsageWarning {
  level: WarningLevel;
  percentUsed: number;
  minutesRemaining: number;
  resetsAt: Date;
  resetsIn: string; // Human readable: "12 days"
}

export interface AccessAllowed {
  allowed: true;
  warning?: UsageWarning;
  subscription: Subscription;
  usage: {
    minutesUsed: number;
    minutesLimit: number;
    minutesRemaining: number;
  };
}

export interface AccessDenied {
  allowed: false;
  reason: BlockReason;
  message: string;
  actionUrl?: string; // URL to resolve the issue
  actionLabel?: string; // Button text
}

export type AccessStatus = AccessAllowed | AccessDenied;

// ============================================================================
// Checkout Types
// ============================================================================

export type PriceLookupKey =
  | "starter_monthly"
  | "starter_annual"
  | "pro_monthly"
  | "pro_annual";

export interface CreateCheckoutRequest {
  priceLookupKey: PriceLookupKey;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface CreatePortalRequest {
  returnUrl?: string;
}

export interface CreatePortalResponse {
  url: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// ============================================================================
// Plan Configuration
// ============================================================================

export interface PlanConfig {
  name: PlanName;
  displayName: string;
  description: string;
  features: string[];
  minutesLimit: number;
  hoursLimit: number;
  prices: {
    monthly: {
      amount: number;
      currency: string;
      lookupKey: PriceLookupKey;
    };
    annual: {
      amount: number;
      currency: string;
      lookupKey: PriceLookupKey;
      savings: string; // e.g., "2 months free"
    };
  };
}

export const PLAN_CONFIG: Record<PlanName, PlanConfig> = {
  starter: {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for casual listeners",
    features: [
      "10 hours of transcription per month",
      "YouTube video transcription",
      "Audio file uploads",
      "Export to TXT, SRT, VTT",
      "Search within transcripts",
      "Email support",
    ],
    minutesLimit: 600,
    hoursLimit: 10,
    prices: {
      monthly: {
        amount: 999, // in pence
        currency: "gbp",
        lookupKey: "starter_monthly",
      },
      annual: {
        amount: 9900,
        currency: "gbp",
        lookupKey: "starter_annual",
        savings: "2 months free",
      },
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    description: "For power users and professionals",
    features: [
      "50 hours of transcription per month",
      "Everything in Starter",
      "Priority processing",
      "Batch transcription",
      "Priority support",
    ],
    minutesLimit: 3000,
    hoursLimit: 50,
    prices: {
      monthly: {
        amount: 2499,
        currency: "gbp",
        lookupKey: "pro_monthly",
      },
      annual: {
        amount: 24900,
        currency: "gbp",
        lookupKey: "pro_annual",
        savings: "2 months free",
      },
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getPlanFromPriceId(priceId: string): PlanName | null {
  // This would need to be configured with actual price IDs
  // For now, return null - implement when you have the IDs
  return null;
}

export function getMinutesLimitForPlan(plan: PlanName): number {
  return PLAN_CONFIG[plan].minutesLimit;
}

export function formatMinutesAsHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function getBlockMessage(reason: BlockReason): {
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
} {
  switch (reason) {
    case "no_subscription":
      return {
        title: "Subscription Required",
        message:
          "You need an active subscription to use transcription features.",
        actionLabel: "View Plans",
        actionUrl: "/pricing",
      };
    case "payment_failed":
      return {
        title: "Payment Failed",
        message:
          "Your last payment failed. Please update your payment method to continue.",
        actionLabel: "Update Payment Method",
        actionUrl: "/settings/billing",
      };
    case "canceled":
      return {
        title: "Subscription Canceled",
        message:
          "Your subscription has been canceled. Subscribe again to continue.",
        actionLabel: "Resubscribe",
        actionUrl: "/pricing",
      };
    case "inactive":
      return {
        title: "Subscription Inactive",
        message: "Your subscription is not active. Please contact support.",
        actionLabel: "Contact Support",
        actionUrl: "/support",
      };
    case "limit_reached":
      return {
        title: "Monthly Limit Reached",
        message:
          "You've used all your transcription minutes for this billing period.",
        actionLabel: "Upgrade Plan",
        actionUrl: "/settings/billing",
      };
  }
}
