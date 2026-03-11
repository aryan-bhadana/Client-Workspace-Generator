import { getCurrentUser } from "@/lib/auth";
import { CreateWorkspaceCard } from "@/components/dashboard/create-workspace-card";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { listWorkspaces } from "@/services/workspaces/workspace.service";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const workspaces = user ? await listWorkspaces(user.id) : [];

  return (
    <div className="space-y-8">
      <CreateWorkspaceCard />
      <DashboardTable workspaces={workspaces} />
    </div>
  );
}
