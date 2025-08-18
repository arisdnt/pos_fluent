// ======================================================================
// API ROUTE: LOGIN PENGGUNA
// Endpoint untuk autentikasi pengguna dengan username/email dan password
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ======================================================================
// TIPE DATA
// ======================================================================

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  password_hash: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface UserRole {
  user_id: string;
  role_id: string;
  branch_id: string;
  role_name: string;
  branch_name: string;
  branch_code: string;
  permissions: string[];
  is_active: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password_hash'>;
    roles: UserRole[];
    token: string;
    expires_at: Date;
  };
  error?: string;
}

// ======================================================================
// SKEMA VALIDASI
// ======================================================================

const LoginSchema = z.object({
  username: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember_me: z.boolean().optional().default(false),
  branch_id: z.string().uuid().optional() // Opsional untuk memilih cabang
});

// ======================================================================
// DATA MOCK (Simulasi Database)
// ======================================================================

const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'admin',
    email: 'admin@kasir.com',
    full_name: 'Administrator Sistem',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    phone: '081234567890',
    is_active: true,
    last_login_at: new Date('2024-01-15T10:30:00Z'),
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'kasir1',
    email: 'kasir1@kasir.com',
    full_name: 'Ahmad Kasir',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    phone: '081234567891',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    username: 'manager1',
    email: 'manager1@kasir.com',
    full_name: 'Sari Manager',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    phone: '081234567892',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  }
];

const mockUserRoles: UserRole[] = [
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    role_id: '660e8400-e29b-41d4-a716-446655440001',
    branch_id: '770e8400-e29b-41d4-a716-446655440001',
    role_name: 'Super Admin',
    branch_name: 'Toko Pusat',
    branch_code: 'TP001',
    permissions: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'products.create', 'products.read', 'products.update', 'products.delete',
      'transactions.create', 'transactions.read', 'transactions.update', 'transactions.delete',
      'reports.read', 'reports.export',
      'settings.read', 'settings.update'
    ],
    is_active: true
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    role_id: '660e8400-e29b-41d4-a716-446655440002',
    branch_id: '770e8400-e29b-41d4-a716-446655440001',
    role_name: 'Kasir',
    branch_name: 'Toko Pusat',
    branch_code: 'TP001',
    permissions: [
      'products.read',
      'transactions.create', 'transactions.read',
      'customers.read', 'customers.create'
    ],
    is_active: true
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440003',
    role_id: '660e8400-e29b-41d4-a716-446655440003',
    branch_id: '770e8400-e29b-41d4-a716-446655440001',
    role_name: 'Manager',
    branch_name: 'Toko Pusat',
    branch_code: 'TP001',
    permissions: [
      'products.create', 'products.read', 'products.update',
      'transactions.create', 'transactions.read', 'transactions.update',
      'customers.create', 'customers.read', 'customers.update',
      'reports.read', 'reports.export'
    ],
    is_active: true
  }
];

// ======================================================================
// FUNGSI UTILITAS
// ======================================================================

function generateToken(user: Omit<User, 'password_hash'>, roles: UserRole[]): string {
  const payload = {
    user_id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    roles: roles.map(role => ({
      role_id: role.role_id,
      role_name: role.role_name,
      branch_id: role.branch_id,
      branch_name: role.branch_name,
      branch_code: role.branch_code,
      permissions: role.permissions
    }))
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'kasir-secret-key',
    { expiresIn: '24h' }
  );
}

function findUserByUsernameOrEmail(identifier: string): User | undefined {
  return mockUsers.find(user => 
    user.username === identifier || user.email === identifier
  );
}

function getUserRoles(userId: string, branchId?: string): UserRole[] {
  let roles = mockUserRoles.filter(role => 
    role.user_id === userId && role.is_active
  );

  // Filter berdasarkan cabang jika diberikan
  if (branchId) {
    roles = roles.filter(role => role.branch_id === branchId);
  }

  return roles;
}

function createApiResponse<T>(success: boolean, message: string, data?: T, error?: string) {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: new Date().toISOString()
  };
}

// ======================================================================
// HANDLER API
// ======================================================================

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    const body = await request.json();
    
    // Validasi input
    const validatedData = LoginSchema.parse(body);
    const { username, password, remember_me, branch_id } = validatedData;

    // Cari pengguna berdasarkan username atau email
    const user = findUserByUsernameOrEmail(username);
    if (!user) {
      return NextResponse.json(
        createApiResponse(false, 'Username atau email tidak ditemukan'),
        { status: 401 }
      );
    }

    // Periksa status aktif pengguna
    if (!user.is_active) {
      return NextResponse.json(
        createApiResponse(false, 'Akun pengguna tidak aktif'),
        { status: 401 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiResponse(false, 'Password salah'),
        { status: 401 }
      );
    }

    // Ambil peran pengguna
    const userRoles = getUserRoles(user.id, branch_id);
    if (userRoles.length === 0) {
      return NextResponse.json(
        createApiResponse(false, 'Pengguna tidak memiliki peran yang aktif'),
        { status: 403 }
      );
    }

    // Generate token JWT
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    const token = generateToken(userWithoutPassword, userRoles);
    const expiresAt = new Date(Date.now() + (remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)); // 30 hari atau 1 hari

    // Set cookie untuk token
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
      path: '/'
    });

    // Update last login (simulasi)
    user.last_login_at = new Date();

    return NextResponse.json(
      createApiResponse(true, 'Login berhasil', {
        user: userWithoutPassword,
        roles: userRoles,
        token,
        expires_at: expiresAt
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createApiResponse(false, 'Data tidak valid', undefined, error.errors[0].message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createApiResponse(false, 'Terjadi kesalahan server'),
      { status: 500 }
    );
  }
}

// Method GET untuk mendapatkan informasi endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: 'POST /api/auth/login',
    description: 'Endpoint untuk login pengguna',
    parameters: {
      username: 'string (required) - Username atau email pengguna',
      password: 'string (required) - Password pengguna',
      remember_me: 'boolean (optional) - Ingat saya (default: false)',
      branch_id: 'string (optional) - ID cabang untuk login'
    },
    example: {
      username: 'admin',
      password: 'password',
      remember_me: false
    }
  });
}