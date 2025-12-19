// app/checkout/success/page.tsx
// Shown after successful Stripe checkout

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const [isActivating, setIsActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/check");
        const data = await response.json();

        if (data.hasSubscription) {
          // Subscription created successfully
          setIsActivating(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        } else {
          // Increment retry count
          setRetryCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      }
    };

    // Start polling every 2 seconds
    intervalId = setInterval(checkSubscription, 2000);

    // Initial check
    checkSubscription();

    // Timeout after 30 seconds
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (isActivating) {
        setError(
          "Subscription activation is taking longer than expected. Please refresh the page or contact support if the issue persists."
        );
        setIsActivating(false);
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  if (isActivating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Loading Icon */}
          <div className="mb-6 flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold mb-2">
            Activating your subscription...
          </h1>
          <p className="text-muted-foreground mb-4">
            Payment successful! We&apos;re setting up your account.
          </p>
          <p className="text-sm text-muted-foreground">
            This usually takes just a few seconds...
          </p>

          {/* Show retry count if it's taking a while */}
          {retryCount > 5 && (
            <p className="text-xs text-muted-foreground mt-4">
              Still processing... ({Math.floor(retryCount * 2)}s)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Warning Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-3">
              <CheckCircle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Payment Received</h1>
          <p className="text-muted-foreground mb-4">{error}</p>

          <div className="flex flex-col justify-center">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for subscribing to Lingoscribe. Your account is now active
          and you can start transcribing right away.
        </p>

        {/* What's next */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
          <h2 className="font-semibold mb-3">What&apos;s next?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Start transcribing YouTube videos or upload audio files</li>
            <li>• Your usage resets each billing period</li>
            <li>• Manage your subscription in billing settings</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/my-content">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/billing">View Subscription</Link>
          </Button>
        </div>

        {/* Receipt note */}
        <p className="mt-8 text-xs text-muted-foreground">
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
}
