import { BillingPlans } from "@/components/billing/billing-plans";
import { getCurrentUser } from "@/lib/auth";
import { getBillingOverview } from "@/services/stripe/stripeService";

interface BillingPageProps {
  searchParams?: Promise<{
    checkout?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();
  const overview = user
    ? await getBillingOverview(user.id)
    : {
        subscriptionStatus: null,
        subscriptionPlan: null,
        plan: null,
        plans: [],
      };
  const params = await searchParams;

  let statusMessage: string | null = null;

  if (params?.checkout === "success") {
    statusMessage = "Stripe checkout completed. Subscription status will update shortly.";
  } else if (params?.checkout === "cancelled") {
    statusMessage = "Stripe checkout was cancelled.";
  }

  return (
    <BillingPlans
      currentPlan={overview.plan?.key ?? null}
      plans={overview.plans}
      statusMessage={statusMessage}
      subscriptionStatus={overview.subscriptionStatus}
    />
  );
}
