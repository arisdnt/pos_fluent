// ======================================================================
// HALAMAN INVENTORY MANAGEMENT
// Manajemen stok dan inventori produk
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
  MessageBarTitle
} from '@fluentui/react-components';
import {
  Box24Regular,
  Search24Regular,
  Filter24Regular,
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  Eye24Regular,
  History24Regular,
  ArrowSwap24Regular,
  Building24Regular,
  Send24Regular
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

interface BranchStock {
  branch_id: string;
  branch_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  location: string;
  last_updated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  location: string;
  supplier: string;
  last_updated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  branch_stocks?: BranchStock[];
}

interface StockTransfer {
  id: string;
  product_id: string;
  product_name: string;
  from_branch_id: string;
  from_branch_name: string;
  to_branch_id: string;
  to_branch_name: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
  notes?: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockBranches = [
  { id: 'BR-001', name: 'Cabang Utama' },
  { id: 'BR-002', name: 'Cabang Sudirman' },
  { id: 'BR-003', name: 'Cabang Thamrin' },
  { id: 'BR-004', name: 'Cabang Kelapa Gading' }
];

const mockInventoryStats: InventoryStats = {
  totalProducts: 1250,
  totalValue: 125750000,
  lowStockItems: 12,
  outOfStockItems: 3,
  overstockItems: 8
};

const mockStockTransfers: StockTransfer[] = [
  {
    id: 'TRF-001',
    product_id: 'PRD-001',
    product_name: 'Indomie Goreng',
    from_branch_id: 'BR-001',
    from_branch_name: 'Cabang Utama',
    to_branch_id: 'BR-002',
    to_branch_name: 'Cabang Sudirman',
    quantity: 50,
    status: 'completed',
    created_at: '2024-01-15T08:00:00Z',
    created_by: 'Admin Gudang',
    notes: 'Transfer rutin mingguan'
  },
  {
    id: 'TRF-002',
    product_id: 'PRD-002',
    product_name: 'Aqua 600ml',
    from_branch_id: 'BR-001',
    from_branch_name: 'Cabang Utama',
    to_branch_id: 'BR-003',
    to_branch_name: 'Cabang Thamrin',
    quantity: 100,
    status: 'in_transit',
    created_at: '2024-01-15T10:00:00Z',
    created_by: 'Admin Gudang'
  },
  {
    id: 'TRF-003',
    product_id: 'PRD-003',
    product_name: 'Beras Premium 5kg',
    from_branch_id: 'BR-002',
    from_branch_name: 'Cabang Sudirman',
    to_branch_id: 'BR-004',
    to_branch_name: 'Cabang Kelapa Gading',
    quantity: 20,
    status: 'pending',
    created_at: '2024-01-15T11:30:00Z',
    created_by: 'Manager Cabang'
  }
];

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    product_id: 'PRD-001',
    product_name: 'Indomie Goreng',
    sku: 'IDM-GRG-001',
    category: 'Makanan Instan',
    current_stock: 150,
    minimum_stock: 50,
    maximum_stock: 500,
    unit: 'pcs',
    cost_price: 2500,
    selling_price: 3000,
    location: 'Rak A1',
    supplier: 'PT Indofood',
    last_updated: '2024-01-15T10:30:00Z',
    status: 'in_stock',
    branch_stocks: [
      {
        branch_id: 'BR-001',
        branch_name: 'Cabang Utama',
        current_stock: 150,
        minimum_stock: 50,
        maximum_stock: 500,
        location: 'Rak A1',
        last_updated: '2024-01-15T10:30:00Z',
        status: 'in_stock'
      },
      {
        branch_id: 'BR-002',
        branch_name: 'Cabang Sudirman',
        current_stock: 75,
        minimum_stock: 30,
        maximum_stock: 200,
        location: 'Rak B1',
        last_updated: '2024-01-15T09:15:00Z',
        status: 'in_stock'
      },
      {
        branch_id: 'BR-003',
        branch_name: 'Cabang Thamrin',
        current_stock: 25,
        minimum_stock: 30,
        maximum_stock: 150,
        location: 'Rak C1',
        last_updated: '2024-01-15T08:45:00Z',
        status: 'low_stock'
      },
      {
        branch_id: 'BR-004',
        branch_name: 'Cabang Kelapa Gading',
        current_stock: 100,
        minimum_stock: 40,
        maximum_stock: 300,
        location: 'Rak D1',
        last_updated: '2024-01-15T11:00:00Z',
        status: 'in_stock'
      }
    ]
  },
  {
    id: '2',
    product_id: 'PRD-002',
    product_name: 'Aqua 600ml',
    sku: 'AQU-600-001',
    category: 'Minuman',
    current_stock: 25,
    minimum_stock: 30,
    maximum_stock: 200,
    unit: 'botol',
    cost_price: 2000,
    selling_price: 3000,
    location: 'Rak B2',
    supplier: 'PT Aqua Golden Mississippi',
    last_updated: '2024-01-15T09:15:00Z',
    status: 'low_stock'
  },
  {
    id: '3',
    product_id: 'PRD-003',
    product_name: 'Beras Premium 5kg',
    sku: 'BRS-PRM-5KG',
    category: 'Bahan Pokok',
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    unit: 'karung',
    cost_price: 65000,
    selling_price: 75000,
    location: 'Gudang A',
    supplier: 'CV Beras Sejahtera',
    last_updated: '2024-01-14T16:45:00Z',
    status: 'out_of_stock'
  },
  {
    id: '4',
    product_id: 'PRD-004',
    product_name: 'Sabun Mandi Lifebuoy',
    sku: 'SBN-LFB-001',
    category: 'Kebersihan',
    current_stock: 180,
    minimum_stock: 20,
    maximum_stock: 100,
    unit: 'pcs',
    cost_price: 3500,
    selling_price: 5000,
    location: 'Rak C3',
    supplier: 'PT Unilever',
    last_updated: '2024-01-15T08:20:00Z',
    status: 'overstock'
  },
  {
    id: '5',
    product_id: 'PRD-005',
    product_name: 'Minyak Goreng Tropical 1L',
    sku: 'MYK-TRP-1L',
    category: 'Bahan Pokok',
    current_stock: 75,
    minimum_stock: 25,
    maximum_stock: 150,
    unit: 'botol',
    cost_price: 15000,
    selling_price: 18000,
    location: 'Rak A3',
    supplier: 'PT Sinar Mas',
    last_updated: '2024-01-15T11:10:00Z',
    status: 'in_stock'
  }
];

