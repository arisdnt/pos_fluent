'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Button,
  Text,
  Badge,
  Spinner,
  Input,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions
} from '@fluentui/react-components';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef
} from '@tanstack/react-table';
import {
  Search24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  QrCode24Regular,
  Money24Regular,
  Tag24Regular,
  Eye24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';

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

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalValue: number;
  averageMargin: number;
}

const mockProductStats: ProductStats = {
  totalProducts: 1250,
  activeProducts: 1180,
  lowStockProducts: 45,
  totalValue: 125750000,
  averageMargin: 35.5
};

const mockCategories: Category[] = [
  { id: '1', name: 'Makanan & Minuman', description: 'Produk makanan dan minuman', is_active: true },
  { id: '2', name: 'Elektronik', description: 'Perangkat elektronik', is_active: true },
  { id: '3', name: 'Pakaian', description: 'Pakaian dan aksesoris', is_active: true },
  { id: '4', name: 'Kesehatan & Kecantikan', description: 'Produk kesehatan dan kecantikan', is_active: true },
  { id: '5', name: 'Rumah Tangga', description: 'Peralatan rumah tangga', is_active: true }
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
  }
];

const columnHelper = createColumnHelper<Product>();

const productColumns: ColumnDef<Product>[] = [
  columnHelper.accessor('name', {
    id: 'product',
    header: 'Produk',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Text size={300} weight="semibold" className="text-blue-600">
              {product.name.charAt(0).toUpperCase()}
            </Text>
          </div>
          <div>
            <Text weight="semibold">{product.name}</Text>
            <Text size={200} className="text-gray-600">{product.sku}</Text>
          </div>
        </div>
      );
    },
    enableSorting: true
  }),
  columnHelper.accessor('category_name', {
    id: 'category',
    header: 'Kategori',
    cell: ({ getValue }) => (
      <div className="flex items-center gap-2">
        <Tag24Regular className="text-blue-500" />
        <Text>{getValue()}</Text>
      </div>
    ),
    enableSorting: true
  }),
  columnHelper.accessor('selling_price', {
    id: 'pricing',
    header: 'Harga & Margin',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div>
          <Text weight="semibold">{formatCurrency(product.selling_price)}</Text>
          <Text size={200} className="text-green-600">{product.margin_percent.toFixed(1)}% margin</Text>
        </div>
      );
    },
    enableSorting: true
  }),
  columnHelper.accessor('current_stock', {
    id: 'stock',
    header: 'Stok',
    cell: ({ row }) => {
      const product = row.original;
      const isLowStock = product.current_stock <= product.min_stock;
      const isHighStock = product.max_stock && product.current_stock >= product.max_stock;
      
      return (
        <div>
          <Text weight="semibold">{product.current_stock} {product.unit_name}</Text>
          <Badge 
            appearance="filled" 
            color={isLowStock ? 'danger' : isHighStock ? 'brand' : 'success'}
            size="small"
          >
            {isLowStock ? 'Stok Rendah' : isHighStock ? 'Stok Tinggi' : 'Normal'}
          </Badge>
        </div>
      );
    },
    enableSorting: true
  }),
  columnHelper.accessor('is_active', {
    id: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <Badge 
        appearance="filled" 
        color={getValue() ? 'success' : 'subtle'}
        size="small"
      >
        {getValue() ? 'Aktif' : 'Nonaktif'}
      </Badge>
    ),
    enableSorting: true
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          size="small"
          appearance="subtle"
          icon={<Edit24Regular />}
          onClick={() => console.log('Edit', row.original.id)}
        />
        <Button
          size="small"
          appearance="subtle"
          icon={<Delete24Regular />}
          onClick={() => console.log('Delete', row.original.id)}
        />
      </div>
    )
  })
];

