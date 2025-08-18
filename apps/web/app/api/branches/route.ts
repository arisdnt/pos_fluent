// ======================================================================
// BRANCHES API ROUTE
// API endpoints untuk manajemen cabang
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  operatingHours?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const BranchQuerySchema = z.object({
  search: z.string().optional(),
  companyId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const BranchCreateSchema = z.object({
  companyId: z.string().min(1, 'Company ID wajib diisi'),
  code: z.string().min(1, 'Kode cabang wajib diisi').max(10, 'Kode cabang maksimal 10 karakter'),
  name: z.string().min(1, 'Nama cabang wajib diisi').max(255, 'Nama cabang maksimal 255 karakter'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional(),
  managerId: z.string().optional(),
  operatingHours: z.string().optional(),
  isActive: z.boolean().default(true)
});

const BranchUpdateSchema = z.object({
  companyId: z.string().min(1, 'Company ID wajib diisi').optional(),
  code: z.string().min(1, 'Kode cabang wajib diisi').max(10, 'Kode cabang maksimal 10 karakter').optional(),
  name: z.string().min(1, 'Nama cabang wajib diisi').max(255, 'Nama cabang maksimal 255 karakter').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional(),
  managerId: z.string().optional(),
  operatingHours: z.string().optional(),
  isActive: z.boolean().optional()
});

const BranchBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu cabang harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockBranches: Branch[] = [
  {
    id: 'branch_001',
    companyId: 'company_001',
    code: 'JKT01',
    name: 'Toko Jakarta Pusat',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110',
    phone: '021-12345678',
    email: 'jakarta@contohretail.co.id',
    managerId: 'user_001',
    managerName: 'Budi Santoso',
    operatingHours: '08:00 - 22:00',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'branch_002',
    companyId: 'company_001',
    code: 'BDG01',
    name: 'Toko Bandung',
    address: 'Jl. Asia Afrika No. 456, Bandung, Jawa Barat 40111',
    phone: '022-87654321',
    email: 'bandung@contohretail.co.id',
    managerId: 'user_002',
    managerName: 'Siti Rahayu',
    operatingHours: '09:00 - 21:00',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'branch_003',
    companyId: 'company_001',
    code: 'SBY01',
    name: 'Toko Surabaya',
    address: 'Jl. Pemuda No. 789, Surabaya, Jawa Timur 60271',
    phone: '031-11223344',
    email: 'surabaya@contohretail.co.id',
    managerId: 'user_003',
    managerName: 'Ahmad Wijaya',
    operatingHours: '08:30 - 21:30',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'branch_004',
    companyId: 'company_001',
    code: 'MDN01',
    name: 'Toko Medan',
    address: 'Jl. Gatot Subroto No. 321, Medan, Sumatera Utara 20112',
    phone: '061-55667788',
    email: 'medan@contohretail.co.id',
    operatingHours: '09:00 - 20:00',
    isActive: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateBranchCode(): string {
  const codes = mockBranches.map(branch => branch.code);
  let counter = 1;
  let newCode;
  
  do {
    newCode = `BR${counter.toString().padStart(3, '0')}`;
    counter++;
  } while (codes.includes(newCode));
  
  return newCode;
}

function filterBranches(branches: Branch[], query: any): Branch[] {
  let filtered = [...branches];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(branch => 
      branch.name.toLowerCase().includes(searchTerm) ||
      branch.code.toLowerCase().includes(searchTerm) ||
      branch.address?.toLowerCase().includes(searchTerm) ||
      branch.managerName?.toLowerCase().includes(searchTerm)
    );
  }

  // Company filter
  if (query.companyId) {
    filtered = filtered.filter(branch => branch.companyId === query.companyId);
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(branch => branch.isActive === isActive);
  }

  return filtered;
}

function sortBranches(branches: Branch[], sortBy: string, sortOrder: string): Branch[] {
  return branches.sort((a, b) => {
    let aValue = a[sortBy as keyof Branch];
    let bValue = b[sortBy as keyof Branch];

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

function paginateBranches(branches: Branch[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: branches.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: branches.length,
      totalPages: Math.ceil(branches.length / limit),
      hasNext: endIndex < branches.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/branches - Get all branches with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = BranchQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter branches
    let filteredBranches = filterBranches(mockBranches, query);

    // Sort branches
    filteredBranches = sortBranches(filteredBranches, sortBy, sortOrder);

    // Paginate branches
    const result = paginateBranches(filteredBranches, page, limit);

    // Calculate summary
    const summary = {
      total: filteredBranches.length,
      active: filteredBranches.filter(branch => branch.isActive).length,
      inactive: filteredBranches.filter(branch => !branch.isActive).length
    };

    return NextResponse.json({
      success: true,
      message: 'Data cabang berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data cabang'
    }, { status: 500 });
  }
}

// POST /api/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = BranchCreateSchema.parse(body);

    // Check if code already exists
    const existingBranch = mockBranches.find(branch => branch.code === data.code);
    if (existingBranch) {
      return NextResponse.json({
        success: false,
        message: 'Kode cabang sudah digunakan'
      }, { status: 400 });
    }

    // Create new branch
    const newBranch: Branch = {
      id: generateId(),
      companyId: data.companyId,
      code: data.code,
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      managerId: data.managerId,
      managerName: data.managerId ? 'Manager Name' : undefined, // Should be fetched from users
      operatingHours: data.operatingHours,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockBranches.push(newBranch);

    return NextResponse.json({
      success: true,
      message: 'Cabang berhasil dibuat',
      data: newBranch
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat cabang'
    }, { status: 500 });
  }
}

// PUT /api/branches - Update branch
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID cabang wajib diisi'
      }, { status: 400 });
    }

    const data = BranchUpdateSchema.parse(updateData);

    // Find branch
    const branchIndex = mockBranches.findIndex(branch => branch.id === id);
    if (branchIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Cabang tidak ditemukan'
      }, { status: 404 });
    }

    // Check if code already exists (if updating code)
    if (data.code && data.code !== mockBranches[branchIndex].code) {
      const existingBranch = mockBranches.find(branch => branch.code === data.code && branch.id !== id);
      if (existingBranch) {
        return NextResponse.json({
          success: false,
          message: 'Kode cabang sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update branch
    mockBranches[branchIndex] = {
      ...mockBranches[branchIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Cabang berhasil diperbarui',
      data: mockBranches[branchIndex]
    });
  } catch (error) {
    console.error('Error updating branch:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui cabang'
    }, { status: 500 });
  }
}

// DELETE /api/branches - Delete branches
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = BranchBulkDeleteSchema.parse(body);

    // Check if branches exist
    const existingBranches = mockBranches.filter(branch => ids.includes(branch.id));
    if (existingBranches.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa cabang tidak ditemukan'
      }, { status: 404 });
    }

    // Remove branches
    mockBranches = mockBranches.filter(branch => !ids.includes(branch.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} cabang berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting branches:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus cabang'
    }, { status: 500 });
  }
}