"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const plan = formData.get("plan")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  console.log("signUpAction - Form data received:", {
    email,
    hasPassword: !!password,
    hasConfirmPassword: !!confirmPassword,
    passwordsMatch: password === confirmPassword,
    plan
  });

  if (!email || !password) {
    const redirectPath = plan ? `/sign-up?plan=${plan}` : "/sign-up";
    return encodedRedirect(
      "error",
      redirectPath,
      "Email and password are required"
    );
  }

  if (password !== confirmPassword) {
    const redirectPath = plan ? `/sign-up?plan=${plan}` : "/sign-up";
    return encodedRedirect(
      "error",
      redirectPath,
      "Passwords do not match"
    );
  }

  // Build the redirect URL with plan parameter if present
  let emailRedirectTo = `${origin}/auth/callback`;
  if (plan) {
    emailRedirectTo += `?redirect_to=/checkout?plan=${encodeURIComponent(plan)}`;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  console.log("signUpAction - Supabase response:", {
    data,
    error,
    user: data?.user,
    session: data?.session
  });

  if (error) {
    console.error("signUpAction - Error:", error.code, error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // Check if user already exists (Supabase returns success but with identities: [])
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    console.log("signUpAction - User already exists, identities empty");
    return encodedRedirect(
      "error",
      "/sign-up",
      "An account with this email already exists. Please sign in or reset your password."
    );
  }

  return redirect("/sign-up/check-your-email");
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/my-content");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
