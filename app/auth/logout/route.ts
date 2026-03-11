import { NextResponse, type NextRequest } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  const supabase = createRouteHandlerSupabaseClient(request, response);

  await supabase.auth.signOut();

  return response;
}
