// ======================================================================
// TRANSACTION BY ID API ROUTE
// API endpoints untuk manajemen transaksi individual
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES (same as in route.ts)
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

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const TransactionUpdateSchema = z.object({
  status: z.enum(['draft', 'selesai', 'dibatalkan', 'refund']).optional(),
  catatan: z.string().optional()
});

const RefundRequestSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    jumlahRefund: z.number().min(1, 'Jumlah refund minimal 1')
  })).min(1, 'Minimal satu item untuk refund'),
  alasan: z.string().min(1, 'Alasan refund wajib diisi'),
  metodePengembalian: z.enum(['tunai', 'kartu', 'digital', 'kredit']).default('tunai')
});

const VoidRequestSchema = z.object({
  alasan: z.string().min(1, 'Alasan void wajib diisi'),
  password: z.string().min(1, 'Password supervisor wajib diisi')
});

// ======================================================================
// MOCK DATA (same as in route.ts)
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

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

function generateRefundNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `REF-${dateStr}-${timeStr}`;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/transactions/[id] - Get transaction by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const transaction = mockTransactions.find(trx => trx.id === id);
    
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/transactions/[id] - Update transaction by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const updateData = TransactionUpdateSchema.parse(body);

    const transactionIndex = mockTransactions.findIndex(trx => trx.id === id);
    
    if (transactionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      }, { status: 404 });
    }

    const transaction = mockTransactions[transactionIndex];

    // Validate status transitions
    if (updateData.status) {
      const currentStatus = transaction.status;
      const newStatus = updateData.status;

      // Define allowed status transitions
      const allowedTransitions: Record<string, string[]> = {
        'draft': ['selesai', 'dibatalkan'],
        'selesai': ['refund'],
        'dibatalkan': [],
        'refund': []
      };

      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json({
          success: false,
          error: `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`
        }, { status: 400 });
      }
    }

    // Update transaction
    mockTransactions[transactionIndex] = {
      ...transaction,
      ...updateData,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: mockTransactions[transactionIndex],
      message: 'Transaksi berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    
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

// DELETE /api/transactions/[id] - Delete transaction by ID (only for draft transactions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const transactionIndex = mockTransactions.findIndex(trx => trx.id === id);
    
    if (transactionIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      }, { status: 404 });
    }

    const transaction = mockTransactions[transactionIndex];

    // Only allow deletion of draft transactions
    if (transaction.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Hanya transaksi draft yang dapat dihapus'
      }, { status: 400 });
    }

    // Remove transaction
    const deletedTransaction = mockTransactions.splice(transactionIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedTransaction,
      message: 'Transaksi berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}