import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

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
        type: "notion_api_error",
        message: "Missing Notion authorization code.",
        status: 400,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const [{ saveNotionToken }, { exchangeNotionCodeForToken }] =
      await Promise.all([
        import("@/lib/repositories/integrationRepository"),
        import("@/services/notion/notionService"),
      ]);
    const accessToken = await exchangeNotionCodeForToken(code);

    await saveNotionToken({
      userId: user.id,
      notionAccessToken: accessToken,
    });

    return NextResponse.redirect(new URL("/integrations?notion=connected", request.url));
  } catch (error) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Notion OAuth callback failed.";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    return NextResponse.json(
      {
        type: "notion_api_error",
        message,
        status,
      },
      {
        status,
      },
    );
  }
}
