// ======================================================================
// SYSTEM INFO
// Mengumpulkan informasi sistem untuk monitoring dan diagnostik
// ======================================================================

use log::{debug, warn};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    time::{SystemTime, UNIX_EPOCH},
};
use sysinfo::{System, SystemExt, CpuExt, DiskExt, NetworkExt, ProcessExt};

// ======================================================================
// TYPES
// ======================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: OsInfo,
    pub hardware: HardwareInfo,
    pub performance: PerformanceInfo,
    pub network: NetworkInfo,
    pub processes: Vec<ProcessInfo>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsInfo {
    pub name: String,
    pub version: String,
    pub architecture: String,
    pub hostname: String,
    pub uptime: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub disks: Vec<DiskInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub brand: String,
    pub cores: usize,
    pub frequency: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub file_system: String,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceInfo {
    pub cpu_usage_percent: f32,
    pub memory_usage_percent: f32,
    pub load_average: Vec<f64>,
    pub process_count: usize,
    pub thread_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub interfaces: Vec<NetworkInterface>,
    pub total_bytes_received: u64,
    pub total_bytes_transmitted: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub bytes_received: u64,
    pub bytes_transmitted: u64,
    pub packets_received: u64,
    pub packets_transmitted: u64,
    pub errors_received: u64,
    pub errors_transmitted: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
    pub status: String,
    pub start_time: u64,
}

// ======================================================================
// SYSTEM INFO COLLECTOR
// ======================================================================

pub struct SystemInfoCollector {
    system: System,
}

impl SystemInfoCollector {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        
        Self { system }
    }
    
    /// Get comprehensive system information
    pub async fn get_info(&mut self) -> SystemInfo {
        debug!("Collecting system information...");
        
        // Refresh system information
        self.system.refresh_all();
        
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        SystemInfo {
            os: self.get_os_info(),
            hardware: self.get_hardware_info(),
            performance: self.get_performance_info(),
            network: self.get_network_info(),
            processes: self.get_process_info(),
            timestamp,
        }
    }
    
    /// Get basic system information (lighter weight)
    pub async fn get_basic_info(&mut self) -> SystemInfo {
        debug!("Collecting basic system information...");
        
        // Only refresh CPU and memory for basic info
        self.system.refresh_cpu();
        self.system.refresh_memory();
        
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        SystemInfo {
            os: self.get_os_info(),
            hardware: HardwareInfo {
                cpu: self.get_cpu_info(),
                memory: self.get_memory_info(),
                disks: Vec::new(), // Skip disks for basic info
            },
            performance: self.get_performance_info(),
            network: NetworkInfo {
                interfaces: Vec::new(), // Skip network for basic info
                total_bytes_received: 0,
                total_bytes_transmitted: 0,
            },
            processes: Vec::new(), // Skip processes for basic info
            timestamp,
        }
    }
    
    // ======================================================================
    // PRIVATE METHODS
    // ======================================================================
    
    fn get_os_info(&self) -> OsInfo {
        OsInfo {
            name: self.system.name().unwrap_or_else(|| "Unknown".to_string()),
            version: self.system.os_version().unwrap_or_else(|| "Unknown".to_string()),
            architecture: std::env::consts::ARCH.to_string(),
            hostname: self.system.host_name().unwrap_or_else(|| "Unknown".to_string()),
            uptime: self.system.uptime(),
        }
    }
    
    fn get_hardware_info(&self) -> HardwareInfo {
        HardwareInfo {
            cpu: self.get_cpu_info(),
            memory: self.get_memory_info(),
            disks: self.get_disk_info(),
        }
    }
    
    fn get_cpu_info(&self) -> CpuInfo {
        let cpus = self.system.cpus();
        let cpu_count = cpus.len();
        let cpu_usage = if !cpus.is_empty() {
            cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpu_count as f32
        } else {
            0.0
        };
        
        let (brand, frequency) = if let Some(cpu) = cpus.first() {
            (cpu.brand().to_string(), cpu.frequency())
        } else {
            ("Unknown".to_string(), 0)
        };
        
        CpuInfo {
            brand,
            cores: cpu_count,
            frequency,
            usage_percent: cpu_usage,
        }
    }
    
    fn get_memory_info(&self) -> MemoryInfo {
        let total = self.system.total_memory();
        let used = self.system.used_memory();
        let available = total - used;
        let usage_percent = if total > 0 {
            (used as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        
        MemoryInfo {
            total_bytes: total,
            used_bytes: used,
            available_bytes: available,
            usage_percent,
        }
    }
    
    fn get_disk_info(&self) -> Vec<DiskInfo> {
        self.system
            .disks()
            .iter()
            .map(|disk| {
                let total = disk.total_space();
                let available = disk.available_space();
                let used = total - available;
                let usage_percent = if total > 0 {
                    (used as f32 / total as f32) * 100.0
                } else {
                    0.0
                };
                
                DiskInfo {
                    name: disk.name().to_string_lossy().to_string(),
                    mount_point: disk.mount_point().to_string_lossy().to_string(),
                    file_system: String::from_utf8_lossy(disk.file_system()).to_string(),
                    total_bytes: total,
                    used_bytes: used,
                    available_bytes: available,
                    usage_percent,
                }
            })
            .collect()
    }
    
    fn get_performance_info(&self) -> PerformanceInfo {
        let cpus = self.system.cpus();
        let cpu_usage = if !cpus.is_empty() {
            cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
        } else {
            0.0
        };
        
        let total_memory = self.system.total_memory();
        let used_memory = self.system.used_memory();
        let memory_usage = if total_memory > 0 {
            (used_memory as f32 / total_memory as f32) * 100.0
        } else {
            0.0
        };
        
        let processes = self.system.processes();
        let process_count = processes.len();
        let thread_count = processes.values().map(|p| p.tasks().len()).sum();
        
        // Load average is not available on all platforms
        let load_average = self.system.load_average();
        let load_avg_vec = vec![load_average.one, load_average.five, load_average.fifteen];
        
        PerformanceInfo {
            cpu_usage_percent: cpu_usage,
            memory_usage_percent: memory_usage,
            load_average: load_avg_vec,
            process_count,
            thread_count,
        }
    }
    
    fn get_network_info(&self) -> NetworkInfo {
        let mut total_received = 0;
        let mut total_transmitted = 0;
        
        let interfaces: Vec<NetworkInterface> = self.system
            .networks()
            .iter()
            .map(|(name, network)| {
                let received = network.received();
                let transmitted = network.transmitted();
                
                total_received += received;
                total_transmitted += transmitted;
                
                NetworkInterface {
                    name: name.clone(),
                    bytes_received: received,
                    bytes_transmitted: transmitted,
                    packets_received: network.packets_received(),
                    packets_transmitted: network.packets_transmitted(),
                    errors_received: network.errors_on_received(),
                    errors_transmitted: network.errors_on_transmitted(),
                }
            })
            .collect();
        
        NetworkInfo {
            interfaces,
            total_bytes_received: total_received,
            total_bytes_transmitted: total_transmitted,
        }
    }
    
    fn get_process_info(&self) -> Vec<ProcessInfo> {
        let mut processes: Vec<ProcessInfo> = self.system
            .processes()
            .iter()
            .filter_map(|(pid, process)| {
                // Filter to only include relevant processes (e.g., high CPU/memory usage)
                if process.cpu_usage() > 1.0 || process.memory() > 50 * 1024 * 1024 {
                    Some(ProcessInfo {
                        pid: pid.as_u32(),
                        name: process.name().to_string(),
                        cpu_usage: process.cpu_usage(),
                        memory_bytes: process.memory(),
                        status: format!("{:?}", process.status()),
                        start_time: process.start_time(),
                    })
                } else {
                    None
                }
            })
            .collect();
        
        // Sort by CPU usage (descending)
        processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
        
        // Limit to top 20 processes
        processes.truncate(20);
        
        processes
    }
}

// ======================================================================
// CONVENIENCE WRAPPER
// ======================================================================

pub struct SystemInfo;

impl SystemInfo {
    pub fn new() -> SystemInfoCollector {
        SystemInfoCollector::new()
    }
    
    /// Get system information with caching
    pub async fn get_cached_info() -> crate::system::SystemInfo {
        // In a real implementation, you might want to cache this information
        // and only refresh it periodically to avoid performance overhead
        let mut collector = SystemInfoCollector::new();
        collector.get_basic_info().await
    }
    
    /// Check if system meets minimum requirements
    pub async fn check_system_requirements() -> SystemRequirementsCheck {
        let mut collector = SystemInfoCollector::new();
        let info = collector.get_basic_info().await;
        
        let mut checks = SystemRequirementsCheck {
            meets_requirements: true,
            checks: HashMap::new(),
        };
        
        // Check minimum RAM (2GB)
        let min_ram_gb = 2;
        let ram_gb = info.hardware.memory.total_bytes / (1024 * 1024 * 1024);
        let ram_ok = ram_gb >= min_ram_gb;
        checks.checks.insert(
            "memory".to_string(),
            RequirementCheck {
                name: "Minimum RAM".to_string(),
                required: format!("{} GB", min_ram_gb),
                actual: format!("{} GB", ram_gb),
                passed: ram_ok,
            },
        );
        if !ram_ok {
            checks.meets_requirements = false;
        }
        
        // Check available disk space (1GB)
        let min_disk_gb = 1;
        let available_disk_gb = info.hardware.disks
            .iter()
            .map(|d| d.available_bytes)
            .max()
            .unwrap_or(0) / (1024 * 1024 * 1024);
        let disk_ok = available_disk_gb >= min_disk_gb;
        checks.checks.insert(
            "disk".to_string(),
            RequirementCheck {
                name: "Available Disk Space".to_string(),
                required: format!("{} GB", min_disk_gb),
                actual: format!("{} GB", available_disk_gb),
                passed: disk_ok,
            },
        );
        if !disk_ok {
            checks.meets_requirements = false;
        }
        
        checks
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemRequirementsCheck {
    pub meets_requirements: bool,
    pub checks: HashMap<String, RequirementCheck>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequirementCheck {
    pub name: String,
    pub required: String,
    pub actual: String,
    pub passed: bool,
}