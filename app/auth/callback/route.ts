import { NextResponse, type NextRequest } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext &&
    requestedNext.startsWith("/") &&
    requestedNext !== "/login" &&
    requestedNext !== "/signup"
      ? requestedNext
      : "/dashboard";
  const response = NextResponse.redirect(new URL(next, request.url), {
    status: 303,
  });

  if (code) {
    const supabase = createRouteHandlerSupabaseClient(request, response);
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { ensureUserExists } = await import("@/lib/db/users");
      await ensureUserExists(data.user);
    }
  }

  return response;
}
