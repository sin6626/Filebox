import { useRef } from "react";
import { Sun, Moon, ChevronsDownUp } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface TitleBarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onMinimize: () => void;
  onCollapse: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function TitleBar({
  theme,
  onToggleTheme,
  onMinimize,
  onCollapse,
  onClose,
  onOpenSettings,
}: TitleBarProps) {
  const dragState = useRef<{
    startX: number;
    startY: number;
    started: boolean;
    cleanup: (() => void) | null;
  }>({ startX: 0, startY: 0, started: false, cleanup: null });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    dragState.current = { startX, startY, started: false, cleanup: null };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (dragState.current.started) return;

      const dx = Math.abs(moveEvt.clientX - startX);
      const dy = Math.abs(moveEvt.clientY - startY);

      if (dx > 2 || dy > 2) {
        dragState.current.started = true;
        getCurrentWindow()
          .startDragging()
          .catch((err) => console.error("Failed to start dragging:", err));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dragState.current.cleanup = null;
    };

    dragState.current.cleanup = handleMouseUp;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleButtonClick = (action: () => void) => (e: React.MouseEvent) => {
    // 如果发生了拖拽，不触发按钮动作
    if (dragState.current.started) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex items-center justify-between pl-5 pr-0 h-11 bg-paper/60 border-b border-paper-deep/30 shrink-0 select-none cursor-default"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[13px] font-display font-medium text-ink-soft tracking-wide">
          FileBox
        </span>
        <span className="text-[11px] text-ink-ghost font-body">—</span>
        <span className="text-[11px] text-ink-faint font-body truncate">
          文件收纳工具
        </span>
      </div>

      <div className="flex items-center flex-shrink-0">
        <button
          onClick={handleButtonClick(onToggleTheme)}
          className="w-10 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer"
          title={theme === "dark" ? "切换到亮色" : "切换到暗色"}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleButtonClick(onOpenSettings)}
          className="w-10 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer"
          title="设置"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button
          onClick={handleButtonClick(onCollapse)}
          className="w-10 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer"
          title="收起"
        >
          <ChevronsDownUp className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-paper-deep/30 mx-0.5" />

        <div className="traffic-dots flex items-center gap-2 px-3 h-full">
          <button
            onClick={handleButtonClick(onClose)}
            className="mac-traffic-button mac-traffic-close"
            title="关闭"
          />
          <button
            onClick={handleButtonClick(onMinimize)}
            className="mac-traffic-button mac-traffic-minimize"
            title="最小化"
          />
        </div>
      </div>
    </div>
  );
}
