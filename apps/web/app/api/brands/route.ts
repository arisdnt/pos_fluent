// ======================================================================
// BRANDS API ROUTE
// API endpoints untuk manajemen merek
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const BrandQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const BrandCreateSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi').max(100, 'Nama merek maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  logo: z.string().url('Format URL logo tidak valid').optional(),
  website: z.string().url('Format URL website tidak valid').optional(),
  isActive: z.boolean().default(true)
});

const BrandUpdateSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi').max(100, 'Nama merek maksimal 100 karakter').optional(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  logo: z.string().url('Format URL logo tidak valid').optional(),
  website: z.string().url('Format URL website tidak valid').optional(),
  isActive: z.boolean().optional()
});

const BrandBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu merek harus dipilih'),
  updates: z.object({
    isActive: z.boolean().optional()
  })
});

const BrandBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu merek harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockBrands: Brand[] = [
  {
    id: 'brand_001',
    name: 'Samsung',
    description: 'Perusahaan teknologi multinasional Korea Selatan yang memproduksi elektronik konsumen',
    logo: 'https://logo.clearbit.com/samsung.com',
    website: 'https://www.samsung.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_002',
    name: 'Apple',
    description: 'Perusahaan teknologi Amerika yang merancang dan mengembangkan produk elektronik konsumen',
    logo: 'https://logo.clearbit.com/apple.com',
    website: 'https://www.apple.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_003',
    name: 'Sony',
    description: 'Konglomerat multinasional Jepang yang bergerak di bidang elektronik, hiburan, dan teknologi',
    logo: 'https://logo.clearbit.com/sony.com',
    website: 'https://www.sony.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_004',
    name: 'LG',
    description: 'Perusahaan elektronik Korea Selatan yang memproduksi peralatan rumah tangga dan elektronik',
    logo: 'https://logo.clearbit.com/lg.com',
    website: 'https://www.lg.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_005',
    name: 'Xiaomi',
    description: 'Perusahaan teknologi Tiongkok yang memproduksi smartphone, peralatan rumah pintar, dan elektronik konsumen',
    logo: 'https://logo.clearbit.com/mi.com',
    website: 'https://www.mi.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_006',
    name: 'Nike',
    description: 'Perusahaan multinasional Amerika yang merancang, mengembangkan, dan menjual sepatu, pakaian, dan aksesoris olahraga',
    logo: 'https://logo.clearbit.com/nike.com',
    website: 'https://www.nike.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_007',
    name: 'Adidas',
    description: 'Perusahaan multinasional Jerman yang merancang dan memproduksi sepatu, pakaian, dan aksesoris olahraga',
    logo: 'https://logo.clearbit.com/adidas.com',
    website: 'https://www.adidas.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_008',
    name: 'Unilever',
    description: 'Perusahaan multinasional yang memproduksi produk konsumen seperti makanan, minuman, dan produk perawatan',
    logo: 'https://logo.clearbit.com/unilever.com',
    website: 'https://www.unilever.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_009',
    name: 'Nestle',
    description: 'Perusahaan makanan dan minuman multinasional Swiss',
    logo: 'https://logo.clearbit.com/nestle.com',
    website: 'https://www.nestle.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'brand_010',
    name: 'Generic Brand',
    description: 'Merek generik untuk produk tanpa merek khusus',
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterBrands(brands: Brand[], query: any): Brand[] {
  let filtered = [...brands];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(brand => 
      brand.name.toLowerCase().includes(searchTerm) ||
      brand.description?.toLowerCase().includes(searchTerm) ||
      brand.website?.toLowerCase().includes(searchTerm)
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(brand => brand.isActive === isActive);
  }

  return filtered;
}

function sortBrands(brands: Brand[], sortBy: string, sortOrder: string): Brand[] {
  return brands.sort((a, b) => {
    let aValue = a[sortBy as keyof Brand];
    let bValue = b[sortBy as keyof Brand];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function paginateBrands(brands: Brand[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: brands.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: brands.length,
      totalPages: Math.ceil(brands.length / limit),
      hasNext: endIndex < brands.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/brands - Get all brands with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = BrandQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter brands
    let filteredBrands = filterBrands(mockBrands, query);

    // Sort brands
    filteredBrands = sortBrands(filteredBrands, sortBy, sortOrder);

    // Paginate brands
    const result = paginateBrands(filteredBrands, page, limit);

    // Calculate summary
    const summary = {
      total: filteredBrands.length,
      active: filteredBrands.filter(brand => brand.isActive).length,
      inactive: filteredBrands.filter(brand => !brand.isActive).length
    };

    return NextResponse.json({
      success: true,
      message: 'Data merek berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data merek'
    }, { status: 500 });
  }
}

// POST /api/brands - Create new brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BrandCreateSchema.parse(body);

    // Check if name already exists
    const existingBrand = mockBrands.find(brand => 
      brand.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingBrand) {
      return NextResponse.json({
        success: false,
        message: 'Nama merek sudah digunakan'
      }, { status: 400 });
    }

    // Create new brand
    const newBrand: Brand = {
      id: generateId(),
      name: data.name,
      description: data.description,
      logo: data.logo,
      website: data.website,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockBrands.push(newBrand);

    return NextResponse.json({
      success: true,
      message: 'Merek berhasil dibuat',
      data: newBrand
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat merek'
    }, { status: 500 });
  }
}

// PUT /api/brands - Update brand or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = BrandBulkUpdateSchema.parse(body);
      
      // Check if brands exist
      const existingBrands = mockBrands.filter(brand => ids.includes(brand.id));
      if (existingBrands.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa merek tidak ditemukan'
        }, { status: 404 });
      }

      // Update brands
      mockBrands = mockBrands.map(brand => {
        if (ids.includes(brand.id)) {
          return {
            ...brand,
            ...updates,
            updatedAt: new Date()
          };
        }
        return brand;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} merek berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID merek wajib diisi'
      }, { status: 400 });
    }

    const data = BrandUpdateSchema.parse(updateData);

    // Find brand
    const brandIndex = mockBrands.findIndex(brand => brand.id === id);
    if (brandIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Merek tidak ditemukan'
      }, { status: 404 });
    }

    // Check if name already exists (if updating name)
    if (data.name && data.name.toLowerCase() !== mockBrands[brandIndex].name.toLowerCase()) {
      const existingBrand = mockBrands.find(brand => 
        brand.name.toLowerCase() === data.name!.toLowerCase() && brand.id !== id
      );
      if (existingBrand) {
        return NextResponse.json({
          success: false,
          message: 'Nama merek sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update brand
    mockBrands[brandIndex] = {
      ...mockBrands[brandIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Merek berhasil diperbarui',
      data: mockBrands[brandIndex]
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui merek'
    }, { status: 500 });
  }
}

// DELETE /api/brands - Delete brands
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = BrandBulkDeleteSchema.parse(body);

    // Check if brands exist
    const existingBrands = mockBrands.filter(brand => ids.includes(brand.id));
    if (existingBrands.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa merek tidak ditemukan'
      }, { status: 404 });
    }

    // Check if brands are being used (in real implementation, check products table)
    // For now, we'll just prevent deletion of commonly used brands
    const protectedBrands = ['brand_001', 'brand_002', 'brand_003']; // Samsung, Apple, Sony
    const hasProtectedBrands = ids.some(id => protectedBrands.includes(id));
    
    if (hasProtectedBrands) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa merek tidak dapat dihapus karena sedang digunakan oleh produk'
      }, { status: 400 });
    }

    // Remove brands
    mockBrands = mockBrands.filter(brand => !ids.includes(brand.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} merek berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting brands:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus merek'
    }, { status: 500 });
  }
}