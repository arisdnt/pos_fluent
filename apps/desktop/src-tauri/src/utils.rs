// ======================================================================
// UTILITIES
// Fungsi utilitas untuk aplikasi desktop Tauri
// ======================================================================

use log::{debug, warn};
use std::{
    net::{TcpListener, TcpStream},
    time::Duration,
};
use tokio::time::timeout;

// ======================================================================
// PORT UTILITIES
// ======================================================================

/// Check if a port is available for binding
pub async fn is_port_available(port: u16) -> bool {
    debug!("Checking if port {} is available", port);
    
    match TcpListener::bind(format!("127.0.0.1:{}", port)) {
        Ok(_) => {
            debug!("Port {} is available", port);
            true
        }
        Err(e) => {
            debug!("Port {} is not available: {}", port, e);
            false
        }
    }
}

/// Find an available port in the given range
pub async fn find_available_port(start: u16, end: u16) -> Option<u16> {
    debug!("Finding available port in range {}-{}", start, end);
    
    for port in start..=end {
        if is_port_available(port).await {
            debug!("Found available port: {}", port);
            return Some(port);
        }
    }
    
    warn!("No available port found in range {}-{}", start, end);
    None
}

/// Check if a service is running on a specific port
pub async fn is_service_running(port: u16) -> bool {
    debug!("Checking if service is running on port {}", port);
    
    match timeout(
        Duration::from_millis(1000),
        TcpStream::connect(format!("127.0.0.1:{}", port)),
    )
    .await
    {
        Ok(Ok(_)) => {
            debug!("Service is running on port {}", port);
            true
        }
        Ok(Err(e)) => {
            debug!("Service is not running on port {}: {}", port, e);
            false
        }
        Err(_) => {
            debug!("Timeout checking service on port {}", port);
            false
        }
    }
}

/// Get a list of available ports in a range
pub async fn get_available_ports(start: u16, end: u16, count: usize) -> Vec<u16> {
    debug!("Getting {} available ports in range {}-{}", count, start, end);
    
    let mut available_ports = Vec::new();
    
    for port in start..=end {
        if available_ports.len() >= count {
            break;
        }
        
        if is_port_available(port).await {
            available_ports.push(port);
        }
    }
    
    debug!("Found {} available ports", available_ports.len());
    available_ports
}

// ======================================================================
// PROCESS UTILITIES
// ======================================================================

/// Kill a process by PID (Windows-specific implementation)
#[cfg(target_os = "windows")]
pub fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    use std::process::Command;
    
    debug!("Killing process with PID: {}", pid);
    
    let output = Command::new("taskkill")
        .args(["/F", "/PID", &pid.to_string()])
        .output()
        .map_err(|e| format!("Failed to execute taskkill: {}", e))?;
    
    if output.status.success() {
        debug!("Successfully killed process {}", pid);
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        warn!("Failed to kill process {}: {}", pid, error);
        Err(format!("Failed to kill process: {}", error))
    }
}

/// Kill a process by PID (Unix-specific implementation)
#[cfg(not(target_os = "windows"))]
pub fn kill_process_by_pid(pid: u32) -> Result<(), String> {
    use std::process::Command;
    
    debug!("Killing process with PID: {}", pid);
    
    let output = Command::new("kill")
        .args(["-9", &pid.to_string()])
        .output()
        .map_err(|e| format!("Failed to execute kill: {}", e))?;
    
    if output.status.success() {
        debug!("Successfully killed process {}", pid);
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        warn!("Failed to kill process {}: {}", pid, error);
        Err(format!("Failed to kill process: {}", error))
    }
}

/// Find processes by name
#[cfg(target_os = "windows")]
pub fn find_processes_by_name(name: &str) -> Vec<u32> {
    use std::process::Command;
    
    debug!("Finding processes by name: {}", name);
    
    let output = match Command::new("tasklist")
        .args(["/FI", &format!("IMAGENAME eq {}", name), "/FO", "CSV"])
        .output()
    {
        Ok(output) => output,
        Err(e) => {
            warn!("Failed to execute tasklist: {}", e);
            return Vec::new();
        }
    };
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut pids = Vec::new();
    
    for line in stdout.lines().skip(1) {
        // Skip header line
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 2 {
            if let Ok(pid) = parts[1].trim_matches('"').parse::<u32>() {
                pids.push(pid);
            }
        }
    }
    
    debug!("Found {} processes with name {}", pids.len(), name);
    pids
}

/// Find processes by name (Unix implementation)
#[cfg(not(target_os = "windows"))]
pub fn find_processes_by_name(name: &str) -> Vec<u32> {
    use std::process::Command;
    
    debug!("Finding processes by name: {}", name);
    
    let output = match Command::new("pgrep").arg(name).output() {
        Ok(output) => output,
        Err(e) => {
            warn!("Failed to execute pgrep: {}", e);
            return Vec::new();
        }
    };
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut pids = Vec::new();
    
    for line in stdout.lines() {
        if let Ok(pid) = line.trim().parse::<u32>() {
            pids.push(pid);
        }
    }
    
    debug!("Found {} processes with name {}", pids.len(), name);
    pids
}

