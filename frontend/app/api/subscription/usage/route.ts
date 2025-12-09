// app/api/subscription/usage/route.ts
// Check if user can transcribe and record usage after transcription

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ============================================================================
// GET - Check if user can transcribe
// ============================================================================
// Query params:
//   - estimatedMinutes: (optional) estimated duration to check against limit

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get estimated minutes from query params
    const searchParams = request.nextUrl.searchParams;
    const estimatedMinutes = parseInt(
      searchParams.get("estimatedMinutes") || "0",
      10
    );

    // Call the database function
    const { data, error } = await supabase
      .rpc("can_transcribe", {
        p_user_id: user.id,
        p_estimated_minutes: estimatedMinutes,
      })
      .single();

    if (error) {
      console.error("Error checking transcription access:", error);
      throw error;
    }

    // Format response
    const result = data as {
      allowed: boolean;
      reason: string;
      minutes_remaining: number;
      resets_at: string | null;
    };

    return NextResponse.json({
      canTranscribe: result.allowed,
      reason: result.reason,
      minutesRemaining: result.minutes_remaining,
      resetsAt: result.resets_at,
      // Include human-readable message
      message: getMessageForReason(
        result.reason,
        result.minutes_remaining,
        result.resets_at
      ),
    });
  } catch (error) {
    console.error("Error in usage check:", error);

    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Record usage after transcription
// ============================================================================
// Body:
//   - minutes: number of minutes to charge
//   - sourceType: 'youtube' | 'upload' | 'url'
//   - sourceIdentifier: (optional) video ID, filename, etc.
//   - transcriptId: (optional) ID of the created transcript

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      minutes,
      sourceType = "upload",
      sourceIdentifier = null,
      transcriptId = null,
    } = body;

    if (typeof minutes !== "number" || minutes < 0) {
      return NextResponse.json(
        { error: "Invalid minutes value" },
        { status: 400 }
      );
    }

    // Round up to nearest minute
    const minutesToCharge = Math.ceil(minutes);

    // Call the database function to increment usage
    const { data, error } = await supabase
      .rpc("increment_usage", {
        p_user_id: user.id,
        p_minutes: minutesToCharge,
        p_source_type: sourceType,
        p_source_identifier: sourceIdentifier,
        p_transcript_id: transcriptId,
      })
      .single();

    if (error) {
      console.error("Error recording usage:", error);
      throw error;
    }

    const result = data as {
      success: boolean;
      new_minutes_used: number;
      minutes_limit: number;
      limit_exceeded: boolean;
    };

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.limit_exceeded ? "limit_exceeded" : "recording_failed",
          message: result.limit_exceeded
            ? "Usage limit exceeded"
            : "Failed to record usage",
          currentUsage: result.new_minutes_used,
          limit: result.minutes_limit,
        },
        { status: result.limit_exceeded ? 403 : 500 }
      );
    }

    // Calculate percentage for warning check
    const percentUsed = Math.round(
      (result.new_minutes_used / result.minutes_limit) * 100
    );

    return NextResponse.json({
      success: true,
      usage: {
        minutesUsed: result.new_minutes_used,
        minutesLimit: result.minutes_limit,
        minutesRemaining: result.minutes_limit - result.new_minutes_used,
        percentUsed,
      },
      warning:
        percentUsed >= 80
          ? {
              level: percentUsed >= 90 ? "critical" : "approaching",
              percentUsed,
              minutesRemaining: result.minutes_limit - result.new_minutes_used,
            }
          : null,
    });
  } catch (error) {
    console.error("Error recording usage:", error);

    return NextResponse.json(
      { error: "Failed to record usage" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getMessageForReason(
  reason: string,
  minutesRemaining: number,
  resetsAt: string | null
): string {
  switch (reason) {
    case "ok":
      return `You have ${minutesRemaining} minutes remaining.`;

    case "no_subscription":
      return "You need an active subscription to transcribe.";

    case "payment_failed":
      return "Your payment failed. Please update your payment method.";

    case "canceled":
      return "Your subscription has been canceled.";

    case "inactive":
      return "Your subscription is not active.";

    case "limit_reached":
      const resetDate = resetsAt
        ? new Date(resetsAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
          })
        : "your next billing period";
      return `You've reached your limit. Resets on ${resetDate}.`;

    case "no_usage_period":
      return "Unable to determine usage. Please contact support.";

    default:
      return "Unable to process request.";
  }
}
