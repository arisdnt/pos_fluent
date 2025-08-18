// ======================================================================
// SHIFT BY ID API ROUTE
// API endpoints untuk manajemen shift individual
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES (same as in route.ts)
// ======================================================================

interface Shift {
  id: string;
  nomorShift: string;
  kasirId: string;
  namaKasir: string;
  tanggalMulai: Date;
  tanggalSelesai?: Date;
  jamMulai: string;
  jamSelesai?: string;
  modalAwal: number;
  modalAkhir?: number;
  totalPenjualan: number;
  totalTransaksi: number;
  totalTunai: number;
  totalNonTunai: number;
  selisihKas?: number;
  catatan?: string;
  status: 'aktif' | 'selesai' | 'ditutup';
  createdAt: Date;
  updatedAt: Date;
}

interface CashDrawer {
  id: string;
  shiftId: string;
  tipe: 'buka' | 'tutup' | 'hitung';
  nominal: number;
  keterangan: string;
  waktu: Date;
  kasirId: string;
}

interface ShiftTransaction {
  id: string;
  nomorTransaksi: string;
  customerId?: string;
  namaCustomer?: string;
  total: number;
  metodePembayaran: string;
  tanggal: Date;
  status: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ShiftCloseSchema = z.object({
  modalAkhir: z.number().min(0, 'Modal akhir tidak boleh negatif'),
  catatan: z.string().optional()
});

const CashDrawerSchema = z.object({
  tipe: z.enum(['buka', 'tutup', 'hitung']),
  nominal: z.number(),
  keterangan: z.string().min(1, 'Keterangan wajib diisi')
});

// ======================================================================
// MOCK DATA (same as in route.ts)
// ======================================================================

let mockShifts: Shift[] = [
  {
    id: 'shift_001',
    nomorShift: 'SHF-20240115-001',
    kasirId: 'kasir_001',
    namaKasir: 'John Doe',
    tanggalMulai: new Date('2024-01-15T08:00:00'),
    tanggalSelesai: new Date('2024-01-15T16:00:00'),
    jamMulai: '08:00',
    jamSelesai: '16:00',
    modalAwal: 1000000,
    modalAkhir: 1200000,
    totalPenjualan: 8800000,
    totalTransaksi: 15,
    totalTunai: 3000000,
    totalNonTunai: 5800000,
    selisihKas: 0,
    catatan: 'Shift normal',
    status: 'selesai',
    createdAt: new Date('2024-01-15T08:00:00'),
    updatedAt: new Date('2024-01-15T16:00:00')
  },
  {
    id: 'shift_002',
    nomorShift: 'SHF-20240116-001',
    kasirId: 'kasir_002',
    namaKasir: 'Jane Smith',
    tanggalMulai: new Date('2024-01-16T08:00:00'),
    jamMulai: '08:00',
    modalAwal: 1000000,
    totalPenjualan: 5500000,
    totalTransaksi: 8,
    totalTunai: 2000000,
    totalNonTunai: 3500000,
    status: 'aktif',
    createdAt: new Date('2024-01-16T08:00:00'),
    updatedAt: new Date('2024-01-16T08:00:00')
  }
];

let mockCashDrawer: CashDrawer[] = [
  {
    id: 'cd_001',
    shiftId: 'shift_001',
    tipe: 'buka',
    nominal: 1000000,
    keterangan: 'Buka shift pagi',
    waktu: new Date('2024-01-15T08:00:00'),
    kasirId: 'kasir_001'
  },
  {
    id: 'cd_002',
    shiftId: 'shift_001',
    tipe: 'hitung',
    nominal: 1200000,
    keterangan: 'Hitung kas tengah hari',
    waktu: new Date('2024-01-15T12:00:00'),
    kasirId: 'kasir_001'
  },
  {
    id: 'cd_003',
    shiftId: 'shift_001',
    tipe: 'tutup',
    nominal: 1200000,
    keterangan: 'Tutup shift sore',
    waktu: new Date('2024-01-15T16:00:00'),
    kasirId: 'kasir_001'
  }
];

let mockShiftTransactions: ShiftTransaction[] = [
  {
    id: 'trx_001',
    nomorTransaksi: 'TRX-20240115-001',
    customerId: 'cust_001',
    namaCustomer: 'Budi Santoso',
    total: 8800000,
    metodePembayaran: 'tunai',
    tanggal: new Date('2024-01-15T10:30:00'),
    status: 'selesai'
  },
  {
    id: 'trx_002',
    nomorTransaksi: 'TRX-20240115-002',
    customerId: 'cust_002',
    namaCustomer: 'Siti Rahayu',
    total: 5500000,
    metodePembayaran: 'kartu_debit',
    tanggal: new Date('2024-01-15T14:20:00'),
    status: 'selesai'
  },
  {
    id: 'trx_003',
    nomorTransaksi: 'TRX-20240116-001',
    customerId: 'cust_003',
    namaCustomer: 'Ahmad Wijaya',
    total: 2090000,
    metodePembayaran: 'qris',
    tanggal: new Date('2024-01-16T09:15:00'),
    status: 'selesai'
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

function calculateShiftTotals(shiftId: string) {
  const shiftTransactions = mockShiftTransactions.filter(t => {
    // For shift_001, include trx_001 and trx_002
    // For shift_002, include trx_003
    if (shiftId === 'shift_001') {
      return ['trx_001', 'trx_002'].includes(t.id);
    } else if (shiftId === 'shift_002') {
      return ['trx_003'].includes(t.id);
    }
    return false;
  });
  
  const totalPenjualan = shiftTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransaksi = shiftTransactions.length;
  const totalTunai = shiftTransactions
    .filter(t => t.metodePembayaran === 'tunai')
    .reduce((sum, t) => sum + t.total, 0);
  const totalNonTunai = totalPenjualan - totalTunai;

  return {
    totalPenjualan,
    totalTransaksi,
    totalTunai,
    totalNonTunai,
    transactions: shiftTransactions
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/shifts/[id] - Get shift by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const shift = mockShifts.find(s => s.id === id);
    
    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift tidak ditemukan'
      }, { status: 404 });
    }

    // Get cash drawer history for this shift
    const cashDrawerHistory = mockCashDrawer
      .filter(cd => cd.shiftId === id)
      .sort((a, b) => a.waktu.getTime() - b.waktu.getTime());

    // Get transactions for this shift
    const shiftData = calculateShiftTotals(id);

    // Calculate shift summary
    const summary = {
      durasi: shift.tanggalSelesai ? 
        Math.round((shift.tanggalSelesai.getTime() - shift.tanggalMulai.getTime()) / (1000 * 60 * 60)) : 
        Math.round((new Date().getTime() - shift.tanggalMulai.getTime()) / (1000 * 60 * 60)),
      rataRataTransaksi: shiftData.totalTransaksi > 0 ? shiftData.totalPenjualan / shiftData.totalTransaksi : 0,
      persentaseTunai: shiftData.totalPenjualan > 0 ? (shiftData.totalTunai / shiftData.totalPenjualan) * 100 : 0,
      persentaseNonTunai: shiftData.totalPenjualan > 0 ? (shiftData.totalNonTunai / shiftData.totalPenjualan) * 100 : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        ...shift,
        cashDrawerHistory,
        transactions: shiftData.transactions,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching shift:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/shifts/[id] - Close shift
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const closeData = ShiftCloseSchema.parse(body);

    const shiftIndex = mockShifts.findIndex(s => s.id === id);
    
    if (shiftIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Shift tidak ditemukan'
      }, { status: 404 });
    }

