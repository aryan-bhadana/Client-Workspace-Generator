import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { loginAction, signInWithGoogleAction } from "@/lib/auth/actions";

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params?.next && params.next.startsWith("/") ? params.next : "/dashboard";
  const statusMessage =
    params?.error === "oauth"
      ? "Google sign-in could not be started. Please try again."
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <AuthForm
          mode="login"
          title="Sign in to your workspace"
          description="Access your client operations dashboard and manage workspace provisioning."
          submitLabel="Sign In"
          nextPath={nextPath}
          statusMessage={statusMessage}
          alternateAction={
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="font-medium text-primary hover:underline" href="/signup">
                Sign Up
              </Link>
            </p>
          }
          emailPasswordAction={loginAction}
          googleAction={signInWithGoogleAction}
        />
      </div>
    </main>
  );
}
