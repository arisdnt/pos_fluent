// ======================================================================
// KOMPONEN SHIFT MANAGEMENT
// Manajemen sesi kasir (buka/tutup shift, laporan kas)
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Card,
  Text,
  Caption1,
  Badge,
  Input,
  Field,
  Textarea,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
  Tooltip,
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
  Clock24Regular,
  Money24Regular,
  Receipt24Regular,
  Person24Regular,
  Calculator24Regular,
  Print24Regular,
  Save24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  ArrowClockwise24Regular,
  Eye24Regular,
  DocumentPdf24Regular
} from '@fluentui/react-icons';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface CashDenomination {
  value: number;
  count: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'digital';
  amount: number;
  transactionCount: number;
}

interface ShiftTransaction {
  id: string;
  time: Date;
  type: 'sale' | 'refund' | 'void';
  amount: number;
  paymentMethod: string;
  customerName?: string;
  items: number;
  cashier: string;
}

interface ShiftData {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'closed';
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalRefunds: number;
  totalVoids: number;
  transactionCount: number;
  paymentMethods: PaymentMethod[];
  transactions: ShiftTransaction[];
  notes?: string;
}

interface ShiftManagementProps {
  currentShift?: ShiftData | null;
  onShiftStart: (openingCash: number, notes?: string) => Promise<void>;
  onShiftEnd: (closingData: {
    closingCash: number;
    denominations: CashDenomination[];
    notes?: string;
  }) => Promise<void>;
  onPrintReport: (shiftId: string) => void;
  onExportReport: (shiftId: string, format: 'pdf' | 'excel') => void;
  className?: string;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const CASH_DENOMINATIONS = [
  { value: 100000, count: 0, total: 0 },
  { value: 50000, count: 0, total: 0 },
  { value: 20000, count: 0, total: 0 },
  { value: 10000, count: 0, total: 0 },
  { value: 5000, count: 0, total: 0 },
  { value: 2000, count: 0, total: 0 },
  { value: 1000, count: 0, total: 0 },
  { value: 500, count: 0, total: 0 },
  { value: 200, count: 0, total: 0 },
  { value: 100, count: 0, total: 0 }
];

const mockCurrentShift: ShiftData = {
  id: 'shift-001',
  cashierId: 'cashier-001',
  cashierName: 'Budi Santoso',
  startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  status: 'active',
  openingCash: 500000,
  totalSales: 2450000,
  totalRefunds: 125000,
  totalVoids: 50000,
  transactionCount: 47,
  paymentMethods: [
    { id: 'cash', name: 'Tunai', type: 'cash', amount: 1200000, transactionCount: 25 },
    { id: 'card', name: 'Kartu Debit/Kredit', type: 'card', amount: 800000, transactionCount: 15 },
    { id: 'qris', name: 'QRIS', type: 'digital', amount: 450000, transactionCount: 7 }
  ],
  transactions: [
    {
      id: 'txn-001',
      time: new Date(Date.now() - 30 * 60 * 1000),
      type: 'sale',
      amount: 125000,
      paymentMethod: 'Tunai',
      customerName: 'Siti Aminah',
      items: 3,
      cashier: 'Budi Santoso'
    },
    {
      id: 'txn-002',
      time: new Date(Date.now() - 45 * 60 * 1000),
      type: 'refund',
      amount: 75000,
      paymentMethod: 'QRIS',
      items: 1,
      cashier: 'Budi Santoso'
    }
  ]
};

// ======================================================================
// CASH COUNTING COMPONENT
// ======================================================================

interface CashCountingProps {
  denominations: CashDenomination[];
  onChange: (denominations: CashDenomination[]) => void;
  title: string;
  readonly?: boolean;
}

function CashCounting({ denominations, onChange, title, readonly = false }: CashCountingProps) {
  const handleCountChange = (index: number, count: number) => {
    if (readonly) return;
    
    const newDenominations = [...denominations];
    newDenominations[index] = {
      ...newDenominations[index],
      count: Math.max(0, count),
      total: newDenominations[index].value * Math.max(0, count)
    };
    onChange(newDenominations);
  };
  
  const totalCash = denominations.reduce((sum, denom) => sum + denom.total, 0);
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Text weight="semibold">{title}</Text>
        <Badge appearance="outline">
          Total: {formatCurrency(totalCash)}
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {denominations.map((denom, index) => (
          <div key={denom.value} className="flex items-center space-x-3 p-2 border rounded">
            <div className="w-20">
              <Text size={200} weight="semibold">
                {formatCurrency(denom.value)}
              </Text>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                value={denom.count.toString()}
                onChange={(e) => handleCountChange(index, parseInt(e.target.value) || 0)}
                min="0"
                size="small"
                disabled={readonly}
                placeholder="0"
              />
            </div>
            <div className="w-24 text-right">
              <Text size={200}>
                {formatCurrency(denom.total)}
              </Text>
            </div>
          </div>
        ))}
      </div>
      
      <Divider className="my-3" />
      
      <div className="flex justify-between items-center">
        <Text weight="semibold">Total Kas:</Text>
        <Text weight="bold" className="text-lg text-blue-600">
          {formatCurrency(totalCash)}
        </Text>
      </div>
    </Card>
  );
}

