// ======================================================================
// TAURI COMMANDS
// Implementasi command handlers untuk komunikasi frontend-backend
// ======================================================================

use crate::{AppState, sidecar::SidecarStatus, system::SystemInfo, watchdog::WatchdogStatus};
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{command, AppHandle, Manager, State};

// ======================================================================
// TYPES
// ======================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub auto_start: bool,
    pub minimize_to_tray: bool,
    pub start_minimized: bool,
    pub server_port: Option<u16>,
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
    pub auto_update: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            auto_start: true,
            minimize_to_tray: true,
            start_minimized: false,
            server_port: None,
            theme: "light".to_string(),
            language: "id".to_string(),
            notifications_enabled: true,
            auto_update: true,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CommandResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResult<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

// ======================================================================
// SIDECAR COMMANDS
// ======================================================================

#[command]
pub async fn start_sidecar(state: State<'_, AppState>) -> Result<CommandResult<String>, String> {
    info!("Command: start_sidecar");
    
    let mut sidecar = state.sidecar_manager.lock().await;
    
    match sidecar.start().await {
        Ok(port) => {
            let url = format!("http://localhost:{}", port);
            info!("Sidecar started on port {}", port);
            Ok(CommandResult::success(url))
        }
        Err(e) => {
            error!("Failed to start sidecar: {}", e);
            Ok(CommandResult::error(e.to_string()))
        }
    }
}

#[command]
pub async fn stop_sidecar(state: State<'_, AppState>) -> Result<CommandResult<()>, String> {
    info!("Command: stop_sidecar");
    
    let mut sidecar = state.sidecar_manager.lock().await;
    
    match sidecar.stop().await {
        Ok(_) => {
            info!("Sidecar stopped successfully");
            Ok(CommandResult::success(()))
        }
        Err(e) => {
            error!("Failed to stop sidecar: {}", e);
            Ok(CommandResult::error(e.to_string()))
        }
    }
}

#[command]
pub async fn restart_sidecar(state: State<'_, AppState>) -> Result<CommandResult<String>, String> {
    info!("Command: restart_sidecar");
    
    let mut sidecar = state.sidecar_manager.lock().await;
    
    match sidecar.restart().await {
        Ok(port) => {
            let url = format!("http://localhost:{}", port);
            info!("Sidecar restarted on port {}", port);
            Ok(CommandResult::success(url))
        }
        Err(e) => {
            error!("Failed to restart sidecar: {}", e);
            Ok(CommandResult::error(e.to_string()))
        }
    }
}

#[command]
pub async fn get_sidecar_status(state: State<'_, AppState>) -> Result<CommandResult<SidecarStatus>, String> {
    let sidecar = state.sidecar_manager.lock().await;
    let status = sidecar.get_status().await;
    Ok(CommandResult::success(status))
}

// ======================================================================
// SYSTEM COMMANDS
// ======================================================================

#[command]
pub async fn get_system_info(state: State<'_, AppState>) -> Result<CommandResult<SystemInfo>, String> {
    let system_info = state.system_info.lock().await;
    let info = system_info.get_info().await;
    Ok(CommandResult::success(info))
}

#[command]
pub async fn check_port_availability(port: u16) -> Result<CommandResult<bool>, String> {
    let available = crate::utils::is_port_available(port).await;
    Ok(CommandResult::success(available))
}

#[command]
pub async fn get_available_port() -> Result<CommandResult<u16>, String> {
    match crate::utils::find_available_port(3000, 4000).await {
        Some(port) => Ok(CommandResult::success(port)),
        None => Ok(CommandResult::error("No available port found".to_string())),
    }
}

// ======================================================================
// WATCHDOG COMMANDS
// ======================================================================

#[command]
pub async fn start_watchdog(state: State<'_, AppState>, port: u16) -> Result<CommandResult<()>, String> {
    info!("Command: start_watchdog on port {}", port);
    
    let mut watchdog = state.watchdog.lock().await;
    
    match watchdog.start(port).await {
        Ok(_) => {
            info!("Watchdog started successfully");
            Ok(CommandResult::success(()))
        }
        Err(e) => {
            error!("Failed to start watchdog: {}", e);
            Ok(CommandResult::error(e.to_string()))
        }
    }
}

