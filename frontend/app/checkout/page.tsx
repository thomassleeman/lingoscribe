// app/checkout/page.tsx
// Automatically initiates Stripe checkout when user lands here with a plan parameter

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) {
      // No plan specified, redirect to pricing
      router.push("/pricing");
      return;
    }

    // Automatically initiate checkout
    const initiateCheckout = async () => {
      try {
        const response = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceLookupKey: plan }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle specific error cases
          if (response.status === 409) {
            // User already has a subscription
            router.push(errorData.redirectUrl || "/settings/billing");
            return;
          }

          throw new Error(errorData.message || "Failed to start checkout");
        }

        const { url } = await response.json();

        // Redirect to Stripe Checkout
        window.location.href = url;
      } catch (err) {
        console.error("Checkout error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to start checkout"
        );
      }
    };

    initiateCheckout();
  }, [plan, router]);

  // Show loading state
  if (!error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to checkout...</p>
      </div>
    );
  }

  // Show error state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">Checkout Error</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => router.push("/pricing")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Return to Pricing
        </button>
      </div>
    </div>
  );
}
