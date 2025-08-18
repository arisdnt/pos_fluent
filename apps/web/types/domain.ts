// ======================================================================
// TYPES DOMAIN APLIKASI KASIR
// Sesuai dengan skema database PostgreSQL
// ======================================================================

export interface Company {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string; // NPWP
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  passwordHash: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  branchId: string;
  isActive: boolean;
  assignedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  createdAt: Date;
}

export interface TaxGroup {
  id: string;
  name: string;
  rate: number; // Decimal rate (0.1100 untuk 11%)
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  unitId: string;
  taxGroupId?: string;
  cost: number; // Harga pokok dalam Rupiah (integer)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  category?: Category;
  brand?: Brand;
  unit?: Unit;
  taxGroup?: TaxGroup;
}

export interface ProductPrice {
  id: string;
  productId: string;
  priceLevel: string;
  branchId?: string;
  price: number; // Harga jual dalam Rupiah (integer)
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string; // NPWP
  creditLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string; // NPWP
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  reservedQuantity: number;
  minStock: number;
  maxStock: number;
  updatedAt: Date;
  
  // Relations
  product?: Product;
  branch?: Branch;
}

export type StockMovementType = 'in' | 'out' | 'adjust' | 'transfer_in' | 'transfer_out';
export type ReferenceType = 'pos_order' | 'purchase' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: string;
  productId: string;
  branchId: string;
  movementType: StockMovementType;
  quantity: number;
  referenceType?: ReferenceType;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  
  // Relations
  product?: Product;
  branch?: Branch;
  createdByUser?: User;
}

export type SessionStatus = 'open' | 'closed';

export interface PosSession {
  id: string;
  sessionNo: string;
  branchId: string;
  cashierId: string;
  openedAt: Date;
  openingCash: number; // Kas awal dalam Rupiah
  closedAt?: Date;
  closingCash: number; // Kas akhir dalam Rupiah
  expectedCash: number; // Kas yang seharusnya
  cashDifference: number; // Selisih kas
  status: SessionStatus;
  notes?: string;
  createdAt: Date;
  
  // Relations
  branch?: Branch;
  cashier?: User;
}

export type OrderStatus = 'draft' | 'paid' | 'void' | 'refund';

export interface PosOrder {
  id: string;
  orderNo: string;
  branchId: string;
  sessionId?: string;
  customerId?: string;
  cashierId: string;
  status: OrderStatus;
  subtotal: number; // Subtotal dalam Rupiah
  discountAmount: number; // Diskon dalam Rupiah
  taxAmount: number; // PPN dalam Rupiah
  roundingAmount: number; // Pembulatan dalam Rupiah
  total: number; // Total akhir dalam Rupiah
  paidTotal: number; // Total dibayar dalam Rupiah
  changeAmount: number; // Kembalian dalam Rupiah
  notes?: string;
  paidAt?: Date;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  createdAt: Date;
  
  // Relations
  branch?: Branch;
  session?: PosSession;
  customer?: Customer;
  cashier?: User;
  lines?: PosOrderLine[];
  payments?: PosPayment[];
}

export interface PosOrderLine {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number; // Harga satuan dalam Rupiah
  discountAmount: number; // Diskon item dalam Rupiah
  taxAmount: number; // PPN item dalam Rupiah
  lineTotal: number; // Total baris (auto calculated)
  createdAt: Date;
  
  // Relations
  order?: PosOrder;
  product?: Product;
}

export type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'transfer' | 'voucher';

export interface PosPayment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number; // Jumlah bayar dalam Rupiah
  reference?: string; // Nomor referensi untuk non-cash
  capturedAt: Date;
  createdAt: Date;
  
  // Relations
  order?: PosOrder;
}

// ======================================================================
// VIEW TYPES (Bahasa Indonesia)
// ======================================================================

export interface VwTransaksi {
  idTransaksi: string;
  nomorStruk: string;
  tanggalWib: Date;
  cabang: string;
  kasir: string;
  status: string;
  subtotalRp: number;
  diskonRp: number;
  ppnRp: number;
  pembulatanRp: number;
  totalRp: number;
  bayarRp: number;
  kembaliRp: number;
  metodeBayar?: string;
  pelanggan?: string;
}

export interface VwTransaksiItem {
  idTransaksi: string;
  nomorStruk: string;
  tanggalWib: Date;
  sku: string;
  barcode?: string;
  namaProduk: string;
  qty: number;
  hargaSatuanRp: number;
  diskonItemRp: number;
  ppnItemRp: number;
  subtotalItemRp: number;
  cabang: string;
  kasir: string;
}

export interface VwProduk {
  idProduk: string;
  sku: string;
  barcode?: string;
  nama: string;
  kategori?: string;
  merek?: string;
  satuan: string;
  grupPajak?: string;
  tarifPajak?: number;
  hargaPokokRp: number;
  hargaJualAktifRp?: number;
  stokTersedia: number;
  statusAktif: string;
}

export interface VwMutasiStok {
  tanggalWib: Date;
  produk: string;
  sku: string;
  cabang: string;
  jenisMutasi: string;
  qty: number;
  tipeReferensi?: string;
  idReferensi?: string;
  keterangan?: string;
  dibuatOleh?: string;
}

export interface VwShiftKasir {
  idShift: string;
  nomorSesi: string;
  cabang: string;
  kasir: string;
  bukaPadaWib: Date;
  tutupPadaWib?: Date;
  kasAwalRp: number;
  kasAkhirRp: number;
  kasSeharusnyaRp: number;
  selisihKasRp: number;
  penjualanTunaiRp: number;
  penjualanNonTunaiRp: number;
  status: string;
}

// ======================================================================
// CART & UI TYPES
// ======================================================================

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  rounding: number;
  total: number;
}

export interface PaymentSummary {
  subtotal: number;
  discount: number;
  tax: number;
  rounding: number;
  total: number;
  paid: number;
  change: number;
}

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

// ======================================================================
// CONFIGURATION TYPES
// ======================================================================

export interface TaxConfig {
  isActive: boolean;
  rate: number;
  isInclusive: boolean; // true = tax inclusive, false = tax exclusive
}

export interface RoundingConfig {
  isActive: boolean;
  roundTo: 50 | 100; // Pembulatan ke Rp 50 atau Rp 100
}

export interface AppConfig {
  branchId: string;
  branchName: string;
  companyName: string;
  tax: TaxConfig;
  rounding: RoundingConfig;
  timezone: string; // 'Asia/Jakarta'
  currency: string; // 'IDR'
  locale: string; // 'id-ID'
}

// ======================================================================
// API RESPONSE TYPES
// ======================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// ======================================================================
// HOTKEY TYPES
// ======================================================================

export type HotkeyAction = 
  | 'search' // F2
  | 'discount' // F4
  | 'payment' // F7
  | 'hold' // F8
  | 'refund' // F9
  | 'void' // F10
  | 'print' // Ctrl+P
  | 'delete' // Del
  | 'escape'; // Esc

export interface HotkeyConfig {
  key: string;
  action: HotkeyAction;
  description: string;
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type ExportFormat = 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}