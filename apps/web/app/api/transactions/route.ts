// ======================================================================
// TRANSACTIONS API ROUTE
// API endpoints untuk manajemen transaksi POS
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface TransactionItem {
  id: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  hargaSatuan: number;
  jumlah: number;
  diskon: number;
  subtotal: number;
}

interface Payment {
  id: string;
  metode: 'tunai' | 'kartu' | 'digital' | 'kredit' | 'voucher';
  jumlah: number;
  referensi?: string;
  status: 'pending' | 'berhasil' | 'gagal';
}

interface Transaction {
  id: string;
  nomorTransaksi: string;
  tanggal: Date;
  kasirId: string;
  kasirNama: string;
  pelangganId?: string;
  pelangganNama?: string;
  items: TransactionItem[];
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  dibayar: number;
  kembalian: number;
  payments: Payment[];
  status: 'draft' | 'selesai' | 'dibatalkan' | 'refund';
  catatan?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionQuery {
  search?: string;
  kasirId?: string;
  pelangganId?: string;
  status?: string;
  metodePembayaran?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  sortBy?: 'tanggal' | 'total' | 'nomorTransaksi';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const TransactionQuerySchema = z.object({
  search: z.string().optional(),
  kasirId: z.string().optional(),
  pelangganId: z.string().optional(),
  status: z.enum(['draft', 'selesai', 'dibatalkan', 'refund']).optional(),
  metodePembayaran: z.enum(['tunai', 'kartu', 'digital', 'kredit', 'voucher']).optional(),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  sortBy: z.enum(['tanggal', 'total', 'nomorTransaksi']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const TransactionItemSchema = z.object({
  produkId: z.string().min(1, 'ID produk wajib diisi'),
  produkKode: z.string().min(1, 'Kode produk wajib diisi'),
  produkNama: z.string().min(1, 'Nama produk wajib diisi'),
  hargaSatuan: z.number().min(0, 'Harga satuan tidak boleh negatif'),
  jumlah: z.number().min(1, 'Jumlah minimal 1'),
  diskon: z.number().min(0, 'Diskon tidak boleh negatif').default(0)
});

const PaymentSchema = z.object({
  metode: z.enum(['tunai', 'kartu', 'digital', 'kredit', 'voucher']),
  jumlah: z.number().min(0, 'Jumlah pembayaran tidak boleh negatif'),
  referensi: z.string().optional()
});

const TransactionCreateSchema = z.object({
  kasirId: z.string().min(1, 'ID kasir wajib diisi'),
  kasirNama: z.string().min(1, 'Nama kasir wajib diisi'),
  pelangganId: z.string().optional(),
  pelangganNama: z.string().optional(),
  items: z.array(TransactionItemSchema).min(1, 'Minimal satu item harus ada'),
  payments: z.array(PaymentSchema).min(1, 'Minimal satu pembayaran harus ada'),
  diskon: z.number().min(0, 'Diskon tidak boleh negatif').default(0),
  catatan: z.string().optional()
});

const TransactionUpdateSchema = z.object({
  status: z.enum(['draft', 'selesai', 'dibatalkan', 'refund']).optional(),
  catatan: z.string().optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockTransactions: Transaction[] = [
  {
    id: 'trx_001',
    nomorTransaksi: 'TRX-20240101-001',
    tanggal: new Date('2024-01-01T10:30:00'),
    kasirId: 'usr_001',
    kasirNama: 'Siti Aminah',
    pelangganId: 'cust_001',
    pelangganNama: 'Budi Santoso',
    items: [
      {
        id: 'item_001',
        produkId: 'prod_001',
        produkKode: 'BRG001',
        produkNama: 'Indomie Goreng',
        hargaSatuan: 3500,
        jumlah: 2,
        diskon: 0,
        subtotal: 7000
      },
      {
        id: 'item_002',
        produkId: 'prod_002',
        produkKode: 'BRG002',
        produkNama: 'Aqua 600ml',
        hargaSatuan: 3000,
        jumlah: 1,
        diskon: 0,
        subtotal: 3000
      }
    ],
    subtotal: 10000,
    diskon: 0,
    pajak: 1000,
    total: 11000,
    dibayar: 15000,
    kembalian: 4000,
    payments: [
      {
        id: 'pay_001',
        metode: 'tunai',
        jumlah: 15000,
        status: 'berhasil'
      }
    ],
    status: 'selesai',
    catatan: 'Transaksi normal',
    createdAt: new Date('2024-01-01T10:30:00'),
    updatedAt: new Date('2024-01-01T10:30:00')
  },
  {
    id: 'trx_002',
    nomorTransaksi: 'TRX-20240101-002',
    tanggal: new Date('2024-01-01T14:15:00'),
    kasirId: 'usr_002',
    kasirNama: 'Ahmad Wijaya',
    items: [
      {
        id: 'item_003',
        produkId: 'prod_003',
        produkKode: 'BRG003',
        produkNama: 'Beras Premium 5kg',
        hargaSatuan: 55000,
        jumlah: 1,
        diskon: 5000,
        subtotal: 50000
      }
    ],
    subtotal: 50000,
    diskon: 5000,
    pajak: 0,
    total: 45000,
    dibayar: 45000,
    kembalian: 0,
    payments: [
      {
        id: 'pay_002',
        metode: 'kartu',
        jumlah: 45000,
        referensi: 'CARD-123456',
        status: 'berhasil'
      }
    ],
    status: 'selesai',
    createdAt: new Date('2024-01-01T14:15:00'),
    updatedAt: new Date('2024-01-01T14:15:00')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function calculateTransactionTotals(items: TransactionItem[], globalDiskon: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const diskon = globalDiskon;
  const subtotalAfterDiskon = subtotal - diskon;
  
  // Calculate tax (10% for taxable items)
  const pajak = Math.round(subtotalAfterDiskon * 0.1);
  const total = subtotalAfterDiskon + pajak;
  
  return { subtotal, diskon, pajak, total };
}

function generateTransactionNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `TRX-${dateStr}-${timeStr}`;
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

function filterTransactions(transactions: Transaction[], query: TransactionQuery): Transaction[] {
  let filtered = [...transactions];

  // Filter by search (transaction number, customer name, cashier name)
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(trx =>
      trx.nomorTransaksi.toLowerCase().includes(searchLower) ||
      (trx.pelangganNama && trx.pelangganNama.toLowerCase().includes(searchLower)) ||
      trx.kasirNama.toLowerCase().includes(searchLower)
    );
  }

  // Filter by cashier
  if (query.kasirId) {
    filtered = filtered.filter(trx => trx.kasirId === query.kasirId);
  }

  // Filter by customer
  if (query.pelangganId) {
    filtered = filtered.filter(trx => trx.pelangganId === query.pelangganId);
  }

  // Filter by status
  if (query.status) {
    filtered = filtered.filter(trx => trx.status === query.status);
  }

  // Filter by payment method
  if (query.metodePembayaran) {
    filtered = filtered.filter(trx => 
      trx.payments.some(payment => payment.metode === query.metodePembayaran)
    );
  }

  // Filter by date range
  if (query.tanggalMulai) {
    const startDate = new Date(query.tanggalMulai);
    filtered = filtered.filter(trx => trx.tanggal >= startDate);
  }

  if (query.tanggalSelesai) {
    const endDate = new Date(query.tanggalSelesai);
    endDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(trx => trx.tanggal <= endDate);
  }

  return filtered;
}

function sortTransactions(transactions: Transaction[], sortBy: string, sortOrder: string): Transaction[] {
  return transactions.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'tanggal':
        aValue = a.tanggal.getTime();
        bValue = b.tanggal.getTime();
        break;
      case 'total':
        aValue = a.total;
        bValue = b.total;
        break;
      case 'nomorTransaksi':
        aValue = a.nomorTransaksi;
        bValue = b.nomorTransaksi;
        break;
      default:
        aValue = a.tanggal.getTime();
        bValue = b.tanggal.getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function paginateTransactions(transactions: Transaction[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: transactions.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: transactions.length,
      totalPages: Math.ceil(transactions.length / limit),
      hasNext: endIndex < transactions.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/transactions - Get all transactions with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = TransactionQuerySchema.parse(queryParams);
    
    const query: TransactionQuery = {
      search: validatedQuery.search,
      kasirId: validatedQuery.kasirId,
      pelangganId: validatedQuery.pelangganId,
      status: validatedQuery.status,
      metodePembayaran: validatedQuery.metodePembayaran,
      tanggalMulai: validatedQuery.tanggalMulai,
      tanggalSelesai: validatedQuery.tanggalSelesai,
      sortBy: validatedQuery.sortBy || 'tanggal',
      sortOrder: validatedQuery.sortOrder || 'desc',
      page: validatedQuery.page ? parseInt(validatedQuery.page) : 1,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 20
    };

    // Apply filters
    let filteredTransactions = filterTransactions(mockTransactions, query);
    
    // Apply sorting
    filteredTransactions = sortTransactions(filteredTransactions, query.sortBy!, query.sortOrder!);
    
    // Apply pagination
    const result = paginateTransactions(filteredTransactions, query.page!, query.limit!);

    // Calculate summary statistics
    const totalAmount = filteredTransactions.reduce((sum, trx) => sum + trx.total, 0);
    const totalTransactions = filteredTransactions.length;

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: {
        totalTransactions,
        totalAmount
      },
      query
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parameter query tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionData = TransactionCreateSchema.parse(body);

    // Calculate item subtotals
    const items: TransactionItem[] = transactionData.items.map(item => ({
      id: generateId('item'),
      ...item,
      subtotal: (item.hargaSatuan * item.jumlah) - item.diskon
    }));

    // Calculate totals
    const totals = calculateTransactionTotals(items, transactionData.diskon);
    
    // Calculate payments
    const totalPaid = transactionData.payments.reduce((sum, payment) => sum + payment.jumlah, 0);
    const kembalian = Math.max(0, totalPaid - totals.total);

    // Create payments with IDs
    const payments: Payment[] = transactionData.payments.map(payment => ({
      id: generateId('pay'),
      ...payment,
      status: 'berhasil' as const
    }));

    // Create new transaction
    const newTransaction: Transaction = {
      id: generateId('trx'),
      nomorTransaksi: generateTransactionNumber(),
      tanggal: new Date(),
      kasirId: transactionData.kasirId,
      kasirNama: transactionData.kasirNama,
      pelangganId: transactionData.pelangganId,
      pelangganNama: transactionData.pelangganNama,
      items,
      subtotal: totals.subtotal,
      diskon: totals.diskon,
      pajak: totals.pajak,
      total: totals.total,
      dibayar: totalPaid,
      kembalian,
      payments,
      status: totalPaid >= totals.total ? 'selesai' : 'draft',
      catatan: transactionData.catatan,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTransactions.push(newTransaction);

    return NextResponse.json({
      success: true,
      data: newTransaction,
      message: 'Transaksi berhasil dibuat'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating transaction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data transaksi tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}