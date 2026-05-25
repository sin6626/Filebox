import { FolderOpen, X, FileText, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { getFileIcon } from "../lib/icons";
import { relativeTime } from "../lib/time";
import type { FileMapping } from "../lib/tauri";

interface FileItemProps {
  file: FileMapping;
  onOpen: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileItem({
  file,
  onOpen,
  onOpenFolder,
  onRemove,
}: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const iconInfo = getFileIcon(file.file_name);
  const Icon = iconInfo.icon || FileText;
  const color = iconInfo.color || "#8a8a80";

  const fileExt = file.file_name.substring(file.file_name.lastIndexOf(".") + 1).toUpperCase();

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition-all duration-200 select-none ${
        isHovered
          ? "bg-paper-warm/70 shadow-[0_2px_8px_-1px_rgba(26,26,24,0.06)]"
          : "bg-transparent"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => onOpen(file.file_path)}
    >
      {/* 文件图标 */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
        style={{
          backgroundColor: `${color}12`,
          borderColor: `${color}25`,
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-display font-medium truncate text-ink">
          {file.file_name}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
            style={{
              background: "var(--color-paper-warm)",
              borderColor: "var(--color-paper-deep)",
              color,
            }}
          >
            {fileExt || "FILE"}
          </span>
          <span className="text-[10px] text-ink-ghost">
            {relativeTime(file.added_at)}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      {isHovered && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(file.file_path);
            }}
            className="p-1.5 rounded-lg transition-colors cursor-pointer text-ink-ghost hover:text-bamboo hover:bg-bamboo-mist/50"
            title="打开文件"
          >
            <ArrowUpRight size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(file.file_path);
            }}
            className="p-1.5 rounded-lg transition-colors cursor-pointer text-ink-ghost hover:text-ink-faint hover:bg-paper-warm"
            title="定位目录"
          >
            <FolderOpen size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file.id);
            }}
            className="p-1.5 rounded-lg transition-colors cursor-pointer text-ink-ghost hover:text-red-500 hover:bg-danger-bg"
            title="移除"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
