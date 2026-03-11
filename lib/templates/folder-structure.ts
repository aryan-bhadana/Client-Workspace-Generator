import type { Prisma } from "@prisma/client";

export interface TemplateFolderStructure {
  folders: string[];
}

export interface TemplateConfigPayload {
  folderStructure: TemplateFolderStructure;
  notionTemplateId: string | null;
}

interface FolderTemplateObject {
  folders: string[];
}

function isFolderTemplateObject(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject & FolderTemplateObject {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return false;
  }

  if (!("folders" in value)) {
    return false;
  }

  const folders = value.folders;
  return Array.isArray(folders) && folders.every((item) => typeof item === "string");
}

export function extractTemplateFolders(value: Prisma.JsonValue): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  if (isFolderTemplateObject(value)) {
    return value.folders;
  }

  throw new Error(
    "Template folderStructure must be an array of folder names or an object with a folders array.",
  );
}

export function toTemplateFolderStructure(
  folders: string[],
): TemplateFolderStructure {
  const normalizedFolders = Array.from(
    new Set(
      folders
        .map((folder) => folder.trim())
        .filter((folder) => folder.length > 0),
    ),
  );

  return {
    folders: normalizedFolders,
  };
}
