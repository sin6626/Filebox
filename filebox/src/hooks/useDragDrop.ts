import { useState, useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export function useDragDrop(onDrop: (paths: string[]) => void) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      switch (event.payload.type) {
        case "enter":
          setIsDraggingOver(true);
          break;
        case "over":
          setIsDraggingOver(true);
          break;
        case "leave":
          setIsDraggingOver(false);
          break;
        case "drop":
          setIsDraggingOver(false);
          if (event.payload.paths.length > 0) {
            onDrop(event.payload.paths);
          }
          break;
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onDrop]);

  return { isDraggingOver };
}
