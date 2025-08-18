// ======================================================================
// CUSTOMER BY ID API ROUTE
// API endpoints untuk manajemen pelanggan individual
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES (same as in route.ts)
// ======================================================================

interface Customer {
  id: string;
  kode: string;
  nama: string;
  email?: string;
  telepon?: string;
  alamat?: string;
  tanggalLahir?: string;
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

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CustomerUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama pelanggan wajib diisi').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  telepon: z.string().regex(/^[0-9+\-\s()]+$/, 'Format telepon tidak valid').optional(),
  alamat: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  pekerjaan: z.string().optional(),
  catatan: z.string().optional(),
  aktif: z.boolean().optional()
});

const PointsUpdateSchema = z.object({
  poin: z.number().min(0, 'Poin tidak boleh negatif'),
  keterangan: z.string().min(1, 'Keterangan wajib diisi')
});

// ======================================================================
// MOCK DATA (same as in route.ts)
// ======================================================================

let mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    kode: 'CUST001',
    nama: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    telepon: '081234567890',
    alamat: 'Jl. Merdeka No. 123, Jakarta',
    tanggalLahir: '1985-05-15',
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
    tanggalLahir: '1990-08-20',
    jenisKelamin: 'P',
    pekerjaan: 'Guru',
    poin: 75,
    totalBelanja: 750000,
    jumlahTransaksi: 12,
    aktif: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cust_003',
    kode: 'CUST003',
    nama: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@email.com',
    telepon: '081234567892',
    alamat: 'Jl. Thamrin No. 789, Jakarta',
    tanggalLahir: '1988-12-10',
    jenisKelamin: 'L',
    pekerjaan: 'Wiraswasta',
    catatan: 'Suka produk elektronik',
    poin: 200,
    totalBelanja: 2000000,
    jumlahTransaksi: 30,
    aktif: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cust_004',
    kode: 'CUST004',
    nama: 'Dewi Lestari',
    telepon: '081234567893',
    alamat: 'Jl. Gatot Subroto No. 321, Jakarta',
    poin: 25,
    totalBelanja: 250000,
    jumlahTransaksi: 5,
    aktif: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock point history for tracking point changes
let mockPointHistory: Array<{
  id: string;
  customerId: string;
  poinSebelum: number;
  poinSesudah: number;
  perubahan: number;
  keterangan: string;
  tanggal: Date;
}> = [];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}${random}`;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customer = mockCustomers.find(cust => cust.id === id);
    
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    // Get point history for this customer
    const pointHistory = mockPointHistory
      .filter(history => history.customerId === id)
      .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
      .slice(0, 10); // Last 10 point changes

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        pointHistory
      }
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/customers/[id] - Update customer by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const updateData = CustomerUpdateSchema.parse(body);

    const customerIndex = mockCustomers.findIndex(cust => cust.id === id);
    
    if (customerIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if email already exists (if updating email)
    if (updateData.email) {
      const existingCustomer = mockCustomers.find(cust => 
        cust.email === updateData.email && cust.id !== id
      );
      if (existingCustomer) {
        return NextResponse.json({
          success: false,
          error: 'Email sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if phone already exists (if updating phone)
    if (updateData.telepon) {
      const existingCustomer = mockCustomers.find(cust => 
        cust.telepon === updateData.telepon && cust.id !== id
      );
      if (existingCustomer) {
        return NextResponse.json({
          success: false,
          error: 'Nomor telepon sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update customer
    const finalUpdateData = { ...updateData };

    mockCustomers[customerIndex] = {
      ...mockCustomers[customerIndex],
      ...finalUpdateData,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: mockCustomers[customerIndex],
      message: 'Pelanggan berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data pelanggan tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete customer by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customerIndex = mockCustomers.findIndex(cust => cust.id === id);
    
    if (customerIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Pelanggan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if customer has transactions (in real app, check database)
    const customer = mockCustomers[customerIndex];
    if (customer.jumlahTransaksi > 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak dapat menghapus pelanggan yang memiliki riwayat transaksi'
      }, { status: 400 });
    }

    // Remove customer
    const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];

    // Remove point history
    mockPointHistory = mockPointHistory.filter(history => history.customerId !== id);

    return NextResponse.json({
      success: true,
      data: deletedCustomer,
      message: 'Pelanggan berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}