"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FolderEditorProps {
  folders: string[];
  onChange: (folders: string[]) => void;
}

export function FolderEditor({ folders, onChange }: FolderEditorProps) {
  function handleFolderChange(index: number, value: string) {
    const nextFolders = [...folders];
    nextFolders[index] = value;
    onChange(nextFolders);
  }

  function handleAddFolder() {
    onChange([...folders, ""]);
  }

  function handleRemoveFolder(index: number) {
    onChange(folders.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <section className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Folder Structure
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Google Drive folders
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure the subfolders created inside each client workspace folder.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {folders.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No folders configured yet. Add your first folder below.
          </p>
        ) : null}

        {folders.map((folder, index) => (
          <div
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            key={`folder-${index}`}
          >
            <div className="space-y-2">
              <Label htmlFor={`folder-${index}`}>Folder {index + 1}</Label>
              <Input
                id={`folder-${index}`}
                value={folder}
                onChange={(event) =>
                  handleFolderChange(index, event.target.value)
                }
                placeholder="Assets"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemoveFolder(index)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button type="button" variant="secondary" onClick={handleAddFolder}>
          Add Folder
        </Button>
      </div>
    </section>
  );
}
