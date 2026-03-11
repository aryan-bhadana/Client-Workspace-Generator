import { NextResponse } from "next/server";

import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
