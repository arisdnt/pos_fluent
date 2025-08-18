// ======================================================================
// WATCHDOG
// Memantau kesehatan server dan melakukan restart otomatis jika diperlukan
// ======================================================================

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    sync::{Mutex, RwLock},
    task::JoinHandle,
    time::{interval, sleep, timeout},
};

// ======================================================================
// TYPES
// ======================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WatchdogStatus {
    Stopped,
    Running {
        target_port: u16,
        checks_performed: u64,
        last_check: Option<String>,
        consecutive_failures: u32,
        uptime: u64,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub success: bool,
    pub response_time_ms: u64,
    pub status_code: Option<u16>,
    pub error: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Clone)]
struct WatchdogConfig {
    pub check_interval: Duration,
    pub timeout_duration: Duration,
    pub max_consecutive_failures: u32,
    pub restart_delay: Duration,
    pub health_endpoint: String,
}

impl Default for WatchdogConfig {
    fn default() -> Self {
        Self {
            check_interval: Duration::from_secs(10),
            timeout_duration: Duration::from_secs(5),
            max_consecutive_failures: 3,
            restart_delay: Duration::from_secs(5),
            health_endpoint: "/api/health".to_string(),
        }
    }
}

#[derive(Debug)]
struct WatchdogState {
    target_port: u16,
    checks_performed: u64,
    consecutive_failures: u32,
    last_check_result: Option<HealthCheckResult>,
    started_at: Instant,
    is_running: bool,
}

// ======================================================================
// WATCHDOG
// ======================================================================

pub struct Watchdog {
    state: Arc<RwLock<Option<WatchdogState>>>,
    task_handle: Arc<Mutex<Option<JoinHandle<()>>>>,
    config: WatchdogConfig,
    restart_callback: Option<Arc<dyn Fn() + Send + Sync>>,
}

