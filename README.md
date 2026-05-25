# FileBox

一个 macOS 风格的 Windows 桌面文件收纳工具，自动收集和管理聊天软件接收的文件。

## ✨ 功能特性

- 📁 **智能文件监听** - 自动监听微信、QQ 等聊天软件的文件接收目录
- 🎨 **macOS 风格 UI** - 毛玻璃效果、圆角卡片、交通灯按钮
- 📌 **边缘吸附** - 窗口自动吸附屏幕边缘，拖拽边缘展开/收起
- ⌨️ **全局快捷键** - `Alt+F` 快速切换窗口显示/隐藏
- 🗂️ **分组管理** - 支持创建多个分组，分类管理文件
- 🎯 **拖拽添加** - 直接拖拽文件到窗口即可添加到当前分组
- 🌙 **双主题支持** - 暗色/亮色主题无缝切换，肉色暖色调
- 📦 **丰富格式** - 支持文档、表格、演示文稿、压缩包等多种格式
- 💾 **系统托盘** - 最小化到托盘，常驻后台不占任务栏

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri 2 | 轻量级跨平台桌面应用 |
| 后端 | Rust | 高性能文件监听、SQLite 存储 |
| 前端 | React 19 + TypeScript | 现代化 UI 开发 |
| 样式 | TailwindCSS 4 | 原子化 CSS 框架 |
| 图标 | Lucide Icons | 精美线条图标库 |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Rust (rustup)
- Windows 10/11

### 安装依赖

```bash
cd filebox
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布版

```bash
npm run tauri build
```

## 📁 项目结构

```
filebox/
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs         # 入口
│   │   ├── lib.rs          # Tauri 命令
│   │   ├── storage.rs      # SQLite 存储
│   │   ├── watcher.rs      # 文件监听
│   │   ├── config.rs       # 配置管理
│   │   └── tray.rs         # 系统托盘
│   └── tauri.conf.json     # Tauri 配置
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具函数
│   └── styles/             # 全局样式
└── package.json
```

## ⚙️ 配置

首次启动会自动创建配置文件，位于：

```
%LOCALAPPDATA%/filebox/config.json
```

可配置项：
- `watch_paths` - 监听的文件目录
- `watch_extensions` - 监听的文件扩展名
- `notify_on_new_file` - 新文件到达通知
- `theme` - 主题 (dark/light)

## 📝 开发命令

```bash
# 前端开发
npm run dev          # 启动 Vite 开发服务器

# Tauri 开发
npm run tauri dev    # 启动完整 Tauri 应用

# 构建
npm run build        # 构建前端
npm run tauri build  # 构建安装包

# 代码检查
npm run lint         # ESLint 检查
cargo check          # Rust 检查
cargo test           # Rust 测试
```

## 📄 License

MIT
