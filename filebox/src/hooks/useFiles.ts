import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "../lib/tauri";
import type { FileMapping } from "../lib/tauri";

export function useFiles(groupId: number | null) {
  const [files, setFiles] = useState<FileMapping[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (groupId === null) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getFiles(groupId);
      setFiles(data);
    } catch (e) {
      console.error("Failed to load files:", e);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unlisten = listen("new-file", () => {
      refresh();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  const addFile = useCallback(
    async (path: string, name: string) => {
      if (groupId === null) return;
      await api.addFile(groupId, path, name);
      await refresh();
    },
    [groupId, refresh]
  );

  const removeFile = useCallback(
    async (id: number) => {
      await api.removeFile(id);
      await refresh();
    },
    [refresh]
  );

  return { files, loading, addFile, removeFile, refresh };
}
