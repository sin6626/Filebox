# FileBox v2 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 FileBox 从 Python + PyQt5 完全重写为 Tauri 2 + React + TypeScript，实现 macOS 风格高级感 UI 和极致用户体验。

**Architecture:** Tauri 2 桌面应用，Rust 后端处理文件监听/SQLite/配置/托盘，React 前端负责 UI 渲染和交互。前后端通过 Tauri invoke（请求-响应）和 event（推送）通信。

**Tech Stack:** Tauri 2, Rust, React 18, TypeScript, TailwindCSS 4, Framer Motion, Lucide Icons, notify (Rust), rusqlite

---

## 文件结构

```
filebox/                              # 新 Tauri 项目根目录
├── src-tauri/                        # Rust 后端
│   ├── src/
│   │   ├── main.rs                  # Tauri 入口，注册命令
│   │   ├── storage.rs               # SQLite 操作
│   │   ├── watcher.rs               # 文件监听
│   │   ├── config.rs                # 配置读写
│   │   └── tray.rs                  # 系统托盘
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                              # React 前端
│   ├── components/
│   │   ├── Sidebar.tsx              # 侧边栏主组件
│   │   ├── TitleBar.tsx             # 标题栏
│   │   ├── GroupSelector.tsx        # 分组选择器
│   │   ├── FileList.tsx             # 文件列表
│   │   ├── FileItem.tsx             # 单个文件项
│   │   ├── AddButton.tsx            # 添加按钮
│   │   └── EmptyState.tsx           # 空态组件
│   ├── hooks/
│   │   ├── useFiles.ts              # 文件数据 hook
│   │   ├── useGroups.ts             # 分组数据 hook
│   │   ├── useTheme.ts              # 主题切换 hook
│   │   └── useWindow.ts             # 窗口状态 hook
│   ├── lib/
│   │   ├── tauri.ts                 # Tauri invoke 封装
│   │   ├── icons.ts                 # 文件类型图标映射
│   │   └── time.ts                  # 相对时间格式化
│   ├── styles/
│   │   └── globals.css              # TailwindCSS + 自定义样式
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Task 1: Tauri 项目初始化

**Files:**
- Create: `filebox/package.json`
- Create: `filebox/tsconfig.json`
- Create: `filebox/vite.config.ts`
- Create: `filebox/tailwind.config.js`
- Create: `filebox/index.html`
- Create: `filebox/src/main.tsx`
- Create: `filebox/src/App.tsx`
- Create: `filebox/src/styles/globals.css`
- Create: `filebox/src-tauri/Cargo.toml`
- Create: `filebox/src-tauri/tauri.conf.json`
- Create: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 创建前端项目**

```bash
cd filebox
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: 安装前端依赖**

```bash
cd filebox
npm install tailwindcss @tailwindcss/vite framer-motion lucide-react @tauri-apps/api
npm install -D @tauri-apps/cli
```

- [ ] **Step 3: 配置 TailwindCSS**

```typescript
// filebox/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 4: 创建全局样式**

```css
/* filebox/src/styles/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  --color-accent: #7C6EE6;
  --color-accent-hover: #6C5CE7;
  --color-danger: #F05070;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  overflow: hidden;
  user-select: none;
}
```

- [ ] **Step 5: 创建入口文件**

```tsx
// filebox/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: 创建 App 骨架**

```tsx
// filebox/src/App.tsx
function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <h1 className="text-white text-2xl">FileBox v2</h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 7: 初始化 Tauri 后端**

```bash
cd filebox
npx tauri init
```

- [ ] **Step 8: 配置 Tauri**

```json
// filebox/src-tauri/tauri.conf.json
{
  "$schema": "https://raw.githubusercontent.com/nicegui/multiui/main/examples/tauri-v2/src-tauri/schemas/desktop-schema.json",
  "productName": "FileBox",
  "version": "2.0.0",
  "identifier": "com.filebox.app",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "FileBox",
        "width": 360,
        "height": 600,
        "resizable": true,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

- [ ] **Step 9: 验证前端构建**

```bash
cd filebox
npm run dev
```

Expected: 浏览器打开 http://localhost:5173 显示 "FileBox v2"

- [ ] **Step 10: 验证 Tauri 构建**

```bash
cd filebox
npx tauri dev
```

Expected: 桌面窗口显示 "FileBox v2"，透明背景

- [ ] **Step 11: Commit**

```bash
cd filebox
git add .
git commit -m "feat: initialize Tauri 2 + React + TailwindCSS project"
```

---

## Task 2: 毛玻璃背景与窗口基础

**Files:**
- Create: `filebox/src/components/Sidebar.tsx`
- Modify: `filebox/src/App.tsx`
- Modify: `filebox/src/styles/globals.css`

- [ ] **Step 1: 创建 Sidebar 组件骨架**

```tsx
// filebox/src/components/Sidebar.tsx
import { motion } from "framer-motion";

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: 更新 App 使用 Sidebar**

```tsx
// filebox/src/App.tsx
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div className="w-screen h-screen p-2">
      <Sidebar>
        <div className="p-6">
          <h1 className="text-white/90 text-lg font-semibold">FileBox</h1>
          <p className="text-white/50 text-sm">文件收纳管理</p>
        </div>
      </Sidebar>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: 添加毛玻璃 CSS 支持**

```css
/* filebox/src/styles/globals.css - 添加到文件末尾 */
.glass-dark {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}

