import { useEffect } from "react";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Sidebar } from "./components/Sidebar";

function App() {
  useEffect(() => {
    register("Alt+F", async () => {
      const win = getCurrentWindow();
      const visible = await win.isVisible();
      if (visible) {
        await win.hide();
      } else {
        await win.show();
        await win.setFocus();
      }
    });
  }, []);

  return (
    <div className="w-screen h-screen">
      <Sidebar />
    </div>
  );
}

export default App;
