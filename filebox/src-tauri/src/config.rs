use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub watch_paths: Vec<String>,
    pub watch_extensions: Vec<String>,
    pub notify_on_new_file: bool,
    pub theme: String,
    pub auto_start: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            watch_paths: Vec::new(),
            watch_extensions: vec![
                ".docx".to_string(),
                ".doc".to_string(),
                ".pdf".to_string(),
                ".pptx".to_string(),
                ".ppt".to_string(),
                ".xlsx".to_string(),
                ".xls".to_string(),
                ".txt".to_string(),
                ".zip".to_string(),
                ".rar".to_string(),
                ".7z".to_string(),
                ".tar".to_string(),
                ".gz".to_string(),
                ".bz2".to_string(),
                ".xz".to_string(),
                ".zst".to_string(),
                ".tgz".to_string(),
                ".cab".to_string(),
            ],
            notify_on_new_file: true,
            theme: "dark".to_string(),
            auto_start: false,
        }
    }
}

pub fn config_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("filebox")
        .join("config.json")
}

pub fn load_config() -> AppConfig {
    let path = config_path();
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        let config = AppConfig::default();
        save_config(&config).ok();
        config
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = config_path();
    std::fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}
