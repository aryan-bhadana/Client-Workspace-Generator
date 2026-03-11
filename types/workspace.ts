export interface WorkspaceListItem {
  id: string;
  userId: string;
  clientName: string;
  projectName: string;
  driveFolderUrl: string | null;
  notionPageUrl: string | null;
  status: string;
  createdAt: Date;
}
