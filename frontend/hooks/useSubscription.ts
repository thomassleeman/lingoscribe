// hooks/useSubscription.ts
// React hook for fetching and managing subscription state

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionData {
  id: string;
  plan_name: "starter" | "pro";
  billing_interval: "month" | "year";
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

export interface UsageData {
  minutes_used: number;
  minutes_limit: number;
  minutes_remaining: number;
  percent_used: number;
  period_start: string;
  period_end: string;
}

export interface AccessData {
  allowed: boolean;
  reason?: string;
  message: string;
  warning?: {
    level: "approaching" | "critical";
    percent_used: number;
    minutes_remaining: number;
    resets_at: string;
  };
}

export interface SubscriptionState {
  isLoading: boolean;
  error: Error | null;
  status: "none" | "active" | "past_due" | "canceled" | "unpaid" | string;
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  access: AccessData | null;
  // Computed helpers
  isSubscribed: boolean;
  canTranscribe: boolean;
  hasWarning: boolean;
  warningLevel: "approaching" | "critical" | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useSubscription(): SubscriptionState & {
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    error: null,
    status: "none",
    subscription: null,
    usage: null,
    access: null,
    isSubscribed: false,
    canTranscribe: false,
    hasWarning: false,
    warningLevel: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/subscription/status");

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in
          setState({
            isLoading: false,
            error: null,
            status: "none",
            subscription: null,
            usage: null,
            access: {
              allowed: false,
              reason: "not_authenticated",
              message: "Please log in",
            },
            isSubscribed: false,
            canTranscribe: false,
            hasWarning: false,
            warningLevel: null,
          });
          return;
        }
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();

      setState({
        isLoading: false,
        error: null,
        status: data.status,
        subscription: data.subscription,
        usage: data.usage,
        access: data.access,
        isSubscribed: data.status === "active",
        canTranscribe: data.access?.allowed ?? false,
        hasWarning: !!data.access?.warning,
        warningLevel: data.access?.warning?.level ?? null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...state,
    refresh: fetchStatus,
  };
}

// ============================================================================
// Pre-transcription Check Hook
// ============================================================================

export function useCanTranscribe() {
  const [isChecking, setIsChecking] = useState(false);

  const checkCanTranscribe = useCallback(
    async (
      estimatedMinutes: number = 0
    ): Promise<{
      canTranscribe: boolean;
      reason: string;
      minutesRemaining: number;
      message: string;
    }> => {
      setIsChecking(true);

      try {
        const response = await fetch(
          `/api/subscription/usage?estimatedMinutes=${estimatedMinutes}`
        );

        if (!response.ok) {
          throw new Error("Failed to check transcription access");
        }

        const data = await response.json();
        return data;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  return {
    isChecking,
    checkCanTranscribe,
  };
}

// ============================================================================
// Record Usage Hook
// ============================================================================

export function useRecordUsage() {
  const [isRecording, setIsRecording] = useState(false);

  const recordUsage = useCallback(
    async (params: {
      minutes: number;
      sourceType: "youtube" | "upload" | "url";
      sourceIdentifier?: string;
      transcriptId?: string;
    }): Promise<{
      success: boolean;
      usage?: {
        minutesUsed: number;
        minutesLimit: number;
        minutesRemaining: number;
        percentUsed: number;
      };
      warning?: {
        level: "approaching" | "critical";
        percentUsed: number;
        minutesRemaining: number;
      };
      error?: string;
    }> => {
      setIsRecording(true);

      try {
        const response = await fetch("/api/subscription/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || "Failed to record usage",
          };
        }

        return data;
      } finally {
        setIsRecording(false);
      }
    },
    []
  );

  return {
    isRecording,
    recordUsage,
  };
}

// ============================================================================
// Format Helpers
// ============================================================================

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function formatResetDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return "today";
  }
  if (diffDays === 1) {
    return "tomorrow";
  }
  if (diffDays <= 7) {
    return `in ${diffDays} days`;
  }

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
