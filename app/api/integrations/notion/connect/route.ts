import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { createNotionOAuthUrl } = await import(
    "@/services/notion/notionService"
  );

  return NextResponse.redirect(createNotionOAuthUrl());
}
