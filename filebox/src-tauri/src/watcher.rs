use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::Path;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

use crate::storage::Storage;

#[derive(Clone, Serialize)]
pub struct NewFilePayload {
    pub path: String,
    pub name: String,
}

pub struct FileWatcher {
    _watcher: RecommendedWatcher,
}

impl FileWatcher {
    pub fn new(
        paths: Vec<String>,
        extensions: Vec<String>,
        app_handle: AppHandle,
        storage: Arc<Mutex<Storage>>,
    ) -> Result<Self, String> {
        let (tx, rx) = mpsc::channel::<notify::Result<Event>>();

        let mut watcher =
            RecommendedWatcher::new(tx, notify::Config::default()).map_err(|e| e.to_string())?;

        for path in &paths {
            if Path::new(path).exists() {
                if let Err(e) = watcher.watch(Path::new(path), RecursiveMode::NonRecursive) {
                    eprintln!("Failed to watch path {}: {:?}", path, e);
                }
            }
        }

        let exts = extensions.clone();
        thread::spawn(move || {
            for res in rx {
                match res {
                    Ok(event) => {
                        if let EventKind::Create(_) = event.kind {
                            for path in event.paths {
                                let ext = path
                                    .extension()
                                    .and_then(|e| e.to_str())
                                    .map(|e| format!(".{}", e))
                                    .unwrap_or_default();
                                if !exts.contains(&ext) {
                                    continue;
                                }

                                let path_str = path.to_string_lossy().to_string();
                                let name = path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("")
                                    .to_string();

                                if name.is_empty() || path_str.is_empty() {
                                    continue;
                                }

                                let added_at = SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs()
                                    as i64;

                                if let Ok(s) = storage.lock() {
                                    if let Ok(recent_group) = s.get_recent_group() {
                                        if let Some(group) = recent_group {
                                            match s
                                                .add_mapping(group.id, &path_str, &name, added_at)
                                            {
                                                Ok(_) => {
                                                    log::info!(
                                                        "Auto-added file: {} ({})",
                                                        name,
                                                        path_str
                                                    );
                                                    if let Err(e) = app_handle.emit(
                                                        "new-file",
                                                        &NewFilePayload {
                                                            path: path_str,
                                                            name,
                                                        },
                                                    ) {
                                                        eprintln!(
                                                            "Failed to emit new-file event: {:?}",
                                                            e
                                                        );
                                                    }
                                                }
                                                Err(e) => {
                                                    eprintln!("Failed to add mapping: {:?}", e);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Watch error: {:?}", e);
                    }
                }
            }
        });

        Ok(FileWatcher { _watcher: watcher })
    }
}
