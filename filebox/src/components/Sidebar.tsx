import { useState, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { TitleBar } from "./TitleBar";
import { GroupSelector } from "./GroupSelector";
import { FileList } from "./FileList";
import { AddButton } from "./AddButton";
import { Settings } from "./Settings";
import { CollapsedBar } from "./CollapsedBar";
import { useGroups } from "../hooks/useGroups";
import { useFiles } from "../hooks/useFiles";
import { useTheme } from "../hooks/useTheme";
import { useWindow } from "../hooks/useWindow";
import { useDragDrop } from "../hooks/useDragDrop";
import { api } from "../lib/tauri";

export function Sidebar() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { groups, selectedId, setSelectedId, create, rename, remove } =
    useGroups();
  const { files, addFile, removeFile } = useFiles(selectedId);
  const { state: windowState, phase, resizeSource, expand, collapse, hide, close } = useWindow();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedGroup = groups.find((g) => g.id === selectedId);

  // 处理文件拖放
  const handleDrop = useCallback(
    async (paths: string[]) => {
      if (selectedId === null) return;
      for (const path of paths) {
        const name = path.split("\\").pop() || path;
        await addFile(path, name);
      }
    },
    [selectedId, addFile]
  );

  const { isDraggingOver } = useDragDrop(handleDrop);

  if (windowState === "collapsed") {
    return (
      <div className="w-full h-full p-1">
        <CollapsedBar
          groupName={selectedGroup?.name ?? "FileBox"}
          fileCount={files.length}
          onExpand={expand}
          onClose={close}
          onMinimize={hide}
          phase={phase}
          resizeSource={resizeSource}
        />
      </div>
    );
  }

  const handleOpenFile = async (path: string) => {
    try {
      await api.openFile(path);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      const folder = path.substring(0, path.lastIndexOf("\\"));
      await api.openFolder(folder);
    } catch (e) {
      console.error("Failed to open folder:", e);
    }
  };

  const handleAddFile = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "支持的文件",
            extensions: [
              "docx",
              "doc",
              "pdf",
              "pptx",
              "ppt",
              "xlsx",
              "xls",
              "txt",
              "zip",
              "rar",
              "7z",
              "tar",
              "gz",
              "bz2",
              "xz",
              "zst",
              "tgz",
              "cab",
            ],
          },
        ],
      });
      if (selected) {
        for (const path of Array.isArray(selected) ? selected : [selected]) {
          const name = path.split("\\").pop() || path;
          await addFile(path, name);
        }
      }
    } catch (e) {
      console.error("Failed to open file dialog:", e);
    }
  };

  const animationClass =
    phase === "expanding"
      ? "animate-sidebar-enter"
      : resizeSource === "resize"
        ? "animate-window-enter"
        : "";

  return (
    <div className={`w-full h-screen flex flex-col ${animationClass}`}>
      <div
        className={`noise-bg overflow-hidden flex flex-col flex-1 rounded-2xl border shadow-[0_24px_60px_-8px_rgba(26,26,24,0.15)] transition-colors duration-200 ${
          isDraggingOver
            ? "border-bamboo border-2"
            : "border-paper-deep/30"
        }`}
        style={{ background: "var(--color-cloud)" }}
      >
        <TitleBar
          theme={theme}
          onToggleTheme={toggleTheme}
          onMinimize={hide}
          onCollapse={collapse}
          onClose={close}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <GroupSelector
          groups={groups}
          selectedId={selectedId}
          fileCount={files.length}
          onSelect={setSelectedId}
          onCreate={create}
          onRename={rename}
          onDelete={remove}
        />

        <div className="flex-1 overflow-hidden relative">
          <FileList
            files={files}
            groupId={selectedId}
            onOpen={handleOpenFile}
            onOpenFolder={handleOpenFolder}
            onRemove={removeFile}
          />
          {/* 拖放提示覆盖层 */}
          {isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-bamboo/10 backdrop-blur-sm z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-10 h-10 text-bamboo"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm font-medium text-bamboo">
                  松开添加到当前分组
                </span>
              </div>
            </div>
          )}
        </div>

        <AddButton onClick={handleAddFile} />
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
      />
    </div>
  );
}
