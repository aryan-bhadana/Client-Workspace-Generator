import { EmptyState } from "@/components/shared/empty-state";

export default function SettingsPage() {
  return (
    <EmptyState
      eyebrow="Settings"
      title="Workspace configuration starts here"
      description="Add organization preferences, team defaults, and provisioning rules in this section."
    />
  );
}
