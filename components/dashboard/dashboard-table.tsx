import Link from "next/link";

import type { Workspace } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

interface DashboardTableProps {
  workspaces: Workspace[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function DashboardTable({ workspaces }: DashboardTableProps) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Workspaces
          </h2>
          <p className="text-sm text-muted-foreground">
            Google Drive workspaces generated for the current account.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Client
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Drive
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Notion
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {workspaces.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-muted-foreground"
                  colSpan={4}
                >
                  No workspaces generated yet.
                </td>
              </tr>
            ) : null}

            {workspaces.map((workspace) => (
              <tr key={workspace.id}>
                <td className="px-4 py-4 font-medium text-foreground">
                  {workspace.clientName}
                </td>
                <td className="px-4 py-4">
                  {workspace.driveFolderUrl ? (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={workspace.driveFolderUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Folder
                    </Link>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </td>
                <td className="px-4 py-4">
                  {workspace.notionPageUrl ? (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={workspace.notionPageUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Notion Page
                    </Link>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDate(workspace.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
