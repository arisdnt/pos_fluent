'use client';

// ======================================================================
// REPORTS PAGE
// Halaman laporan dan analitik dengan ekspor Excel/PDF
// ======================================================================

import React, { useState, useEffect } from 'react';
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
  Divider,
  Dropdown,
  Option,
  Input,
  Label,
  Spinner,
  Badge,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  makeStyles,
  tokens,
  FluentProvider,
  webLightTheme
} from '@fluentui/react-components';
import {
  DocumentPdfRegular,
  DocumentTableRegular,
  CalendarRegular,
  FilterRegular,
  ArrowDownloadRegular,
  ChartMultipleRegular,
  MoneyRegular,
  BoxRegular,
  PeopleRegular,
  PaymentRegular,
  ClockRegular,
  StorageRegular,
  ArrowClockwiseRegular
} from '@fluentui/react-icons';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    flexWrap: 'wrap',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: '150px'
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  summaryCard: {
    padding: tokens.spacingVerticalM,
    height: '120px'
  },
  summaryIcon: {
    fontSize: '24px',
    marginBottom: tokens.spacingVerticalS
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground2
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM
  },
  dataGrid: {
    height: '400px'
  },
  toolbar: {
    marginBottom: tokens.spacingVerticalM
  },
  exportButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  errorContainer: {
    marginBottom: tokens.spacingVerticalM
  }
});

// ======================================================================
// TYPES
// ======================================================================

