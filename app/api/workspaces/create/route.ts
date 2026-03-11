import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { canCreateWorkspace } from "@/services/stripe/stripeService";
import { generateWorkspace } from "@/services/workspaces/workspace.service";

const requestSchema = z.object({
  clientName: z.string().min(1, "Client name is required."),
  projectName: z.string().min(1, "Project name is required."),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        status: "failed",
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const access = await canCreateWorkspace(user.id);

  if (!access.allowed) {
    return NextResponse.json(
      {
        status: "failed",
        message: access.message,
      },
      {
        status: 403,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "failed",
        message: "Invalid JSON payload.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "failed",
        message:
          parsed.error.issues[0]?.message ?? "Invalid workspace request payload.",
      },
      {
        status: 400,
      },
    );
  }

  const result = await generateWorkspace({
    userId: user.id,
    clientName: parsed.data.clientName,
    projectName: parsed.data.projectName,
  });

  return NextResponse.json(result, {
    status: result.status === "failed" ? 500 : 200,
  });
}