.glass-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}
```

- [ ] **Step 4: 验证毛玻璃效果**

```bash
cd filebox
npx tauri dev
```

Expected: 桌面窗口显示半透明毛玻璃背景，可以看到后面的桌面

- [ ] **Step 5: Commit**

```bash
git add filebox/src/components/Sidebar.tsx filebox/src/App.tsx filebox/src/styles/globals.css
git commit -m "feat: add glassmorphism background to sidebar"
```

---

## Task 3: 标题栏组件

**Files:**
- Create: `filebox/src/components/TitleBar.tsx`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建 TitleBar 组件**

```tsx
// filebox/src/components/TitleBar.tsx
import { Sun, Moon, Minus, X, Menu } from "lucide-react";

interface TitleBarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function TitleBar({
  theme,
  onToggleTheme,
  onMinimize,
  onClose,
}: TitleBarProps) {
  return (
    <div className="flex items-center justify-between px-4 h-12 border-b border-white/6">
      <div className="flex items-center gap-2">
        <Menu className="w-4 h-4 text-white/50" />
        <span className="text-white/90 text-sm font-semibold">FileBox</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-white/50" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-white/50" />
          )}
        </button>
        <button
          onClick={onMinimize}
          className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-white/50" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-red-500/80 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 更新 Sidebar 包含 TitleBar**

```tsx
// filebox/src/components/Sidebar.tsx
import { motion } from "framer-motion";
import { TitleBar } from "./TitleBar";
import { useState } from "react";

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: theme === "dark" ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}
    >
      <TitleBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onMinimize={() => {}}
        onClose={() => {}}
      />
      <div className="flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}
```

- [ ] **Step 3: 验证标题栏**

```bash
cd filebox
npx tauri dev
```

Expected: 标题栏显示 FileBox 标题和三个按钮，悬停有高亮效果

- [ ] **Step 4: Commit**

```bash
git add filebox/src/components/TitleBar.tsx filebox/src/components/Sidebar.tsx
git commit -m "feat: add title bar with theme toggle and window controls"
```

---

## Task 4: Rust 存储层

**Files:**
- Create: `filebox/src-tauri/src/storage.rs`
- Modify: `filebox/src-tauri/Cargo.toml`
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 添加 rusqlite 依赖**

```toml
# filebox/src-tauri/Cargo.toml - [dependencies] 部分
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
```

- [ ] **Step 2: 创建存储模块**

```rust
// filebox/src-tauri/src/storage.rs
use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Group {
    pub id: i32,
    pub name: String,
    pub is_fixed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileMapping {
    pub id: i32,
    pub group_id: i32,
    pub file_path: String,
    pub file_name: String,
    pub added_at: i64,
}

pub struct Storage {
    conn: Connection,
}

impl Storage {
    pub fn new(db_path: &str) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        let storage = Storage { conn };
        storage.init_schema()?;
        Ok(storage)
    }

    fn init_schema(&self) -> SqlResult<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_fixed INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
            );
            CREATE TABLE IF NOT EXISTS file_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                added_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                UNIQUE(group_id, file_path)
            );
            ",
        )?;

        // Ensure default group exists
        let existing: SqlResult<i32> = self.conn.query_row(
            "SELECT id FROM groups WHERE name = '最近收到' AND is_fixed = 1",
            [],
            |row| row.get(0),
        );

        if existing.is_err() {
            self.conn.execute(
                "INSERT INTO groups (name, is_fixed) VALUES ('最近收到', 1)",
                [],
            )?;
        }

        Ok(())
    }

    pub fn list_groups(&self) -> SqlResult<Vec<Group>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, is_fixed FROM groups ORDER BY is_fixed DESC, created_at ASC",
        )?;
        let groups = stmt
            .query_map([], |row| {
                Ok(Group {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    is_fixed: row.get::<_, i32>(2)? == 1,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(groups)
    }

    pub fn create_group(&self, name: &str) -> SqlResult<Group> {
        self.conn.execute(
            "INSERT INTO groups (name, is_fixed) VALUES (?, 0)",
            [name],
        )?;
        let id = self.conn.last_insert_rowid() as i32;
        Ok(Group {
            id,
            name: name.to_string(),
            is_fixed: false,
        })
    }

    pub fn rename_group(&self, id: i32, new_name: &str) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE groups SET name = ? WHERE id = ? AND is_fixed = 0",
            [new_name, &id.to_string()],
        )?;
        Ok(())
    }

    pub fn delete_group(&self, id: i32) -> SqlResult<()> {
        self.conn.execute(
            "DELETE FROM groups WHERE id = ? AND is_fixed = 0",
            [id],
        )?;
        Ok(())
    }

    pub fn clear_group(&self, id: i32) -> SqlResult<()> {
        self.conn.execute(
            "DELETE FROM file_mappings WHERE group_id = ?",
            [id],
        )?;
        Ok(())
    }

    pub fn get_recent_group(&self) -> SqlResult<Option<Group>> {
        let result = self.conn.query_row(
            "SELECT id, name, is_fixed FROM groups WHERE name = '最近收到' AND is_fixed = 1",
            [],
            |row| {
                Ok(Group {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    is_fixed: row.get::<_, i32>(2)? == 1,
                })
            },
        );
        match result {
            Ok(group) => Ok(Some(group)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn add_mapping(
        &self,
        group_id: i32,
        file_path: &str,
        file_name: &str,
        added_at: i64,
    ) -> SqlResult<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO file_mappings (group_id, file_path, file_name, added_at) VALUES (?, ?, ?, ?)",
            [group_id, file_path, file_name, &added_at.to_string()],
        )?;
        Ok(())
    }

    pub fn list_mappings(&self, group_id: i32) -> SqlResult<Vec<FileMapping>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, group_id, file_path, file_name, added_at FROM file_mappings WHERE group_id = ? ORDER BY added_at DESC",
        )?;
        let mappings = stmt
            .query_map([group_id], |row| {
                Ok(FileMapping {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    file_path: row.get(2)?,
                    file_name: row.get(3)?,
                    added_at: row.get(4)?,
                })
            })?
            .collect::<SqlResult<Vec<_>>>()?;
        Ok(mappings)
    }

    pub fn remove_mapping(&self, id: i32) -> SqlResult<()> {
        self.conn.execute("DELETE FROM file_mappings WHERE id = ?", [id])?;
        Ok(())
    }
}
```