// ======================================================================
// SHIFT REPORT COMPONENT
// ======================================================================

interface ShiftReportProps {
  shift: ShiftData;
  onPrint: () => void;
  onExport: (format: 'pdf' | 'excel') => void;
}

function ShiftReport({ shift, onPrint, onExport }: ShiftReportProps) {
  const columns: TableColumnDefinition<ShiftTransaction>[] = [
    createTableColumn<ShiftTransaction>({
      columnId: 'time',
      compare: (a, b) => a.time.getTime() - b.time.getTime(),
      renderHeaderCell: () => 'Waktu',
      renderCell: (item) => (
        <TableCellLayout>
          <Text size={200}>{formatDateTime(item.time, 'HH:mm')}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<ShiftTransaction>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Jenis',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge 
            appearance={item.type === 'sale' ? 'filled' : 'outline'}
            color={item.type === 'sale' ? 'success' : item.type === 'refund' ? 'warning' : 'danger'}
          >
            {item.type === 'sale' ? 'Penjualan' : item.type === 'refund' ? 'Retur' : 'Void'}
          </Badge>
        </TableCellLayout>
      )
    }),
    createTableColumn<ShiftTransaction>({
      columnId: 'amount',
      compare: (a, b) => a.amount - b.amount,
      renderHeaderCell: () => 'Jumlah',
      renderCell: (item) => (
        <TableCellLayout>
          <Text size={200} weight="semibold">
            {formatCurrency(item.amount)}
          </Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<ShiftTransaction>({
      columnId: 'paymentMethod',
      compare: (a, b) => a.paymentMethod.localeCompare(b.paymentMethod),
      renderHeaderCell: () => 'Pembayaran',
      renderCell: (item) => (
        <TableCellLayout>
          <Text size={200}>{item.paymentMethod}</Text>
        </TableCellLayout>
      )
    }),
    createTableColumn<ShiftTransaction>({
      columnId: 'customer',
      compare: (a, b) => (a.customerName || '').localeCompare(b.customerName || ''),
      renderHeaderCell: () => 'Pelanggan',
      renderCell: (item) => (
        <TableCellLayout>
          <Text size={200}>{item.customerName || '-'}</Text>
        </TableCellLayout>
      )
    })
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text size={400} weight="bold">Laporan Sesi Kasir</Text>
          <Caption1 className="text-gray-600">
            {formatDateTime(shift.startTime)} - {shift.endTime ? formatDateTime(shift.endTime) : 'Aktif'}
          </Caption1>
        </div>
        <div className="flex space-x-2">
          <Button
            appearance="outline"
            icon={<Print24Regular />}
            onClick={onPrint}
          >
            Cetak
          </Button>
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
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Receipt24Regular className="w-8 h-8 text-blue-600" />
            <div>
              <Text weight="bold" className="block">
                {shift.transactionCount}
              </Text>
              <Caption1 className="text-gray-600">Transaksi</Caption1>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Money24Regular className="w-8 h-8 text-green-600" />
            <div>
              <Text weight="bold" className="block">
                {formatCurrency(shift.totalSales)}
              </Text>
              <Caption1 className="text-gray-600">Penjualan</Caption1>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <ArrowClockwise24Regular className="w-8 h-8 text-orange-600" />
            <div>
              <Text weight="bold" className="block">
                {formatCurrency(shift.totalRefunds)}
              </Text>
              <Caption1 className="text-gray-600">Retur</Caption1>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Calculator24Regular className="w-8 h-8 text-purple-600" />
            <div>
              <Text weight="bold" className="block">
                {formatCurrency(shift.totalSales - shift.totalRefunds - shift.totalVoids)}
              </Text>
              <Caption1 className="text-gray-600">Netto</Caption1>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Payment Methods */}
      <Card className="p-4">
        <Text weight="semibold" className="mb-4 block">Metode Pembayaran</Text>
        <div className="space-y-3">
          {shift.paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                <Money24Regular className="w-5 h-5" />
                <div>
                  <Text weight="semibold">{method.name}</Text>
                  <Caption1 className="text-gray-600">
                    {method.transactionCount} transaksi
                  </Caption1>
                </div>
              </div>
              <Text weight="bold">
                {formatCurrency(method.amount)}
              </Text>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Cash Summary */}
      {shift.status === 'closed' && (
        <Card className="p-4">
          <Text weight="semibold" className="mb-4 block">Ringkasan Kas</Text>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text>Kas Awal:</Text>
              <Text weight="semibold">{formatCurrency(shift.openingCash)}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Kas Akhir (Sistem):</Text>
              <Text weight="semibold">{formatCurrency(shift.expectedCash || 0)}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Kas Akhir (Fisik):</Text>
              <Text weight="semibold">{formatCurrency(shift.closingCash || 0)}</Text>
            </div>
            <Divider />
            <div className="flex justify-between">
              <Text weight="bold">Selisih:</Text>
              <Text 
                weight="bold" 
                className={cn(
                  (shift.cashDifference || 0) === 0 ? 'text-green-600' : 
                  (shift.cashDifference || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                )}
              >
                {formatCurrency(shift.cashDifference || 0)}
              </Text>
            </div>
          </div>
        </Card>
      )}
      
      {/* Transactions */}
      <Card className="p-4">
        <Text weight="semibold" className="mb-4 block">Riwayat Transaksi</Text>
        <DataGrid
          items={shift.transactions}
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
          <DataGridBody<ShiftTransaction>>
            {({ item, rowId }) => (
              <DataGridRow<ShiftTransaction> key={rowId}>
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
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function ShiftManagement({
  currentShift,
  onShiftStart,
  onShiftEnd,
  onPrintReport,
  onExportReport,
  className
}: ShiftManagementProps) {
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('500000');
  const [closingDenominations, setClosingDenominations] = useState<CashDenomination[]>(CASH_DENOMINATIONS);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use mock data if no current shift provided
  const shift = currentShift || mockCurrentShift;
  const hasActiveShift = shift?.status === 'active';
  
  const handleStartShift = async () => {
    try {
      setLoading(true);
      setError(null);
      await onShiftStart(parseFloat(openingCash) || 0, notes);
      setShowStartDialog(false);
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai sesi');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndShift = async () => {
    try {
      setLoading(true);
      setError(null);
      const closingCash = closingDenominations.reduce((sum, denom) => sum + denom.total, 0);
      await onShiftEnd({
        closingCash,
        denominations: closingDenominations,
        notes
      });
      setShowEndDialog(false);
      setNotes('');
      setClosingDenominations(CASH_DENOMINATIONS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup sesi');
    } finally {
      setLoading(false);
    }
  };
  
  const expectedClosingCash = hasActiveShift ? 
    (shift.openingCash + 
     shift.paymentMethods.find(pm => pm.type === 'cash')?.amount || 0 - 
     shift.totalRefunds) : 0;
  
  const closingCash = closingDenominations.reduce((sum, denom) => sum + denom.total, 0);
  const cashDifference = closingCash - expectedClosingCash;
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Shift Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock24Regular className="w-6 h-6" />
            <div>
              <Text weight="semibold" className="block">
                {hasActiveShift ? 'Sesi Aktif' : 'Tidak Ada Sesi Aktif'}
              </Text>
              {hasActiveShift && (
                <Caption1 className="text-gray-600">
                  Dimulai: {formatDateTime(shift.startTime)}
                </Caption1>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasActiveShift ? (
              <>
                <Badge appearance="filled" color="success">
                  Aktif
                </Badge>
                <Tooltip content="Lihat Laporan" relationship="label">
                  <Button
                    appearance="outline"
                    icon={<Eye24Regular />}
                    onClick={() => setShowReportDialog(true)}
                  />
                </Tooltip>
                <Button
                  appearance="primary"
                  icon={<Save24Regular />}
                  onClick={() => setShowEndDialog(true)}
                >
                  Tutup Sesi
                </Button>
              </>
            ) : (
              <Button
                appearance="primary"
                icon={<Clock24Regular />}
                onClick={() => setShowStartDialog(true)}
              >
                Mulai Sesi
              </Button>
            )}
          </div>
        </div>
        
        {hasActiveShift && (
          <>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Text weight="bold" className="block text-lg">
                  {shift.transactionCount}
                </Text>
                <Caption1 className="text-gray-600">Transaksi</Caption1>
              </div>
              <div className="text-center">
                <Text weight="bold" className="block text-lg">
                  {formatCurrency(shift.totalSales)}
                </Text>
                <Caption1 className="text-gray-600">Penjualan</Caption1>
              </div>
              <div className="text-center">
                <Text weight="bold" className="block text-lg">
                  {formatCurrency(shift.openingCash)}
                </Text>
                <Caption1 className="text-gray-600">Kas Awal</Caption1>
              </div>
              <div className="text-center">
                <Text weight="bold" className="block text-lg">
                  {formatCurrency(expectedClosingCash)}
                </Text>
                <Caption1 className="text-gray-600">Kas Seharusnya</Caption1>
              </div>
            </div>
          </>
        )}
      </Card>
      
      {/* Start Shift Dialog */}
      <Dialog open={showStartDialog} onOpenChange={(_, data) => setShowStartDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>Mulai Sesi Kasir</DialogTitle>
          <DialogBody>
            <div className="space-y-4">
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              
              <Field label="Kas Awal" required>
                <Input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="Masukkan jumlah kas awal"
                  contentAfter="Rp"
                />
              </Field>
              
              <Field label="Catatan">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                />
              </Field>
              
              <div className="p-3 bg-blue-50 rounded">
                <Text size={200} weight="semibold" className="text-blue-700">
                  Kas Awal: {formatCurrency(parseFloat(openingCash) || 0)}
                </Text>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => setShowStartDialog(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              appearance="primary"
              onClick={handleStartShift}
              disabled={loading || !openingCash}
              icon={loading ? <Spinner size="tiny" /> : <Clock24Regular />}
            >
              {loading ? 'Memulai...' : 'Mulai Sesi'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
      
      {/* End Shift Dialog */}
      <Dialog open={showEndDialog} onOpenChange={(_, data) => setShowEndDialog(data.open)}>
        <DialogSurface className="max-w-4xl">
          <DialogTitle>Tutup Sesi Kasir</DialogTitle>
          <DialogBody>
            <div className="space-y-6">
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              
              {/* Summary */}
              <Card className="p-4 bg-gray-50">
                <Text weight="semibold" className="mb-3 block">Ringkasan Sesi</Text>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Text size={200} className="text-gray-600">Kas Awal:</Text>
                    <Text weight="bold">{formatCurrency(shift.openingCash)}</Text>
                  </div>
                  <div>
                    <Text size={200} className="text-gray-600">Penjualan Tunai:</Text>
                    <Text weight="bold">
                      {formatCurrency(shift.paymentMethods.find(pm => pm.type === 'cash')?.amount || 0)}
                    </Text>
                  </div>
                  <div>
                    <Text size={200} className="text-gray-600">Kas Seharusnya:</Text>
                    <Text weight="bold">{formatCurrency(expectedClosingCash)}</Text>
                  </div>
                  <div>
                    <Text size={200} className="text-gray-600">Total Transaksi:</Text>
                    <Text weight="bold">{shift.transactionCount}</Text>
                  </div>
                </div>
              </Card>
              
              {/* Cash Counting */}
              <CashCounting
                denominations={closingDenominations}
                onChange={setClosingDenominations}
                title="Hitung Kas Fisik"
              />
              
              {/* Difference Alert */}
              {Math.abs(cashDifference) > 0 && (
                <MessageBar 
                  intent={cashDifference === 0 ? 'success' : 'warning'}
                >
                  <MessageBarBody>
                    <div className="flex items-center justify-between">
                      <span>
                        Selisih kas: {formatCurrency(Math.abs(cashDifference))}
                        {cashDifference > 0 ? ' (Lebih)' : ' (Kurang)'}
                      </span>
                      {cashDifference === 0 && <CheckmarkCircle24Regular className="w-5 h-5" />}
                      {cashDifference !== 0 && <Warning24Regular className="w-5 h-5" />}
                    </div>
                  </MessageBarBody>
                </MessageBar>
              )}
              
              <Field label="Catatan Penutupan">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan penutupan sesi (opsional)"
                  rows={3}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => setShowEndDialog(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              appearance="primary"
              onClick={handleEndShift}
              disabled={loading}
              icon={loading ? <Spinner size="tiny" /> : <Save24Regular />}
            >
              {loading ? 'Menutup...' : 'Tutup Sesi'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
      
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={(_, data) => setShowReportDialog(data.open)}>
        <DialogSurface className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Laporan Sesi Kasir</span>
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setShowReportDialog(false)}
              />
            </div>
          </DialogTitle>
          <DialogBody>
            <ShiftReport
              shift={shift}
              onPrint={() => onPrintReport(shift.id)}
              onExport={(format) => onExportReport(shift.id, format)}
            />
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type {
  ShiftManagementProps,
  ShiftData,
  CashDenomination,
  PaymentMethod,
  ShiftTransaction
};