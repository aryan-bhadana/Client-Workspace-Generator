import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createGoogleOAuthUrl } from "@/services/googleDrive/googleDriveService";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(createGoogleOAuthUrl());
}