- [ ] **Step 3: 在 main.rs 中集成存储**

```rust
// filebox/src-tauri/src/main.rs
mod storage;

use storage::Storage;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    storage: Mutex<Storage>,
}

#[tauri::command]
fn get_groups(state: State<AppState>) -> Result<Vec<storage::Group>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_groups().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_group(state: State<AppState>, name: String) -> Result<storage::Group, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.create_group(&name).map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_group(state: State<AppState>, id: i32, name: String) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.rename_group(id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_group(state: State<AppState>, id: i32) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.delete_group(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_group(state: State<AppState>, id: i32) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.clear_group(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_files(state: State<AppState>, group_id: i32) -> Result<Vec<storage::FileMapping>, String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.list_mappings(group_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_file(
    state: State<AppState>,
    group_id: i32,
    path: String,
    name: String,
) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    storage
        .add_mapping(group_id, &path, &name, now)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_file(state: State<AppState>, id: i32) -> Result<(), String> {
    let storage = state.storage.lock().map_err(|e| e.to_string())?;
    storage.remove_mapping(id).map_err(|e| e.to_string())
}

fn main() {
    let db_path = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("filebox")
        .join("filebox.db");

    std::fs::create_dir_all(db_path.parent().unwrap()).ok();

    let storage = Storage::new(db_path.to_str().unwrap()).expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            storage: Mutex::new(storage),
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 添加 dirs 依赖**

```toml
# filebox/src-tauri/Cargo.toml - [dependencies] 部分添加
dirs = "5"
```

- [ ] **Step 5: 验证编译**

```bash
cd filebox/src-tauri
cargo build
```

Expected: 编译成功，无错误

- [ ] **Step 6: 运行存储测试**

```bash
cd filebox/src-tauri
cargo test
```

Expected: 所有测试通过（后续添加测试）

- [ ] **Step 7: Commit**

```bash
git add filebox/src-tauri/
git commit -m "feat: add Rust storage layer with SQLite"
```

---

## Task 5: Rust 配置模块

**Files:**
- Create: `filebox/src-tauri/src/config.rs`
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 创建配置模块**

```rust
// filebox/src-tauri/src/config.rs
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
```

- [ ] **Step 2: 在 main.rs 中注册配置命令**

```rust
// filebox/src-tauri/src/main.rs - 添加到文件顶部
mod config;

// 添加命令函数
#[tauri::command]
fn get_config() -> Result<config::AppConfig, String> {
    Ok(config::load_config())
}

#[tauri::command]
fn save_config(cfg: config::AppConfig) -> Result<(), String> {
    config::save_config(&cfg)
}

// 在 invoke_handler 中添加 get_config, save_config
```

- [ ] **Step 3: 验证配置读写**

```bash
cd filebox/src-tauri
cargo build
```

Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add filebox/src-tauri/src/config.rs filebox/src-tauri/src/main.rs
git commit -m "feat: add config module for reading/writing settings"
```

---

## Task 6: Rust 文件监听

**Files:**
- Create: `filebox/src-tauri/src/watcher.rs`
- Modify: `filebox/src-tauri/Cargo.toml`
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 添加 notify 依赖**

```toml
# filebox/src-tauri/Cargo.toml - [dependencies] 部分添加
notify = "6"
```

- [ ] **Step 2: 创建文件监听模块**

```rust
// filebox/src-tauri/src/watcher.rs
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc;
use std::thread;

pub struct FileWatcher {
    _watcher: RecommendedWatcher,
}

impl FileWatcher {
    pub fn new(
        paths: Vec<String>,
        extensions: Vec<String>,
        on_new_file: impl Fn(String, String) + Send + 'static,
    ) -> Result<Self, String> {
        let (tx, rx) = mpsc::channel::<notify::Result<Event>>();

        let mut watcher =
            RecommendedWatcher::new(tx, notify::Config::default()).map_err(|e| e.to_string())?;

        for path in &paths {
            if Path::new(path).exists() {
                watcher
                    .watch(Path::new(path), RecursiveMode::NonRecursive)
                    .map_err(|e| e.to_string())?;
            }
        }

        let exts = extensions.clone();
        thread::spawn(move || {
            for res in rx {
                match res {
                    Ok(event) => {
                        if let EventKind::Create(_) | EventKind::Modify(_) = event.kind {
                            for path in event.paths {
                                let path_str = path.to_string_lossy().to_string();
                                let ext = path
                                    .extension()
                                    .and_then(|e| e.to_str())
                                    .map(|e| format!(".{}", e))
                                    .unwrap_or_default();
                                if exts.contains(&ext) {
                                    let name = path
                                        .file_name()
                                        .and_then(|n| n.to_str())
                                        .unwrap_or("")
                                        .to_string();
                                    on_new_file(path_str, name);
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
```

- [ ] **Step 3: 在 main.rs 中集成监听**

