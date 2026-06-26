use tauri::Manager;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

// Global flag to allow closing the app
static ALLOW_CLOSE: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    ALLOW_CLOSE.store(true, Ordering::SeqCst);
    app.exit(0);
}

#[tauri::command]
fn enable_close() {
    ALLOW_CLOSE.store(true, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![exit_app, enable_close])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Desktop: auto-update + process (restart after install)
            #[cfg(desktop)]
            {
                app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }

            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            // Clone for the event handler
            let window_for_event = window.clone();

            // Clone for the background thread
            let window_for_thread = window.clone();

            // Set up focus event listener
            window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::Focused(focused) => {
                        if !focused {
                            // Re-focus and restore fullscreen when it loses focus
                            let _ = window_for_event.unminimize();
                            let _ = window_for_event.set_fullscreen(true);
                            let _ = window_for_event.set_focus();
                            let _ = window_for_event.set_always_on_top(true);
                        }
                    }
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        // Only allow close if explicitly permitted
                        if !ALLOW_CLOSE.load(Ordering::SeqCst) {
                            api.prevent_close();
                        }
                    }
                    _ => {}
                }
            });

            // Background thread to continuously monitor and restore window
            thread::spawn(move || {
                loop {
                    thread::sleep(Duration::from_millis(50));

                    // Check if window is minimized and restore it
                    if let Ok(minimized) = window_for_thread.is_minimized() {
                        if minimized {
                            let _ = window_for_thread.unminimize();
                            let _ = window_for_thread.set_fullscreen(true);
                            let _ = window_for_thread.set_focus();
                            let _ = window_for_thread.set_always_on_top(true);
                        }
                    }

                    // Check if window is not in fullscreen and restore it
                    if let Ok(fullscreen) = window_for_thread.is_fullscreen() {
                        if !fullscreen {
                            let _ = window_for_thread.set_fullscreen(true);
                        }
                    }

                    // Also check if window is focused
                    if let Ok(focused) = window_for_thread.is_focused() {
                        if !focused {
                            let _ = window_for_thread.unminimize();
                            let _ = window_for_thread.set_focus();
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
