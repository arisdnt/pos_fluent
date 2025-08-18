// ======================================================================
// SERVICES INDEX
// Export all POS services
// ======================================================================

// Core POS Service
export { posService, POSService } from './pos-service';
export type {
  Product,
  ProductCategory,
  ProductBrand,
  CartItem,
  Customer,
  PaymentMethod as POSPaymentMethod,
  Payment as POSPayment,
  Transaction as POSTransaction,
  CalculationResult,
  POSSettings,
  StockLevel
} from './pos-service';

// Barcode Service
export { barcodeService, BarcodeService } from './barcode-service';
export type {
  BarcodeResult,
  ScannerSettings,
  CameraDevice,
  ScannerStatus,
  BarcodeFormat,
  ScanHistory
} from './barcode-service';

// Tax Service
export { taxService, TaxService } from './tax-service';
export type {
  TaxRule,
  DiscountRule,
  TaxCalculationResult,
  DiscountCalculationResult,
  TaxableItem,
  BuyXGetYDiscount
} from './tax-service';

// Payment Service
export { paymentService, PaymentService } from './payment-service';
export type {
  PaymentMethod,
  Payment,
  PaymentSplit,
  PaymentValidation,
  PaymentProcessResult,
  CashDrawer,
  CashDenomination,
  CashCount
} from './payment-service';

// Transaction Service
export { transactionService, TransactionService } from './transaction-service';
export type {
  TransactionItem,
  Transaction,
  TransactionSummary,
  TransactionFilter,
  TransactionStats,
  RefundRequest,
  VoidRequest
} from './transaction-service';

// ======================================================================
// SERVICE UTILITIES
// ======================================================================

/**
 * Initialize all services
 */
export function initializeServices(): void {
  // Services are initialized automatically via their constructors
  console.log('POS Services initialized');
}

/**
 * Reset all services (for testing)
 */
export function resetServices(): void {
  // Reset daily limits and temporary data
  paymentService.resetDailyLimits();
  console.log('POS Services reset');
}

/**
 * Get service health status
 */
export function getServiceHealth(): {
  pos: boolean;
  barcode: boolean;
  tax: boolean;
  payment: boolean;
  transaction: boolean;
} {
  return {
    pos: true, // posService is always available
    barcode: true, // barcodeService is always available
    tax: true, // taxService is always available
    payment: true, // paymentService is always available
    transaction: true // transactionService is always available
  };
}

// ======================================================================
// COMMON TYPES
// ======================================================================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

/**
 * Format currency for Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date for Indonesian locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Format date and time for Indonesian locale
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

/**
 * Format time only
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
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

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Validate Indonesian phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Validate Indonesian email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string for search
 */
export function sanitizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Round to nearest value
 */
export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if value is numeric
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Parse numeric value safely
 */
export function parseNumeric(value: any, defaultValue: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan yang lalu`;
  
  return `${Math.floor(diffInSeconds / 31536000)} tahun yang lalu`;
}