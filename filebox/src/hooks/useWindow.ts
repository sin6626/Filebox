import { useState, useCallback, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { currentMonitor } from "@tauri-apps/api/window";

export type WindowState = "expanded" | "collapsed";
export type TransitionPhase = "idle" | "collapsing" | "expanding";
export type ResizeSource = "button" | "resize";

const DEFAULT_WIDTH = 360;
const EXPANDED_HEIGHT = 600;
const COLLAPSED_HEIGHT = 44;

export function useWindow() {
  const [state, setState] = useState<WindowState>("expanded");
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [resizeSource, setResizeSource] = useState<ResizeSource>("button");
  const lockRef = useRef(false);
  const savedWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    const win = getCurrentWindow();
    const unlisten = win.onResized(() => {
      if (lockRef.current) return;
      win.innerSize().then((size) => {
        const newState = size.height <= 50 ? "collapsed" : "expanded";
        setResizeSource("resize");
        setState(newState);
        // 始终记住宽度，无论展开还是折叠状态
        savedWidthRef.current = size.width;
      });
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const expand = useCallback(async () => {
    if (lockRef.current) return;
    try {
      lockRef.current = true;
      setResizeSource("button");
      setPhase("expanding");

      const win = getCurrentWindow();
      const monitor = await currentMonitor();

      const windowWidth = savedWidthRef.current;

      if (monitor) {
        const screenWidth = monitor.size.width;
        const screenHeight = monitor.size.height;
        const monitorX = monitor.position.x;
        const monitorY = monitor.position.y;

        const x = monitorX + screenWidth - windowWidth - 20;
        const y = monitorY + Math.round((screenHeight - EXPANDED_HEIGHT) / 2);

        await win.setSize(new PhysicalSize(windowWidth, EXPANDED_HEIGHT));
        await win.setPosition(new PhysicalPosition(x, y));
      } else {
        await win.setSize(new PhysicalSize(windowWidth, EXPANDED_HEIGHT));
      }

      setState("expanded");
      await win.setFocus();
    } catch (e) {
      console.error("Failed to expand window:", e);
      setState("expanded");
    } finally {
      lockRef.current = false;
      setTimeout(() => setPhase("idle"), 300);
    }
  }, []);

  const collapse = useCallback(async () => {
    if (lockRef.current) return;
    try {
      lockRef.current = true;
      setResizeSource("button");
      setPhase("collapsing");

      const win = getCurrentWindow();
      const monitor = await currentMonitor();

      // 保存当前宽度供展开时使用
      const currentSize = await win.innerSize();
      savedWidthRef.current = currentSize.width;

      const windowWidth = currentSize.width;

      if (monitor) {
        const screenWidth = monitor.size.width;
        const monitorX = monitor.position.x;
        const monitorY = monitor.position.y;

        const x = monitorX + Math.round((screenWidth - windowWidth) / 2);
        const y = monitorY + 8;

        await win.setSize(new PhysicalSize(windowWidth, COLLAPSED_HEIGHT));
        await win.setPosition(new PhysicalPosition(x, y));
      } else {
        await win.setSize(new PhysicalSize(windowWidth, COLLAPSED_HEIGHT));
      }

      setState("collapsed");
    } catch (e) {
      console.error("Failed to collapse window:", e);
      setState("collapsed");
    } finally {
      lockRef.current = false;
      setTimeout(() => setPhase("idle"), 300);
    }
  }, []);

  const hide = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      await win.hide();
    } catch (e) {
      console.error("Failed to hide window:", e);
    }
  }, []);

  const close = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (e) {
      console.error("Failed to close window:", e);
    }
  }, []);

  return { state, phase, resizeSource, expand, collapse, hide, close };
}
