// components/subscription/SubscriptionDetails.tsx
// Displays subscription plan details

import { Badge } from "@/components/ui/UIbadge";

interface Subscription {
  plan_name: string;
  billing_interval: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  minutes_limit: number;
}

interface Props {
  subscription: Subscription;
}

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
};

const STATUS_BADGES: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past Due", variant: "destructive" },
  canceled: { label: "Canceled", variant: "secondary" },
  unpaid: { label: "Unpaid", variant: "destructive" },
};

export function SubscriptionDetails({ subscription }: Props) {
  const planName =
    PLAN_DISPLAY_NAMES[subscription.plan_name] || subscription.plan_name;
  const statusBadge = STATUS_BADGES[subscription.status] || {
    label: subscription.status,
    variant: "outline" as const,
  };
  const hoursLimit = Math.round(subscription.minutes_limit / 60);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Plan Name and Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold">{planName}</span>
          <span className="text-muted-foreground ml-2">
            ({subscription.billing_interval === "year" ? "Annual" : "Monthly"})
          </span>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Monthly allowance</p>
          <p className="font-medium">{hoursLimit} hours</p>
        </div>
        <div>
          <p className="text-muted-foreground">Billing period</p>
          <p className="font-medium capitalize">
            {subscription.billing_interval}ly
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Current period started</p>
          <p className="font-medium">
            {formatDate(subscription.current_period_start)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {subscription.cancel_at_period_end
              ? "Access until"
              : "Next billing date"}
          </p>
          <p className="font-medium">
            {formatDate(subscription.current_period_end)}
          </p>
        </div>
      </div>
    </div>
  );
}
