import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import {
  getUserTemplate,
  mapTemplateToConfig,
  saveTemplate,
} from "@/lib/repositories/templateRepository";
import { toTemplateFolderStructure } from "@/lib/templates/folder-structure";
import {
  normalizeNotionPageId,
  validateNotionTemplatePage,
} from "@/services/notion/notionService";

const requestSchema = z.object({
  folders: z.array(z.string().min(1)).default([]),
  notionTemplateId: z.string().trim().min(1).nullable(),
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const template = await getUserTemplate(user.id);
  const config = mapTemplateToConfig(template);

  return NextResponse.json({
    folders: config.folderStructure.folders,
    notionTemplateId: config.notionTemplateId ?? "",
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid JSON payload.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message ?? "Invalid template payload.",
      },
      {
        status: 400,
      },
    );
  }

  const folders = parsed.data.folders
    .map((folder) => folder.trim())
    .filter((folder) => folder.length > 0);
  const notionTemplateId = parsed.data.notionTemplateId?.trim() || null;
  const normalizedNotionTemplateId = notionTemplateId
    ? normalizeNotionPageId(notionTemplateId)
    : null;

  if (normalizedNotionTemplateId) {
    try {
      await validateNotionTemplatePage(user.id, normalizedNotionTemplateId);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to validate the Notion template page.";

      return NextResponse.json(
        {
          message,
        },
        {
          status: 400,
        },
      );
    }
  }

  const template = await saveTemplate({
    userId: user.id,
    folderStructure: toTemplateFolderStructure(folders),
    notionTemplateId: normalizedNotionTemplateId,
  });
  const config = mapTemplateToConfig(template);

  return NextResponse.json({
    folders: config.folderStructure.folders,
    notionTemplateId: config.notionTemplateId ?? "",
    message: "Template saved successfully.",
  });
}
