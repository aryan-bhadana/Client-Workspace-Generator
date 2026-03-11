"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { BillingPlanKey } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";

interface BillingPlan {
  key: BillingPlanKey;
  name: string;
  priceLabel: string;
  priceId: string;
  workspaceLimit: number | null;
}

interface BillingPlansProps {
  plans: readonly BillingPlan[];
  currentPlan: BillingPlanKey | null;
  subscriptionStatus: string | null;
  statusMessage?: string | null;
}

export function BillingPlans({
  plans,
  currentPlan,
  subscriptionStatus,
  statusMessage,
}: BillingPlansProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanKey | null>(null);

  const planDescriptions: Record<BillingPlanKey, string> = {
    starter:
      "For solo freelancers getting started. Includes up to 5 generated workspaces per month.",
    pro:
      "For growing operators who need more headroom. Includes up to 50 generated workspaces per month.",
    agency:
      "For teams managing multiple clients at scale with unlimited workspace generation and the highest support tier.",
  };

  function handleSubscribe(priceId: string, planKey: BillingPlanKey) {
    setError(null);
    setSelectedPlan(planKey);

    startTransition(async () => {
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
          }),
        });

        const data = (await response.json()) as {
          url?: string;
          message?: string;
        };

        if (!response.ok || !data.url) {
          setError(data.message ?? "Unable to start Stripe checkout.");
          return;
        }

        router.push(data.url);
      } catch {
        setError("Unable to start Stripe checkout.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Subscription
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the subscription tier that fits your workspace automation needs.
        </p>
        <p className="mt-4 text-sm text-foreground">
          Current status:{" "}
          <span className="font-medium">
            {subscriptionStatus ?? "No active subscription"}
          </span>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const isLoading = isPending && selectedPlan === plan.key;

          return (
            <section
              key={plan.key}
              className="flex h-full flex-col rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {plan.name}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {plan.priceLabel}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {planDescriptions[plan.key]}
              </p>
              <p className="mt-4 text-sm font-medium text-foreground">
                {plan.workspaceLimit === null
                  ? "Unlimited workspaces per month"
                  : `${plan.workspaceLimit} workspaces per month`}
              </p>

              <div className="mt-auto pt-6">
                <Button
                  className="w-full"
                  disabled={isLoading || isCurrentPlan}
                  onClick={() => handleSubscribe(plan.priceId, plan.key)}
                  type="button"
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {isCurrentPlan ? "Current Plan" : isLoading ? "Redirecting..." : "Subscribe"}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
