// ======================================================================
// API ROUTE: LOGOUT PENGGUNA
// Endpoint untuk logout pengguna dan menghapus session
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ======================================================================
// TIPE DATA
// ======================================================================

interface LogoutResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

interface TokenPayload {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  roles: Array<{
    role_id: string;
    role_name: string;
    branch_id: string;
    branch_name: string;
    branch_code: string;
    permissions: string[];
  }>;
  iat: number;
  exp: number;
}

// ======================================================================
// FUNGSI UTILITAS
// ======================================================================

function createApiResponse(success: boolean, message: string): LogoutResponse {
  return {
    success,
    message,
    timestamp: new Date().toISOString()
  };
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kasir-secret-key') as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// ======================================================================
// HANDLER API
// ======================================================================

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    // Verifikasi token jika ada
    let userInfo = null;
    if (token) {
      userInfo = verifyToken(token);
    }

    // Hapus cookie auth-token
    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Set ke masa lalu untuk menghapus
      path: '/'
    });

    // Log aktivitas logout (dalam implementasi nyata, simpan ke database)
    if (userInfo) {
      console.log(`User ${userInfo.username} (${userInfo.user_id}) logged out at ${new Date().toISOString()}`);
    }

    return NextResponse.json(
      createApiResponse(true, 'Logout berhasil'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      createApiResponse(false, 'Terjadi kesalahan saat logout'),
      { status: 500 }
    );
  }
}

// Method GET untuk mendapatkan informasi endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: 'POST /api/auth/logout',
    description: 'Endpoint untuk logout pengguna',
    note: 'Menghapus cookie auth-token dan mengakhiri session pengguna',
    example: 'POST /api/auth/logout (tidak memerlukan body)'
  });
}