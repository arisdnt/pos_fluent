// ======================================================================
// HALAMAN LOGIN - APLIKASI KASIR
// Halaman autentikasi untuk masuk ke sistem Point of Sale
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Spinner,
  Badge,
  Divider,
  Checkbox,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import {
  Building24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Person24Regular,
  LockClosed24Regular,
  Shield24Regular,
  Info24Regular,
  Warning24Regular,
  Checkmark24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ======================================================================
// VALIDATION SCHEMA
// ======================================================================

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username harus diisi')
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh mengandung huruf, angka, titik, underscore, dan dash'),
  password: z
    .string()
    .min(1, 'Password harus diisi')
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  remember_me: z.boolean().optional(),
  branch: z.string().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

// ======================================================================
// MOCK DATA
// ======================================================================

const mockBranches = [
  { id: '1', code: 'CAB001', name: 'Cabang Utama' },
  { id: '2', code: 'CAB002', name: 'Cabang Kedoya' },
  { id: '3', code: 'CAB003', name: 'Cabang Kelapa Gading' }
];

const mockUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
    branch: 'CAB001'
  },
  {
    username: 'kasir1',
    password: 'kasir123',
    name: 'Siti Nurhaliza',
    role: 'cashier',
    branch: 'CAB001'
  },
  {
    username: 'manager1',
    password: 'manager123',
    name: 'Budi Santoso',
    role: 'manager',
    branch: 'CAB001'
  }
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading, user } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Get redirect URL from search params
  const redirectTo = searchParams?.get('redirect') || '/';
  const sessionExpired = searchParams?.get('session') === 'expired';
  const loggedOut = searchParams?.get('logout') === 'true';

  // ======================================================================
  // FORM SETUP
  // ======================================================================

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember_me: false,
      branch: 'CAB001'
    },
    mode: 'onChange'
  });

  const watchedValues = watch();

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  // Show session expired message
  useEffect(() => {
    if (sessionExpired) {
      toast.error('Sesi Anda telah berakhir. Silakan masuk kembali.');
    }
  }, [sessionExpired]);

  // Show logout success message
  useEffect(() => {
    if (loggedOut) {
      toast.success('Anda telah berhasil keluar dari sistem.');
    }
  }, [loggedOut]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication - replace with actual API call
      const user = mockUsers.find(
        u => u.username === data.username && u.password === data.password
      );
      
      if (!user) {
        throw new Error('Username atau password salah');
      }
      
      // Mock login success
      setLoginSuccess(true);
      
      // Show success message
      toast.success(`Selamat datang, ${user.name}!`);
      
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call actual login function
      await login({
        username: data.username,
        password: data.password,
        remember_me: data.remember_me,
        branch_id: data.branch
      });
      
      // Redirect to dashboard or intended page
      router.replace(redirectTo);
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
      toast.error('Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast('Fitur reset password akan segera tersedia.');
  };

  const handleDemoLogin = (userType: 'admin' | 'cashier' | 'manager') => {
    const demoUser = mockUsers.find(u => u.role === userType);
    if (demoUser) {
      setValue('username', demoUser.username);
      setValue('password', demoUser.password);
      setValue('branch', demoUser.branch);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ======================================================================
  // LOADING STATE
  // ======================================================================

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Spinner size="large" />
          <Text>Memeriksa autentikasi...</Text>
        </div>
      </div>
    );
  }

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  // ======================================================================
  // RENDER
  // ======================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-600 rounded-full shadow-lg">
              <Building24Regular className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <Title1 className="text-gray-900">POS Kasir Suite</Title1>
            <Body1 className="text-gray-600 mt-2">
              Aplikasi Point of Sale untuk Kasir Indonesia
            </Body1>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader
            header={
              <div className="space-y-2">
                <Title2>Masuk ke Sistem</Title2>
                <Caption1 className="text-gray-600">
                  Silakan masukkan kredensial Anda untuk mengakses aplikasi kasir
                </Caption1>
              </div>
            }
          />
          
          <div className="p-6 space-y-6">
            {/* Session Messages */}
            {sessionExpired && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>Sesi Berakhir</MessageBarTitle>
                  Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.
                </MessageBarBody>
              </MessageBar>
            )}
            
            {loggedOut && (
              <MessageBar intent="success">
                <MessageBarBody>
                  <MessageBarTitle>Logout Berhasil</MessageBarTitle>
                  Anda telah berhasil keluar dari sistem.
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Login Error */}
            {loginError && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <MessageBarTitle>Login Gagal</MessageBarTitle>
                  {loginError}
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Login Success */}
            {loginSuccess && (
              <MessageBar intent="success">
                <MessageBarBody>
                  <MessageBarTitle>Login Berhasil</MessageBarTitle>
                  Mengalihkan ke dashboard...
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" required>
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username Anda"
                    contentBefore={<Person24Regular className="text-gray-500" />}
                    {...register('username')}
                    className={cn(
                      "w-full",
                      errors.username && "border-red-500"
                    )}
                    disabled={isLoading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {errors.username && (
                  <Text size={200} className="text-red-600">
                    {errors.username.message}
                  </Text>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password Anda"
                    contentBefore={<LockClosed24Regular className="text-gray-500" />}
                    contentAfter={
                      <Button
                        appearance="transparent"
                        icon={showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
                        onClick={togglePasswordVisibility}
                        type="button"
                        size="small"
                      />
                    }
                    {...register('password')}
                    className={cn(
                      "w-full",
                      errors.password && "border-red-500"
                    )}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <Text size={200} className="text-red-600">
                    {errors.password.message}
                  </Text>
                )}
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Cabang
                </Label>
                <select
                  id="branch"
                  {...register('branch')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  {mockBranches.map((branch) => (
                    <option key={branch.id} value={branch.code}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <Checkbox
                  {...register('remember_me')}
                  label="Ingat saya"
                  disabled={isLoading}
                />
                <Link
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Lupa password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                appearance="primary"
                size="large"
                className="w-full"
                disabled={isLoading || !isValid}
                icon={isLoading ? <Spinner size="tiny" /> : <Shield24Regular />}
              >
                {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="space-y-3">
              <Divider>Akun Demo</Divider>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  appearance="outline"
                  size="small"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Badge appearance="filled" color="danger" size="small">Admin</Badge>
                    <span>Administrator (admin/admin123)</span>
                  </div>
                </Button>
                <Button
                  appearance="outline"
                  size="small"
                  onClick={() => handleDemoLogin('cashier')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Badge appearance="filled" color="success" size="small">Kasir</Badge>
                    <span>Siti Nurhaliza (kasir1/kasir123)</span>
                  </div>
                </Button>
                <Button
                  appearance="outline"
                  size="small"
                  onClick={() => handleDemoLogin('manager')}
                  disabled={isLoading}
                  className="justify-start"
                >
                  <div className="flex items-center space-x-2">
                    <Badge appearance="filled" color="warning" size="small">Manager</Badge>
                    <span>Budi Santoso (manager1/manager123)</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info24Regular className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <Text size={200} weight="semibold" className="text-blue-900">
                    Keamanan Data
                  </Text>
                  <Text size={200} className="text-blue-700 mt-1">
                    Sistem ini menggunakan enkripsi SSL dan autentikasi berlapis untuk melindungi data Anda.
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <Caption1 className="text-gray-500">
            © 2024 POS Kasir Suite. Semua hak dilindungi.
          </Caption1>
          <div className="flex justify-center space-x-4">
            <Link className="text-xs text-gray-500 hover:text-gray-700">
              Bantuan
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-700">
              Kebijakan Privasi
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-700">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}