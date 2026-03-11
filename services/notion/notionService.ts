import { Buffer } from "node:buffer";

import { Client } from "@notionhq/client";
import type {
  AppendBlockChildrenParameters,
  BlockObjectResponse,
  CreatePageParameters,
  PageObjectResponse,
  PartialBlockObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { z } from "zod";

import { getNotionEnv } from "@/lib/env";
import { getUserIntegrations } from "@/lib/repositories/integrationRepository";

export interface NotionApiError {
  type: "notion_api_error";
  message: string;
  status: number;
}

export interface NotionPageResult {
  pageId: string;
  pageUrl: string;
}

interface NotionOAuthTokenResponse {
  access_token?: string;
}

const notionEnv = getNotionEnv();
const unsupportedBlockTypes = new Set([
  "breadcrumb",
  "child_database",
  "child_page",
  "column_list",
  "link_preview",
  "synced_block",
  "table",
  "unsupported",
]);
const notionPageIdSchema = z
  .string()
  .trim()
  .min(1, "Notion template page ID is required.");

function normalizeNotionError(error: unknown): NotionApiError {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "notion_api_error" &&
    "message" in error &&
    typeof error.message === "string" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error as NotionApiError;
  }

  if (error instanceof Error) {
    const maybeStatus = "status" in error ? error.status : undefined;

    return {
      type: "notion_api_error",
      message: error.message || "Notion request failed.",
      status: typeof maybeStatus === "number" ? maybeStatus : 500,
    };
  }

  return {
    type: "notion_api_error",
    message: "Notion request failed.",
    status: 500,
  };
}

function buildBasicAuthToken() {
  return Buffer.from(
    `${notionEnv.NOTION_CLIENT_ID}:${notionEnv.NOTION_CLIENT_SECRET}`,
  ).toString("base64");
}

export function normalizeNotionPageId(input: string) {
  const rawValue = notionPageIdSchema.parse(input);
  const urlMatch = rawValue.match(/[0-9a-fA-F]{32}(?=(?:\?|#|$))/);
  const compactId = urlMatch?.[0] ?? rawValue.replace(/-/g, "");

  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) {
    throw {
      type: "notion_api_error",
      message:
        "Enter a valid Notion page ID or paste a Notion page URL containing one.",
      status: 400,
    } satisfies NotionApiError;
  }

  return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20)}`.toLowerCase();
}

function isFullPage(
  page: PageObjectResponse | PartialPageObjectResponse,
): page is PageObjectResponse {
  return "properties" in page && "parent" in page;
}

function isFullBlock(
  block: BlockObjectResponse | PartialBlockObjectResponse,
): block is BlockObjectResponse {
  return "type" in block && "has_children" in block;
}

function getTitlePropertyName(page: PageObjectResponse) {
  const titleProperty = Object.entries(page.properties).find(
    ([, property]) => property.type === "title",
  );

  return titleProperty?.[0] ?? "title";
}

function buildPageParent(page: PageObjectResponse): CreatePageParameters["parent"] {
  switch (page.parent.type) {
    case "page_id":
      return {
        page_id: page.parent.page_id,
      };
    case "database_id":
      return {
        database_id: page.parent.database_id,
      };
    case "block_id":
      return {
        page_id: page.parent.block_id,
      };
    case "workspace":
      throw {
        type: "notion_api_error",
        message:
          "Workspace-level Notion templates are not supported by the current duplication flow.",
        status: 400,
      } satisfies NotionApiError;
    default:
      throw {
        type: "notion_api_error",
        message: "Unsupported Notion parent type for template duplication.",
        status: 400,
      } satisfies NotionApiError;
  }
}

function sanitizeBlockForAppend(
  block: BlockObjectResponse,
  children: AppendBlockChildrenParameters["children"] = [],
): AppendBlockChildrenParameters["children"][number] | null {
  if (unsupportedBlockTypes.has(block.type)) {
    return null;
  }

  const payload = block[block.type as keyof BlockObjectResponse];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const sanitizedPayload = {
    ...payload,
  } as Record<string, unknown>;

  if (children.length > 0) {
    sanitizedPayload.children = children;
  }

  return {
    [block.type]: sanitizedPayload,
    object: "block",
    type: block.type,
  } as AppendBlockChildrenParameters["children"][number];
}

async function collectUnsupportedBlockTypes(
  notion: Client,
  blockId: string,
  collected = new Set<string>(),
): Promise<Set<string>> {
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (!isFullBlock(result)) {
        continue;
      }

      if (unsupportedBlockTypes.has(result.type)) {
        collected.add(result.type);
      }

      if (result.has_children) {
        await collectUnsupportedBlockTypes(notion, result.id, collected);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return collected;
}

async function getBlockChildrenRecursively(
  notion: Client,
  blockId: string,
): Promise<AppendBlockChildrenParameters["children"]> {
  const children: AppendBlockChildrenParameters["children"] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (!isFullBlock(result)) {
        continue;
      }

      const nestedChildren = result.has_children
        ? await getBlockChildrenRecursively(notion, result.id)
        : [];
      const sanitized = sanitizeBlockForAppend(result, nestedChildren);

      if (sanitized) {
        children.push(sanitized);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return children;
}

export function createNotionOAuthUrl() {
  const query = new URLSearchParams({
    owner: "user",
    client_id: notionEnv.NOTION_CLIENT_ID,
    redirect_uri: notionEnv.NOTION_REDIRECT_URI,
    response_type: "code",
  });

  return `https://api.notion.com/v1/oauth/authorize?${query.toString()}`;
}