impl Watchdog {
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(None)),
            task_handle: Arc::new(Mutex::new(None)),
            config: WatchdogConfig::default(),
            restart_callback: None,
        }
    }
    
    pub fn with_config(config: WatchdogConfig) -> Self {
        Self {
            state: Arc::new(RwLock::new(None)),
            task_handle: Arc::new(Mutex::new(None)),
            config,
            restart_callback: None,
        }
    }
    
    pub fn with_restart_callback<F>(mut self, callback: F) -> Self
    where
        F: Fn() + Send + Sync + 'static,
    {
        self.restart_callback = Some(Arc::new(callback));
        self
    }
    
    /// Start the watchdog
    pub async fn start(&mut self, target_port: u16) -> Result<()> {
        info!("Starting watchdog for port {}", target_port);
        
        // Check if already running
        {
            let state = self.state.read().await;
            if state.is_some() {
                return Err(anyhow!("Watchdog is already running"));
            }
        }
        
        // Initialize state
        {
            let mut state = self.state.write().await;
            *state = Some(WatchdogState {
                target_port,
                checks_performed: 0,
                consecutive_failures: 0,
                last_check_result: None,
                started_at: Instant::now(),
                is_running: true,
            });
        }
        
        // Start monitoring task
        let state_clone = Arc::clone(&self.state);
        let config = self.config.clone();
        let restart_callback = self.restart_callback.clone();
        
        let task = tokio::spawn(async move {
            Self::monitoring_loop(state_clone, config, restart_callback).await;
        });
        
        // Store task handle
        {
            let mut handle = self.task_handle.lock().await;
            *handle = Some(task);
        }
        
        info!("Watchdog started successfully");
        Ok(())
    }
    
    /// Stop the watchdog
    pub async fn stop(&mut self) -> Result<()> {
        info!("Stopping watchdog...");
        
        // Mark as not running
        {
            let mut state = self.state.write().await;
            if let Some(ref mut state) = state.as_mut() {
                state.is_running = false;
            }
        }
        
        // Cancel the task
        {
            let mut handle = self.task_handle.lock().await;
            if let Some(task) = handle.take() {
                task.abort();
                
                // Wait for task to finish (with timeout)
                match timeout(Duration::from_secs(5), task).await {
                    Ok(_) => debug!("Watchdog task finished gracefully"),
                    Err(_) => warn!("Watchdog task did not finish within timeout"),
                }
            }
        }
        
        // Clear state
        {
            let mut state = self.state.write().await;
            *state = None;
        }
        
        info!("Watchdog stopped");
        Ok(())
    }
    
    /// Get current status
    pub async fn get_status(&self) -> WatchdogStatus {
        let state = self.state.read().await;
        
        match state.as_ref() {
            Some(state) => {
                let uptime = state.started_at.elapsed().as_secs();
                let last_check = state.last_check_result.as_ref()
                    .map(|result| result.timestamp.clone());
                
                WatchdogStatus::Running {
                    target_port: state.target_port,
                    checks_performed: state.checks_performed,
                    last_check,
                    consecutive_failures: state.consecutive_failures,
                    uptime,
                }
            }
            None => WatchdogStatus::Stopped,
        }
    }
    
    /// Perform a single health check
    pub async fn perform_health_check(&self, port: u16) -> HealthCheckResult {
        let url = format!("http://localhost:{}{}", port, self.config.health_endpoint);
        let start_time = Instant::now();
        
        match timeout(self.config.timeout_duration, reqwest::get(&url)).await {
            Ok(Ok(response)) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                let status_code = response.status().as_u16();
                let success = response.status().is_success();
                
                HealthCheckResult {
                    success,
                    response_time_ms: response_time,
                    status_code: Some(status_code),
                    error: if success { None } else { Some(format!("HTTP {}", status_code)) },
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
            Ok(Err(e)) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                
                HealthCheckResult {
                    success: false,
                    response_time_ms: response_time,
                    status_code: None,
                    error: Some(e.to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
            Err(_) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                
                HealthCheckResult {
                    success: false,
                    response_time_ms: response_time,
                    status_code: None,
                    error: Some("Request timeout".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
        }
    }
    
    // ======================================================================
    // PRIVATE METHODS
    // ======================================================================
    
    async fn monitoring_loop(
        state: Arc<RwLock<Option<WatchdogState>>>,
        config: WatchdogConfig,
        restart_callback: Option<Arc<dyn Fn() + Send + Sync>>,
    ) {
        let mut interval = interval(config.check_interval);
        
        loop {
            interval.tick().await;
            
            // Check if we should continue running
            let (should_continue, target_port) = {
                let state_guard = state.read().await;
                match state_guard.as_ref() {
                    Some(state) => (state.is_running, state.target_port),
                    None => (false, 0),
                }
            };
            
            if !should_continue {
                debug!("Watchdog monitoring loop stopping");
                break;
            }
            
            // Perform health check
            let health_result = Self::perform_health_check_static(target_port, &config).await;
            
            debug!("Health check result: success={}, response_time={}ms", 
                   health_result.success, health_result.response_time_ms);
            
            // Update state
            {
                let mut state_guard = state.write().await;
                if let Some(ref mut state) = state_guard.as_mut() {
                    state.checks_performed += 1;
                    state.last_check_result = Some(health_result.clone());
                    
                    if health_result.success {
                        // Reset failure counter on success
                        if state.consecutive_failures > 0 {
                            info!("Server recovered after {} failures", state.consecutive_failures);
                            state.consecutive_failures = 0;
                        }
                    } else {
                        // Increment failure counter
                        state.consecutive_failures += 1;
                        warn!("Health check failed ({}/{} consecutive failures): {}", 
                              state.consecutive_failures, 
                              config.max_consecutive_failures,
                              health_result.error.as_deref().unwrap_or("Unknown error"));
                        
                        // Check if we should trigger restart
                        if state.consecutive_failures >= config.max_consecutive_failures {
                            error!("Maximum consecutive failures reached, triggering restart");
                            
                            // Call restart callback if available
                            if let Some(callback) = &restart_callback {
                                callback();
                            }
                            
                            // Reset failure counter to prevent immediate re-triggering
                            state.consecutive_failures = 0;
                            
                            // Wait before next check to allow restart to complete
                            sleep(config.restart_delay).await;
                        }
                    }
                }
            }
        }
        
        info!("Watchdog monitoring loop ended");
    }
    
    async fn perform_health_check_static(port: u16, config: &WatchdogConfig) -> HealthCheckResult {
        let url = format!("http://localhost:{}{}", port, config.health_endpoint);
        let start_time = Instant::now();
        
        match timeout(config.timeout_duration, reqwest::get(&url)).await {
            Ok(Ok(response)) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                let status_code = response.status().as_u16();
                let success = response.status().is_success();
                
                HealthCheckResult {
                    success,
                    response_time_ms: response_time,
                    status_code: Some(status_code),
                    error: if success { None } else { Some(format!("HTTP {}", status_code)) },
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
            Ok(Err(e)) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                
                HealthCheckResult {
                    success: false,
                    response_time_ms: response_time,
                    status_code: None,
                    error: Some(e.to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
            Err(_) => {
                let response_time = start_time.elapsed().as_millis() as u64;
                
                HealthCheckResult {
                    success: false,
                    response_time_ms: response_time,
                    status_code: None,
                    error: Some("Request timeout".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            }
        }
    }
}

// ======================================================================
// DROP IMPLEMENTATION
// ======================================================================

impl Drop for Watchdog {
    fn drop(&mut self) {
        // Ensure task is cancelled when watchdog is dropped
        if let Ok(mut handle) = self.task_handle.try_lock() {
            if let Some(task) = handle.take() {
                task.abort();
            }
        }
    }
}