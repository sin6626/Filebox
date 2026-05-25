# FileBox v2 重构设计文档

## 1. 背景与目标

FileBox 是一个 Windows 常驻托盘桌面工具，用于自动收集和管理聊天软件接收文件。

当前 v1 基于 Python + PyQt5，功能基本可用但 UI 偏工具化，缺乏高级感。本次重构目标：

1. **完全重写**：从 Python + PyQt5 迁移到 Tauri 2 + React + TypeScript
2. **高级感 UI**：macOS 风格，毛玻璃、圆角卡片、极简留白
3. **极致体验**：流畅动画、边缘吸附、多种触发方式
4. **轻量常驻**：~5MB 包体，~40MB 内存，适合托盘常驻

明确排除（当前里程碑不做）：

- AI 摘要/重命名/分类
- 文件预览
- 全局搜索
- 批量操作
- 云同步/账号系统

## 2. 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Tauri 2 | 桌面应用壳，系统集成 |
| 后端 | Rust | 文件监听、SQLite、配置、托盘 |
| 前端 | React 18 + TypeScript | UI 组件 |
| 样式 | TailwindCSS 4 | 原子化 CSS |
| 动画 | Framer Motion | 物理级弹性动画 |
| 图标 | Lucide Icons | 线条风格图标 |
| 文件监听 | notify (Rust crate) | 跨平台文件系统事件 |
| 数据库 | rusqlite (Rust crate) | SQLite 操作 |
| 构建 | Vite | 前端构建工具 |

**选择理由**：

- Tauri 2 使用系统 WebView2（Win10/11 内置），无需打包浏览器引擎
- CSS `backdrop-filter: blur()` 原生支持毛玻璃效果
- Rust 后端性能优异，内存安全
- Framer Motion 提供 spring 动画，丝滑流畅

## 3. 交互设计

### 3.1 触发方式（混合模式）

| 触发方式 | 行为 |
|----------|------|
| 全局快捷键 `Alt+F` | 切换侧边栏展开/隐藏 |
| 系统托盘点击 | 切换侧边栏展开/隐藏 |
| 鼠标靠近屏幕右边缘 | 自动展开侧边栏（收起态时） |

### 3.2 窗口状态机

```
[隐藏] ──托盘/快捷键──▶ [展开]
   │                        │
   │                   鼠标离开
   │                        ▼
   │                   [收起到边缘]
   │                        │
   │                   鼠标靠近 (0.3s)
   │                        ▼
   └──────────────────▶ [展开]
```

**状态定义**：

- **隐藏态**：窗口完全不可见，仅托盘图标可见。通过 `Alt+F` 或托盘点击切换到展开态。
- **展开态**：侧边栏贴屏幕右边缘，宽度 360px，高度占屏幕 80%，垂直居中。背景毛玻璃，圆角 16px。
- **收起态**：窗口缩小为右侧一条 6px 宽的细条（颜色跟随主题）。鼠标悬停 0.3s 后自动展开。

**窗口行为**：

- 标题栏可拖拽移动窗口
- 松手后自动吸附到最近的屏幕边缘（右/左/上）
- 展开/收起使用 spring 动画，时长 ~300ms，有弹性回弹感
- 最小宽度 320px，最大宽度 500px，可拖拽边缘调整

### 3.3 托盘菜单

- 显示/隐藏侧边栏
- 开机自启动（开关）
- 主题切换（暗色/亮色/跟随系统）
- 退出

## 4. 视觉设计

### 4.1 色彩体系

**暗色主题（默认）**：

| Token | 值 | 用途 |
|-------|-----|------|
| bg | rgba(0, 0, 0, 0.6) + blur(40px) | 窗口背景（毛玻璃） |
| surface | rgba(255, 255, 255, 0.05) | 卡片/组件背景 |
| surface-hover | rgba(255, 255, 255, 0.08) | 悬停态 |
| border | rgba(255, 255, 255, 0.06) | 边框 |
| accent | #7C6EE6 | 强调色（紫罗兰） |
| accent-hover | #6C5CE7 | 强调色悬停 |
| text-primary | rgba(255, 255, 255, 0.9) | 主文字 |
| text-secondary | rgba(255, 255, 255, 0.5) | 次文字 |
| text-muted | rgba(255, 255, 255, 0.25) | 弱文字 |
| danger | #F05070 | 危险操作 |

**亮色主题**：

