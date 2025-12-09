import { getSubscriptionStatus } from "@/lib/subscription-server";
import { redirect } from "next/navigation";
import { SubscriptionGuard } from "@/components/subscription";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status } = await getSubscriptionStatus();

  // Server-side redirect (faster, more secure)
  if (status === "unauthenticated") redirect("/sign-in");
  if (status === "none" || status === "canceled") redirect("/pricing");

  // Client wrapper for UI enhancements
  return (
    <SubscriptionGuard showWarnings blockOnLimit>
      {children}
    </SubscriptionGuard>
  );
}
