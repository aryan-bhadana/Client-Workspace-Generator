"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import type { AuthActionState } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {
  error: null,
};

interface AuthFormProps {
  mode: "login" | "signup";
  title: string;
  description: string;
  submitLabel: string;
  nextPath?: string;
  statusMessage?: string | null;
  alternateAction: React.ReactNode;
  emailPasswordAction: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  googleAction: (formData: FormData) => Promise<void>;
}

export function AuthForm({
  mode,
  title,
  description,
  submitLabel,
  nextPath,
  statusMessage,
  alternateAction,
  emailPasswordAction,
  googleAction,
}: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    emailPasswordAction,
    initialState,
  );

  return (
    <section className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-xl backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {mode === "login" ? "Welcome back" : "Create account"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />
        <div className="space-y-2">
          <Label htmlFor={`${mode}-email`}>Email</Label>
          <Input
            id={`${mode}-email`}
            name="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          <Input
            id={`${mode}-password`}
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            {state.message}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {statusMessage}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        Or continue with
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={googleAction}>
        <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />
        <Button className="w-full" type="submit" variant="outline">
          Continue with Google
        </Button>
      </form>

      <div className="mt-6">{alternateAction}</div>
    </section>
  );
}