const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    product_id: 'PRD-001',
    product_name: 'Indomie Goreng',
    movement_type: 'out',
    quantity: 20,
    reference_type: 'sale',
    reference_id: 'TRX-001',
    created_at: '2024-01-15T10:30:00Z',
    created_by: 'Kasir 1'
  },
  {
    id: '2',
    product_id: 'PRD-002',
    product_name: 'Aqua 600ml',
    movement_type: 'in',
    quantity: 50,
    reference_type: 'purchase',
    reference_id: 'PO-001',
    notes: 'Pembelian rutin mingguan',
    created_at: '2024-01-15T09:15:00Z',
    created_by: 'Admin Gudang'
  },
  {
    id: '3',
    product_id: 'PRD-003',
    product_name: 'Beras Premium 5kg',
    movement_type: 'out',
    quantity: 5,
    reference_type: 'sale',
    reference_id: 'TRX-002',
    created_at: '2024-01-14T16:45:00Z',
    created_by: 'Kasir 2'
  },
  {
    id: '4',
    product_id: 'PRD-004',
    product_name: 'Sabun Mandi Lifebuoy',
    movement_type: 'adjustment',
    quantity: 10,
    reference_type: 'adjustment',
    notes: 'Koreksi stok fisik',
    created_at: '2024-01-15T08:20:00Z',
    created_by: 'Supervisor'
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
  transferForm: 'space-y-4',
  transferDialog: 'min-w-96',
  stockByBranch: 'mt-4 p-3 bg-gray-50 rounded-lg space-y-2',
  branchStock: 'flex justify-between items-center p-2 rounded',
  lowStockAlert: 'bg-yellow-100 text-yellow-800',
  outOfStockAlert: 'bg-red-100 text-red-800',
  statusBadge: {
    in_stock: 'bg-green-100 text-green-800',
    low_stock: 'bg-yellow-100 text-yellow-800',
    out_of_stock: 'bg-red-100 text-red-800',
    overstock: 'bg-blue-100 text-blue-800'
  }
};

