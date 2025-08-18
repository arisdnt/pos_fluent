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
  MessageBarTitle,
  Spinner
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
        in_stock: { label: 'Stok Normal', appearance: 'success' as const },
        low_stock: { label: 'Stok Menipis', appearance: 'warning' as const },
        out_of_stock: { label: 'Habis', appearance: 'danger' as const },
        overstock: { label: 'Berlebih', appearance: 'info' as const }
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
        <Text size={200}>{formatDateTime(item.last_updated, 'dd/MM/yyyy HH:mm')}</Text>
      </TableCellLayout>
    )
  }),
  createTableColumn<InventoryItem>({
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
            title="Edit Stok"
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<History24Regular />}
            title="Riwayat Stok"
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<ArrowSwap24Regular />}
            title="Transfer Stok"
            onClick={() => handleTransferStock(item)}
          />
        </div>
      </TableCellLayout>
    )
  })
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
        in: { label: 'Masuk', appearance: 'success' as const, icon: <ArrowDownload24Regular /> },
        out: { label: 'Keluar', appearance: 'danger' as const, icon: <ArrowUpload24Regular /> },
        adjustment: { label: 'Penyesuaian', appearance: 'warning' as const, icon: <Edit24Regular /> }
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
          <Text size={200}>{formatDateTime(item.created_at, 'dd/MM/yyyy')}</Text>
          <Text size={200} className="text-gray-600 block">
            {formatDateTime(item.created_at, 'HH:mm')} - {item.created_by}
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
              <Option key={branch.id} value={branch.id} disabled={stock === 0}>
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
            <Option key={branch.id} value={branch.id}>
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
          <Text size={200}>{formatDateTime(item.created_at, 'dd/MM/yyyy HH:mm')}</Text>
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
        created_by: user?.name || 'Unknown',
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title1>Manajemen Inventori</Title1>
          <Body1 className="text-gray-600 mt-1">
            Kelola stok dan pergerakan inventori produk
          </Body1>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={handleExport}
            isLoading={isExporting}
            data={activeTab === 'inventory' ? filteredInventoryItems : filteredStockMovements}
            filename={`inventori_${activeTab}`}
          />
          <AdvancedExportButton
            onExport={handleExport}
            isLoading={isExporting}
            reportType={activeTab === 'inventory' ? 'inventory' : 'stock_movements'}
          />
          {hasPermission('inventory.create') && (
            <>
              <Button
                appearance="secondary"
                icon={<ArrowSwap24Regular />}
                onClick={() => setIsTransferDialogOpen(true)}
              >
                Transfer Stok
              </Button>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => router.push('/inventory/adjustment')}
              >
                Penyesuaian Stok
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Total Produk</Text>
              <Title2 className="text-blue-600 mt-1">
                {stats?.totalProducts || 0}
              </Title2>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Box24Regular className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Nilai Inventori</Text>
              <Title2 className="text-green-600 mt-1">
                {formatCurrency(stats?.totalValue || 0)}
              </Title2>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckmarkCircle24Regular className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Stok Menipis</Text>
              <Title2 className="text-yellow-600 mt-1">
                {stats?.lowStockItems || 0}
              </Title2>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Warning24Regular className="text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Stok Habis</Text>
              <Title2 className="text-red-600 mt-1">
                {stats?.outOfStockItems || 0}
              </Title2>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ErrorCircle24Regular className="text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size={200} className="text-gray-600">Stok Berlebih</Text>
              <Title2 className="text-blue-600 mt-1">
                {stats?.overstockItems || 0}
              </Title2>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ArrowUpload24Regular className="text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(stats?.lowStockItems || 0) > 0 && (
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>Peringatan Stok</MessageBarTitle>
            Ada {stats?.lowStockItems} produk dengan stok menipis yang perlu diperhatikan.
          </MessageBarBody>
        </MessageBar>
      )}

      {(stats?.outOfStockItems || 0) > 0 && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Stok Habis</MessageBarTitle>
            Ada {stats?.outOfStockItems} produk yang stoknya habis dan perlu segera diisi ulang.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <Field label="Pencarian">
            <Input
              placeholder="Cari produk atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              contentBefore={<Search24Regular />}
            />
          </Field>
          
          <Field label="Kategori">
            <Dropdown
              placeholder="Semua Kategori"
              value={categoryFilter}
              onOptionSelect={(e, data) => setCategoryFilter(data.optionValue || 'all')}
            >
              <Option value="all">Semua Kategori</Option>
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Dropdown>
          </Field>
          
          <Field label="Status Stok">
            <Dropdown
              placeholder="Semua Status"
              value={statusFilter}
              onOptionSelect={(e, data) => setStatusFilter(data.optionValue || 'all')}
            >
              <Option value="all">Semua Status</Option>
              <Option value="in_stock">Stok Normal</Option>
              <Option value="low_stock">Stok Menipis</Option>
              <Option value="out_of_stock">Stok Habis</Option>
              <Option value="overstock">Stok Berlebih</Option>
            </Dropdown>
          </Field>
          
          <Field label="Cabang">
            <Dropdown
              placeholder="Semua Cabang"
              value={selectedBranch}
              onOptionSelect={(e, data) => setSelectedBranch(data.optionValue || 'all')}
            >
              <Option value="all">Semua Cabang</Option>
              {mockBranches.map(branch => (
                <Option key={branch.id} value={branch.id}>{branch.name}</Option>
              ))}
            </Dropdown>
          </Field>
          
          <Field label="Tampilan">
            <Dropdown
              placeholder="Pilih Tampilan"
              value={activeTab}
              onOptionSelect={(e, data) => setActiveTab(data.optionValue as 'inventory' | 'movements' | 'transfers')}
            >
              <Option value="inventory">Data Inventori</Option>
              <Option value="movements">Riwayat Pergerakan</Option>
              <Option value="transfers">Transfer Stok</Option>
            </Dropdown>
          </Field>
        </div>
      </Card>

      {/* Data Table */}
      <Card className={styles.tableCard}>
        <CardHeader>
          <Title2>
            {activeTab === 'inventory' && 'Data Inventori'}
            {activeTab === 'movements' && 'Riwayat Pergerakan Stok'}
            {activeTab === 'transfers' && 'Transfer Stok Antar Cabang'}
          </Title2>
        </CardHeader>
        <div className="p-6 pt-0">
          {activeTab === 'inventory' && (
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
                  <DataGridRow<InventoryItem> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
          
          {activeTab === 'movements' && (
            <DataGrid
              items={filteredStockMovements}
              columns={movementColumns}
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
              <DataGridBody<StockMovement>>
                {({ item, rowId }) => (
                  <DataGridRow<StockMovement> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
          
          {activeTab === 'transfers' && (
            <DataGrid
              items={filteredStockTransfers}
              columns={transferColumns}
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
              <DataGridBody<StockTransfer>>
                {({ item, rowId }) => (
                  <DataGridRow<StockTransfer> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
        </div>
      </Card>

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
      </div>
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