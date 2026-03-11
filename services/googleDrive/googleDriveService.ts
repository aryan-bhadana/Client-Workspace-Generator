import { OAuth2Client } from "google-auth-library";
import { google, type drive_v3 } from "googleapis";
import type { Prisma } from "@prisma/client";

import { getGoogleEnv } from "@/lib/env";
import {
  getUserIntegrations,
  saveGoogleTokens,
} from "@/lib/repositories/integrationRepository";
import { getUserTemplate } from "@/lib/repositories/templateRepository";
import { extractTemplateFolders } from "@/lib/templates/folder-structure";

export interface GoogleApiError {
  type: "google_api_error";
  message: string;
  status: number;
}

export interface GoogleFolderResult {
  folderId: string;
  folderUrl: string;
}

export type FolderTemplate = string[];
export interface GoogleOAuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

function createOAuthClient() {
  const googleEnv = getGoogleEnv();

  return new OAuth2Client(
    googleEnv.GOOGLE_CLIENT_ID,
    googleEnv.GOOGLE_CLIENT_SECRET,
    googleEnv.GOOGLE_REDIRECT_URI,
  );
}

function normalizeGoogleError(error: unknown): GoogleApiError {
  if (error instanceof Error) {
    const maybeStatus = "status" in error ? error.status : undefined;

    return {
      type: "google_api_error",
      message: error.message || "Google Drive request failed.",
      status: typeof maybeStatus === "number" ? maybeStatus : 500,
    };
  }

  return {
    type: "google_api_error",
    message: "Google Drive request failed.",
    status: 500,
  };
}

function normalizeClientName(clientName: string) {
  const trimmedName = clientName.trim();

  if (!trimmedName) {
    throw {
      type: "google_api_error",
      message: "Client name is required to create a Google Drive folder.",
      status: 400,
    } satisfies GoogleApiError;
  }

  return trimmedName;
}

export function createGoogleOAuthUrl() {
  const oauthClient = createOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
}

export async function exchangeGoogleCodeForTokens(
  code: string,
): Promise<GoogleOAuthTokens> {
  try {
    const oauthClient = createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);

    return {
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
    };
  } catch (error) {
    throw normalizeGoogleError(error);
  }
}

export async function getDriveClient(
  userId: string,
): Promise<drive_v3.Drive> {
  const integration = await getUserIntegrations(userId);

  if (!integration?.googleAccessToken && !integration?.googleRefreshToken) {
    throw {
      type: "google_api_error",
      message: "Google Drive is not connected for this account.",
      status: 400,
    } satisfies GoogleApiError;
  }

  const oauthClient = createOAuthClient();

  oauthClient.setCredentials({
    access_token: integration.googleAccessToken ?? undefined,
    refresh_token: integration.googleRefreshToken ?? undefined,
  });

  oauthClient.on("tokens", async (tokens) => {
    if (!tokens.access_token && !tokens.refresh_token) {
      return;
    }

    void saveGoogleTokens({
      userId,
      googleAccessToken:
        tokens.access_token ?? integration.googleAccessToken ?? null,
      googleRefreshToken:
        tokens.refresh_token ?? integration.googleRefreshToken ?? null,
    }).catch(() => {
      // Token refresh persistence should not break the active Drive request.
    });
  });

  return google.drive({
    version: "v3",
    auth: oauthClient,
  });
}

export async function createClientFolder(
  userId: string,
  clientName: string,
): Promise<GoogleFolderResult> {
  try {
    const drive = await getDriveClient(userId);
    const response = await drive.files.create({
      requestBody: {
        name: normalizeClientName(clientName),
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    const folderId = response.data.id;

    if (!folderId) {
      throw new Error("Google Drive did not return a folder id.");
    }

    return {
      folderId,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
    };
  } catch (error) {
    throw normalizeGoogleError(error);
  }
}

export async function createSubFolders(
  userId: string,
  parentFolderId: string,
  folders: FolderTemplate,
): Promise<string[]> {
  try {
    const drive = await getDriveClient(userId);

    const results = await Promise.all(
      folders.map(async (folderName) => {
        const response = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [parentFolderId],
          },
          fields: "id",
        });

        const folderId = response.data.id;

        if (!folderId) {
          throw new Error(`Google Drive did not return an id for "${folderName}".`);
        }

        return {
          folderId,
        };
      }),
    );

    return results.map((result) => result.folderId);
  } catch (error) {
    throw normalizeGoogleError(error);
  }
}

export async function createTemplateSubFolders(
  userId: string,
  parentFolderId: string,
): Promise<string[]> {
  try {
    const template = await getUserTemplate(userId);

    if (!template) {
      return [];
    }

    const folders = extractTemplateFolders(template.folderStructure as Prisma.JsonValue);

    return createSubFolders(userId, parentFolderId, folders);
  } catch (error) {
    throw normalizeGoogleError(error);
  }
}
