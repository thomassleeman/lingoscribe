// components/subscription/ManageSubscriptionButton.tsx
"use client";

import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";

interface Props extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode;
}

export function ManageSubscriptionButton({
  children = "Manage Subscription",
  ...props
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to open billing portal");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Portal error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to open billing portal"
      );
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </Button>
  );
}
