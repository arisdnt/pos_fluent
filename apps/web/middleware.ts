// ======================================================================
// NEXT.JS MIDDLEWARE
// Middleware untuk autentikasi dan otorisasi di level aplikasi
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ======================================================================
// KONFIGURASI
// ======================================================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

// Mode bypass untuk testing (set BYPASS_AUTH=true di environment)
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development';

// Rute yang tidak memerlukan autentikasi
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js'
];

// Rute yang memerlukan autentikasi
const PROTECTED_ROUTES = [
  '/dashboard',
  '/pos',
  '/products',
  '/customers',
  '/transactions',
  '/reports',
  '/settings',
  '/users',
  '/api/pos',
  '/api/products',
  '/api/customers',
  '/api/transactions',
  '/api/reports',
  '/api/users'
];

// Rute yang memerlukan peran admin
const ADMIN_ROUTES = [
  '/users',
  '/settings/system',
  '/api/users',
  '/api/settings/system'
];

// ======================================================================
// TIPE DATA
// ======================================================================

interface TokenPayload {
  user_id: string;
  username: string;
  email?: string;
  full_name?: string;
  roles: string[];
  permissions: string[];
  branch_id?: string;
  company_id: string;
  iat: number;
  exp: number;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

/**
 * Memeriksa apakah rute adalah rute publik
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Memeriksa apakah rute adalah rute yang dilindungi
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Memeriksa apakah rute memerlukan peran admin
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Memverifikasi token JWT
 */
async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Membuat respons redirect ke login
 */
function redirectToLogin(request: NextRequest, reason?: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  
  // Tambahkan redirect parameter jika bukan halaman login
  if (request.nextUrl.pathname !== '/login') {
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  }
  
  // Tambahkan reason jika ada
  if (reason) {
    loginUrl.searchParams.set('reason', reason);
  }
  
  const response = NextResponse.redirect(loginUrl);
  
  // Hapus cookie autentikasi jika ada
  response.cookies.delete('auth-token');
  
  return response;
}

/**
 * Membuat respons unauthorized untuk API
 */
function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
        timestamp: new Date().toISOString()
      }
    },
    { status: 401 }
  );
}

/**
 * Membuat respons forbidden untuk API
 */
function createForbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
        timestamp: new Date().toISOString()
      }
    },
    { status: 403 }
  );
}

// ======================================================================
// MIDDLEWARE UTAMA
// ======================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');
  
  // BYPASS AUTENTIKASI UNTUK TESTING
  if (BYPASS_AUTH) {
    // Untuk API routes, tambahkan header user dummy
    if (isApiRoute && !isPublicRoute(pathname)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', 'test-user-001');
      requestHeaders.set('x-user-roles', JSON.stringify(['kasir', 'admin']));
      requestHeaders.set('x-user-permissions', JSON.stringify(['*']));
      requestHeaders.set('x-company-id', 'test-company-001');
      requestHeaders.set('x-branch-id', 'test-branch-001');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    
    // Redirect root ke dashboard tanpa autentikasi
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Skip semua pengecekan autentikasi
    return NextResponse.next();
  }
  
  // Skip middleware untuk rute publik
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Dapatkan token dari cookie atau header
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Jika tidak ada token dan rute dilindungi
  if (!token && isProtectedRoute(pathname)) {
    if (isApiRoute) {
      return createUnauthorizedResponse('Token autentikasi diperlukan');
    }
    return redirectToLogin(request, 'no-token');
  }
  
  // Verifikasi token jika ada
  if (token) {
    const payload = await verifyToken(token);
    
    // Token tidak valid
    if (!payload) {
      if (isApiRoute) {
        return createUnauthorizedResponse('Token tidak valid atau sudah kedaluwarsa');
      }
      return redirectToLogin(request, 'invalid-token');
    }
    
    // Token valid, periksa otorisasi untuk rute admin
    if (isAdminRoute(pathname)) {
      const hasAdminRole = payload.roles.includes('admin') || payload.roles.includes('super_admin');
      const hasAdminPermission = payload.permissions.some(p => 
        p.includes('admin') || p.includes('system') || p.includes('users.manage')
      );
      
      if (!hasAdminRole && !hasAdminPermission) {
        if (isApiRoute) {
          return createForbiddenResponse('Akses ditolak: Diperlukan peran administrator');
        }
        // Redirect ke dashboard dengan pesan error
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'access-denied');
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // Tambahkan header user info untuk API routes
    if (isApiRoute) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.user_id);
      requestHeaders.set('x-user-roles', JSON.stringify(payload.roles));
      requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));
      requestHeaders.set('x-company-id', payload.company_id);
      
      if (payload.branch_id) {
        requestHeaders.set('x-branch-id', payload.branch_id);
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    
    // Redirect ke dashboard jika user sudah login dan mengakses halaman login
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Redirect ke dashboard jika mengakses root
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// ======================================================================
// KONFIGURASI MATCHER
// ======================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};