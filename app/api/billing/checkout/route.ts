import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";

const requestSchema = z.object({
  priceId: z.string().min(1, "Price id is required."),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
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
        message: parsed.error.issues[0]?.message ?? "Invalid checkout payload.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const { createCheckoutSession } = await import(
      "@/services/stripe/stripeService"
    );
    const session = await createCheckoutSession(user.id, parsed.data.priceId);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Stripe checkout session.",
      },
      {
        status: 500,
      },
    );
  }
}
