// ======================================================================
// MAIN TYPES EXPORT
// Aplikasi Kasir - Point of Sale Suite
// ======================================================================

// Domain types - Core business entities
export * from './domain';

// API types - Request/Response interfaces
export * from './api';

// Utility types - Common utilities and helpers
export * from './utils';

// Re-export commonly used types for convenience
export type {
  // Core entities
  Product,
  Customer,
  PosOrder,
  PosOrderLine,
  PosSession,
  Stock,
  User,
  Branch,
  Company,
  
  // Cart and UI
  Cart,
  CartItem,
  PaymentSummary,
  PaymentEntry,
  
  // Views (Indonesian)
  VwTransaksi,
  VwProduk,
  VwMutasiStok,
  VwShiftKasir,
  
  // Configuration
  AppConfig,
  TaxConfig,
  RoundingConfig,
  
  // Enums
  PaymentMethod,
  OrderStatus,
  SessionStatus,
  StockMovementType,
  ReferenceType,
  
  // API responses
  ApiResponse,
  PaginatedResponse,
  SearchParams,
  
  // Common utilities
  Nullable,
  Optional,
  Maybe,
  DeepPartial,
  DeepRequired
} from './domain';

export type {
  // Auth API
  LoginRequest,
  LoginResponse,
  
  // Product API
  ProductSearchRequest,
  ProductSearchResponse,
  ProductWithStock,
  ProductLookupRequest,
  ProductLookupResponse,
  
  // Customer API
  CustomerSearchRequest,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  
  // Session API
  SessionOpenRequest,
  SessionCloseRequest,
  SessionSummary,
  
  // Order API
  OrderCreateRequest,
  OrderPaymentRequest,
  OrderVoidRequest,
  OrderRefundRequest,
  
  // Stock API
  StockCheckRequest,
  StockCheckResponse,
  StockAdjustmentRequest,
  StockTransferRequest,
  
  // Report API
  SalesReportRequest,
  SalesReportResponse,
  ProductReportRequest,
  ProductReportResponse,
  StockReportRequest,
  StockReportResponse,
  
  // Dashboard API
  DashboardStatsRequest,
  DashboardStatsResponse,
  
  // Export API
  ExportRequest,
  ExportResponse,
  
  // Real-time API
  WebSocketMessage,
  StockUpdateMessage,
  OrderUpdateMessage,
  SessionUpdateMessage,
  NotificationMessage,
  
  // Error handling
  ApiError,
  ValidationError,
  ApiErrorResponse,
  ApiSuccessResponse,
  
  // Pagination
  PaginationParams,
  PaginationMeta,
  PaginatedApiResponse,
  
  // Filters
  DateRangeFilter,
  StatusFilter,
  BranchFilter,
  SearchFilter,
  CommonFilters,
  
  // Bulk operations
  BulkOperationRequest,
  BulkOperationResponse
} from './api';

export type {
  // Form utilities
  FormField,
  FormState,
  FormValidation,
  FormConfig,
  
  // Table utilities
  TableColumn,
  TableSort,
  TableFilter,
  TableState,
  TableConfig,
  
  // Modal utilities
  ModalProps,
  ConfirmModalProps,
  
  // Notification utilities
  NotificationType,
  NotificationConfig,
  ToastConfig,
  
  // Loading utilities
  LoadingState,
  AsyncState,
  LoadingConfig,
  
  // Currency utilities
  CurrencyConfig,
  CurrencyFormatOptions,
  
  // Date utilities
  DateRange,
  DateFormatOptions,
  DatePreset,
  
  // Validation utilities
  ValidationRule,
  ValidationResult,
  ValidationSchema,
  
  // Search utilities
  SearchConfig,
  SearchResult,
  SearchResponse,
  
  // Keyboard utilities
  KeyboardKey,
  KeyboardShortcut,
  KeyboardEvent,
  
  // Print utilities
  PrintConfig,
  PrintTemplate,
  
  // Export utilities
  ExportColumn,
  ExportConfig,
  
  // Theme utilities
  Theme,
  ThemeColors,
  ThemeSpacing,
  ThemeTypography,
  
  // Storage utilities
  StorageConfig,
  StorageItem,
  
  // Performance utilities
  PerformanceMetrics,
  PerformanceConfig,
  
  // Error boundary utilities
  ErrorInfo,
  ErrorBoundaryState,
  ErrorBoundaryProps,
  
  // Accessibility utilities
  A11yConfig,
  AriaAttributes
} from './utils';

