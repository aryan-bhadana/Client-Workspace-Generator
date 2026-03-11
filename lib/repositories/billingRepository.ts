import { countUserWorkspacesForMonth } from "@/lib/repositories/workspaceRepository";
import {
  getUserById,
  getUserByStripeCustomerId,
  updateStripeCustomerId,
  updateSubscriptionState,
} from "@/lib/repositories/userRepository";

export async function getBillingUser(userId: string) {
  return getUserById(userId);
}

export async function getBillingUserByStripeCustomerId(
  stripeCustomerId: string,
) {
  return getUserByStripeCustomerId(stripeCustomerId);
}

export async function saveStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
) {
  return updateStripeCustomerId({
    userId,
    stripeCustomerId,
  });
}

export async function saveSubscriptionState(
  userId: string,
  subscriptionStatus: string | null,
  subscriptionPlan: string | null,
) {
  return updateSubscriptionState({
    userId,
    subscriptionStatus,
    subscriptionPlan,
  });
}

export async function getMonthlyWorkspaceUsage(
  userId: string,
  startDate: Date,
) {
  return countUserWorkspacesForMonth(userId, startDate);
}
