import { useState, useEffect } from "react";
import { X, FolderOpen, Plus, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { api } from "../lib/tauri";
import type { AppConfig } from "../lib/tauri";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getConfig().then(setConfig);
    }
  }, [isOpen]);

  const handleAddPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        const path = selected as string;
        if (config && !config.watch_paths.includes(path)) {
          const updated = {
            ...config,
            watch_paths: [...config.watch_paths, path],
          };
          await api.saveConfig(updated);
          setConfig(updated);
        }
      }
    } catch (e) {
      console.error("Failed to select folder:", e);
    }
  };

  const handleRemovePath = async (pathToRemove: string) => {
    if (config) {
      const updated = {
        ...config,
        watch_paths: config.watch_paths.filter((p) => p !== pathToRemove),
      };
      await api.saveConfig(updated);
      setConfig(updated);
    }
  };

  const handleToggleNotify = async () => {
    if (config) {
      const updated = {
        ...config,
        notify_on_new_file: !config.notify_on_new_file,
      };
      await api.saveConfig(updated);
      setConfig(updated);
    }
  };

  const handleToggleAutoStart = async () => {
    if (config) {
      const updated = {
        ...config,
        auto_start: !config.auto_start,
      };
      await api.saveConfig(updated);
      setConfig(updated);
    }
  };

  if (!config) return null;

  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <div
          className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* 设置面板 */}
        <div className="relative w-[480px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col bg-cloud border border-paper-deep/30 shadow-[0_24px_60px_-8px_rgba(26,26,24,0.2)] animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-11 border-b border-paper-deep/25 bg-paper/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bamboo" />
              <h2 className="text-[13px] font-display font-medium text-ink-soft">
                应用设置
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-ghost hover:text-ink-soft hover:bg-paper-warm transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-5">
            {/* 监听目录 */}
            <section className="space-y-2">
              <label className="block text-[11px] font-body text-ink-faint">
                监听目录
              </label>
              <p className="text-[10px] text-ink-ghost">
                添加微信或QQ的文件接收目录，自动监听新文件
              </p>

              <div className="space-y-2">
                {config.watch_paths.map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-paper-warm/60 border border-paper-deep/30"
                  >
                    <FolderOpen
                      size={14}
                      className="text-ink-ghost flex-shrink-0"
                    />
                    <span
                      className="text-[11px] flex-1 truncate font-mono text-ink-soft"
                      title={path}
                    >
                      {path}
                    </span>
                    <button
                      onClick={() => handleRemovePath(path)}
                      className="p-1 rounded-lg transition-colors cursor-pointer text-ink-ghost hover:text-red-500 hover:bg-danger-bg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {config.watch_paths.length === 0 && (
                  <div className="text-[11px] py-3 text-center text-ink-ghost">
                    未配置监听目录
                  </div>
                )}
              </div>

              <button
                onClick={handleAddPath}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium border border-paper-deep/40 text-ink-faint hover:text-bamboo hover:bg-bamboo-mist/50 hover:border-bamboo/30 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                添加目录
              </button>
            </section>

            {/* 通知设置 */}
            <section className="space-y-2">
              <label className="block text-[11px] font-body text-ink-faint">
                通知设置
              </label>

              <ToggleRow
                label="新文件通知"
                description="监听到新文件时显示通知"
                checked={config.notify_on_new_file}
                onChange={handleToggleNotify}
              />
            </section>

            {/* 启动设置 */}
            <section className="space-y-2">
              <label className="block text-[11px] font-body text-ink-faint">
                启动设置
              </label>

              <ToggleRow
                label="开机自启动"
                description="系统启动时自动运行FileBox"
                checked={config.auto_start}
                onChange={handleToggleAutoStart}
              />
            </section>

            {/* 支持的文件类型 */}
            <section className="space-y-2">
              <label className="block text-[11px] font-body text-ink-faint">
                支持的文件类型
              </label>
              <div className="flex flex-wrap gap-1.5">
                {config.watch_extensions.map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border bg-paper-warm/60 border-paper-deep/30 text-ink-faint"
                  >
                    {ext.toUpperCase()}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between p-2.5 rounded-lg bg-paper-warm/45 border border-paper-deep/25 cursor-pointer">
      <div>
        <div className="text-[12px] text-ink-soft">{label}</div>
        <div className="text-[10px] text-ink-ghost mt-0.5">{description}</div>
      </div>
      <div
        className={`relative w-9 h-[20px] rounded-full transition-colors duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? "bg-bamboo" : "bg-paper-deep/50"
        }`}
        onClick={onChange}
      >
        <div
          className={`absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            checked ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}
