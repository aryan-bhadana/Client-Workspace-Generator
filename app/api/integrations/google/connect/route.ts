import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { createGoogleOAuthUrl } = await import(
    "@/services/googleDrive/googleDriveService"
  );

  return NextResponse.redirect(createGoogleOAuthUrl());
}