// ======================================================================
// TYPE GUARDS
// ======================================================================

/**
 * Type guard untuk mengecek apakah response adalah success
 */
export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true;
}

/**
 * Type guard untuk mengecek apakah response adalah error
 */
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false;
}

/**
 * Type guard untuk mengecek apakah value bukan null/undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard untuk mengecek apakah array tidak kosong
 */
export function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
  return array.length > 0;
}

/**
 * Type guard untuk mengecek apakah string tidak kosong
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard untuk mengecek apakah number adalah valid
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard untuk mengecek apakah date adalah valid
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// ======================================================================
// UTILITY TYPES FOR SPECIFIC DOMAINS
// ======================================================================

/**
 * Type untuk ID entities yang selalu string
 */
export type EntityId = string;

/**
 * Type untuk currency amount dalam Rupiah (integer)
 */
export type CurrencyAmount = number;

/**
 * Type untuk quantity yang selalu positive number
 */
export type Quantity = number;

/**
 * Type untuk percentage (0-100)
 */
export type Percentage = number;

/**
 * Type untuk tax rate (decimal, e.g., 0.11 for 11%)
 */
export type TaxRate = number;

/**
 * Type untuk timestamp dalam format ISO string
 */
export type Timestamp = string;

/**
 * Type untuk barcode/SKU
 */
export type ProductCode = string;

/**
 * Type untuk phone number Indonesia
 */
export type PhoneNumber = string;

/**
 * Type untuk email address
 */
export type EmailAddress = string;

/**
 * Type untuk NPWP (Nomor Pokok Wajib Pajak)
 */
export type TaxId = string;

/**
 * Type untuk branch/company code
 */
export type OrganizationCode = string;

// ======================================================================
// CONSTANTS
// ======================================================================

/**
 * Konstanta untuk payment methods yang didukung
 */
export const PAYMENT_METHODS = {
  CASH: 'cash' as const,
  CARD: 'card' as const,
  EWALLET: 'ewallet' as const,
  TRANSFER: 'transfer' as const,
  VOUCHER: 'voucher' as const
} as const;

/**
 * Konstanta untuk order status
 */
export const ORDER_STATUS = {
  DRAFT: 'draft' as const,
  PAID: 'paid' as const,
  VOID: 'void' as const,
  REFUND: 'refund' as const
} as const;

/**
 * Konstanta untuk session status
 */
export const SESSION_STATUS = {
  OPEN: 'open' as const,
  CLOSED: 'closed' as const
} as const;

/**
 * Konstanta untuk stock movement types
 */
export const STOCK_MOVEMENT_TYPES = {
  IN: 'in' as const,
  OUT: 'out' as const,
  ADJUST: 'adjust' as const,
  TRANSFER_IN: 'transfer_in' as const,
  TRANSFER_OUT: 'transfer_out' as const
} as const;

/**
 * Konstanta untuk reference types
 */
export const REFERENCE_TYPES = {
  POS_ORDER: 'pos_order' as const,
  PURCHASE: 'purchase' as const,
  ADJUSTMENT: 'adjustment' as const,
  TRANSFER: 'transfer' as const
} as const;

/**
 * Konstanta untuk notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  WARNING: 'warning' as const,
  INFO: 'info' as const
} as const;

/**
 * Konstanta untuk export formats
 */
export const EXPORT_FORMATS = {
  EXCEL: 'excel' as const,
  PDF: 'pdf' as const,
  CSV: 'csv' as const
} as const;

/**
 * Konstanta untuk date presets
 */
export const DATE_PRESETS = {
  TODAY: 'today' as const,
  YESTERDAY: 'yesterday' as const,
  THIS_WEEK: 'thisWeek' as const,
  LAST_WEEK: 'lastWeek' as const,
  THIS_MONTH: 'thisMonth' as const,
  LAST_MONTH: 'lastMonth' as const,
  THIS_YEAR: 'thisYear' as const,
  LAST_YEAR: 'lastYear' as const,
  LAST_7_DAYS: 'last7Days' as const,
  LAST_30_DAYS: 'last30Days' as const,
  LAST_90_DAYS: 'last90Days' as const
} as const;