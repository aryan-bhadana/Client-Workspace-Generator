import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createNotionOAuthUrl } from "@/services/notion/notionService";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(createNotionOAuthUrl());
}
