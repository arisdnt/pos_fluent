// ======================================================================
// REPORTS API ROUTE
// API endpoints untuk laporan dan analitik
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface ReportQuery {
  type: 'sales' | 'products' | 'customers' | 'payments' | 'shifts' | 'inventory';
  period: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  categoryId?: string;
  productId?: string;
  customerId?: string;
  paymentMethod?: string;
  shiftId?: string;
  format?: 'json' | 'excel' | 'pdf';
}

interface SalesReport {
  period: string;
  totalTransaksi: number;
  totalPenjualan: number;
  totalDiskon: number;
  totalPajak: number;
  totalBersih: number;
  rataRataTransaksi: number;
  produkTerlaris: Array<{
    id: string;
    nama: string;
    jumlahTerjual: number;
    totalPenjualan: number;
  }>;
  penjualanPerHari: Array<{
    tanggal: string;
    jumlahTransaksi: number;
    totalPenjualan: number;
  }>;
  metodePembayaran: Array<{
    metode: string;
    jumlahTransaksi: number;
    totalNilai: number;
    persentase: number;
  }>;
}

interface ProductReport {
  period: string;
  totalProduk: number;
  produkAktif: number;
  produkNonAktif: number;
  stokRendah: number;
  nilaiInventori: number;
  produkTerlaris: Array<{
    id: string;
    nama: string;
    kategori: string;
    jumlahTerjual: number;
    totalPenjualan: number;
    stokSisa: number;
  }>;
  kategoriTerlaris: Array<{
    id: string;
    nama: string;
    jumlahProduk: number;
    totalPenjualan: number;
  }>;
  pergerakanStok: Array<{
    tanggal: string;
    masuk: number;
    keluar: number;
    saldo: number;
  }>;
}

