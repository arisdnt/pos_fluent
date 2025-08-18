// ======================================================================
// TRANSACTION VOID API ROUTE
// API endpoint untuk void/batalkan transaksi
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface VoidTransaction {
  id: string;
  transaksiAsliId: string;
  nomorTransaksiAsli: string;
  tanggal: Date;
  kasirId: string;
  kasirNama: string;
  supervisorId: string;
  supervisorNama: string;
  alasan: string;
  totalVoid: number;
  status: 'pending' | 'disetujui' | 'ditolak';
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const VoidRequestSchema = z.object({
  alasan: z.string().min(1, 'Alasan void wajib diisi'),
  supervisorPassword: z.string().min(1, 'Password supervisor wajib diisi'),
  kasirId: z.string().min(1, 'ID kasir wajib diisi'),
  kasirNama: z.string().min(1, 'Nama kasir wajib diisi')
});

// ======================================================================
// MOCK DATA
// ======================================================================

// Mock supervisor credentials (in real app, this would be in database)
const mockSupervisors = [
  {
    id: 'sup_001',
    nama: 'Manager Toko',
    password: 'supervisor123' // In real app, this would be hashed
  }
];

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

let mockVoids: VoidTransaction[] = [];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

function validateSupervisorPassword(password: string): { isValid: boolean; supervisor?: any } {
  const supervisor = mockSupervisors.find(sup => sup.password === password);
  return {
    isValid: !!supervisor,
    supervisor
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// POST /api/transactions/[id]/void - Void transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const voidData = VoidRequestSchema.parse(body);

    // Find the original transaction
    const transaction = mockTransactions.find(trx => trx.id === id);
    
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi tidak ditemukan'
      }, { status: 404 });
    }

    // Check if transaction can be voided
    if (transaction.status !== 'selesai') {
      return NextResponse.json({
        success: false,
        error: 'Hanya transaksi yang selesai yang dapat di-void'
      }, { status: 400 });
    }

    // Check if transaction is too old (example: max 24 hours)
    const transactionAge = Date.now() - transaction.tanggal.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (transactionAge > maxAge) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi terlalu lama untuk di-void (maksimal 24 jam)'
      }, { status: 400 });
    }

    // Validate supervisor password
    const supervisorValidation = validateSupervisorPassword(voidData.supervisorPassword);
    
    if (!supervisorValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Password supervisor tidak valid'
      }, { status: 401 });
    }

    // Check if transaction has already been voided
    const existingVoid = mockVoids.find(voidTrx => 
      voidTrx.transaksiAsliId === id && voidTrx.status !== 'ditolak'
    );
    
    if (existingVoid) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi sudah pernah di-void'
      }, { status: 400 });
    }

    // Create void transaction
    const voidTransaction: VoidTransaction = {
      id: generateId('void'),
      transaksiAsliId: transaction.id,
      nomorTransaksiAsli: transaction.nomorTransaksi,
      tanggal: new Date(),
      kasirId: voidData.kasirId,
      kasirNama: voidData.kasirNama,
      supervisorId: supervisorValidation.supervisor.id,
      supervisorNama: supervisorValidation.supervisor.nama,
      alasan: voidData.alasan,
      totalVoid: transaction.total,
      status: 'disetujui', // Auto-approve since supervisor password is validated
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockVoids.push(voidTransaction);

    // Update original transaction status to cancelled
    const transactionIndex = mockTransactions.findIndex(trx => trx.id === id);
    if (transactionIndex !== -1) {
      mockTransactions[transactionIndex] = {
        ...mockTransactions[transactionIndex],
        status: 'dibatalkan',
        updatedAt: new Date()
      };
    }

    return NextResponse.json({
      success: true,
      data: voidTransaction,
      message: 'Transaksi berhasil di-void'
    }, { status: 201 });

  } catch (error) {
    console.error('Error voiding transaction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data void tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/transactions/[id]/void - Get void records for transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find void records for this transaction
    const voids = mockVoids.filter(voidTrx => voidTrx.transaksiAsliId === id);

    return NextResponse.json({
      success: true,
      data: voids
    });

  } catch (error) {
    console.error('Error fetching void records:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}