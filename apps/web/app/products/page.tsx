// ======================================================================
// HALAMAN PRODUK
// Halaman manajemen produk untuk aplikasi POS Suite
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
  Box24Regular,
  Search24Regular,
  Filter24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Star24Regular,
  StarFilled24Regular,
  QrCode24Regular,
  Money24Regular,
  Tag24Regular,
  Eye24Regular,
  EyeOff24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Grid24Regular,
  List24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { formatCurrency } from '@/lib/utils/format';
import { formatDateTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { ExportButton, AdvancedExportButton } from '@/components/reports/ExportUtils';

// ======================================================================
// INTERFACES
// ======================================================================

interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id: string;
  category_name: string;
  brand?: string;
  unit_id: string;
  unit_name: string;
  cost_price: number;
  selling_price: number;
  margin_percent: number;
  tax_group_id?: string;
  tax_group_name?: string;
  min_stock: number;
  max_stock?: number;
  current_stock: number;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
}

interface TaxGroup {
  id: string;
  name: string;
  rate: number;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalValue: number;
  averageMargin: number;
  categoryDistribution: {
    [key: string]: number;
  };
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockProductStats: ProductStats = {
  totalProducts: 1250,
  activeProducts: 1180,
  lowStockProducts: 45,
  totalValue: 125750000,
  averageMargin: 35.5,
  categoryDistribution: {
    'Makanan & Minuman': 450,
    'Elektronik': 280,
    'Pakaian': 320,
    'Kesehatan & Kecantikan': 150,
    'Rumah Tangga': 50
  }
};

const mockCategories: Category[] = [
  { id: '1', name: 'Makanan & Minuman', description: 'Produk makanan dan minuman', is_active: true },
  { id: '2', name: 'Elektronik', description: 'Perangkat elektronik', is_active: true },
  { id: '3', name: 'Pakaian', description: 'Pakaian dan aksesoris', is_active: true },
  { id: '4', name: 'Kesehatan & Kecantikan', description: 'Produk kesehatan dan kecantikan', is_active: true },
  { id: '5', name: 'Rumah Tangga', description: 'Peralatan rumah tangga', is_active: true }
];

const mockUnits: Unit[] = [
  { id: '1', name: 'Pieces', symbol: 'PCS' },
  { id: '2', name: 'Kilogram', symbol: 'KG' },
  { id: '3', name: 'Liter', symbol: 'LTR' },
  { id: '4', name: 'Box', symbol: 'BOX' },
  { id: '5', name: 'Set', symbol: 'SET' }
];

const mockTaxGroups: TaxGroup[] = [
  { id: '1', name: 'PPN 11%', rate: 11 },
  { id: '2', name: 'Non-Taxable', rate: 0 }
];

const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'PRD-001',
    barcode: '1234567890123',
    name: 'Indomie Goreng',
    description: 'Mie instan rasa ayam bawang',
    category_id: '1',
    category_name: 'Makanan & Minuman',
    brand: 'Indofood',
    unit_id: '1',
    unit_name: 'PCS',
    cost_price: 2500,
    selling_price: 3500,
    margin_percent: 28.6,
    tax_group_id: '1',
    tax_group_name: 'PPN 11%',
    min_stock: 50,
    max_stock: 500,
    current_stock: 125,
    is_active: true,
    is_featured: true,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    sku: 'PRD-002',
    barcode: '1234567890124',
    name: 'Samsung Galaxy A54',
    description: 'Smartphone Android 128GB',
    category_id: '2',
    category_name: 'Elektronik',
    brand: 'Samsung',
    unit_id: '1',
    unit_name: 'PCS',
    cost_price: 4500000,
    selling_price: 5500000,
    margin_percent: 18.2,
    tax_group_id: '1',
    tax_group_name: 'PPN 11%',
    min_stock: 5,
    max_stock: 50,
    current_stock: 12,
    is_active: true,
    is_featured: false,
    created_at: '2024-01-02T09:15:00Z',
    updated_at: '2024-01-14T15:20:00Z'
  },
  {
    id: '3',
    sku: 'PRD-003',
    name: 'Kaos Polos Hitam',
    description: 'Kaos cotton combed 30s',
    category_id: '3',
    category_name: 'Pakaian',
    brand: 'Local Brand',
    unit_id: '1',
    unit_name: 'PCS',
    cost_price: 25000,
    selling_price: 45000,
    margin_percent: 44.4,
    tax_group_id: '1',
    tax_group_name: 'PPN 11%',
    min_stock: 20,
    max_stock: 200,
    current_stock: 8,
    is_active: true,
    is_featured: false,
    created_at: '2024-01-03T10:30:00Z',
    updated_at: '2024-01-12T14:10:00Z'
  },
  {
    id: '4',
    sku: 'PRD-004',
    barcode: '1234567890125',
    name: 'Wardah Lightening Serum',
    description: 'Serum pencerah wajah 17ml',
    category_id: '4',
    category_name: 'Kesehatan & Kecantikan',
    brand: 'Wardah',
    unit_id: '1',
    unit_name: 'PCS',
    cost_price: 35000,
    selling_price: 55000,
    margin_percent: 36.4,
    tax_group_id: '1',
    tax_group_name: 'PPN 11%',
    min_stock: 10,
    max_stock: 100,
    current_stock: 25,
    is_active: true,
    is_featured: true,
    created_at: '2024-01-04T11:20:00Z',
    updated_at: '2024-01-10T16:30:00Z'
  },
  {
    id: '5',
    sku: 'PRD-005',
    name: 'Panci Set Stainless',
    description: 'Set panci stainless steel 5 pcs',
    category_id: '5',
    category_name: 'Rumah Tangga',
    brand: 'Maxim',
    unit_id: '5',
    unit_name: 'SET',
    cost_price: 150000,
    selling_price: 225000,
    margin_percent: 33.3,
    tax_group_id: '1',
    tax_group_name: 'PPN 11%',
    min_stock: 5,
    max_stock: 50,
    current_stock: 15,
    is_active: false,
    is_featured: false,
    created_at: '2024-01-05T12:00:00Z',
    updated_at: '2024-01-08T09:45:00Z'
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
  filtersGrid: 'grid grid-cols-1 md:grid-cols-5 gap-4',
  tableCard: 'overflow-hidden',
  actionButtons: 'flex items-center gap-2',
  stockBadge: {
    low: 'bg-red-100 text-red-800',
    normal: 'bg-green-100 text-green-800',
    high: 'bg-blue-100 text-blue-800'
  },
  statusBadge: {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  }
};

