import Stripe from "stripe";

import { billingPlans, getPlanByKey, getPlanByPriceId } from "@/lib/billing/plans";
import { getStripeEnv } from "@/lib/env";
import {
  getBillingUser,
  getBillingUserByStripeCustomerId,
  getMonthlyWorkspaceUsage,
  saveStripeCustomerId,
  saveSubscriptionState,
} from "@/lib/repositories/billingRepository";

export interface BillingAccessResult {
  allowed: boolean;
  message?: string;
}

const stripeEnv = getStripeEnv();
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export const stripe = new Stripe(stripeEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function createCustomer(email: string) {
  return stripe.customers.create({
    email,
  });
}

async function resolveUserIdForCheckoutSession(
  session: Stripe.Checkout.Session,
  customerId: string,
) {
  const sessionUserId =
    session.metadata?.userId ??
    (typeof session.client_reference_id === "string"
      ? session.client_reference_id
      : null);

  if (sessionUserId) {
    return sessionUserId;
  }

  const user = await getBillingUserByStripeCustomerId(customerId);
  return user?.id ?? null;
}

async function getOrCreateStripeCustomer(userId: string) {
  const user = await getBillingUser(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.stripeCustomerId) {
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === "resource_missing"
      ) {
        const customer = await createCustomer(user.email);
        await saveStripeCustomerId(userId, customer.id);

        return customer.id;
      }

      throw error;
    }
  }

  const customer = await createCustomer(user.email);
  await saveStripeCustomerId(userId, customer.id);

  return customer.id;
}

export async function createCheckoutSession(userId: string, priceId: string) {
  const user = await getBillingUser(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const plan = getPlanByPriceId(priceId);

  if (!plan) {
    throw new Error("Unsupported Stripe price id.");
  }

  const customerId = await getOrCreateStripeCustomer(userId);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${stripeEnv.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
    cancel_url: `${stripeEnv.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
    metadata: {
      userId,
      planKey: plan.key,
    },
  });
}

export async function syncCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const userId = customerId
    ? await resolveUserIdForCheckoutSession(session, customerId)
    : null;
  const planKey = session.metadata?.planKey ?? null;

  if (!customerId || !userId) {
    console.warn("[stripe] checkout.session.completed missing customer or user", {
      eventType: "checkout.session.completed",
      sessionId: session.id,
      customerId,
      clientReferenceId: session.client_reference_id,
      metadataUserId: session.metadata?.userId ?? null,
      planKey,
    });
    return;
  }

  console.info("[stripe] syncing checkout completion", {
    eventType: "checkout.session.completed",
    sessionId: session.id,
    customerId,
    userId,
    planKey,
  });

  await saveStripeCustomerId(userId, customerId);
  await saveSubscriptionState(
    userId,
    "active",
    planKey,
  );
}

export async function syncInvoicePaid(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    console.warn("[stripe] invoice.payment_succeeded missing customer", {
      eventType: "invoice.payment_succeeded",
      invoiceId: invoice.id,
    });
    return;
  }

  const user = await getBillingUserByStripeCustomerId(customerId);

  if (!user) {
    console.warn("[stripe] invoice.payment_succeeded customer not mapped", {
      eventType: "invoice.payment_succeeded",
      invoiceId: invoice.id,
      customerId,
    });
    return;
  }

  const priceId = invoice.lines.data[0]?.pricing?.price_details?.price ?? null;
  const plan = getPlanByPriceId(priceId ?? "");

  await saveSubscriptionState(user.id, "active", plan?.key ?? user.subscriptionPlan);
}

export async function syncSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await getBillingUserByStripeCustomerId(customerId);

  if (!user) {
    console.warn("[stripe] customer.subscription.deleted customer not mapped", {
      eventType: "customer.subscription.deleted",
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  await saveSubscriptionState(user.id, "canceled", null);
}

export async function syncSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await getBillingUserByStripeCustomerId(customerId);

  if (!user) {
    console.warn("[stripe] customer.subscription.updated customer not mapped", {
      eventType: "customer.subscription.updated",
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan = getPlanByPriceId(priceId ?? "");

  await saveSubscriptionState(
    user.id,
    subscription.status,
    plan?.key ?? user.subscriptionPlan,
  );
}

export async function getBillingOverview(userId: string) {
  const user = await getBillingUser(userId);
  const plan = getPlanByKey(user?.subscriptionPlan);

  return {
    subscriptionStatus: user?.subscriptionStatus ?? null,
    subscriptionPlan: user?.subscriptionPlan ?? null,
    plan,
    plans: billingPlans,
  };
}

export async function canCreateWorkspace(
  userId: string,
): Promise<BillingAccessResult> {
  const user = await getBillingUser(userId);

  if (
    !user?.subscriptionPlan ||
    !ACTIVE_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus ?? "")
  ) {
    return {
      allowed: false,
      message: "An active subscription is required to create workspaces.",
    };
  }

  const plan = getPlanByKey(user.subscriptionPlan);

  if (!plan) {
    return {
      allowed: false,
      message: "Subscription plan is not recognized.",
    };
  }

  if (plan.workspaceLimit === null) {
    return {
      allowed: true,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const usage = await getMonthlyWorkspaceUsage(userId, startOfMonth);

  if (usage >= plan.workspaceLimit) {
    return {
      allowed: false,
      message: `The ${plan.name} plan allows ${plan.workspaceLimit} workspaces per month.`,
    };
  }

  return {
    allowed: true,
  };
}
