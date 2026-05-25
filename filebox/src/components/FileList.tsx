import { FileItem } from "./FileItem";
import { EmptyState } from "./EmptyState";
import type { FileMapping } from "../lib/tauri";

interface FileListProps {
  files: FileMapping[];
  groupId: number | null;
  onOpen: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileList({
  files,
  onOpen,
  onOpenFolder,
  onRemove,
}: FileListProps) {
  return (
    <div className="h-full overflow-y-auto px-3 py-2 scroll-smooth">
      {files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-1.5 pb-4">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onOpen={onOpen}
              onOpenFolder={onOpenFolder}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
