mod config;
mod storage;
mod tray;
mod watcher;

use std::sync::{Arc, Mutex};
use storage::{FileMapping, Group, Storage};
use tauri::{Manager, State};
use watcher::FileWatcher;

pub struct AppState {
    pub storage: Arc<Mutex<Storage>>,
    pub watcher: Mutex<Option<FileWatcher>>,
    pub last_window_size: Mutex<(u32, u32)>,
}

#[tauri::command]
fn get_groups(state: State<AppState>) -> Result<Vec<Group>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_groups().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_group(state: State<AppState>, name: String) -> Result<Group, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.create_group(&name).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_group(state: State<AppState>, id: i32, new_name: String) -> Result<bool, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage
        .rename_group(id, &new_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_group(state: State<AppState>, id: i32) -> Result<bool, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.delete_group(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_group(state: State<AppState>, id: i32) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.clear_group(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_files(state: State<AppState>, group_id: i32) -> Result<Vec<FileMapping>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_mappings(group_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_file(
    state: State<AppState>,
    group_id: i32,
    file_path: String,
    file_name: String,
    added_at: i64,
) -> Result<FileMapping, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage
        .add_mapping(group_id, &file_path, &file_name, added_at)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_file(state: State<AppState>, id: i32) -> Result<bool, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.remove_mapping(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_config() -> Result<config::AppConfig, String> {
    Ok(config::load_config())
}

#[tauri::command]
fn save_config(
    state: State<AppState>,
    cfg: config::AppConfig,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    config::save_config(&cfg)?;

    // Drop old watcher
    if let Ok(mut w) = state.watcher.lock() {
        *w = None;
    }

    // Start new watcher if paths configured
    if !cfg.watch_paths.is_empty() {
        match FileWatcher::new(
            cfg.watch_paths,
            cfg.watch_extensions,
            app_handle,
            state.storage.clone(),
        ) {
            Ok(new_watcher) => {
                if let Ok(mut w) = state.watcher.lock() {
                    *w = Some(new_watcher);
                }
                log::info!("File watcher restarted after config save");
            }
            Err(e) => {
                log::error!("Failed to restart file watcher: {}", e);
            }
        }
    }

    Ok(())
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/c", "start", "", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("filebox")
        .join("filebox.db");

    let storage = Storage::new(db_path).expect("Failed to initialize storage");
    let storage = Arc::new(Mutex::new(storage));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            storage: storage.clone(),
            watcher: Mutex::new(None),
            last_window_size: Mutex::new((360, 600)),
        })
        .setup(move |app| {
            tray::setup_tray(app.handle())?;
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let cfg = config::load_config();
            if !cfg.watch_paths.is_empty() {
                match FileWatcher::new(
                    cfg.watch_paths,
                    cfg.watch_extensions,
                    app.handle().clone(),
                    storage.clone(),
                ) {
                    Ok(watcher) => {
                        let state = app.state::<AppState>();
                        if let Ok(mut w) = state.watcher.lock() {
                            *w = Some(watcher);
                        }
                        log::info!("File watcher started");
                    }
                    Err(e) => {
                        log::error!("Failed to start file watcher: {}", e);
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_groups,
            create_group,
            rename_group,
            delete_group,
            clear_group,
            get_files,
            add_file,
            remove_file,
            get_config,
            save_config,
            open_file,
            open_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
