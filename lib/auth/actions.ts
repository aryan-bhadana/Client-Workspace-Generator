"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ensureUserExists } from "@/lib/db/users";
import { getPublicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

const publicEnv = getPublicEnv();

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long."),
});

function parseAuthForm(formData: FormData) {
  return authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function getRedirectPath(formData: FormData) {
  const next = formData.get("next");

  if (typeof next === "string" && next.startsWith("/")) {
    return next;
  }

  return "/dashboard";
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const redirectPath = getRedirectPath(formData);
  const parsed = parseAuthForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to sign in.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error, data } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user) {
    await ensureUserExists(data.user);
  }

  redirect(redirectPath);
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const redirectPath = getRedirectPath(formData);
  const parsed = parseAuthForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create account.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error, data } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return {
      error: error.message,
    };
  }

  if (!data.session) {
    return {
      error: null,
      message:
        "Account created. Check your email to confirm your address before signing in.",
    };
  }

  if (data.user) {
    await ensureUserExists(data.user);
  }

  redirect(redirectPath);
}

export async function signInWithGoogleAction(formData: FormData) {
  const redirectPath = getRedirectPath(formData);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}
