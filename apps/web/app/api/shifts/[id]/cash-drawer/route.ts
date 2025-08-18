// ======================================================================
// CASH DRAWER API ROUTE
// API endpoints untuk manajemen laci kas dalam shift
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface CashDrawer {
  id: string;
  shiftId: string;
  tipe: 'buka' | 'tutup' | 'hitung' | 'setor' | 'tarik';
  nominal: number;
  keterangan: string;
  waktu: Date;
  kasirId: string;
  supervisorId?: string;
  fotoKas?: string;
}

interface CashCount {
  pecahan: number;
  jumlah: number;
  total: number;
}

interface CashDrawerDetail {
  id: string;
  cashDrawerId: string;
  pecahan: number;
  jumlah: number;
  total: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CashDrawerSchema = z.object({
  tipe: z.enum(['buka', 'tutup', 'hitung', 'setor', 'tarik']),
  nominal: z.number().min(0, 'Nominal tidak boleh negatif'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
  supervisorId: z.string().optional(),
  fotoKas: z.string().optional(),
  detail: z.array(z.object({
    pecahan: z.number().min(1, 'Pecahan harus lebih dari 0'),
    jumlah: z.number().min(0, 'Jumlah tidak boleh negatif'),
    total: z.number().min(0, 'Total tidak boleh negatif')
  })).optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockShifts = [
  {
    id: 'shift_001',
    kasirId: 'kasir_001',
    status: 'selesai'
  },
  {
    id: 'shift_002',
    kasirId: 'kasir_002',
    status: 'aktif'
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
    tipe: 'setor',
    nominal: 500000,
    keterangan: 'Setor kas ke brankas',
    waktu: new Date('2024-01-15T14:00:00'),
    kasirId: 'kasir_001',
    supervisorId: 'supervisor_001'
  },
  {
    id: 'cd_004',
    shiftId: 'shift_001',
    tipe: 'tutup',
    nominal: 1200000,
    keterangan: 'Tutup shift sore',
    waktu: new Date('2024-01-15T16:00:00'),
    kasirId: 'kasir_001'
  }
];

let mockCashDrawerDetail: CashDrawerDetail[] = [
  // Detail for cd_001 (buka shift)
  { id: 'cdd_001', cashDrawerId: 'cd_001', pecahan: 100000, jumlah: 5, total: 500000 },
  { id: 'cdd_002', cashDrawerId: 'cd_001', pecahan: 50000, jumlah: 6, total: 300000 },
  { id: 'cdd_003', cashDrawerId: 'cd_001', pecahan: 20000, jumlah: 5, total: 100000 },
  { id: 'cdd_004', cashDrawerId: 'cd_001', pecahan: 10000, jumlah: 5, total: 50000 },
  { id: 'cdd_005', cashDrawerId: 'cd_001', pecahan: 5000, jumlah: 10, total: 50000 },
  
  // Detail for cd_002 (hitung kas)
  { id: 'cdd_006', cashDrawerId: 'cd_002', pecahan: 100000, jumlah: 7, total: 700000 },
  { id: 'cdd_007', cashDrawerId: 'cd_002', pecahan: 50000, jumlah: 6, total: 300000 },
  { id: 'cdd_008', cashDrawerId: 'cd_002', pecahan: 20000, jumlah: 5, total: 100000 },
  { id: 'cdd_009', cashDrawerId: 'cd_002', pecahan: 10000, jumlah: 5, total: 50000 },
  { id: 'cdd_010', cashDrawerId: 'cd_002', pecahan: 5000, jumlah: 10, total: 50000 }
];

// Standard cash denominations in Indonesia
const standardDenominations = [
  { pecahan: 100000, label: 'Rp 100.000' },
  { pecahan: 50000, label: 'Rp 50.000' },
  { pecahan: 20000, label: 'Rp 20.000' },
  { pecahan: 10000, label: 'Rp 10.000' },
  { pecahan: 5000, label: 'Rp 5.000' },
  { pecahan: 2000, label: 'Rp 2.000' },
  { pecahan: 1000, label: 'Rp 1.000' },
  { pecahan: 500, label: 'Rp 500' },
  { pecahan: 200, label: 'Rp 200' },
  { pecahan: 100, label: 'Rp 100' },
  { pecahan: 50, label: 'Rp 50' }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

function validateCashDetail(detail: CashCount[]): boolean {
  return detail.every(item => item.total === item.pecahan * item.jumlah);
}

function calculateTotalFromDetail(detail: CashCount[]): number {
  return detail.reduce((sum, item) => sum + item.total, 0);
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/shifts/[id]/cash-drawer - Get cash drawer history for shift
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if shift exists
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

    // Get details for each cash drawer entry
    const historyWithDetails = cashDrawerHistory.map(cd => {
      const details = mockCashDrawerDetail.filter(cdd => cdd.cashDrawerId === cd.id);
      return {
        ...cd,
        details
      };
    });

    // Calculate summary
    const summary = {
      totalEntries: cashDrawerHistory.length,
      totalSetor: cashDrawerHistory
        .filter(cd => cd.tipe === 'setor')
        .reduce((sum, cd) => sum + cd.nominal, 0),
      totalTarik: cashDrawerHistory
        .filter(cd => cd.tipe === 'tarik')
        .reduce((sum, cd) => sum + cd.nominal, 0),
      lastCount: cashDrawerHistory
        .filter(cd => cd.tipe === 'hitung')
        .pop()?.nominal || 0,
      currentBalance: cashDrawerHistory.length > 0 ? 
        cashDrawerHistory[cashDrawerHistory.length - 1].nominal : 0
    };

    return NextResponse.json({
      success: true,
      data: historyWithDetails,
      summary,
      denominations: standardDenominations
    });

  } catch (error) {
    console.error('Error fetching cash drawer history:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/shifts/[id]/cash-drawer - Add cash drawer entry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const cashData = CashDrawerSchema.parse(body);

    // Check if shift exists
    const shift = mockShifts.find(s => s.id === id);
    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift tidak ditemukan'
      }, { status: 404 });
    }

    // Validate cash detail if provided
    if (cashData.detail) {
      if (!validateCashDetail(cashData.detail)) {
        return NextResponse.json({
          success: false,
          error: 'Detail perhitungan kas tidak valid'
        }, { status: 400 });
      }

      const calculatedTotal = calculateTotalFromDetail(cashData.detail);
      if (Math.abs(calculatedTotal - cashData.nominal) > 0.01) {
        return NextResponse.json({
          success: false,
          error: 'Total nominal tidak sesuai dengan detail perhitungan'
        }, { status: 400 });
      }
    }

    // Check business rules
    if (cashData.tipe === 'setor' || cashData.tipe === 'tarik') {
      if (!cashData.supervisorId) {
        return NextResponse.json({
          success: false,
          error: 'Supervisor ID wajib untuk transaksi setor/tarik'
        }, { status: 400 });
      }
    }

    // Create cash drawer entry
    const now = new Date();
    const newCashDrawer: CashDrawer = {
      id: generateId('cd'),
      shiftId: id,
      tipe: cashData.tipe,
      nominal: cashData.nominal,
      keterangan: cashData.keterangan,
      waktu: now,
      kasirId: shift.kasirId,
      supervisorId: cashData.supervisorId,
      fotoKas: cashData.fotoKas
    };

    mockCashDrawer.push(newCashDrawer);

    // Add cash detail if provided
    if (cashData.detail) {
      const cashDetails = cashData.detail.map(detail => ({
        id: generateId('cdd'),
        cashDrawerId: newCashDrawer.id,
        pecahan: detail.pecahan,
        jumlah: detail.jumlah,
        total: detail.total
      }));

      mockCashDrawerDetail.push(...cashDetails);
      
      return NextResponse.json({
        success: true,
        data: {
          ...newCashDrawer,
          details: cashDetails
        },
        message: `Transaksi ${cashData.tipe} berhasil dicatat`
      });
    }

    return NextResponse.json({
      success: true,
      data: newCashDrawer,
      message: `Transaksi ${cashData.tipe} berhasil dicatat`
    });

  } catch (error) {
    console.error('Error adding cash drawer entry:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data transaksi kas tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/shifts/[id]/cash-drawer - Update last cash drawer entry (only if within time limit)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { cashDrawerId, ...updateData } = body;

    // Check if shift exists
    const shift = mockShifts.find(s => s.id === id);
    if (!shift) {
      return NextResponse.json({
        success: false,
        error: 'Shift tidak ditemukan'
      }, { status: 404 });
    }

    // Find cash drawer entry
    const cashDrawerIndex = mockCashDrawer.findIndex(cd => 
      cd.id === cashDrawerId && cd.shiftId === id
    );

    if (cashDrawerIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi kas tidak ditemukan'
      }, { status: 404 });
    }

    const cashDrawer = mockCashDrawer[cashDrawerIndex];

    // Check if entry can be updated (within 15 minutes)
    const now = new Date();
    const timeDiff = now.getTime() - cashDrawer.waktu.getTime();
    const maxUpdateTime = 15 * 60 * 1000; // 15 minutes

    if (timeDiff > maxUpdateTime) {
      return NextResponse.json({
        success: false,
        error: 'Transaksi kas hanya dapat diubah dalam 15 menit setelah dibuat'
      }, { status: 400 });
    }

    // Validate updated data
    const updatedCashData = CashDrawerSchema.parse(updateData);

    // Update cash drawer entry
    mockCashDrawer[cashDrawerIndex] = {
      ...cashDrawer,
      nominal: updatedCashData.nominal,
      keterangan: updatedCashData.keterangan,
      fotoKas: updatedCashData.fotoKas || cashDrawer.fotoKas
    };

    // Update cash detail if provided
    if (updatedCashData.detail) {
      // Remove old details
      mockCashDrawerDetail = mockCashDrawerDetail.filter(cdd => 
        cdd.cashDrawerId !== cashDrawerId
      );

      // Add new details
      const newDetails = updatedCashData.detail.map(detail => ({
        id: generateId('cdd'),
        cashDrawerId,
        pecahan: detail.pecahan,
        jumlah: detail.jumlah,
        total: detail.total
      }));

      mockCashDrawerDetail.push(...newDetails);

      return NextResponse.json({
        success: true,
        data: {
          ...mockCashDrawer[cashDrawerIndex],
          details: newDetails
        },
        message: 'Transaksi kas berhasil diperbarui'
      });
    }

    return NextResponse.json({
      success: true,
      data: mockCashDrawer[cashDrawerIndex],
      message: 'Transaksi kas berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating cash drawer entry:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data transaksi kas tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}