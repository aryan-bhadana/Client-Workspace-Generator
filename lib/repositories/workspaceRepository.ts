import { db, type Prisma, type Workspace } from "@/lib/db";

export interface CreateWorkspaceInput {
  userId: string;
  clientName: string;
  projectName: string;
  driveFolderUrl?: string | null;
  notionPageUrl?: string | null;
  status: string;
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<Workspace> {
  return db.workspace.create({
    data: input,
  });
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  return db.workspace.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function countUserWorkspacesForMonth(
  userId: string,
  startDate: Date,
): Promise<number> {
  return db.workspace.count({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
  });
}

export type WorkspaceRecord = Workspace;
export type WorkspaceCreateData = Prisma.WorkspaceUncheckedCreateInput;
