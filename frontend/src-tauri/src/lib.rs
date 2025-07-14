mod credentials;
mod shortcuts;

use credentials::CredentialStore;
use shortcuts::init_shortcuts;

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
            credentials::test_keychain_access,
            shortcuts::register_global_shortcut,
            shortcuts::unregister_global_shortcut,
            shortcuts::handle_shortcut_pressed,
        ])
        .setup(|app| {
            // Enable logging in both debug and release modes
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log::LevelFilter::Info)
                    .build(),
            )?;

            println!("Chat App starting up...");

            // Initialize shortcuts
            if let Err(e) = init_shortcuts() {
                eprintln!("Failed to initialize shortcuts: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
