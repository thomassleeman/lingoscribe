// components/subscription/UsageDisplay.tsx
// Displays usage progress bar and stats

import { cn } from "@/lib/utils";

interface Usage {
  minutes_used: number;
  minutes_limit: number;
  period_end: string;
}

interface Props {
  usage: Usage;
  showResetDate?: boolean;
  compact?: boolean;
}

export function UsageDisplay({
  usage,
  showResetDate = true,
  compact = false,
}: Props) {
  const percentUsed = Math.min(
    100,
    Math.round((usage.minutes_used / usage.minutes_limit) * 100)
  );
  const minutesRemaining = Math.max(
    0,
    usage.minutes_limit - usage.minutes_used
  );

  const hoursUsed = Math.floor(usage.minutes_used / 60);
  const minsUsed = usage.minutes_used % 60;
  const hoursLimit = Math.floor(usage.minutes_limit / 60);
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemaining = minutesRemaining % 60;

  // Determine color based on usage
  const getBarColor = () => {
    if (percentUsed >= 100) return "bg-red-500";
    if (percentUsed >= 90) return "bg-red-500";
    if (percentUsed >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  const getTextColor = () => {
    if (percentUsed >= 90) return "text-red-600";
    if (percentUsed >= 80) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const formatTimeRemaining = () => {
    const resetDate = new Date(usage.period_end);
    const now = new Date();
    const diffDays = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "tomorrow";
    return `in ${diffDays} days`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={getTextColor()}>
            {hoursRemaining}h {minsRemaining}m remaining
          </span>
          <span className="text-muted-foreground">{percentUsed}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all", getBarColor())}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {hoursUsed}h {minsUsed}m used
          </span>
          <span className="text-sm text-muted-foreground">
            {hoursLimit}h limit
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500", getBarColor())}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className={cn("font-medium", getTextColor())}>
            {hoursRemaining}h {minsRemaining}m
          </span>
          <span className="text-muted-foreground ml-1">remaining</span>
        </div>
        {showResetDate && (
          <div className="text-muted-foreground">
            Resets {formatTimeRemaining()}
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {percentUsed >= 100 && (
        <p className="text-sm text-red-600 font-medium">
          You&apos;ve reached your monthly limit. Upgrade for more hours.
        </p>
      )}
      {percentUsed >= 90 && percentUsed < 100 && (
        <p className="text-sm text-red-600">
          You&apos;re almost at your limit.
        </p>
      )}
      {percentUsed >= 80 && percentUsed < 90 && (
        <p className="text-sm text-yellow-600">
          You&apos;ve used 80% of your monthly allowance.
        </p>
      )}
    </div>
  );
}
