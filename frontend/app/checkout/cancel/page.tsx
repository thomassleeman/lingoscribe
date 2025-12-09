// app/checkout/cancel/page.tsx
// Shown when user cancels Stripe checkout

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Checkout Cancelled - Lingoscribe",
};

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <XCircle className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-2">Checkout cancelled</h1>
        <p className="text-muted-foreground mb-8">
          No worries! Your payment was not processed and you haven&apos;t been
          charged.
        </p>

        {/* Reasons to subscribe */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
          <h2 className="font-semibold mb-3">Why subscribe to LingoScribr?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Transcribe YouTube videos instantly</li>
            <li>• Upload your own audio files</li>
            <li>• Search and export transcripts</li>
            <li>• Cancel anytime, no questions asked</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        {/* Help */}
        <p className="mt-8 text-sm text-muted-foreground">
          Having trouble?{" "}
          <Link href="/support" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
