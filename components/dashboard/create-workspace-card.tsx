"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateWorkspaceCardProps {
  onCreated?: () => void;
}

interface CreateWorkspaceResponse {
  status: "success" | "partial_success" | "failed";
  driveFolderUrl?: string;
  notionPageUrl?: string | null;
  message?: string;
}

export function CreateWorkspaceCard({
  onCreated,
}: CreateWorkspaceCardProps) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [result, setResult] = useState<CreateWorkspaceResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDisabled =
    isPending || clientName.trim().length === 0 || projectName.trim().length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/workspaces/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientName,
            projectName,
          }),
        });

        const data = (await response.json()) as CreateWorkspaceResponse;
        setResult(data);

        if (data.status === "success" || data.status === "partial_success") {
          setClientName("");
          setProjectName("");
          router.refresh();
          onCreated?.();
        }
      } catch {
        setResult({
          status: "failed",
          message: "Unable to reach the workspace creation endpoint.",
        });
      }
    });
  }

  return (
    <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Workspace Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Client Workspace Generator
        </h1>
      </div>

      <form className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="client-name">Client Name</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Acme Studio"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Website Retainer"
          />
        </div>

        <div className="flex items-end">
          <Button className="w-full md:w-auto" disabled={isDisabled} type="submit">
            {isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Creating workspace...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Create Workspace
              </>
            )}
          </Button>
        </div>
      </form>

      {(result?.status === "success" || result?.status === "partial_success") &&
      result.driveFolderUrl ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-emerald-800">
            {result.status === "success"
              ? "Workspace created successfully."
              : result.message ?? "Workspace created with a partial success state."}
          </p>
          <Button asChild variant="secondary">
            <a href={result.driveFolderUrl} target="_blank" rel="noreferrer">
              Open Drive Folder
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      ) : null}

      {result?.status === "failed" ? (
        <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {result.message ?? "Workspace generation failed."}
        </p>
      ) : null}
    </section>
  );
}