    const shift = mockShifts[shiftIndex];

    if (shift.status !== 'aktif') {
      return NextResponse.json({
        success: false,
        error: 'Hanya shift aktif yang dapat ditutup'
      }, { status: 400 });
    }

    // Calculate current totals
    const shiftData = calculateShiftTotals(id);
    const now = new Date();
    const selisihKas = closeData.modalAkhir - (shift.modalAwal + shiftData.totalTunai);

    // Update shift
    mockShifts[shiftIndex] = {
      ...shift,
      tanggalSelesai: now,
      jamSelesai: now.toTimeString().slice(0, 5),
      modalAkhir: closeData.modalAkhir,
      totalPenjualan: shiftData.totalPenjualan,
      totalTransaksi: shiftData.totalTransaksi,
      totalTunai: shiftData.totalTunai,
      totalNonTunai: shiftData.totalNonTunai,
      selisihKas,
      catatan: closeData.catatan || shift.catatan,
      status: 'selesai',
      updatedAt: now
    };

    // Add cash drawer entry for closing
    const cashDrawerEntry: CashDrawer = {
      id: generateId('cd'),
      shiftId: id,
      tipe: 'tutup',
      nominal: closeData.modalAkhir,
      keterangan: 'Tutup shift',
      waktu: now,
      kasirId: shift.kasirId
    };

    mockCashDrawer.push(cashDrawerEntry);

    return NextResponse.json({
      success: true,
      data: mockShifts[shiftIndex],
      message: 'Shift berhasil ditutup'
    });

  } catch (error) {
    console.error('Error closing shift:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data penutupan shift tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/shifts/[id] - Delete shift (only if no transactions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const shiftIndex = mockShifts.findIndex(s => s.id === id);
    
    if (shiftIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Shift tidak ditemukan'
      }, { status: 404 });
    }

    const shift = mockShifts[shiftIndex];

    // Check if shift has transactions
    const shiftData = calculateShiftTotals(id);
    if (shiftData.totalTransaksi > 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak dapat menghapus shift yang memiliki transaksi'
      }, { status: 400 });
    }

    // Check if shift is active
    if (shift.status === 'aktif') {
      return NextResponse.json({
        success: false,
        error: 'Tidak dapat menghapus shift yang masih aktif'
      }, { status: 400 });
    }

    // Remove shift
    const deletedShift = mockShifts.splice(shiftIndex, 1)[0];

    // Remove cash drawer entries
    mockCashDrawer = mockCashDrawer.filter(cd => cd.shiftId !== id);

    return NextResponse.json({
      success: true,
      data: deletedShift,
      message: 'Shift berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting shift:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}