# File List Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create FileItem, FileList, EmptyState components and utility functions for displaying files in the sidebar.

**Architecture:** Implement utility functions for file icons and time formatting, then create React components for displaying file lists with animations. Update the Sidebar to integrate the new FileList component.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React

---

## File Structure

### New Files
- `filebox/src/lib/icons.ts` - File extension to icon/color mapping
- `filebox/src/lib/time.ts` - Relative time formatting
- `filebox/src/components/FileItem.tsx` - Individual file item component
- `filebox/src/components/EmptyState.tsx` - Empty state display
- `filebox/src/components/FileList.tsx` - File list container with animations

### Modified Files
- `filebox/src/components/Sidebar.tsx:45` - Replace children with FileList
- `filebox/src/App.tsx:7-10` - Remove placeholder content

---

## Task 1: Create Icons Utility

**Files:**
- Create: `filebox/src/lib/icons.ts`

- [ ] **Step 1: Create icons utility file**

```typescript
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  File,
  type LucideIcon,
} from "lucide-react";

interface IconInfo {
  icon: LucideIcon;
  color: string;
}

const extensionMap: Record<string, IconInfo> = {
  ".pdf": { icon: FileText, color: "#E74C3C" },
  ".doc": { icon: FileText, color: "#3498DB" },
  ".docx": { icon: FileText, color: "#3498DB" },
  ".xls": { icon: FileSpreadsheet, color: "#27AE60" },
  ".xlsx": { icon: FileSpreadsheet, color: "#27AE60" },
  ".ppt": { icon: Presentation, color: "#E67E22" },
  ".pptx": { icon: Presentation, color: "#E67E22" },
  ".txt": { icon: FileText, color: "#95A5A6" },
  ".zip": { icon: Archive, color: "#8E44AD" },
  ".rar": { icon: Archive, color: "#8E44AD" },
};

const defaultIcon: IconInfo = { icon: File, color: "#BDC3C7" };

export function getFileIcon(filename: string): IconInfo {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return extensionMap[ext] ?? defaultIcon;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add filebox/src/lib/icons.ts
git commit -m "feat: add file extension to icon mapping utility"
```

---

## Task 2: Create Time Utility

**Files:**
- Create: `filebox/src/lib/time.ts`

- [ ] **Step 1: Create time utility file**

```typescript
export function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;

  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "今天";
  if (date.toDateString() === yesterday.toDateString()) return "昨天";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add filebox/src/lib/time.ts
git commit -m "feat: add relative time formatting utility"
```

---

## Task 3: Create FileItem Component

**Files:**
- Create: `filebox/src/components/FileItem.tsx`

- [ ] **Step 1: Create FileItem component**

```typescript
import { motion } from "framer-motion";
import { FolderOpen, X } from "lucide-react";
import { useState } from "react";
import { getFileIcon } from "../lib/icons";
import { relativeTime } from "../lib/time";
import type { FileMapping } from "../lib/tauri";

interface FileItemProps {
  file: FileMapping;
  onOpen: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileItem({ file, onOpen, onRemove }: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { icon: Icon, color } = getFileIcon(file.file_name);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => onOpen(file.file_path)}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate">{file.file_name}</div>
        <div className="text-xs text-white/50">{relativeTime(file.added_at)}</div>
      </div>

      {isHovered && (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(file.file_path);
            }}
            className="p-1 rounded hover:bg-white/10"
          >
            <FolderOpen size={14} className="text-white/70" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file.id);
            }}
            className="p-1 rounded hover:bg-white/10"
          >
            <X size={14} className="text-white/70" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add filebox/src/components/FileItem.tsx
git commit -m "feat: add FileItem component with icons and animations"
```

---

## Task 4: Create EmptyState Component

**Files:**
- Create: `filebox/src/components/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState component**

```typescript
import { Inbox } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/50">
      <Inbox size={48} className="mb-4" />
      <p className="text-sm">暂无文件</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add filebox/src/components/EmptyState.tsx
git commit -m "feat: add EmptyState component"
```

---

## Task 5: Create FileList Component

**Files:**
- Create: `filebox/src/components/FileList.tsx`

- [ ] **Step 1: Create FileList component**

```typescript
import { AnimatePresence } from "framer-motion";
import { FileItem } from "./FileItem";
import { EmptyState } from "./EmptyState";
import type { FileMapping } from "../lib/tauri";

interface FileListProps {
  files: FileMapping[];
  onOpen: (path: string) => void;
  onRemove: (id: number) => void;
}

export function FileList({ files, onOpen, onRemove }: FileListProps) {
  if (files.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      <AnimatePresence>
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onOpen={onOpen}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add filebox/src/components/FileList.tsx
git commit -m "feat: add FileList component with AnimatePresence"
```

---

## Task 6: Update Sidebar to Use FileList

**Files:**
- Modify: `filebox/src/components/Sidebar.tsx:45`
- Modify: `filebox/src/App.tsx:7-10`

- [ ] **Step 1: Update Sidebar component**

Replace line 45 in `filebox/src/components/Sidebar.tsx`:

```typescript
      <div className="flex-1 overflow-hidden">{children}</div>
```

With:

```typescript
      <div className="flex-1 overflow-hidden">
        <FileList
          files={files}
          onOpen={(path) => console.log("Open:", path)}
          onRemove={removeFile}
        />
      </div>
```

Also add the import at the top:

```typescript
import { FileList } from "./FileList";
```

And update the useFiles hook usage to include removeFile:

```typescript
  const { files, removeFile } = useFiles(selectedId);
```

- [ ] **Step 2: Update App.tsx to remove placeholder content**

Replace the App component in `filebox/src/App.tsx`:

```typescript
import { Sidebar } from "./components/Sidebar";

function App() {
  return (
    <div className="w-screen h-screen p-2">
      <Sidebar />
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npm run build` from `filebox/` directory
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add filebox/src/components/Sidebar.tsx filebox/src/App.tsx
git commit -m "feat: integrate FileList into Sidebar component"
```

---

## Task 7: Final Verification and Commit

- [ ] **Step 1: Run full build verification**

Run: `npm run build` from `filebox/` directory
Expected: Successful build with no errors

- [ ] **Step 2: Run linting**

Run: `npm run lint` from `filebox/` directory
Expected: No linting errors

- [ ] **Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: implement file list components and utilities"
```

---

## Summary

This plan implements:
1. **Icons utility** - Maps file extensions to Lucide icons and colors
2. **Time utility** - Formats timestamps to relative time strings
3. **FileItem component** - Individual file display with hover actions
4. **EmptyState component** - Display when no files exist
5. **FileList component** - Container with animations
6. **Sidebar integration** - Connects FileList to existing file management

All components follow existing code patterns and use the established tech stack (React, TypeScript, Tailwind CSS, Framer Motion, Lucide React).
