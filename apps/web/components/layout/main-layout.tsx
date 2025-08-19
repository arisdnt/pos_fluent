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
  MenuDivider,
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
  ShoppingCart24Regular,
  Box24Regular,
  People24Regular,
  DocumentTable24Regular,
  Settings24Regular,
  SignOut24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Navigation24Regular,
  Store24Regular,
  Receipt24Regular,
  Calculator24Regular,
  ChartMultiple24Regular,
  Database24Regular,
  Person24Regular,
  Key24Regular,
  Print24Regular,
  Backup24Regular,
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
    icon: <ShoppingCart24Regular />,
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
        icon: <Store24Regular />,
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
        icon: <Backup24Regular />,
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
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('online');

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
    registerAction('toggle-sidebar', () => setSidebarCollapsed(!sidebarCollapsed));
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
      unregisterAction('toggle-sidebar');
      unregisterAction('logout');
      unregisterAction('refresh-page');
    };
  }, [router, registerAction, unregisterAction, sidebarCollapsed]);

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

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = isActiveRoute(item.href);
    const hasChildren = item.children && item.children.length > 0;
    
    // Check permission
    if (item.permission && !user?.permissions?.includes(item.permission)) {
      return null;
    }

    return (
      <div key={item.id}>
        <Button
          appearance={isActive ? 'primary' : 'subtle'}
          className={cn(
            'w-full justify-start mb-1',
            level > 0 && 'ml-4',
            sidebarCollapsed && 'justify-center'
          )}
          icon={item.icon}
          onClick={() => {
            if (!hasChildren) {
              router.push(item.href);
            }
          }}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between w-full">
              <span>{item.label}</span>
              {item.badge && (
                <Badge size="small" appearance="outline">
                  {item.badge}
                </Badge>
              )}
            </div>
          )}
        </Button>
        
        {/* Render children if expanded and has children */}
        {hasChildren && !sidebarCollapsed && (
          <div className="ml-2">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <Title3 className="text-blue-600">KasirPro</Title3>
                <Caption1 className="text-gray-600">Sistem Kasir Modern</Caption1>
              </div>
            )}
            <Button
              appearance="subtle"
              icon={sidebarCollapsed ? <ChevronRight24Regular /> : <ChevronLeft24Regular />}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              size="small"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto p-4">
          <nav className="space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          {!sidebarCollapsed && (
            <div className="space-y-2">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  connectionStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                )}></div>
                <Caption1 className="text-gray-600">
                  {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </Caption1>
              </div>
              
              {/* Current Time */}
              <Caption1 className="text-gray-600">
                {formatDateTime(currentTime, 'EEEE, dd MMM yyyy')}
              </Caption1>
              <Caption1 className="text-gray-600 font-mono">
                {formatDateTime(currentTime, 'HH:mm:ss')}
              </Caption1>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
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
            
            <div className="flex items-center space-x-4">
              {/* Actions */}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
              
              {/* User Menu */}
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    appearance="subtle"
                    className="flex items-center space-x-2"
                  >
                    <Avatar name={user?.name} size={32} />
                    <div className="text-left hidden md:block">
                      <Text weight="semibold" className="block">{user?.name}</Text>
                      <Caption1 className="text-gray-600">{user?.role}</Caption1>
                    </div>
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
                    <MenuDivider />
                    <MenuItem
                      icon={<Info24Regular />}
                      onClick={() => toast.info('KasirPro v1.0.0 - Sistem Kasir Modern')}
                    >
                      Tentang Aplikasi
                    </MenuItem>
                    <MenuDivider />
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