// ======================================================================
// HALAMAN UTAMA - APLIKASI KASIR
// Landing page dan dashboard utama aplikasi Point of Sale
// ======================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title2,
  Title3,
  Body1,
  Caption1,
  Spinner,
  Badge,
  Avatar,
  Divider,
  ProgressBar
} from '@fluentui/react-components';
import {
  ShoppingCart24Regular,
  Box24Regular,
  People24Regular,
  DocumentText24Regular,
  Settings24Regular,
  ChartLine24Regular,
  Store24Regular,
  Receipt24Regular,
  Scanner24Regular,
  CashDrawer24Regular,
  ArrowRight24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Info24Filled
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayCustomers: number;
  lowStockItems: number;
  activeUsers: number;
  openSessions: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  shortcut?: string;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'return' | 'stock' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  amount?: number;
  status: 'success' | 'warning' | 'error' | 'info';
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API calls - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API data
        setStats({
          todaySales: 15750000,
          todayTransactions: 127,
          todayCustomers: 89,
          lowStockItems: 5,
          activeUsers: 3,
          openSessions: 2
        });
        
        setRecentActivities([
          {
            id: '1',
            type: 'sale',
            title: 'Penjualan Baru',
            description: 'Transaksi #TRX-2024-001234 - Rp 125.000',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            amount: 125000,
            status: 'success'
          },
          {
            id: '2',
            type: 'stock',
            title: 'Stok Menipis',
            description: 'Produk "Kopi Arabica 250g" tersisa 3 unit',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            status: 'warning'
          },
          {
            id: '3',
            type: 'sale',
            title: 'Pembayaran Tunai',
            description: 'Transaksi #TRX-2024-001233 - Rp 89.500',
            timestamp: new Date(Date.now() - 25 * 60 * 1000),
            amount: 89500,
            status: 'success'
          },
          {
            id: '4',
            type: 'user',
            title: 'Login Kasir',
            description: 'Siti Nurhaliza masuk ke sistem',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            status: 'info'
          }
        ]);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // ======================================================================
  // QUICK ACTIONS
  // ======================================================================

  const quickActions: QuickAction[] = [
    {
      id: 'pos',
      title: 'Kasir (POS)',
      description: 'Mulai transaksi penjualan baru',
      icon: <ShoppingCart24Regular />,
      href: '/pos',
      color: 'brand',
      shortcut: 'F3'
    },
    {
      id: 'products',
      title: 'Produk',
      description: 'Kelola data produk dan stok',
      icon: <Box24Regular />,
      href: '/products',
      color: 'success',
      shortcut: 'Ctrl+P'
    },
    {
      id: 'customers',
      title: 'Pelanggan',
      description: 'Kelola data pelanggan',
      icon: <People24Regular />,
      href: '/customers',
      color: 'info',
      shortcut: 'Ctrl+C'
    },
    {
      id: 'reports',
      title: 'Laporan',
      description: 'Lihat laporan penjualan',
      icon: <DocumentText24Regular />,
      href: '/reports',
      color: 'warning',
      shortcut: 'Ctrl+R'
    }
  ];

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleQuickAction = (action: QuickAction) => {
    router.push(action.href);
  };

  const handleStartPOS = () => {
    router.push('/pos');
  };

  // ======================================================================
  // LOADING STATE
  // ======================================================================

  if (authLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="large" />
          <Text>Memuat dashboard...</Text>
        </div>
      </div>
    );
  }

  // ======================================================================
  // UNAUTHENTICATED STATE
  // ======================================================================

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader
            header={
              <div className="text-center space-y-2">
                <Store24Regular className="w-12 h-12 mx-auto text-blue-600" />
                <Title2>POS Kasir Suite</Title2>
                <Body1 className="text-gray-600">
                  Aplikasi Point of Sale untuk Kasir Indonesia
                </Body1>
              </div>
            }
          />
          <div className="p-6 space-y-4">
            <Button 
              appearance="primary" 
              size="large" 
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Masuk ke Sistem
            </Button>
            <div className="text-center">
              <Caption1 className="text-gray-500">
                Silakan masuk untuk menggunakan aplikasi kasir
              </Caption1>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ======================================================================
  // MAIN DASHBOARD
  // ======================================================================

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Title1>Dashboard Kasir</Title1>
            <Body1 className="text-gray-600 mt-1">
              Selamat datang, {user.name}! Hari ini {formatDateTime(currentTime, 'EEEE, dd MMMM yyyy')}
            </Body1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <Caption1 className="text-gray-500">Waktu Sekarang</Caption1>
              <Text weight="semibold">{formatDateTime(currentTime, 'HH:mm:ss')}</Text>
            </div>
            <Avatar 
              name={user.name}
              size={40}
              color="brand"
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Start */}
        <Card>
          <CardHeader
            header={
              <div className="flex items-center justify-between">
                <Title3>Mulai Transaksi</Title3>
                <Badge appearance="filled" color="brand">F3</Badge>
              </div>
            }
          />
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Body1 className="mb-2">
                  Mulai transaksi penjualan baru dengan sistem kasir yang mudah dan cepat.
                </Body1>
                <Caption1 className="text-gray-500">
                  Tekan F3 atau klik tombol di samping untuk memulai
                </Caption1>
              </div>
              <Button 
                appearance="primary" 
                size="large"
                icon={<ShoppingCart24Regular />}
                iconPosition="before"
                onClick={handleStartPOS}
              >
                Mulai Kasir
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ChartLine24Regular className="text-blue-600" />
                  <Badge appearance="filled" color="brand">Hari Ini</Badge>
                </div>
                <Title3 className="text-blue-900">{formatCurrency(stats.todaySales)}</Title3>
                <Caption1 className="text-blue-700">Total Penjualan</Caption1>
              </div>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Receipt24Regular className="text-green-600" />
                  <Badge appearance="filled" color="success">Transaksi</Badge>
                </div>
                <Title3 className="text-green-900">{stats.todayTransactions}</Title3>
                <Caption1 className="text-green-700">Transaksi Hari Ini</Caption1>
              </div>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <People24Regular className="text-purple-600" />
                  <Badge appearance="filled" color="info">Pelanggan</Badge>
                </div>
                <Title3 className="text-purple-900">{stats.todayCustomers}</Title3>
                <Caption1 className="text-purple-700">Pelanggan Hari Ini</Caption1>
              </div>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Box24Regular className="text-orange-600" />
                  <Badge appearance="filled" color="warning">Stok</Badge>
                </div>
                <Title3 className="text-orange-900">{stats.lowStockItems}</Title3>
                <Caption1 className="text-orange-700">Stok Menipis</Caption1>
              </div>
            </Card>

            <Card className="bg-teal-50 border-teal-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <People24Regular className="text-teal-600" />
                  <Badge appearance="filled" color="success">Online</Badge>
                </div>
                <Title3 className="text-teal-900">{stats.activeUsers}</Title3>
                <Caption1 className="text-teal-700">Pengguna Aktif</Caption1>
              </div>
            </Card>

            <Card className="bg-indigo-50 border-indigo-200">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CashDrawer24Regular className="text-indigo-600" />
                  <Badge appearance="filled" color="brand">Sesi</Badge>
                </div>
                <Title3 className="text-indigo-900">{stats.openSessions}</Title3>
                <Caption1 className="text-indigo-700">Sesi Terbuka</Caption1>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                header={<Title3>Aksi Cepat</Title3>}
                description="Akses fitur utama dengan cepat"
              />
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Card 
                      key={action.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        "border-2 hover:border-blue-300"
                      )}
                      onClick={() => handleQuickAction(action)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            action.color === 'brand' && "bg-blue-100 text-blue-600",
                            action.color === 'success' && "bg-green-100 text-green-600",
                            action.color === 'warning' && "bg-orange-100 text-orange-600",
                            action.color === 'info' && "bg-purple-100 text-purple-600"
                          )}>
                            {action.icon}
                          </div>
                          {action.shortcut && (
                            <Badge appearance="outline" size="small">
                              {action.shortcut}
                            </Badge>
                          )}
                        </div>
                        <Title3 className="mb-1">{action.title}</Title3>
                        <Caption1 className="text-gray-600">{action.description}</Caption1>
                        <div className="flex items-center justify-end mt-3">
                          <ArrowRight24Regular className="text-gray-400" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activities */}
          <div>
            <Card>
              <CardHeader
                header={<Title3>Aktivitas Terbaru</Title3>}
                description="Aktivitas sistem dalam 1 jam terakhir"
              />
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-1 rounded-full mt-1",
                          activity.status === 'success' && "bg-green-100",
                          activity.status === 'warning' && "bg-orange-100",
                          activity.status === 'error' && "bg-red-100",
                          activity.status === 'info' && "bg-blue-100"
                        )}>
                          {activity.status === 'success' && <CheckmarkCircle24Filled className="text-green-600 w-4 h-4" />}
                          {activity.status === 'warning' && <Warning24Filled className="text-orange-600 w-4 h-4" />}
                          {activity.status === 'error' && <Warning24Filled className="text-red-600 w-4 h-4" />}
                          {activity.status === 'info' && <Info24Filled className="text-blue-600 w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text weight="semibold" className="block">{activity.title}</Text>
                          <Caption1 className="text-gray-600 block">{activity.description}</Caption1>
                          <Caption1 className="text-gray-500 block mt-1">
                            {formatDateTime(activity.timestamp, 'HH:mm')}
                          </Caption1>
                        </div>
                      </div>
                      {index < recentActivities.length - 1 && (
                        <Divider className="my-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}