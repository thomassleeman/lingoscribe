// app/checkout/success/page.tsx
// Shown after successful Stripe checkout

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment Successful - Lingoscribe",
};

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

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
