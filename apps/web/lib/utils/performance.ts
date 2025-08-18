// ======================================================================
// PERFORMANCE UTILITIES
// Utilitas untuk monitoring dan optimasi performa aplikasi
// ======================================================================

// ======================================================================
// TYPES
// ======================================================================

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  timestamp: number;
  componentName?: string;
  operation?: string;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics[];
  averages: {
    renderTime: number;
    memoryUsage: number;
    fps: number;
  };
  peaks: {
    maxRenderTime: number;
    maxMemoryUsage: number;
    minFps: number;
  };
  recommendations: string[];
}

// ======================================================================
// PERFORMANCE MONITOR CLASS
// ======================================================================

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private maxMetrics = 100; // Keep last 100 measurements

  constructor(maxMetrics = 100) {
    this.maxMetrics = maxMetrics;
  }

  // Start monitoring performance
  start(interval = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      const metrics = this.collectMetrics();
      this.addMetrics(metrics);
      this.notifyObservers(metrics);
    }, interval);
  }

  // Stop monitoring
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Add observer for real-time metrics
  addObserver(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Get performance report
  getReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        metrics: [],
        averages: { renderTime: 0, memoryUsage: 0, fps: 0 },
        peaks: { maxRenderTime: 0, maxMemoryUsage: 0, minFps: 0 },
        recommendations: ['No data available']
      };
    }

    const averages = this.calculateAverages();
    const peaks = this.calculatePeaks();
    const recommendations = this.generateRecommendations(averages, peaks);

    return {
      metrics: this.metrics,
      averages,
      peaks,
      recommendations
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }

  // Measure function execution time
  measureFunction<T>(fn: () => T, name?: string): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    const metrics: PerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: this.getMemoryUsage(),
      fps: 0,
      timestamp: Date.now(),
      operation: name
    };
    
    this.addMetrics(metrics);
    return result;
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(fn: () => Promise<T>, name?: string): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    const metrics: PerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: this.getMemoryUsage(),
      fps: 0,
      timestamp: Date.now(),
      operation: name
    };
    
    this.addMetrics(metrics);
    return result;
  }

  // Private methods
  private collectMetrics(): PerformanceMetrics {
    return {
      renderTime: performance.now(),
      memoryUsage: this.getMemoryUsage(),
      fps: this.getFPS(),
      timestamp: Date.now()
    };
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  private notifyObservers(metrics: PerformanceMetrics): void {
    this.observers.forEach(callback => callback(metrics));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory as MemoryInfo;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  private getFPS(): number {
    // Simple FPS calculation (this is a basic implementation)
    // In a real application, you might want to use requestAnimationFrame
    return 60; // Placeholder
  }

  private calculateAverages() {
    const sum = this.metrics.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        fps: acc.fps + metric.fps
      }),
      { renderTime: 0, memoryUsage: 0, fps: 0 }
    );

    const count = this.metrics.length;
    return {
      renderTime: sum.renderTime / count,
      memoryUsage: sum.memoryUsage / count,
      fps: sum.fps / count
    };
  }

  private calculatePeaks() {
    return {
      maxRenderTime: Math.max(...this.metrics.map(m => m.renderTime)),
      maxMemoryUsage: Math.max(...this.metrics.map(m => m.memoryUsage)),
      minFps: Math.min(...this.metrics.map(m => m.fps))
    };
  }

  private generateRecommendations(averages: any, peaks: any): string[] {
    const recommendations: string[] = [];

    if (averages.memoryUsage > 100) {
      recommendations.push('Memory usage is high. Consider optimizing data structures and cleaning up unused objects.');
    }

    if (averages.renderTime > 16.67) { // 60 FPS = 16.67ms per frame
      recommendations.push('Render time is slow. Consider using React.memo, useMemo, and useCallback for optimization.');
    }

    if (peaks.maxMemoryUsage > 200) {
      recommendations.push('Peak memory usage is very high. Check for memory leaks and large data sets.');
    }

    if (averages.fps < 30) {
      recommendations.push('FPS is low. Consider reducing DOM complexity and optimizing animations.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable limits.');
    }

    return recommendations;
  }
}

// ======================================================================
// REACT HOOKS
// ======================================================================

import { useEffect, useState, useCallback, useRef } from 'react';

