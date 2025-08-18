// ======================================================================
// TRANSACTION REFUND API ROUTE
// API endpoint untuk refund transaksi
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface RefundItem {
  itemId: string;
  produkId: string;
  produkKode: string;
  produkNama: string;
  hargaSatuan: number;
  jumlahAsli: number;
  jumlahRefund: number;
  subtotalRefund: number;
}

interface RefundTransaction {
  id: string;
  nomorRefund: string;
  transaksiAsliId: string;
  nomorTransaksiAsli: string;
  tanggal: Date;
  kasirId: string;
  kasirNama: string;
  items: RefundItem[];
  totalRefund: number;
  metodePengembalian: 'tunai' | 'kartu' | 'digital' | 'kredit';
  alasan: string;
  status: 'pending' | 'disetujui' | 'ditolak' | 'selesai';
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const RefundRequestSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1, 'ID item wajib diisi'),
    jumlahRefund: z.number().min(1, 'Jumlah refund minimal 1')
  })).min(1, 'Minimal satu item untuk refund'),
  alasan: z.string().min(1, 'Alasan refund wajib diisi'),
  metodePengembalian: z.enum(['tunai', 'kartu', 'digital', 'kredit']).default('tunai'),
  kasirId: z.string().min(1, 'ID kasir wajib diisi'),
  kasirNama: z.string().min(1, 'Nama kasir wajib diisi')
});

// ======================================================================
// MOCK DATA
// ======================================================================

// Import mock transactions from parent route
let mockTransactions = [
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
  }
];

let mockRefunds: RefundTransaction[] = [];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateRefundNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `REF-${dateStr}-${timeStr}`;
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// POST /api/transactions/[id]/refund - Create refund for transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const refundData = RefundRequestSchema.parse(body);

    // Find the original transaction
    const transaction = mockTransactions.find(trx => trx.id === id);
    
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      }, { status: 404 });
    }

    // Check if transaction can be refunded
    if (transaction.status !== 'selesai') {
      return NextResponse.json({
        success: false,
        error: 'Hanya transaksi yang selesai yang dapat di-refund'
      }, { status: 400 });
    }

    // Validate refund items
    const refundItems: RefundItem[] = [];
    let totalRefund = 0;

    for (const refundItem of refundData.items) {
      const originalItem = transaction.items.find(item => item.id === refundItem.itemId);
      
      if (!originalItem) {
        return NextResponse.json({
          success: false,
          error: `Item dengan ID ${refundItem.itemId} tidak ditemukan dalam transaksi`
        }, { status: 400 });
      }

      // Check if refund quantity is valid
      if (refundItem.jumlahRefund > originalItem.jumlah) {
        return NextResponse.json({
          success: false,
          error: `Jumlah refund untuk ${originalItem.produkNama} melebihi jumlah asli`
        }, { status: 400 });
      }

      // Calculate refund amount for this item
      const subtotalRefund = (originalItem.hargaSatuan * refundItem.jumlahRefund) - 
                            (originalItem.diskon * (refundItem.jumlahRefund / originalItem.jumlah));

      const refundItemData: RefundItem = {
        itemId: refundItem.itemId,
        produkId: originalItem.produkId,
        produkKode: originalItem.produkKode,
        produkNama: originalItem.produkNama,
        hargaSatuan: originalItem.hargaSatuan,
        jumlahAsli: originalItem.jumlah,
        jumlahRefund: refundItem.jumlahRefund,
        subtotalRefund: Math.round(subtotalRefund)
      };

      refundItems.push(refundItemData);
      totalRefund += refundItemData.subtotalRefund;
    }

    // Apply proportional tax and discount to refund
    const refundRatio = totalRefund / transaction.subtotal;
    const taxRefund = Math.round(transaction.pajak * refundRatio);
    const discountRefund = Math.round(transaction.diskon * refundRatio);
    
    totalRefund = totalRefund - discountRefund + taxRefund;

    // Create refund transaction
    const refundTransaction: RefundTransaction = {
      id: generateId('ref'),
      nomorRefund: generateRefundNumber(),
      transaksiAsliId: transaction.id,
      nomorTransaksiAsli: transaction.nomorTransaksi,
      tanggal: new Date(),
      kasirId: refundData.kasirId,
      kasirNama: refundData.kasirNama,
      items: refundItems,
      totalRefund,
      metodePengembalian: refundData.metodePengembalian,
      alasan: refundData.alasan,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRefunds.push(refundTransaction);

    // Update original transaction status to refund if fully refunded
    const isFullRefund = refundItems.every(refundItem => {
      const originalItem = transaction.items.find(item => item.id === refundItem.itemId);
      return originalItem && refundItem.jumlahRefund === originalItem.jumlah;
    }) && refundItems.length === transaction.items.length;

    if (isFullRefund) {
      const transactionIndex = mockTransactions.findIndex(trx => trx.id === id);
      if (transactionIndex !== -1) {
        mockTransactions[transactionIndex] = {
          ...mockTransactions[transactionIndex],
          status: 'refund',
          updatedAt: new Date()
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: refundTransaction,
      message: 'Permintaan refund berhasil dibuat'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating refund:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data refund tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/transactions/[id]/refund - Get refunds for transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find refunds for this transaction
    const refunds = mockRefunds.filter(refund => refund.transaksiAsliId === id);

    return NextResponse.json({
      success: true,
      data: refunds
    });

  } catch (error) {
    console.error('Error fetching refunds:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}