```rust
// filebox/src-tauri/src/main.rs - 添加到文件顶部
mod watcher;

// 在 AppState 中添加
struct AppState {
    storage: Mutex<Storage>,
    app_handle: Mutex<Option<tauri::AppHandle>>,
}

// 在 main 函数中启动监听
let config = config::load_config();
let app_handle = app.handle().clone();

let watcher = watcher::FileWatcher::new(
    config.watch_paths.clone(),
    config.watch_extensions.clone(),
    move |path, name| {
        // Auto-add to "最近收到" group
        // This will be implemented with proper storage access
        println!("New file detected: {} at {}", name, path);
        // TODO: Emit event to frontend
    },
);
```

- [ ] **Step 4: 验证编译**

```bash
cd filebox/src-tauri
cargo build
```

Expected: 编译成功

- [ ] **Step 5: Commit**

```bash
git add filebox/src-tauri/src/watcher.rs filebox/src-tauri/src/main.rs filebox/src-tauri/Cargo.toml
git commit -m "feat: add file watcher with notify crate"
```

---

## Task 7: Tauri invoke 封装与前端数据层

**Files:**
- Create: `filebox/src/lib/tauri.ts`
- Create: `filebox/src/hooks/useGroups.ts`
- Create: `filebox/src/hooks/useFiles.ts`

- [ ] **Step 1: 创建 Tauri invoke 封装**

```typescript
// filebox/src/lib/tauri.ts
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
  // Groups
  getGroups: () => invoke<Group[]>("get_groups"),
  createGroup: (name: string) => invoke<Group>("create_group", { name }),
  renameGroup: (id: number, name: string) =>
    invoke("rename_group", { id, name }),
  deleteGroup: (id: number) => invoke("delete_group", { id }),
  clearGroup: (id: number) => invoke("clear_group", { id }),

  // Files
  getFiles: (groupId: number) => invoke<FileMapping[]>("get_files", { groupId }),
  addFile: (groupId: number, path: string, name: string) =>
    invoke("add_file", { groupId, path, name }),
  removeFile: (id: number) => invoke("remove_file", { id }),

  // Config
  getConfig: () => invoke<AppConfig>("get_config"),
  saveConfig: (config: AppConfig) => invoke("save_config", { cfg: config }),
};
```

- [ ] **Step 2: 创建 useGroups hook**

```typescript
// filebox/src/hooks/useGroups.ts
import { useState, useEffect, useCallback } from "react";
import { api, Group } from "../lib/tauri";

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

  const clear = useCallback(
    async (id: number) => {
      await api.clearGroup(id);
    },
    []
  );

  return {
    groups,
    selectedId,
    setSelectedId,
    loading,
    create,
    rename,
    remove,
    clear,
    refresh,
  };
}
```

- [ ] **Step 3: 创建 useFiles hook**

```typescript
// filebox/src/hooks/useFiles.ts
import { useState, useEffect, useCallback } from "react";
import { api, FileMapping } from "../lib/tauri";

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
```

- [ ] **Step 4: 验证类型检查**

```bash
cd filebox
npm run build
```

Expected: TypeScript 编译成功，无类型错误

- [ ] **Step 5: Commit**

```bash
git add filebox/src/lib/tauri.ts filebox/src/hooks/
git commit -m "feat: add Tauri API wrapper and React hooks for data"
```

---

## Task 8: 分组选择器组件

**Files:**
- Create: `filebox/src/components/GroupSelector.tsx`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建 GroupSelector 组件**

```tsx
// filebox/src/components/GroupSelector.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Pencil, Trash2, X as XIcon } from "lucide-react";
import { Group } from "../lib/tauri";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = groups.find((g) => g.id === selectedId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName("");
      setIsCreating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative px-4 mb-3" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/6 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm">{selected?.name || "选择分组"}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 text-xs">
            {fileCount}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden"
          >
            {groups.map((group) => (
              <div
                key={group.id}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/8 transition-colors ${
                  group.id === selectedId ? "bg-white/5" : ""
                }`}
                onClick={() => {
                  onSelect(group.id);
                  setIsOpen(false);
                }}
              >
                <span className="text-white/90 text-sm">{group.name}</span>
                {!group.is_fixed && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("重命名分组", group.name);
                        if (newName) onRename(group.id, newName);
                      }}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Pencil className="w-3 h-3 text-white/50" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(group.id);
                      }}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isCreating ? (
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/10">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="分组名称..."
                  className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder:text-white/30"
                />
                <button onClick={handleCreate} className="p-1 rounded hover:bg-white/10">
                  <Plus className="w-4 h-4 text-accent" />
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewName("");
                  }}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <XIcon className="w-4 h-4 text-white/50" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-white/10 hover:bg-white/8 transition-colors"
              >
                <Plus className="w-4 h-4 text-accent" />
                <span className="text-accent text-sm">新建分组</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: 更新 Sidebar 使用 GroupSelector**

```tsx
// filebox/src/components/Sidebar.tsx - 更新 import 和内部逻辑
import { GroupSelector } from "./GroupSelector";
import { useGroups } from "../hooks/useGroups";
import { useFiles } from "../hooks/useFiles";

// 在 Sidebar 组件内部
const { groups, selectedId, setSelectedId, create, rename, remove } = useGroups();
const { files } = useFiles(selectedId);

// 在 TitleBar 下方添加
<GroupSelector
  groups={groups}
  selectedId={selectedId}
  fileCount={files.length}
  onSelect={setSelectedId}
  onCreate={create}
  onRename={rename}
  onDelete={remove}
/>
```

- [ ] **Step 3: 验证下拉菜单**

```bash
cd filebox
npx tauri dev
```

