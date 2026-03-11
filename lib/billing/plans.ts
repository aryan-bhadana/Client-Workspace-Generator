import { getStripeEnv } from "@/lib/env";

const stripeEnv = getStripeEnv();

export const billingPlans = [
  {
    key: "starter",
    name: "Starter",
    priceLabel: "$9/month",
    priceId: stripeEnv.STRIPE_STARTER_PRICE_ID,
    workspaceLimit: 5,
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$19/month",
    priceId: stripeEnv.STRIPE_PRO_PRICE_ID,
    workspaceLimit: 50,
  },
  {
    key: "agency",
    name: "Agency",
    priceLabel: "$39/month",
    priceId: stripeEnv.STRIPE_AGENCY_PRICE_ID,
    workspaceLimit: null,
  },
] as const;

export type BillingPlanKey = (typeof billingPlans)[number]["key"];

export function getPlanByPriceId(priceId: string) {
  return billingPlans.find((plan) => plan.priceId === priceId) ?? null;
}

export function getPlanByKey(planKey: string | null | undefined) {
  return billingPlans.find((plan) => plan.key === planKey) ?? null;
}
