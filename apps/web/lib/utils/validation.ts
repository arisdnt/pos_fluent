// ======================================================================
// VALIDATION UTILITIES
// Utilitas untuk validasi data, form, dan error handling
// ======================================================================

// ======================================================================
// TYPES
// ======================================================================

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'phone' | 'number' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface FormValidationConfig {
  validateOnChange: boolean;
  validateOnBlur: boolean;
  showErrorsImmediately: boolean;
  debounceMs: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: Date;
  context?: any;
}

// ======================================================================
// VALIDATION RULES
// ======================================================================

export class ValidationRules {
  // Required field validation
  static required(message = 'Field ini wajib diisi'): any {
    return {
      type: 'required',
      message,
      validator: (value: any) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
      }
    };
  }

  // Email validation
  static email(message = 'Format email tidak valid'): any {
    return {
      type: 'email',
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }
    };
  }

  // Indonesian phone number validation
  static phone(message = 'Format nomor telepon tidak valid'): any {
    return {
      type: 'phone',
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        // Indonesian phone number patterns
        const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
        return phoneRegex.test(value.replace(/[\s-]/g, ''));
      }
    };
  }

  // Number validation
  static number(message = 'Harus berupa angka'): any {
    return {
      type: 'number',
      message,
      validator: (value: any) => {
        if (!value && value !== 0) return true; // Allow empty if not required
        return !isNaN(Number(value));
      }
    };
  }

  // Minimum value validation
  static min(minValue: number, message?: string): any {
    return {
      type: 'min',
      value: minValue,
      message: message || `Nilai minimum adalah ${minValue}`,
      validator: (value: any) => {
        if (!value && value !== 0) return true; // Allow empty if not required
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= minValue;
      }
    };
  }

  // Maximum value validation
  static max(maxValue: number, message?: string): any {
    return {
      type: 'max',
      value: maxValue,
      message: message || `Nilai maksimum adalah ${maxValue}`,
      validator: (value: any) => {
        if (!value && value !== 0) return true; // Allow empty if not required
        const numValue = Number(value);
        return !isNaN(numValue) && numValue <= maxValue;
      }
    };
  }

  // Minimum length validation
  static minLength(minLength: number, message?: string): any {
    return {
      type: 'min',
      value: minLength,
      message: message || `Panjang minimum adalah ${minLength} karakter`,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        return value.length >= minLength;
      }
    };
  }

  // Maximum length validation
  static maxLength(maxLength: number, message?: string): any {
    return {
      type: 'max',
      value: maxLength,
      message: message || `Panjang maksimum adalah ${maxLength} karakter`,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        return value.length <= maxLength;
      }
    };
  }

  // Pattern validation
  static pattern(regex: RegExp, message = 'Format tidak valid'): any {
    return {
      type: 'pattern',
      value: regex,
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        return regex.test(value);
      }
    };
  }

  // Custom validation
  static custom(validator: (value: any) => boolean, message = 'Validasi gagal'): any {
    return {
      type: 'custom',
      message,
      validator
    };
  }

  // Indonesian ID number (NIK) validation
  static nik(message = 'NIK tidak valid'): any {
    return {
      type: 'custom',
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        // NIK should be 16 digits
        if (!/^\d{16}$/.test(value)) return false;
        
        // Basic validation for Indonesian NIK format
        const provinceCode = value.substring(0, 2);
        const cityCode = value.substring(2, 4);
        const districtCode = value.substring(4, 6);
        const birthDate = value.substring(6, 12);
        
        // Check if codes are valid ranges
        const province = parseInt(provinceCode);
        const city = parseInt(cityCode);
        const district = parseInt(districtCode);
        
        return province >= 11 && province <= 94 && city >= 1 && city <= 99 && district >= 1 && district <= 99;
      }
    };
  }

  // Indonesian postal code validation
  static postalCode(message = 'Kode pos tidak valid'): any {
    return {
      type: 'pattern',
      value: /^\d{5}$/,
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        return /^\d{5}$/.test(value);
      }
    };
  }

  // Password strength validation
  static password(message = 'Password harus minimal 8 karakter dengan kombinasi huruf, angka, dan simbol'): any {
    return {
      type: 'custom',
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        
        // At least 8 characters
        if (value.length < 8) return false;
        
        // Contains at least one letter
        if (!/[a-zA-Z]/.test(value)) return false;
        
        // Contains at least one number
        if (!/\d/.test(value)) return false;
        
        // Contains at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;
        
        return true;
      }
    };
  }

  // Price validation (Indonesian Rupiah)
  static price(message = 'Harga tidak valid'): any {
    return {
      type: 'custom',
      message,
      validator: (value: any) => {
        if (!value && value !== 0) return true; // Allow empty if not required
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= 0;
      }
    };
  }

  // Barcode validation
  static barcode(message = 'Barcode tidak valid'): any {
    return {
      type: 'custom',
      message,
      validator: (value: string) => {
        if (!value) return true; // Allow empty if not required
        // Support various barcode formats (EAN-13, UPC-A, Code 128, etc.)
        return /^[0-9A-Za-z\-\.\s]{4,50}$/.test(value);
      }
    };
  }
}

