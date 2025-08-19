// ======================================================================
// LAYOUT UTAMA APLIKASI KASIR
// Komponen layout yang digunakan di seluruh aplikasi
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Button,
  Text,
  Title3,
  Caption1,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  Home24Regular,
  Cart24Regular,
  Box24Regular,
  People24Regular,
  DocumentTable24Regular,
  Settings24Regular,
  SignOut24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ChevronDown24Regular,
  Menu24Regular,
  Navigation24Regular,
  Building24Regular,
  Receipt24Regular,
  Calculator24Regular,
  ChartMultiple24Regular,
  Database24Regular,
  Person24Regular,
  Key24Regular,
  Print24Regular,
  Archive24Regular,
  Info24Regular,
  Warning24Filled,
  CheckmarkCircle24Filled,
  Dismiss24Regular,
  QuestionCircle24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useKeyboard } from '@/lib/keyboard/keyboard-provider';
import toast from 'react-hot-toast';

// ======================================================================
// TYPES
// ======================================================================

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  children?: NavigationItem[];
  permission?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

// ======================================================================
// NAVIGATION ITEMS
// ======================================================================

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home24Regular />,
    href: '/'
  },
  {
    id: 'pos',
    label: 'Kasir (POS)',
    icon: <Cart24Regular />,
    href: '/pos',
    badge: 'F1'
  },
  {
    id: 'products',
    label: 'Produk',
    icon: <Box24Regular />,
    href: '/products',
    children: [
      {
        id: 'products-list',
        label: 'Daftar Produk',
        icon: <Box24Regular />,
        href: '/products'
      },
      {
        id: 'products-categories',
        label: 'Kategori',
        icon: <Navigation24Regular />,
        href: '/products/categories'
      },
      {
        id: 'products-brands',
        label: 'Merek',
        icon: <Building24Regular />,
        href: '/products/brands'
      }
    ]
  },
  {
    id: 'customers',
    label: 'Pelanggan',
    icon: <People24Regular />,
    href: '/customers'
  },
  {
    id: 'transactions',
    label: 'Transaksi',
    icon: <Receipt24Regular />,
    href: '/transactions',
    children: [
      {
        id: 'transactions-list',
        label: 'Daftar Transaksi',
        icon: <Receipt24Regular />,
        href: '/transactions'
      },
      {
        id: 'transactions-returns',
        label: 'Retur',
        icon: <Dismiss24Regular />,
        href: '/transactions/returns'
      }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventori',
    icon: <Database24Regular />,
    href: '/inventory',
    children: [
      {
        id: 'inventory-stock',
        label: 'Stok',
        icon: <Database24Regular />,
        href: '/inventory/stock'
      },
      {
        id: 'inventory-adjustments',
        label: 'Penyesuaian Stok',
        icon: <Calculator24Regular />,
        href: '/inventory/adjustments'
      }
    ]
  },
  {
    id: 'reports',
    label: 'Laporan',
    icon: <DocumentTable24Regular />,
    href: '/reports',
    children: [
      {
        id: 'reports-sales',
        label: 'Laporan Penjualan',
        icon: <ChartMultiple24Regular />,
        href: '/reports/sales'
      },
      {
        id: 'reports-products',
        label: 'Laporan Produk',
        icon: <Box24Regular />,
        href: '/reports/products'
      },
      {
        id: 'reports-inventory',
        label: 'Laporan Inventori',
        icon: <Database24Regular />,
        href: '/reports/inventory'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    icon: <Settings24Regular />,
    href: '/settings',
    children: [
      {
        id: 'settings-general',
        label: 'Umum',
        icon: <Settings24Regular />,
        href: '/settings/general'
      },
      {
        id: 'settings-users',
        label: 'Pengguna',
        icon: <Person24Regular />,
        href: '/settings/users',
        permission: 'manage_users'
      },
      {
        id: 'settings-roles',
        label: 'Peran & Izin',
        icon: <Key24Regular />,
        href: '/settings/roles',
        permission: 'manage_roles'
      },
      {
        id: 'settings-printer',
        label: 'Printer',
        icon: <Print24Regular />,
        href: '/settings/printer'
      },
      {
        id: 'settings-backup',
        label: 'Backup & Restore',
        icon: <Archive24Regular />,
        href: '/settings/backup',
        permission: 'manage_backup'
      }
    ]
  }
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function MainLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton = false,
  backHref = '/'
}: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { showHelp, registerAction, unregisterAction } = useKeyboard();
  

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Check connection status
  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Register navigation actions
  useEffect(() => {
    // Register navigation actions
    registerAction('navigate-dashboard', () => router.push('/'));
    registerAction('navigate-pos', () => router.push('/pos'));
    registerAction('navigate-products', () => router.push('/products'));
    registerAction('navigate-customers', () => router.push('/customers'));
    registerAction('navigate-inventory', () => router.push('/inventory'));
    registerAction('navigate-reports', () => router.push('/reports'));
    registerAction('navigate-orders', () => router.push('/orders'));
    registerAction('navigate-settings', () => router.push('/settings'));
    registerAction('logout', () => setShowLogoutDialog(true));
    registerAction('refresh-page', () => window.location.reload());

    return () => {
      unregisterAction('navigate-dashboard');
      unregisterAction('navigate-pos');
      unregisterAction('navigate-products');
      unregisterAction('navigate-customers');
      unregisterAction('navigate-inventory');
      unregisterAction('navigate-reports');
      unregisterAction('navigate-orders');
      unregisterAction('navigate-settings');
      unregisterAction('logout');
      unregisterAction('refresh-page');
    };
  }, [router, registerAction, unregisterAction]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Berhasil keluar dari sistem');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal keluar dari sistem');
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isActiveRoute(item.href);
    const hasChildren = item.children && item.children.length > 0;
    
    // Check permission
    if (item.permission && !user?.permissions?.includes(item.permission)) {
      return null;
    }

    if (hasChildren) {
      // Render dropdown menu for items with children
      return (
        <Menu key={item.id}>
          <MenuTrigger>
            <Button
              appearance={isActive ? 'primary' : 'subtle'}
              className="flex items-center space-x-1 px-3 py-2 text-sm"
            >
              {item.icon}
              <span className="hidden xl:inline">{item.label}</span>
              <ChevronDown24Regular className="w-3 h-3" />
              {item.badge && (
                <Badge size="small" appearance="outline">
                  {item.badge}
                </Badge>
              )}
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {/* Main item */}
              <MenuItem
                icon={item.icon}
                onClick={() => router.push(item.href)}
              >
                {item.label}
              </MenuItem>
              {/* Children items */}
              {item.children!.map(child => {
                if (child.permission && !user?.permissions?.includes(child.permission)) {
                  return null;
                }
                return (
                  <MenuItem
                    key={child.id}
                    icon={child.icon}
                    onClick={() => router.push(child.href)}
                  >
                    {child.label}
                  </MenuItem>
                );
              })}
            </MenuList>
          </MenuPopover>
        </Menu>
      );
    } else {
      // Render simple button for items without children
      return (
        <Button
          key={item.id}
          appearance={isActive ? 'primary' : 'subtle'}
          className="flex items-center space-x-1 px-3 py-2 text-sm"
          onClick={() => router.push(item.href)}
        >
          {item.icon}
          <span className="hidden xl:inline">{item.label}</span>
          {item.badge && (
            <Badge size="small" appearance="outline">
              {item.badge}
            </Badge>
          )}
        </Button>
      );
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Title3 className="text-blue-600">KasirPro</Title3>
              <Caption1 className="text-gray-600 hidden md:block">Sistem Kasir Modern</Caption1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map(item => renderNavigationItem(item))}
            </nav>
            
            {/* Mobile Menu Button */}
            <Menu>
              <MenuTrigger>
                <Button
                  appearance="subtle"
                  icon={<Menu24Regular />}
                  className="lg:hidden"
                  aria-label="Menu"
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {navigationItems.map(item => {
                    if (item.permission && !user?.permissions?.includes(item.permission)) {
                      return null;
                    }
                    
                    if (item.children && item.children.length > 0) {
                      return (
                        <div key={item.id}>
                          <MenuItem
                            icon={item.icon}
                            onClick={() => router.push(item.href)}
                          >
                            {item.label}
                            {item.badge && (
                              <Badge size="small" appearance="outline" className="ml-2">
                                {item.badge}
                              </Badge>
                            )}
                          </MenuItem>
                          {item.children.map(child => {
                            if (child.permission && !user?.permissions?.includes(child.permission)) {
                              return null;
                            }
                            return (
                              <MenuItem
                                key={child.id}
                                icon={child.icon}
                                onClick={() => router.push(child.href)}
                                className="pl-8"
                              >
                                {child.label}
                              </MenuItem>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return (
                        <MenuItem
                          key={item.id}
                          icon={item.icon}
                          onClick={() => router.push(item.href)}
                        >
                          {item.label}
                          {item.badge && (
                            <Badge size="small" appearance="outline" className="ml-2">
                              {item.badge}
                            </Badge>
                          )}
                        </MenuItem>
                      );
                    }
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
          
          {/* Right: Status and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              <Caption1 className="text-gray-600 hidden md:block">
                {connectionStatus === 'online' ? 'Online' : 'Offline'}
              </Caption1>
            </div>
            
            {/* Current Time */}
            <Caption1 className="text-gray-600 font-mono hidden lg:block">
              {formatDateTime(currentTime, 'HH:mm:ss')}
            </Caption1>
            
            {/* User Menu */}
            <Menu>
              <MenuTrigger>
                <Button
                  appearance="subtle"
                  className="flex items-center space-x-2"
                >
                  <Avatar name={user?.full_name} size={28} />
                  <div className="text-left hidden md:block">
                    <Text weight="semibold" className="block text-sm">{user?.full_name}</Text>
                    <Caption1 className="text-gray-600">{user?.roles?.[0]?.role_name}</Caption1>
                  </div>
                  <ChevronDown24Regular className="text-gray-500" />
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={<Person24Regular />}
                    onClick={() => router.push('/profile')}
                  >
                    Profil Saya
                  </MenuItem>
                  <MenuItem
                    icon={<Settings24Regular />}
                    onClick={() => router.push('/settings')}
                  >
                    Pengaturan
                  </MenuItem>
                  <MenuItem
                    icon={<QuestionCircle24Regular />}
                    onClick={showHelp}
                  >
                    Bantuan & Shortcuts (F1)
                  </MenuItem>
                  <MenuItem
                    icon={<Info24Regular />}
                    onClick={() => toast('KasirPro v1.0.0 - Sistem Kasir Modern')}
                  >
                    Tentang Aplikasi
                  </MenuItem>
                  <MenuItem
                    icon={<SignOut24Regular />}
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    Keluar (Ctrl+Shift+L)
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        {(title || subtitle || showBackButton || actions) && (
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <Button
                    appearance="subtle"
                    icon={<ChevronLeft24Regular />}
                    onClick={() => router.push(backHref)}
                  >
                    Kembali
                  </Button>
                )}
                
                <div>
                  {title && <Title3>{title}</Title3>}
                  {subtitle && (
                    <Caption1 className="text-gray-600">{subtitle}</Caption1>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Status Bar */}
        {connectionStatus === 'offline' && (
          <MessageBar intent="warning">
            <MessageBarBody>
              <Warning24Filled className="mr-2" />
              Koneksi terputus. Beberapa fitur mungkin tidak tersedia.
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={(_, data) => setShowLogoutDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogContent>
              <Text>
                Apakah Anda yakin ingin keluar dari sistem?
              </Text>
              <Text className="text-gray-600 mt-2">
                Pastikan semua transaksi telah disimpan sebelum keluar.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowLogoutDialog(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handleLogout}
                icon={<SignOut24Regular />}
              >
                Ya, Keluar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

// ======================================================================
// UTILITY COMPONENTS
// ======================================================================

// Page wrapper with common layout
export function PageLayout({
  title,
  subtitle,
  actions,
  showBackButton,
  backHref,
  children
}: MainLayoutProps) {
  return (
    <MainLayout
      title={title}
      subtitle={subtitle}
      actions={actions}
      showBackButton={showBackButton}
      backHref={backHref}
    >
      <div className="p-6">
        {children}
      </div>
    </MainLayout>
  );
}

// Full-width layout (for POS, etc.)
export function FullLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

// Export MainLayout as named export for backward compatibility
export { MainLayout };