Expected: 点击分组选择器弹出下拉列表，可以切换分组、创建新分组

- [ ] **Step 4: Commit**

```bash
git add filebox/src/components/GroupSelector.tsx filebox/src/components/Sidebar.tsx
git commit -m "feat: add group selector with dropdown and CRUD"
```

---

## Task 9: 文件列表与文件项组件

**Files:**
- Create: `filebox/src/components/FileItem.tsx`
- Create: `filebox/src/components/FileList.tsx`
- Create: `filebox/src/components/EmptyState.tsx`
- Create: `filebox/src/lib/icons.ts`
- Create: `filebox/src/lib/time.ts`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建图标映射工具**

```typescript
// filebox/src/lib/icons.ts
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  File,
  LucideIcon,
} from "lucide-react";

interface IconInfo {
  icon: LucideIcon;
  color: string;
  bg: string;
}

const iconMap: Record<string, IconInfo> = {
  ".pdf": { icon: FileText, color: "#E74C3C", bg: "rgba(231, 76, 60, 0.15)" },
  ".doc": { icon: FileText, color: "#3498DB", bg: "rgba(52, 152, 219, 0.15)" },
  ".docx": { icon: FileText, color: "#3498DB", bg: "rgba(52, 152, 219, 0.15)" },
  ".xls": { icon: FileSpreadsheet, color: "#27AE60", bg: "rgba(39, 174, 96, 0.15)" },
  ".xlsx": { icon: FileSpreadsheet, color: "#27AE60", bg: "rgba(39, 174, 96, 0.15)" },
  ".ppt": { icon: Presentation, color: "#E67E22", bg: "rgba(230, 126, 34, 0.15)" },
  ".pptx": { icon: Presentation, color: "#E67E22", bg: "rgba(230, 126, 34, 0.15)" },
  ".txt": { icon: FileText, color: "#95A5A6", bg: "rgba(149, 165, 166, 0.15)" },
  ".zip": { icon: Archive, color: "#8E44AD", bg: "rgba(142, 68, 173, 0.15)" },
  ".rar": { icon: Archive, color: "#8E44AD", bg: "rgba(142, 68, 173, 0.15)" },
};

export function getFileIcon(fileName: string): IconInfo {
  const ext = fileName
    .slice(fileName.lastIndexOf("."))
    .toLowerCase();
  return iconMap[ext] || { icon: File, color: "#BDC3C7", bg: "rgba(189, 195, 199, 0.15)" };
}
```

- [ ] **Step 2: 创建相对时间工具**

```typescript
// filebox/src/lib/time.ts
export function relativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;

  const date = new Date(timestamp * 1000);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) return "今天";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "昨天";

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
```

- [ ] **Step 3: 创建 FileItem 组件**

```tsx
// filebox/src/components/FileItem.tsx
import { motion } from "framer-motion";
import { FolderOpen, X } from "lucide-react";
import { getFileIcon } from "../lib/icons";
import { relativeTime } from "../lib/time";
import { FileMapping } from "../lib/tauri";
import { useState } from "react";

interface FileItemProps {
  file: FileMapping;
  onOpen: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileItem({ file, onOpen, onOpenFolder, onRemove }: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { icon: Icon, color, bg } = getFileIcon(file.file_name);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative flex items-center gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => onOpen(file.file_path)}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm truncate">{file.file_name}</p>
        <p className="text-white/40 text-xs mt-0.5">
          {relativeTime(file.added_at)}
        </p>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(file.file_path);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="打开文件夹"
          >
            <FolderOpen className="w-3.5 h-3.5 text-white/50" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file.id);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="移除"
          >
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 4: 创建 EmptyState 组件**

```tsx
// filebox/src/components/EmptyState.tsx
import { Inbox } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <Inbox className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/30 text-sm text-center">暂无文件</p>
      <p className="text-white/20 text-xs text-center">
        文件会自动出现在这里
      </p>
    </div>
  );
}
```

- [ ] **Step 5: 创建 FileList 组件**

```tsx
// filebox/src/components/FileList.tsx
import { AnimatePresence } from "framer-motion";
import { FileItem } from "./FileItem";
import { EmptyState } from "./EmptyState";
import { FileMapping } from "../lib/tauri";

