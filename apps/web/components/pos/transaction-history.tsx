// ======================================================================
// KOMPONEN TRANSACTION HISTORY
// Riwayat transaksi dengan pencarian, filter, dan detail
// ======================================================================

'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Text,
  Caption1,
  Badge,
  Button,
  Input,
  Textarea,
  Field,
  Dropdown,
  Option,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Divider,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Tooltip,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import {
  Search24Regular,
  Filter24Regular,
  Receipt24Regular,
  Eye24Regular,
  Print24Regular,
  ArrowClockwise24Regular,
  Dismiss24Regular,
  Money24Regular,
  Person24Regular,
  Calendar24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  DocumentPdf24Regular
} from '@fluentui/react-icons';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface TransactionItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  notes?: string;
}

interface TransactionPayment {
  id: string;
  method: string;
  amount: number;
  reference?: string;
  change?: number;
}

interface Transaction {
  id: string;
  receiptNumber: string;
  date: Date;
  type: 'sale' | 'refund' | 'void';
  status: 'completed' | 'pending' | 'cancelled';
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  items: TransactionItem[];
  payments: TransactionPayment[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  refundedFrom?: string; // For refund transactions
  voidReason?: string; // For void transactions
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  loading?: boolean;
  onRefund?: (transactionId: string) => void;
  onVoid?: (transactionId: string, reason: string) => void;
  onPrint?: (transactionId: string) => void;
  onExport?: (transactionId: string, format: 'pdf' | 'excel') => void;
  className?: string;
}

interface FilterState {
  search: string;
  type: string;
  status: string;
  cashier: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    receiptNumber: 'RC-2024-001',
    date: new Date(Date.now() - 30 * 60 * 1000),
    type: 'sale',
    status: 'completed',
    customerId: 'cust-001',
    customerName: 'Siti Aminah',
    cashierId: 'cashier-001',
    cashierName: 'Budi Santoso',
    items: [
      {
        id: 'item-001',
        productCode: 'PRD-001',
        productName: 'Beras Premium 5kg',
        quantity: 2,
        unit: 'pcs',
        price: 75000,
        discount: 5000,
        discountType: 'fixed',
        total: 145000,
        notes: 'Promo member'
      },
      {
        id: 'item-002',
        productCode: 'PRD-002',
        productName: 'Minyak Goreng 2L',
        quantity: 1,
        unit: 'pcs',
        price: 35000,
        discount: 0,
        discountType: 'fixed',
        total: 35000
      }
    ],
    payments: [
      {
        id: 'pay-001',
        method: 'Tunai',
        amount: 200000,
        change: 20000
      }
    ],
    subtotal: 185000,
    discount: 5000,
    tax: 19800,
    total: 180000
  },
  {
    id: 'txn-002',
    receiptNumber: 'RC-2024-002',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'sale',
    status: 'completed',
    cashierId: 'cashier-001',
    cashierName: 'Budi Santoso',
    items: [
      {
        id: 'item-003',
        productCode: 'PRD-003',
        productName: 'Susu UHT 1L',
        quantity: 3,
        unit: 'pcs',
        price: 15000,
        discount: 10,
        discountType: 'percentage',
        total: 40500
      }
    ],
    payments: [
      {
        id: 'pay-002',
        method: 'QRIS',
        amount: 44550,
        reference: 'QR123456789'
      }
    ],
    subtotal: 45000,
    discount: 4500,
    tax: 4050,
    total: 44550
  },
  {
    id: 'txn-003',
    receiptNumber: 'RF-2024-001',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: 'refund',
    status: 'completed',
    customerId: 'cust-002',
    customerName: 'Ahmad Wijaya',
    cashierId: 'cashier-002',
    cashierName: 'Sari Dewi',
    refundedFrom: 'txn-001',
    items: [
      {
        id: 'item-004',
        productCode: 'PRD-001',
        productName: 'Beras Premium 5kg',
        quantity: 1,
        unit: 'pcs',
        price: 75000,
        discount: 2500,
        discountType: 'fixed',
        total: 72500
      }
    ],
    payments: [
      {
        id: 'pay-003',
        method: 'Tunai',
        amount: 79750
      }
    ],
    subtotal: 75000,
    discount: 2500,
    tax: 7975,
    total: 79750
  }
];

const cashiers = [
  { id: 'cashier-001', name: 'Budi Santoso' },
  { id: 'cashier-002', name: 'Sari Dewi' },
  { id: 'cashier-003', name: 'Andi Pratama' }
];

// ======================================================================
// TRANSACTION DETAIL COMPONENT
// ======================================================================

interface TransactionDetailProps {
  transaction: Transaction;
  onRefund?: () => void;
  onVoid?: () => void;
  onPrint?: () => void;
  onExport?: (format: 'pdf' | 'excel') => void;
}