export async function exchangeNotionCodeForToken(code: string) {
  try {
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildBasicAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: notionEnv.NOTION_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange Notion authorization code.");
    }

    const data = (await response.json()) as NotionOAuthTokenResponse;

    if (!data.access_token) {
      throw new Error("Notion OAuth did not return an access token.");
    }

    return data.access_token;
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export async function getNotionClient(userId: string) {
  const integration = await getUserIntegrations(userId);

  if (!integration?.notionAccessToken) {
    throw {
      type: "notion_api_error",
      message: "Notion is not connected for this account.",
      status: 400,
    } satisfies NotionApiError;
  }

  return new Client({
    auth: integration.notionAccessToken,
  });
}

export async function validateNotionTemplatePage(userId: string, templatePageId: string) {
  try {
    const notion = await getNotionClient(userId);
    const normalizedPageId = normalizeNotionPageId(templatePageId);
    const sourcePage = await notion.pages.retrieve({
      page_id: normalizedPageId,
    });

    if (!isFullPage(sourcePage)) {
      throw new Error("Unable to retrieve the Notion template page.");
    }

    buildPageParent(sourcePage);

    const unsupportedTypes = await collectUnsupportedBlockTypes(
      notion,
      normalizedPageId,
    );

    if (unsupportedTypes.size > 0) {
      throw {
        type: "notion_api_error",
        message: `This Notion template contains unsupported blocks: ${Array.from(
          unsupportedTypes,
        ).sort().join(", ")}.`,
        status: 400,
      } satisfies NotionApiError;
    }

    return {
      pageId: normalizedPageId,
      pageTitle: getTitlePropertyName(sourcePage),
    };
  } catch (error) {
    throw normalizeNotionError(error);
  }
}

export async function duplicateTemplatePage(
  userId: string,
  templatePageId: string,
  clientName: string,
): Promise<NotionPageResult> {
  try {
    const notion = await getNotionClient(userId);
    const normalizedPageId = normalizeNotionPageId(templatePageId);
    const sourcePage = await notion.pages.retrieve({
      page_id: normalizedPageId,
    });

    if (!isFullPage(sourcePage)) {
      throw new Error("Unable to retrieve the Notion template page.");
    }

    const unsupportedTypes = await collectUnsupportedBlockTypes(
      notion,
      normalizedPageId,
    );

    if (unsupportedTypes.size > 0) {
      throw {
        type: "notion_api_error",
        message: `This Notion template contains unsupported blocks: ${Array.from(
          unsupportedTypes,
        ).sort().join(", ")}.`,
        status: 400,
      } satisfies NotionApiError;
    }

    const titlePropertyName = getTitlePropertyName(sourcePage);
    const pageParent = buildPageParent(sourcePage);
    const children = await getBlockChildrenRecursively(notion, normalizedPageId);

    const duplicatedPage = await notion.pages.create({
      parent: pageParent,
      properties: {
        [titlePropertyName]: {
          title: [
            {
              text: {
                content: clientName,
              },
            },
          ],
        },
      },
      children,
    });

    const pageUrl =
      "url" in duplicatedPage && typeof duplicatedPage.url === "string"
        ? duplicatedPage.url
        : `https://www.notion.so/${duplicatedPage.id.replace(/-/g, "")}`;

    return {
      pageId: duplicatedPage.id,
      pageUrl,
    };
  } catch (error) {
    throw normalizeNotionError(error);
  }
}
