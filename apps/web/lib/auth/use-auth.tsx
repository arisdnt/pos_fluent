// ======================================================================
// AUTHENTICATION HOOK
// Hook untuk mengelola autentikasi pengguna dan session management
// ======================================================================

'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthUser extends User {
  roles: UserRole[];
  permissions: string[];
  current_branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
  branch_id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  switchBranch: (branchId: string) => Promise<boolean>;
  clearError: () => void;
}

// ======================================================================
// CONTEXT
// ======================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ======================================================================
// HOOK UTAMA
// ======================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ======================================================================
// PROVIDER COMPONENT
// ======================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });
  
  const router = useRouter();

  // ======================================================================
  // FUNGSI UTILITAS
  // ======================================================================

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setUser = useCallback((user: AuthUser | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null
    }));
  }, []);

  // ======================================================================
  // API CALLS
  // ======================================================================

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      if (data.success && data.data) {
        const authUser: AuthUser = {
          ...data.data.user,
          roles: data.data.roles,
          permissions: data.data.roles.flatMap((role: UserRole) => role.permissions),
          current_branch: data.data.roles.length > 0 ? {
            id: data.data.roles[0].branch_id,
            name: data.data.roles[0].branch_name,
            code: data.data.roles[0].branch_code
          } : undefined
        };

        setUser(authUser);
        toast.success('Login berhasil!');
        return true;
      }

      throw new Error(data.message || 'Login gagal');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
      toast.success('Logout berhasil');
      router.push('/login');

    } catch (error) {
      console.error('Logout error:', error);
      // Tetap logout meskipun ada error
      setUser(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, router]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired atau tidak valid
          setUser(null);
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Gagal memuat profil');
      }

      if (data.success && data.data) {
        const authUser: AuthUser = {
          ...data.data.user,
          roles: data.data.roles,
          permissions: data.data.permissions,
          current_branch: data.data.current_branch
        };

        setUser(authUser);
      }

    } catch (error) {
      console.error('Refresh user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat profil';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser, router]);

  const switchBranch = useCallback(async (branchId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Dalam implementasi nyata, ini akan memanggil API untuk switch branch
      // dan mendapatkan token baru dengan context branch yang berbeda
      
      // Untuk sekarang, kita simulasikan dengan refresh user
      await refreshUser();
      
      toast.success('Berhasil pindah cabang');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal pindah cabang';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, refreshUser]);

  // ======================================================================
  // PERMISSION HELPERS
  // ======================================================================

  const hasPermission = useCallback((permission: string | string[]): boolean => {
    if (!state.user) return false;
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    const userPermissions = state.user.permissions;
    
    // Super admin memiliki semua permission
    if (userPermissions.includes('*') || userPermissions.includes('admin.*')) {
      return true;
    }
    
    // Cek apakah user memiliki salah satu permission yang diperlukan
    return permissions.some(perm => userPermissions.includes(perm));
  }, [state.user]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!state.user) return false;
    
    return state.user.roles.some(role => 
      role.role_name.toLowerCase() === roleName.toLowerCase()
    );
  }, [state.user]);

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Auto-refresh user saat component mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Auto-refresh user setiap 30 menit untuk memastikan session masih valid
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isAuthenticated) {
        refreshUser();
      }
    }, 30 * 60 * 1000); // 30 menit

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshUser]);

  // ======================================================================
  // CONTEXT VALUE
  // ======================================================================

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
    switchBranch,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ======================================================================
// HELPER HOOKS
// ======================================================================

// Hook untuk mendapatkan user saat ini
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

// Hook untuk cek permission
export function usePermission(permission: string | string[]): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook untuk cek role
export function useRole(roleName: string): boolean {
  const { hasRole } = useAuth();
  return hasRole(roleName);
}

// Hook untuk mendapatkan cabang saat ini
export function useCurrentBranch() {
  const { user } = useAuth();
  return user?.current_branch || null;
}