function TransactionDetail({ 
  transaction, 
  onRefund, 
  onVoid, 
  onPrint, 
  onExport 
}: TransactionDetailProps) {
  const canRefund = transaction.type === 'sale' && transaction.status === 'completed';
  const canVoid = transaction.type === 'sale' && transaction.status === 'completed';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text size={400} weight="bold">
            {transaction.receiptNumber}
          </Text>
          <Caption1 className="text-gray-600">
            {formatDateTime(transaction.date)}
          </Caption1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            appearance="filled"
            color={
              transaction.type === 'sale' ? 'success' : 
              transaction.type === 'refund' ? 'warning' : 'danger'
            }
          >
            {transaction.type === 'sale' ? 'Penjualan' : 
             transaction.type === 'refund' ? 'Retur' : 'Void'}
          </Badge>
          <Badge 
            appearance="outline"
            color={
              transaction.status === 'completed' ? 'success' : 
              transaction.status === 'pending' ? 'warning' : 'danger'
            }
          >
            {transaction.status === 'completed' ? 'Selesai' : 
             transaction.status === 'pending' ? 'Pending' : 'Dibatalkan'}
          </Badge>
        </div>
      </div>
      
      {/* Customer & Cashier Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Person24Regular className="w-5 h-5 text-blue-600" />
            <div>
              <Text weight="semibold">Pelanggan</Text>
              <Caption1 className="text-gray-600">
                {transaction.customerName || 'Umum'}
              </Caption1>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Person24Regular className="w-5 h-5 text-green-600" />
            <div>
              <Text weight="semibold">Kasir</Text>
              <Caption1 className="text-gray-600">
                {transaction.cashierName}
              </Caption1>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Items */}
      <Card className="p-4">
        <Text weight="semibold" className="mb-4 block">Item Transaksi</Text>
        <div className="space-y-3">
          {transaction.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <Text weight="semibold">{item.productName}</Text>
                <Caption1 className="text-gray-600">
                  {item.productCode} • {item.quantity} {item.unit} × {formatCurrency(item.price)}
                </Caption1>
                {item.discount > 0 && (
                  <Caption1 className="text-red-600">
                    Diskon: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                  </Caption1>
                )}
                {item.notes && (
                  <Caption1 className="text-blue-600">
                    {item.notes}
                  </Caption1>
                )}
              </div>
              <Text weight="bold">
                {formatCurrency(item.total)}
              </Text>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Payment Summary */}
      <Card className="p-4">
        <Text weight="semibold" className="mb-4 block">Ringkasan Pembayaran</Text>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(transaction.subtotal)}</Text>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <Text>Diskon:</Text>
              <Text>-{formatCurrency(transaction.discount)}</Text>
            </div>
          )}
          <div className="flex justify-between">
            <Text>Pajak:</Text>
            <Text>{formatCurrency(transaction.tax)}</Text>
          </div>
          <Divider />
          <div className="flex justify-between">
            <Text weight="bold" size={300}>Total:</Text>
            <Text weight="bold" size={300}>{formatCurrency(transaction.total)}</Text>
          </div>
        </div>
      </Card>
      
      {/* Payment Methods */}
      <Card className="p-4">
        <Text weight="semibold" className="mb-4 block">Metode Pembayaran</Text>
        <div className="space-y-3">
          {transaction.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                <Money24Regular className="w-5 h-5" />
                <div>
                  <Text weight="semibold">{payment.method}</Text>
                  {payment.reference && (
                    <Caption1 className="text-gray-600">
                      Ref: {payment.reference}
                    </Caption1>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Text weight="bold">
                  {formatCurrency(payment.amount)}
                </Text>
                {payment.change && payment.change > 0 && (
                  <Caption1 className="text-green-600">
                    Kembalian: {formatCurrency(payment.change)}
                  </Caption1>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Additional Info */}
      {(transaction.refundedFrom || transaction.voidReason || transaction.notes) && (
        <Card className="p-4">
          <Text weight="semibold" className="mb-4 block">Informasi Tambahan</Text>
          <div className="space-y-2">
            {transaction.refundedFrom && (
              <div>
                <Text size={200} className="text-gray-600">Retur dari:</Text>
                <Text weight="semibold">{transaction.refundedFrom}</Text>
              </div>
            )}
            {transaction.voidReason && (
              <div>
                <Text size={200} className="text-gray-600">Alasan void:</Text>
                <Text weight="semibold">{transaction.voidReason}</Text>
              </div>
            )}
            {transaction.notes && (
              <div>
                <Text size={200} className="text-gray-600">Catatan:</Text>
                <Text weight="semibold">{transaction.notes}</Text>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex space-x-2">
          {onPrint && (
            <Button
              appearance="outline"
              icon={<Print24Regular />}
              onClick={onPrint}
            >
              Cetak
            </Button>
          )}
          {onExport && (
            <>
              <Button
                appearance="outline"
                icon={<DocumentPdf24Regular />}
                onClick={() => onExport('pdf')}
              >
                PDF
              </Button>
              <Button
                appearance="outline"
                onClick={() => onExport('excel')}
              >
                Excel
              </Button>
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          {canRefund && onRefund && (
            <Button
              appearance="outline"
              icon={<ArrowClockwise24Regular />}
              onClick={onRefund}
            >
              Retur
            </Button>
          )}
          {canVoid && onVoid && (
            <Button
              appearance="outline"
              icon={<Dismiss24Regular />}
              onClick={onVoid}
            >
              Void
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function TransactionHistory({
  transactions = mockTransactions,
  loading = false,
  onRefund,
  onVoid,
  onPrint,
  onExport,
  className
}: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    status: 'all',
    cashier: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          transaction.receiptNumber.toLowerCase().includes(searchLower) ||
          transaction.customerName?.toLowerCase().includes(searchLower) ||
          transaction.cashierName.toLowerCase().includes(searchLower) ||
          transaction.items.some(item => 
            item.productName.toLowerCase().includes(searchLower) ||
            item.productCode.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      // Cashier filter
      if (filters.cashier !== 'all' && transaction.cashierId !== filters.cashier) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (transaction.date < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (transaction.date > toDate) return false;
      }
      
      // Amount range filter
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (transaction.total < minAmount) return false;
      }
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (transaction.total > maxAmount) return false;
      }
      
      return true;
    });
  }, [transactions, filters]);
  
  // Table columns
  const columns: TableColumnDefinition<Transaction>[] = [
    createTableColumn<Transaction>({
      columnId: 'receiptNumber',
      compare: (a, b) => a.receiptNumber.localeCompare(b.receiptNumber),
      renderHeaderCell: () => 'No. Struk',
      renderCell: (item) => (
        <TableCellLayout>
          <div>
            <Text weight="semibold">{item.receiptNumber}</Text>
            <Caption1 className="text-gray-600">
              {formatDateTime(item.date, 'dd/MM/yyyy HH:mm')}
            </Caption1>
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'customer',
      compare: (a, b) => (a.customerName || '').localeCompare(b.customerName || ''),
      renderHeaderCell: () => 'Pelanggan',
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{item.customerName || 'Umum'}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'cashier',
      compare: (a, b) => a.cashierName.localeCompare(b.cashierName),
      renderHeaderCell: () => 'Kasir',
      renderCell: (item) => (
        <TableCellLayout>
          <Text>{item.cashierName}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Jenis',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge 
            appearance="filled"
            color={
              item.type === 'sale' ? 'success' : 
              item.type === 'refund' ? 'warning' : 'danger'
            }
          >
            {item.type === 'sale' ? 'Penjualan' : 
             item.type === 'refund' ? 'Retur' : 'Void'}
          </Badge>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          <div className="flex items-center space-x-2">
            {item.status === 'completed' && <CheckmarkCircle24Regular className="w-4 h-4 text-green-600" />}
            {item.status === 'pending' && <Warning24Regular className="w-4 h-4 text-yellow-600" />}
            {item.status === 'cancelled' && <ErrorCircle24Regular className="w-4 h-4 text-red-600" />}
            <Text size={200}>
              {item.status === 'completed' ? 'Selesai' : 
               item.status === 'pending' ? 'Pending' : 'Dibatalkan'}
            </Text>
          </div>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'total',
      compare: (a, b) => a.total - b.total,
      renderHeaderCell: () => 'Total',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">
            {formatCurrency(item.total)}
          </Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<Transaction>({
      columnId: 'actions',
      renderHeaderCell: () => 'Aksi',
      renderCell: (item) => (
        <TableCellLayout>
          <div className="flex space-x-1">
            <Tooltip content="Lihat Detail" relationship="label">
              <Button
                appearance="subtle"
                icon={<Eye24Regular />}
                size="small"
                onClick={() => {
                  setSelectedTransaction(item);
                  setShowDetailDialog(true);
                }}
              />
            </Tooltip>
            {onPrint && (
              <Tooltip content="Cetak" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Print24Regular />}
                  size="small"
                  onClick={() => onPrint(item.id)}
                />
              </Tooltip>
            )}
          </div>
        </TableCellLayout>
      )
    })
  ];
  
  const handleVoidTransaction = () => {
    if (selectedTransaction && onVoid && voidReason.trim()) {
      onVoid(selectedTransaction.id, voidReason.trim());
      setShowVoidDialog(false);
      setVoidReason('');
      setSelectedTransaction(null);
    }
  };
  
  const handleRefundTransaction = () => {
    if (selectedTransaction && onRefund) {
      onRefund(selectedTransaction.id);
      setShowDetailDialog(false);
      setSelectedTransaction(null);
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Receipt24Regular className="w-6 h-6" />
          <Text size={400} weight="semibold">Riwayat Transaksi</Text>
          <Badge appearance="outline">
            {filteredTransactions.length} transaksi
          </Badge>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Pencarian">
            <Input
              placeholder="Cari struk, pelanggan, produk..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              contentBefore={<Search24Regular />}
            />
          </Field>
          
          <Field label="Jenis Transaksi">
            <Dropdown
              value={filters.type}
              selectedOptions={[filters.type]}
              onOptionSelect={(_, data) => 
                setFilters(prev => ({ ...prev, type: data.optionValue || 'all' }))
              }
            >
              <Option value="all">Semua</Option>
              <Option value="sale">Penjualan</Option>
              <Option value="refund">Retur</Option>
              <Option value="void">Void</Option>
            </Dropdown>
          </Field>
          
          <Field label="Status">
            <Dropdown
              value={filters.status}
              selectedOptions={[filters.status]}
              onOptionSelect={(_, data) => 
                setFilters(prev => ({ ...prev, status: data.optionValue || 'all' }))
              }
            >
              <Option value="all">Semua</Option>
              <Option value="completed">Selesai</Option>
              <Option value="pending">Pending</Option>
              <Option value="cancelled">Dibatalkan</Option>
            </Dropdown>
          </Field>
          
          <Field label="Kasir">
            <Dropdown
              value={filters.cashier}
              selectedOptions={[filters.cashier]}
              onOptionSelect={(_, data) => 
                setFilters(prev => ({ ...prev, cashier: data.optionValue || 'all' }))
              }
            >
              <Option value="all">Semua Kasir</Option>
              {cashiers.map((cashier) => (
                <Option key={cashier.id} value={cashier.id}>
                  {cashier.name}
                </Option>
              ))}
            </Dropdown>
          </Field>
          
          <Field label="Tanggal Dari">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </Field>
          
          <Field label="Tanggal Sampai">
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </Field>
          
          <Field label="Jumlah Min">
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              contentAfter="Rp"
            />
          </Field>
          
          <Field label="Jumlah Max">
            <Input
              type="number"
              placeholder="Tidak terbatas"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              contentAfter="Rp"
            />
          </Field>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button
            appearance="outline"
            onClick={() => setFilters({
              search: '',
              type: 'all',
              status: 'all',
              cashier: 'all',
              dateFrom: '',
              dateTo: '',
              minAmount: '',
              maxAmount: ''
            })}
          >
            Reset Filter
          </Button>
        </div>
      </Card>
      
      {/* Transaction Table */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="medium" />
            <Text className="ml-3">Memuat transaksi...</Text>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt24Regular className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <Text className="text-gray-600">Tidak ada transaksi ditemukan</Text>
            <Caption1 className="text-gray-500">Coba ubah filter pencarian</Caption1>
          </div>
        ) : (
          <DataGrid
            items={filteredTransactions}
            columns={columns}
            sortable
            size="small"
            className="max-h-96 overflow-auto"
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Transaction>>
              {({ item, rowId }) => (
                <DataGridRow<Transaction> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </Card>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={(_, data) => setShowDetailDialog(data.open)}>
        <DialogSurface className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Detail Transaksi</span>
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setShowDetailDialog(false)}
              />
            </div>
          </DialogTitle>
          <DialogBody>
            {selectedTransaction && (
              <TransactionDetail
                transaction={selectedTransaction}
                onRefund={handleRefundTransaction}
                onVoid={() => setShowVoidDialog(true)}
                onPrint={onPrint ? () => onPrint(selectedTransaction.id) : undefined}
                onExport={onExport ? (format) => onExport(selectedTransaction.id, format) : undefined}
              />
            )}
          </DialogBody>
        </DialogSurface>
      </Dialog>
      
      {/* Void Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={(_, data) => setShowVoidDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>Void Transaksi</DialogTitle>
          <DialogBody>
            <div className="space-y-4">
              <MessageBar intent="warning">
                <MessageBarBody>
                  Transaksi yang di-void tidak dapat dikembalikan. Pastikan Anda yakin dengan tindakan ini.
                </MessageBarBody>
              </MessageBar>
              
              <Field label="Alasan Void" required>
                <Textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Masukkan alasan void transaksi"
                  rows={3}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => {
                setShowVoidDialog(false);
                setVoidReason('');
              }}
            >
              Batal
            </Button>
            <Button
              appearance="primary"
              onClick={handleVoidTransaction}
              disabled={!voidReason.trim()}
            >
              Void Transaksi
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type {
  TransactionHistoryProps,
  Transaction,
  TransactionItem,
  TransactionPayment,
  FilterState
};