// ======================================================================
// USERS API ROUTE
// API endpoints untuk manajemen pengguna
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// ======================================================================
// TYPES
// ======================================================================

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
  branches: UserBranch[];
}

interface UserRole {
  roleId: string;
  roleName: string;
  roleDescription?: string;
}

interface UserBranch {
  branchId: string;
  branchName: string;
  branchCode: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const UserQuerySchema = z.object({
  search: z.string().optional(),
  roleId: z.string().optional(),
  branchId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['fullName', 'username', 'email', 'createdAt', 'lastLogin']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const UserCreateSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').max(255, 'Nama lengkap maksimal 255 karakter'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  roleIds: z.array(z.string()).min(1, 'Minimal satu peran harus dipilih'),
  branchIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
});

const UserUpdateSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi').max(255, 'Nama lengkap maksimal 255 karakter').optional(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  roleIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

const UserBulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu pengguna harus dipilih')
});

const RoleQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const RoleCreateSchema = z.object({
  name: z.string().min(1, 'Nama peran wajib diisi').max(100, 'Nama peran maksimal 100 karakter'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional()
});

const RoleUpdateSchema = z.object({
  name: z.string().min(1, 'Nama peran wajib diisi').max(100, 'Nama peran maksimal 100 karakter').optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'admin',
    email: 'admin@contohretail.co.id',
    fullName: 'Administrator Sistem',
    phone: '081234567890',
    isActive: true,
    lastLogin: new Date('2024-01-20T10:30:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    roles: [
      { roleId: 'role_001', roleName: 'Super Admin', roleDescription: 'Akses penuh ke semua fitur' }
    ],
    branches: [
      { branchId: 'branch_001', branchName: 'Toko Jakarta Pusat', branchCode: 'JKT01' },
      { branchId: 'branch_002', branchName: 'Toko Bandung', branchCode: 'BDG01' }
    ]
  },
  {
    id: 'user_002',
    username: 'manager_jkt',
    email: 'manager.jakarta@contohretail.co.id',
    fullName: 'Budi Santoso',
    phone: '081234567891',
    isActive: true,
    lastLogin: new Date('2024-01-20T09:15:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    roles: [
      { roleId: 'role_002', roleName: 'Manager Cabang', roleDescription: 'Mengelola operasional cabang' }
    ],
    branches: [
      { branchId: 'branch_001', branchName: 'Toko Jakarta Pusat', branchCode: 'JKT01' }
    ]
  },
  {
    id: 'user_003',
    username: 'kasir_jkt_001',
    email: 'kasir1.jakarta@contohretail.co.id',
    fullName: 'Sari Dewi',
    phone: '081234567892',
    isActive: true,
    lastLogin: new Date('2024-01-20T08:00:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    roles: [
      { roleId: 'role_003', roleName: 'Kasir', roleDescription: 'Melakukan transaksi penjualan' }
    ],
    branches: [
      { branchId: 'branch_001', branchName: 'Toko Jakarta Pusat', branchCode: 'JKT01' }
    ]
  },
  {
    id: 'user_004',
    username: 'supervisor_bdg',
    email: 'supervisor.bandung@contohretail.co.id',
    fullName: 'Ahmad Wijaya',
    phone: '081234567893',
    isActive: false,
    lastLogin: new Date('2024-01-15T16:30:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    roles: [
      { roleId: 'role_004', roleName: 'Supervisor', roleDescription: 'Mengawasi operasional harian' }
    ],
    branches: [
      { branchId: 'branch_002', branchName: 'Toko Bandung', branchCode: 'BDG01' }
    ]
  }
];

let mockRoles: Role[] = [
  {
    id: 'role_001',
    name: 'Super Admin',
    description: 'Akses penuh ke semua fitur sistem',
    permissions: [
      { id: 'perm_001', name: 'users.create', description: 'Membuat pengguna baru', module: 'users', action: 'create' },
      { id: 'perm_002', name: 'users.read', description: 'Melihat data pengguna', module: 'users', action: 'read' },
      { id: 'perm_003', name: 'users.update', description: 'Mengubah data pengguna', module: 'users', action: 'update' },
      { id: 'perm_004', name: 'users.delete', description: 'Menghapus pengguna', module: 'users', action: 'delete' },
      { id: 'perm_005', name: 'products.manage', description: 'Mengelola produk', module: 'products', action: 'manage' },
      { id: 'perm_006', name: 'transactions.manage', description: 'Mengelola transaksi', module: 'transactions', action: 'manage' },
      { id: 'perm_007', name: 'reports.view', description: 'Melihat laporan', module: 'reports', action: 'view' },
      { id: 'perm_008', name: 'settings.manage', description: 'Mengelola pengaturan', module: 'settings', action: 'manage' }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'role_002',
    name: 'Manager Cabang',
    description: 'Mengelola operasional cabang',
    permissions: [
      { id: 'perm_002', name: 'users.read', description: 'Melihat data pengguna', module: 'users', action: 'read' },
      { id: 'perm_005', name: 'products.manage', description: 'Mengelola produk', module: 'products', action: 'manage' },
      { id: 'perm_006', name: 'transactions.manage', description: 'Mengelola transaksi', module: 'transactions', action: 'manage' },
      { id: 'perm_007', name: 'reports.view', description: 'Melihat laporan', module: 'reports', action: 'view' },
      { id: 'perm_009', name: 'inventory.manage', description: 'Mengelola persediaan', module: 'inventory', action: 'manage' }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'role_003',
    name: 'Kasir',
    description: 'Melakukan transaksi penjualan',
    permissions: [
      { id: 'perm_010', name: 'pos.operate', description: 'Mengoperasikan POS', module: 'pos', action: 'operate' },
      { id: 'perm_011', name: 'transactions.create', description: 'Membuat transaksi', module: 'transactions', action: 'create' },
      { id: 'perm_012', name: 'products.read', description: 'Melihat data produk', module: 'products', action: 'read' }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'role_004',
    name: 'Supervisor',
    description: 'Mengawasi operasional harian',
    permissions: [
      { id: 'perm_002', name: 'users.read', description: 'Melihat data pengguna', module: 'users', action: 'read' },
      { id: 'perm_006', name: 'transactions.manage', description: 'Mengelola transaksi', module: 'transactions', action: 'manage' },
      { id: 'perm_007', name: 'reports.view', description: 'Melihat laporan', module: 'reports', action: 'view' },
      { id: 'perm_012', name: 'products.read', description: 'Melihat data produk', module: 'products', action: 'read' }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

let mockPermissions: Permission[] = [
  { id: 'perm_001', name: 'users.create', description: 'Membuat pengguna baru', module: 'users', action: 'create' },
  { id: 'perm_002', name: 'users.read', description: 'Melihat data pengguna', module: 'users', action: 'read' },
  { id: 'perm_003', name: 'users.update', description: 'Mengubah data pengguna', module: 'users', action: 'update' },
  { id: 'perm_004', name: 'users.delete', description: 'Menghapus pengguna', module: 'users', action: 'delete' },
  { id: 'perm_005', name: 'products.manage', description: 'Mengelola produk', module: 'products', action: 'manage' },
  { id: 'perm_006', name: 'transactions.manage', description: 'Mengelola transaksi', module: 'transactions', action: 'manage' },
  { id: 'perm_007', name: 'reports.view', description: 'Melihat laporan', module: 'reports', action: 'view' },
  { id: 'perm_008', name: 'settings.manage', description: 'Mengelola pengaturan', module: 'settings', action: 'manage' },
  { id: 'perm_009', name: 'inventory.manage', description: 'Mengelola persediaan', module: 'inventory', action: 'manage' },
  { id: 'perm_010', name: 'pos.operate', description: 'Mengoperasikan POS', module: 'pos', action: 'operate' },
  { id: 'perm_011', name: 'transactions.create', description: 'Membuat transaksi', module: 'transactions', action: 'create' },
  { id: 'perm_012', name: 'products.read', description: 'Melihat data produk', module: 'products', action: 'read' }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRoleId(): string {
  return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterUsers(users: User[], query: any): User[] {
  let filtered = [...users];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.phone?.toLowerCase().includes(searchTerm)
    );
  }

  // Role filter
  if (query.roleId) {
    filtered = filtered.filter(user => 
      user.roles.some(role => role.roleId === query.roleId)
    );
  }

  // Branch filter
  if (query.branchId) {
    filtered = filtered.filter(user => 
      user.branches.some(branch => branch.branchId === query.branchId)
    );
  }

  // Active filter
  if (query.isActive !== undefined) {
    const isActive = query.isActive === 'true';
    filtered = filtered.filter(user => user.isActive === isActive);
  }

  return filtered;
}

function sortUsers(users: User[], sortBy: string, sortOrder: string): User[] {
  return users.sort((a, b) => {
    let aValue = a[sortBy as keyof User];
    let bValue = b[sortBy as keyof User];

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

function paginateUsers(users: User[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: users.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
      hasNext: endIndex < users.length,
      hasPrev: page > 1
    }
  };
}

function filterRoles(roles: Role[], query: any): Role[] {
  let filtered = [...roles];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(role => 
      role.name.toLowerCase().includes(searchTerm) ||
      role.description?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
}

function sortRoles(roles: Role[], sortBy: string, sortOrder: string): Role[] {
  return roles.sort((a, b) => {
    let aValue = a[sortBy as keyof Role];
    let bValue = b[sortBy as keyof Role];

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

function paginateRoles(roles: Role[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: roles.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: roles.length,
      totalPages: Math.ceil(roles.length / limit),
      hasNext: endIndex < roles.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/users - Get all users with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    // Check if requesting roles
    if (queryParams.type === 'roles') {
      const query = RoleQuerySchema.parse(queryParams);
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '20');
      const sortBy = query.sortBy || 'name';
      const sortOrder = query.sortOrder || 'asc';

      let filteredRoles = filterRoles(mockRoles, query);
      filteredRoles = sortRoles(filteredRoles, sortBy, sortOrder);
      const result = paginateRoles(filteredRoles, page, limit);

      return NextResponse.json({
        success: true,
        message: 'Data peran berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    }

    // Check if requesting permissions
    if (queryParams.type === 'permissions') {
      return NextResponse.json({
        success: true,
        message: 'Data izin berhasil diambil',
        data: mockPermissions
      });
    }

    // Default: get users
    const query = UserQuerySchema.parse(queryParams);
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'fullName';
    const sortOrder = query.sortOrder || 'asc';

    let filteredUsers = filterUsers(mockUsers, query);
    filteredUsers = sortUsers(filteredUsers, sortBy, sortOrder);
    const result = paginateUsers(filteredUsers, page, limit);

    const summary = {
      total: filteredUsers.length,
      active: filteredUsers.filter(user => user.isActive).length,
      inactive: filteredUsers.filter(user => !user.isActive).length
    };

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data'
    }, { status: 500 });
  }
}

// POST /api/users - Create new user or role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    // Create role
    if (type === 'role') {
      const data = RoleCreateSchema.parse(body);
      
      // Check if role name already exists
      const existingRole = mockRoles.find(role => role.name.toLowerCase() === data.name.toLowerCase());
      if (existingRole) {
        return NextResponse.json({
          success: false,
          message: 'Nama peran sudah digunakan'
        }, { status: 400 });
      }

      // Get permissions
      const permissions = data.permissionIds ? 
        mockPermissions.filter(perm => data.permissionIds!.includes(perm.id)) : [];

      const newRole: Role = {
        id: generateRoleId(),
        name: data.name,
        description: data.description,
        permissions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRoles.push(newRole);

      return NextResponse.json({
        success: true,
        message: 'Peran berhasil dibuat',
        data: newRole
      }, { status: 201 });
    }

    // Create user
    const data = UserCreateSchema.parse(body);

    // Check if username or email already exists
    const existingUser = mockUsers.find(user => 
      user.username === data.username || user.email === data.email
    );
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Username atau email sudah digunakan'
      }, { status: 400 });
    }

    // Get roles
    const roles = mockRoles
      .filter(role => data.roleIds.includes(role.id))
      .map(role => ({
        roleId: role.id,
        roleName: role.name,
        roleDescription: role.description
      }));

    // Get branches (mock data)
    const branches = data.branchIds ? 
      data.branchIds.map(branchId => ({
        branchId,
        branchName: 'Branch Name',
        branchCode: 'BR001'
      })) : [];

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser: User = {
      id: generateId(),
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles,
      branches
    };

    mockUsers.push(newUser);

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dibuat',
      data: newUser
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user/role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat data'
    }, { status: 500 });
  }
}

// PUT /api/users - Update user or role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID wajib diisi'
      }, { status: 400 });
    }

    // Update role
    if (type === 'role') {
      const data = RoleUpdateSchema.parse(updateData);
      const roleIndex = mockRoles.findIndex(role => role.id === id);
      
      if (roleIndex === -1) {
        return NextResponse.json({
          success: false,
          message: 'Peran tidak ditemukan'
        }, { status: 404 });
      }

      // Check if role name already exists (if updating name)
      if (data.name && data.name !== mockRoles[roleIndex].name) {
        const existingRole = mockRoles.find(role => 
          role.name.toLowerCase() === data.name!.toLowerCase() && role.id !== id
        );
        if (existingRole) {
          return NextResponse.json({
            success: false,
            message: 'Nama peran sudah digunakan'
          }, { status: 400 });
        }
      }

      // Get permissions
      const permissions = data.permissionIds ? 
        mockPermissions.filter(perm => data.permissionIds!.includes(perm.id)) : 
        mockRoles[roleIndex].permissions;

      mockRoles[roleIndex] = {
        ...mockRoles[roleIndex],
        ...data,
        permissions,
        updatedAt: new Date()
      };

      return NextResponse.json({
        success: true,
        message: 'Peran berhasil diperbarui',
        data: mockRoles[roleIndex]
      });
    }

    // Update user
    const data = UserUpdateSchema.parse(updateData);
    const userIndex = mockUsers.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      }, { status: 404 });
    }

    // Check if username or email already exists (if updating)
    if ((data.username && data.username !== mockUsers[userIndex].username) ||
        (data.email && data.email !== mockUsers[userIndex].email)) {
      const existingUser = mockUsers.find(user => 
        (data.username && user.username === data.username && user.id !== id) ||
        (data.email && user.email === data.email && user.id !== id)
      );
      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Username atau email sudah digunakan'
        }, { status: 400 });
      }
    }

    // Get roles
    const roles = data.roleIds ? 
      mockRoles
        .filter(role => data.roleIds!.includes(role.id))
        .map(role => ({
          roleId: role.id,
          roleName: role.name,
          roleDescription: role.description
        })) : mockUsers[userIndex].roles;

    // Get branches
    const branches = data.branchIds ? 
      data.branchIds.map(branchId => ({
        branchId,
        branchName: 'Branch Name',
        branchCode: 'BR001'
      })) : mockUsers[userIndex].branches;

    // Hash password if provided
    let hashedPassword;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...data,
      roles,
      branches,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil diperbarui',
      data: mockUsers[userIndex]
    });
  } catch (error) {
    console.error('Error updating user/role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui data'
    }, { status: 500 });
  }
}

// DELETE /api/users - Delete users or roles
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, type } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ID wajib diisi'
      }, { status: 400 });
    }

    // Delete roles
    if (type === 'role') {
      const existingRoles = mockRoles.filter(role => ids.includes(role.id));
      if (existingRoles.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa peran tidak ditemukan'
        }, { status: 404 });
      }

      mockRoles = mockRoles.filter(role => !ids.includes(role.id));

      return NextResponse.json({
        success: true,
        message: `${ids.length} peran berhasil dihapus`,
        deletedCount: ids.length
      });
    }

    // Delete users
    const existingUsers = mockUsers.filter(user => ids.includes(user.id));
    if (existingUsers.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa pengguna tidak ditemukan'
      }, { status: 404 });
    }

    mockUsers = mockUsers.filter(user => !ids.includes(user.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} pengguna berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting users/roles:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus data'
    }, { status: 500 });
  }
}