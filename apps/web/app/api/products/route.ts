// ======================================================================
// PRODUCTS API ROUTE
// API endpoints untuk manajemen produk
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ProductSchema = z.object({
  kode: z.string().min(1, 'Kode produk wajib diisi'),
  nama: z.string().min(1, 'Nama produk wajib diisi'),
  deskripsi: z.string().optional(),
  kategoriId: z.string().min(1, 'Kategori wajib dipilih'),
  kategoriNama: z.string().min(1, 'Nama kategori wajib diisi'),
  hargaBeli: z.number().min(0, 'Harga beli tidak boleh negatif'),
  hargaJual: z.number().min(0, 'Harga jual tidak boleh negatif'),
  stok: z.number().min(0, 'Stok tidak boleh negatif'),
  minStok: z.number().min(0, 'Minimum stok tidak boleh negatif'),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  barcode: z.string().optional(),
  gambar: z.string().optional(),
  aktif: z.boolean().default(true),
  kenaDiskon: z.boolean().default(true),
  kenaPajak: z.boolean().default(true)
});

const ProductQuerySchema = z.object({
  search: z.string().optional(),
  kategori: z.string().optional(),
  aktif: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  sortBy: z.enum(['nama', 'kode', 'hargaJual', 'stok', 'kategoriNama']).optional().default('nama'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// ======================================================================
// MOCK DATA
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
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterProducts(products: any[], query: any) {
  let filtered = [...products];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(product => 
      product.nama.toLowerCase().includes(searchTerm) ||
      product.kode.toLowerCase().includes(searchTerm) ||
      product.deskripsi?.toLowerCase().includes(searchTerm) ||
      product.barcode?.includes(searchTerm)
    );
  }

  // Category filter
  if (query.kategori) {
    filtered = filtered.filter(product => product.kategoriId === query.kategori);
  }

  // Active filter
  if (query.aktif !== undefined) {
    filtered = filtered.filter(product => product.aktif === query.aktif);
  }

  return filtered;
}

function sortProducts(products: any[], sortBy: string, sortOrder: string) {
  return products.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle string comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
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

function paginateProducts(products: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: products.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: products.length,
      totalPages: Math.ceil(products.length / limit),
      hasNext: endIndex < products.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/products - Get all products with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ProductQuerySchema.parse(Object.fromEntries(searchParams));

    // Filter products
    let filteredProducts = filterProducts(mockProducts, query);

    // Sort products
    filteredProducts = sortProducts(filteredProducts, query.sortBy, query.sortOrder);

    // Paginate products
    const result = paginateProducts(filteredProducts, query.page, query.limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productData = ProductSchema.parse(body);

    // Check if product code already exists
    const existingProduct = mockProducts.find(p => p.kode === productData.kode);
    if (existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Kode produk sudah digunakan'
      }, { status: 400 });
    }

    // Create new product
    const newProduct = {
      id: generateId(),
      ...productData,
      deskripsi: productData.deskripsi || '',
      barcode: productData.barcode || '',
      gambar: productData.gambar || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockProducts.push(newProduct);

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: 'Produk berhasil ditambahkan'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
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

// PUT /api/products - Update multiple products (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || !updates) {
      return NextResponse.json({
        success: false,
        error: 'IDs dan data update wajib diisi'
      }, { status: 400 });
    }

    const updatedProducts = [];
    
    for (const id of ids) {
      const productIndex = mockProducts.findIndex(p => p.id === id);
      if (productIndex !== -1) {
        mockProducts[productIndex] = {
          ...mockProducts[productIndex],
          ...updates,
          updatedAt: new Date()
        };
        updatedProducts.push(mockProducts[productIndex]);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProducts,
      message: `${updatedProducts.length} produk berhasil diperbarui`
    });

  } catch (error) {
    console.error('Error updating products:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/products - Delete multiple products (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json({
        success: false,
        error: 'IDs wajib berupa array'
      }, { status: 400 });
    }

    const deletedCount = ids.length;
    mockProducts = mockProducts.filter(p => !ids.includes(p.id));

    return NextResponse.json({
      success: true,
      message: `${deletedCount} produk berhasil dihapus`
    });

  } catch (error) {
    console.error('Error deleting products:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}