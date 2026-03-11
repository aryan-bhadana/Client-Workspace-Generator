import { z } from "zod";

import {
  createWorkspace,
  getUserWorkspaces,
} from "@/lib/repositories/workspaceRepository";
import { getUserTemplate } from "@/lib/repositories/templateRepository";
import {
  createClientFolder,
  createSubFolders,
  type GoogleApiError,
} from "@/services/googleDrive/googleDriveService";
import { extractTemplateFolders } from "@/lib/templates/folder-structure";
import {
  duplicateTemplatePage,
  type NotionApiError,
} from "@/services/notion/notionService";

const generateWorkspaceSchema = z.object({
  userId: z.string().min(1),
  clientName: z.string().min(1, "Client name is required."),
  projectName: z.string().min(1, "Project name is required."),
});

export interface GenerateWorkspaceInput {
  userId: string;
  clientName: string;
  projectName: string;
}

export interface GenerateWorkspaceSuccess {
  status: "success";
  driveFolderUrl: string;
  notionPageUrl: string | null;
}

export interface GenerateWorkspaceFailure {
  status: "failed";
  message: string;
}

export interface GenerateWorkspacePartialSuccess {
  status: "partial_success";
  driveFolderUrl: string;
  notionPageUrl: null;
  message: string;
}

export type GenerateWorkspaceResult =
  | GenerateWorkspaceSuccess
  | GenerateWorkspacePartialSuccess
  | GenerateWorkspaceFailure;

function normalizeWorkspaceError(error: unknown): GenerateWorkspaceFailure {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "google_api_error"
  ) {
    const googleError = error as GoogleApiError;

    return {
      status: "failed",
      message: googleError.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: "failed",
      message: error.message,
    };
  }

  return {
    status: "failed",
    message: "Google Drive folder creation failed",
  };
}

function normalizeNotionError(error: unknown): GenerateWorkspacePartialSuccess {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "notion_api_error"
  ) {
    const notionError = error as NotionApiError;

    return {
      status: "partial_success",
      driveFolderUrl: "",
      notionPageUrl: null,
      message: notionError.message,
    };
  }

  if (error instanceof Error) {
    return {
      status: "partial_success",
      driveFolderUrl: "",
      notionPageUrl: null,
      message: error.message,
    };
  }

  return {
    status: "partial_success",
    driveFolderUrl: "",
    notionPageUrl: null,
    message: "Notion template duplication failed.",
  };
}

export async function listWorkspaces(userId: string) {
  return getUserWorkspaces(userId);
}

export async function generateWorkspace(
  input: GenerateWorkspaceInput,
): Promise<GenerateWorkspaceResult> {
  const parsed = generateWorkspaceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "failed",
      message:
        parsed.error.issues[0]?.message ?? "Invalid workspace generation input.",
    };
  }

  const { userId, clientName, projectName } = parsed.data;
  let driveFolderUrl: string | null = null;
  let notionPageUrl: string | null = null;

  try {
    const clientFolder = await createClientFolder(userId, clientName);
    driveFolderUrl = clientFolder.folderUrl;
    const template = await getUserTemplate(userId);

    if (template) {
      const folders = extractTemplateFolders(template.folderStructure);
      await createSubFolders(userId, clientFolder.folderId, folders);
    }

    if (template?.notionTemplateId) {
      try {
        const notionPage = await duplicateTemplatePage(
          userId,
          template.notionTemplateId,
          clientName,
        );
        notionPageUrl = notionPage.pageUrl;
      } catch (error) {
        const partialResult = normalizeNotionError(error);

        await createWorkspace({
          userId,
          clientName,
          projectName,
          driveFolderUrl,
          notionPageUrl: null,
          status: "partial_success",
        });

        return {
          ...partialResult,
          driveFolderUrl,
        };
      }
    }

    await createWorkspace({
      userId,
      clientName,
      projectName,
      driveFolderUrl,
      notionPageUrl,
      status: "success",
    });

    return {
      status: "success",
      driveFolderUrl,
      notionPageUrl,
    };
  } catch (error) {
    const failure = normalizeWorkspaceError(error);

    await createWorkspace({
      userId,
      clientName,
      projectName,
      driveFolderUrl,
      notionPageUrl: null,
      status: "failed",
    });

    return failure;
  }
}
