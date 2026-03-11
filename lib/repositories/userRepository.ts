import { db, type User } from "@/lib/db";

export interface UpsertUserInput {
  id: string;
  email: string;
}

export interface UpdateStripeCustomerInput {
  userId: string;
  stripeCustomerId: string;
}

export interface UpdateSubscriptionInput {
  userId: string;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
}

export async function upsertUser(input: UpsertUserInput): Promise<User> {
  return db.user.upsert({
    where: {
      id: input.id,
    },
    update: {
      email: input.email,
    },
    create: {
      id: input.id,
      email: input.email,
    },
  });
}

export async function getUserById(userId: string): Promise<User | null> {
  return db.user.findUnique({
    where: {
      id: userId,
    },
  });
}

export async function getUserByStripeCustomerId(
  stripeCustomerId: string,
): Promise<User | null> {
  return db.user.findUnique({
    where: {
      stripeCustomerId,
    },
  });
}

export async function updateStripeCustomerId(
  input: UpdateStripeCustomerInput,
): Promise<User> {
  return db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      stripeCustomerId: input.stripeCustomerId,
    },
  });
}

export async function updateSubscriptionState(
  input: UpdateSubscriptionInput,
): Promise<User> {
  return db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      subscriptionStatus: input.subscriptionStatus,
      subscriptionPlan: input.subscriptionPlan,
    },
  });
}
