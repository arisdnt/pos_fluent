// ======================================================================
// HALAMAN CUSTOMER MANAGEMENT
// Manajemen data pelanggan dan member
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Title1,
  Title2,
  Body1,
  Badge,
  Spinner,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Input,
  Dropdown,
  Option,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Textarea,
  Switch,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Avatar,
  ProgressBar
} from '@fluentui/react-components';
import {
  People24Regular,
  Search24Regular,
  Filter24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Star24Regular,
  Star24Filled,
  Phone24Regular,
  Mail24Regular,
  Location24Regular,
  Calendar24Regular,
  Money24Regular,
  Cart24Regular,
  Eye24Regular,
  Person24Regular,
  Gift24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils/format';
import { formatDateTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { ExportButton, AdvancedExportButton } from '@/components/reports/ExportUtils';
import { TwoColumnLayout } from '@/components/layout/TwoColumnLayout';

// ======================================================================
// TYPES
// ======================================================================

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  member_type: 'regular' | 'silver' | 'gold' | 'platinum';
  member_since: string;
  total_transactions: number;
  total_spent: number;
  last_transaction?: string;
  points: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageSpentPerCustomer: number;
  memberDistribution: {
    regular: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

interface CustomerTransaction {
  id: string;
  invoice_number: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  items_count: number;
  status: 'completed' | 'pending' | 'cancelled';
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockCustomerStats: CustomerStats = {
  totalCustomers: 1250,
  activeCustomers: 980,
  newCustomersThisMonth: 45,
  totalRevenue: 125750000,
  averageSpentPerCustomer: 100600,
  memberDistribution: {
    regular: 850,
    silver: 250,
    gold: 120,
    platinum: 30
  }
};

const mockCustomers: Customer[] = [
  {
    id: '1',
    customer_code: 'CUST-001',
    full_name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123',
    city: 'Jakarta',
    postal_code: '12345',
    birth_date: '1985-05-15',
    gender: 'male',
    member_type: 'gold',
    member_since: '2023-01-15',
    total_transactions: 45,
    total_spent: 2750000,
    last_transaction: '2024-01-15T10:30:00Z',
    points: 2750,
    status: 'active',
    notes: 'Pelanggan setia, sering beli dalam jumlah besar',
    created_at: '2023-01-15T08:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    customer_code: 'CUST-002',
    full_name: 'Siti Aminah',
    email: 'siti.aminah@email.com',
    phone: '081234567891',
    address: 'Jl. Sudirman No. 456',
    city: 'Jakarta',
    postal_code: '12346',
    birth_date: '1990-08-22',
    gender: 'female',
    member_type: 'silver',
    member_since: '2023-03-10',
    total_transactions: 28,
    total_spent: 1450000,
    last_transaction: '2024-01-14T15:20:00Z',
    points: 1450,
    status: 'active',
    created_at: '2023-03-10T09:15:00Z',
    updated_at: '2024-01-14T15:20:00Z'
  },
  {
    id: '3',
    customer_code: 'CUST-003',
    full_name: 'Ahmad Wijaya',
    phone: '081234567892',
    address: 'Jl. Thamrin No. 789',
    city: 'Jakarta',
    birth_date: '1978-12-03',
    gender: 'male',
    member_type: 'platinum',
    member_since: '2022-06-20',
    total_transactions: 89,
    total_spent: 5250000,
    last_transaction: '2024-01-15T09:45:00Z',
    points: 5250,
    status: 'active',
    notes: 'VIP customer, prioritas tinggi',
    created_at: '2022-06-20T10:30:00Z',
    updated_at: '2024-01-15T09:45:00Z'
  },
  {
    id: '4',
    customer_code: 'CUST-004',
    full_name: 'Rina Sari',
    email: 'rina.sari@email.com',
    phone: '081234567893',
    address: 'Jl. Gatot Subroto No. 321',
    city: 'Jakarta',
    postal_code: '12347',
    birth_date: '1995-03-18',
    gender: 'female',
    member_type: 'regular',
    member_since: '2023-11-05',
    total_transactions: 12,
    total_spent: 650000,
    last_transaction: '2024-01-12T14:10:00Z',
    points: 650,
    status: 'active',
    created_at: '2023-11-05T11:20:00Z',
    updated_at: '2024-01-12T14:10:00Z'
  },
  {
    id: '5',
    customer_code: 'CUST-005',
    full_name: 'Dedi Kurniawan',
    phone: '081234567894',
    member_type: 'regular',
    member_since: '2024-01-01',
    total_transactions: 3,
    total_spent: 125000,
    last_transaction: '2024-01-10T16:30:00Z',
    points: 125,
    status: 'active',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-10T16:30:00Z'
  }
];

// ======================================================================
// STYLES
// ======================================================================

const styles = {
  container: 'space-y-6',
  header: 'flex items-center justify-between',
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4',
  filtersCard: 'p-4',
  filtersGrid: 'grid grid-cols-1 md:grid-cols-4 gap-4',
  tableCard: 'overflow-hidden',
  actionButtons: 'flex items-center gap-2',
  memberBadge: {
    regular: 'bg-gray-100 text-gray-800',
    silver: 'bg-gray-200 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800'
  },
  statusBadge: {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    blocked: 'bg-red-100 text-red-800'
  }
};

// ======================================================================
// COLUMNS DEFINITION
// ======================================================================

const customerColumns: TableColumnDefinition<Customer>[] = [
  createTableColumn<Customer>({
    columnId: 'customer',
    compare: (a, b) => a.full_name.localeCompare(b.full_name),
    renderHeaderCell: () => 'Pelanggan',
    renderCell: (item) => (
      <TableCellLayout
        media={
          <Avatar
            name={item.full_name}
            size={32}
            color={item.member_type === 'platinum' ? 'purple' : 
                   item.member_type === 'gold' ? 'gold' :
                   item.member_type === 'silver' ? 'steel' : 'brand'}
          />
        }
      >
        <div>
          <Text weight="semibold">{item.full_name}</Text>
          <Text size={200} className="text-gray-600 block">
            {item.customer_code}
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<Customer>({
    columnId: 'contact',
    renderHeaderCell: () => 'Kontak',
    renderCell: (item) => (
      <TableCellLayout>
        <div className="space-y-1">
          {item.phone && (
            <div className="flex items-center gap-1">
              <Phone24Regular className="w-3 h-3 text-gray-500" />
              <Text size={200}>{item.phone}</Text>
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-1">
              <Mail24Regular className="w-3 h-3 text-gray-500" />
              <Text size={200}>{item.email}</Text>
            </div>
          )}
          {item.city && (
            <div className="flex items-center gap-1">
              <Location24Regular className="w-3 h-3 text-gray-500" />
              <Text size={200}>{item.city}</Text>
            </div>
          )}
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<Customer>({
    columnId: 'member',
    compare: (a, b) => a.member_type.localeCompare(b.member_type),
    renderHeaderCell: () => 'Member',
    renderCell: (item) => {
      const memberConfig = {
        regular: { label: 'Regular', appearance: 'outline' as const },
        silver: { label: 'Silver', appearance: 'outline' as const },
        gold: { label: 'Gold', appearance: 'filled' as const },
        platinum: { label: 'Platinum', appearance: 'filled' as const }
      };
      
      const config = memberConfig[item.member_type];
      
      return (
        <TableCellLayout>
          <div>
            <Badge appearance={config.appearance}>{config.label}</Badge>
            <Text size={200} className="text-gray-600 block mt-1">
              Sejak {formatDateTime(item.member_since, 'medium')}
            </Text>
          </div>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<Customer>({
    columnId: 'transactions',
    compare: (a, b) => a.total_transactions - b.total_transactions,
    renderHeaderCell: () => 'Transaksi',
    renderCell: (item) => (
      <TableCellLayout>
        <div className="text-center">
          <Text weight="semibold">{item.total_transactions}</Text>
          <Text size={200} className="text-gray-600 block">
            {formatCurrency(item.total_spent)}
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<Customer>({
    columnId: 'points',
    compare: (a, b) => a.points - b.points,
    renderHeaderCell: () => 'Poin',
    renderCell: (item) => (
      <TableCellLayout media={<Gift24Regular className="text-orange-500" />}>
        <Text weight="semibold" className="text-orange-600">
          {item.points.toLocaleString()}
        </Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<Customer>({
    columnId: 'last_transaction',
    compare: (a, b) => {
      if (!a.last_transaction && !b.last_transaction) return 0;
      if (!a.last_transaction) return 1;
      if (!b.last_transaction) return -1;
      return new Date(a.last_transaction).getTime() - new Date(b.last_transaction).getTime();
    },
    renderHeaderCell: () => 'Transaksi Terakhir',
    renderCell: (item) => (
      <TableCellLayout>
        <Text size={200}>
          {item.last_transaction 
            ? formatDateTime(item.last_transaction, 'short')
            : 'Belum ada'
          }
        </Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<Customer>({
    columnId: 'status',
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => 'Status',
    renderCell: (item) => {
      const statusConfig = {
        active: { label: 'Aktif', appearance: 'tint' as const },
        inactive: { label: 'Tidak Aktif', appearance: 'outline' as const },
        blocked: { label: 'Diblokir', appearance: 'filled' as const }
      };
      
      const config = statusConfig[item.status];
      
      return (
        <TableCellLayout>
          <Badge appearance={config.appearance}>{config.label}</Badge>
        </TableCellLayout>
      );
    }
  }),

];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function CustomersPageContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  // ======================================================================
  // EFFECTS
  // ======================================================================

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockCustomerStats);
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading customers data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    
    try {
      // Simulasi export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        type: 'customers',
        format,
        data: filteredCustomers,
        filters: {
          search: searchQuery,
          member: memberFilter,
          status: statusFilter
        }
      };
      
      console.log('Exporting:', exportData);
      
      // Simulasi download
      const filename = `customers_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
      console.log(`File downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCustomerEdit = () => {
    if (selectedCustomer) {
      console.log('Edit customer:', selectedCustomer.id);
      // TODO: Implement edit functionality
    }
  };

  const handleCustomerDelete = () => {
    if (selectedCustomer) {
      console.log('Delete customer:', selectedCustomer.id);
      // TODO: Implement delete functionality
    }
  };

  // Render customer detail panel
  const renderCustomerDetail = () => {
    if (!selectedCustomer) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Person24Regular className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <Text>Pilih pelanggan untuk melihat detail</Text>
          </div>
        </div>
      );
    }

    const memberTypeConfig = {
      regular: { label: 'Regular', color: 'bg-gray-100 text-gray-800' },
      silver: { label: 'Silver', color: 'bg-gray-200 text-gray-800' },
      gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' },
      platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-800' }
    };

    const statusConfig = {
      active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Tidak Aktif', color: 'bg-gray-100 text-gray-800' },
      blocked: { label: 'Diblokir', color: 'bg-red-100 text-red-800' }
    };

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="flex items-center gap-4">
          <Avatar
            name={selectedCustomer.full_name}
            size={64}
            color={selectedCustomer.member_type === 'platinum' ? 'purple' : 
                   selectedCustomer.member_type === 'gold' ? 'gold' :
                   selectedCustomer.member_type === 'silver' ? 'steel' : 'brand'}
          />
          <div>
            <Title2>{selectedCustomer.full_name}</Title2>
            <Text className="text-gray-600">{selectedCustomer.customer_code}</Text>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={memberTypeConfig[selectedCustomer.member_type].color}>
                {memberTypeConfig[selectedCustomer.member_type].label}
              </Badge>
              <Badge className={statusConfig[selectedCustomer.status].color}>
                {statusConfig[selectedCustomer.status].label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <Card className="p-4">
          <Title2 className="mb-4">Informasi Kontak</Title2>
          <div className="space-y-3">
            {selectedCustomer.phone && (
              <div className="flex items-center gap-3">
                <Phone24Regular className="text-gray-500" />
                <Text>{selectedCustomer.phone}</Text>
              </div>
            )}
            {selectedCustomer.email && (
              <div className="flex items-center gap-3">
                <Mail24Regular className="text-gray-500" />
                <Text>{selectedCustomer.email}</Text>
              </div>
            )}
            {selectedCustomer.address && (
              <div className="flex items-center gap-3">
                <Location24Regular className="text-gray-500" />
                <div>
                  <Text>{selectedCustomer.address}</Text>
                  {selectedCustomer.city && (
                    <Text size={200} className="text-gray-600 block">
                      {selectedCustomer.city} {selectedCustomer.postal_code}
                    </Text>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Member Information */}
        <Card className="p-4">
          <Title2 className="mb-4">Informasi Member</Title2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size={200} className="text-gray-600">Member Sejak</Text>
              <Text weight="semibold">
                {formatDateTime(selectedCustomer.member_since, 'short')}
              </Text>
            </div>
            <div>
              <Text size={200} className="text-gray-600">Poin</Text>
              <Text weight="semibold" className="text-orange-600">
                {selectedCustomer.points.toLocaleString()}
              </Text>
            </div>
            {selectedCustomer.birth_date && (
              <div>
                <Text size={200} className="text-gray-600">Tanggal Lahir</Text>
                <Text weight="semibold">
                  {formatDateTime(selectedCustomer.birth_date, 'short')}
                </Text>
              </div>
            )}
            {selectedCustomer.gender && (
              <div>
                <Text size={200} className="text-gray-600">Jenis Kelamin</Text>
                <Text weight="semibold">
                  {selectedCustomer.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                </Text>
              </div>
            )}
          </div>
        </Card>

        {/* Transaction Summary */}
        <Card className="p-4">
          <Title2 className="mb-4">Ringkasan Transaksi</Title2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size={200} className="text-gray-600">Total Transaksi</Text>
              <Text weight="semibold">{selectedCustomer.total_transactions}</Text>
            </div>
            <div>
              <Text size={200} className="text-gray-600">Total Pembelian</Text>
              <Text weight="semibold">{formatCurrency(selectedCustomer.total_spent)}</Text>
            </div>
            <div className="col-span-2">
              <Text size={200} className="text-gray-600">Transaksi Terakhir</Text>
              <Text weight="semibold">
                {selectedCustomer.last_transaction 
                  ? formatDateTime(selectedCustomer.last_transaction, 'medium')
                  : 'Belum ada transaksi'
                }
              </Text>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {selectedCustomer.notes && (
          <Card className="p-4">
            <Title2 className="mb-4">Catatan</Title2>
            <Text>{selectedCustomer.notes}</Text>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="p-4">
          <Title2 className="mb-4">Informasi Sistem</Title2>
          <div className="space-y-2">
            <div>
              <Text size={200} className="text-gray-600">Dibuat</Text>
              <Text>{formatDateTime(selectedCustomer.created_at, 'medium')}</Text>
            </div>
            <div>
              <Text size={200} className="text-gray-600">Diperbarui</Text>
              <Text>{formatDateTime(selectedCustomer.updated_at, 'medium')}</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Render left content (stats, filters, table)
  const renderLeftContent = () => {
    return (
      <div className="space-y-6">
        {/* Export Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <ExportButton
            format="excel"
            reportType="customers"
            reportData={filteredCustomers}
            onExport={async (options) => {
              console.log('Exporting customers:', options);
            }}
          />
          <AdvancedExportButton
            reportType="customers"
            reportData={filteredCustomers}
            onExport={async (options) => {
              console.log('Advanced export customers:', options);
            }}
          />
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size={200} className="text-gray-600">Total Pelanggan</Text>
                <Title2 className="text-blue-600 mt-1">
                  {stats?.totalCustomers || 0}
                </Title2>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <People24Regular className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size={200} className="text-gray-600">Pelanggan Aktif</Text>
                <Title2 className="text-green-600 mt-1">
                  {stats?.activeCustomers || 0}
                </Title2>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Person24Regular className="text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size={200} className="text-gray-600">Member Baru Bulan Ini</Text>
                <Title2 className="text-purple-600 mt-1">
                  {stats?.newCustomersThisMonth || 0}
                </Title2>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Add24Regular className="text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size={200} className="text-gray-600">Total Revenue</Text>
                <Title2 className="text-orange-600 mt-1">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </Title2>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Money24Regular className="text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text size={200} className="text-gray-600">Rata-rata per Pelanggan</Text>
                <Title2 className="text-teal-600 mt-1">
                  {formatCurrency(stats?.averageSpentPerCustomer || 0)}
                </Title2>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Cart24Regular className="text-teal-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Member Distribution */}
        <Card className="p-6">
          <Title2 className="mb-4">Distribusi Member</Title2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(stats?.memberDistribution || {}).map(([type, count]) => {
              const total = stats?.totalCustomers || 1;
              const percentage = (count / total) * 100;
              
              const typeConfig = {
                regular: { label: 'Regular', color: 'bg-gray-500' },
                silver: { label: 'Silver', color: 'bg-gray-400' },
                gold: { label: 'Gold', color: 'bg-yellow-500' },
                platinum: { label: 'Platinum', color: 'bg-purple-500' }
              };
              
              const config = typeConfig[type as keyof typeof typeConfig];
              
              return (
                <div key={type} className="text-center">
                  <div className="flex items-center justify-between mb-2">
                    <Text weight="semibold">{config.label}</Text>
                    <Text size={200} className="text-gray-600">{count}</Text>
                  </div>
                  <ProgressBar 
                    value={percentage} 
                    max={100}
                    className="mb-1"
                  />
                  <Text size={200} className="text-gray-600">
                    {percentage.toFixed(1)}%
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Filters */}
        <Card className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <Field label="Pencarian">
              <Input
                placeholder="Cari nama, kode, telepon, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                contentBefore={<Search24Regular />}
              />
            </Field>
            
            <Field label="Tipe Member">
              <Dropdown
                placeholder="Semua Member"
                value={memberFilter}
                onOptionSelect={(e, data) => setMemberFilter(data.optionValue || 'all')}
              >
                <Option value="all">Semua Member</Option>
                <Option value="regular">Regular</Option>
                <Option value="silver">Silver</Option>
                <Option value="gold">Gold</Option>
                <Option value="platinum">Platinum</Option>
              </Dropdown>
            </Field>
            
            <Field label="Status">
              <Dropdown
                placeholder="Semua Status"
                value={statusFilter}
                onOptionSelect={(e, data) => setStatusFilter(data.optionValue || 'all')}
              >
                <Option value="all">Semua Status</Option>
                <Option value="active">Aktif</Option>
                <Option value="inactive">Tidak Aktif</Option>
                <Option value="blocked">Diblokir</Option>
              </Dropdown>
            </Field>
            
            <Field label="Aksi Cepat">
              <Button
                appearance="outline"
                icon={<Filter24Regular />}
                onClick={() => {
                  setSearchQuery('');
                  setMemberFilter('all');
                  setStatusFilter('all');
                }}
              >
                Reset Filter
              </Button>
            </Field>
          </div>
        </Card>

        {/* Data Table */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Title2>Data Pelanggan</Title2>
              <Text size={200} className="text-gray-600">
                Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan
              </Text>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            <DataGrid
              items={filteredCustomers}
              columns={customerColumns}
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
              <DataGridBody<Customer>>
                {({ item, rowId }) => (
                  <DataGridRow<Customer> 
                    key={rowId}
                    onClick={() => handleCustomerSelect(item)}
                    style={{ cursor: 'pointer' }}
                  >
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
  };

  // ======================================================================
  // COMPUTED VALUES
  // ======================================================================

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery || 
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMember = memberFilter === 'all' || customer.member_type === memberFilter;
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesMember && matchesStatus;
  });

  // ======================================================================
  // RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4 block">Memuat data pelanggan...</Text>
        </div>
      </div>
    );
  }

  return (
    <TwoColumnLayout
      title="Manajemen Pelanggan"
      searchPlaceholder="Cari nama, kode, telepon, atau email..."
      onSearch={setSearchQuery}
      onAdd={hasPermission('customers.create') ? () => router.push('/customers/new') : undefined}
      addButtonText="Tambah Pelanggan"
      leftContent={renderLeftContent()}
      selectedItem={selectedCustomer}
      onEdit={selectedCustomer && hasPermission('customers.update') ? handleCustomerEdit : undefined}
      onDelete={selectedCustomer && hasPermission('customers.delete') ? handleCustomerDelete : undefined}
      rightContent={renderCustomerDetail()}
    />
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default function CustomersPage() {
  return (
    <ProtectedRoute requiredPermissions={['customers.read']}>
      <CustomersPageContent />
    </ProtectedRoute>
  );
}