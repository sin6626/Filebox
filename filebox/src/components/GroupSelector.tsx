import { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import type { Group } from "../lib/tauri";

interface GroupSelectorProps {
  groups: Group[];
  selectedId: number | null;
  fileCount: number;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export function GroupSelector({
  groups,
  selectedId,
  fileCount,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: GroupSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    groupId: number;
    x: number;
    y: number;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.7;
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".group-selector-container")) {
        setContextMenu(null);
      }
      if (isCreating && !target.closest(".create-input-capsule") && !target.closest(".btn-add-group")) {
        setIsCreating(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCreating]);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (renamingId !== null && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renamingId]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onCreate(trimmed);
      setNewName("");
      setIsCreating(false);
    }
  };

  const handleRename = (id: number) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      onRename(id, trimmed);
      setRenamingId(null);
      setRenameValue("");
    } else {
      setRenamingId(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, group: Group) => {
    if (group.is_fixed) return;
    e.preventDefault();
    setContextMenu({ groupId: group.id, x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="group-selector-container relative w-full px-4 pt-3 pb-2 border-b border-paper-deep/30 flex items-center"
    >
      {/* 横向滑动胶囊容器 */}
      <div
        ref={scrollRef}
        className="flex-1 flex gap-2 overflow-x-auto scrollbar-hidden items-center py-1 select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent, white 12px, white calc(100% - 12px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, white 12px, white calc(100% - 12px), transparent)",
        }}
      >
        {groups.map((group) => {
          const isSelected = group.id === selectedId;
          const isRenaming = renamingId === group.id;

          return (
            <div
              key={group.id}
              className="relative flex-shrink-0 cursor-pointer"
              onContextMenu={(e) => handleContextMenu(e, group)}
              onClick={() => {
                if (!isRenaming) {
                  onSelect(group.id);
                }
              }}
            >
              {/* 胶囊卡片内容 */}
              <div
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                  isSelected
                    ? "bg-bamboo-mist/70 text-bamboo border border-bamboo/20"
                    : "bg-paper-warm/60 text-ink-faint border border-paper-deep/30 hover:bg-paper-warm hover:text-ink-soft"
                }`}
              >
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(group.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-xs font-bold outline-none w-16"
                    style={{ color: "var(--color-ink)" }}
                  />
                ) : (
                  <span className="truncate max-w-[90px]">{group.name}</span>
                )}

                {isSelected && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-bamboo/10 text-bamboo">
                    {fileCount}
                  </span>
                )}

                {!group.is_fixed && !isSelected && (
                  <span className="opacity-0 group-hover:opacity-50 transition-opacity">
                    <MoreHorizontal size={10} />
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* 新增输入胶囊或虚线加号胶囊 */}
        {isCreating ? (
          <div className="create-input-capsule flex-shrink-0">
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-bamboo-mist/40 border border-bamboo/30">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewName("");
                  }
                }}
                placeholder="新分组..."
                className="bg-transparent text-xs font-bold outline-none w-16"
                style={{ color: "var(--color-ink)" }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-add-group flex-shrink-0 px-3 py-1.5 rounded-lg border-dashed border border-paper-deep/40 flex items-center justify-center cursor-pointer text-ink-ghost hover:text-bamboo hover:border-bamboo/30 hover:bg-bamboo-mist/30 transition-all duration-200"
            title="新建分组"
          >
            <Plus size={12} className="opacity-70" />
          </button>
        )}
      </div>

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onMouseDown={(e) => {
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed rounded-xl shadow-xl overflow-hidden z-[100] animate-menu-enter"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 120),
              top: Math.min(contextMenu.y, window.innerHeight - 80),
              background: "var(--color-cloud)",
              border: "1px solid var(--color-paper-deep)",
            }}
          >
            <div className="p-1 flex flex-col gap-0.5 min-w-[90px]">
              <button
                onClick={() => {
                  const group = groups.find((g) => g.id === contextMenu.groupId);
                  if (group) {
                    setRenamingId(group.id);
                    setRenameValue(group.name);
                  }
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-[11px] font-bold text-left rounded-lg transition-colors cursor-pointer text-ink-soft hover:bg-paper-warm"
              >
                重命名
              </button>
              <button
                onClick={() => {
                  onDelete(contextMenu.groupId);
                  setContextMenu(null);
                }}
                className="px-3 py-1.5 text-[11px] font-bold text-left rounded-lg transition-colors cursor-pointer text-red-500 hover:bg-danger-bg"
              >
                删除分组
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
