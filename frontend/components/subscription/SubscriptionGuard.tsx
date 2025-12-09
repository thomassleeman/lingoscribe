// components/subscription/SubscriptionGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { UsageBanner } from "./UsageBanner";
import { LimitReachedModal } from "./LimitReachedModal";
import { PaymentFailedBanner } from "./PaymentFailedBanner";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  // Show loading state while checking subscription
  showLoading?: boolean;
  // Show inline warnings (banner at top)
  showWarnings?: boolean;
  // Block access completely when limit reached (modal)
  blockOnLimit?: boolean;
  // Fallback content when access denied
  fallback?: React.ReactNode;
}

/**
 * Wraps content that requires an active subscription.
 * Shows appropriate warnings, blocks, or loading states.
 *
 * Usage:
 * <SubscriptionGuard showWarnings blockOnLimit>
 *   <TranscriptionForm />
 * </SubscriptionGuard>
 */
export function SubscriptionGuard({
  children,
  showLoading = true,
  showWarnings = true,
  blockOnLimit = true,
  fallback,
}: Props) {
  const {
    isLoading,
    isSubscribed,
    canTranscribe,
    access,
    subscription,
    usage,
    refresh,
  } = useSubscription();

  const [showLimitModal, setShowLimitModal] = useState(false);

  // Show limit modal when access is denied due to limit
  useEffect(() => {
    if (
      !isLoading &&
      access &&
      !access.allowed &&
      access.reason === "limit_reached"
    ) {
      setShowLimitModal(true);
    }
  }, [isLoading, access]);

  // Loading state
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not subscribed - show fallback or nothing
  if (!isSubscribed && !isLoading) {
    return fallback ? <>{fallback}</> : null;
  }

  // Payment failed
  if (access?.reason === "payment_failed") {
    return (
      <div className="space-y-6">
        <PaymentFailedBanner />
        {/* Optionally still show children but disabled */}
        <div className="opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  // Limit reached - show modal and block
  if (blockOnLimit && access?.reason === "limit_reached") {
    return (
      <>
        <LimitReachedModal
          open={showLimitModal}
          onOpenChange={setShowLimitModal}
          resetsAt={usage?.period_end}
          planName={subscription?.plan_name}
          allowDismiss={false}
        />
        {/* Show children behind modal but disabled */}
        <div className="opacity-50 pointer-events-none">{children}</div>
      </>
    );
  }

  // Active with warning
  if (showWarnings && access?.warning) {
    return (
      <div className="space-y-4">
        <UsageBanner
          warning={access.warning}
          planName={subscription?.plan_name}
        />
        {children}
      </div>
    );
  }

  // All good - render children normally
  return <>{children}</>;
}

/**
 * Hook version for more control over rendering
 */
export function useSubscriptionGuard() {
  const subscriptionState = useSubscription();

  const shouldShowWarning =
    subscriptionState.access?.allowed && subscriptionState.access?.warning;

  const shouldBlock =
    !subscriptionState.isLoading &&
    subscriptionState.access &&
    !subscriptionState.access.allowed;

  const blockReason = shouldBlock ? subscriptionState.access?.reason : null;

  return {
    ...subscriptionState,
    shouldShowWarning,
    shouldBlock,
    blockReason,
    warningData: subscriptionState.access?.warning,
  };
}
