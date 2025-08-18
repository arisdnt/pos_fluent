// ======================================================================
// API ROUTES INDEX
// Central export file untuk semua API routes dan utilities
// ======================================================================

// ======================================================================
// API ROUTE EXPORTS
// ======================================================================

// Products API
export * from './products/route';
export * from './products/[id]/route';

// Categories API
export * from './categories/route';
export * from './categories/[id]/route';

// Transactions API
export * from './transactions/route';
export * from './transactions/[id]/route';
export * from './transactions/[id]/refund/route';
export * from './transactions/[id]/void/route';

// Customers API
export * from './customers/route';
export * from './customers/[id]/route';
export * from './customers/[id]/points/route';

// Reports API
export * from './reports/route';
export * from './reports/export/route';

// Shifts API
export * from './shifts/route';
export * from './shifts/[id]/route';
export * from './shifts/[id]/cash-drawer/route';

// ======================================================================
// COMMON API TYPES
// ======================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponseWithPagination<T = any> extends ApiResponse<T> {
  pagination: PaginationParams;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QueryParams extends SortParams, FilterParams {
  page?: number;
  limit?: number;
}

// ======================================================================
// COMMON API UTILITIES
// ======================================================================

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  details?: any
): ApiResponse<T> {
  const response: ApiResponse<T> = { success };
  
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  if (details) response.details = details;
  
  return response;
}

/**
 * Create paginated API response
 */
export function createPaginatedResponse<T>(
  success: boolean,
  data: T[],
  pagination: PaginationParams,
  message?: string,
  error?: string
): ApiResponseWithPagination<T[]> {
  return {
    success,
    data,
    pagination,
    ...(message && { message }),
    ...(error && { error })
  };
}

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationParams {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Parse query parameters with defaults
 */
export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    category: searchParams.get('category') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined
  };
}

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Format currency to Indonesian Rupiah
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
 * Format date to Indonesian locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Format datetime to Indonesian locale
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
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Indonesian)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitize search string
 */
export function sanitizeSearchString(search: string): string {
  return search
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get date range for period
 */
export function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date, end: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  return { start, end };
}

// ======================================================================
// ERROR HANDLING UTILITIES
// ======================================================================

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): ApiResponse {
  console.error('API Error:', error);
  
  if (error.name === 'ZodError') {
    return createApiResponse(
      false,
      undefined,
      undefined,
      'Data tidak valid',
      error.errors
    );
  }
  
  if (error.code === 'ENOTFOUND') {
    return createApiResponse(
      false,
      undefined,
      undefined,
      'Koneksi database gagal'
    );
  }
  
  return createApiResponse(
    false,
    undefined,
    undefined,
    'Internal server error'
  );
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string[] {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return missingFields;
}

// ======================================================================
// CONSTANTS
// ======================================================================

export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT_ORDER: 'desc' as const,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  CURRENCY_CODE: 'IDR',
  LOCALE: 'id-ID',
  TIMEZONE: 'Asia/Jakarta'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const ERROR_MESSAGES = {
  INVALID_DATA: 'Data tidak valid',
  NOT_FOUND: 'Data tidak ditemukan',
  UNAUTHORIZED: 'Tidak memiliki akses',
  FORBIDDEN: 'Akses ditolak',
  CONFLICT: 'Data sudah ada',
  INTERNAL_ERROR: 'Terjadi kesalahan server',
  VALIDATION_ERROR: 'Validasi data gagal',
  DATABASE_ERROR: 'Kesalahan database',
  NETWORK_ERROR: 'Kesalahan jaringan'
} as const;