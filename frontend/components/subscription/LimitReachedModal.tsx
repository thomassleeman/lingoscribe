// components/subscription/LimitReachedModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { AlertOctagon, Calendar, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  resetsAt?: string;
  planName?: string;
  // If false, user cannot close the modal (hard block)
  allowDismiss?: boolean;
}

export function LimitReachedModal({
  open,
  onOpenChange,
  resetsAt,
  planName = "starter",
  allowDismiss = false,
}: Props) {
  const router = useRouter();
  const canUpgrade = planName === "starter";

  const formatResetDate = () => {
    if (!resetsAt) return "your next billing period";

    const resetDate = new Date(resetsAt);
    const now = new Date();
    const diffDays = Math.ceil(
      (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dateStr = resetDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    if (diffDays <= 0) return "later today";
    if (diffDays === 1) return "tomorrow";
    return `on ${dateStr} (${diffDays} days)`;
  };

  const handleUpgrade = () => {
    router.push("/settings/billing");
  };

  const handleClose = () => {
    if (allowDismiss && onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={allowDismiss ? onOpenChange : undefined}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => !allowDismiss && e.preventDefault()}
        onEscapeKeyDown={(e) => !allowDismiss && e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertOctagon className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl">Monthly limit reached</DialogTitle>
          <DialogDescription className="text-base">
            You&apos;ve used all your transcription minutes for this billing
            period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reset Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                Your usage resets {formatResetDate()}
              </p>
              <p className="text-muted-foreground">
                You&apos;ll have full access again after the reset.
              </p>
            </div>
          </div>

          {/* Upgrade Option */}
          {canUpgrade && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <ArrowUpCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Need more hours?</p>
                <p className="text-muted-foreground">
                  Upgrade to Pro for 50 hours per month.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {canUpgrade && (
            <Button onClick={handleUpgrade} className="w-full">
              Upgrade to Pro
            </Button>
          )}
          {allowDismiss ? (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
