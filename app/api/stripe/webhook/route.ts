import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeEnv } from "@/lib/env";
import {
  stripe,
  syncCheckoutCompleted,
  syncInvoicePaid,
  syncSubscriptionDeleted,
  syncSubscriptionUpdated,
} from "@/services/stripe/stripeService";

const stripeEnv = getStripeEnv();

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        message: "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeEnv.STRIPE_WEBHOOK_SECRET,
      );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Invalid Stripe webhook.",
      },
      {
        status: 400,
      },
    );
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "invoice.payment_succeeded":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      try {
        console.info("[stripe] webhook received", {
          eventId: event.id,
          eventType: event.type,
        });

        switch (event.type) {
          case "checkout.session.completed":
            await syncCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
            break;
          case "invoice.payment_succeeded":
            await syncInvoicePaid(event.data.object as Stripe.Invoice);
            break;
          case "customer.subscription.updated":
            await syncSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;
          case "customer.subscription.deleted":
            await syncSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("[stripe] webhook processing failed", {
          eventId: event.id,
          eventType: event.type,
          message: error instanceof Error ? error.message : "Unknown webhook error",
        });

        return NextResponse.json(
          {
            message: "Webhook processing failed.",
          },
          {
            status: 500,
          },
        );
      }
      break;
    default:
      console.info("[stripe] webhook ignored", {
        eventId: event.id,
        eventType: event.type,
      });
      break;
  }

  return NextResponse.json({
    received: true,
  });
}