#[command]
pub async fn stop_watchdog(state: State<'_, AppState>) -> Result<CommandResult<()>, String> {
    info!("Command: stop_watchdog");
    
    let mut watchdog = state.watchdog.lock().await;
    
    match watchdog.stop().await {
        Ok(_) => {
            info!("Watchdog stopped successfully");
            Ok(CommandResult::success(()))
        }
        Err(e) => {
            error!("Failed to stop watchdog: {}", e);
            Ok(CommandResult::error(e.to_string()))
        }
    }
}

#[command]
pub async fn get_watchdog_status(state: State<'_, AppState>) -> Result<CommandResult<WatchdogStatus>, String> {
    let watchdog = state.watchdog.lock().await;
    let status = watchdog.get_status().await;
    Ok(CommandResult::success(status))
}

// ======================================================================
// UTILITY COMMANDS
// ======================================================================

#[command]
pub async fn show_notification(title: String, body: String, app_handle: AppHandle) -> Result<CommandResult<()>, String> {
    use tauri::api::notification::Notification;
    
    match Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(&title)
        .body(&body)
        .show()
    {
        Ok(_) => Ok(CommandResult::success(())),
        Err(e) => Ok(CommandResult::error(e.to_string())),
    }
}

#[command]
pub async fn open_external_url(url: String) -> Result<CommandResult<()>, String> {
    use tauri::api::shell;
    
    match shell::open(&url, None) {
        Ok(_) => Ok(CommandResult::success(())),
        Err(e) => Ok(CommandResult::error(e.to_string())),
    }
}

#[command]
pub async fn get_app_version() -> Result<CommandResult<String>, String> {
    let version = env!("CARGO_PKG_VERSION").to_string();
    Ok(CommandResult::success(version))
}

#[command]
pub async fn get_app_config() -> Result<CommandResult<AppConfig>, String> {
    // In a real app, this would load from a config file
    let config = AppConfig::default();
    Ok(CommandResult::success(config))
}

#[command]
pub async fn save_app_config(config: AppConfig) -> Result<CommandResult<()>, String> {
    // In a real app, this would save to a config file
    info!("Saving app config: {:?}", config);
    Ok(CommandResult::success(()))
}

// ======================================================================
// WINDOW COMMANDS
// ======================================================================

#[command]
pub async fn minimize_to_tray(app_handle: AppHandle) -> Result<CommandResult<()>, String> {
    if let Some(window) = app_handle.get_window("main") {
        match window.hide() {
            Ok(_) => Ok(CommandResult::success(())),
            Err(e) => Ok(CommandResult::error(e.to_string())),
        }
    } else {
        Ok(CommandResult::error("Main window not found".to_string()))
    }
}

#[command]
pub async fn show_from_tray(app_handle: AppHandle) -> Result<CommandResult<()>, String> {
    if let Some(window) = app_handle.get_window("main") {
        match window.show() {
            Ok(_) => {
                let _ = window.set_focus();
                Ok(CommandResult::success(()))
            }
            Err(e) => Ok(CommandResult::error(e.to_string())),
        }
    } else {
        Ok(CommandResult::error("Main window not found".to_string()))
    }
}

#[command]
pub async fn toggle_window_visibility(app_handle: AppHandle) -> Result<CommandResult<bool>, String> {
    if let Some(window) = app_handle.get_window("main") {
        match window.is_visible() {
            Ok(is_visible) => {
                if is_visible {
                    match window.hide() {
                        Ok(_) => Ok(CommandResult::success(false)),
                        Err(e) => Ok(CommandResult::error(e.to_string())),
                    }
                } else {
                    match window.show() {
                        Ok(_) => {
                            let _ = window.set_focus();
                            Ok(CommandResult::success(true))
                        }
                        Err(e) => Ok(CommandResult::error(e.to_string())),
                    }
                }
            }
            Err(e) => Ok(CommandResult::error(e.to_string())),
        }
    } else {
        Ok(CommandResult::error("Main window not found".to_string()))
    }
}