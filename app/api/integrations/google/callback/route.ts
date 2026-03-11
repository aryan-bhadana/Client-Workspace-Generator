import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { saveGoogleTokens } from "@/lib/repositories/integrationRepository";
import { exchangeGoogleCodeForTokens } from "@/services/googleDrive/googleDriveService";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        type: "google_api_error",
        message: "Missing Google authorization code.",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);

    if (!tokens.accessToken && !tokens.refreshToken) {
      return NextResponse.json(
        {
          type: "google_api_error",
          message: "Google OAuth did not return usable tokens.",
          status: 400,
        },
        {
          status: 400,
        },
      );
    }

    await saveGoogleTokens({
      userId: user.id,
      googleAccessToken: tokens.accessToken,
      googleRefreshToken: tokens.refreshToken,
    });

    return NextResponse.redirect(new URL("/integrations?google=connected", request.url));
  } catch (error) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Google OAuth callback failed.";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json(
      {
        type: "google_api_error",
        message,
        status,
      },
      {
        status,
      },
    );
  }
}
