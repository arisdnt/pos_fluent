// ======================================================================
// API TYPES UNTUK APLIKASI KASIR
// ======================================================================

import { 
  Product, 
  Customer, 
  PosOrder, 
  PosSession, 
  Stock,
  VwTransaksi,
  VwProduk,
  VwMutasiStok,
  VwShiftKasir,
  PaymentMethod,
  OrderStatus,
  SessionStatus
} from './domain';

// ======================================================================
// AUTH API TYPES
// ======================================================================

export interface LoginRequest {
  username: string;
  password: string;
  branchId?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
  branch: {
    id: string;
    name: string;
    companyName: string;
  };
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ======================================================================
// PRODUCT API TYPES
// ======================================================================

export interface ProductSearchRequest {
  query?: string; // Search by name, SKU, or barcode
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: 'name' | 'sku' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface ProductSearchResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductWithStock extends Product {
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  currentPrice?: number;
}

export interface ProductLookupRequest {
  identifier: string; // SKU, barcode, or product ID
  branchId: string;
}

export interface ProductLookupResponse {
  product: ProductWithStock;
  prices: {
    level: string;
    price: number;
    isDefault: boolean;
  }[];
}

// ======================================================================
// CUSTOMER API TYPES
// ======================================================================

export interface CustomerSearchRequest {
  query?: string; // Search by name, code, or phone
  page?: number;
  limit?: number;
}

export interface CustomerCreateRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  id: string;
}

// ======================================================================
// POS SESSION API TYPES
// ======================================================================

export interface SessionOpenRequest {
  branchId: string;
  cashierId: string;
  openingCash: number;
  notes?: string;
}

export interface SessionCloseRequest {
  sessionId: string;
  closingCash: number;
  notes?: string;
}

export interface SessionSummary {
  session: PosSession;
  sales: {
    totalOrders: number;
    totalAmount: number;
    cashSales: number;
    nonCashSales: number;
  };
  payments: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}

// ======================================================================
// POS ORDER API TYPES
// ======================================================================

export interface OrderCreateRequest {
  branchId: string;
  sessionId?: string;
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    discountAmount?: number;
  }[];
  discountAmount?: number;
  notes?: string;
}

export interface OrderPaymentRequest {
  orderId: string;
  payments: {
    method: PaymentMethod;
    amount: number;
    reference?: string;
  }[];
}

export interface OrderVoidRequest {
  orderId: string;
  reason: string;
  voidedBy: string;
}

export interface OrderRefundRequest {
  orderId: string;
  items: {
    lineId: string;
    quantity: number;
    reason: string;
  }[];
  refundedBy: string;
}

export interface OrderHoldRequest {
  orderId: string;
  notes?: string;
}

export interface OrderResumeRequest {
  orderId: string;
}

// ======================================================================
// STOCK API TYPES
// ======================================================================

export interface StockCheckRequest {
  productId: string;
  branchId: string;
}

export interface StockCheckResponse {
  productId: string;
  branchId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: Date;
}

export interface StockAdjustmentRequest {
  branchId: string;
  adjustments: {
    productId: string;
    newQuantity: number;
    reason: string;
  }[];
  adjustedBy: string;
  notes?: string;
}

export interface StockTransferRequest {
  fromBranchId: string;
  toBranchId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  transferredBy: string;
  notes?: string;
}

// ======================================================================
// REPORT API TYPES
// ======================================================================

export interface SalesReportRequest {
  branchId?: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month';
  cashierId?: string;
  customerId?: string;
}

export interface SalesReportResponse {
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalTax: number;
    totalDiscount: number;
    averageOrderValue: number;
  };
  breakdown: {
    date: string;
    orders: number;
    amount: number;
    tax: number;
    discount: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
  }[];
  paymentMethods: {
    method: PaymentMethod;
    count: number;
    amount: number;
    percentage: number;
  }[];
}

export interface ProductReportRequest {
  branchId?: string;
  categoryId?: string;
  brandId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'name' | 'sales' | 'stock';
  order?: 'asc' | 'desc';
}

export interface ProductReportResponse {
  products: {
    product: Product;
    currentStock: number;
    salesQuantity: number;
    salesAmount: number;
    lastSaleDate?: Date;
  }[];
}

export interface StockReportRequest {
  branchId?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
}

export interface StockReportResponse {
  items: {
    product: Product;
    currentStock: number;
    minStock: number;
    maxStock: number;
    status: 'normal' | 'low' | 'out_of_stock' | 'overstock';
    lastMovement?: Date;
  }[];
}

// ======================================================================
// DASHBOARD API TYPES
// ======================================================================

export interface DashboardStatsRequest {
  branchId?: string;
  period?: 'today' | 'week' | 'month' | 'year';
}

export interface DashboardStatsResponse {
  sales: {
    today: number;
    yesterday: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  orders: {
    today: number;
    pending: number;
    completed: number;
    voided: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
    topSelling: {
      productId: string;
      name: string;
      quantity: number;
    }[];
  };
  sessions: {
    active: number;
    todayTotal: number;
    currentCash: number;
  };
}

// ======================================================================
// EXPORT API TYPES
// ======================================================================

export interface ExportRequest {
  type: 'sales' | 'products' | 'stock' | 'transactions';
  format: 'excel' | 'pdf';
  filters: {
    branchId?: string;
    startDate?: Date;
    endDate?: Date;
    [key: string]: any;
  };
  options?: {
    includeDetails?: boolean;
    groupBy?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  };
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}

// ======================================================================
// REAL-TIME API TYPES
// ======================================================================

export interface WebSocketMessage {
  type: 'stock_update' | 'order_update' | 'session_update' | 'notification';
  data: any;
  timestamp: Date;
  branchId?: string;
}

export interface StockUpdateMessage {
  type: 'stock_update';
  data: {
    productId: string;
    branchId: string;
    oldQuantity: number;
    newQuantity: number;
    movementType: string;
  };
}

export interface OrderUpdateMessage {
  type: 'order_update';
  data: {
    orderId: string;
    status: OrderStatus;
    branchId: string;
    cashierId: string;
  };
}

export interface SessionUpdateMessage {
  type: 'session_update';
  data: {
    sessionId: string;
    status: SessionStatus;
    branchId: string;
    cashierId: string;
  };
}

export interface NotificationMessage {
  type: 'notification';
  data: {
    id: string;
    title: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    branchId?: string;
    userId?: string;
  };
}

// ======================================================================
// ERROR TYPES
// ======================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  validationErrors?: ValidationError[];
}

// ======================================================================
// GENERIC API RESPONSE
// ======================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ======================================================================
// PAGINATION TYPES
// ======================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

// ======================================================================
// FILTER TYPES
// ======================================================================

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface StatusFilter {
  status?: string | string[];
}

export interface BranchFilter {
  branchId?: string | string[];
}

export interface SearchFilter {
  search?: string;
  searchFields?: string[];
}

export type CommonFilters = DateRangeFilter & StatusFilter & BranchFilter & SearchFilter;

// ======================================================================
// BULK OPERATION TYPES
// ======================================================================

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkOperationResponse<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: {
    success: boolean;
    item: T;
    error?: string;
  }[];
  errors: string[];
}

// ======================================================================
// CACHE TYPES
// ======================================================================

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[];
}

export interface CacheInvalidation {
  keys?: string[];
  tags?: string[];
  pattern?: string;
}