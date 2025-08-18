// ======================================================================
// CUSTOMERS API ROUTE
// API endpoints untuk manajemen pelanggan
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

interface CustomerQuery {
  search?: string;
  aktif?: boolean;
  sortBy?: 'nama' | 'totalBelanja' | 'poin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  aktif: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['nama', 'totalBelanja', 'poin', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const CustomerCreateSchema = z.object({
  nama: z.string().min(1, 'Nama pelanggan wajib diisi'),
  email: z.string().email('Format email tidak valid').optional(),
  telepon: z.string().regex(/^[0-9+\-\s()]+$/, 'Format telepon tidak valid').optional(),
  alamat: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  pekerjaan: z.string().optional(),
  catatan: z.string().optional(),
  aktif: z.boolean().default(true)
});

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

const CustomerBulkUpdateSchema = z.array(z.object({
  id: z.string(),
  nama: z.string().min(1, 'Nama pelanggan wajib diisi').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  telepon: z.string().regex(/^[0-9+\-\s()]+$/, 'Format telepon tidak valid').optional(),
  alamat: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  pekerjaan: z.string().optional(),
  catatan: z.string().optional(),
  aktif: z.boolean().optional()
}));

const CustomerBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu pelanggan harus dipilih')
});

// ======================================================================
// MOCK DATA
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

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function filterCustomers(customers: Customer[], query: CustomerQuery): Customer[] {
  let filtered = [...customers];

  // Filter by search
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(customer =>
      customer.nama.toLowerCase().includes(searchLower) ||
      customer.kode.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.telepon && customer.telepon.includes(query.search!))
    );
  }

  // Filter by active status
  if (query.aktif !== undefined) {
    filtered = filtered.filter(customer => customer.aktif === query.aktif);
  }

  return filtered;
}

function sortCustomers(customers: Customer[], sortBy: string, sortOrder: string): Customer[] {
  return customers.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'nama':
        aValue = a.nama.toLowerCase();
        bValue = b.nama.toLowerCase();
        break;
      case 'totalBelanja':
        aValue = a.totalBelanja;
        bValue = b.totalBelanja;
        break;
      case 'poin':
        aValue = a.poin;
        bValue = b.poin;
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      default:
        aValue = a.nama.toLowerCase();
        bValue = b.nama.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function paginateCustomers(customers: Customer[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: customers.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: customers.length,
      totalPages: Math.ceil(customers.length / limit),
      hasNext: endIndex < customers.length,
      hasPrev: page > 1
    }
  };
}

function generateCustomerCode(): string {
  const lastCustomer = mockCustomers
    .filter(c => c.kode.startsWith('CUST'))
    .sort((a, b) => b.kode.localeCompare(a.kode))[0];
  
  if (!lastCustomer) {
    return 'CUST001';
  }
  
  const lastNumber = parseInt(lastCustomer.kode.replace('CUST', ''));
  const nextNumber = lastNumber + 1;
  return `CUST${nextNumber.toString().padStart(3, '0')}`;
}

function generateCustomerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `cust_${timestamp}${random}`;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/customers - Get all customers with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = CustomerQuerySchema.parse(queryParams);
    
    const query: CustomerQuery = {
      search: validatedQuery.search,
      aktif: validatedQuery.aktif === 'true' ? true : validatedQuery.aktif === 'false' ? false : undefined,
      sortBy: validatedQuery.sortBy || 'nama',
      sortOrder: validatedQuery.sortOrder || 'asc',
      page: validatedQuery.page ? parseInt(validatedQuery.page) : 1,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 20
    };

    // Apply filters
    let filteredCustomers = filterCustomers(mockCustomers, query);
    
    // Apply sorting
    filteredCustomers = sortCustomers(filteredCustomers, query.sortBy!, query.sortOrder!);
    
    // Apply pagination
    const result = paginateCustomers(filteredCustomers, query.page!, query.limit!);

    // Calculate summary statistics
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter(c => c.aktif).length;
    const totalPoints = filteredCustomers.reduce((sum, c) => sum + c.poin, 0);
    const totalSpending = filteredCustomers.reduce((sum, c) => sum + c.totalBelanja, 0);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: {
        totalCustomers,
        activeCustomers,
        totalPoints,
        totalSpending
      },
      query
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    
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

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerData = CustomerCreateSchema.parse(body);

    // Check if customer email already exists
    if (customerData.email) {
      const existingCustomer = mockCustomers.find(cust => 
        cust.email === customerData.email
      );
      
      if (existingCustomer) {
        return NextResponse.json({
          success: false,
          error: 'Email pelanggan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if customer phone already exists
    if (customerData.telepon) {
      const existingCustomer = mockCustomers.find(cust => 
        cust.telepon === customerData.telepon
      );
      
      if (existingCustomer) {
        return NextResponse.json({
          success: false,
          error: 'Nomor telepon sudah digunakan'
        }, { status: 400 });
      }
    }

    // Create new customer
    const newCustomer: Customer = {
      id: generateCustomerId(),
      kode: generateCustomerCode(),
      nama: customerData.nama,
      email: customerData.email,
      telepon: customerData.telepon,
      alamat: customerData.alamat,
      tanggalLahir: customerData.tanggalLahir,
      jenisKelamin: customerData.jenisKelamin,
      pekerjaan: customerData.pekerjaan,
      catatan: customerData.catatan,
      poin: 0,
      totalBelanja: 0,
      jumlahTransaksi: 0,
      aktif: customerData.aktif,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockCustomers.push(newCustomer);

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Pelanggan berhasil dibuat'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating customer:', error);
    
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

// PUT /api/customers - Bulk update customers
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = CustomerBulkUpdateSchema.parse(body);

    const updatedCustomers: Customer[] = [];
    const errors: string[] = [];

    for (const update of updates) {
      const customerIndex = mockCustomers.findIndex(cust => cust.id === update.id);
      
      if (customerIndex === -1) {
        errors.push(`Pelanggan dengan ID ${update.id} tidak ditemukan`);
        continue;
      }

      // Check if email already exists (if updating email)
      if (update.email) {
        const existingCustomer = mockCustomers.find(cust => 
          cust.email === update.email && cust.id !== update.id
        );
        if (existingCustomer) {
          errors.push(`Email "${update.email}" sudah digunakan`);
          continue;
        }
      }

      // Check if phone already exists (if updating phone)
      if (update.telepon) {
        const existingCustomer = mockCustomers.find(cust => 
          cust.telepon === update.telepon && cust.id !== update.id
        );
        if (existingCustomer) {
          errors.push(`Nomor telepon "${update.telepon}" sudah digunakan`);
          continue;
        }
      }

      // Update customer
      const updateData = { ...update };

      mockCustomers[customerIndex] = {
        ...mockCustomers[customerIndex],
        ...updateData,
        updatedAt: new Date()
      };

      updatedCustomers.push(mockCustomers[customerIndex]);
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomers,
      errors: errors.length > 0 ? errors : undefined,
      message: `${updatedCustomers.length} pelanggan berhasil diperbarui`
    });

  } catch (error) {
    console.error('Error bulk updating customers:', error);
    
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

// DELETE /api/customers - Bulk delete customers
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = CustomerBulkDeleteSchema.parse(body);

    const deletedCustomers: Customer[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      const customerIndex = mockCustomers.findIndex(cust => cust.id === id);
      
      if (customerIndex === -1) {
        errors.push(`Pelanggan dengan ID ${id} tidak ditemukan`);
        continue;
      }

      // Remove customer
      const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];
      deletedCustomers.push(deletedCustomer);
    }

    return NextResponse.json({
      success: true,
      data: deletedCustomers,
      errors: errors.length > 0 ? errors : undefined,
      message: `${deletedCustomers.length} pelanggan berhasil dihapus`
    });

  } catch (error) {
    console.error('Error bulk deleting customers:', error);
    
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