// ======================================================================
// UNITS API ROUTE
// API endpoints untuk manajemen satuan
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Unit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const UnitQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'symbol', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const UnitCreateSchema = z.object({
  name: z.string().min(1, 'Nama satuan wajib diisi').max(50, 'Nama satuan maksimal 50 karakter'),
  symbol: z.string().min(1, 'Simbol satuan wajib diisi').max(10, 'Simbol satuan maksimal 10 karakter'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
  isActive: z.boolean().default(true)
});

const UnitUpdateSchema = z.object({
  name: z.string().min(1, 'Nama satuan wajib diisi').max(50, 'Nama satuan maksimal 50 karakter').optional(),
  symbol: z.string().min(1, 'Simbol satuan wajib diisi').max(10, 'Simbol satuan maksimal 10 karakter').optional(),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
  isActive: z.boolean().optional()
});

const UnitBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu satuan harus dipilih'),
  updates: z.object({
    isActive: z.boolean().optional()
  })
});

const UnitBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu satuan harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockUnits: Unit[] = [
  {
    id: 'unit_001',
    name: 'Pieces',
    symbol: 'pcs',
    description: 'Satuan untuk barang yang dihitung per buah',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_002',
    name: 'Kilogram',
    symbol: 'kg',
    description: 'Satuan berat dalam kilogram',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_003',
    name: 'Gram',
    symbol: 'gr',
    description: 'Satuan berat dalam gram',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_004',
    name: 'Liter',
    symbol: 'ltr',
    description: 'Satuan volume dalam liter',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_005',
    name: 'Mililiter',
    symbol: 'ml',
    description: 'Satuan volume dalam mililiter',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_006',
    name: 'Meter',
    symbol: 'm',
    description: 'Satuan panjang dalam meter',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_007',
    name: 'Centimeter',
    symbol: 'cm',
    description: 'Satuan panjang dalam centimeter',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_008',
    name: 'Box',
    symbol: 'box',
    description: 'Satuan kemasan dalam kotak',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_009',
    name: 'Pack',
    symbol: 'pack',
    description: 'Satuan kemasan dalam paket',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'unit_010',
    name: 'Dozen',
    symbol: 'dzn',
    description: 'Satuan untuk 12 buah',
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterUnits(units: Unit[], query: any): Unit[] {
  let filtered = [...units];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(unit => 
      unit.name.toLowerCase().includes(searchTerm) ||
      unit.symbol.toLowerCase().includes(searchTerm) ||
      unit.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(unit => unit.isActive === isActive);
  }

  return filtered;
}

function sortUnits(units: Unit[], sortBy: string, sortOrder: string): Unit[] {
  return units.sort((a, b) => {
    let aValue = a[sortBy as keyof Unit];
    let bValue = b[sortBy as keyof Unit];

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

function paginateUnits(units: Unit[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: units.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: units.length,
      totalPages: Math.ceil(units.length / limit),
      hasNext: endIndex < units.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/units - Get all units with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = UnitQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50'); // Higher default limit for units
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter units
    let filteredUnits = filterUnits(mockUnits, query);

    // Sort units
    filteredUnits = sortUnits(filteredUnits, sortBy, sortOrder);

    // Paginate units
    const result = paginateUnits(filteredUnits, page, limit);

    // Calculate summary
    const summary = {
      total: filteredUnits.length,
      active: filteredUnits.filter(unit => unit.isActive).length,
      inactive: filteredUnits.filter(unit => !unit.isActive).length
    };

    return NextResponse.json({
      success: true,
      message: 'Data satuan berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data satuan'
    }, { status: 500 });
  }
}

// POST /api/units - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UnitCreateSchema.parse(body);

    // Check if name already exists
    const existingName = mockUnits.find(unit => 
      unit.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingName) {
      return NextResponse.json({
        success: false,
        message: 'Nama satuan sudah digunakan'
      }, { status: 400 });
    }

    // Check if symbol already exists
    const existingSymbol = mockUnits.find(unit => 
      unit.symbol.toLowerCase() === data.symbol.toLowerCase()
    );
    if (existingSymbol) {
      return NextResponse.json({
        success: false,
        message: 'Simbol satuan sudah digunakan'
      }, { status: 400 });
    }

    // Create new unit
    const newUnit: Unit = {
      id: generateId(),
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUnits.push(newUnit);

    return NextResponse.json({
      success: true,
      message: 'Satuan berhasil dibuat',
      data: newUnit
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat satuan'
    }, { status: 500 });
  }
}

// PUT /api/units - Update unit or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = UnitBulkUpdateSchema.parse(body);
      
      // Check if units exist
      const existingUnits = mockUnits.filter(unit => ids.includes(unit.id));
      if (existingUnits.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa satuan tidak ditemukan'
        }, { status: 404 });
      }

      // Update units
      mockUnits = mockUnits.map(unit => {
        if (ids.includes(unit.id)) {
          return {
            ...unit,
            ...updates,
            updatedAt: new Date()
          };
        }
        return unit;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} satuan berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID satuan wajib diisi'
      }, { status: 400 });
    }

    const data = UnitUpdateSchema.parse(updateData);

    // Find unit
    const unitIndex = mockUnits.findIndex(unit => unit.id === id);
    if (unitIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Satuan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if name already exists (if updating name)
    if (data.name && data.name.toLowerCase() !== mockUnits[unitIndex].name.toLowerCase()) {
      const existingName = mockUnits.find(unit => 
        unit.name.toLowerCase() === data.name!.toLowerCase() && unit.id !== id
      );
      if (existingName) {
        return NextResponse.json({
          success: false,
          message: 'Nama satuan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if symbol already exists (if updating symbol)
    if (data.symbol && data.symbol.toLowerCase() !== mockUnits[unitIndex].symbol.toLowerCase()) {
      const existingSymbol = mockUnits.find(unit => 
        unit.symbol.toLowerCase() === data.symbol!.toLowerCase() && unit.id !== id
      );
      if (existingSymbol) {
        return NextResponse.json({
          success: false,
          message: 'Simbol satuan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update unit
    mockUnits[unitIndex] = {
      ...mockUnits[unitIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Satuan berhasil diperbarui',
      data: mockUnits[unitIndex]
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui satuan'
    }, { status: 500 });
  }
}

// DELETE /api/units - Delete units
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = UnitBulkDeleteSchema.parse(body);

    // Check if units exist
    const existingUnits = mockUnits.filter(unit => ids.includes(unit.id));
    if (existingUnits.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa satuan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if units are being used (in real implementation, check products table)
    // For now, we'll just prevent deletion of commonly used units
    const protectedUnits = ['unit_001', 'unit_002', 'unit_004']; // pcs, kg, ltr
    const hasProtectedUnits = ids.some(id => protectedUnits.includes(id));
    
    if (hasProtectedUnits) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa satuan tidak dapat dihapus karena sedang digunakan'
      }, { status: 400 });
    }

    // Remove units
    mockUnits = mockUnits.filter(unit => !ids.includes(unit.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} satuan berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting units:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus satuan'
    }, { status: 500 });
  }
}