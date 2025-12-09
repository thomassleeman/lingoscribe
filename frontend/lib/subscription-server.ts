import { createClient } from "@/utils/supabase/server";

export async function getSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated" };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan_name, minutes_limit")
    .eq("user_id", user.id)
    .single();

  return { status: subscription?.status ?? "none", subscription };
}