interface FileListProps {
  files: FileMapping[];
  onOpen: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileList({
  files,
  onOpen,
  onOpenFolder,
  onRemove,
}: FileListProps) {
  if (files.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onOpen={onOpen}
            onOpenFolder={onOpenFolder}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 6: 更新 Sidebar 使用 FileList**

```tsx
// filebox/src/components/Sidebar.tsx - 添加 FileList
import { FileList } from "./FileList";
import { AddButton } from "./AddButton"; // 下一步创建

// 在 GroupSelector 下方添加
<FileList
  files={files}
  onOpen={(path) => {
    // 调用 Tauri 命令打开文件
    import("@tauri-apps/api/shell").then(({ open }) => open(path));
  }}
  onOpenFolder={(path) => {
    // 调用 Tauri 命令打开文件夹
    const folder = path.slice(0, path.lastIndexOf("\\"));
    import("@tauri-apps/api/shell").then(({ open }) => open(folder));
  }}
  onRemove={removeFile}
/>
```

- [ ] **Step 7: 验证文件列表**

```bash
cd filebox
npx tauri dev
```

Expected: 文件列表显示，悬停显示操作按钮，双击打开文件

- [ ] **Step 8: Commit**

```bash
git add filebox/src/components/FileItem.tsx filebox/src/components/FileList.tsx filebox/src/components/EmptyState.tsx filebox/src/lib/icons.ts filebox/src/lib/time.ts filebox/src/components/Sidebar.tsx
git commit -m "feat: add file list with type icons and animations"
```

---

## Task 10: 添加文件按钮与文件对话框

**Files:**
- Create: `filebox/src/components/AddButton.tsx`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建 AddButton 组件**

```tsx
// filebox/src/components/AddButton.tsx
import { Plus } from "lucide-react";

interface AddButtonProps {
  onClick: () => void;
}

export function AddButton({ onClick }: AddButtonProps) {
  return (
    <div className="px-4 pb-4">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>添加文件</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 更新 Sidebar 添加文件对话框**

```tsx
// filebox/src/components/Sidebar.tsx - 添加文件对话框逻辑
import { open } from "@tauri-apps/plugin-dialog";
import { AddButton } from "./AddButton";

// 在 FileList 下方添加
<AddButton
  onClick={async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "文档",
            extensions: [
              "docx", "doc", "pdf", "pptx", "ppt",
              "xlsx", "xls", "txt", "zip", "rar",
            ],
          },
        ],
      });
      if (selected && selectedId) {
        for (const path of Array.isArray(selected) ? selected : [selected]) {
          const name = path.split("\\").pop() || path;
          await addFile(path, name);
        }
      }
    } catch (e) {
      console.error("Failed to open file dialog:", e);
    }
  }}
/>
```

- [ ] **Step 3: 安装 dialog 插件**

```bash
cd filebox
npm install @tauri-apps/plugin-dialog
```

- [ ] **Step 4: 验证添加文件**

```bash
cd filebox
npx tauri dev
```

Expected: 点击"添加文件"弹出系统文件选择器，选择后文件出现在列表中

- [ ] **Step 5: Commit**

```bash
git add filebox/src/components/AddButton.tsx filebox/src/components/Sidebar.tsx package.json
git commit -m "feat: add file button with system file dialog"
```

---

## Task 11: 主题系统

**Files:**
- Create: `filebox/src/hooks/useTheme.ts`
- Modify: `filebox/src/components/Sidebar.tsx`
- Modify: `filebox/src/styles/globals.css`

- [ ] **Step 1: 创建 useTheme hook**

```typescript
// filebox/src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/tauri";

export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    api.getConfig().then((config) => {
      setThemeState(config.theme as Theme);
    });
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    const config = await api.getConfig();
    await api.saveConfig({ ...config, theme: newTheme });
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
```

- [ ] **Step 2: 更新 Sidebar 使用主题系统**

```tsx
// filebox/src/components/Sidebar.tsx
import { useTheme } from "../hooks/useTheme";

// 在 Sidebar 组件内部
const { theme, toggle: toggleTheme } = useTheme();

// 更新背景样式
style={{
  background: theme === "dark" ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
}}
```

- [ ] **Step 3: 添加主题 CSS 变量**

```css
/* filebox/src/styles/globals.css - 添加主题变量 */
:root {
  --bg-glass: rgba(0, 0, 0, 0.6);
  --surface: rgba(255, 255, 255, 0.05);
  --surface-hover: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.06);
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.5);
  --text-muted: rgba(255, 255, 255, 0.25);
}

