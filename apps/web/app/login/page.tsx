// ======================================================================
// HALAMAN LOGIN
// Interface untuk autentikasi pengguna
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardPreview,
  Input,
  Button,
  Text,
  Title1,
  Body1,
  Checkbox,
  Field,
  Spinner,
  MessageBar,
  MessageBarBody,
  Image,
  Divider
} from '@fluentui/react-components';
import {
  Eye24Regular,
  EyeOff24Regular,
  Person24Regular,
  LockClosed24Regular,
  Building24Regular,
  Warning24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TIPE DATA
// ======================================================================

interface LoginForm {
  username: string;
  password: string;
  remember_me: boolean;
  branch_id?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

// ======================================================================
// DATA MOCK
// ======================================================================

const mockBranches: Branch[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    name: 'Toko Pusat',
    code: 'TP001'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Cabang Mall',
    code: 'CM001'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    name: 'Cabang Plaza',
    code: 'CP001'
  }
];

// ======================================================================
// KOMPONEN UTAMA
// ======================================================================

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: '',
    remember_me: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Clear error saat component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleInputChange = (field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error untuk field yang sedang diubah
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!form.username.trim()) {
      errors.username = 'Username atau email wajib diisi';
    }
    
    if (!form.password.trim()) {
      errors.password = 'Password wajib diisi';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await login(form);
      if (success) {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (username: string) => {
    setForm({
      username,
      password: 'password',
      remember_me: false
    });
    
    setIsSubmitting(true);
    
    try {
      const success = await login({
        username,
        password: 'password',
        remember_me: false
      });
      if (success) {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ======================================================================
  // RENDER
  // ======================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          {/* Header */}
          <CardPreview>
            <div className="flex flex-col items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                <Building24Regular className="text-blue-600" style={{ fontSize: '32px' }} />
              </div>
              <Title1 className="text-white text-center">POS Suite</Title1>
              <Body1 className="text-blue-100 text-center mt-2">
                Sistem Kasir Terpadu
              </Body1>
            </div>
          </CardPreview>

          <CardHeader>
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>
                    <div className="flex items-center gap-2">
                      <Warning24Regular />
                      {error}
                    </div>
                  </MessageBarBody>
                </MessageBar>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <Field
                  label="Username atau Email"
                  validationMessage={validationErrors.username}
                  validationState={validationErrors.username ? 'error' : 'none'}
                >
                  <Input
                    contentBefore={<Person24Regular />}
                    placeholder="Masukkan username atau email"
                    value={form.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </Field>

                {/* Password Field */}
                <Field
                  label="Password"
                  validationMessage={validationErrors.password}
                  validationState={validationErrors.password ? 'error' : 'none'}
                >
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    contentBefore={<LockClosed24Regular />}
                    contentAfter={
                      <Button
                        appearance="transparent"
                        icon={showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                        size="small"
                      />
                    }
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                </Field>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <Checkbox
                    label="Ingat saya"
                    checked={form.remember_me}
                    onChange={(e, data) => handleInputChange('remember_me', data.checked || false)}
                    disabled={isSubmitting}
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => router.push('/forgot-password')}
                    disabled={isSubmitting}
                  >
                    Lupa password?
                  </Button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  appearance="primary"
                  size="large"
                  disabled={isSubmitting || !form.username || !form.password}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="tiny" />
                      <span className="ml-2">Masuk...</span>
                    </>
                  ) : (
                    'Masuk'
                  )}
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
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Login sebagai Admin
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => handleDemoLogin('kasir1')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Login sebagai Kasir
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => handleDemoLogin('manager1')}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Login sebagai Manager
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <Text size={200} className="text-gray-500">
                  © 2024 POS Suite. Semua hak dilindungi.
                </Text>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}