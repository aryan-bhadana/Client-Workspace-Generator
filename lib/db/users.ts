import type { User as SupabaseUser } from "@supabase/supabase-js";

import { upsertUser } from "@/lib/repositories/userRepository";

export async function ensureUserExists(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email;

  if (!email) {
    throw new Error("Authenticated Supabase user is missing an email address.");
  }

  return upsertUser({
    id: supabaseUser.id,
    email,
  });
}