[data-theme="light"] {
  --bg-glass: rgba(255, 255, 255, 0.7);
  --surface: rgba(0, 0, 0, 0.03);
  --surface-hover: rgba(0, 0, 0, 0.06);
  --border: rgba(0, 0, 0, 0.08);
  --text-primary: rgba(0, 0, 0, 0.85);
  --text-secondary: rgba(0, 0, 0, 0.45);
  --text-muted: rgba(0, 0, 0, 0.2);
}
```

- [ ] **Step 4: 验证主题切换**

```bash
cd filebox
npx tauri dev
```

Expected: 点击主题按钮切换暗色/亮色，背景和文字颜色相应变化

- [ ] **Step 5: Commit**

```bash
git add filebox/src/hooks/useTheme.ts filebox/src/components/Sidebar.tsx filebox/src/styles/globals.css
git commit -m "feat: add theme system with dark/light mode"
```

---

## Task 12: 系统托盘

**Files:**
- Create: `filebox/src-tauri/src/tray.rs`
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 创建托盘模块**

```rust
// filebox/src-tauri/src/tray.rs
use tauri::{
    AppHandle, Manager,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("FileBox")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        window.hide().ok();
                    } else {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

- [ ] **Step 2: 在 main.rs 中集成托盘**

```rust
// filebox/src-tauri/src/main.rs - 添加到文件顶部
mod tray;

// 在 main 函数中，Builder 之后添加
.setup(|app| {
    tray::setup_tray(app).ok();
    Ok(())
})
```

- [ ] **Step 3: 验证托盘**

```bash
cd filebox
npx tauri dev
```

Expected: 系统托盘显示 FileBox 图标，点击切换窗口显示/隐藏

- [ ] **Step 4: Commit**

```bash
git add filebox/src-tauri/src/tray.rs filebox/src-tauri/src/main.rs
git commit -m "feat: add system tray with toggle visibility"
```

---

## Task 13: 窗口行为 - 边缘吸附

**Files:**
- Create: `filebox/src/hooks/useWindow.ts`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 创建 useWindow hook**

```typescript
// filebox/src/hooks/useWindow.ts
import { useState, useCallback, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";

export type WindowState = "expanded" | "collapsed" | "hidden";

export function useWindow() {
  const [state, setState] = useState<WindowState>("expanded");
  const [edge, setEdge] = useState<"left" | "right" | "top">("right");

  const expand = useCallback(async () => {
    const win = getCurrentWindow();
    await win.setSize(new PhysicalSize(360, 800));
    await win.show();
    await win.setFocus();
    setState("expanded");
  }, []);

  const collapse = useCallback(async () => {
    const win = getCurrentWindow();
    await win.setSize(new PhysicalSize(6, 800));
    setState("collapsed");
  }, []);

  const hide = useCallback(async () => {
    const win = getCurrentWindow();
    await win.hide();
    setState("hidden");
  }, []);

  const toggle = useCallback(async () => {
    if (state === "hidden" || state === "collapsed") {
      await expand();
    } else {
      await hide();
    }
  }, [state, expand, hide]);

  return { state, edge, expand, collapse, hide, toggle };
}
```

- [ ] **Step 2: 更新 Sidebar 使用窗口 hook**

```tsx
// filebox/src/components/Sidebar.tsx
import { useWindow } from "../hooks/useWindow";

// 在 Sidebar 组件内部
const { state, expand, collapse, hide, toggle } = useWindow();

// 更新 TitleBar 的 props
<TitleBar
  theme={theme}
  onToggleTheme={toggleTheme}
  onMinimize={collapse}
  onClose={hide}
/>
```

- [ ] **Step 3: 添加鼠标边缘触发**

```tsx
// filebox/src/components/Sidebar.tsx - 添加到组件内部
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (state === "collapsed" && e.clientX >= window.innerWidth - 10) {
      expand();
    }
  };

  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, [state, expand]);
```

- [ ] **Step 4: 验证边缘吸附**

```bash
cd filebox
npx tauri dev
```

Expected: 点击最小化按钮窗口收缩为细条，鼠标靠近自动展开

- [ ] **Step 5: Commit**

```bash
git add filebox/src/hooks/useWindow.ts filebox/src/components/Sidebar.tsx
git commit -m "feat: add edge snap behavior with expand/collapse"
```

---

## Task 14: 全局快捷键

**Files:**
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 注册全局快捷键**

```rust
// filebox/src-tauri/src/main.rs - 在 setup 闭包中添加
use tauri::Manager;

app.listen_global("toggle-window", move |_event| {
    // This will be handled by frontend
});

// 注册 Alt+F 快捷键
app.on_window_event(|window, event| {
    // Window events handled here
});
```

- [ ] **Step 2: 添加快捷键插件**

```bash
cd filebox
npm install @tauri-apps/plugin-global-shortcut
```

- [ ] **Step 3: 在前端注册快捷键**

```typescript
// filebox/src/App.tsx - 添加快捷键注册
import { register } from "@tauri-apps/plugin-global-shortcut";
import { useEffect } from "react";

// 在 App 组件内部
useEffect(() => {
  register("Alt+F", () => {
    // Toggle window visibility
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      win.isVisible().then((visible) => {
        if (visible) {
          win.hide();
        } else {
          win.show();
          win.setFocus();
        }
      });
    });
  });
}, []);
```

- [ ] **Step 4: 验证快捷键**

```bash
cd filebox
npx tauri dev
```

Expected: 按 Alt+F 切换窗口显示/隐藏

- [ ] **Step 5: Commit**

```bash
git add filebox/package.json filebox/src/App.tsx
git commit -m "feat: add global hotkey Alt+F to toggle window"
```

---

## Task 15: 新文件通知

**Files:**
- Modify: `filebox/src-tauri/src/watcher.rs`
- Modify: `filebox/src-tauri/src/main.rs`

- [ ] **Step 1: 更新 watcher 发送事件**

```rust
// filebox/src-tauri/src/watcher.rs - 更新 FileWatcher::new
use tauri::AppHandle;

pub fn new(
    paths: Vec<String>,
    extensions: Vec<String>,
    app_handle: AppHandle,
) -> Result<Self, String> {
    // ... existing watcher setup ...

    let exts = extensions.clone();
    let handle = app_handle.clone();
    thread::spawn(move || {
        for res in rx {
            match res {
                Ok(event) => {
                    if let EventKind::Create(_) | EventKind::Modify(_) = event.kind {
                        for path in event.paths {
                            // ... existing filtering logic ...
                            if exts.contains(&ext) {
                                let name = path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("")
                                    .to_string();

                                // Emit event to frontend
                                handle.emit("new-file", serde_json::json!({
                                    "file_name": name,
                                    "file_path": path_str,
                                })).ok();
                            }
                        }
                    }
                }
                Err(e) => eprintln!("Watch error: {:?}", e),
            }
        }
    });

    Ok(FileWatcher { _watcher: watcher })
}
```

- [ ] **Step 2: 在前端监听新文件事件**

```typescript
// filebox/src/hooks/useFiles.ts - 添加事件监听
import { listen } from "@tauri-apps/api/event";

// 在 useEffect 中添加
useEffect(() => {
  const unlisten = listen("new-file", () => {
    refresh();
  });

  return () => {
    unlisten.then((fn) => fn());
  };
}, [refresh]);
```

- [ ] **Step 3: 验证新文件通知**

```bash
cd filebox
npx tauri dev
```

Expected: 在监听目录创建新文件，列表自动更新

- [ ] **Step 4: Commit**

```bash
git add filebox/src-tauri/src/watcher.rs filebox/src/hooks/useFiles.ts
git commit -m "feat: add real-time file detection with events"
```

---

## Task 16: 动画打磨

**Files:**
- Modify: `filebox/src/components/FileItem.tsx`
- Modify: `filebox/src/components/GroupSelector.tsx`
- Modify: `filebox/src/components/Sidebar.tsx`

- [ ] **Step 1: 文件项入场动画优化**

```tsx
// filebox/src/components/FileItem.tsx - 更新 motion.div
<motion.div
  layout
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
  transition={{
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 0.8,
  }}
  // ... rest of props
>
```

- [ ] **Step 2: 分组切换动画**

```tsx
// filebox/src/components/FileList.tsx - 添加 AnimatePresence
<AnimatePresence mode="wait">
  <motion.div
    key={groupId} // 需要传入 groupId prop
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {files.map((file) => (
      <FileItem key={file.id} file={file} /* ... */ />
    ))}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 3: 侧边栏展开/收起动画**

```tsx
// filebox/src/components/Sidebar.tsx - 包裹 motion.div
<motion.div
  animate={{
    width: state === "collapsed" ? 6 : 360,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 25,
  }}
  className="h-full overflow-hidden"
>
  {/* 现有内容 */}
</motion.div>
```

- [ ] **Step 4: 验证动画流畅度**

```bash
cd filebox
npx tauri dev
```

Expected: 所有动画丝滑流畅，有弹性回弹感

- [ ] **Step 5: Commit**

```bash
git add filebox/src/components/
git commit -m "polish: refine animations with spring physics"
```

---

## Task 17: 测试

**Files:**
- Create: `filebox/src-tauri/src/storage.rs` (tests module)
- Create: `filebox/src/hooks/__tests__/useGroups.test.ts`

- [ ] **Step 1: 添加 Rust 存储测试**

```rust
// filebox/src-tauri/src/storage.rs - 文件末尾添加
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_list_groups() {
        let storage = Storage::new(":memory:").unwrap();
        let groups = storage.list_groups().unwrap();
        assert_eq!(groups.len(), 1); // 默认分组
        assert_eq!(groups[0].name, "最近收到");
        assert!(groups[0].is_fixed);

        let new_group = storage.create_group("工作文件").unwrap();
        assert_eq!(new_group.name, "工作文件");
        assert!(!new_group.is_fixed);

        let groups = storage.list_groups().unwrap();
        assert_eq!(groups.len(), 2);
    }

    #[test]
    fn test_file_mappings() {
        let storage = Storage::new(":memory:").unwrap();
        let group = storage.create_group("测试分组").unwrap();

        storage.add_mapping(group.id, "C:\\test.txt", "test.txt", 1000).unwrap();
        storage.add_mapping(group.id, "C:\\test2.txt", "test2.txt", 2000).unwrap();

        let mappings = storage.list_mappings(group.id).unwrap();
        assert_eq!(mappings.len(), 2);
        assert_eq!(mappings[0].file_name, "test2.txt"); // 按时间倒序

        storage.remove_mapping(mappings[0].id).unwrap();
        let mappings = storage.list_mappings(group.id).unwrap();
        assert_eq!(mappings.len(), 1);
    }

    #[test]
    fn test_cannot_delete_fixed_group() {
        let storage = Storage::new(":memory:").unwrap();
        let recent = storage.get_recent_group().unwrap().unwrap();
        storage.delete_group(recent.id).unwrap();
        let groups = storage.list_groups().unwrap();
        assert_eq!(groups.len(), 1); // 仍然存在
    }
}
```

- [ ] **Step 2: 运行 Rust 测试**

```bash
cd filebox/src-tauri
cargo test
```

Expected: 所有测试通过

- [ ] **Step 3: Commit**

```bash
git add filebox/src-tauri/src/storage.rs
git commit -m "test: add storage unit tests"
```

---

## Task 18: 旧代码清理

**Files:**
- Delete: `main.py`
- Delete: `src/`
- Delete: `requirements.txt`
- Delete: `filebox-app/`
- Delete: `filebox.db`
- Delete: `tests/`
- Delete: `.mypy_cache/`
- Delete: `.pytest_cache/`
- Delete: `.ruff_cache/`
- Delete: `__pycache__/`
- Delete: `AGENTS.md`
- Modify: `.gitignore`

- [ ] **Step 1: 删除旧 Python 代码**

```bash
rm -rf main.py src/ requirements.txt filebox-app/ filebox.db tests/
rm -rf .mypy_cache/ .pytest_cache/ .ruff_cache/ __pycache__/
```

- [ ] **Step 2: 更新 .gitignore**

```gitignore
# filebox/.gitignore
node_modules/
dist/
target/
*.db
.DS_Store
```

- [ ] **Step 3: 更新 README.md**

```markdown
# FileBox

macOS 风格的 Windows 桌面文件收纳工具。

## 技术栈

- Tauri 2 + Rust
- React 18 + TypeScript
- TailwindCSS 4
- Framer Motion

## 开发

```bash
cd filebox
npm install
npx tauri dev
```

## 构建

```bash
cd filebox
npx tauri build
```
```

- [ ] **Step 4: 验证项目结构**

```bash
ls -la
```

Expected: 只有 `filebox/`、`docs/`、`.git/`、`.gitignore`、`README.md`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old Python code, update project structure"
```

---

## 自检清单

- [ ] 所有 Tauri 命令在 Rust 中定义并在前端有对应封装
- [ ] 类型名称一致（Group, FileMapping, AppConfig）
- [ ] 动画使用 spring 物理模型
- [ ] 毛玻璃效果在 Windows 10/11 上可用
- [ ] 边缘吸附行为正常
- [ ] 全局快捷键 Alt+F 工作
- [ ] 系统托盘切换窗口可见性
- [ ] 文件监听实时推送新文件
- [ ] 旧代码已清理
- [ ] 所有测试通过
