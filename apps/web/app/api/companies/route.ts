// ======================================================================
// COMPANIES API ROUTE
// API endpoints untuk manajemen perusahaan
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Company {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const CompanyQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'code', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const CompanyCreateSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi').max(100, 'Nama perusahaan maksimal 100 karakter'),
  code: z.string().min(1, 'Kode perusahaan wajib diisi').max(20, 'Kode perusahaan maksimal 20 karakter'),
  address: z.string().max(255, 'Alamat maksimal 255 karakter').optional(),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  email: z.string().email('Format email tidak valid').max(100, 'Email maksimal 100 karakter').optional(),
  website: z.string().url('Format website tidak valid').max(100, 'Website maksimal 100 karakter').optional(),
  taxNumber: z.string().max(50, 'Nomor pajak maksimal 50 karakter').optional(),
  logo: z.string().max(255, 'URL logo maksimal 255 karakter').optional(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  isActive: z.boolean().default(true)
});

const CompanyUpdateSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi').max(100, 'Nama perusahaan maksimal 100 karakter').optional(),
  code: z.string().min(1, 'Kode perusahaan wajib diisi').max(20, 'Kode perusahaan maksimal 20 karakter').optional(),
  address: z.string().max(255, 'Alamat maksimal 255 karakter').optional(),
  phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  email: z.string().email('Format email tidak valid').max(100, 'Email maksimal 100 karakter').optional(),
  website: z.string().url('Format website tidak valid').max(100, 'Website maksimal 100 karakter').optional(),
  taxNumber: z.string().max(50, 'Nomor pajak maksimal 50 karakter').optional(),
  logo: z.string().max(255, 'URL logo maksimal 255 karakter').optional(),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  isActive: z.boolean().optional()
});

const CompanyBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu perusahaan harus dipilih'),
  updates: z.object({
    isActive: z.boolean().optional()
  })
});

const CompanyBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu perusahaan harus dipilih')
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockCompanies: Company[] = [
  {
    id: 'company_001',
    name: 'PT. Teknologi Kasir Indonesia',
    code: 'TKI',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    phone: '021-12345678',
    email: 'info@teknologikasir.com',
    website: 'https://www.teknologikasir.com',
    taxNumber: '01.234.567.8-901.000',
    logo: '/images/company-logo.png',
    description: 'Perusahaan teknologi yang bergerak di bidang sistem point of sale',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'company_002',
    name: 'CV. Retail Solutions',
    code: 'RS',
    address: 'Jl. Gatot Subroto No. 456, Jakarta Selatan',
    phone: '021-87654321',
    email: 'contact@retailsolutions.co.id',
    website: 'https://www.retailsolutions.co.id',
    taxNumber: '02.345.678.9-012.000',
    description: 'Penyedia solusi retail dan manajemen toko',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'company_003',
    name: 'PT. Digital Commerce',
    code: 'DC',
    address: 'Jl. Thamrin No. 789, Jakarta Pusat',
    phone: '021-11223344',
    email: 'hello@digitalcommerce.id',
    website: 'https://www.digitalcommerce.id',
    taxNumber: '03.456.789.0-123.000',
    description: 'Platform e-commerce dan digital payment',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'company_004',
    name: 'PT. Legacy Systems',
    code: 'LS',
    address: 'Jl. Kuningan No. 321, Jakarta Selatan',
    phone: '021-99887766',
    email: 'support@legacysystems.com',
    taxNumber: '04.567.890.1-234.000',
    description: 'Sistem lama yang sudah tidak digunakan',
    isActive: false,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-30')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCompanyCode(name: string): string {
  // Generate code from company name initials
  const words = name.split(' ').filter(word => word.length > 0);
  let code = '';
  
  for (const word of words) {
    if (code.length < 5) {
      code += word.charAt(0).toUpperCase();
    }
  }
  
  // If code is too short, add more characters
  if (code.length < 2) {
    code = name.substring(0, 3).toUpperCase();
  }
  
  // Check if code already exists and add number if needed
  let finalCode = code;
  let counter = 1;
  while (mockCompanies.some(company => company.code === finalCode)) {
    finalCode = `${code}${counter}`;
    counter++;
  }
  
  return finalCode;
}

function filterCompanies(companies: Company[], query: any): Company[] {
  let filtered = [...companies];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(company => 
      company.name.toLowerCase().includes(searchTerm) ||
      company.code.toLowerCase().includes(searchTerm) ||
      company.email?.toLowerCase().includes(searchTerm) ||
      company.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(company => company.isActive === isActive);
  }

  return filtered;
}

function sortCompanies(companies: Company[], sortBy: string, sortOrder: string): Company[] {
  return companies.sort((a, b) => {
    let aValue = a[sortBy as keyof Company];
    let bValue = b[sortBy as keyof Company];

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

function paginateCompanies(companies: Company[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: companies.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: companies.length,
      totalPages: Math.ceil(companies.length / limit),
      hasNext: endIndex < companies.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/companies - Get all companies with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = CompanyQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'asc';

    // Filter companies
    let filteredCompanies = filterCompanies(mockCompanies, query);

    // Sort companies
    filteredCompanies = sortCompanies(filteredCompanies, sortBy, sortOrder);

    // Paginate companies
    const result = paginateCompanies(filteredCompanies, page, limit);

    // Calculate summary
    const summary = {
      total: filteredCompanies.length,
      active: filteredCompanies.filter(company => company.isActive).length,
      inactive: filteredCompanies.filter(company => !company.isActive).length,
      withWebsite: filteredCompanies.filter(company => company.website).length,
      withEmail: filteredCompanies.filter(company => company.email).length,
      withTaxNumber: filteredCompanies.filter(company => company.taxNumber).length
    };

    return NextResponse.json({
      success: true,
      message: 'Data perusahaan berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data perusahaan'
    }, { status: 500 });
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CompanyCreateSchema.parse(body);

    // Check if name already exists
    const existingCompanyByName = mockCompanies.find(company => 
      company.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existingCompanyByName) {
      return NextResponse.json({
        success: false,
        message: 'Nama perusahaan sudah digunakan'
      }, { status: 400 });
    }

    // Check if code already exists
    const existingCompanyByCode = mockCompanies.find(company => 
      company.code.toLowerCase() === data.code.toLowerCase()
    );
    if (existingCompanyByCode) {
      return NextResponse.json({
        success: false,
        message: 'Kode perusahaan sudah digunakan'
      }, { status: 400 });
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingCompanyByEmail = mockCompanies.find(company => 
        company.email?.toLowerCase() === data.email!.toLowerCase()
      );
      if (existingCompanyByEmail) {
        return NextResponse.json({
          success: false,
          message: 'Email perusahaan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Create new company
    const newCompany: Company = {
      id: generateId(),
      name: data.name,
      code: data.code,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      taxNumber: data.taxNumber,
      logo: data.logo,
      description: data.description,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockCompanies.push(newCompany);

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil dibuat',
      data: newCompany
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat perusahaan'
    }, { status: 500 });
  }
}

// PUT /api/companies - Update company or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = CompanyBulkUpdateSchema.parse(body);
      
      // Check if companies exist
      const existingCompanies = mockCompanies.filter(company => ids.includes(company.id));
      if (existingCompanies.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa perusahaan tidak ditemukan'
        }, { status: 404 });
      }

      // Update companies
      mockCompanies = mockCompanies.map(company => {
        if (ids.includes(company.id)) {
          return {
            ...company,
            ...updates,
            updatedAt: new Date()
          };
        }
        return company;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} perusahaan berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID perusahaan wajib diisi'
      }, { status: 400 });
    }

    const data = CompanyUpdateSchema.parse(updateData);

    // Find company
    const companyIndex = mockCompanies.findIndex(company => company.id === id);
    if (companyIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Perusahaan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if name already exists (if updating name)
    if (data.name && data.name.toLowerCase() !== mockCompanies[companyIndex].name.toLowerCase()) {
      const existingCompany = mockCompanies.find(company => 
        company.name.toLowerCase() === data.name!.toLowerCase() && company.id !== id
      );
      if (existingCompany) {
        return NextResponse.json({
          success: false,
          message: 'Nama perusahaan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if code already exists (if updating code)
    if (data.code && data.code.toLowerCase() !== mockCompanies[companyIndex].code.toLowerCase()) {
      const existingCompany = mockCompanies.find(company => 
        company.code.toLowerCase() === data.code!.toLowerCase() && company.id !== id
      );
      if (existingCompany) {
        return NextResponse.json({
          success: false,
          message: 'Kode perusahaan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Check if email already exists (if updating email)
    if (data.email && data.email.toLowerCase() !== mockCompanies[companyIndex].email?.toLowerCase()) {
      const existingCompany = mockCompanies.find(company => 
        company.email?.toLowerCase() === data.email!.toLowerCase() && company.id !== id
      );
      if (existingCompany) {
        return NextResponse.json({
          success: false,
          message: 'Email perusahaan sudah digunakan'
        }, { status: 400 });
      }
    }

    // Update company
    mockCompanies[companyIndex] = {
      ...mockCompanies[companyIndex],
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil diperbarui',
      data: mockCompanies[companyIndex]
    });
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui perusahaan'
    }, { status: 500 });
  }
}

// DELETE /api/companies - Delete companies
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = CompanyBulkDeleteSchema.parse(body);

    // Check if companies exist
    const existingCompanies = mockCompanies.filter(company => ids.includes(company.id));
    if (existingCompanies.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa perusahaan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if companies are being used (in real implementation, check branches table)
    // For now, we'll just prevent deletion of the main company
    const protectedCompanies = ['company_001']; // Main company
    const hasProtectedCompanies = ids.some(id => protectedCompanies.includes(id));
    
    if (hasProtectedCompanies) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa perusahaan tidak dapat dihapus karena sedang digunakan oleh cabang'
      }, { status: 400 });
    }

    // Remove companies
    mockCompanies = mockCompanies.filter(company => !ids.includes(company.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} perusahaan berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting companies:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus perusahaan'
    }, { status: 500 });
  }
}