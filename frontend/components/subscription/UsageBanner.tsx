// components/subscription/UsageBanner.tsx
"use client";

import { useState } from "react";
import { X, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UsageWarning {
  level: "approaching" | "critical";
  percentUsed: number;
  minutesRemaining: number;
  resetsAt: string;
}

interface Props {
  warning: UsageWarning;
  planName?: string;
  dismissible?: boolean;
  className?: string;
}

export function UsageBanner({
  warning,
  planName = "starter",
  dismissible = true,
  className,
}: Props) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const hoursRemaining = Math.floor(warning.minutesRemaining / 60);
  const minsRemaining = warning.minutesRemaining % 60;

  const formatResetDate = () => {
    const resetDate = new Date(warning.resetsAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays <= 7) return `in ${diffDays} days`;
    return resetDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const isCritical = warning.level === "critical";
  const canUpgrade = planName === "starter";

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg flex items-center gap-3",
        isCritical
          ? "bg-red-50 border border-red-200 text-red-800"
          : "bg-yellow-50 border border-yellow-200 text-yellow-800",
        className
      )}
    >
      {/* Icon */}
      {isCritical ? (
        <AlertTriangle className="h-5 w-5 shrink-0" />
      ) : (
        <Clock className="h-5 w-5 shrink-0" />
      )}

      {/* Message */}
      <div className="flex-1 text-sm">
        <span className="font-medium">
          {isCritical
            ? `Only ${hoursRemaining}h ${minsRemaining}m remaining`
            : `You've used ${warning.percentUsed}% of your monthly limit`}
        </span>
        <span className="mx-1">·</span>
        <span>Resets {formatResetDate()}</span>
        {canUpgrade && (
          <>
            <span className="mx-1">·</span>
            <Link
              href="/settings/billing"
              className="font-medium underline hover:no-underline"
            >
              Upgrade to Pro
            </Link>
          </>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            "p-1 rounded hover:bg-black/5",
            isCritical ? "text-red-600" : "text-yellow-600"
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