| Token | 值 | 用途 |
|-------|-----|------|
| bg | rgba(255, 255, 255, 0.7) + blur(40px) | 窗口背景（毛玻璃） |
| surface | rgba(0, 0, 0, 0.03) | 卡片/组件背景 |
| surface-hover | rgba(0, 0, 0, 0.06) | 悬停态 |
| border | rgba(0, 0, 0, 0.08) | 边框 |
| accent | #6C5CE7 | 强调色 |
| text-primary | rgba(0, 0, 0, 0.85) | 主文字 |
| text-secondary | rgba(0, 0, 0, 0.45) | 次文字 |
| text-muted | rgba(0, 0, 0, 0.2) | 弱文字 |

### 4.2 字体

- 主字体：`Inter`（英文）+ `PingFang SC` / `Microsoft YaHei`（中文回退）
- 标题：14px / 600 weight / letter-spacing 0.3px
- 正文：13px / 400 weight
- 辅助：11px / 400 weight / opacity 0.5

### 4.3 圆角

| 元素 | 圆角 |
|------|------|
| 窗口 | 16px |
| 卡片 | 12px |
| 按钮 | 8px |
| 输入框 | 10px |
| 下拉菜单 | 12px |
| 文件项 | 10px |

### 4.4 间距

基础单位：4px。常用间距：8px / 12px / 16px / 24px。

### 4.5 图标

- 使用 Lucide Icons（线条风格，macOS 质感）
- 文件类型图标映射：

| 扩展名 | 图标 | 颜色 |
|--------|------|------|
| .pdf | FileText | #E74C3C |
| .doc/.docx | FileType | #3498DB |
| .xls/.xlsx | Sheet | #27AE60 |
| .ppt/.pptx | Presentation | #E67E22 |
| .txt | FileText | #95A5A6 |
| .zip/.rar | Archive | #8E44AD |
| 其他 | File | #BDC3C7 |

## 5. 布局与组件

### 5.1 侧边栏布局

