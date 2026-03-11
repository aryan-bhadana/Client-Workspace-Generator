import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { signInWithGoogleAction, signupAction } from "@/lib/auth/actions";

interface SignupPageProps {
  searchParams?: Promise<{
    next?: string;
  }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const nextPath =
    params?.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <AuthForm
          mode="signup"
          title="Create your account"
          description="Start with email and password now, then connect Google Drive and Notion later."
          submitLabel="Sign Up"
          nextPath={nextPath}
          alternateAction={
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" href="/login">
                Sign In
              </Link>
            </p>
          }
          emailPasswordAction={signupAction}
          googleAction={signInWithGoogleAction}
        />
      </div>
    </main>
  );
}