// ======================================================================
// VALIDATOR CLASS
// ======================================================================

export class Validator {
  private rules: ValidationRule[] = [];
  private config: FormValidationConfig;

  constructor(config: Partial<FormValidationConfig> = {}) {
    this.config = {
      validateOnChange: true,
      validateOnBlur: true,
      showErrorsImmediately: false,
      debounceMs: 300,
      ...config
    };
  }

  // Add validation rule
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  // Add multiple validation rules
  addRules(rules: ValidationRule[]): this {
    this.rules.push(...rules);
    return this;
  }

  // Validate data
  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};
    let isValid = true;

    for (const rule of this.rules) {
      const fieldValue = data[rule.field];
      const fieldErrors: string[] = [];

      for (const validation of rule.rules) {
        if (!validation.validator(fieldValue)) {
          fieldErrors.push(validation.message);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[rule.field] = fieldErrors;
      }
    }

    return {
      isValid,
      errors,
      warnings
    };
  }

  // Validate single field
  validateField(field: string, value: any): { isValid: boolean; errors: string[] } {
    const rule = this.rules.find(r => r.field === field);
    if (!rule) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    let isValid = true;

    for (const validation of rule.rules) {
      if (!validation.validator(value)) {
        errors.push(validation.message);
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  // Clear all rules
  clearRules(): this {
    this.rules = [];
    return this;
  }

  // Get configuration
  getConfig(): FormValidationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(config: Partial<FormValidationConfig>): this {
    this.config = { ...this.config, ...config };
    return this;
  }
}

// ======================================================================
// ERROR HANDLER CLASS
// ======================================================================

export class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100;
  private listeners: Array<(error: ErrorInfo) => void> = [];

  // Add error
  addError(error: Omit<ErrorInfo, 'timestamp'>): void {
    const errorInfo: ErrorInfo = {
      ...error,
      timestamp: new Date()
    };

    this.errors.push(errorInfo);
    
    // Keep only the last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(errorInfo));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`, error.context);
    }
  }

  // Add error listener
  addListener(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get all errors
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  // Get errors by severity
  getErrorsBySeverity(severity: 'error' | 'warning' | 'info'): ErrorInfo[] {
    return this.errors.filter(error => error.severity === severity);
  }

  // Get errors by code
  getErrorsByCode(code: string): ErrorInfo[] {
    return this.errors.filter(error => error.code === code);
  }

  // Clear errors
  clearErrors(): void {
    this.errors = [];
  }

  // Clear errors by severity
  clearErrorsBySeverity(severity: 'error' | 'warning' | 'info'): void {
    this.errors = this.errors.filter(error => error.severity !== severity);
  }

  // Handle API errors
  handleApiError(error: any, context?: any): void {
    let errorInfo: Omit<ErrorInfo, 'timestamp'>;

    if (error.response) {
      // HTTP error response
      errorInfo = {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || error.message || 'Terjadi kesalahan pada server',
        severity: error.response.status >= 500 ? 'error' : 'warning',
        context: {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method,
          ...context
        }
      };
    } else if (error.request) {
      // Network error
      errorInfo = {
        code: 'NETWORK_ERROR',
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        severity: 'error',
        context: {
          url: error.config?.url,
          method: error.config?.method,
          ...context
        }
      };
    } else {
      // Other error
      errorInfo = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Terjadi kesalahan yang tidak diketahui',
        severity: 'error',
        context
      };
    }

    this.addError(errorInfo);
  }

  // Handle validation errors
  handleValidationError(field: string, message: string, context?: any): void {
    this.addError({
      code: 'VALIDATION_ERROR',
      message,
      field,
      severity: 'warning',
      context
    });
  }

  // Handle business logic errors
  handleBusinessError(code: string, message: string, context?: any): void {
    this.addError({
      code,
      message,
      severity: 'error',
      context
    });
  }
}

// ======================================================================
// PREDEFINED VALIDATORS
// ======================================================================

// Customer form validator
export function createCustomerValidator(): Validator {
  return new Validator()
    .addRule({
      field: 'name',
      rules: [
        ValidationRules.required('Nama pelanggan wajib diisi'),
        ValidationRules.minLength(2, 'Nama minimal 2 karakter'),
        ValidationRules.maxLength(100, 'Nama maksimal 100 karakter')
      ]
    })
    .addRule({
      field: 'email',
      rules: [
        ValidationRules.email('Format email tidak valid')
      ]
    })
    .addRule({
      field: 'phone',
      rules: [
        ValidationRules.phone('Format nomor telepon tidak valid')
      ]
    })
    .addRule({
      field: 'address',
      rules: [
        ValidationRules.maxLength(500, 'Alamat maksimal 500 karakter')
      ]
    });
}

