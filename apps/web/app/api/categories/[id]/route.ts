// ======================================================================
// CATEGORY BY ID API ROUTE
// API endpoints untuk manajemen kategori individual
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

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CategoryUpdateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi').optional(),
  deskripsi: z.string().optional(),
  aktif: z.boolean().optional(),
  urutan: z.number().min(0, 'Urutan tidak boleh negatif').optional()
});

// ======================================================================
// MOCK DATA (same as in route.ts)
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
// API HANDLERS
// ======================================================================

// GET /api/categories/[id] - Get category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const category = mockCategories.find(cat => cat.id === id);
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Kategori tidak ditemukan'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Update category by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const updateData = CategoryUpdateSchema.parse(body);

    const categoryIndex = mockCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Kategori tidak ditemukan'
      }, { status: 404 });
    }

    // Check if category name already exists (if updating name)
    if (updateData.nama) {
      const existingCategory = mockCategories.find(cat => 
        cat.nama.toLowerCase() === updateData.nama!.toLowerCase() && cat.id !== id
      );
      if (existingCategory) {
        return NextResponse.json({
          success: false,
          error: 'Nama kategori sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update category
    mockCategories[categoryIndex] = {
      ...mockCategories[categoryIndex],
      ...updateData,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: mockCategories[categoryIndex],
      message: 'Kategori berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating category:', error);
    
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

// DELETE /api/categories/[id] - Delete category by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const categoryIndex = mockCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Kategori tidak ditemukan'
      }, { status: 404 });
    }

    // Remove category
    const deletedCategory = mockCategories.splice(categoryIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedCategory,
      message: 'Kategori berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}