interface ReportFilters {
  type: 'sales' | 'products' | 'customers' | 'payments' | 'shifts' | 'inventory';
  period: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface SalesData {
  id: string;
  tanggal: string;
  nomorTransaksi: string;
  pelanggan: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  metodePembayaran: string;
}

interface ProductData {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  stok: number;
  hargaBeli: number;
  hargaJual: number;
  margin: string;
  status: string;
}

interface CustomerData {
  id: string;
  kode: string;
  nama: string;
  email: string;
  telepon: string;
  totalBelanja: number;
  jumlahTransaksi: number;
  poin: number;
  status: string;
}

interface PaymentData {
  id: string;
  tanggal: string;
  nomorTransaksi: string;
  metodePembayaran: string;
  jumlah: number;
  status: string;
  referensi?: string;
  biayaAdmin?: number;
}

interface ShiftData {
  id: string;
  tanggal: string;
  shift: string;
  kasir: string;
  jamMulai: string;
  jamSelesai: string;
  modalAwal: number;
  totalPenjualan: number;
  totalTransaksi: number;
  uangTunai: number;
  uangNonTunai: number;
  selisih: number;
  status: string;
}

interface ReportSummary {
  totalTransaksi?: number;
  totalPenjualan?: number;
  totalDiskon?: number;
  totalPajak?: number;
  totalBersih?: number;
  totalProduk?: number;
  produkAktif?: number;
  stokRendah?: number;
  nilaiInventori?: number;
  totalPelanggan?: number;
  pelangganAktif?: number;
  totalPoin?: number;
  rataRataBelanja?: number;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockSalesData: SalesData[] = [
  {
    id: '1',
    tanggal: '2024-01-15',
    nomorTransaksi: 'TRX-20240115-001',
    pelanggan: 'Budi Santoso',
    subtotal: 8300000,
    diskon: 300000,
    pajak: 800000,
    total: 8800000,
    metodePembayaran: 'Tunai'
  },
  {
    id: '2',
    tanggal: '2024-01-15',
    nomorTransaksi: 'TRX-20240115-002',
    pelanggan: 'Siti Rahayu',
    subtotal: 5000000,
    diskon: 0,
    pajak: 500000,
    total: 5500000,
    metodePembayaran: 'Kartu Debit'
  },
  {
    id: '3',
    tanggal: '2024-01-16',
    nomorTransaksi: 'TRX-20240116-001',
    pelanggan: 'Ahmad Wijaya',
    subtotal: 2000000,
    diskon: 100000,
    pajak: 190000,
    total: 2090000,
    metodePembayaran: 'QRIS'
  }
];

const mockProductData: ProductData[] = [
  {
    id: '1',
    kode: 'PROD001',
    nama: 'Laptop ASUS',
    kategori: 'Elektronik',
    stok: 5,
    hargaBeli: 7000000,
    hargaJual: 8000000,
    margin: '14.3%',
    status: 'Aktif'
  },
  {
    id: '2',
    kode: 'PROD002',
    nama: 'Mouse Wireless',
    kategori: 'Aksesoris',
    stok: 20,
    hargaBeli: 100000,
    hargaJual: 150000,
    margin: '50%',
    status: 'Aktif'
  },
  {
    id: '3',
    kode: 'PROD003',
    nama: 'Smartphone Samsung',
    kategori: 'Elektronik',
    stok: 8,
    hargaBeli: 4000000,
    hargaJual: 5000000,
    margin: '25%',
    status: 'Aktif'
  }
];

const mockCustomerData: CustomerData[] = [
  {
    id: '1',
    kode: 'CUST001',
    nama: 'Budi Santoso',
    email: 'budi@email.com',
    telepon: '081234567890',
    totalBelanja: 8800000,
    jumlahTransaksi: 1,
    poin: 88,
    status: 'Aktif'
  },
  {
    id: '2',
    kode: 'CUST002',
    nama: 'Siti Rahayu',
    email: 'siti@email.com',
    telepon: '081234567891',
    totalBelanja: 5500000,
    jumlahTransaksi: 1,
    poin: 55,
    status: 'Aktif'
  },
  {
    id: '3',
    kode: 'CUST003',
    nama: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    telepon: '081234567892',
    totalBelanja: 2090000,
    jumlahTransaksi: 1,
    poin: 21,
    status: 'Aktif'
  }
];

const mockPaymentData: PaymentData[] = [
  {
    id: '1',
    tanggal: '2024-01-15',
    nomorTransaksi: 'TRX-20240115-001',
    metodePembayaran: 'Tunai',
    jumlah: 8800000,
    status: 'Berhasil'
  },
  {
    id: '2',
    tanggal: '2024-01-15',
    nomorTransaksi: 'TRX-20240115-002',
    metodePembayaran: 'Kartu Debit',
    jumlah: 5500000,
    status: 'Berhasil',
    referensi: 'REF-20240115-002',
    biayaAdmin: 2500
  },
  {
    id: '3',
    tanggal: '2024-01-16',
    nomorTransaksi: 'TRX-20240116-001',
    metodePembayaran: 'QRIS',
    jumlah: 2090000,
    status: 'Berhasil',
    referensi: 'QRIS-20240116-001',
    biayaAdmin: 5000
  }
];

const mockShiftData: ShiftData[] = [
  {
    id: '1',
    tanggal: '2024-01-15',
    shift: 'Pagi',
    kasir: 'Ahmad Kasir',
    jamMulai: '08:00',
    jamSelesai: '16:00',
    modalAwal: 1000000,
    totalPenjualan: 8800000,
    totalTransaksi: 1,
    uangTunai: 8800000,
    uangNonTunai: 0,
    selisih: 0,
    status: 'Selesai'
  },
  {
    id: '2',
    tanggal: '2024-01-15',
    shift: 'Sore',
    kasir: 'Siti Kasir',
    jamMulai: '16:00',
    jamSelesai: '22:00',
    modalAwal: 1000000,
    totalPenjualan: 5500000,
    totalTransaksi: 1,
    uangTunai: 0,
    uangNonTunai: 5500000,
    selisih: 0,
    status: 'Selesai'
  },
  {
    id: '3',
    tanggal: '2024-01-16',
    shift: 'Pagi',
    kasir: 'Budi Kasir',
    jamMulai: '08:00',
    jamSelesai: '16:00',
    modalAwal: 1000000,
    totalPenjualan: 2090000,
    totalTransaksi: 1,
    uangTunai: 0,
    uangNonTunai: 2090000,
    selisih: 0,
    status: 'Selesai'
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function ReportsPageContent() {
  const styles = useStyles();
  const { user } = useAuth();
  
  // State
  const [selectedTab, setSelectedTab] = useState<string>('sales');
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'sales',
    period: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({});
  const [exporting, setExporting] = useState(false);

  // Column definitions
  const salesColumns: TableColumnDefinition<SalesData>[] = [
    createTableColumn<SalesData>({
      columnId: 'tanggal',
      compare: (a, b) => a.tanggal.localeCompare(b.tanggal),
      renderHeaderCell: () => 'Tanggal',
      renderCell: (item) => formatDate(item.tanggal)
    }),
    createTableColumn<SalesData>({
      columnId: 'nomorTransaksi',
      compare: (a, b) => a.nomorTransaksi.localeCompare(b.nomorTransaksi),
      renderHeaderCell: () => 'No. Transaksi',
      renderCell: (item) => item.nomorTransaksi
    }),
    createTableColumn<SalesData>({
      columnId: 'pelanggan',
      compare: (a, b) => a.pelanggan.localeCompare(b.pelanggan),
      renderHeaderCell: () => 'Pelanggan',
      renderCell: (item) => item.pelanggan
    }),
    createTableColumn<SalesData>({
      columnId: 'subtotal',
      compare: (a, b) => a.subtotal - b.subtotal,
      renderHeaderCell: () => 'Subtotal',
      renderCell: (item) => formatCurrency(item.subtotal)
    }),
    createTableColumn<SalesData>({
      columnId: 'diskon',
      compare: (a, b) => a.diskon - b.diskon,
      renderHeaderCell: () => 'Diskon',
      renderCell: (item) => formatCurrency(item.diskon)
    }),
    createTableColumn<SalesData>({
      columnId: 'pajak',
      compare: (a, b) => a.pajak - b.pajak,
      renderHeaderCell: () => 'Pajak',
      renderCell: (item) => formatCurrency(item.pajak)
    }),
    createTableColumn<SalesData>({
      columnId: 'total',
      compare: (a, b) => a.total - b.total,
      renderHeaderCell: () => 'Total',
      renderCell: (item) => (
        <Text weight="semibold">{formatCurrency(item.total)}</Text>
      )
    }),
    createTableColumn<SalesData>({
      columnId: 'metodePembayaran',
      compare: (a, b) => a.metodePembayaran.localeCompare(b.metodePembayaran),
      renderHeaderCell: () => 'Metode Bayar',
      renderCell: (item) => (
        <Badge appearance="outline">{item.metodePembayaran}</Badge>
      )
    })
  ];

  const productColumns: TableColumnDefinition<ProductData>[] = [
    createTableColumn<ProductData>({
      columnId: 'kode',
      compare: (a, b) => a.kode.localeCompare(b.kode),
      renderHeaderCell: () => 'Kode',
      renderCell: (item) => item.kode
    }),
    createTableColumn<ProductData>({
      columnId: 'nama',
      compare: (a, b) => a.nama.localeCompare(b.nama),
      renderHeaderCell: () => 'Nama Produk',
      renderCell: (item) => item.nama
    }),
    createTableColumn<ProductData>({
      columnId: 'kategori',
      compare: (a, b) => a.kategori.localeCompare(b.kategori),
      renderHeaderCell: () => 'Kategori',
      renderCell: (item) => (
        <Badge appearance="outline">{item.kategori}</Badge>
      )
    }),
    createTableColumn<ProductData>({
      columnId: 'stok',
      compare: (a, b) => a.stok - b.stok,
      renderHeaderCell: () => 'Stok',
      renderCell: (item) => (
        <Badge 
          appearance={item.stok < 10 ? "filled" : "outline"}
          color={item.stok < 10 ? "danger" : "brand"}
        >
          {formatNumber(item.stok)}
        </Badge>
      )
    }),
    createTableColumn<ProductData>({
      columnId: 'hargaBeli',
      compare: (a, b) => a.hargaBeli - b.hargaBeli,
      renderHeaderCell: () => 'Harga Beli',
      renderCell: (item) => formatCurrency(item.hargaBeli)
    }),
    createTableColumn<ProductData>({
      columnId: 'hargaJual',
      compare: (a, b) => a.hargaJual - b.hargaJual,
      renderHeaderCell: () => 'Harga Jual',
      renderCell: (item) => formatCurrency(item.hargaJual)
    }),
    createTableColumn<ProductData>({
      columnId: 'margin',
      compare: (a, b) => a.margin.localeCompare(b.margin),
      renderHeaderCell: () => 'Margin',
      renderCell: (item) => (
        <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
          {item.margin}
        </Text>
      )
    }),
    createTableColumn<ProductData>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge 
          appearance="filled"
          color={item.status === 'Aktif' ? "success" : "danger"}
        >
          {item.status}
        </Badge>
      )
    })
  ];