// Product form validator
export function createProductValidator(): Validator {
  return new Validator()
    .addRule({
      field: 'name',
      rules: [
        ValidationRules.required('Nama produk wajib diisi'),
        ValidationRules.minLength(2, 'Nama produk minimal 2 karakter'),
        ValidationRules.maxLength(200, 'Nama produk maksimal 200 karakter')
      ]
    })
    .addRule({
      field: 'sku',
      rules: [
        ValidationRules.required('SKU wajib diisi'),
        ValidationRules.pattern(/^[A-Z0-9\-]{3,20}$/, 'SKU harus terdiri dari huruf kapital, angka, dan tanda hubung (3-20 karakter)')
      ]
    })
    .addRule({
      field: 'barcode',
      rules: [
        ValidationRules.barcode('Format barcode tidak valid')
      ]
    })
    .addRule({
      field: 'price',
      rules: [
        ValidationRules.required('Harga wajib diisi'),
        ValidationRules.price('Harga harus berupa angka positif'),
        ValidationRules.min(0, 'Harga tidak boleh negatif')
      ]
    })
    .addRule({
      field: 'cost',
      rules: [
        ValidationRules.price('Harga beli harus berupa angka positif'),
        ValidationRules.min(0, 'Harga beli tidak boleh negatif')
      ]
    })
    .addRule({
      field: 'stock',
      rules: [
        ValidationRules.required('Stok wajib diisi'),
        ValidationRules.number('Stok harus berupa angka'),
        ValidationRules.min(0, 'Stok tidak boleh negatif')
      ]
    });
}

// User form validator
export function createUserValidator(): Validator {
  return new Validator()
    .addRule({
      field: 'username',
      rules: [
        ValidationRules.required('Username wajib diisi'),
        ValidationRules.minLength(3, 'Username minimal 3 karakter'),
        ValidationRules.maxLength(50, 'Username maksimal 50 karakter'),
        ValidationRules.pattern(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore')
      ]
    })
    .addRule({
      field: 'email',
      rules: [
        ValidationRules.required('Email wajib diisi'),
        ValidationRules.email('Format email tidak valid')
      ]
    })
    .addRule({
      field: 'password',
      rules: [
        ValidationRules.required('Password wajib diisi'),
        ValidationRules.password('Password harus minimal 8 karakter dengan kombinasi huruf, angka, dan simbol')
      ]
    })
    .addRule({
      field: 'name',
      rules: [
        ValidationRules.required('Nama lengkap wajib diisi'),
        ValidationRules.minLength(2, 'Nama minimal 2 karakter'),
        ValidationRules.maxLength(100, 'Nama maksimal 100 karakter')
      ]
    })
    .addRule({
      field: 'phone',
      rules: [
        ValidationRules.phone('Format nomor telepon tidak valid')
      ]
    });
}

// Transaction validator
export function createTransactionValidator(): Validator {
  return new Validator()
    .addRule({
      field: 'items',
      rules: [
        ValidationRules.required('Minimal harus ada 1 item'),
        ValidationRules.custom(
          (items: any[]) => Array.isArray(items) && items.length > 0,
          'Transaksi harus memiliki minimal 1 item'
        )
      ]
    })
    .addRule({
      field: 'paymentMethod',
      rules: [
        ValidationRules.required('Metode pembayaran wajib dipilih'),
        ValidationRules.custom(
          (method: string) => ['cash', 'card', 'transfer', 'ewallet'].includes(method),
          'Metode pembayaran tidak valid'
        )
      ]
    })
    .addRule({
      field: 'total',
      rules: [
        ValidationRules.required('Total transaksi wajib diisi'),
        ValidationRules.price('Total harus berupa angka positif'),
        ValidationRules.min(0, 'Total tidak boleh negatif')
      ]
    });
}

// ======================================================================
// GLOBAL INSTANCES
// ======================================================================

export const globalErrorHandler = new ErrorHandler();

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

// Format validation errors for display
export function formatValidationErrors(errors: Record<string, string[]>): string[] {
  const formattedErrors: string[] = [];
  
  for (const [field, fieldErrors] of Object.entries(errors)) {
    fieldErrors.forEach(error => {
      formattedErrors.push(`${field}: ${error}`);
    });
  }
  
  return formattedErrors;
}

// Check if value is empty
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Sanitize input string
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

// Validate Indonesian currency format
export function validateCurrency(value: string): boolean {
  if (!value) return false;
  
  // Remove currency symbols and separators
  const cleanValue = value.replace(/[Rp\s\.]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  
  return !isNaN(numValue) && numValue >= 0;
}

// Parse Indonesian currency to number
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbols and separators
  const cleanValue = value.replace(/[Rp\s\.]/g, '').replace(',', '.');
  const numValue = parseFloat(cleanValue);
  
  return isNaN(numValue) ? 0 : numValue;
}

// Format number as Indonesian currency
export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}