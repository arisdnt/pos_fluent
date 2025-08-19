// ======================================================================
// HALAMAN ORDERS/PESANAN
// Manajemen pesanan dan tracking status
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
  Title3,
  Body1,
  Badge,
  Spinner,
  Input,
  Dropdown,
  Option,
  Field,
  Textarea,
  Switch,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
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
  Avatar,
  ProgressBar
} from '@fluentui/react-components';
import {
  Cart24Regular,
  Add24Regular,
  Search24Regular,
  Filter24Regular,
  MoreHorizontal24Regular,
  Eye24Regular,
  Edit24Regular,
  Delete24Regular,
  Print24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  Dismiss24Regular,
  Box24Regular,
  CaretRight24Regular,
  Person24Regular,
  Phone24Regular,
  Location24Regular,
  Calendar24Regular,
  Money24Regular,
  Receipt24Regular,
  Warning24Regular,
  Info24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  order_date: string;
  delivery_date?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes?: string;
  items: OrderItem[];
  created_by: string;
  updated_at: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  shipped_orders: number;
  total_revenue: number;
  average_order_value: number;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockOrderItems: OrderItem[] = [
  {
    id: '1',
    product_id: 'P001',
    product_name: 'Indomie Goreng',
    product_sku: 'IDM-001',
    quantity: 2,
    unit_price: 3500,
    discount: 0,
    subtotal: 7000
  },
  {
    id: '2',
    product_id: 'P002',
    product_name: 'Teh Botol Sosro',
    product_sku: 'TBS-001',
    quantity: 1,
    unit_price: 4000,
    discount: 500,
    subtotal: 3500
  }
];

const mockOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-2024-001',
    customer_id: 'C001',
    customer_name: 'Budi Santoso',
    customer_phone: '081234567890',
    customer_address: 'Jl. Merdeka No. 123, Jakarta',
    order_date: '2024-01-15T10:30:00Z',
    delivery_date: '2024-01-16T14:00:00Z',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'transfer',
    subtotal: 10500,
    tax_amount: 1155,
    discount_amount: 500,
    shipping_cost: 5000,
    total_amount: 16155,
    notes: 'Antar ke alamat rumah',
    items: mockOrderItems,
    created_by: 'admin',
    updated_at: '2024-01-15T10:35:00Z'
  },
  {
    id: '2',
    order_number: 'ORD-2024-002',
    customer_name: 'Siti Aminah',
    customer_phone: '081987654321',
    order_date: '2024-01-15T11:15:00Z',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'cash',
    subtotal: 25000,
    tax_amount: 2750,
    discount_amount: 0,
    shipping_cost: 0,
    total_amount: 27750,
    items: [],
    created_by: 'kasir1',
    updated_at: '2024-01-15T11:15:00Z'
  },
  {
    id: '3',
    order_number: 'ORD-2024-003',
    customer_id: 'C003',
    customer_name: 'Ahmad Rahman',
    customer_phone: '081555666777',
    customer_address: 'Jl. Sudirman No. 456, Bandung',
    order_date: '2024-01-15T09:45:00Z',
    delivery_date: '2024-01-15T16:00:00Z',
    status: 'shipped',
    payment_status: 'paid',
    payment_method: 'qris',
    subtotal: 45000,
    tax_amount: 4950,
    discount_amount: 2000,
    shipping_cost: 8000,
    total_amount: 55950,
    items: [],
    created_by: 'admin',
    updated_at: '2024-01-15T14:20:00Z'
  }
];

const mockStats: OrderStats = {
  total_orders: 156,
  pending_orders: 12,
  confirmed_orders: 8,
  shipped_orders: 5,
  total_revenue: 15750000,
  average_order_value: 125000
};

// ======================================================================
// STYLES
// ======================================================================

const styles = {
  container: 'space-y-6',
  header: 'flex items-center justify-between',
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4',
  filtersCard: 'p-4',
  filtersGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  tableCard: 'overflow-hidden',
  actionButtons: 'flex items-center gap-2'
};

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

