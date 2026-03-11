import { GoogleDriveCard } from "@/components/integrations/google-drive-card";
import { NotionCard } from "@/components/integrations/notion-card";
import { getCurrentUser } from "@/lib/auth";
import {
  isGoogleDriveConnected,
  isNotionConnected,
} from "@/lib/repositories/integrationRepository";

interface IntegrationsPageProps {
  searchParams?: Promise<{
    google?: string;
    notion?: string;
  }>;
}

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const googleConnected = user ? await isGoogleDriveConnected(user.id) : false;
  const notionConnected = user ? await isNotionConnected(user.id) : false;
  const googleStatusMessage =
    params?.google === "connected"
      ? "Google Drive connected successfully."
      : null;
  const notionStatusMessage =
    params?.notion === "connected" ? "Notion connected successfully." : null;

  return (
    <div className="space-y-8">
      <GoogleDriveCard
        connected={googleConnected}
        statusMessage={googleStatusMessage}
      />
      <NotionCard
        connected={notionConnected}
        statusMessage={notionStatusMessage}
      />
    </div>
  );
}
