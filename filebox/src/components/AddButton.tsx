import { Plus } from "lucide-react";

interface AddButtonProps {
  onClick: () => void;
}

export function AddButton({ onClick }: AddButtonProps) {
  return (
    <div className="px-4 pb-4 pt-2">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-display font-medium tracking-wide border border-paper-deep/40 text-ink-faint hover:text-bamboo hover:bg-bamboo-mist/50 hover:border-bamboo/30 transition-all cursor-pointer group"
      >
        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
        <span>添加文件</span>
      </button>
    </div>
  );
}
