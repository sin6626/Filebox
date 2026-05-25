# FileBox v2

A Windows desktop helper for collecting incoming chat files. Built with Tauri 2, React, TypeScript, TailwindCSS, and Framer Motion.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4 + Framer Motion
- **Desktop**: Tauri 2
- **Icons**: Lucide React

## Development

### Prerequisites

- Node.js 18+
- Rust 1.77.2+
- Windows 10/11

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Tauri development (desktop window)
npm run tauri dev
```

### Build

```bash
# Build frontend
npm run build

# Build Tauri application
npm run tauri build
```

### Linting

```bash
npm run lint
```

## Project Structure

```
filebox/
├── src/                    # React frontend
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Entry point
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/               # Rust source code
│   ├── tauri.conf.json    # Tauri configuration
│   └── Cargo.toml         # Rust dependencies
├── public/                # Static assets
└── package.json           # Node.js dependencies
```

## Configuration

The application window is configured as:
- **Size**: 360x600 pixels
- **Decorations**: None (frameless)
- **Transparent**: Yes
- **Always on Top**: Yes
- **Resizable**: No
