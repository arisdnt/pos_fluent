// ======================================================================
// SUPPLIERS API ROUTE
// API endpoints untuk manajemen pemasok
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  taxNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const SupplierQuerySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'city', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const SupplierCreateSchema = z.object({
  code: z.string().min(1, 'Kode pemasok wajib diisi').max(20, 'Kode pemasok maksimal 20 karakter'),
  name: z.string().min(1, 'Nama pemasok wajib diisi').max(255, 'Nama pemasok maksimal 255 karakter'),
  contactPerson: z.string().max(255, 'Nama kontak maksimal 255 karakter').optional(),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  address: z.string().optional(),
  city: z.string().max(100, 'Nama kota maksimal 100 karakter').optional(),
  province: z.string().max(100, 'Nama provinsi maksimal 100 karakter').optional(),
  postalCode: z.string().max(10, 'Kode pos maksimal 10 karakter').optional(),
  taxNumber: z.string().max(50, 'NPWP maksimal 50 karakter').optional(),
  paymentTerms: z.string().max(100, 'Syarat pembayaran maksimal 100 karakter').optional(),
  creditLimit: z.number().min(0, 'Limit kredit tidak boleh negatif').optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional()
});

const SupplierUpdateSchema = z.object({
  code: z.string().min(1, 'Kode pemasok wajib diisi').max(20, 'Kode pemasok maksimal 20 karakter').optional(),
  name: z.string().min(1, 'Nama pemasok wajib diisi').max(255, 'Nama pemasok maksimal 255 karakter').optional(),
  contactPerson: z.string().max(255, 'Nama kontak maksimal 255 karakter').optional(),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  address: z.string().optional(),
  city: z.string().max(100, 'Nama kota maksimal 100 karakter').optional(),
  province: z.string().max(100, 'Nama provinsi maksimal 100 karakter').optional(),
  postalCode: z.string().max(10, 'Kode pos maksimal 10 karakter').optional(),
  taxNumber: z.string().max(50, 'NPWP maksimal 50 karakter').optional(),
  paymentTerms: z.string().max(100, 'Syarat pembayaran maksimal 100 karakter').optional(),
  creditLimit: z.number().min(0, 'Limit kredit tidak boleh negatif').optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional()
});

const SupplierBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu pemasok harus dipilih'),
  updates: z.object({
    isActive: z.boolean().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  })
});

const SupplierBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu pemasok harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockSuppliers: Supplier[] = [
  {
    id: 'supplier_001',
    code: 'SUP001',
    name: 'PT Sumber Rejeki Makmur',
    contactPerson: 'Budi Hartono',
    phone: '021-12345678',
    email: 'purchasing@sumberrejeki.co.id',
    address: 'Jl. Industri Raya No. 123, Kawasan Industri Pulogadung',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postalCode: '13260',
    taxNumber: '01.234.567.8-901.000',
    paymentTerms: 'NET 30',
    creditLimit: 50000000,
    isActive: true,
    notes: 'Supplier utama untuk produk elektronik',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'supplier_002',
    code: 'SUP002',
    name: 'CV Mitra Dagang Sejahtera',
    contactPerson: 'Siti Nurhaliza',
    phone: '022-87654321',
    email: 'admin@mitradagang.co.id',
    address: 'Jl. Cihampelas No. 456',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40131',
    taxNumber: '02.345.678.9-012.000',
    paymentTerms: 'NET 14',
    creditLimit: 25000000,
    isActive: true,
    notes: 'Supplier fashion dan aksesoris',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'supplier_003',
    code: 'SUP003',
    name: 'UD Berkah Jaya',
    contactPerson: 'Ahmad Wijaya',
    phone: '031-11223344',
    email: 'berkah.jaya@gmail.com',
    address: 'Jl. Raya Surabaya-Malang KM 15',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postalCode: '60298',
    taxNumber: '03.456.789.0-123.000',
    paymentTerms: 'COD',
    creditLimit: 15000000,
    isActive: true,
    notes: 'Supplier makanan dan minuman',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'supplier_004',
    code: 'SUP004',
    name: 'PT Global Trading Indonesia',
    contactPerson: 'Maria Santoso',
    phone: '061-55667788',
    email: 'procurement@globaltrading.co.id',
    address: 'Jl. Gatot Subroto No. 789, Kompleks Ruko Medan Plaza',
    city: 'Medan',
    province: 'Sumatera Utara',
    postalCode: '20112',
    taxNumber: '04.567.890.1-234.000',
    paymentTerms: 'NET 45',
    creditLimit: 75000000,
    isActive: false,
    notes: 'Supplier import - sedang dalam review kontrak',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'supplier_005',
    code: 'SUP005',
    name: 'Toko Grosir Murah Meriah',
    contactPerson: 'Ibu Sari',
    phone: '0274-123456',
    email: 'grosirmurah@yahoo.com',
    address: 'Jl. Malioboro No. 321',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    postalCode: '55271',
    paymentTerms: 'Cash',
    creditLimit: 5000000,
    isActive: true,
    notes: 'Supplier lokal untuk kebutuhan sehari-hari',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSupplierCode(): string {
  const codes = mockSuppliers.map(supplier => supplier.code);
  let counter = 1;
  let newCode;
  
  do {
    newCode = `SUP${counter.toString().padStart(3, '0')}`;
    counter++;
  } while (codes.includes(newCode));
  
  return newCode;
}

function filterSuppliers(suppliers: Supplier[], query: any): Supplier[] {
  let filtered = [...suppliers];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.code.toLowerCase().includes(searchTerm) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.toLowerCase().includes(searchTerm) ||
      supplier.address?.toLowerCase().includes(searchTerm)
    );
  }

  // City filter
  if (query.city) {
    filtered = filtered.filter(supplier => 
      supplier.city?.toLowerCase().includes(query.city.toLowerCase())
    );
  }

  // Province filter
  if (query.province) {
    filtered = filtered.filter(supplier => 
      supplier.province?.toLowerCase().includes(query.province.toLowerCase())
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(supplier => supplier.isActive === isActive);
  }

  return filtered;
}

function sortSuppliers(suppliers: Supplier[], sortBy: string, sortOrder: string): Supplier[] {
  return suppliers.sort((a, b) => {
    let aValue = a[sortBy as keyof Supplier];
    let bValue = b[sortBy as keyof Supplier];

    // Handle undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
    if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue! < bValue!) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue! > bValue!) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function paginateSuppliers(suppliers: Supplier[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: suppliers.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: suppliers.length,
      totalPages: Math.ceil(suppliers.length / limit),
      hasNext: endIndex < suppliers.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/suppliers - Get all suppliers with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = SupplierQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter suppliers
    let filteredSuppliers = filterSuppliers(mockSuppliers, query);

    // Sort suppliers
    filteredSuppliers = sortSuppliers(filteredSuppliers, sortBy, sortOrder);

    // Paginate suppliers
    const result = paginateSuppliers(filteredSuppliers, page, limit);

    // Calculate summary
    const summary = {
      total: filteredSuppliers.length,
      active: filteredSuppliers.filter(supplier => supplier.isActive).length,
      inactive: filteredSuppliers.filter(supplier => !supplier.isActive).length,
      totalCreditLimit: filteredSuppliers
        .filter(supplier => supplier.isActive && supplier.creditLimit)
        .reduce((sum, supplier) => sum + (supplier.creditLimit || 0), 0)
    };

    // Get unique cities and provinces for filters
    const cities = Array.from(new Set(mockSuppliers.map(s => s.city).filter(Boolean) as string[])).sort();
    const provinces = Array.from(new Set(mockSuppliers.map(s => s.province).filter(Boolean) as string[])).sort();

    return NextResponse.json({
      success: true,
      message: 'Data pemasok berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary,
      filters: {
        cities,
        provinces
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data pemasok'
    }, { status: 500 });
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SupplierCreateSchema.parse(body);

    // Check if code already exists
    const existingSupplier = mockSuppliers.find(supplier => supplier.code === data.code);
    if (existingSupplier) {
      return NextResponse.json({
        success: false,
        message: 'Kode pemasok sudah digunakan'
      }, { status: 400 });
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = mockSuppliers.find(supplier => supplier.email === data.email);
      if (existingEmail) {
        return NextResponse.json({
          success: false,
          message: 'Email sudah digunakan'
        }, { status: 400 });
      }
    }

    // Create new supplier
    const newSupplier: Supplier = {
      id: generateId(),
      code: data.code,
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      taxNumber: data.taxNumber,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit,
      isActive: data.isActive,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSuppliers.push(newSupplier);

    return NextResponse.json({
      success: true,
      message: 'Pemasok berhasil dibuat',
      data: newSupplier
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat pemasok'
    }, { status: 500 });
  }
}

// PUT /api/suppliers - Update supplier or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = SupplierBulkUpdateSchema.parse(body);
      
      // Check if suppliers exist
      const existingSuppliers = mockSuppliers.filter(supplier => ids.includes(supplier.id));
      if (existingSuppliers.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa pemasok tidak ditemukan'
        }, { status: 404 });
      }

      // Update suppliers
      mockSuppliers = mockSuppliers.map(supplier => {
        if (ids.includes(supplier.id)) {
          return {
            ...supplier,
            ...updates,
            updatedAt: new Date()
          };
        }
        return supplier;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} pemasok berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID pemasok wajib diisi'
      }, { status: 400 });
    }

    const data = SupplierUpdateSchema.parse(updateData);

    // Find supplier
    const supplierIndex = mockSuppliers.findIndex(supplier => supplier.id === id);
    if (supplierIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Pemasok tidak ditemukan'
      }, { status: 404 });
    }

    // Check if code already exists (if updating code)
    if (data.code && data.code !== mockSuppliers[supplierIndex].code) {
      const existingSupplier = mockSuppliers.find(supplier => supplier.code === data.code && supplier.id !== id);
      if (existingSupplier) {
        return NextResponse.json({
          success: false,
          message: 'Kode pemasok sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if email already exists (if updating email)
    if (data.email && data.email !== mockSuppliers[supplierIndex].email) {
      const existingEmail = mockSuppliers.find(supplier => supplier.email === data.email && supplier.id !== id);
      if (existingEmail) {
        return NextResponse.json({
          success: false,
          message: 'Email sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update supplier
    mockSuppliers[supplierIndex] = {
      ...mockSuppliers[supplierIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Pemasok berhasil diperbarui',
      data: mockSuppliers[supplierIndex]
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui pemasok'
    }, { status: 500 });
  }
}

// DELETE /api/suppliers - Delete suppliers
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = SupplierBulkDeleteSchema.parse(body);

    // Check if suppliers exist
    const existingSuppliers = mockSuppliers.filter(supplier => ids.includes(supplier.id));
    if (existingSuppliers.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa pemasok tidak ditemukan'
      }, { status: 404 });
    }

    // Remove suppliers
    mockSuppliers = mockSuppliers.filter(supplier => !ids.includes(supplier.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} pemasok berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting suppliers:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus pemasok'
    }, { status: 500 });
  }
}