const getStatusBadge = (status: Order['status']) => {
  const statusConfig = {
    pending: { color: 'warning' as const, icon: <Clock24Regular />, text: 'Menunggu' },
    confirmed: { color: 'success' as const, icon: <CheckmarkCircle24Regular />, text: 'Dikonfirmasi' },
    processing: { color: 'informative' as const, icon: <Box24Regular />, text: 'Diproses' },
    shipped: { color: 'informative' as const, icon: <CaretRight24Regular />, text: 'Dikirim' },
    delivered: { color: 'success' as const, icon: <CheckmarkCircle24Regular />, text: 'Selesai' },
    cancelled: { color: 'danger' as const, icon: <Dismiss24Regular />, text: 'Dibatalkan' }
  };
  
  const config = statusConfig[status];
  return (
    <Badge color={config.color} icon={config.icon}>
      {config.text}
    </Badge>
  );
};

const getPaymentStatusBadge = (status: Order['payment_status']) => {
  const statusConfig = {
    pending: { color: 'warning' as const, text: 'Belum Bayar' },
    paid: { color: 'success' as const, text: 'Lunas' },
    partial: { color: 'informative' as const, text: 'Sebagian' },
    refunded: { color: 'danger' as const, text: 'Refund' }
  };
  
  const config = statusConfig[status];
  return (
    <Badge color={config.color}>
      {config.text}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>(mockStats);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  // ======================================================================
  // DATA LOADING
  // ======================================================================

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================================
  // FILTERING
  // ======================================================================

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    router.push(`/orders/${order.id}/edit`);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pesanan ${order.order_number}?`)) {
      try {
        // Simulasi API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const handlePrintOrder = (order: Order) => {
    console.log('Printing order:', order.order_number);
    // Implementasi print
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // ======================================================================
  // TABLE COLUMNS
  // ======================================================================

  const columns: TableColumnDefinition<Order>[] = [
    createTableColumn<Order>({
      columnId: 'order_number',
      compare: (a, b) => a.order_number.localeCompare(b.order_number),
      renderHeaderCell: () => 'No. Pesanan',
      renderCell: (order) => (
        <TableCellLayout>
          <div>
            <Text weight="semibold">{order.order_number}</Text>
            <Text size={200} className="text-gray-600 block">
              {formatDate(order.order_date)}
            </Text>
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'customer',
      compare: (a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''),
      renderHeaderCell: () => 'Pelanggan',
      renderCell: (order) => (
        <TableCellLayout
          media={<Avatar name={order.customer_name} size={32} />}
        >
          <div>
            <Text weight="semibold">{order.customer_name || 'Walk-in Customer'}</Text>
            {order.customer_phone && (
              <Text size={200} className="text-gray-600 block">
                {order.customer_phone}
              </Text>
            )}
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (order) => (
        <TableCellLayout>
          <div className="space-y-1">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'payment_method',
      compare: (a, b) => a.payment_method.localeCompare(b.payment_method),
      renderHeaderCell: () => 'Pembayaran',
      renderCell: (order) => (
        <TableCellLayout>
          <Text className="capitalize">{order.payment_method}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'total_amount',
      compare: (a, b) => a.total_amount - b.total_amount,
      renderHeaderCell: () => 'Total',
      renderCell: (order) => (
        <TableCellLayout>
          <Text weight="semibold">{formatCurrency(order.total_amount)}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'delivery_date',
      compare: (a, b) => (a.delivery_date || '').localeCompare(b.delivery_date || ''),
      renderHeaderCell: () => 'Pengiriman',
      renderCell: (order) => (
        <TableCellLayout>
          {order.delivery_date ? (
            <Text>{formatDate(order.delivery_date)}</Text>
          ) : (
            <Text className="text-gray-500">-</Text>
          )}
        </TableCellLayout>
      )
    }),
    createTableColumn<Order>({
      columnId: 'actions',
      renderHeaderCell: () => 'Aksi',
      renderCell: (order) => (
        <TableCellLayout>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<MoreHorizontal24Regular />}
                size="small"
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<Eye24Regular />}
                  onClick={() => handleViewOrder(order)}
                >
                  Lihat Detail
                </MenuItem>
                {hasPermission('orders.update') && (
                  <MenuItem
                    icon={<Edit24Regular />}
                    onClick={() => handleEditOrder(order)}
                  >
                    Edit Pesanan
                  </MenuItem>
                )}
                <MenuItem
                  icon={<Print24Regular />}
                  onClick={() => handlePrintOrder(order)}
                >
                  Print
                </MenuItem>
                {hasPermission('orders.delete') && order.status === 'pending' && (
                  <MenuItem
                    icon={<Delete24Regular />}
                    onClick={() => handleDeleteOrder(order)}
                  >
                    Hapus
                  </MenuItem>
                )}
              </MenuList>
            </MenuPopover>
          </Menu>
        </TableCellLayout>
      )
    })
  ];

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;

    return (
      <Dialog open={isDetailDialogOpen} onOpenChange={(e, data) => setIsDetailDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '800px', width: '90vw' }}>
          <DialogTitle>Detail Pesanan {selectedOrder.order_number}</DialogTitle>
          <DialogContent>
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <Title3 className="mb-3 flex items-center gap-2">
                    <Person24Regular />
                    Informasi Pelanggan
                  </Title3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Person24Regular className="text-gray-500" />
                      <Text>{selectedOrder.customer_name || 'Walk-in Customer'}</Text>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone24Regular className="text-gray-500" />
                        <Text>{selectedOrder.customer_phone}</Text>
                      </div>
                    )}
                    {selectedOrder.customer_address && (
                      <div className="flex items-center gap-2">
                        <Location24Regular className="text-gray-500" />
                        <Text>{selectedOrder.customer_address}</Text>
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card className="p-4">
                  <Title3 className="mb-3 flex items-center gap-2">
                    <Receipt24Regular />
                    Informasi Pesanan
                  </Title3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Text>Status:</Text>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="flex justify-between">
                      <Text>Pembayaran:</Text>
                      {getPaymentStatusBadge(selectedOrder.payment_status)}
                    </div>
                    <div className="flex justify-between">
                      <Text>Metode:</Text>
                      <Text className="capitalize">{selectedOrder.payment_method}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text>Tanggal:</Text>
                      <Text>{formatDate(selectedOrder.order_date)}</Text>
                    </div>
                    {selectedOrder.delivery_date && (
                      <div className="flex justify-between">
                        <Text>Pengiriman:</Text>
                        <Text>{formatDate(selectedOrder.delivery_date)}</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
              
              {/* Order Items */}
              <Card className="p-4">
                <Title3 className="mb-3">Item Pesanan</Title3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <Text weight="semibold">{item.product_name}</Text>
                        <Text size={200} className="text-gray-600 block">
                          {item.product_sku} • {item.quantity} x {formatCurrency(item.unit_price)}
                        </Text>
                      </div>
                      <Text weight="semibold">{formatCurrency(item.subtotal)}</Text>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Order Summary */}
              <Card className="p-4">
                <Title3 className="mb-3">Ringkasan</Title3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text>Subtotal:</Text>
                    <Text>{formatCurrency(selectedOrder.subtotal)}</Text>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <Text>Diskon:</Text>
                      <Text>-{formatCurrency(selectedOrder.discount_amount)}</Text>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Text>Pajak:</Text>
                    <Text>{formatCurrency(selectedOrder.tax_amount)}</Text>
                  </div>
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between">
                      <Text>Ongkir:</Text>
                      <Text>{formatCurrency(selectedOrder.shipping_cost)}</Text>
                    </div>
                  )}
                  <Divider />
                  <div className="flex justify-between">
                    <Text weight="semibold" size={400}>Total:</Text>
                    <Text weight="semibold" size={400}>{formatCurrency(selectedOrder.total_amount)}</Text>
                  </div>
                </div>
              </Card>
              
              {/* Notes */}
              {selectedOrder.notes && (
                <Card className="p-4">
                  <Title3 className="mb-3">Catatan</Title3>
                  <Text>{selectedOrder.notes}</Text>
                </Card>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="outline"
              onClick={() => handlePrintOrder(selectedOrder)}
              icon={<Print24Regular />}
            >
              Print
            </Button>
            {hasPermission('orders.update') && (
              <Button
                appearance="primary"
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleEditOrder(selectedOrder);
                }}
                icon={<Edit24Regular />}
              >
                Edit
              </Button>
            )}
            <Button
              appearance="secondary"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Tutup
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    );
  };

  // ======================================================================
  // RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4 block">Memuat data pesanan...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title1>Manajemen Pesanan</Title1>
          <Body1 className="text-gray-600 mt-1">
            Kelola pesanan dan tracking pengiriman
          </Body1>
        </div>
        {hasPermission('orders.create') && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => router.push('/orders/new')}
          >
            Pesanan Baru
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cart24Regular className="text-blue-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Total Pesanan</Text>
              <Text size={400} weight="semibold" className="block">
                {stats.total_orders}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock24Regular className="text-yellow-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Menunggu</Text>
              <Text size={400} weight="semibold" className="block">
                {stats.pending_orders}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckmarkCircle24Regular className="text-green-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Dikonfirmasi</Text>
              <Text size={400} weight="semibold" className="block">
                {stats.confirmed_orders}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CaretRight24Regular className="text-purple-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Dikirim</Text>
              <Text size={400} weight="semibold" className="block">
                {stats.shipped_orders}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Money24Regular className="text-emerald-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Total Revenue</Text>
              <Text size={400} weight="semibold" className="block">
                {formatCurrency(stats.total_revenue)}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Receipt24Regular className="text-indigo-600" />
            </div>
            <div>
              <Text size={200} className="text-gray-600">Rata-rata</Text>
              <Text size={400} weight="semibold" className="block">
                {formatCurrency(stats.average_order_value)}
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <Field label="Cari Pesanan">
            <Input
              placeholder="No. pesanan, nama, atau telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              contentBefore={<Search24Regular />}
            />
          </Field>
          
          <Field label="Status Pesanan">
            <Dropdown
              value={statusFilter}
              onOptionSelect={(e, data) => setStatusFilter(data.optionValue || 'all')}
            >
              <Option value="all">Semua Status</Option>
              <Option value="pending">Menunggu</Option>
              <Option value="confirmed">Dikonfirmasi</Option>
              <Option value="processing">Diproses</Option>
              <Option value="shipped">Dikirim</Option>
              <Option value="delivered">Selesai</Option>
              <Option value="cancelled">Dibatalkan</Option>
            </Dropdown>
          </Field>
          
          <Field label="Status Pembayaran">
            <Dropdown
              value={paymentFilter}
              onOptionSelect={(e, data) => setPaymentFilter(data.optionValue || 'all')}
            >
              <Option value="all">Semua Pembayaran</Option>
              <Option value="pending">Belum Bayar</Option>
              <Option value="paid">Lunas</Option>
              <Option value="partial">Sebagian</Option>
              <Option value="refunded">Refund</Option>
            </Dropdown>
          </Field>
          
          <Field label="Aksi">
            <div className={styles.actionButtons}>
              <Button
                appearance="outline"
                icon={<Filter24Regular />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className={styles.tableCard}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Title2>Daftar Pesanan</Title2>
            <Text className="text-gray-600">
              Menampilkan {filteredOrders.length} dari {orders.length} pesanan
            </Text>
          </div>
        </div>
        
        <DataGrid
          items={filteredOrders}
          columns={columns}
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
          <DataGridBody<Order>>
            {({ item, rowId }) => (
              <DataGridRow<Order> key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </Card>

      {/* Order Detail Dialog */}
      {renderOrderDetail()}
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default function OrdersPage() {
  return (
    <ProtectedRoute requiredPermissions={['orders.read']}>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}