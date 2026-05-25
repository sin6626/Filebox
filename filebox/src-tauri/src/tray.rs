use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_i])?;
    let last_size: Mutex<Option<(u32, u32)>> = Mutex::new(None);

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("FileBox")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        if let Ok(size) = window.inner_size() {
                            if let Ok(mut s) = last_size.lock() {
                                *s = Some((size.width, size.height));
                            }
                        }
                        window.hide().ok();
                    } else {
                        window.show().ok();
                        window.set_focus().ok();
                        if let Ok(s) = last_size.lock() {
                            if let Some((w, h)) = *s {
                                let _ = window.set_size(tauri::PhysicalSize::<u32>::new(w, h));
                            }
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
