// ======================================================================
// TAX GROUPS API ROUTE
// API endpoints untuk manajemen grup pajak
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface TaxGroup {
  id: string;
  name: string;
  rate: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const TaxGroupQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  minRate: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxRate: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  sortBy: z.enum(['name', 'rate', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const TaxGroupCreateSchema = z.object({
  name: z.string().min(1, 'Nama grup pajak wajib diisi').max(100, 'Nama grup pajak maksimal 100 karakter'),
  rate: z.number().min(0, 'Tarif pajak tidak boleh negatif').max(100, 'Tarif pajak maksimal 100%'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
  isActive: z.boolean().default(true)
});

const TaxGroupUpdateSchema = z.object({
  name: z.string().min(1, 'Nama grup pajak wajib diisi').max(100, 'Nama grup pajak maksimal 100 karakter').optional(),
  rate: z.number().min(0, 'Tarif pajak tidak boleh negatif').max(100, 'Tarif pajak maksimal 100%').optional(),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
  isActive: z.boolean().optional()
});

const TaxGroupBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu grup pajak harus dipilih'),
  updates: z.object({
    isActive: z.boolean().optional(),
    rate: z.number().min(0).max(100).optional()
  })
});

const TaxGroupBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu grup pajak harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockTaxGroups: TaxGroup[] = [
  {
    id: 'tax_001',
    name: 'PPN 11%',
    rate: 11.0,
    description: 'Pajak Pertambahan Nilai standar Indonesia',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_002',
    name: 'Bebas Pajak',
    rate: 0.0,
    description: 'Produk yang tidak dikenakan pajak',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_003',
    name: 'PPh 23 (2%)',
    rate: 2.0,
    description: 'Pajak Penghasilan Pasal 23 untuk jasa tertentu',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_004',
    name: 'PPN DTP (Ditanggung Pemerintah)',
    rate: 0.0,
    description: 'PPN yang ditanggung pemerintah untuk produk tertentu',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_005',
    name: 'Pajak Ekspor',
    rate: 5.0,
    description: 'Pajak untuk produk ekspor',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_006',
    name: 'Pajak Mewah (10%)',
    rate: 10.0,
    description: 'Pajak Penjualan atas Barang Mewah',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_007',
    name: 'Pajak Mewah (20%)',
    rate: 20.0,
    description: 'Pajak Penjualan atas Barang Mewah tarif tinggi',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'tax_008',
    name: 'PPN Lama (10%)',
    rate: 10.0,
    description: 'Tarif PPN sebelum perubahan menjadi 11%',
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterTaxGroups(taxGroups: TaxGroup[], query: any): TaxGroup[] {
  let filtered = [...taxGroups];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(taxGroup => 
      taxGroup.name.toLowerCase().includes(searchTerm) ||
      taxGroup.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(taxGroup => taxGroup.isActive === isActive);
  }

  // Rate range filter
  if (query.minRate !== undefined) {
    const minRate = parseFloat(query.minRate);
    filtered = filtered.filter(taxGroup => taxGroup.rate >= minRate);
  }

  if (query.maxRate !== undefined) {
    const maxRate = parseFloat(query.maxRate);
    filtered = filtered.filter(taxGroup => taxGroup.rate <= maxRate);
  }

  return filtered;
}

function sortTaxGroups(taxGroups: TaxGroup[], sortBy: string, sortOrder: string): TaxGroup[] {
  return taxGroups.sort((a, b) => {
    let aValue = a[sortBy as keyof TaxGroup];
    let bValue = b[sortBy as keyof TaxGroup];

    // Handle undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortOrder === 'asc' ? 1 : -1;
    if (bValue == null) return sortOrder === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
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

function paginateTaxGroups(taxGroups: TaxGroup[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: taxGroups.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: taxGroups.length,
      totalPages: Math.ceil(taxGroups.length / limit),
      hasNext: endIndex < taxGroups.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/tax-groups - Get all tax groups with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = TaxGroupQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter tax groups
    let filteredTaxGroups = filterTaxGroups(mockTaxGroups, query);

    // Sort tax groups
    filteredTaxGroups = sortTaxGroups(filteredTaxGroups, sortBy, sortOrder);

    // Paginate tax groups
    const result = paginateTaxGroups(filteredTaxGroups, page, limit);

    // Calculate summary
    const summary = {
      total: filteredTaxGroups.length,
      active: filteredTaxGroups.filter(taxGroup => taxGroup.isActive).length,
      inactive: filteredTaxGroups.filter(taxGroup => !taxGroup.isActive).length,
      averageRate: filteredTaxGroups.length > 0 ? 
        filteredTaxGroups.reduce((sum, taxGroup) => sum + taxGroup.rate, 0) / filteredTaxGroups.length : 0,
      maxRate: filteredTaxGroups.length > 0 ? 
        Math.max(...filteredTaxGroups.map(taxGroup => taxGroup.rate)) : 0,
      minRate: filteredTaxGroups.length > 0 ? 
        Math.min(...filteredTaxGroups.map(taxGroup => taxGroup.rate)) : 0
    };

    return NextResponse.json({
      success: true,
      message: 'Data grup pajak berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching tax groups:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data grup pajak'
    }, { status: 500 });
  }
}

// POST /api/tax-groups - Create new tax group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = TaxGroupCreateSchema.parse(body);

    // Check if name already exists
    const existingTaxGroup = mockTaxGroups.find(taxGroup => 
      taxGroup.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingTaxGroup) {
      return NextResponse.json({
        success: false,
        message: 'Nama grup pajak sudah digunakan'
      }, { status: 400 });
    }

    // Create new tax group
    const newTaxGroup: TaxGroup = {
      id: generateId(),
      name: data.name,
      rate: data.rate,
      description: data.description,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTaxGroups.push(newTaxGroup);

    return NextResponse.json({
      success: true,
      message: 'Grup pajak berhasil dibuat',
      data: newTaxGroup
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tax group:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat grup pajak'
    }, { status: 500 });
  }
}

// PUT /api/tax-groups - Update tax group or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = TaxGroupBulkUpdateSchema.parse(body);
      
      // Check if tax groups exist
      const existingTaxGroups = mockTaxGroups.filter(taxGroup => ids.includes(taxGroup.id));
      if (existingTaxGroups.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa grup pajak tidak ditemukan'
        }, { status: 404 });
      }

      // Update tax groups
      mockTaxGroups = mockTaxGroups.map(taxGroup => {
        if (ids.includes(taxGroup.id)) {
          return {
            ...taxGroup,
            ...updates,
            updatedAt: new Date()
          };
        }
        return taxGroup;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} grup pajak berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID grup pajak wajib diisi'
      }, { status: 400 });
    }

    const data = TaxGroupUpdateSchema.parse(updateData);

    // Find tax group
    const taxGroupIndex = mockTaxGroups.findIndex(taxGroup => taxGroup.id === id);
    if (taxGroupIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Grup pajak tidak ditemukan'
      }, { status: 404 });
    }

    // Check if name already exists (if updating name)
    if (data.name && data.name.toLowerCase() !== mockTaxGroups[taxGroupIndex].name.toLowerCase()) {
      const existingTaxGroup = mockTaxGroups.find(taxGroup => 
        taxGroup.name.toLowerCase() === data.name!.toLowerCase() && taxGroup.id !== id
      );
      if (existingTaxGroup) {
        return NextResponse.json({
          success: false,
          message: 'Nama grup pajak sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update tax group
    mockTaxGroups[taxGroupIndex] = {
      ...mockTaxGroups[taxGroupIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Grup pajak berhasil diperbarui',
      data: mockTaxGroups[taxGroupIndex]
    });
  } catch (error) {
    console.error('Error updating tax group:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui grup pajak'
    }, { status: 500 });
  }
}

// DELETE /api/tax-groups - Delete tax groups
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = TaxGroupBulkDeleteSchema.parse(body);

    // Check if tax groups exist
    const existingTaxGroups = mockTaxGroups.filter(taxGroup => ids.includes(taxGroup.id));
    if (existingTaxGroups.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa grup pajak tidak ditemukan'
      }, { status: 404 });
    }

    // Check if tax groups are being used (in real implementation, check products table)
    // For now, we'll just prevent deletion of commonly used tax groups
    const protectedTaxGroups = ['tax_001', 'tax_002']; // PPN 11%, Bebas Pajak
    const hasProtectedTaxGroups = ids.some(id => protectedTaxGroups.includes(id));
    
    if (hasProtectedTaxGroups) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa grup pajak tidak dapat dihapus karena sedang digunakan oleh produk'
      }, { status: 400 });
    }

    // Remove tax groups
    mockTaxGroups = mockTaxGroups.filter(taxGroup => !ids.includes(taxGroup.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} grup pajak berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting tax groups:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus grup pajak'
    }, { status: 500 });
  }
}