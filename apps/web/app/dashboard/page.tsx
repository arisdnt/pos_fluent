// ======================================================================
// HALAMAN DASHBOARD
// Dashboard utama aplikasi POS Suite
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Text,
  Title1,
  Title2,
  Body1,
  Badge,
  Avatar,
  Spinner,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn
} from '@fluentui/react-components';
import {
  MoneyRegular,
  CartRegular,
  PeopleRegular,
  BoxRegular,
  ChartMultipleRegular,
  CalendarRegular,
  ClockRegular,
  ArrowRightRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils/format';
import { formatDateTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { useKeyboard } from '@/lib/keyboard/keyboard-provider';
import { SalesTrendChart, PaymentMethodChart, ProductCategoryChart, mockChartData } from '@/components/reports/ReportCharts';
import { MainLayout } from '@/components/layout/main-layout';

// ======================================================================
// TIPE DATA
// ======================================================================

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayCustomers: number;
  lowStockItems: number;
  totalProducts: number;
  activeUsers: number;
}

interface RecentTransaction {
  id: string;
  invoice_number: string;
  customer_name?: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  href: string;
  color: 'brand' | 'success' | 'warning' | 'danger';
  permission?: string;
}

// ======================================================================
// DATA MOCK
// ======================================================================

const mockStats: DashboardStats = {
  todaySales: 15750000,
  todayTransactions: 127,
  todayCustomers: 89,
  lowStockItems: 12,
  totalProducts: 1250,
  activeUsers: 8
};

const mockRecentTransactions: RecentTransaction[] = [
  {
    id: '1',
    invoice_number: 'INV-2024-001',
    customer_name: 'Budi Santoso',
    total_amount: 125000,
    payment_method: 'Tunai',
    created_at: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    invoice_number: 'INV-2024-002',
    customer_name: 'Siti Aminah',
    total_amount: 89000,
    payment_method: 'QRIS',
    created_at: '2024-01-15T10:25:00Z',
    status: 'completed'
  },
  {
    id: '3',
    invoice_number: 'INV-2024-003',
    total_amount: 156000,
    payment_method: 'Kartu Debit',
    created_at: '2024-01-15T10:20:00Z',
    status: 'completed'
  },
  {
    id: '4',
    invoice_number: 'INV-2024-004',
    customer_name: 'Ahmad Wijaya',
    total_amount: 234000,
    payment_method: 'Transfer Bank',
    created_at: '2024-01-15T10:15:00Z',
    status: 'pending'
  },
  {
    id: '5',
    invoice_number: 'INV-2024-005',
    customer_name: 'Rina Sari',
    total_amount: 67000,
    payment_method: 'Tunai',
    created_at: '2024-01-15T10:10:00Z',
    status: 'completed'
  }
];

const quickActions: QuickAction[] = [
  {
    id: 'pos',
    title: 'Kasir (POS)',
    description: 'Mulai transaksi penjualan',
    icon: <MoneyRegular />,
    href: '/pos',
    color: 'brand',
    permission: 'pos.create'
  },
  {
    id: 'products',
    title: 'Kelola Produk',
    description: 'Tambah dan edit produk',
    icon: <BoxRegular />,
    href: '/products',
    color: 'success',
    permission: 'products.read'
  },
  {
    id: 'customers',
    title: 'Kelola Pelanggan',
    description: 'Data pelanggan dan member',
    icon: <PeopleRegular />,
    href: '/customers',
    color: 'warning',
    permission: 'customers.read'
  },
  {
    id: 'reports',
    title: 'Laporan',
    description: 'Laporan penjualan dan stok',
    icon: <ChartMultipleRegular />,
    href: '/reports',
    color: 'danger',
    permission: 'reports.read'
  }
];

// ======================================================================
// KOLOM TABEL
// ======================================================================

const transactionColumns: TableColumnDefinition<RecentTransaction>[] = [
  createTableColumn<RecentTransaction>({
    columnId: 'invoice',
    compare: (a, b) => a.invoice_number.localeCompare(b.invoice_number),
    renderHeaderCell: () => 'No. Invoice',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold">{item.invoice_number}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<RecentTransaction>({
    columnId: 'customer',
    compare: (a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''),
    renderHeaderCell: () => 'Pelanggan',
    renderCell: (item) => (
      <TableCellLayout>
        {item.customer_name || 'Umum'}
      </TableCellLayout>
    )
  }),
  createTableColumn<RecentTransaction>({
    columnId: 'amount',
    compare: (a, b) => a.total_amount - b.total_amount,
    renderHeaderCell: () => 'Total',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold">{formatCurrency(item.total_amount)}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<RecentTransaction>({
    columnId: 'payment',
    compare: (a, b) => a.payment_method.localeCompare(b.payment_method),
    renderHeaderCell: () => 'Pembayaran',
    renderCell: (item) => (
      <TableCellLayout>
        <Badge appearance="outline">{item.payment_method}</Badge>
      </TableCellLayout>
    )
  }),
  createTableColumn<RecentTransaction>({
    columnId: 'status',
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => 'Status',
    renderCell: (item) => {
      const statusConfig = {
        completed: { color: 'success' as const, text: 'Selesai' },
        pending: { color: 'warning' as const, text: 'Pending' },
        cancelled: { color: 'danger' as const, text: 'Dibatalkan' }
      };
      const config = statusConfig[item.status];
      return (
        <TableCellLayout>
          <Badge color={config.color}>{config.text}</Badge>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<RecentTransaction>({
    columnId: 'time',
    compare: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    renderHeaderCell: () => 'Waktu',
    renderCell: (item) => (
      <TableCellLayout>
        <Text size={200}>{formatDateTime(item.created_at, 'short')}</Text>
      </TableCellLayout>
    )
  })
];

// ======================================================================
// KOMPONEN UTAMA
// ======================================================================

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, hasPermission } = useAuth();
  const { registerAction, unregisterAction } = useKeyboard();
  const router = useRouter();

  // ======================================================================
  // EFFECTS
  // ======================================================================

  useEffect(() => {
    // Simulasi loading data
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulasi delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockStats);
      setRecentTransactions(mockRecentTransactions);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Register Dashboard-specific keyboard shortcuts
    registerAction('dashboard-refresh-data', () => {
      setIsLoading(true);
      // Reload dashboard data
      setTimeout(() => {
        setStats(mockStats);
        setRecentTransactions(mockRecentTransactions);
        setIsLoading(false);
      }, 1000);
    });
    
    registerAction('dashboard-quick-pos', () => {
      if (hasPermission('pos.create')) {
        router.push('/pos');
      }
    });
    
    registerAction('dashboard-quick-products', () => {
      if (hasPermission('products.read')) {
        router.push('/products');
      }
    });
    
    registerAction('dashboard-quick-reports', () => {
      if (hasPermission('reports.read')) {
        router.push('/reports');
      }
    });

    return () => {
      unregisterAction('dashboard-refresh-data');
      unregisterAction('dashboard-quick-pos');
      unregisterAction('dashboard-quick-products');
      unregisterAction('dashboard-quick-reports');
    };
  }, [registerAction, unregisterAction, hasPermission, router]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleQuickAction = (action: QuickAction) => {
    if (action.permission && !hasPermission(action.permission)) {
      return;
    }
    router.push(action.href);
  };

  // ======================================================================
  // RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4 block">Memuat dashboard...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title1>Dashboard</Title1>
          <Body1 className="text-gray-600 mt-1">
            Selamat datang kembali, {user?.full_name || user?.username}!
          </Body1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClockRegular />
          <Text>{formatDateTime(new Date().toISOString(), 'long')}</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Penjualan Hari Ini</Text>
              <Title2 className="text-green-600 mt-1">
                {formatCurrency(stats?.todaySales || 0)}
              </Title2>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <MoneyRegular className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Transaksi Hari Ini</Text>
              <Title2 className="text-blue-600 mt-1">
                {stats?.todayTransactions || 0}
              </Title2>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CartRegular className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Pelanggan Hari Ini</Text>
              <Title2 className="text-purple-600 mt-1">
                {stats?.todayCustomers || 0}
              </Title2>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PeopleRegular className="text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Stok Menipis</Text>
              <Title2 className="text-orange-600 mt-1">
                {stats?.lowStockItems || 0}
              </Title2>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <WarningRegular className="text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SalesTrendChart 
          data={mockChartData.salesTrend}
          title="Tren Penjualan (7 Hari)"
        />
        
        <PaymentMethodChart 
          data={mockChartData.paymentMethods}
          title="Metode Pembayaran"
        />
        
        <ProductCategoryChart 
          data={mockChartData.productCategories}
          title="Kategori Produk Terlaris"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <Title2>Aksi Cepat</Title2>
        </CardHeader>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const canAccess = !action.permission || hasPermission(action.permission);
              
              return (
                <Button
                  key={action.id}
                  appearance="outline"
                  size="large"
                  onClick={() => handleQuickAction(action)}
                  disabled={!canAccess}
                  className={cn(
                    "h-auto p-4 flex-col gap-3",
                    !canAccess && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-lg",
                    action.color === 'brand' && "bg-blue-100 text-blue-600",
                    action.color === 'success' && "bg-green-100 text-green-600",
                    action.color === 'warning' && "bg-orange-100 text-orange-600",
                    action.color === 'danger' && "bg-red-100 text-red-600"
                  )}>
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <Text weight="semibold" className="block">{action.title}</Text>
                    <Text size={200} className="text-gray-600 mt-1">
                      {action.description}
                    </Text>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Title2>Transaksi Terbaru</Title2>
            <Button
              appearance="subtle"
              icon={<ArrowRightRegular />}
              iconPosition="after"
              onClick={() => router.push('/transactions')}
            >
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <div className="p-6 pt-0">
          <DataGrid
            items={recentTransactions}
            columns={transactionColumns}
            sortable
            getRowId={(item) => item.id}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<RecentTransaction>>
              {({ item, rowId }) => (
                <DataGridRow<RecentTransaction> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </div>
      </Card>
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  );
}