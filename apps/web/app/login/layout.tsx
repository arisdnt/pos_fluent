// ======================================================================
// LAYOUT AUTENTIKASI
// Layout khusus untuk halaman login dan autentikasi
// ======================================================================

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - POS Suite',
  description: 'Masuk ke sistem kasir POS Suite',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
}