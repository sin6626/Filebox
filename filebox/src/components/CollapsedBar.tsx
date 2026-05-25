import { useRef, useCallback } from "react";
import { ChevronUp } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { TransitionPhase, ResizeSource } from "../hooks/useWindow";

interface CollapsedBarProps {
  groupName: string;
  fileCount: number;
  onExpand: () => void;
  onClose: () => void;
  onMinimize: () => void;
  phase: TransitionPhase;
  resizeSource: ResizeSource;
}

export function CollapsedBar({
  groupName,
  fileCount,
  onExpand,
  onClose,
  onMinimize,
  phase,
  resizeSource,
}: CollapsedBarProps) {
  const isDragging = useRef(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const animationClass =
    phase === "collapsing"
      ? "animate-collapsed-enter"
      : resizeSource === "resize"
        ? "animate-scale-in"
        : "";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;

      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      isDragging.current = false;

      const handleMouseMove = (moveEvt: MouseEvent) => {
        if (!mouseDownPos.current) return;
        const dx = Math.abs(moveEvt.clientX - mouseDownPos.current.x);
        const dy = Math.abs(moveEvt.clientY - mouseDownPos.current.y);
        if (dx > 3 || dy > 3) {
          isDragging.current = true;
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        if (!isDragging.current && mouseDownPos.current) {
          onExpand();
        }
        mouseDownPos.current = null;
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      getCurrentWindow()
        .startDragging()
        .catch((err) => console.error("Failed to start dragging:", err));
    },
    [onExpand]
  );

  return (
    <div
      className={`w-full h-full flex items-center rounded-2xl border border-paper-deep/30 noise-bg select-none cursor-default overflow-hidden ${animationClass}`}
      style={{ background: "var(--color-cloud)" }}
      onMouseDown={handleMouseDown}
    >
      {/* 左侧标题 */}
      <div className="flex items-center gap-2 min-w-0 pl-4 pr-2">
        <span className="text-[13px] font-display font-medium text-ink-soft truncate">
          {groupName}
        </span>
        {fileCount > 0 && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-bamboo-mist/70 text-bamboo border border-bamboo/15 flex-shrink-0">
            {fileCount}
          </span>
        )}
      </div>

      {/* 右侧按钮组 - 与展开界面顺序一致 */}
      <div className="flex items-center ml-auto flex-shrink-0">
        {/* 展开按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="w-10 h-11 flex items-center justify-center text-ink-ghost hover:text-ink-faint hover:bg-paper-warm transition-all cursor-pointer flex-shrink-0"
          title="展开"
        >
          <ChevronUp size={14} />
        </button>

        <div className="w-px h-4 bg-paper-deep/30 mx-0.5 flex-shrink-0" />

        {/* 交通灯 - 与展开界面一样：红(关闭)在左，黄(最小化)在右 */}
        <div className="traffic-dots flex items-center gap-2 px-3 h-full flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="mac-traffic-button mac-traffic-close"
            title="关闭"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="mac-traffic-button mac-traffic-minimize"
            title="最小化"
          />
        </div>
      </div>
    </div>
  );
}
