// ======================================================================
// CATEGORIES API ROUTE
// API endpoints untuk manajemen kategori produk
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Category {
  id: string;
  nama: string;
  deskripsi?: string;
  aktif: boolean;
  urutan: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryQuery {
  search?: string;
  aktif?: boolean;
  sortBy?: 'nama' | 'urutan' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CategoryQuerySchema = z.object({
  search: z.string().optional(),
  aktif: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['nama', 'urutan', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const CategoryCreateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi'),
  deskripsi: z.string().optional(),
  aktif: z.boolean().default(true),
  urutan: z.number().min(0, 'Urutan tidak boleh negatif').default(0)
});

const CategoryUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi').optional(),
  deskripsi: z.string().optional(),
  aktif: z.boolean().optional(),
  urutan: z.number().min(0, 'Urutan tidak boleh negatif').optional()
});

const CategoryBulkUpdateSchema = z.array(z.object({
  id: z.string(),
  nama: z.string().min(1, 'Nama kategori wajib diisi').optional(),
  deskripsi: z.string().optional(),
  aktif: z.boolean().optional(),
  urutan: z.number().min(0, 'Urutan tidak boleh negatif').optional()
}));

const CategoryBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu kategori harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockCategories: Category[] = [
  {
    id: 'kat_001',
    nama: 'Makanan',
    deskripsi: 'Produk makanan dan cemilan',
    aktif: true,
    urutan: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'kat_002',
    nama: 'Minuman',
    deskripsi: 'Minuman segar dan kemasan',
    aktif: true,
    urutan: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'kat_003',
    nama: 'Sembako',
    deskripsi: 'Kebutuhan pokok sehari-hari',
    aktif: true,
    urutan: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'kat_004',
    nama: 'Elektronik',
    deskripsi: 'Peralatan elektronik dan gadget',
    aktif: true,
    urutan: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'kat_005',
    nama: 'Kosmetik',
    deskripsi: 'Produk kecantikan dan perawatan',
    aktif: false,
    urutan: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function filterCategories(categories: Category[], query: CategoryQuery): Category[] {
  let filtered = [...categories];

  // Filter by search
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = filtered.filter(category =>
      category.nama.toLowerCase().includes(searchLower) ||
      (category.deskripsi && category.deskripsi.toLowerCase().includes(searchLower))
    );
  }

  // Filter by active status
  if (query.aktif !== undefined) {
    filtered = filtered.filter(category => category.aktif === query.aktif);
  }

  return filtered;
}

function sortCategories(categories: Category[], sortBy: string, sortOrder: string): Category[] {
  return categories.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'nama':
        aValue = a.nama.toLowerCase();
        bValue = b.nama.toLowerCase();
        break;
      case 'urutan':
        aValue = a.urutan;
        bValue = b.urutan;
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      default:
        aValue = a.urutan;
        bValue = b.urutan;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function paginateCategories(categories: Category[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: categories.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: categories.length,
      totalPages: Math.ceil(categories.length / limit),
      hasNext: endIndex < categories.length,
      hasPrev: page > 1
    }
  };
}

function generateCategoryId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `kat_${timestamp}${random}`;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/categories - Get all categories with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = CategoryQuerySchema.parse(queryParams);
    
    const query: CategoryQuery = {
      search: validatedQuery.search,
      aktif: validatedQuery.aktif === 'true' ? true : validatedQuery.aktif === 'false' ? false : undefined,
      sortBy: validatedQuery.sortBy || 'urutan',
      sortOrder: validatedQuery.sortOrder || 'asc',
      page: validatedQuery.page ? parseInt(validatedQuery.page) : 1,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 50
    };

    // Apply filters
    let filteredCategories = filterCategories(mockCategories, query);
    
    // Apply sorting
    filteredCategories = sortCategories(filteredCategories, query.sortBy!, query.sortOrder!);
    
    // Apply pagination
    const result = paginateCategories(filteredCategories, query.page!, query.limit!);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      query
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    
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

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const categoryData = CategoryCreateSchema.parse(body);

    // Check if category name already exists
    const existingCategory = mockCategories.find(cat => 
      cat.nama.toLowerCase() === categoryData.nama.toLowerCase()
    );
    
    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Nama kategori sudah digunakan'
      }, { status: 400 });
    }

    // Create new category
    const newCategory: Category = {
      id: generateCategoryId(),
      nama: categoryData.nama,
      deskripsi: categoryData.deskripsi,
      aktif: categoryData.aktif,
      urutan: categoryData.urutan,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockCategories.push(newCategory);

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Kategori berhasil dibuat'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data kategori tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/categories - Bulk update categories
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = CategoryBulkUpdateSchema.parse(body);

    const updatedCategories: Category[] = [];
    const errors: string[] = [];

    for (const update of updates) {
      const categoryIndex = mockCategories.findIndex(cat => cat.id === update.id);
      
      if (categoryIndex === -1) {
        errors.push(`Kategori dengan ID ${update.id} tidak ditemukan`);
        continue;
      }

      // Check if category name already exists (if updating name)
      if (update.nama) {
        const existingCategory = mockCategories.find(cat => 
          cat.nama.toLowerCase() === update.nama!.toLowerCase() && cat.id !== update.id
        );
        if (existingCategory) {
          errors.push(`Nama kategori "${update.nama}" sudah digunakan`);
          continue;
        }
      }

      // Update category
      mockCategories[categoryIndex] = {
        ...mockCategories[categoryIndex],
        ...update,
        updatedAt: new Date()
      };

      updatedCategories.push(mockCategories[categoryIndex]);
    }

    return NextResponse.json({
      success: true,
      data: updatedCategories,
      errors: errors.length > 0 ? errors : undefined,
      message: `${updatedCategories.length} kategori berhasil diperbarui`
    });

  } catch (error) {
    console.error('Error bulk updating categories:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data kategori tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/categories - Bulk delete categories
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = CategoryBulkDeleteSchema.parse(body);

    const deletedCategories: Category[] = [];
    const errors: string[] = [];

    for (const id of ids) {
      const categoryIndex = mockCategories.findIndex(cat => cat.id === id);
      
      if (categoryIndex === -1) {
        errors.push(`Kategori dengan ID ${id} tidak ditemukan`);
        continue;
      }

      // Remove category
      const deletedCategory = mockCategories.splice(categoryIndex, 1)[0];
      deletedCategories.push(deletedCategory);
    }

    return NextResponse.json({
      success: true,
      data: deletedCategories,
      errors: errors.length > 0 ? errors : undefined,
      message: `${deletedCategories.length} kategori berhasil dihapus`
    });

  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    
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