// Hook for monitoring component performance
export function usePerformanceMonitor(componentName?: string) {
  const [monitor] = useState(() => new PerformanceMonitor());
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const unsubscribe = monitor.addObserver((newMetrics) => {
      setMetrics(monitor.getMetrics());
    });

    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, [monitor]);

  const startMonitoring = useCallback((interval?: number) => {
    monitor.start(interval);
    setIsMonitoring(true);
  }, [monitor]);

  const stopMonitoring = useCallback(() => {
    monitor.stop();
    setIsMonitoring(false);
  }, [monitor]);

  const measureRender = useCallback(<T,>(fn: () => T): T => {
    return monitor.measureFunction(fn, `${componentName} render`);
  }, [monitor, componentName]);

  const getReport = useCallback(() => {
    return monitor.getReport();
  }, [monitor]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureRender,
    getReport,
    clearMetrics: () => monitor.clear()
  };
}

// Hook for measuring render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const [renderMetrics, setRenderMetrics] = useState({
    count: 0,
    averageTime: 0,
    lastTime: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    renderCount.current += 1;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      lastRenderTime.current = renderTime;

      setRenderMetrics(prev => ({
        count: renderCount.current,
        averageTime: (prev.averageTime * (prev.count - 1) + renderTime) / prev.count,
        lastTime: renderTime
      }));

      if (renderTime > 16.67) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return renderMetrics;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

// Get system memory information
export function getMemoryInfo(): MemoryInfo | null {
  if ('memory' in performance) {
    return (performance as any).memory as MemoryInfo;
  }
  return null;
}

// Get network information
export function getNetworkInfo(): NetworkInfo | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Measure function execution time
export function measureTime<T>(fn: () => T, label?: string): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

// Measure async function execution time
export async function measureTimeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

// Check if device has limited resources
export function isLowEndDevice(): boolean {
  // Check memory
  const memory = getMemoryInfo();
  if (memory && memory.jsHeapSizeLimit < 1024 * 1024 * 1024) { // Less than 1GB
    return true;
  }
  
  // Check network
  const network = getNetworkInfo();
  if (network && (network.effectiveType === '2g' || network.effectiveType === 'slow-2g')) {
    return true;
  }
  
  // Check hardware concurrency
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  return false;
}

// Get performance recommendations based on device capabilities
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = [];
  
  if (isLowEndDevice()) {
    recommendations.push('Enable virtualization for large lists');
    recommendations.push('Reduce animation complexity');
    recommendations.push('Use smaller page sizes');
    recommendations.push('Enable data compression');
  }
  
  const memory = getMemoryInfo();
  if (memory) {
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    if (usagePercent > 80) {
      recommendations.push('Memory usage is high - consider cleaning up unused objects');
    }
  }
  
  const network = getNetworkInfo();
  if (network) {
    if (network.saveData) {
      recommendations.push('User has data saver enabled - reduce data usage');
    }
    if (network.rtt > 1000) {
      recommendations.push('High latency detected - implement offline capabilities');
    }
  }
  
  return recommendations;
}

// ======================================================================
// PERFORMANCE BUDGET
// ======================================================================

export interface PerformanceBudget {
  maxRenderTime: number; // milliseconds
  maxMemoryUsage: number; // MB
  minFPS: number;
  maxBundleSize: number; // KB
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  maxRenderTime: 16.67, // 60 FPS
  maxMemoryUsage: 100, // 100 MB
  minFPS: 30,
  maxBundleSize: 1024 // 1 MB
};

export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(`Render time (${metrics.renderTime.toFixed(2)}ms) exceeds budget (${budget.maxRenderTime}ms)`);
  }
  
  if (metrics.memoryUsage > budget.maxMemoryUsage) {
    violations.push(`Memory usage (${metrics.memoryUsage.toFixed(2)}MB) exceeds budget (${budget.maxMemoryUsage}MB)`);
  }
  
  if (metrics.fps < budget.minFPS) {
    violations.push(`FPS (${metrics.fps}) below budget (${budget.minFPS})`);
  }
  
  return {
    passed: violations.length === 0,
    violations
  };
}

// ======================================================================
// GLOBAL PERFORMANCE MONITOR INSTANCE
// ======================================================================

export const globalPerformanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  globalPerformanceMonitor.start(2000); // Monitor every 2 seconds
  
  // Log performance warnings
  globalPerformanceMonitor.addObserver((metrics) => {
    const budget = checkPerformanceBudget(metrics);
    if (!budget.passed) {
      console.warn('Performance budget violations:', budget.violations);
    }
  });
}