  const customerColumns: TableColumnDefinition<CustomerData>[] = [
    createTableColumn<CustomerData>({
      columnId: 'kode',
      compare: (a, b) => a.kode.localeCompare(b.kode),
      renderHeaderCell: () => 'Kode',
      renderCell: (item) => item.kode
    }),
    createTableColumn<CustomerData>({
      columnId: 'nama',
      compare: (a, b) => a.nama.localeCompare(b.nama),
      renderHeaderCell: () => 'Nama',
      renderCell: (item) => item.nama
    }),
    createTableColumn<CustomerData>({
      columnId: 'email',
      compare: (a, b) => a.email.localeCompare(b.email),
      renderHeaderCell: () => 'Email',
      renderCell: (item) => item.email
    }),
    createTableColumn<CustomerData>({
      columnId: 'telepon',
      compare: (a, b) => a.telepon.localeCompare(b.telepon),
      renderHeaderCell: () => 'Telepon',
      renderCell: (item) => item.telepon
    }),
    createTableColumn<CustomerData>({
      columnId: 'totalBelanja',
      compare: (a, b) => a.totalBelanja - b.totalBelanja,
      renderHeaderCell: () => 'Total Belanja',
      renderCell: (item) => formatCurrency(item.totalBelanja)
    }),
    createTableColumn<CustomerData>({
      columnId: 'jumlahTransaksi',
      compare: (a, b) => a.jumlahTransaksi - b.jumlahTransaksi,
      renderHeaderCell: () => 'Transaksi',
      renderCell: (item) => formatNumber(item.jumlahTransaksi)
    }),
    createTableColumn<CustomerData>({
      columnId: 'poin',
      compare: (a, b) => a.poin - b.poin,
      renderHeaderCell: () => 'Poin',
      renderCell: (item) => (
        <Badge appearance="outline" color="brand">
          {formatNumber(item.poin)}
        </Badge>
      )
    }),
    createTableColumn<CustomerData>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge 
          appearance="filled"
          color={item.status === 'Aktif' ? "success" : "danger"}
        >
          {item.status}
        </Badge>
      )
    })
  ];

  const paymentColumns: TableColumnDefinition<PaymentData>[] = [
    createTableColumn<PaymentData>({
      columnId: 'tanggal',
      compare: (a, b) => a.tanggal.localeCompare(b.tanggal),
      renderHeaderCell: () => 'Tanggal',
      renderCell: (item) => formatDate(item.tanggal)
    }),
    createTableColumn<PaymentData>({
      columnId: 'nomorTransaksi',
      compare: (a, b) => a.nomorTransaksi.localeCompare(b.nomorTransaksi),
      renderHeaderCell: () => 'No. Transaksi',
      renderCell: (item) => item.nomorTransaksi
    }),
    createTableColumn<PaymentData>({
      columnId: 'metodePembayaran',
      compare: (a, b) => a.metodePembayaran.localeCompare(b.metodePembayaran),
      renderHeaderCell: () => 'Metode Bayar',
      renderCell: (item) => (
        <Badge appearance="outline">{item.metodePembayaran}</Badge>
      )
    }),
    createTableColumn<PaymentData>({
      columnId: 'jumlah',
      compare: (a, b) => a.jumlah - b.jumlah,
      renderHeaderCell: () => 'Jumlah',
      renderCell: (item) => (
        <Text weight="semibold">{formatCurrency(item.jumlah)}</Text>
      )
    }),
    createTableColumn<PaymentData>({
      columnId: 'biayaAdmin',
      compare: (a, b) => (a.biayaAdmin || 0) - (b.biayaAdmin || 0),
      renderHeaderCell: () => 'Biaya Admin',
      renderCell: (item) => formatCurrency(item.biayaAdmin || 0)
    }),
    createTableColumn<PaymentData>({
      columnId: 'referensi',
      compare: (a, b) => (a.referensi || '').localeCompare(b.referensi || ''),
      renderHeaderCell: () => 'Referensi',
      renderCell: (item) => item.referensi || '-'
    }),
    createTableColumn<PaymentData>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge 
          appearance="filled"
          color={item.status === 'Berhasil' ? "success" : "danger"}
        >
          {item.status}
        </Badge>
      )
    })
  ];

  const shiftColumns: TableColumnDefinition<ShiftData>[] = [
    createTableColumn<ShiftData>({
      columnId: 'tanggal',
      compare: (a, b) => a.tanggal.localeCompare(b.tanggal),
      renderHeaderCell: () => 'Tanggal',
      renderCell: (item) => formatDate(item.tanggal)
    }),
    createTableColumn<ShiftData>({
      columnId: 'shift',
      compare: (a, b) => a.shift.localeCompare(b.shift),
      renderHeaderCell: () => 'Shift',
      renderCell: (item) => (
        <Badge appearance="outline">{item.shift}</Badge>
      )
    }),
    createTableColumn<ShiftData>({
      columnId: 'kasir',
      compare: (a, b) => a.kasir.localeCompare(b.kasir),
      renderHeaderCell: () => 'Kasir',
      renderCell: (item) => item.kasir
    }),
    createTableColumn<ShiftData>({
      columnId: 'jamMulai',
      compare: (a, b) => a.jamMulai.localeCompare(b.jamMulai),
      renderHeaderCell: () => 'Jam Mulai',
      renderCell: (item) => item.jamMulai
    }),
    createTableColumn<ShiftData>({
      columnId: 'jamSelesai',
      compare: (a, b) => a.jamSelesai.localeCompare(b.jamSelesai),
      renderHeaderCell: () => 'Jam Selesai',
      renderCell: (item) => item.jamSelesai
    }),
    createTableColumn<ShiftData>({
      columnId: 'modalAwal',
      compare: (a, b) => a.modalAwal - b.modalAwal,
      renderHeaderCell: () => 'Modal Awal',
      renderCell: (item) => formatCurrency(item.modalAwal)
    }),
    createTableColumn<ShiftData>({
      columnId: 'totalPenjualan',
      compare: (a, b) => a.totalPenjualan - b.totalPenjualan,
      renderHeaderCell: () => 'Total Penjualan',
      renderCell: (item) => (
        <Text weight="semibold">{formatCurrency(item.totalPenjualan)}</Text>
      )
    }),
    createTableColumn<ShiftData>({
      columnId: 'totalTransaksi',
      compare: (a, b) => a.totalTransaksi - b.totalTransaksi,
      renderHeaderCell: () => 'Total Transaksi',
      renderCell: (item) => formatNumber(item.totalTransaksi)
    }),
    createTableColumn<ShiftData>({
      columnId: 'selisih',
      compare: (a, b) => a.selisih - b.selisih,
      renderHeaderCell: () => 'Selisih',
      renderCell: (item) => (
        <Text 
          weight="semibold" 
          style={{ color: item.selisih === 0 ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1 }}
        >
          {formatCurrency(item.selisih)}
        </Text>
      )
    }),
    createTableColumn<ShiftData>({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <Badge 
          appearance="filled"
          color={item.status === 'Selesai' ? "success" : "warning"}
        >
          {item.status}
        </Badge>
      )
    })
  ];

  // Event handlers
  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    const newTab = data.value as string;
    setSelectedTab(newTab);
    setFilters(prev => ({ ...prev, type: newTab as any }));
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock data based on selected tab
      switch (selectedTab) {
        case 'sales':
          setReportData(mockSalesData);
          setSummary({
            totalTransaksi: 3,
            totalPenjualan: 16390000,
            totalDiskon: 400000,
            totalPajak: 1490000,
            totalBersih: 17480000
          });
          break;
        case 'products':
          setReportData(mockProductData);
          setSummary({
            totalProduk: 5,
            produkAktif: 5,
            stokRendah: 1,
            nilaiInventori: 45000000
          });
          break;
        case 'customers':
          setReportData(mockCustomerData);
          setSummary({
            totalPelanggan: 3,
            pelangganAktif: 3,
            totalPoin: 164,
            rataRataBelanja: 5463333
          });
          break;
        case 'payments':
          setReportData(mockPaymentData);
          setSummary({
            totalTransaksi: 3,
            totalPenjualan: 16390000,
            totalBersih: 16382500,
            totalPajak: 7500
          });
          break;
        case 'shifts':
          setReportData(mockShiftData);
          setSummary({
            totalTransaksi: 3,
            totalPenjualan: 16390000,
            totalBersih: 16390000,
            rataRataBelanja: 5463333
          });
          break;
        default:
          setReportData([]);
          setSummary({});
      }
    } catch (err) {
      setError('Gagal memuat data laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    
    try {
      // Simulate export API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call the export API
      const filename = `laporan_${selectedTab}_${filters.period}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Show success message
      alert(`Laporan berhasil diekspor sebagai ${filename}`);
    } catch (err) {
      setError(`Gagal mengekspor laporan ke ${format.toUpperCase()}. Silakan coba lagi.`);
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    loadReportData();
  };

  // Effects
  useEffect(() => {
    loadReportData();
  }, [selectedTab, filters.period, filters.startDate, filters.endDate]);

  // Render summary cards based on report type
  const renderSummaryCards = () => {
    switch (selectedTab) {
      case 'sales':
        return (
          <>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <MoneyRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalTransaksi || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Transaksi</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <ChartMultipleRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalPenjualan || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Penjualan</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <PaymentRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalBersih || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Bersih</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <DocumentTableRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalPajak || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Pajak</Caption1>
                </div>
              </CardHeader>
            </Card>
          </>
        );
      case 'products':
        return (
          <>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <BoxRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalProduk || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Produk</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <StorageRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.produkAktif || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Produk Aktif</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <FilterRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.stokRendah || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Stok Rendah</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <MoneyRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.nilaiInventori || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Nilai Inventori</Caption1>
                </div>
              </CardHeader>
            </Card>
          </>
        );
      case 'customers':
        return (
          <>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <PeopleRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalPelanggan || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Pelanggan</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <ClockRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.pelangganAktif || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Pelanggan Aktif</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <DocumentTableRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalPoin || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Poin</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <MoneyRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.rataRataBelanja || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Rata-rata Belanja</Caption1>
                </div>
              </CardHeader>
            </Card>
          </>
        );
      case 'payments':
        return (
          <>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <PaymentRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalTransaksi || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Pembayaran</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <MoneyRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalPenjualan || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Nilai</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <ChartMultipleRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalBersih || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Bersih</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <DocumentTableRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalPajak || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Biaya Admin</Caption1>
                </div>
              </CardHeader>
            </Card>
          </>
        );
      case 'shifts':
        return (
          <>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <ClockRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatNumber(summary.totalTransaksi || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Shift</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <MoneyRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalPenjualan || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Penjualan</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <ChartMultipleRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.totalBersih || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Total Bersih</Caption1>
                </div>
              </CardHeader>
            </Card>
            <Card className={styles.summaryCard}>
              <CardHeader>
                <PeopleRegular className={styles.summaryIcon} />
                <div>
                  <div className={styles.summaryValue}>
                    {formatCurrency(summary.rataRataBelanja || 0)}
                  </div>
                  <Caption1 className={styles.summaryLabel}>Rata-rata per Shift</Caption1>
                </div>
              </CardHeader>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

  // Render data grid based on report type
  const renderDataGrid = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Text>Memuat data laporan...</Text>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className={styles.loadingContainer}>
          <Text>Tidak ada data untuk ditampilkan</Text>
        </div>
      );
    }

    switch (selectedTab) {
      case 'sales':
        return (
          <DataGrid
            items={reportData as SalesData[]}
            columns={salesColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<SalesData>>
              {({ item, rowId }) => (
                <DataGridRow<SalesData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        );
      case 'products':
        return (
          <DataGrid
            items={reportData as ProductData[]}
            columns={productColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ProductData>>
              {({ item, rowId }) => (
                <DataGridRow<ProductData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        );
      case 'customers':
        return (
          <DataGrid
            items={reportData as CustomerData[]}
            columns={customerColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<CustomerData>>
              {({ item, rowId }) => (
                <DataGridRow<CustomerData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        );
      case 'payments':
        return (
          <DataGrid
            items={reportData as PaymentData[]}
            columns={paymentColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<PaymentData>>
              {({ item, rowId }) => (
                <DataGridRow<PaymentData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        );
      case 'shifts':
        return (
          <DataGrid
            items={reportData as ShiftData[]}
            columns={shiftColumns}
            sortable
            className={styles.dataGrid}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ShiftData>>
              {({ item, rowId }) => (
                <DataGridRow<ShiftData> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title1>Laporan & Analitik</Title1>
          <Body1>Kelola dan analisis data bisnis Anda</Body1>
        </div>
        <div className={styles.exportButtons}>
          <Button
            appearance="secondary"
            icon={<ArrowClockwiseRegular />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <Title3>Filter Laporan</Title3>
        </CardHeader>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Label>Periode</Label>
            <Dropdown
              value={filters.period}
              onOptionSelect={(_, data) => handleFilterChange('period', data.optionValue || 'today')}
            >
              <Option value="today">Hari Ini</Option>
              <Option value="yesterday">Kemarin</Option>
              <Option value="week">Minggu Ini</Option>
              <Option value="month">Bulan Ini</Option>
              <Option value="quarter">Kuartal Ini</Option>
              <Option value="year">Tahun Ini</Option>
              <Option value="custom">Kustom</Option>
            </Dropdown>
          </div>
          
          {filters.period === 'custom' && (
            <>
              <div className={styles.filterGroup}>
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(_, data) => handleFilterChange('startDate', data.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(_, data) => handleFilterChange('endDate', data.value)}
                />
              </div>
            </>
          )}
          
          <div className={styles.filterGroup}>
            <Label>Grup Berdasarkan</Label>
            <Dropdown
              value={filters.groupBy || 'day'}
              onOptionSelect={(_, data) => handleFilterChange('groupBy', data.optionValue || 'day')}
            >
              <Option value="day">Hari</Option>
              <Option value="week">Minggu</Option>
              <Option value="month">Bulan</Option>
              <Option value="quarter">Kuartal</Option>
              <Option value="year">Tahun</Option>
            </Dropdown>
          </div>
        </div>
      </Card>

      {/* Report Tabs */}
      <Card>
        <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
          <Tab value="sales" icon={<MoneyRegular />}>
            Penjualan
          </Tab>
          <Tab value="products" icon={<BoxRegular />}>
            Produk
          </Tab>
          <Tab value="customers" icon={<PeopleRegular />}>
            Pelanggan
          </Tab>
          <Tab value="payments" icon={<PaymentRegular />}>
            Pembayaran
          </Tab>
          <Tab value="shifts" icon={<ClockRegular />}>
            Shift
          </Tab>
          <Tab value="inventory" icon={<StorageRegular />}>
            Inventori
          </Tab>
        </TabList>

        <div className={styles.tabContent}>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            {renderSummaryCards()}
          </div>

          <Divider />

          {/* Toolbar */}
          <Toolbar className={styles.toolbar}>
            <Title2>Data {selectedTab === 'sales' ? 'Penjualan' : selectedTab === 'products' ? 'Produk' : 'Pelanggan'}</Title2>
            <ToolbarDivider />
            <ToolbarButton
              appearance="primary"
              icon={<DocumentTableRegular />}
              onClick={() => handleExport('excel')}
              disabled={exporting || loading}
            >
              {exporting ? 'Mengekspor...' : 'Ekspor Excel'}
            </ToolbarButton>
            <ToolbarButton
              appearance="subtle"
              icon={<DocumentPdfRegular />}
              onClick={() => handleExport('pdf')}
              disabled={exporting || loading}
            >
              {exporting ? 'Mengekspor...' : 'Ekspor PDF'}
            </ToolbarButton>
          </Toolbar>

          {/* Data Grid */}
          {renderDataGrid()}
        </div>
      </Card>
    </div>
  );
}

// ======================================================================
// PROTECTED COMPONENT
// ======================================================================

function ReportsPage() {
  return (
    <ProtectedRoute requiredPermissions={['reports.read', 'reports.export']}>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}

export default ReportsPage;