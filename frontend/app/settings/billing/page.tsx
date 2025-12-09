// app/settings/billing/page.tsx
// Billing settings page - view subscription, usage, and manage payment

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SubscriptionDetails } from "@/components/subscription/SubscriptionDetails";
import { UsageDisplay } from "@/components/subscription/UsageDisplay";
import { ManageSubscriptionButton } from "@/components/subscription/ManageSubscriptionButton";
import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Billing Settings - Lingoscribe",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/settings/billing");
  }

  // Fetch subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch current usage period
  let usage = null;
  if (subscription) {
    const { data: usageData } = await supabase
      .from("usage_periods")
      .select("*")
      .eq("user_id", user.id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .single();

    usage = usageData;
  }

  // No subscription - show upgrade prompt
  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Billing</h1>

        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">No active subscription</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to start transcribing YouTube videos and audio files.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const isPastDue = subscription.status === "past_due";
  const isCanceled = subscription.status === "canceled";
  const willCancel = subscription.cancel_at_period_end;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Payment Failed Warning */}
      {isPastDue && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Payment failed</h3>
            <p className="text-sm text-red-700 mt-1">
              Your last payment failed. Please update your payment method to
              continue using Lingoscribe.
            </p>
            <ManageSubscriptionButton
              className="mt-3"
              variant="destructive"
              size="sm"
            >
              Update Payment Method
            </ManageSubscriptionButton>
          </div>
        </div>
      )}

      {/* Cancellation Notice */}
      {willCancel && !isCanceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">Subscription ending</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your subscription will end on{" "}
              {new Date(subscription.current_period_end!).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
              . You can continue using Lingoscribe until then.
            </p>
            <ManageSubscriptionButton
              className="mt-3"
              variant="outline"
              size="sm"
            >
              Resume Subscription
            </ManageSubscriptionButton>
          </div>
        </div>
      )}

      {/* Subscription Details Card */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Plan</h2>
        <SubscriptionDetails subscription={subscription} />

        {!isCanceled && (
          <div className="mt-6 pt-6 border-t">
            <ManageSubscriptionButton>
              Manage Subscription
            </ManageSubscriptionButton>
            <p className="text-xs text-muted-foreground mt-2">
              Change plan, update payment method, or cancel
            </p>
          </div>
        )}
      </div>

      {/* Usage Card */}
      {usage && subscription.status === "active" && (
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Usage This Period</h2>
          <UsageDisplay usage={usage} />
        </div>
      )}

      {/* Canceled State */}
      {isCanceled && (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Subscription canceled</h2>
          <p className="text-muted-foreground mb-6">
            Your subscription has been canceled. Subscribe again to continue
            transcribing.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Plans
          </a>
        </div>
      )}

      {/* Billing History Note */}
      <div className="text-sm text-muted-foreground">
        <p>
          View invoices and billing history in the{" "}
          <ManageSubscriptionButton
            variant="link"
            className="p-0 h-auto text-primary"
          >
            customer portal
          </ManageSubscriptionButton>
          .
        </p>
      </div>
    </div>
  );
}
