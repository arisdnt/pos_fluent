// ======================================================================
// API ROUTE: PROFIL PENGGUNA SAAT INI
// Endpoint untuk mendapatkan informasi pengguna yang sedang login
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ======================================================================
// TIPE DATA
// ======================================================================

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  company_id?: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface UserRole {
  role_id: string;
  role_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  permissions: string[];
}

interface TokenPayload {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    roles: UserRole[];
    permissions: string[];
    current_branch?: {
      id: string;
      name: string;
      code: string;
    };
    session_info: {
      issued_at: Date;
      expires_at: Date;
      time_remaining: string;
    };
  };
  error?: string;
}

// ======================================================================
// SKEMA VALIDASI
// ======================================================================

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1, 'Nama lengkap wajib diisi').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  current_password: z.string().min(1, 'Password saat ini wajib diisi untuk update').optional(),
  new_password: z.string().min(6, 'Password baru minimal 6 karakter').optional()
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
    phone: '081234567892',
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  }
];

// ======================================================================
// FUNGSI UTILITAS
// ======================================================================

function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kasir-secret-key') as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

function findUserById(userId: string): User | undefined {
  return mockUsers.find(user => user.id === userId);
}

function getAllPermissions(roles: UserRole[]): string[] {
  const permissions = new Set<string>();
  roles.forEach(role => {
    role.permissions.forEach(permission => permissions.add(permission));
  });
  return Array.from(permissions);
}

function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
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

export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    // Cek apakah ada header dari middleware bypass
    const bypassUserId = request.headers.get('x-user-id');
    const bypassRoles = request.headers.get('x-user-roles');
    const bypassPermissions = request.headers.get('x-user-permissions');
    
    // Jika ada header bypass, gunakan user dummy
    if (bypassUserId && bypassRoles && bypassPermissions) {
      const dummyUser: User = {
        id: bypassUserId,
        username: 'test-user',
        email: 'test@pos-suite.local',
        full_name: 'Test User (Bypass Mode)',
        phone: '+62812345678',
        is_active: true,
        company_id: 'test-company-001',
        created_at: new Date(),
        updated_at: new Date()
      };

      const dummyRoles: UserRole[] = [
        {
          role_id: 'test-role-001',
          role_name: 'Administrator',
          branch_id: 'test-branch-001',
          branch_name: 'Cabang Testing',
          branch_code: 'TEST001',
          permissions: ['*']
        }
      ];
      
      const allPermissions = getAllPermissions(dummyRoles);
      const currentBranch = dummyRoles[0];
      
      const profileData = {
        user: {
          id: dummyUser.id,
          username: dummyUser.username,
          email: dummyUser.email,
          full_name: dummyUser.full_name,
          phone: dummyUser.phone,
          is_active: dummyUser.is_active,
          company_id: dummyUser.company_id,
          created_at: dummyUser.created_at,
          updated_at: dummyUser.updated_at
        },
        roles: dummyRoles,
        permissions: allPermissions,
        current_branch: {
          id: currentBranch.branch_id,
          name: currentBranch.branch_name,
          code: currentBranch.branch_code
        },
        session_info: {
          issued_at: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          time_remaining: '24 jam 0 menit'
        }
      };
      
      return NextResponse.json(
        createApiResponse(true, 'Data profil berhasil diambil (Bypass Mode)', profileData),
        { status: 200 }
      );
    }
    
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        createApiResponse(false, 'Token tidak ditemukan', undefined, 'Unauthorized'),
        { status: 401 }
      );
    }

    // Verifikasi token
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        createApiResponse(false, 'Token tidak valid atau expired', undefined, 'Unauthorized'),
        { status: 401 }
      );
    }

    // Ambil data pengguna
    const user = findUserById(tokenPayload.user_id);
    if (!user) {
      return NextResponse.json(
        createApiResponse(false, 'Pengguna tidak ditemukan', undefined, 'User not found'),
        { status: 404 }
      );
    }

    // Periksa status aktif
    if (!user.is_active) {
      return NextResponse.json(
        createApiResponse(false, 'Akun pengguna tidak aktif', undefined, 'Account inactive'),
        { status: 403 }
      );
    }

    // Ambil semua permissions
    const allPermissions = getAllPermissions(tokenPayload.roles);

    // Tentukan cabang saat ini (ambil yang pertama jika ada)
    const currentBranch = tokenPayload.roles.length > 0 ? {
      id: tokenPayload.roles[0].branch_id,
      name: tokenPayload.roles[0].branch_name,
      code: tokenPayload.roles[0].branch_code
    } : undefined;

    // Informasi session
    const issuedAt = new Date(tokenPayload.iat * 1000);
    const expiresAt = new Date(tokenPayload.exp * 1000);
    const timeRemaining = formatTimeRemaining(expiresAt);

    return NextResponse.json(
      createApiResponse(true, 'Profil pengguna berhasil diambil', {
        user,
        roles: tokenPayload.roles,
        permissions: allPermissions,
        current_branch: currentBranch,
        session_info: {
          issued_at: issuedAt,
          expires_at: expiresAt,
          time_remaining: timeRemaining
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Get profile error:', error);
    
    return NextResponse.json(
      createApiResponse(false, 'Terjadi kesalahan server'),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        createApiResponse(false, 'Token tidak ditemukan', undefined, 'Unauthorized'),
        { status: 401 }
      );
    }

    // Verifikasi token
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        createApiResponse(false, 'Token tidak valid atau expired', undefined, 'Unauthorized'),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validasi input
    const validatedData = UpdateProfileSchema.parse(body);

    // Ambil data pengguna
    const user = findUserById(tokenPayload.user_id);
    if (!user) {
      return NextResponse.json(
        createApiResponse(false, 'Pengguna tidak ditemukan', undefined, 'User not found'),
        { status: 404 }
      );
    }

    // Update data pengguna (simulasi)
    if (validatedData.full_name) {
      user.full_name = validatedData.full_name;
    }
    if (validatedData.email) {
      user.email = validatedData.email;
    }
    if (validatedData.phone) {
      user.phone = validatedData.phone;
    }
    
    user.updated_at = new Date();

    // Dalam implementasi nyata, update password juga perlu dihandle
    // if (validatedData.new_password && validatedData.current_password) {
    //   // Verifikasi password lama dan update password baru
    // }

    return NextResponse.json(
      createApiResponse(true, 'Profil berhasil diperbarui', {
        user,
        roles: tokenPayload.roles,
        permissions: getAllPermissions(tokenPayload.roles),
        current_branch: tokenPayload.roles.length > 0 ? {
          id: tokenPayload.roles[0].branch_id,
          name: tokenPayload.roles[0].branch_name,
          code: tokenPayload.roles[0].branch_code
        } : undefined,
        session_info: {
          issued_at: new Date(tokenPayload.iat * 1000),
          expires_at: new Date(tokenPayload.exp * 1000),
          time_remaining: formatTimeRemaining(new Date(tokenPayload.exp * 1000))
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Update profile error:', error);
    
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