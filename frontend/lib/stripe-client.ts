// lib/stripe-client.ts
// Client-side Stripe utilities (for browser)

import { loadStripe, Stripe } from "@stripe/stripe-js";

// ============================================================================
// Stripe Promise (lazy-loaded)
// ============================================================================

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(key);
  }

  return stripePromise;
}

// ============================================================================
// Checkout Redirect
// ============================================================================

/**
 * Redirect to Stripe Checkout
 * Call the API to create a session, then redirect
 */
export async function redirectToCheckout(
  priceLookupKey: string
): Promise<void> {
  try {
    // Create checkout session via API
    const response = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priceLookupKey }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create checkout session");
    }

    const { url } = await response.json();

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    throw error;
  }
}

/**
 * Redirect to Stripe Customer Portal
 */
export async function redirectToCustomerPortal(): Promise<void> {
  try {
    const response = await fetch("/api/stripe/create-portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create portal session");
    }

    const { url } = await response.json();

    // Redirect to Customer Portal
    window.location.href = url;
  } catch (error) {
    console.error("Error redirecting to portal:", error);
    throw error;
  }
}

// ============================================================================
// Subscription Status Hook Helper
// ============================================================================

export interface SubscriptionStatus {
  isLoading: boolean;
  isSubscribed: boolean;
  subscription: {
    planName: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  usage: {
    minutesUsed: number;
    minutesLimit: number;
    percentUsed: number;
    minutesRemaining: number;
  } | null;
  error: Error | null;
}

/**
 * Fetch subscription status from API
 */
export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const response = await fetch("/api/subscription/status");

    if (!response.ok) {
      if (response.status === 401) {
        return {
          isLoading: false,
          isSubscribed: false,
          subscription: null,
          usage: null,
          error: null,
        };
      }
      throw new Error("Failed to fetch subscription status");
    }

    const data = await response.json();

    return {
      isLoading: false,
      isSubscribed: data.status === "active",
      subscription: data.subscription
        ? {
            planName: data.subscription.plan_name,
            status: data.subscription.status,
            currentPeriodEnd: data.subscription.current_period_end
              ? new Date(data.subscription.current_period_end)
              : null,
            cancelAtPeriodEnd: data.subscription.cancel_at_period_end,
          }
        : null,
      usage: data.usage
        ? {
            minutesUsed: data.usage.minutes_used,
            minutesLimit: data.usage.minutes_limit,
            percentUsed: data.usage.percent_used,
            minutesRemaining:
              data.usage.minutes_limit - data.usage.minutes_used,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return {
      isLoading: false,
      isSubscribed: false,
      subscription: null,
      usage: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// ============================================================================
// Price Formatting
// ============================================================================

export function formatPrice(amount: number, currency: string = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function formatInterval(interval: "month" | "year"): string {
  return interval === "month" ? "month" : "year";
}