// ======================================================================
// TABLE COLUMNS
// ======================================================================

const productColumns: TableColumnDefinition<Product>[] = [
  createTableColumn<Product>({
    columnId: 'product',
    compare: (a, b) => a.name.localeCompare(b.name),
    renderHeaderCell: () => 'Produk',
    renderCell: (item) => (
      <TableCellLayout
        media={
          <Avatar
            name={item.name}
            size={32}
            image={item.image_url ? { src: item.image_url } : undefined}
            color={item.is_featured ? 'colorful' : 'neutral'}
          />
        }
      >
        <div>
          <div className="flex items-center gap-2">
            <Text weight="semibold">{item.name}</Text>
            {item.is_featured && <Star24Regular className="w-4 h-4 text-yellow-500" />}
          </div>
          <Text size={200} className="text-gray-600 block">
            {item.sku} {item.barcode && `• ${item.barcode}`}
          </Text>
          {item.brand && (
            <Text size={200} className="text-gray-500 block">
              {item.brand}
            </Text>
          )}
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<Product>({
    columnId: 'category',
    compare: (a, b) => a.category_name.localeCompare(b.category_name),
    renderHeaderCell: () => 'Kategori',
    renderCell: (item) => (
      <TableCellLayout media={<Tag24Regular className="text-blue-500" />}>
        <Text>{item.category_name}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<Product>({
    columnId: 'pricing',
    compare: (a, b) => a.selling_price - b.selling_price,
    renderHeaderCell: () => 'Harga & Margin',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text weight="semibold">{formatCurrency(item.selling_price)}</Text>
          <Text size={200} className="text-gray-600 block">
            Modal: {formatCurrency(item.cost_price)}
          </Text>
          <Text size={200} className="text-green-600 block">
            Margin: {item.margin_percent.toFixed(1)}%
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<Product>({
    columnId: 'stock',
    compare: (a, b) => a.current_stock - b.current_stock,
    renderHeaderCell: () => 'Stok',
    renderCell: (item) => {
      const stockStatus = item.current_stock <= item.min_stock ? 'low' : 
                         item.current_stock >= (item.max_stock || 1000) ? 'high' : 'normal';
      
      return (
        <TableCellLayout>
          <div className="text-center">
            <Text weight="semibold" className={
              stockStatus === 'low' ? 'text-red-600' :
              stockStatus === 'high' ? 'text-blue-600' : 'text-green-600'
            }>
              {item.current_stock}
            </Text>
            <Text size={200} className="text-gray-600 block">
              {item.unit_name}
            </Text>
            <Badge 
              size="small" 
              className={styles.stockBadge[stockStatus]}
            >
              {stockStatus === 'low' ? 'Rendah' :
               stockStatus === 'high' ? 'Tinggi' : 'Normal'}
            </Badge>
          </div>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<Product>({
    columnId: 'tax',
    renderHeaderCell: () => 'Pajak',
    renderCell: (item) => (
      <TableCellLayout>
        <Text size={200}>
          {item.tax_group_name || 'Tidak ada'}
        </Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<Product>({
    columnId: 'status',
    compare: (a, b) => a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1,
    renderHeaderCell: () => 'Status',
    renderCell: (item) => {
      const status = item.is_active ? 'active' : 'inactive';
      return (
        <TableCellLayout>
          <Badge className={styles.statusBadge[status]}>
            {item.is_active ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<Product>({
    columnId: 'actions',
    renderHeaderCell: () => 'Aksi',
    renderCell: (item) => (
      <TableCellLayout>
        <div className={styles.actionButtons}>
          <Button
            appearance="subtle"
            size="small"
            icon={<Eye24Regular />}
            title="Lihat Detail"
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<Edit24Regular />}
            title="Edit Produk"
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<QrCode24Regular />}
            title="Cetak Barcode"
          />
        </div>
      </TableCellLayout>
    )
  })
];

// ======================================================================
// KOMPONEN KONTEN PRODUK
// ======================================================================

function ProductsPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulasi API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setStats(mockProductStats);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    if (selectedStatus) {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(product => product.is_active === isActive);
    }

    if (selectedStockStatus) {
      filtered = filtered.filter(product => {
        const stockStatus = product.current_stock <= product.min_stock ? 'low' : 
                           product.current_stock >= (product.max_stock || 1000) ? 'high' : 'normal';
        return stockStatus === selectedStockStatus;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedStatus, selectedStockStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4">Memuat data produk...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title1>Manajemen Produk</Title1>
          <Body1>Kelola produk dan inventory toko Anda</Body1>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton 
            data={filteredProducts}
            filename="produk"
            title="Ekspor Data Produk"
          />
          <Button
            appearance="secondary"
            icon={viewMode === 'grid' ? <List24Regular /> : <Grid24Regular />}
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Button>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => setShowAddDialog(true)}
          >
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size={600} weight="semibold">
                    {stats.totalProducts.toLocaleString()}
                  </Text>
                  <Text size={200} className="text-gray-600 block">
                    Total Produk
                  </Text>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Box24Regular className="text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size={600} weight="semibold">
                    {stats.activeProducts.toLocaleString()}
                  </Text>
                  <Text size={200} className="text-gray-600 block">
                    Produk Aktif
                  </Text>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Eye24Regular className="text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size={600} weight="semibold" className="text-red-600">
                    {stats.lowStockProducts}
                  </Text>
                  <Text size={200} className="text-gray-600 block">
                    Stok Rendah
                  </Text>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <ArrowDown24Regular className="text-red-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size={600} weight="semibold">
                    {formatCurrency(stats.totalValue)}
                  </Text>
                  <Text size={200} className="text-gray-600 block">
                    Nilai Inventory
                  </Text>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Money24Regular className="text-purple-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text size={600} weight="semibold">
                    {stats.averageMargin.toFixed(1)}%
                  </Text>
                  <Text size={200} className="text-gray-600 block">
                    Rata-rata Margin
                  </Text>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <ArrowUp24Regular className="text-teal-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <Field label="Cari Produk">
            <Input
              placeholder="Nama, SKU, barcode, atau brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              contentBefore={<Search24Regular />}
            />
          </Field>

          <Field label="Kategori">
            <Dropdown
              placeholder="Semua Kategori"
              value={selectedCategory}
              onOptionSelect={(e, data) => setSelectedCategory(data.optionValue || '')}
            >
              <Option value="">Semua Kategori</Option>
              {mockCategories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Dropdown>
          </Field>

          <Field label="Status">
            <Dropdown
              placeholder="Semua Status"
              value={selectedStatus}
              onOptionSelect={(e, data) => setSelectedStatus(data.optionValue || '')}
            >
              <Option value="">Semua Status</Option>
              <Option value="active">Aktif</Option>
              <Option value="inactive">Nonaktif</Option>
            </Dropdown>
          </Field>

          <Field label="Status Stok">
            <Dropdown
              placeholder="Semua Stok"
              value={selectedStockStatus}
              onOptionSelect={(e, data) => setSelectedStockStatus(data.optionValue || '')}
            >
              <Option value="">Semua Stok</Option>
              <Option value="low">Stok Rendah</Option>
              <Option value="normal">Stok Normal</Option>
              <Option value="high">Stok Tinggi</Option>
            </Dropdown>
          </Field>

          <Field label="Aksi">
            <Button
              appearance="secondary"
              icon={<Filter24Regular />}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedStockStatus('');
              }}
            >
              Reset Filter
            </Button>
          </Field>
        </div>
      </Card>

      {/* Products Table */}
      <Card className={styles.tableCard}>
        <CardHeader
          header={
            <div className="flex items-center justify-between w-full">
              <Text weight="semibold">
                Daftar Produk ({filteredProducts.length})
              </Text>
              <div className="flex items-center gap-2">
                <Text size={200} className="text-gray-600">
                  Menampilkan {filteredProducts.length} dari {products.length} produk
                </Text>
              </div>
            </div>
          }
        />
        
        {filteredProducts.length > 0 ? (
          <DataGrid
            items={filteredProducts}
            columns={productColumns}
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
            <DataGridBody<Product>>
              {({ item, rowId }) => (
                <DataGridRow<Product> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        ) : (
          <div className="text-center py-12">
            <Box24Regular className="mx-auto mb-4 text-4xl text-gray-400" />
            <Text size={500} className="block mb-2">Tidak ada produk ditemukan</Text>
            <Body1 className="text-gray-600">
              {searchTerm || selectedCategory || selectedStatus || selectedStockStatus
                ? 'Coba ubah filter pencarian Anda'
                : 'Belum ada produk yang ditambahkan'}
            </Body1>
          </div>
        )}
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(e, data) => setShowAddDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div className="space-y-4">
                <MessageBar>
                  <MessageBarBody>
                    <MessageBarTitle>Fitur dalam pengembangan</MessageBarTitle>
                    Form tambah produk akan segera tersedia.
                  </MessageBarBody>
                </MessageBar>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowAddDialog(false)}>
              Tutup
            </Button>
            <Button appearance="primary" disabled>
              Simpan
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default function ProductsPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked');
  };

  return (
    <ProtectedRoute>
      <MainLayout
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        onThemeToggle={handleThemeToggle}
        isDarkMode={false}
      >
        <ProductsPageContent />
      </MainLayout>
    </ProtectedRoute>
  );
}