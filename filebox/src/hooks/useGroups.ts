import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/tauri";
import type { Group } from "../lib/tauri";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (selectedId === null && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string) => {
      const group = await api.createGroup(name);
      await refresh();
      setSelectedId(group.id);
      return group;
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: number, name: string) => {
      await api.renameGroup(id, name);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await api.deleteGroup(id);
      await refresh();
      if (selectedId === id) {
        setSelectedId(groups.length > 0 ? groups[0].id : null);
      }
    },
    [refresh, selectedId, groups]
  );

  const clear = useCallback(async (id: number) => {
    await api.clearGroup(id);
  }, []);

  return { groups, selectedId, setSelectedId, loading, create, rename, remove, clear, refresh };
}