interface CustomerReport {
  period: string;
  totalPelanggan: number;
  pelangganBaru: number;
  pelangganAktif: number;
  totalPoin: number;
  rataRataBelanja: number;
  pelangganTeratas: Array<{
    id: string;
    nama: string;
    totalBelanja: number;
    jumlahTransaksi: number;
    poinTerkumpul: number;
  }>;
  demografiUsia: Array<{
    rentangUsia: string;
    jumlah: number;
    persentase: number;
  }>;
  demografiGender: Array<{
    jenisKelamin: string;
    jumlah: number;
    persentase: number;
  }>;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ReportQuerySchema = z.object({
  type: z.enum(['sales', 'products', 'customers', 'payments', 'shifts', 'inventory']),
  period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom']).default('today'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  paymentMethod: z.string().optional(),
  shiftId: z.string().optional(),
  format: z.enum(['json', 'excel', 'pdf']).default('json')
});

// ======================================================================
// MOCK DATA
// ======================================================================

// Mock transactions data for reports
const mockTransactions = [
  {
    id: 'trx_001',
    nomorTransaksi: 'TRX-20240115-001',
    tanggal: new Date('2024-01-15T10:30:00'),
    customerId: 'cust_001',
    items: [
      { productId: 'prod_001', nama: 'Laptop ASUS', kategori: 'Elektronik', jumlah: 1, harga: 8000000 },
      { productId: 'prod_002', nama: 'Mouse Wireless', kategori: 'Aksesoris', jumlah: 2, harga: 150000 }
    ],
    subtotal: 8300000,
    diskon: 300000,
    pajak: 800000,
    total: 8800000,
    metodePembayaran: 'tunai',
    status: 'selesai'
  },
  {
    id: 'trx_002',
    nomorTransaksi: 'TRX-20240115-002',
    tanggal: new Date('2024-01-15T14:20:00'),
    customerId: 'cust_002',
    items: [
      { productId: 'prod_003', nama: 'Smartphone Samsung', kategori: 'Elektronik', jumlah: 1, harga: 5000000 }
    ],
    subtotal: 5000000,
    diskon: 0,
    pajak: 500000,
    total: 5500000,
    metodePembayaran: 'kartu_debit',
    status: 'selesai'
  },
  {
    id: 'trx_003',
    nomorTransaksi: 'TRX-20240116-001',
    tanggal: new Date('2024-01-16T09:15:00'),
    customerId: 'cust_003',
    items: [
      { productId: 'prod_004', nama: 'Headphone Sony', kategori: 'Aksesoris', jumlah: 1, harga: 1200000 },
      { productId: 'prod_005', nama: 'Keyboard Mechanical', kategori: 'Aksesoris', jumlah: 1, harga: 800000 }
    ],
    subtotal: 2000000,
    diskon: 100000,
    pajak: 190000,
    total: 2090000,
    metodePembayaran: 'qris',
    status: 'selesai'
  }
];

const mockProducts = [
  { id: 'prod_001', nama: 'Laptop ASUS', kategori: 'Elektronik', stok: 5, hargaBeli: 7000000, hargaJual: 8000000 },
  { id: 'prod_002', nama: 'Mouse Wireless', kategori: 'Aksesoris', stok: 20, hargaBeli: 100000, hargaJual: 150000 },
  { id: 'prod_003', nama: 'Smartphone Samsung', kategori: 'Elektronik', stok: 8, hargaBeli: 4000000, hargaJual: 5000000 },
  { id: 'prod_004', nama: 'Headphone Sony', kategori: 'Aksesoris', stok: 12, hargaBeli: 900000, hargaJual: 1200000 },
  { id: 'prod_005', nama: 'Keyboard Mechanical', kategori: 'Aksesoris', stok: 15, hargaBeli: 600000, hargaJual: 800000 }
];

const mockCustomers = [
  { id: 'cust_001', nama: 'Budi Santoso', tanggalLahir: new Date('1985-05-15'), jenisKelamin: 'L', totalBelanja: 8800000, jumlahTransaksi: 1, poin: 88 },
  { id: 'cust_002', nama: 'Siti Rahayu', tanggalLahir: new Date('1990-08-20'), jenisKelamin: 'P', totalBelanja: 5500000, jumlahTransaksi: 1, poin: 55 },
  { id: 'cust_003', nama: 'Ahmad Wijaya', tanggalLahir: new Date('1988-12-10'), jenisKelamin: 'L', totalBelanja: 2090000, jumlahTransaksi: 1, poin: 21 }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date, end: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  return { start, end };
}

function generateSalesReport(query: ReportQuery): SalesReport {
  const { start, end } = getDateRange(query.period, query.startDate, query.endDate);
  
  // Filter transactions by date range
  const filteredTransactions = mockTransactions.filter(trx => 
    trx.tanggal >= start && trx.tanggal <= end && trx.status === 'selesai'
  );

  const totalTransaksi = filteredTransactions.length;
  const totalPenjualan = filteredTransactions.reduce((sum, trx) => sum + trx.subtotal, 0);
  const totalDiskon = filteredTransactions.reduce((sum, trx) => sum + trx.diskon, 0);
  const totalPajak = filteredTransactions.reduce((sum, trx) => sum + trx.pajak, 0);
  const totalBersih = filteredTransactions.reduce((sum, trx) => sum + trx.total, 0);
  const rataRataTransaksi = totalTransaksi > 0 ? totalBersih / totalTransaksi : 0;

  // Calculate best selling products
  const productSales = new Map<string, { nama: string; jumlah: number; total: number }>();
  filteredTransactions.forEach(trx => {
    trx.items.forEach(item => {
      const existing = productSales.get(item.productId) || { nama: item.nama, jumlah: 0, total: 0 };
      existing.jumlah += item.jumlah;
      existing.total += item.jumlah * item.harga;
      productSales.set(item.productId, existing);
    });
  });

  const produkTerlaris = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, nama: data.nama, jumlahTerjual: data.jumlah, totalPenjualan: data.total }))
    .sort((a, b) => b.jumlahTerjual - a.jumlahTerjual)
    .slice(0, 10);

  // Calculate daily sales
  const dailySales = new Map<string, { jumlahTransaksi: number; totalPenjualan: number }>();
  filteredTransactions.forEach(trx => {
    const dateKey = trx.tanggal.toISOString().split('T')[0];
    const existing = dailySales.get(dateKey) || { jumlahTransaksi: 0, totalPenjualan: 0 };
    existing.jumlahTransaksi += 1;
    existing.totalPenjualan += trx.total;
    dailySales.set(dateKey, existing);
  });

  const penjualanPerHari = Array.from(dailySales.entries())
    .map(([tanggal, data]) => ({ tanggal, ...data }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Calculate payment methods
  const paymentMethods = new Map<string, { jumlah: number; total: number }>();
  filteredTransactions.forEach(trx => {
    const existing = paymentMethods.get(trx.metodePembayaran) || { jumlah: 0, total: 0 };
    existing.jumlah += 1;
    existing.total += trx.total;
    paymentMethods.set(trx.metodePembayaran, existing);
  });

  const metodePembayaran = Array.from(paymentMethods.entries())
    .map(([metode, data]) => ({
      metode,
      jumlahTransaksi: data.jumlah,
      totalNilai: data.total,
      persentase: totalTransaksi > 0 ? (data.jumlah / totalTransaksi) * 100 : 0
    }));

  return {
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    totalTransaksi,
    totalPenjualan,
    totalDiskon,
    totalPajak,
    totalBersih,
    rataRataTransaksi,
    produkTerlaris,
    penjualanPerHari,
    metodePembayaran
  };
}

function generateProductReport(query: ReportQuery): ProductReport {
  const { start, end } = getDateRange(query.period, query.startDate, query.endDate);
  
  // Filter transactions by date range
  const filteredTransactions = mockTransactions.filter(trx => 
    trx.tanggal >= start && trx.tanggal <= end && trx.status === 'selesai'
  );

  const totalProduk = mockProducts.length;
  const produkAktif = mockProducts.filter(p => p.stok > 0).length;
  const produkNonAktif = totalProduk - produkAktif;
  const stokRendah = mockProducts.filter(p => p.stok <= 5).length;
  const nilaiInventori = mockProducts.reduce((sum, p) => sum + (p.stok * p.hargaBeli), 0);

  // Calculate best selling products with stock info
  const productSales = new Map<string, { nama: string; kategori: string; jumlah: number; total: number }>();
  filteredTransactions.forEach(trx => {
    trx.items.forEach(item => {
      const existing = productSales.get(item.productId) || { 
        nama: item.nama, 
        kategori: item.kategori, 
        jumlah: 0, 
        total: 0 
      };
      existing.jumlah += item.jumlah;
      existing.total += item.jumlah * item.harga;
      productSales.set(item.productId, existing);
    });
  });

  const produkTerlaris = Array.from(productSales.entries())
    .map(([id, data]) => {
      const product = mockProducts.find(p => p.id === id);
      return {
        id,
        nama: data.nama,
        kategori: data.kategori,
        jumlahTerjual: data.jumlah,
        totalPenjualan: data.total,
        stokSisa: product?.stok || 0
      };
    })
    .sort((a, b) => b.jumlahTerjual - a.jumlahTerjual)
    .slice(0, 10);

  // Calculate category sales
  const categorySales = new Map<string, { jumlahProduk: number; totalPenjualan: number }>();
  filteredTransactions.forEach(trx => {
    trx.items.forEach(item => {
      const existing = categorySales.get(item.kategori) || { jumlahProduk: 0, totalPenjualan: 0 };
      existing.jumlahProduk += item.jumlah;
      existing.totalPenjualan += item.jumlah * item.harga;
      categorySales.set(item.kategori, existing);
    });
  });

  const kategoriTerlaris = Array.from(categorySales.entries())
    .map(([nama, data]) => ({
      id: nama.toLowerCase().replace(/\s+/g, '_'),
      nama,
      jumlahProduk: data.jumlahProduk,
      totalPenjualan: data.totalPenjualan
    }))
    .sort((a, b) => b.totalPenjualan - a.totalPenjualan);

  // Mock stock movement data
  const pergerakanStok = [
    { tanggal: '2024-01-15', masuk: 100, keluar: 25, saldo: 175 },
    { tanggal: '2024-01-16', masuk: 50, keluar: 15, saldo: 210 },
    { tanggal: '2024-01-17', masuk: 0, keluar: 30, saldo: 180 }
  ];

  return {
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    totalProduk,
    produkAktif,
    produkNonAktif,
    stokRendah,
    nilaiInventori,
    produkTerlaris,
    kategoriTerlaris,
    pergerakanStok
  };
}

function generateCustomerReport(query: ReportQuery): CustomerReport {
  const { start, end } = getDateRange(query.period, query.startDate, query.endDate);
  
  // Filter customers by registration date (mock)
  const filteredCustomers = mockCustomers;
  const totalPelanggan = filteredCustomers.length;
  const pelangganBaru = 1; // Mock data
  const pelangganAktif = filteredCustomers.filter(c => c.jumlahTransaksi > 0).length;
  const totalPoin = filteredCustomers.reduce((sum, c) => sum + c.poin, 0);
  const rataRataBelanja = totalPelanggan > 0 ? 
    filteredCustomers.reduce((sum, c) => sum + c.totalBelanja, 0) / totalPelanggan : 0;

  const pelangganTeratas = filteredCustomers
    .map(c => ({
      id: c.id,
      nama: c.nama,
      totalBelanja: c.totalBelanja,
      jumlahTransaksi: c.jumlahTransaksi,
      poinTerkumpul: c.poin
    }))
    .sort((a, b) => b.totalBelanja - a.totalBelanja)
    .slice(0, 10);

  // Calculate age demographics
  const now = new Date();
  const ageGroups = new Map<string, number>();
  filteredCustomers.forEach(c => {
    if (c.tanggalLahir) {
      const age = now.getFullYear() - c.tanggalLahir.getFullYear();
      let ageGroup: string;
      if (age < 25) ageGroup = '< 25';
      else if (age < 35) ageGroup = '25-34';
      else if (age < 45) ageGroup = '35-44';
      else if (age < 55) ageGroup = '45-54';
      else ageGroup = '55+';
      
      ageGroups.set(ageGroup, (ageGroups.get(ageGroup) || 0) + 1);
    }
  });

  const demografiUsia = Array.from(ageGroups.entries())
    .map(([rentangUsia, jumlah]) => ({
      rentangUsia,
      jumlah,
      persentase: totalPelanggan > 0 ? (jumlah / totalPelanggan) * 100 : 0
    }));

  // Calculate gender demographics
  const genderGroups = new Map<string, number>();
  filteredCustomers.forEach(c => {
    if (c.jenisKelamin) {
      const gender = c.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan';
      genderGroups.set(gender, (genderGroups.get(gender) || 0) + 1);
    }
  });

  const demografiGender = Array.from(genderGroups.entries())
    .map(([jenisKelamin, jumlah]) => ({
      jenisKelamin,
      jumlah,
      persentase: totalPelanggan > 0 ? (jumlah / totalPelanggan) * 100 : 0
    }));

  return {
    period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
    totalPelanggan,
    pelangganBaru,
    pelangganAktif,
    totalPoin,
    rataRataBelanja,
    pelangganTeratas,
    demografiUsia,
    demografiGender
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/reports - Generate reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const query = ReportQuerySchema.parse(queryParams);

    let reportData: any;

    switch (query.type) {
      case 'sales':
        reportData = generateSalesReport(query);
        break;
      case 'products':
        reportData = generateProductReport(query);
        break;
      case 'customers':
        reportData = generateCustomerReport(query);
        break;
      case 'payments':
        // Mock payment report
        reportData = {
          period: 'Mock Period',
          totalPembayaran: 16390000,
          metodePembayaran: [
            { metode: 'tunai', jumlah: 1, total: 8800000, persentase: 53.7 },
            { metode: 'kartu_debit', jumlah: 1, total: 5500000, persentase: 33.5 },
            { metode: 'qris', jumlah: 1, total: 2090000, persentase: 12.8 }
          ]
        };
        break;
      case 'shifts':
        // Mock shift report
        reportData = {
          period: 'Mock Period',
          totalShift: 3,
          rataRataShift: 8.5,
          totalPenjualan: 16390000,
          shiftTerbaik: {
            id: 'shift_001',
            tanggal: '2024-01-15',
            kasir: 'John Doe',
            totalPenjualan: 8800000
          }
        };
        break;
      case 'inventory':
        // Mock inventory report
        reportData = {
          period: 'Mock Period',
          totalProduk: mockProducts.length,
          nilaiInventori: mockProducts.reduce((sum, p) => sum + (p.stok * p.hargaBeli), 0),
          stokRendah: mockProducts.filter(p => p.stok <= 5).length,
          pergerakanStok: [
            { tanggal: '2024-01-15', masuk: 100, keluar: 25 },
            { tanggal: '2024-01-16', masuk: 50, keluar: 15 }
          ]
        };
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Tipe laporan tidak valid'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      query
    });

  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parameter laporan tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}