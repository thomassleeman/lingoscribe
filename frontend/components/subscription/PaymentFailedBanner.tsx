// components/subscription/PaymentFailedBanner.tsx
"use client";

import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManageSubscriptionButton } from "./ManageSubscriptionButton";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function PaymentFailedBanner({ className }: Props) {
  return (
    <div
      className={cn(
        "bg-red-50 border border-red-200 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-900">Payment failed</h3>
          <p className="mt-1 text-sm text-red-700">
            Your last payment didn&apos;t go through. Please update your payment
            method to continue using transcription features.
          </p>
          <div className="mt-3">
            <ManageSubscriptionButton size="sm" variant="destructive">
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </ManageSubscriptionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
