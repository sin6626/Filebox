import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  File,
  Folder,
  type LucideIcon,
} from "lucide-react";

interface IconInfo {
  icon: LucideIcon;
  color: string;
}

const extensionMap: Record<string, IconInfo> = {
  ".pdf": { icon: FileText, color: "#E74C3C" },
  ".doc": { icon: FileText, color: "#3498DB" },
  ".docx": { icon: FileText, color: "#3498DB" },
  ".xls": { icon: FileSpreadsheet, color: "#27AE60" },
  ".xlsx": { icon: FileSpreadsheet, color: "#27AE60" },
  ".ppt": { icon: Presentation, color: "#E67E22" },
  ".pptx": { icon: Presentation, color: "#E67E22" },
  ".txt": { icon: FileText, color: "#95A5A6" },
  // 压缩包格式
  ".zip": { icon: Archive, color: "#8E44AD" },
  ".rar": { icon: Archive, color: "#8E44AD" },
  ".7z": { icon: Archive, color: "#8E44AD" },
  ".tar": { icon: Archive, color: "#8E44AD" },
  ".gz": { icon: Archive, color: "#8E44AD" },
  ".bz2": { icon: Archive, color: "#8E44AD" },
  ".xz": { icon: Archive, color: "#8E44AD" },
  ".zst": { icon: Archive, color: "#8E44AD" },
  ".tar.gz": { icon: Archive, color: "#8E44AD" },
  ".tar.bz2": { icon: Archive, color: "#8E44AD" },
  ".tar.xz": { icon: Archive, color: "#8E44AD" },
  ".tgz": { icon: Archive, color: "#8E44AD" },
  ".tbz2": { icon: Archive, color: "#8E44AD" },
  ".cab": { icon: Archive, color: "#8E44AD" },
  ".iso": { icon: Archive, color: "#8E44AD" },
  ".dmg": { icon: Archive, color: "#8E44AD" },
  ".ar": { icon: Archive, color: "#8E44AD" },
  ".cpio": { icon: Archive, color: "#8E44AD" },
};

const defaultIcon: IconInfo = { icon: File, color: "#BDC3C7" };
const folderIcon: IconInfo = { icon: Folder, color: "#F4B940" };

export function getFileIcon(filename: string): IconInfo {
  const lastDot = filename.lastIndexOf(".");
  const lastSlash = Math.max(filename.lastIndexOf("/"), filename.lastIndexOf("\\"));

  // 如果最后一个点在最后一个斜杠之后，说明有扩展名
  if (lastDot > lastSlash && lastDot > 0) {
    const ext = filename.toLowerCase().slice(lastDot);
    return extensionMap[ext] ?? defaultIcon;
  }

  // 没有扩展名，当作文件夹
  return folderIcon;
}
