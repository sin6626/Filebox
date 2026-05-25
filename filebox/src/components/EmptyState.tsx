import { Inbox } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-ink-ghost">
      <Inbox size={48} className="mb-4 opacity-40" />
      <p className="text-[12px] font-display">暂无文件</p>
      <p className="text-[10px] mt-1">点击下方按钮添加文件</p>
    </div>
  );
}
