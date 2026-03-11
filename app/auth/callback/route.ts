import { NextResponse, type NextRequest } from "next/server";

import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createRouteHandlerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { ensureUserExists } = await import("@/lib/db/users");
      await ensureUserExists(data.user);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