```
┌─────────────────────────────────┐
│  ☰ FileBox          ☀  ─  ✕    │  ← 标题栏 (48px)
├─────────────────────────────────┤
│  编组                           │
│  ┌─────────────────────────┐    │
│  │ 最近收到           ▼    │    │  ← 分组选择器
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄 会议纪要.docx        │    │
│  │    3分钟前              │    │  ← 文件列表
│  ├─────────────────────────┤    │
│  │ 📊 Q3报表.xlsx          │    │
│  │    1小时前              │    │
│  ├─────────────────────────┤    │
│  │ 📕 设计规范.pdf         │    │
│  │    昨天                  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      + 添加文件          │    │  ← 添加按钮
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 5.2 标题栏

- 左侧：汉堡菜单图标 + "FileBox" 标题
- 右侧：主题切换按钮、最小化按钮、关闭按钮
- 整个标题栏可拖拽移动窗口
- 双击标题栏切换展开/收起

### 5.3 分组选择器

- 下拉框样式，圆角 10px
- 显示当前分组名 + 文件数量 badge
- 下拉列表显示所有分组，每个分组显示名称 + 文件数
- 右键菜单：重命名、清空、删除（"最近收到"分组不可删除）

### 5.4 文件列表

- 按时间倒序排列
- 支持滚轮滚动
- 空态显示：图标 + "暂无文件" 提示

### 5.5 文件项组件

- 左侧：文件类型图标（带颜色背景圆，32x32）
- 中间：文件名（主文字，单行截断）+ 相对时间（次文字）
- 右侧：悬停时显示操作按钮（打开文件夹、移除）
- 选中态：左侧 3px 强调色竖条 + 背景高亮
- 双击：打开文件
- 右键菜单：打开文件、打开所在文件夹、从编组移除

### 5.6 添加按钮

- 居中显示，圆角 12px
- 强调色背景，hover 时加深
- 点击打开系统文件选择器

### 5.7 动画细节

| 动画 | 效果 | 时长 |
|------|------|------|
| 展开/收起 | spring 动画，弹性回弹 | ~300ms |
| 文件项进入 | 从右侧滑入 + fade in，stagger 50ms | 200ms/项 |
| 文件项删除 | 向右滑出 + fade out | 200ms |
| 主题切换 | 全局 crossfade | 300ms |
| 分组切换 | 列表 crossfade | 200ms |
| 悬停高亮 | 背景色渐变 | 150ms |
| 收起细条 | 宽度渐变 | 250ms |

## 6. 项目结构

```
filebox/                          # 新 Tauri 项目根目录
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs              # Tauri 入口，注册命令
│   │   ├── watcher.rs           # 文件监听（notify crate）
│   │   ├── storage.rs           # SQLite 操作（rusqlite）
│   │   ├── config.rs            # 配置读写（serde_json）
│   │   └── tray.rs              # 系统托盘
│   ├── icons/                   # 应用图标
│   ├── Cargo.toml               # Rust 依赖
│   └── tauri.conf.json          # Tauri 配置
├── src/                          # React 前端
│   ├── components/
│   │   ├── Sidebar.tsx          # 侧边栏主组件
│   │   ├── TitleBar.tsx         # 标题栏
│   │   ├── GroupSelector.tsx    # 分组选择器
│   │   ├── FileList.tsx         # 文件列表
│   │   ├── FileItem.tsx         # 单个文件项
│   │   ├── AddButton.tsx        # 添加按钮
│   │   └── EmptyState.tsx       # 空态组件
│   ├── hooks/
│   │   ├── useFiles.ts          # 文件数据 hook
│   │   ├── useGroups.ts         # 分组数据 hook
│   │   ├── useTheme.ts          # 主题切换 hook
│   │   └── useWindow.ts         # 窗口状态 hook
│   ├── lib/
│   │   ├── tauri.ts             # Tauri invoke 封装
│   │   ├── icons.ts             # 文件类型图标映射
│   │   └── time.ts              # 相对时间格式化
│   ├── styles/
│   │   └── globals.css          # TailwindCSS + 自定义样式
│   ├── App.tsx                  # 根组件
│   └── main.tsx                 # 入口
├── package.json                 # Node.js 依赖
├── tailwind.config.js           # TailwindCSS 配置
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 配置
└── index.html                   # HTML 入口
```

## 7. 数据模型

### 7.1 SQLite 表结构

```sql
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_fixed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE file_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    added_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(group_id, file_path)
);
```

### 7.2 Rust 数据结构

```rust
#[derive(Serialize, Deserialize, Clone)]
struct Group {
    id: i32,
    name: String,
    is_fixed: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct FileMapping {
    id: i32,
    group_id: i32,
    file_path: String,
    file_name: String,
    added_at: i64,
}

#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    watch_paths: Vec<String>,
    watch_extensions: Vec<String>,
    notify_on_new_file: bool,
    theme: String,  // "dark" | "light" | "system"
    auto_start: bool,
}
```

### 7.3 Tauri 命令

```rust
// 文件相关
#[tauri::command]
fn get_files(group_id: i32) -> Result<Vec<FileMapping>, String>

#[tauri::command]
fn add_file(group_id: i32, path: String) -> Result<FileMapping, String>

#[tauri::command]
fn remove_file(mapping_id: i32) -> Result<(), String>

// 分组相关
#[tauri::command]
fn get_groups() -> Result<Vec<Group>, String>

#[tauri::command]
fn create_group(name: String) -> Result<Group, String>

#[tauri::command]
fn rename_group(id: i32, name: String) -> Result<(), String>

#[tauri::command]
fn delete_group(id: i32) -> Result<(), String>

#[tauri::command]
fn clear_group(id: i32) -> Result<(), String>

// 配置相关
#[tauri::command]
fn get_config() -> Result<AppConfig, String>

