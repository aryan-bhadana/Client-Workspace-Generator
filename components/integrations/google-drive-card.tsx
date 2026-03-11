import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GoogleDriveCardProps {
  connected: boolean;
  statusMessage?: string | null;
}

export function GoogleDriveCard({
  connected,
  statusMessage,
}: GoogleDriveCardProps) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Integration
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Google Drive
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Connect a Google account so the backend can create client folders and
            subfolders in Drive during workspace provisioning.
          </p>

          {connected ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              Connected
            </div>
          ) : null}

          {statusMessage ? (
            <p className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              {statusMessage}
            </p>
          ) : null}
        </div>

        <Button asChild className="w-full md:w-auto">
          <Link href="/api/integrations/google/connect">
            {connected ? "Reconnect Google Drive" : "Connect Google Drive"}
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
