"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { FolderEditor } from "@/components/templates/folder-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateResponse {
  folders?: string[];
  notionTemplateId?: string;
  message?: string;
}

export function TemplateBuilder() {
  const [folders, setFolders] = useState<string[]>([]);
  const [notionTemplateId, setNotionTemplateId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadTemplate() {
      try {
        const response = await fetch("/api/templates", {
          method: "GET",
        });
        const data = (await response.json()) as TemplateResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setError(data.message ?? "Unable to load template configuration.");
          return;
        }

        setFolders(data.folders ?? []);
        setNotionTemplateId(data.notionTemplateId ?? "");
      } catch {
        if (isMounted) {
          setError("Unable to load template configuration.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTemplate();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folders,
            notionTemplateId: notionTemplateId.trim() || null,
          }),
        });
        const data = (await response.json()) as TemplateResponse;

        if (!response.ok) {
          setError(data.message ?? "Unable to save template.");
          return;
        }

        setFolders(data.folders ?? []);
        setNotionTemplateId(data.notionTemplateId ?? "");
        setMessage(data.message ?? "Template saved successfully.");
      } catch {
        setError("Unable to save template.");
      }
    });
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-white/60 bg-white/80 p-10 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading template configuration...
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <FolderEditor folders={folders} onChange={setFolders} />

      <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Notion Template
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Notion template page ID
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste a Notion page ID or full page URL. Unsupported template structures
            are rejected before save.
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="notion-template-id">Page ID</Label>
          <Input
            id="notion-template-id"
            value={notionTemplateId}
            onChange={(event) => setNotionTemplateId(event.target.value)}
            placeholder="31fd4358b35580f19eabe74cbb886279"
          />
        </div>
      </section>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={isPending} onClick={handleSave} type="button">
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Template"
          )}
        </Button>
      </div>
    </div>
  );
}
