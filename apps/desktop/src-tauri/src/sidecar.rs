// ======================================================================
// SIDECAR MANAGER
// Mengelola server Next.js sebagai sidecar process
// ======================================================================

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    sync::Mutex,
    time::{sleep, timeout},
};

// ======================================================================
// TYPES
// ======================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SidecarStatus {
    Stopped,
    Starting,
    Running { port: u16, pid: u32, uptime: u64 },
    Stopping,
    Error { message: String },
}

#[derive(Debug)]
struct SidecarProcess {
    child: Child,
    port: u16,
    started_at: Instant,
}

// ======================================================================
// SIDECAR MANAGER
// ======================================================================

pub struct SidecarManager {
    process: Arc<Mutex<Option<SidecarProcess>>>,
    status: Arc<Mutex<SidecarStatus>>,
    config: SidecarConfig,
}

#[derive(Debug, Clone)]
struct SidecarConfig {
    pub executable_path: PathBuf,
    pub working_dir: PathBuf,
    pub port_range: (u16, u16),
    pub startup_timeout: Duration,
    pub health_check_interval: Duration,
    pub max_restart_attempts: u32,
}

impl Default for SidecarConfig {
    fn default() -> Self {
        Self {
            executable_path: PathBuf::from("node"),
            working_dir: PathBuf::from("../web"),
            port_range: (3000, 4000),
            startup_timeout: Duration::from_secs(30),
            health_check_interval: Duration::from_secs(5),
            max_restart_attempts: 3,
        }
    }
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(SidecarStatus::Stopped)),
            config: SidecarConfig::default(),
        }
    }
    
    pub fn with_config(config: SidecarConfig) -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(SidecarStatus::Stopped)),
            config,
        }
    }
    
    /// Start the sidecar server
    pub async fn start(&mut self) -> Result<u16> {
        info!("Starting sidecar server...");
        
        // Check if already running
        {
            let status = self.status.lock().await;
            if let SidecarStatus::Running { .. } = *status {
                return Err(anyhow!("Sidecar is already running"));
            }
        }
        
        // Update status to starting
        {
            let mut status = self.status.lock().await;
            *status = SidecarStatus::Starting;
        }
        
        // Find available port
        let port = self.find_available_port().await
            .ok_or_else(|| anyhow!("No available port found in range {:?}", self.config.port_range))?;
        
        info!("Using port {} for sidecar server", port);
        
        // Start the process
        match self.spawn_process(port).await {
            Ok(child) => {
                let pid = child.id();
                info!("Sidecar process started with PID: {}", pid);
                
                // Store the process
                {
                    let mut process = self.process.lock().await;
                    *process = Some(SidecarProcess {
                        child,
                        port,
                        started_at: Instant::now(),
                    });
                }
                
                // Wait for server to be ready
                match self.wait_for_ready(port).await {
                    Ok(_) => {
                        info!("Sidecar server is ready on port {}", port);
                        
                        // Update status to running
                        {
                            let mut status = self.status.lock().await;
                            *status = SidecarStatus::Running {
                                port,
                                pid,
                                uptime: 0,
                            };
                        }
                        
                        Ok(port)
                    }
                    Err(e) => {
                        error!("Sidecar server failed to start: {}", e);
                        
                        // Kill the process
                        self.kill_process().await;
                        
                        // Update status to error
                        {
                            let mut status = self.status.lock().await;
                            *status = SidecarStatus::Error {
                                message: format!("Failed to start: {}", e),
                            };
                        }
                        
                        Err(e)
                    }
                }
            }
            Err(e) => {
                error!("Failed to spawn sidecar process: {}", e);
                
                // Update status to error
                {
                    let mut status = self.status.lock().await;
                    *status = SidecarStatus::Error {
                        message: format!("Failed to spawn: {}", e),
                    };
                }
                
                Err(e)
            }
        }
    }
    
    /// Stop the sidecar server
    pub async fn stop(&mut self) -> Result<()> {
        info!("Stopping sidecar server...");
        
        // Update status to stopping
        {
            let mut status = self.status.lock().await;
            *status = SidecarStatus::Stopping;
        }
        
        // Kill the process
        self.kill_process().await;
        
        // Update status to stopped
        {
            let mut status = self.status.lock().await;
            *status = SidecarStatus::Stopped;
        }
        
        info!("Sidecar server stopped");
        Ok(())
    }
    
    /// Restart the sidecar server
    pub async fn restart(&mut self) -> Result<u16> {
        info!("Restarting sidecar server...");
        
        // Stop first
        self.stop().await?;
        
        // Wait a bit
        sleep(Duration::from_millis(1000)).await;
        
        // Start again
        self.start().await
    }
    
    /// Get current status
    pub async fn get_status(&self) -> SidecarStatus {
        let status = self.status.lock().await;
        
        // Update uptime if running
        if let SidecarStatus::Running { port, pid, .. } = *status {
            if let Some(process) = self.process.lock().await.as_ref() {
                let uptime = process.started_at.elapsed().as_secs();
                return SidecarStatus::Running { port, pid, uptime };
            }
        }
        
        status.clone()
    }
    
    /// Get the current port (if running)
    pub fn get_port(&self) -> Option<u16> {
        // This is a synchronous method for convenience
        // In a real implementation, you might want to store the port separately
        None // Placeholder - would need async access to get the actual port
    }
    
    /// Check if the server is healthy
    pub async fn health_check(&self) -> bool {
        if let Some(process) = self.process.lock().await.as_ref() {
            self.check_server_health(process.port).await
        } else {
            false
        }
    }
    
    // ======================================================================
    // PRIVATE METHODS
    // ======================================================================
    
    async fn find_available_port(&self) -> Option<u16> {
        for port in self.config.port_range.0..=self.config.port_range.1 {
            if crate::utils::is_port_available(port).await {
                return Some(port);
            }
        }
        None
    }
    
    async fn spawn_process(&self, port: u16) -> Result<Child> {
        debug!("Spawning sidecar process on port {}", port);
        
        // Determine if we're in development or production
        let is_dev = cfg!(debug_assertions);
        
        let mut cmd = if is_dev {
            // Development: use npm run dev
            let mut cmd = Command::new("npm");
            cmd.args(["run", "dev"])
                .current_dir(&self.config.working_dir)
                .env("PORT", port.to_string())
                .env("NODE_ENV", "development")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            cmd
        } else {
            // Production: use npm start (assumes build is already done)
            let mut cmd = Command::new("npm");
            cmd.args(["start"])
                .current_dir(&self.config.working_dir)
                .env("PORT", port.to_string())
                .env("NODE_ENV", "production")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped());
            cmd
        };
        
        // Additional environment variables
        cmd.env("FORCE_COLOR", "0") // Disable colors in output
            .env("CI", "true"); // Prevent interactive prompts
        
        let child = cmd.spawn()
            .map_err(|e| anyhow!("Failed to spawn process: {}", e))?;
        
        Ok(child)
    }
    
    async fn wait_for_ready(&self, port: u16) -> Result<()> {
        info!("Waiting for sidecar server to be ready on port {}...", port);
        
        let start_time = Instant::now();
        let timeout_duration = self.config.startup_timeout;
        
        while start_time.elapsed() < timeout_duration {
            if self.check_server_health(port).await {
                return Ok(());
            }
            
            sleep(Duration::from_millis(500)).await;
        }
        
        Err(anyhow!("Timeout waiting for server to be ready"))
    }
    
    async fn check_server_health(&self, port: u16) -> bool {
        let url = format!("http://localhost:{}/api/health", port);
        
        match timeout(Duration::from_secs(2), reqwest::get(&url)).await {
            Ok(Ok(response)) => {
                response.status().is_success()
            }
            Ok(Err(e)) => {
                debug!("Health check failed: {}", e);
                false
            }
            Err(_) => {
                debug!("Health check timeout");
                false
            }
        }
    }
    
    async fn kill_process(&mut self) {
        let mut process_guard = self.process.lock().await;
        
        if let Some(mut process) = process_guard.take() {
            info!("Killing sidecar process with PID: {}", process.child.id());
            
            // Try graceful shutdown first
            if let Err(e) = process.child.kill() {
                warn!("Failed to kill process gracefully: {}", e);
            }
            
            // Wait for process to exit
            match process.child.wait() {
                Ok(status) => {
                    info!("Sidecar process exited with status: {}", status);
                }
                Err(e) => {
                    warn!("Error waiting for process to exit: {}", e);
                }
            }
        }
    }
}

// ======================================================================
// DROP IMPLEMENTATION
// ======================================================================

impl Drop for SidecarManager {
    fn drop(&mut self) {
        // Ensure process is killed when manager is dropped
        // Note: This is synchronous, so we can't use the async kill_process method
        if let Ok(mut process_guard) = self.process.try_lock() {
            if let Some(mut process) = process_guard.take() {
                let _ = process.child.kill();
                let _ = process.child.wait();
            }
        }
    }
}