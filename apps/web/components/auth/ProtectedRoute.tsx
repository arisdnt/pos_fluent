// ======================================================================
// KOMPONEN: PROTECTED ROUTE
// Komponen untuk melindungi halaman yang memerlukan autentikasi
// ======================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import {
  Spinner,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Button,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  Shield24Regular,
  Warning24Regular,
  ArrowLeft24Regular
} from '@fluentui/react-icons';

// ======================================================================
// TIPE DATA
// ======================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallbackPath?: string;
  showFallback?: boolean;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

// ======================================================================
// KOMPONEN LOADING
// ======================================================================

function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-96">
        <CardHeader
          header={
            <div className="flex items-center gap-3">
              <Spinner size="small" />
              <Text weight="semibold">Memuat...</Text>
            </div>
          }
          description="Sedang memverifikasi autentikasi"
        />
      </Card>
    </div>
  );
}

// ======================================================================
// KOMPONEN UNAUTHORIZED
// ======================================================================

function DefaultUnauthorizedComponent({ 
  message, 
  onGoBack 
}: { 
  message: string;
  onGoBack: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-96">
        <CardPreview>
          <div className="flex justify-center p-6">
            <Shield24Regular className="text-red-500" style={{ fontSize: '48px' }} />
          </div>
        </CardPreview>
        <CardHeader
          header={
            <Text size={500} weight="semibold" className="text-center">
              Akses Ditolak
            </Text>
          }
          description={
            <div className="space-y-4">
              <Text className="text-center text-gray-600">
                {message}
              </Text>
              <div className="flex justify-center">
                <Button
                  appearance="primary"
                  icon={<ArrowLeft24Regular />}
                  onClick={onGoBack}
                >
                  Kembali
                </Button>
              </div>
            </div>
          }
        />
      </Card>
    </div>
  );
}

// ======================================================================
// KOMPONEN UTAMA
// ======================================================================

function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackPath = '/login',
  showFallback = true,
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    error
  } = useAuth();
  
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>('');

  // ======================================================================
  // EFFECTS
  // ======================================================================

  useEffect(() => {
    // Jika masih loading, tunggu
    if (isLoading) {
      return;
    }

    // Jika tidak terautentikasi
    if (!isAuthenticated || !user) {
      if (showFallback) {
        setAccessDeniedReason('Anda harus login terlebih dahulu untuk mengakses halaman ini.');
      } else {
        setShouldRedirect(true);
      }
      return;
    }

    // Cek required roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        const roleList = requiredRoles.join(', ');
        setAccessDeniedReason(
          `Anda memerlukan salah satu peran berikut untuk mengakses halaman ini: ${roleList}`
        );
        return;
      }
    }

    // Cek required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = hasPermission(requiredPermissions);
      if (!hasRequiredPermission) {
        const permissionList = requiredPermissions.join(', ');
        setAccessDeniedReason(
          `Anda tidak memiliki izin yang diperlukan untuk mengakses halaman ini. Izin yang diperlukan: ${permissionList}`
        );
        return;
      }
    }

    // Jika semua cek berhasil, clear access denied reason
    setAccessDeniedReason('');
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredPermissions,
    requiredRoles,
    hasPermission,
    hasRole,
    showFallback
  ]);

  // Redirect jika diperlukan
  useEffect(() => {
    if (shouldRedirect) {
      router.push(fallbackPath);
    }
  }, [shouldRedirect, router, fallbackPath]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  // ======================================================================
  // RENDER CONDITIONS
  // ======================================================================

  // Tampilkan loading
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Tampilkan error jika ada
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader
            header={
              <div className="flex items-center gap-3">
                <Warning24Regular className="text-red-500" />
                <Text weight="semibold">Terjadi Kesalahan</Text>
              </div>
            }
            description={
              <div className="space-y-4">
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
                <div className="flex justify-center">
                  <Button
                    appearance="primary"
                    onClick={() => window.location.reload()}
                  >
                    Muat Ulang
                  </Button>
                </div>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  // Jika harus redirect dan tidak menampilkan fallback
  if (shouldRedirect && !showFallback) {
    return null;
  }

  // Tampilkan unauthorized jika ada alasan akses ditolak
  if (accessDeniedReason) {
    return (
      unauthorizedComponent || 
      <DefaultUnauthorizedComponent 
        message={accessDeniedReason}
        onGoBack={handleGoBack}
      />
    );
  }

  // Jika semua cek berhasil, tampilkan children
  return <>{children}</>;
}

// Export default dan named export
export default ProtectedRoute;
export { ProtectedRoute };

// ======================================================================
// KOMPONEN HELPER
// ======================================================================

// Komponen untuk melindungi berdasarkan permission saja
export function PermissionGuard({
  permissions,
  children,
  fallback
}: {
  permissions: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  if (!hasPermission(permissionArray)) {
    return fallback || (
      <MessageBar intent="warning">
        <MessageBarBody>
          Anda tidak memiliki izin untuk melihat konten ini.
        </MessageBarBody>
      </MessageBar>
    );
  }
  
  return <>{children}</>;
}

// Komponen untuk melindungi berdasarkan role saja
export function RoleGuard({
  roles,
  children,
  fallback
}: {
  roles: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole } = useAuth();
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  const hasRequiredRole = roleArray.some(role => hasRole(role));
  
  if (!hasRequiredRole) {
    return fallback || (
      <MessageBar intent="warning">
        <MessageBarBody>
          Anda tidak memiliki peran yang diperlukan untuk melihat konten ini.
        </MessageBarBody>
      </MessageBar>
    );
  }
  
  return <>{children}</>;
}