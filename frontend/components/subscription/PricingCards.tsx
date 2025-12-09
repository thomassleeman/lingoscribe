// components/subscription/PricingCards.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Plan Configuration
// ============================================================================

const PLANS = [
  {
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
    prices: {
      monthly: { amount: 9.99, lookupKey: "starter_monthly" },
      annual: {
        amount: 99,
        lookupKey: "starter_annual",
        savings: "2 months free",
      },
    },
  },
  {
    name: "pro",
    displayName: "Pro",
    description: "For power users and professionals",
    popular: true,
    features: [
      "50 hours of transcription per month",
      "Everything in Starter",
      "Priority processing",
      "Batch transcription",
      "Priority support",
    ],
    prices: {
      monthly: { amount: 24.99, lookupKey: "pro_monthly" },
      annual: {
        amount: 249,
        lookupKey: "pro_annual",
        savings: "2 months free",
      },
    },
  },
];

// ============================================================================
// Component
// ============================================================================

interface PricingCardsProps {
  isLoggedIn: boolean;
}

export function PricingCards({ isLoggedIn }: PricingCardsProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectPlan = async (lookupKey: string) => {
    if (!isLoggedIn) {
      // Redirect to sign up with return URL
      router.push(`/sign-up?redirect=/pricing&plan=${lookupKey}`);
      return;
    }

    setLoadingPlan(lookupKey);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceLookupKey: lookupKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start checkout");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full border p-1 bg-muted">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-colors",
              billingInterval === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("annual")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-colors",
              billingInterval === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <span className="ml-1.5 text-xs text-green-600 font-semibold">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan) => {
          const price =
            billingInterval === "monthly"
              ? plan.prices.monthly
              : plan.prices.annual;
          const isLoading = loadingPlan === price.lookupKey;

          return (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border bg-card p-8",
                plan.popular && "border-primary shadow-lg"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.displayName}</h3>
                <p className="text-muted-foreground mt-1">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    £
                    {billingInterval === "monthly"
                      ? price.amount
                      : (price.amount / 12).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                {billingInterval === "annual" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    £{price.amount} billed annually
                    {plan.prices.annual.savings && (
                      <span className="text-green-600 ml-2">
                        ({plan.prices.annual.savings})
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(price.lookupKey)}
                disabled={isLoading}
                className={cn(
                  "w-full mb-6",
                  plan.popular ? "" : "variant-outline"
                )}
                variant={plan.popular ? "default" : "outline"}
              >
                {isLoading
                  ? "Loading..."
                  : isLoggedIn
                    ? "Subscribe"
                    : "Get Started"}
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Trust indicators */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Secure payment powered by Stripe. Cancel anytime.</p>
      </div>
    </div>
  );
}
