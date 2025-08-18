// ======================================================================
// CUSTOMER POINTS API ROUTE
// API endpoints untuk manajemen poin pelanggan
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Customer {
  id: string;
  kode: string;
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
  tanggalLahir?: Date;
  jenisKelamin?: 'L' | 'P';
  pekerjaan?: string;
  catatan?: string;
  poin: number;
  totalBelanja: number;
  jumlahTransaksi: number;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PointHistory {
  id: string;
  customerId: string;
  poinSebelum: number;
  poinSesudah: number;
  perubahan: number;
  keterangan: string;
  tipe: 'tambah' | 'kurang' | 'tukar' | 'expired' | 'bonus';
  referensi?: string; // Transaction ID or other reference
  tanggal: Date;
  createdBy: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const PointsUpdateSchema = z.object({
  poin: z.number().int('Poin harus berupa bilangan bulat'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
  tipe: z.enum(['tambah', 'kurang', 'tukar', 'expired', 'bonus']).default('tambah'),
  referensi: z.string().optional()
});

const PointsExchangeSchema = z.object({
  poinDitukar: z.number().int().min(1, 'Poin yang ditukar minimal 1'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi'),
  referensi: z.string().optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

// Import from parent route (in real app, this would be from database)
let mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    kode: 'CUST001',
    nama: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    telepon: '081234567890',
    alamat: 'Jl. Merdeka No. 123, Jakarta',
    tanggalLahir: new Date('1985-05-15'),
    jenisKelamin: 'L',
    pekerjaan: 'Karyawan Swasta',
    catatan: 'Pelanggan setia',
    poin: 150,
    totalBelanja: 1500000,
    jumlahTransaksi: 25,
    aktif: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cust_002',
    kode: 'CUST002',
    nama: 'Siti Rahayu',
    email: 'siti.rahayu@email.com',
    telepon: '081234567891',
    alamat: 'Jl. Sudirman No. 456, Jakarta',
    tanggalLahir: new Date('1990-08-20'),
    jenisKelamin: 'P',
    pekerjaan: 'Guru',
    poin: 75,
    totalBelanja: 750000,
    jumlahTransaksi: 12,
    aktif: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

let mockPointHistory: PointHistory[] = [
  {
    id: 'ph_001',
    customerId: 'cust_001',
    poinSebelum: 100,
    poinSesudah: 150,
    perubahan: 50,
    keterangan: 'Bonus pembelian Rp 500.000',
    tipe: 'bonus',
    referensi: 'TRX001',
    tanggal: new Date('2024-01-15'),
    createdBy: 'user_001'
  },
  {
    id: 'ph_002',
    customerId: 'cust_001',
    poinSebelum: 150,
    poinSesudah: 130,
    perubahan: -20,
    keterangan: 'Tukar poin dengan diskon',
    tipe: 'tukar',
    referensi: 'TRX002',
    tanggal: new Date('2024-01-20'),
    createdBy: 'user_001'
  },
  {
    id: 'ph_003',
    customerId: 'cust_002',
    poinSebelum: 50,
    poinSesudah: 75,
    perubahan: 25,
    keterangan: 'Bonus pembelian Rp 250.000',
    tipe: 'bonus',
    referensi: 'TRX003',
    tanggal: new Date('2024-01-18'),
    createdBy: 'user_001'
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

function addPointHistory(
  customerId: string,
  poinSebelum: number,
  poinSesudah: number,
  keterangan: string,
  tipe: PointHistory['tipe'],
  referensi?: string
): PointHistory {
  const history: PointHistory = {
    id: generateId('ph'),
    customerId,
    poinSebelum,
    poinSesudah,
    perubahan: poinSesudah - poinSebelum,
    keterangan,
    tipe,
    referensi,
    tanggal: new Date(),
    createdBy: 'user_001' // In real app, get from session
  };

  mockPointHistory.push(history);
  return history;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/customers/[id]/points - Get customer points history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tipe = searchParams.get('tipe') as PointHistory['tipe'] | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check if customer exists
    const customer = mockCustomers.find(cust => cust.id === id);
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    // Filter point history
    let filteredHistory = mockPointHistory.filter(history => history.customerId === id);

    // Filter by type
    if (tipe) {
      filteredHistory = filteredHistory.filter(history => history.tipe === tipe);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filteredHistory = filteredHistory.filter(history => history.tanggal >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredHistory = filteredHistory.filter(history => history.tanggal <= end);
    }

    // Sort by date (newest first)
    filteredHistory.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

    // Pagination
    const total = filteredHistory.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);

    // Calculate summary
    const summary = {
      totalPoin: customer.poin,
      totalTambah: filteredHistory
        .filter(h => h.perubahan > 0)
        .reduce((sum, h) => sum + h.perubahan, 0),
      totalKurang: Math.abs(filteredHistory
        .filter(h => h.perubahan < 0)
        .reduce((sum, h) => sum + h.perubahan, 0)),
      totalTransaksi: filteredHistory.length
    };

    return NextResponse.json({
      success: true,
      data: paginatedHistory,
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
    console.error('Error fetching points history:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/customers/[id]/points - Add or subtract points
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { poin, keterangan, tipe, referensi } = PointsUpdateSchema.parse(body);

    // Check if customer exists
    const customerIndex = mockCustomers.findIndex(cust => cust.id === id);
    if (customerIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    const customer = mockCustomers[customerIndex];
    const poinSebelum = customer.poin;
    let poinSesudah: number;
    let perubahan: number;

    // Calculate new points based on type
    switch (tipe) {
      case 'tambah':
      case 'bonus':
        perubahan = Math.abs(poin);
        poinSesudah = poinSebelum + perubahan;
        break;
      case 'kurang':
      case 'tukar':
      case 'expired':
        perubahan = -Math.abs(poin);
        poinSesudah = poinSebelum + perubahan;
        if (poinSesudah < 0) {
          return NextResponse.json({
            success: false,
            error: 'Poin tidak mencukupi'
          }, { status: 400 });
        }
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Tipe transaksi poin tidak valid'
        }, { status: 400 });
    }

    // Update customer points
    mockCustomers[customerIndex] = {
      ...customer,
      poin: poinSesudah,
      updatedAt: new Date()
    };

    // Add to history
    const history = addPointHistory(
      id,
      poinSebelum,
      poinSesudah,
      keterangan,
      tipe,
      referensi
    );

    return NextResponse.json({
      success: true,
      data: {
        customer: mockCustomers[customerIndex],
        history
      },
      message: `Poin berhasil ${tipe === 'tambah' || tipe === 'bonus' ? 'ditambahkan' : 'dikurangi'}`
    });

  } catch (error) {
    console.error('Error updating points:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/customers/[id]/points - Exchange points
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { poinDitukar, keterangan, referensi } = PointsExchangeSchema.parse(body);

    // Check if customer exists
    const customerIndex = mockCustomers.findIndex(cust => cust.id === id);
    if (customerIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    const customer = mockCustomers[customerIndex];
    
    // Check if customer has enough points
    if (customer.poin < poinDitukar) {
      return NextResponse.json({
        success: false,
        error: 'Poin tidak mencukupi'
      }, { status: 400 });
    }

    const poinSebelum = customer.poin;
    const poinSesudah = poinSebelum - poinDitukar;

    // Update customer points
    mockCustomers[customerIndex] = {
      ...customer,
      poin: poinSesudah,
      updatedAt: new Date()
    };

    // Add to history
    const history = addPointHistory(
      id,
      poinSebelum,
      poinSesudah,
      keterangan,
      'tukar',
      referensi
    );

    return NextResponse.json({
      success: true,
      data: {
        customer: mockCustomers[customerIndex],
        history,
        poinDitukar
      },
      message: 'Poin berhasil ditukar'
    });

  } catch (error) {
    console.error('Error exchanging points:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}