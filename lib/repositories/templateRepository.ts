import { db, type Prisma, type Template } from "@/lib/db";
import {
  extractTemplateFolders,
  type TemplateConfigPayload,
  type TemplateFolderStructure,
  toTemplateFolderStructure,
} from "@/lib/templates/folder-structure";

export interface SaveTemplateInput {
  userId: string;
  folderStructure: TemplateFolderStructure;
  notionTemplateId?: string | null;
}

export async function getUserTemplate(userId: string): Promise<Template | null> {
  return db.template.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function saveTemplate(
  input: SaveTemplateInput,
): Promise<Template> {
  const existingTemplate = await getUserTemplate(input.userId);

  if (!existingTemplate) {
    return db.template.create({
      data: {
        userId: input.userId,
        folderStructure: input.folderStructure as unknown as Prisma.InputJsonValue,
        notionTemplateId: input.notionTemplateId ?? null,
      },
    });
  }

  return db.template.update({
    where: {
      id: existingTemplate.id,
    },
    data: {
      folderStructure:
        input.folderStructure as unknown as Prisma.InputJsonValue,
      notionTemplateId: input.notionTemplateId ?? null,
    },
  });
}

export function mapTemplateToConfig(
  template: Template | null,
): TemplateConfigPayload {
  if (!template) {
    return {
      folderStructure: {
        folders: [],
      },
      notionTemplateId: null,
    };
  }

  return {
    folderStructure: toTemplateFolderStructure(
      extractTemplateFolders(template.folderStructure),
    ),
    notionTemplateId: template.notionTemplateId,
  };
}

export type TemplateRecord = Template;
