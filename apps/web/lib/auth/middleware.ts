// ======================================================================
// MIDDLEWARE AUTENTIKASI DAN AUTORISASI
// Middleware untuk memverifikasi token JWT dan mengecek permissions
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// ======================================================================
// TIPE DATA
// ======================================================================

export interface UserRole {
  role_id: string;
  role_name: string;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  permissions: string[];
}

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  permissions: string[];
  current_branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface TokenPayload {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}

// ======================================================================
// KONFIGURASI RUTE
// ======================================================================

// Rute yang tidak memerlukan autentikasi
export const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/health',
  '/login',
  '/register',
  '/forgot-password'
];

// Rute yang memerlukan autentikasi tapi tidak perlu permission khusus
export const PROTECTED_ROUTES = [
  '/api/auth/me',
  '/api/auth/logout',
  '/dashboard',
  '/profile'
];

// Mapping permission untuk rute API
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Products
  'GET:/api/products': ['products.read'],
  'POST:/api/products': ['products.create'],
  'PUT:/api/products': ['products.update'],
  'DELETE:/api/products': ['products.delete'],
  
  // Transactions
  'GET:/api/transactions': ['transactions.read'],
  'POST:/api/transactions': ['transactions.create'],
  'PUT:/api/transactions': ['transactions.update'],
  'DELETE:/api/transactions': ['transactions.delete'],
  
  // Customers
  'GET:/api/customers': ['customers.read'],
  'POST:/api/customers': ['customers.create'],
  'PUT:/api/customers': ['customers.update'],
  'DELETE:/api/customers': ['customers.delete'],
  
  // Reports
  'GET:/api/reports': ['reports.read'],
  'POST:/api/reports/export': ['reports.export'],
  
  // Users (Admin only)
  'GET:/api/users': ['users.read'],
  'POST:/api/users': ['users.create'],
  'PUT:/api/users': ['users.update'],
  'DELETE:/api/users': ['users.delete'],
  
  // Settings
  'GET:/api/settings': ['settings.read'],
  'PUT:/api/settings': ['settings.update'],
  
  // Shifts
  'GET:/api/shifts': ['shifts.read'],
  'POST:/api/shifts': ['shifts.create'],
  'PUT:/api/shifts': ['shifts.update']
};

// ======================================================================
// FUNGSI UTILITAS
// ======================================================================

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'kasir-secret-key'
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function getAllPermissions(roles: UserRole[]): string[] {
  const permissions = new Set<string>();
  roles.forEach(role => {
    role.permissions.forEach(permission => permissions.add(permission));
  });
  return Array.from(permissions);
}

export function hasPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  // Jika user adalah super admin, berikan akses ke semua
  if (userPermissions.includes('*') || userPermissions.includes('admin.*')) {
    return true;
  }
  
  // Cek apakah user memiliki salah satu permission yang diperlukan
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes('*')) {
      const baseRoute = route.replace('*', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.includes('*')) {
      const baseRoute = route.replace('*', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

export function getRequiredPermissions(method: string, pathname: string): string[] {
  const key = `${method}:${pathname}`;
  
  // Cek exact match dulu
  if (ROUTE_PERMISSIONS[key]) {
    return ROUTE_PERMISSIONS[key];
  }
  
  // Cek pattern match untuk dynamic routes
  for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    const [routeMethod, routePath] = routePattern.split(':');
    
    if (method === routeMethod) {
      // Handle dynamic routes seperti /api/products/[id]
      const pathRegex = routePath.replace(/\[\w+\]/g, '[^/]+');
      const regex = new RegExp(`^${pathRegex}$`);
      
      if (regex.test(pathname)) {
        return permissions;
      }
    }
  }
  
  return [];
}

// ======================================================================
// FUNGSI AUTENTIKASI UTAMA
// ======================================================================

export async function authenticate(request: NextRequest): Promise<AuthResult> {
  try {
    // Ambil token dari cookie
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: 'Token tidak ditemukan',
        status: 401
      };
    }
    
    // Verifikasi token
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return {
        success: false,
        error: 'Token tidak valid atau expired',
        status: 401
      };
    }
    
    // Buat object user
    const allPermissions = getAllPermissions(tokenPayload.roles);
    const currentBranch = tokenPayload.roles.length > 0 ? {
      id: tokenPayload.roles[0].branch_id,
      name: tokenPayload.roles[0].branch_name,
      code: tokenPayload.roles[0].branch_code
    } : undefined;
    
    const user: AuthUser = {
      user_id: tokenPayload.user_id,
      username: tokenPayload.username,
      email: tokenPayload.email,
      full_name: tokenPayload.full_name,
      roles: tokenPayload.roles,
      permissions: allPermissions,
      current_branch: currentBranch
    };
    
    return {
      success: true,
      user
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat autentikasi',
      status: 500
    };
  }
}

export async function authorize(
  request: NextRequest, 
  requiredPermissions: string[] = []
): Promise<AuthResult> {
  // Autentikasi dulu
  const authResult = await authenticate(request);
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  // Jika tidak ada permission yang diperlukan, return success
  if (requiredPermissions.length === 0) {
    return authResult;
  }
  
  // Cek permission
  const hasAccess = hasPermission(authResult.user.permissions, requiredPermissions);
  if (!hasAccess) {
    return {
      success: false,
      error: 'Tidak memiliki izin untuk mengakses resource ini',
      status: 403
    };
  }
  
  return authResult;
}

// ======================================================================
// MIDDLEWARE WRAPPER
// ======================================================================

export function withAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authorize(request, requiredPermissions);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || 'Unauthorized',
          timestamp: new Date().toISOString()
        },
        { status: authResult.status || 401 }
      );
    }
    
    return handler(request, authResult.user);
  };
}

// ======================================================================
// HELPER UNTUK RESPONSE
// ======================================================================

export function createUnauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    {
      success: false,
      message,
      timestamp: new Date().toISOString()
    },
    { status: 401 }
  );
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json(
    {
      success: false,
      message,
      timestamp: new Date().toISOString()
    },
    { status: 403 }
  );
}