// ======================================================================
// FILE UTILITIES
// ======================================================================

/// Check if a file exists and is readable
pub fn is_file_accessible(path: &std::path::Path) -> bool {
    debug!("Checking if file is accessible: {:?}", path);
    
    match std::fs::metadata(path) {
        Ok(metadata) => {
            let accessible = metadata.is_file();
            debug!("File {:?} accessible: {}", path, accessible);
            accessible
        }
        Err(e) => {
            debug!("File {:?} not accessible: {}", path, e);
            false
        }
    }
}

/// Get the size of a file in bytes
pub fn get_file_size(path: &std::path::Path) -> Result<u64, String> {
    debug!("Getting file size: {:?}", path);
    
    match std::fs::metadata(path) {
        Ok(metadata) => {
            let size = metadata.len();
            debug!("File {:?} size: {} bytes", path, size);
            Ok(size)
        }
        Err(e) => {
            let error = format!("Failed to get file size: {}", e);
            warn!("{}", error);
            Err(error)
        }
    }
}

/// Create directory if it doesn't exist
pub fn ensure_directory_exists(path: &std::path::Path) -> Result<(), String> {
    debug!("Ensuring directory exists: {:?}", path);
    
    if path.exists() {
        if path.is_dir() {
            debug!("Directory already exists: {:?}", path);
            Ok(())
        } else {
            let error = format!("Path exists but is not a directory: {:?}", path);
            warn!("{}", error);
            Err(error)
        }
    } else {
        match std::fs::create_dir_all(path) {
            Ok(_) => {
                debug!("Created directory: {:?}", path);
                Ok(())
            }
            Err(e) => {
                let error = format!("Failed to create directory: {}", e);
                warn!("{}", error);
                Err(error)
            }
        }
    }
}

// ======================================================================
// STRING UTILITIES
// ======================================================================

/// Format bytes as human-readable string
pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    const THRESHOLD: u64 = 1024;
    
    if bytes < THRESHOLD {
        return format!("{} B", bytes);
    }
    
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= THRESHOLD as f64 && unit_index < UNITS.len() - 1 {
        size /= THRESHOLD as f64;
        unit_index += 1;
    }
    
    format!("{:.1} {}", size, UNITS[unit_index])
}

/// Format duration as human-readable string
pub fn format_duration(seconds: u64) -> String {
    if seconds < 60 {
        format!("{}s", seconds)
    } else if seconds < 3600 {
        let minutes = seconds / 60;
        let remaining_seconds = seconds % 60;
        if remaining_seconds == 0 {
            format!("{}m", minutes)
        } else {
            format!("{}m {}s", minutes, remaining_seconds)
        }
    } else if seconds < 86400 {
        let hours = seconds / 3600;
        let remaining_minutes = (seconds % 3600) / 60;
        if remaining_minutes == 0 {
            format!("{}h", hours)
        } else {
            format!("{}h {}m", hours, remaining_minutes)
        }
    } else {
        let days = seconds / 86400;
        let remaining_hours = (seconds % 86400) / 3600;
        if remaining_hours == 0 {
            format!("{}d", days)
        } else {
            format!("{}d {}h", days, remaining_hours)
        }
    }
}

// ======================================================================
// VALIDATION UTILITIES
// ======================================================================

/// Validate port number
pub fn is_valid_port(port: u16) -> bool {
    port > 0 && port <= 65535
}

/// Validate URL format
pub fn is_valid_url(url: &str) -> bool {
    url.starts_with("http://") || url.starts_with("https://")
}

/// Sanitize filename for cross-platform compatibility
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect::<String>()
        .trim_matches('.')
        .to_string()
}

// ======================================================================
// TESTS
// ======================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1536), "1.5 KB");
        assert_eq!(format_bytes(1048576), "1.0 MB");
    }
    
    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(30), "30s");
        assert_eq!(format_duration(60), "1m");
        assert_eq!(format_duration(90), "1m 30s");
        assert_eq!(format_duration(3600), "1h");
        assert_eq!(format_duration(3660), "1h 1m");
        assert_eq!(format_duration(86400), "1d");
        assert_eq!(format_duration(90000), "1d 1h");
    }
    
    #[test]
    fn test_is_valid_port() {
        assert!(!is_valid_port(0));
        assert!(is_valid_port(80));
        assert!(is_valid_port(8080));
        assert!(is_valid_port(65535));
    }
    
    #[test]
    fn test_is_valid_url() {
        assert!(is_valid_url("http://localhost:3000"));
        assert!(is_valid_url("https://example.com"));
        assert!(!is_valid_url("ftp://example.com"));
        assert!(!is_valid_url("localhost:3000"));
    }
    
    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("normal.txt"), "normal.txt");
        assert_eq!(sanitize_filename("file<>name.txt"), "file__name.txt");
        assert_eq!(sanitize_filename("file:with|special*chars.txt"), "file_with_special_chars.txt");
    }
}