#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String>
```

### 7.4 Tauri 事件

```rust
// 新文件到达时，Rust 推送到前端
Event: "new-file"
Payload: { file_name: String, file_path: String, group_id: i32 }
```

### 7.5 配置迁移

旧 `config.json` 字段映射到新格式：

```
旧字段                    → 新字段
─────────────────────────────────────────
wechat_paths              → watch_paths（合并微信/QQ路径）
qq_paths                  → watch_paths（合并）
watch_extensions          → watch_extensions（保持）
notify_on_new_file        → notify_on_new_file（保持）
sidebar_width             → （废弃，使用固定 360px）
sidebar_position          → （废弃，固定右侧）
auto_start                → auto_start（保持）
openai_api_key            → （废弃，AI 不在当前范围）
openai_base_url           → （废弃）
openai_model              → （废弃）
ai_enabled                → （废弃）
ai_summary                → （废弃）
ai_rename                 → （废弃）
ai_tagging                → （废弃）
```

新 `config.json` 格式：

```json
{
  "watch_paths": ["C:\\Users\\F\\Documents\\WeChat Files"],
  "watch_extensions": [".docx", ".doc", ".pdf", ".pptx", ".ppt", ".xlsx", ".xls", ".txt", ".zip", ".rar"],
  "notify_on_new_file": true,
  "theme": "dark",
  "auto_start": false
}
```

首次启动时，Rust 后端检测旧格式并自动迁移。

## 8. 数据流

### 8.1 启动流

1. Tauri 启动，Rust 后端初始化
2. 加载配置（`config.json`）
3. 初始化 SQLite 数据库
4. 启动文件监听（notify）
5. 注册系统托盘
6. 注册全局快捷键 `Alt+F`
7. 前端加载，调用 `get_groups` 和 `get_files` 渲染界面

### 8.2 新文件流

1. notify 捕获文件创建/移动事件
2. Rust 过滤扩展名，规范化路径
3. 写入 SQLite（默认添加到"最近收到"分组）
4. 通过 Tauri event 推送到前端
5. 前端更新文件列表（带入场动画）

### 8.3 用户操作流

1. 用户点击文件 → 前端调用 `open_file` 命令 → Rust 用 `std::process::Command` 打开
2. 用户创建分组 → 前端调用 `create_group` → Rust 写入 SQLite → 前端刷新列表
3. 用户删除文件映射 → 前端调用 `remove_file` → Rust 删除记录 → 前端播放退出动画

## 9. 错误处理

- 文件监听失败：记录日志，不崩溃，尝试重新监听
- SQLite 操作失败：返回错误信息到前端，前端显示 toast 提示
- 文件打开失败：前端显示"文件不存在或已被移动"提示
- 配置读写失败：使用默认配置，记录日志

## 10. 测试策略

### 10.1 Rust 测试

- `storage.rs`：SQLite CRUD 操作，使用内存数据库
- `watcher.rs`：事件过滤、路径规范化，使用临时目录
- `config.rs`：配置加载、保存、默认值

### 10.2 前端测试

- 组件渲染测试（React Testing Library）
- Hook 测试
- 用户交互测试

### 10.3 命令基线

```bash
# Rust 测试
cd filebox/src-tauri && cargo test

# 前端测试
cd filebox && npm test

# 类型检查
cd filebox && npm run typecheck

# Lint
cd filebox && npm run lint
```

## 11. 里程碑

### Phase 1: 骨架搭建

- Tauri 项目初始化
- React + TailwindCSS + Framer Motion 配置
- 基础窗口行为（展开/收起/边缘吸附）
- 毛玻璃背景 + 暗色主题

### Phase 2: 核心功能

- Rust 后端：SQLite 存储 + 文件监听
- 前端：分组管理 + 文件列表
- 前后端通信打通
- 文件操作（打开、移除）

### Phase 3: 视觉打磨

- 亮色主题
- 动画细节（spring 动画、stagger、crossfade）
- 文件类型图标映射
- 空态、加载态

### Phase 4: 系统集成

- 系统托盘
- 全局快捷键
- 开机自启动（可选）
- 配置持久化

### Phase 5: 测试与发布

- Rust 单元测试
- 前端组件测试
- 性能优化
- 清理旧代码
- 打包发布

## 12. 旧代码清理

重构完成后，删除以下文件/目录：

- `main.py`（旧入口）
- `src/`（旧 Python 源码）
- `requirements.txt`（旧依赖）
- `filebox-app/`（空的 Electron 项目）
- `filebox.db`（旧数据库，迁移数据后）
- `.mypy_cache/`、`.pytest_cache/`、`.ruff_cache/`、`__pycache__/`
- `tests/`（旧测试）
- `AGENTS.md`（更新为新项目结构）

保留：

- `config.json`（迁移为新格式）
- `docs/`（保留设计文档）
- `.git/`（版本历史）
- `.gitignore`（更新内容）

## 13. 验收标准

- 窗口展开/收起动画流畅，无卡顿
- 毛玻璃效果在 Windows 10/11 上正常显示
- 边缘吸附和鼠标触发正常工作
- 文件监听可靠，新文件 1s 内出现在列表
- 分组 CRUD 操作正常
- 主题切换有 crossfade 动画
- 全局快捷键 `Alt+F` 响应迅速
- 包体 < 10MB，内存占用 < 60MB
- 所有测试通过
- 旧代码已清理
