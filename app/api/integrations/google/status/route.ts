import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        connected: false,
      },
      {
        status: 401,
      },
    );
  }

  const { isGoogleDriveConnected } = await import(
    "@/lib/repositories/integrationRepository"
  );
  const connected = await isGoogleDriveConnected(user.id);

  return NextResponse.json({
    connected,
  });
}
