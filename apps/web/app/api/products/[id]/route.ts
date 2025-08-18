// ======================================================================
// PRODUCT BY ID API ROUTE
// API endpoints untuk manajemen produk individual
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ProductUpdateSchema = z.object({
  kode: z.string().min(1, 'Kode produk wajib diisi').optional(),
  nama: z.string().min(1, 'Nama produk wajib diisi').optional(),
  deskripsi: z.string().optional(),
  kategoriId: z.string().min(1, 'Kategori wajib dipilih').optional(),
  kategoriNama: z.string().min(1, 'Nama kategori wajib diisi').optional(),
  hargaBeli: z.number().min(0, 'Harga beli tidak boleh negatif').optional(),
  hargaJual: z.number().min(0, 'Harga jual tidak boleh negatif').optional(),
  stok: z.number().min(0, 'Stok tidak boleh negatif').optional(),
  minStok: z.number().min(0, 'Minimum stok tidak boleh negatif').optional(),
  satuan: z.string().min(1, 'Satuan wajib diisi').optional(),
  barcode: z.string().optional(),
  gambar: z.string().optional(),
  aktif: z.boolean().optional(),
  kenaDiskon: z.boolean().optional(),
  kenaPajak: z.boolean().optional()
});

// ======================================================================
// MOCK DATA (same as in route.ts)
// ======================================================================

let mockProducts = [
  {
    id: 'prod_001',
    kode: 'BRG001',
    nama: 'Indomie Goreng',
    deskripsi: 'Mie instan rasa ayam bawang',
    kategoriId: 'kat_001',
    kategoriNama: 'Makanan',
    hargaBeli: 2500,
    hargaJual: 3500,
    stok: 100,
    minStok: 10,
    satuan: 'pcs',
    barcode: '8992388123456',
    gambar: '/images/products/indomie.jpg',
    aktif: true,
    kenaDiskon: true,
    kenaPajak: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'prod_002',
    kode: 'BRG002',
    nama: 'Aqua 600ml',
    deskripsi: 'Air mineral dalam kemasan',
    kategoriId: 'kat_002',
    kategoriNama: 'Minuman',
    hargaBeli: 2000,
    hargaJual: 3000,
    stok: 50,
    minStok: 5,
    satuan: 'botol',
    barcode: '8992771234567',
    gambar: '/images/products/aqua.jpg',
    aktif: true,
    kenaDiskon: true,
    kenaPajak: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'prod_003',
    kode: 'BRG003',
    nama: 'Beras Premium 5kg',
    deskripsi: 'Beras putih kualitas premium',
    kategoriId: 'kat_003',
    kategoriNama: 'Sembako',
    hargaBeli: 45000,
    hargaJual: 55000,
    stok: 25,
    minStok: 3,
    satuan: 'kg',
    barcode: '8992123456789',
    gambar: '/images/products/beras.jpg',
    aktif: true,
    kenaDiskon: false,
    kenaPajak: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Produk tidak ditemukan'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const updateData = ProductUpdateSchema.parse(body);

    const productIndex = mockProducts.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Produk tidak ditemukan'
      }, { status: 404 });
    }

    // Check if product code already exists (if updating code)
    if (updateData.kode) {
      const existingProduct = mockProducts.find(p => p.kode === updateData.kode && p.id !== id);
      if (existingProduct) {
        return NextResponse.json({
          success: false,
          error: 'Kode produk sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update product
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...updateData,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: mockProducts[productIndex],
      message: 'Produk berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data produk tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const productIndex = mockProducts.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Produk tidak ditemukan'
      }, { status: 404 });
    }

    // Remove product
    const deletedProduct = mockProducts.splice(productIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedProduct,
      message: 'Produk berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}