function ProductDetail({ product }: { product: Product | null }) {
  if (!product) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-full flex items-center justify-center">
        <Text className="text-gray-500">Pilih produk untuk melihat detail</Text>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Text size={600} weight="semibold" className="text-blue-600">
            {product.name.charAt(0).toUpperCase()}
          </Text>
        </div>
        <div>
          <Text size={500} weight="semibold">{product.name}</Text>
          <Text size={300} className="text-gray-600">{product.sku}</Text>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size={200} className="text-gray-600">Kategori</Text>
            <Text weight="semibold">{product.category_name}</Text>
          </div>
          <div>
            <Text size={200} className="text-gray-600">Brand</Text>
            <Text weight="semibold">{product.brand || '-'}</Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text size={200} className="text-gray-600">Harga Beli</Text>
            <Text weight="semibold">{formatCurrency(product.cost_price)}</Text>
          </div>
          <div>
            <Text size={200} className="text-gray-600">Harga Jual</Text>
            <Text weight="semibold">{formatCurrency(product.selling_price)}</Text>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Text size={200} className="text-gray-600">Stok Saat Ini</Text>
            <Text weight="semibold">{product.current_stock} {product.unit_name}</Text>
          </div>
          <div>
            <Text size={200} className="text-gray-600">Stok Minimum</Text>
            <Text weight="semibold">{product.min_stock} {product.unit_name}</Text>
          </div>
          <div>
            <Text size={200} className="text-gray-600">Stok Maksimum</Text>
            <Text weight="semibold">{product.max_stock || '-'} {product.max_stock ? product.unit_name : ''}</Text>
          </div>
        </div>

        {product.description && (
          <div>
            <Text size={200} className="text-gray-600">Deskripsi</Text>
            <Text>{product.description}</Text>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsPageContent() {
  const [products] = useState<Product[]>(mockProducts);
  const [stats] = useState<ProductStats>(mockProductStats);
  const [categories] = useState<Category[]>(mockCategories);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return products.filter(product => {
      const matchesGlobal = !globalFilter || 
        product.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        product.sku.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(globalFilter.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);
      
      return matchesGlobal && matchesCategory && matchesStatus;
    });
  }, [products, globalFilter, categoryFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'n':
            e.preventDefault();
            setShowAddDialog(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (filteredData.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredData[0]);
    }
  }, [filteredData, selectedProduct]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Total Produk</Text>
              <Text size={600} weight="semibold">{stats.totalProducts.toLocaleString()}</Text>
            </div>
            <QrCode24Regular className="text-blue-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Produk Aktif</Text>
              <Text size={600} weight="semibold" className="text-green-600">{stats.activeProducts.toLocaleString()}</Text>
            </div>
            <Eye24Regular className="text-green-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Stok Rendah</Text>
              <Text size={600} weight="semibold" className="text-red-600">{stats.lowStockProducts.toLocaleString()}</Text>
            </div>
            <ArrowDown24Regular className="text-red-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Total Nilai</Text>
              <Text size={600} weight="semibold">{formatCurrency(stats.totalValue)}</Text>
            </div>
            <Money24Regular className="text-purple-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Rata-rata Margin</Text>
              <Text size={600} weight="semibold" className="text-green-600">{stats.averageMargin.toFixed(1)}%</Text>
            </div>
            <ArrowUp24Regular className="text-green-500 text-2xl" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search24Regular className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Cari produk... (Ctrl+K)"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Dropdown
          placeholder="Kategori"
          value={categoryFilter}
          onOptionSelect={(_, data) => setCategoryFilter(data.optionValue || 'all')}
        >
          <Option value="all">Semua Kategori</Option>
          {categories.map(category => (
            <Option key={category.id} value={category.id}>{category.name}</Option>
          ))}
        </Dropdown>
        
        <Dropdown
          placeholder="Status"
          value={statusFilter}
          onOptionSelect={(_, data) => setStatusFilter(data.optionValue || 'all')}
        >
          <Option value="all">Semua Status</Option>
          <Option value="active">Aktif</Option>
          <Option value="inactive">Nonaktif</Option>
        </Dropdown>
        
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => setShowAddDialog(true)}
        >
          Tambah Produk (Ctrl+N)
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4 p-4 font-semibold">
              {table.getHeaderGroups().map(headerGroup => (
                headerGroup.headers.map(header => (
                  <div key={header.id} className="text-left">
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </div>
                ))
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {table.getRowModel().rows.map(row => (
              <div 
                key={row.id} 
                className={`grid grid-cols-6 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  selectedProduct?.id === row.original.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedProduct(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <div key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text size={200} className="text-gray-600">
                Menampilkan {table.getRowModel().rows.length} dari {filteredData.length} produk
              </Text>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="small"
                appearance="subtle"
                icon={<ChevronLeft24Regular />}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
              <Text size={200} className="text-gray-600">
                Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
              </Text>
              <Button
                size="small"
                appearance="subtle"
                icon={<ChevronRight24Regular />}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              />
            </div>
          </div>
        </div>

        <div className="w-80">
          <ProductDetail product={selectedProduct} />
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={(_, data) => setShowAddDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>Form tambah produk akan ditambahkan di sini.</Text>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button appearance="primary" onClick={() => {
                toast.success('Produk berhasil ditambahkan!');
                setShowAddDialog(false);
              }}>
                Simpan
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <MainLayout>
        <ProductsPageContent />
      </MainLayout>
    </ProtectedRoute>
  );
}