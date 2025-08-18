// ======================================================================
// SHIFTS API ROUTE
// API endpoints untuk manajemen shift kasir
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
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

interface ShiftQuery {
  kasirId?: string;
  status?: 'aktif' | 'selesai' | 'ditutup';
  tanggalMulai?: string;
  tanggalSelesai?: string;
  page?: number;
  limit?: number;
  sortBy?: 'tanggalMulai' | 'totalPenjualan' | 'totalTransaksi';
  sortOrder?: 'asc' | 'desc';
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

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ShiftQuerySchema = z.object({
  kasirId: z.string().optional(),
  status: z.enum(['aktif', 'selesai', 'ditutup']).optional(),
  tanggalMulai: z.string().optional(),
  tanggalSelesai: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).optional(),
  sortBy: z.enum(['tanggalMulai', 'totalPenjualan', 'totalTransaksi']).default('tanggalMulai'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const ShiftCreateSchema = z.object({
  kasirId: z.string().min(1, 'ID kasir wajib diisi'),
  namaKasir: z.string().min(1, 'Nama kasir wajib diisi'),
  modalAwal: z.number().min(0, 'Modal awal tidak boleh negatif'),
  catatan: z.string().optional()
});

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
// MOCK DATA
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

// Mock transactions for shift calculation
const mockTransactions = [
  {
    id: 'trx_001',
    shiftId: 'shift_001',
    total: 8800000,
    metodePembayaran: 'tunai',
    tanggal: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'trx_002',
    shiftId: 'shift_002',
    total: 5500000,
    metodePembayaran: 'kartu_debit',
    tanggal: new Date('2024-01-16T14:20:00')
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

function generateShiftNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const shiftCount = mockShifts.filter(s => 
    s.tanggalMulai.toISOString().split('T')[0] === now.toISOString().split('T')[0]
  ).length + 1;
  
  return `SHF-${dateStr}-${shiftCount.toString().padStart(3, '0')}`;
}

function calculateShiftTotals(shiftId: string) {
  const shiftTransactions = mockTransactions.filter(t => t.shiftId === shiftId);
  
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
    totalNonTunai
  };
}

function filterShifts(shifts: Shift[], query: ShiftQuery): Shift[] {
  let filtered = [...shifts];

  if (query.kasirId) {
    filtered = filtered.filter(shift => shift.kasirId === query.kasirId);
  }

  if (query.status) {
    filtered = filtered.filter(shift => shift.status === query.status);
  }

  if (query.tanggalMulai) {
    const startDate = new Date(query.tanggalMulai);
    filtered = filtered.filter(shift => shift.tanggalMulai >= startDate);
  }

  if (query.tanggalSelesai) {
    const endDate = new Date(query.tanggalSelesai);
    endDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(shift => 
      shift.tanggalSelesai ? shift.tanggalSelesai <= endDate : shift.tanggalMulai <= endDate
    );
  }

  return filtered;
}

function sortShifts(shifts: Shift[], sortBy: string, sortOrder: string): Shift[] {
  return shifts.sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'tanggalMulai':
        aValue = a.tanggalMulai.getTime();
        bValue = b.tanggalMulai.getTime();
        break;
      case 'totalPenjualan':
        aValue = a.totalPenjualan;
        bValue = b.totalPenjualan;
        break;
      case 'totalTransaksi':
        aValue = a.totalTransaksi;
        bValue = b.totalTransaksi;
        break;
      default:
        aValue = a.tanggalMulai.getTime();
        bValue = b.tanggalMulai.getTime();
    }

    if (sortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/shifts - Get all shifts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const query = ShiftQuerySchema.parse(queryParams);

    // Filter shifts
    let filteredShifts = filterShifts(mockShifts, query);

    // Sort shifts
    filteredShifts = sortShifts(filteredShifts, query.sortBy!, query.sortOrder!);

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = filteredShifts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedShifts = filteredShifts.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      totalShifts: total,
      shiftsAktif: filteredShifts.filter(s => s.status === 'aktif').length,
      shiftsSelesai: filteredShifts.filter(s => s.status === 'selesai').length,
      totalPenjualan: filteredShifts.reduce((sum, s) => sum + s.totalPenjualan, 0),
      totalTransaksi: filteredShifts.reduce((sum, s) => sum + s.totalTransaksi, 0),
      rataRataPenjualan: filteredShifts.length > 0 ? 
        filteredShifts.reduce((sum, s) => sum + s.totalPenjualan, 0) / filteredShifts.length : 0
    };

    return NextResponse.json({
      success: true,
      data: paginatedShifts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary
    });

  } catch (error) {
    console.error('Error fetching shifts:', error);
    
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

// POST /api/shifts - Create new shift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shiftData = ShiftCreateSchema.parse(body);

    // Check if kasir already has active shift
    const activeShift = mockShifts.find(s => 
      s.kasirId === shiftData.kasirId && s.status === 'aktif'
    );

    if (activeShift) {
      return NextResponse.json({
        success: false,
        error: 'Kasir masih memiliki shift aktif'
      }, { status: 400 });
    }

    const now = new Date();
    const newShift: Shift = {
      id: generateId('shift'),
      nomorShift: generateShiftNumber(),
      kasirId: shiftData.kasirId,
      namaKasir: shiftData.namaKasir,
      tanggalMulai: now,
      jamMulai: now.toTimeString().slice(0, 5),
      modalAwal: shiftData.modalAwal,
      totalPenjualan: 0,
      totalTransaksi: 0,
      totalTunai: 0,
      totalNonTunai: 0,
      catatan: shiftData.catatan,
      status: 'aktif',
      createdAt: now,
      updatedAt: now
    };

    mockShifts.push(newShift);

    // Add cash drawer entry for opening
    const cashDrawerEntry: CashDrawer = {
      id: generateId('cd'),
      shiftId: newShift.id,
      tipe: 'buka',
      nominal: shiftData.modalAwal,
      keterangan: 'Buka shift',
      waktu: now,
      kasirId: shiftData.kasirId
    };

    mockCashDrawer.push(cashDrawerEntry);

    return NextResponse.json({
      success: true,
      data: newShift,
      message: 'Shift berhasil dibuka'
    });

  } catch (error) {
    console.error('Error creating shift:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data shift tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}