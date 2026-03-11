import { db, type Integration } from "@/lib/db";

interface BaseIntegrationInput {
  userId: string;
}

export interface SaveGoogleTokensInput extends BaseIntegrationInput {
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
}

export interface SaveNotionTokenInput extends BaseIntegrationInput {
  notionAccessToken: string;
}

export async function saveGoogleTokens(
  input: SaveGoogleTokensInput,
): Promise<Integration> {
  return db.integration.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      googleAccessToken: input.googleAccessToken ?? null,
      googleRefreshToken: input.googleRefreshToken ?? null,
    },
    create: {
      userId: input.userId,
      googleAccessToken: input.googleAccessToken ?? null,
      googleRefreshToken: input.googleRefreshToken ?? null,
    },
  });
}

export async function saveNotionToken(
  input: SaveNotionTokenInput,
): Promise<Integration> {
  return db.integration.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      notionAccessToken: input.notionAccessToken,
    },
    create: {
      userId: input.userId,
      notionAccessToken: input.notionAccessToken,
    },
  });
}

export async function getUserIntegrations(
  userId: string,
): Promise<Integration | null> {
  return db.integration.findUnique({
    where: {
      userId,
    },
  });
}

export async function isGoogleDriveConnected(userId: string): Promise<boolean> {
  const integration = await db.integration.findUnique({
    where: {
      userId,
    },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
    },
  });

  return Boolean(
    integration?.googleAccessToken || integration?.googleRefreshToken,
  );
}

export async function isNotionConnected(userId: string): Promise<boolean> {
  const integration = await db.integration.findUnique({
    where: {
      userId,
    },
    select: {
      notionAccessToken: true,
    },
  });

  return Boolean(integration?.notionAccessToken);
}

export type IntegrationRecord = Integration;
