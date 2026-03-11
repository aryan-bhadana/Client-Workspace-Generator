import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { isGoogleDriveConnected } from "@/lib/repositories/integrationRepository";

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

  const connected = await isGoogleDriveConnected(user.id);

  return NextResponse.json({
    connected,
  });
}
