// ======================================================================
// APLIKASI DESKTOP TAURI - POS KASIR SUITE
// Entry point untuk aplikasi desktop dengan Next.js sidecar
// ======================================================================

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info, warn};
use std::sync::Arc;
use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};
use tokio::sync::Mutex;

mod commands;
mod sidecar;
mod system;
mod utils;
mod watchdog;

use commands::*;
use sidecar::SidecarManager;
use system::SystemInfo;
use watchdog::Watchdog;

// ======================================================================
// STATE MANAGEMENT
// ======================================================================

#[derive(Debug)]
pub struct AppState {
    pub sidecar_manager: Arc<Mutex<SidecarManager>>,
    pub watchdog: Arc<Mutex<Watchdog>>,
    pub system_info: Arc<Mutex<SystemInfo>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sidecar_manager: Arc::new(Mutex::new(SidecarManager::new())),
            watchdog: Arc::new(Mutex::new(Watchdog::new())),
            system_info: Arc::new(Mutex::new(SystemInfo::new())),
        }
    }
}

// ======================================================================
// SYSTEM TRAY
// ======================================================================

fn create_system_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Tampilkan POS Kasir");
    let hide = CustomMenuItem::new("hide".to_string(), "Sembunyikan");
    let restart = CustomMenuItem::new("restart".to_string(), "Restart Server");
    let quit = CustomMenuItem::new("quit".to_string(), "Keluar");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(restart)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_item(quit);
    
    SystemTray::new().with_menu(tray_menu)
}

fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            // Show main window on left click
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                "restart" => {
                    // Restart sidecar server
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app_handle.try_state::<AppState>() {
                            let mut sidecar = state.sidecar_manager.lock().await;
                            if let Err(e) = sidecar.restart().await {
                                error!("Failed to restart sidecar: {}", e);
                            }
                        }
                    });
                }
                "quit" => {
                    // Graceful shutdown
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app_handle.try_state::<AppState>() {
                            let mut sidecar = state.sidecar_manager.lock().await;
                            let _ = sidecar.stop().await;
                        }
                        app_handle.exit(0);
                    });
                }
                _ => {}
            }
        }
        _ => {}
    }
}

// ======================================================================
// MAIN FUNCTION
// ======================================================================

fn main() {
    // Initialize logger
    env_logger::Builder::from_default_env()
        .filter_level(if cfg!(debug_assertions) {
            log::LevelFilter::Debug
        } else {
            log::LevelFilter::Info
        })
        .init();
    
    info!("Starting POS Kasir Suite Desktop Application");
    
    // Create system tray
    let system_tray = create_system_tray();
    
    // Build Tauri application
    tauri::Builder::default()
        .manage(AppState::new())
        .system_tray(system_tray)
        .on_system_tray_event(handle_system_tray_event)
        .invoke_handler(tauri::generate_handler![
            // Sidecar commands
            start_sidecar,
            stop_sidecar,
            restart_sidecar,
            get_sidecar_status,
            
            // System commands
            get_system_info,
            check_port_availability,
            get_available_port,
            
            // Watchdog commands
            start_watchdog,
            stop_watchdog,
            get_watchdog_status,
            
            // Utility commands
            show_notification,
            open_external_url,
            get_app_version,
            get_app_config,
            save_app_config,
            
            // Window commands
            minimize_to_tray,
            show_from_tray,
            toggle_window_visibility
        ])
        .setup(|app| {
            let app_handle = app.handle();
            
            // Start sidecar server on app startup
            tauri::async_runtime::spawn(async move {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    let mut sidecar = state.sidecar_manager.lock().await;
                    
                    match sidecar.start().await {
                        Ok(_) => {
                            info!("Sidecar server started successfully");
                            
                            // Start watchdog
                            let mut watchdog = state.watchdog.lock().await;
                            if let Err(e) = watchdog.start(sidecar.get_port()).await {
                                warn!("Failed to start watchdog: {}", e);
                            }
                        }
                        Err(e) => {
                            error!("Failed to start sidecar server: {}", e);
                            
                            // Show error notification
                            if let Some(window) = app_handle.get_window("main") {
                                let _ = window.emit("sidecar-error", format!("Failed to start server: {}", e));
                            }
                        }
                    }
                }
            });
            
            Ok(())
        })
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Prevent window from closing, hide to tray instead
                    event.window().hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            match event {
                tauri::RunEvent::ExitRequested { api, .. } => {
                    // Graceful shutdown
                    let app_handle_clone = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Some(state) = app_handle_clone.try_state::<AppState>() {
                            info!("Shutting down application...");
                            
                            // Stop watchdog
                            let mut watchdog = state.watchdog.lock().await;
                            let _ = watchdog.stop().await;
                            
                            // Stop sidecar
                            let mut sidecar = state.sidecar_manager.lock().await;
                            let _ = sidecar.stop().await;
                            
                            info!("Application shutdown complete");
                        }
                    });
                    
                    // Prevent immediate exit to allow cleanup
                    api.prevent_exit();
                    
                    // Exit after a short delay
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        std::process::exit(0);
                    });
                }
                _ => {}
            }
        });
}