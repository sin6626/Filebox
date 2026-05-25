import { invoke } from "@tauri-apps/api/core";

export interface Group {
  id: number;
  name: string;
  is_fixed: boolean;
}

export interface FileMapping {
  id: number;
  group_id: number;
  file_path: string;
  file_name: string;
  added_at: number;
}

export interface AppConfig {
  watch_paths: string[];
  watch_extensions: string[];
  notify_on_new_file: boolean;
  theme: string;
  auto_start: boolean;
}

export const api = {
  getGroups: () => invoke<Group[]>("get_groups"),

  createGroup: (name: string) => invoke<Group>("create_group", { name }),

  renameGroup: (id: number, name: string) =>
    invoke<boolean>("rename_group", { id, newName: name }),

  deleteGroup: (id: number) => invoke<boolean>("delete_group", { id }),

  clearGroup: (id: number) => invoke("clear_group", { id }),

  getFiles: (groupId: number) =>
    invoke<FileMapping[]>("get_files", { groupId }),

  addFile: (groupId: number, filePath: string, fileName: string) => {
    const addedAt = Math.floor(Date.now() / 1000);
    return invoke<FileMapping>("add_file", {
      groupId,
      filePath,
      fileName,
      addedAt,
    });
  },

  removeFile: (id: number) => invoke<boolean>("remove_file", { id }),

  getConfig: () => invoke<AppConfig>("get_config"),

  saveConfig: (config: AppConfig) => invoke("save_config", { cfg: config }),

  openFile: (path: string) => invoke("open_file", { path }),

  openFolder: (path: string) => invoke("open_folder", { path }),
};
