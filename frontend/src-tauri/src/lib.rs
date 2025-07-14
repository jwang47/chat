mod credentials;
mod shortcuts;

use credentials::CredentialStore;
use shortcuts::{cleanup_global_shortcuts, setup_global_shortcuts};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(CredentialStore::new("com.chat.app".to_string()))
        .invoke_handler(tauri::generate_handler![
            credentials::get_api_key,
            credentials::set_api_key,
            credentials::remove_api_key,
            credentials::get_all_api_keys,
            credentials::clear_all_api_keys,
            credentials::has_api_key,
            credentials::has_any_api_key,
            shortcuts::register_shortcut,
            shortcuts::unregister_shortcut,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Setup global shortcuts (placeholder for now)
            if let Err(e) = setup_global_shortcuts(&app.handle()) {
                eprintln!("Failed to setup global shortcuts: {}", e);
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. } => {
                    // Cleanup global shortcuts when window is closed
                    if let Err(e) = cleanup_global_shortcuts(&window.app_handle()) {
                        eprintln!("Failed to cleanup global shortcuts: {}", e);
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