// ======================================================================
// COLUMNS DEFINITION
// ======================================================================

const inventoryColumns: TableColumnDefinition<InventoryItem>[] = [
  createTableColumn<InventoryItem>({
    columnId: 'product',
    compare: (a, b) => a.product_name.localeCompare(b.product_name),
    renderHeaderCell: () => 'Produk',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text weight="semibold">{item.product_name}</Text>
          <Text size={200} className="text-gray-600 block">
            SKU: {item.sku}
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
    columnId: 'category',
    compare: (a, b) => a.category.localeCompare(b.category),
    renderHeaderCell: () => 'Kategori',
    renderCell: (item) => (
      <TableCellLayout>
        <Badge appearance="outline">{item.category}</Badge>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
    columnId: 'stock',
    compare: (a, b) => a.current_stock - b.current_stock,
    renderHeaderCell: () => 'Stok',
    renderCell: (item) => (
      <TableCellLayout>
        <div className="text-center">
          <Text weight="semibold" className={cn(
            item.status === 'out_of_stock' && 'text-red-600',
            item.status === 'low_stock' && 'text-yellow-600',
            item.status === 'overstock' && 'text-blue-600'
          )}>
            {item.current_stock} {item.unit}
          </Text>
          <Text size={200} className="text-gray-600 block">
            Min: {item.minimum_stock} | Max: {item.maximum_stock}
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
    columnId: 'status',
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => 'Status',
    renderCell: (item) => {
      const statusConfig = {
        in_stock: { label: 'Stok Normal', appearance: 'tint' as const },
        low_stock: { label: 'Stok Menipis', appearance: 'outline' as const },
        out_of_stock: { label: 'Habis', appearance: 'filled' as const },
        overstock: { label: 'Berlebih', appearance: 'ghost' as const }
      };
      
      const config = statusConfig[item.status];
      
      return (
        <TableCellLayout>
          <Badge appearance={config.appearance}>{config.label}</Badge>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<InventoryItem>({
    columnId: 'price',
    compare: (a, b) => a.selling_price - b.selling_price,
    renderHeaderCell: () => 'Harga',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text weight="semibold">{formatCurrency(item.selling_price)}</Text>
          <Text size={200} className="text-gray-600 block">
            HPP: {formatCurrency(item.cost_price)}
          </Text>
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
    columnId: 'location',
    compare: (a, b) => a.location.localeCompare(b.location),
    renderHeaderCell: () => 'Lokasi',
    renderCell: (item) => (
      <TableCellLayout>
        <Text>{item.location}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
    columnId: 'updated',
    compare: (a, b) => new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime(),
    renderHeaderCell: () => 'Terakhir Update',
    renderCell: (item) => (
      <TableCellLayout>
        <Text size={200}>{formatDateTime(item.last_updated, 'medium')}</Text>
      </TableCellLayout>
    )
  }),

];

const movementColumns: TableColumnDefinition<StockMovement>[] = [
  createTableColumn<StockMovement>({
    columnId: 'product',
    compare: (a, b) => a.product_name.localeCompare(b.product_name),
    renderHeaderCell: () => 'Produk',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold">{item.product_name}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockMovement>({
    columnId: 'type',
    compare: (a, b) => a.movement_type.localeCompare(b.movement_type),
    renderHeaderCell: () => 'Jenis',
    renderCell: (item) => {
      const typeConfig = {
        in: { label: 'Masuk', appearance: 'tint' as const, icon: <ArrowDownload24Regular /> },
        out: { label: 'Keluar', appearance: 'filled' as const, icon: <ArrowUpload24Regular /> },
        adjustment: { label: 'Penyesuaian', appearance: 'outline' as const, icon: <Edit24Regular /> }
      };
      
      const config = typeConfig[item.movement_type];
      
      return (
        <TableCellLayout media={config.icon}>
          <Badge appearance={config.appearance}>{config.label}</Badge>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<StockMovement>({
    columnId: 'quantity',
    compare: (a, b) => a.quantity - b.quantity,
    renderHeaderCell: () => 'Jumlah',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold" className={cn(
          item.movement_type === 'in' && 'text-green-600',
          item.movement_type === 'out' && 'text-red-600',
          item.movement_type === 'adjustment' && 'text-yellow-600'
        )}>
          {item.movement_type === 'in' ? '+' : item.movement_type === 'out' ? '-' : '±'}{item.quantity}
        </Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockMovement>({
    columnId: 'reference',
    compare: (a, b) => a.reference_type.localeCompare(b.reference_type),
    renderHeaderCell: () => 'Referensi',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text>{item.reference_type}</Text>
          {item.reference_id && (
            <Text size={200} className="text-gray-600 block">
              {item.reference_id}
            </Text>
          )}
        </div>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockMovement>({
    columnId: 'notes',
    renderHeaderCell: () => 'Catatan',
    renderCell: (item) => (
      <TableCellLayout>
        <Text size={200}>{item.notes || '-'}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockMovement>({
    columnId: 'created',
    compare: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    renderHeaderCell: () => 'Waktu',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text size={200}>{formatDateTime(item.created_at, 'short')}</Text>
          <Text size={200} className="text-gray-600 block">
            {formatDateTime(item.created_at, 'short')} - {item.created_by}
          </Text>
        </div>
      </TableCellLayout>
    )
  })
];

// ======================================================================
// TRANSFER STOCK FORM COMPONENT
// ======================================================================

interface TransferStockFormProps {
  product: InventoryItem | null;
  branches: { id: string; name: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function TransferStockForm({ product, branches, onSubmit, onCancel }: TransferStockFormProps) {
  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !fromBranch || !toBranch || !quantity) {
      return;
    }

    setIsSubmitting(true);
    
    const fromBranchData = branches.find(b => b.id === fromBranch);
    const toBranchData = branches.find(b => b.id === toBranch);
    
    const transferData = {
      product_id: product.product_id,
      product_name: product.product_name,
      from_branch_id: fromBranch,
      from_branch_name: fromBranchData?.name || '',
      to_branch_id: toBranch,
      to_branch_name: toBranchData?.name || '',
      quantity: parseInt(quantity),
      notes
    };
    
    await onSubmit(transferData);
    setIsSubmitting(false);
  };

  const availableStock = product?.branch_stocks?.find(bs => bs.branch_id === fromBranch)?.current_stock || 0;
  const maxQuantity = Math.min(availableStock, parseInt(quantity) || 0);

  return (
    <form onSubmit={handleSubmit} className={styles.transferForm}>
      {product && (
        <Field label="Produk">
          <Input value={`${product.product_name} (${product.sku})`} readOnly />
        </Field>
      )}
      
      <Field label="Dari Cabang" required>
        <Dropdown
          placeholder="Pilih cabang asal"
          value={fromBranch}
          onOptionSelect={(e, data) => setFromBranch(data.optionValue || '')}
        >
          {branches.map(branch => {
            const branchStock = product?.branch_stocks?.find(bs => bs.branch_id === branch.id);
            const stock = branchStock?.current_stock || 0;
            return (
              <Option key={branch.id} value={branch.id} text={`${branch.name} (Stok: ${stock})`} disabled={stock === 0}>
                {branch.name} (Stok: {stock})
              </Option>
            );
          })}
        </Dropdown>
      </Field>
      
      <Field label="Ke Cabang" required>
        <Dropdown
          placeholder="Pilih cabang tujuan"
          value={toBranch}
          onOptionSelect={(e, data) => setToBranch(data.optionValue || '')}
        >
          {branches.filter(b => b.id !== fromBranch).map(branch => (
            <Option key={branch.id} value={branch.id} text={branch.name}>
              {branch.name}
            </Option>
          ))}
        </Dropdown>
      </Field>
      
      <Field 
        label={`Jumlah Transfer ${fromBranch ? `(Tersedia: ${availableStock})` : ''}`} 
        required
      >
        <Input
          type="number"
          placeholder="Masukkan jumlah"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          max={availableStock.toString()}
        />
      </Field>
      
      <Field label="Catatan">
        <Textarea
          placeholder="Catatan transfer (opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </Field>
      
      {fromBranch && (
        <div className={styles.stockByBranch}>
          <Text size={200} weight="semibold">Stok per Cabang:</Text>
          {product?.branch_stocks?.map(bs => (
            <div key={bs.branch_id} className={cn(
              styles.branchStock,
              bs.status === 'low_stock' && styles.lowStockAlert,
              bs.status === 'out_of_stock' && styles.outOfStockAlert
            )}>
              <Text size={200} weight="semibold">{bs.branch_name}</Text>
              <Text size={200}>Stok: {bs.current_stock} {product.unit}</Text>
              <Text size={200}>Lokasi: {bs.location}</Text>
            </div>
          ))}
        </div>
      )}
      
      <DialogActions>
        <Button appearance="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button 
          type="submit" 
          appearance="primary" 
          disabled={!product || !fromBranch || !toBranch || !quantity || isSubmitting || parseInt(quantity) > availableStock}
          icon={isSubmitting ? <Spinner size="tiny" /> : <Send24Regular />}
        >
          {isSubmitting ? 'Memproses...' : 'Buat Transfer'}
        </Button>
      </DialogActions>
    </form>
  );
}

// ======================================================================
// TRANSFER COLUMNS
// ======================================================================

const transferColumns: TableColumnDefinition<StockTransfer>[] = [
  createTableColumn<StockTransfer>({
    columnId: 'product',
    compare: (a, b) => a.product_name.localeCompare(b.product_name),
    renderHeaderCell: () => 'Produk',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold">{item.product_name}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockTransfer>({
    columnId: 'from_branch',
    compare: (a, b) => a.from_branch_name.localeCompare(b.from_branch_name),
    renderHeaderCell: () => 'Dari Cabang',
    renderCell: (item) => (
      <TableCellLayout>
        <Text>{item.from_branch_name}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockTransfer>({
    columnId: 'to_branch',
    compare: (a, b) => a.to_branch_name.localeCompare(b.to_branch_name),
    renderHeaderCell: () => 'Ke Cabang',
    renderCell: (item) => (
      <TableCellLayout>
        <Text>{item.to_branch_name}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockTransfer>({
    columnId: 'quantity',
    compare: (a, b) => a.quantity - b.quantity,
    renderHeaderCell: () => 'Jumlah',
    renderCell: (item) => (
      <TableCellLayout>
        <Text weight="semibold">{item.quantity}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<StockTransfer>({
    columnId: 'status',
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => 'Status',
    renderCell: (item) => {
      const statusConfig = {
        pending: { color: 'warning', text: 'Menunggu' },
        in_transit: { color: 'informative', text: 'Dalam Perjalanan' },
        completed: { color: 'success', text: 'Selesai' },
        cancelled: { color: 'danger', text: 'Dibatalkan' }
      };
      const config = statusConfig[item.status];
      return (
        <TableCellLayout>
          <Badge color={config.color as any}>{config.text}</Badge>
        </TableCellLayout>
      );
    }
  }),
  createTableColumn<StockTransfer>({
    columnId: 'created',
    compare: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    renderHeaderCell: () => 'Dibuat',
    renderCell: (item) => (
      <TableCellLayout>
        <div>
          <Text size={200}>{formatDateTime(item.created_at, 'medium')}</Text>
          <Text size={200} className="text-gray-600 block">{item.created_by}</Text>
        </div>
      </TableCellLayout>
    )
  })
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function InventoryPageContent() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'transfers'>('inventory');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  
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
      
      setStats(mockInventoryStats);
      setInventoryItems(mockInventoryItems);
      setStockMovements(mockStockMovements);
      setStockTransfers(mockStockTransfers);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferStock = (product: InventoryItem) => {
    setSelectedProduct(product);
    setIsTransferDialogOpen(true);
  };

  const handleInventoryItemSelect = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
  };

  const handleInventoryItemEdit = (item: InventoryItem) => {
    console.log('Edit inventory item:', item);
    // TODO: Implement edit functionality
  };

  const handleInventoryItemDelete = (item: InventoryItem) => {
    console.log('Delete inventory item:', item);
    // TODO: Implement delete functionality
  };

  const handleCreateTransfer = async (transferData: any) => {
    try {
      // Simulasi API call untuk membuat transfer
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTransfer: StockTransfer = {
        id: `TRF-${Date.now()}`,
        product_id: transferData.product_id,
        product_name: transferData.product_name,
        from_branch_id: transferData.from_branch_id,
        from_branch_name: transferData.from_branch_name,
        to_branch_id: transferData.to_branch_id,
        to_branch_name: transferData.to_branch_name,
        quantity: transferData.quantity,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: user?.full_name || 'Unknown',
        notes: transferData.notes
      };
      
      setStockTransfers(prev => [newTransfer, ...prev]);
      setIsTransferDialogOpen(false);
      setSelectedProduct(null);
      
      console.log('Transfer created:', newTransfer);
    } catch (error) {
      console.error('Error creating transfer:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    
    try {
      // Simulasi export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        type: activeTab === 'inventory' ? 'inventory' : 'stock_movements',
        format,
        data: activeTab === 'inventory' ? filteredInventoryItems : filteredStockMovements,
        filters: {
          search: searchQuery,
          category: categoryFilter,
          status: statusFilter
        }
      };
      
      console.log('Exporting:', exportData);
      
      // Simulasi download
      const filename = `${activeTab}_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
      console.log(`File downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderInventoryDetail = () => {
    if (!selectedInventoryItem) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <Box24Regular className="mx-auto mb-4 text-gray-400" style={{ fontSize: '48px' }} />
            <Text size={400} className="text-gray-600">Pilih item inventori untuk melihat detail</Text>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <Title2>{selectedInventoryItem.product_name}</Title2>
          <Text className="text-gray-600">SKU: {selectedInventoryItem.sku}</Text>
        </div>

        {/* Informasi Produk */}
        <div className="space-y-4">
          <div>
            <Text weight="semibold" className="block mb-2">Informasi Produk</Text>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Kategori:</Text>
                <Text>{selectedInventoryItem.category}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Unit:</Text>
                <Text>{selectedInventoryItem.unit}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Supplier:</Text>
                <Text>{selectedInventoryItem.supplier}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Lokasi:</Text>
                <Text>{selectedInventoryItem.location}</Text>
              </div>
            </div>
          </div>

          {/* Informasi Stok */}
          <div>
            <Text weight="semibold" className="block mb-2">Informasi Stok</Text>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Stok Saat Ini:</Text>
                <Text weight="semibold" className={cn(
                  selectedInventoryItem.status === 'out_of_stock' && 'text-red-600',
                  selectedInventoryItem.status === 'low_stock' && 'text-yellow-600',
                  selectedInventoryItem.status === 'overstock' && 'text-blue-600'
                )}>
                  {selectedInventoryItem.current_stock} {selectedInventoryItem.unit}
                </Text>
              </div>
              <div>
                <Text className="text-gray-600">Status:</Text>
                <Badge appearance={selectedInventoryItem.status === 'in_stock' ? 'filled' : 'outline'} 
                       color={selectedInventoryItem.status === 'out_of_stock' ? 'danger' : 
                              selectedInventoryItem.status === 'low_stock' ? 'warning' : 
                              selectedInventoryItem.status === 'overstock' ? 'informative' : 'success'}>
                  {selectedInventoryItem.status === 'in_stock' ? 'Tersedia' :
                   selectedInventoryItem.status === 'low_stock' ? 'Stok Rendah' :
                   selectedInventoryItem.status === 'out_of_stock' ? 'Habis' : 'Overstock'}
                </Badge>
              </div>
              <div>
                <Text className="text-gray-600">Minimum Stok:</Text>
                <Text>{selectedInventoryItem.minimum_stock} {selectedInventoryItem.unit}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Maximum Stok:</Text>
                <Text>{selectedInventoryItem.maximum_stock} {selectedInventoryItem.unit}</Text>
              </div>
            </div>
          </div>

          {/* Informasi Harga */}
          <div>
            <Text weight="semibold" className="block mb-2">Informasi Harga</Text>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Text className="text-gray-600">Harga Pokok:</Text>
                <Text weight="semibold">{formatCurrency(selectedInventoryItem.cost_price)}</Text>
              </div>
              <div>
                <Text className="text-gray-600">Harga Jual:</Text>
                <Text weight="semibold">{formatCurrency(selectedInventoryItem.selling_price)}</Text>
              </div>
            </div>
          </div>

          {/* Stok per Cabang */}
          {selectedInventoryItem.branch_stocks && selectedInventoryItem.branch_stocks.length > 0 && (
            <div>
              <Text weight="semibold" className="block mb-2">Stok per Cabang</Text>
              <div className="space-y-2">
                {selectedInventoryItem.branch_stocks.map((branchStock) => (
                  <div key={branchStock.branch_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <Text weight="semibold">{branchStock.branch_name}</Text>
                      <Text size={200} className="text-gray-600">{branchStock.location}</Text>
                    </div>
                    <div className="text-right">
                      <Text weight="semibold" className={cn(
                        branchStock.status === 'out_of_stock' && 'text-red-600',
                        branchStock.status === 'low_stock' && 'text-yellow-600',
                        branchStock.status === 'overstock' && 'text-blue-600'
                      )}>
                        {branchStock.current_stock} {selectedInventoryItem.unit}
                      </Text>
                      <Text size={200} className="text-gray-600">
                        Min: {branchStock.minimum_stock} | Max: {branchStock.maximum_stock}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <Text className="text-gray-600 text-sm">
              Terakhir diperbarui: {formatDateTime(selectedInventoryItem.last_updated, 'medium')}
            </Text>
          </div>
        </div>
      </div>
    );
};

  const renderLeftContent = () => {
    return (
      <div className="space-y-6">
        {/* Statistik Inventori */}
        <div className={styles.statsGrid}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Box24Regular className="text-blue-600" />
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Total Produk</Text>
                  <Title2>{stats?.totalProducts.toLocaleString() || '0'}</Title2>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckmarkCircle24Regular className="text-green-600" />
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Nilai Total</Text>
                  <Title2>{formatCurrency(stats?.totalValue || 0)}</Title2>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Warning24Regular className="text-yellow-600" />
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Stok Rendah</Text>
                  <Title2 className="text-yellow-600">{stats?.lowStockItems || 0}</Title2>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ErrorCircle24Regular className="text-red-600" />
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Stok Habis</Text>
                  <Title2 className="text-red-600">{stats?.outOfStockItems || 0}</Title2>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowUpload24Regular className="text-blue-600" />
                </div>
                <div>
                  <Text size={200} className="text-gray-600">Overstock</Text>
                  <Title2 className="text-blue-600">{stats?.overstockItems || 0}</Title2>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Filter */}
        <Card className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <Field label="Pencarian">
              <Input
                placeholder="Cari produk atau SKU..."
                contentBefore={<Search24Regular />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Field>
            <Field label="Kategori">
              <Dropdown
                placeholder="Semua Kategori"
                value={categoryFilter}
                onOptionSelect={(_, data) => setCategoryFilter(data.optionValue || 'all')}
              >
                <Option value="all" text="Semua Kategori">Semua Kategori</Option>
                {categories.map(category => (
                  <Option key={category} value={category} text={category}>{category}</Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Status Stok">
              <Dropdown
                placeholder="Semua Status"
                value={statusFilter}
                onOptionSelect={(_, data) => setStatusFilter(data.optionValue || 'all')}
              >
                <Option value="all" text="Semua Status">Semua Status</Option>
            <Option value="in_stock" text="Tersedia">Tersedia</Option>
            <Option value="low_stock" text="Stok Rendah">Stok Rendah</Option>
            <Option value="out_of_stock" text="Stok Habis">Stok Habis</Option>
            <Option value="overstock" text="Overstock">Overstock</Option>
              </Dropdown>
            </Field>
            <Field label="Cabang">
              <Dropdown
                placeholder="Semua Cabang"
                value={selectedBranch}
                onOptionSelect={(_, data) => setSelectedBranch(data.optionValue || 'all')}
              >
                <Option value="all" text="Semua Cabang">Semua Cabang</Option>
                {mockBranches.map(branch => (
                  <Option key={branch.id} value={branch.id} text={branch.name}>{branch.name}</Option>
                ))}
              </Dropdown>
            </Field>
          </div>
        </Card>

        {/* Tabel Inventori */}
        <Card className={styles.tableCard}>
          <DataGrid
            items={filteredInventoryItems}
            columns={inventoryColumns}
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
            <DataGridBody<InventoryItem>>
              {({ item, rowId }) => (
                <DataGridRow<InventoryItem>
                  key={rowId}
                  onClick={() => handleInventoryItemSelect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </Card>
      </div>
    );
  };

  // ======================================================================
  // COMPUTED VALUES
  // ======================================================================

  const filteredInventoryItems = inventoryItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    // Filter berdasarkan cabang jika dipilih
    const matchesBranch = selectedBranch === 'all' || 
      (item.branch_stocks && item.branch_stocks.some(bs => bs.branch_id === selectedBranch));
    
    return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
  });

  const filteredStockMovements = stockMovements.filter(movement => {
    const matchesSearch = !searchQuery || 
      movement.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const filteredStockTransfers = stockTransfers.filter(transfer => {
    const matchesSearch = !searchQuery || 
      transfer.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBranch = selectedBranch === 'all' || 
      transfer.from_branch_id === selectedBranch || 
      transfer.to_branch_id === selectedBranch;
    
    return matchesSearch && matchesBranch;
  });

  const categories = Array.from(new Set(inventoryItems.map(item => item.category)));

  // ======================================================================
  // RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4 block">Memuat data inventori...</Text>
        </div>
      </div>
    );
  }

  return (
    <>
      <TwoColumnLayout
        title="Manajemen Inventori"
        searchPlaceholder="Cari produk atau SKU..."
        onSearch={setSearchQuery}
        onAdd={() => router.push('/inventory/adjustment')}
        addButtonText="Penyesuaian Stok"
        leftContent={renderLeftContent()}
        selectedItem={selectedInventoryItem}
        onEdit={selectedInventoryItem ? () => handleInventoryItemEdit(selectedInventoryItem) : undefined}
        onDelete={selectedInventoryItem ? () => handleInventoryItemDelete(selectedInventoryItem) : undefined}
        rightContent={renderInventoryDetail()}
      />

      {/* Transfer Stock Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={(e, data) => setIsTransferDialogOpen(data.open)}>
        <DialogSurface className={styles.transferDialog}>
          <DialogTitle>Transfer Stok Antar Cabang</DialogTitle>
          <DialogContent>
            <TransferStockForm
              product={selectedProduct}
              branches={mockBranches}
              onSubmit={handleCreateTransfer}
              onCancel={() => {
                setIsTransferDialogOpen(false);
                setSelectedProduct(null);
              }}
            />
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </>
  );
  }

// ======================================================================
// EXPORT
// ======================================================================

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPermissions={['inventory.read']}>
      <InventoryPageContent />
    </ProtectedRoute>
  );
}