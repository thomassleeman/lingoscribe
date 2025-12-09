// app/pricing/page.tsx
// Public pricing page for plan selection

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PricingCards } from "@/components/subscription/PricingCards";

export const metadata = {
  title: "Pricing - Lingoscribe",
  description: "Choose your transcription plan",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user already has an active subscription
  let hasActiveSubscription = false;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .single();

    hasActiveSubscription = !!subscription;
  }

  // If already subscribed, redirect to billing
  if (hasActiveSubscription) {
    redirect("/settings/billing");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards isLoggedIn={!!user} />

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-6">
            Frequently asked questions
          </h2>
          <div className="max-w-2xl mx-auto text-left space-y-6">
            <div>
              <h3 className="font-medium mb-2">
                What counts towards my usage?
              </h3>
              <p className="text-muted-foreground">
                Only successful transcriptions count towards your monthly limit.
                The duration of the audio or video is what gets charged, rounded
                up to the nearest minute.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">When does my usage reset?</h3>
              <p className="text-muted-foreground">
                Your usage resets at the start of each billing period, not the
                calendar month. If you subscribed on the 15th, your usage resets
                on the 15th of each month.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Can I change plans?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade at any time from your billing
                settings. Changes take effect immediately, with prorated
                billing.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit and debit cards through Stripe,
                including Visa, Mastercard, and American Express.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
