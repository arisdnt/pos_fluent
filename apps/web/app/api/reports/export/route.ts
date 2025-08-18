// ======================================================================
// REPORTS EXPORT API ROUTE
// API endpoints untuk ekspor laporan ke Excel/PDF
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface ExportQuery {
  type: 'sales' | 'products' | 'customers' | 'payments' | 'shifts' | 'inventory';
  format: 'excel' | 'pdf';
  period: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  filename?: string;
  template?: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const ExportQuerySchema = z.object({
  type: z.enum(['sales', 'products', 'customers', 'payments', 'shifts', 'inventory']),
  format: z.enum(['excel', 'pdf']),
  period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom']).default('today'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  filename: z.string().optional(),
  template: z.string().optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

// Mock export templates
const exportTemplates = {
  sales: {
    excel: {
      headers: ['Tanggal', 'No. Transaksi', 'Pelanggan', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Metode Bayar'],
      data: [
        ['2024-01-15', 'TRX-20240115-001', 'Budi Santoso', 8300000, 300000, 800000, 8800000, 'Tunai'],
        ['2024-01-15', 'TRX-20240115-002', 'Siti Rahayu', 5000000, 0, 500000, 5500000, 'Kartu Debit'],
        ['2024-01-16', 'TRX-20240116-001', 'Ahmad Wijaya', 2000000, 100000, 190000, 2090000, 'QRIS']
      ]
    },
    pdf: {
      title: 'Laporan Penjualan',
      subtitle: 'Periode: {period}',
      summary: {
        'Total Transaksi': 3,
        'Total Penjualan': 'Rp 16.390.000',
        'Total Diskon': 'Rp 400.000',
        'Total Pajak': 'Rp 1.490.000',
        'Total Bersih': 'Rp 17.480.000'
      }
    }
  },
  products: {
    excel: {
      headers: ['Kode', 'Nama Produk', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Margin', 'Status'],
      data: [
        ['PROD001', 'Laptop ASUS', 'Elektronik', 5, 7000000, 8000000, '14.3%', 'Aktif'],
        ['PROD002', 'Mouse Wireless', 'Aksesoris', 20, 100000, 150000, '50%', 'Aktif'],
        ['PROD003', 'Smartphone Samsung', 'Elektronik', 8, 4000000, 5000000, '25%', 'Aktif']
      ]
    },
    pdf: {
      title: 'Laporan Produk',
      subtitle: 'Daftar Produk dan Inventori',
      summary: {
        'Total Produk': 5,
        'Produk Aktif': 5,
        'Stok Rendah': 1,
        'Nilai Inventori': 'Rp 45.000.000'
      }
    }
  },
  customers: {
    excel: {
      headers: ['Kode', 'Nama', 'Email', 'Telepon', 'Total Belanja', 'Jumlah Transaksi', 'Poin', 'Status'],
      data: [
        ['CUST001', 'Budi Santoso', 'budi@email.com', '081234567890', 8800000, 1, 88, 'Aktif'],
        ['CUST002', 'Siti Rahayu', 'siti@email.com', '081234567891', 5500000, 1, 55, 'Aktif'],
        ['CUST003', 'Ahmad Wijaya', 'ahmad@email.com', '081234567892', 2090000, 1, 21, 'Aktif']
      ]
    },
    pdf: {
      title: 'Laporan Pelanggan',
      subtitle: 'Data Pelanggan dan Analisis',
      summary: {
        'Total Pelanggan': 3,
        'Pelanggan Aktif': 3,
        'Total Poin': 164,
        'Rata-rata Belanja': 'Rp 5.463.333'
      }
    }
  }
};

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateFilename(type: string, format: string, period: string): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0].replace(/-/g, '');
  const typeMap: Record<string, string> = {
    sales: 'penjualan',
    products: 'produk',
    customers: 'pelanggan',
    payments: 'pembayaran',
    shifts: 'shift',
    inventory: 'inventori'
  };
  
  return `laporan_${typeMap[type]}_${period}_${timestamp}.${format}`;
}

function generateExcelContent(type: string, data: any): string {
  const template = exportTemplates[type as keyof typeof exportTemplates]?.excel;
  if (!template) {
    throw new Error('Template tidak ditemukan');
  }

  // Simple CSV format for Excel (in real app, use proper Excel library)
  const headers = template.headers.join(',');
  const rows = template.data.map(row => row.join(',')).join('\n');
  
  return `${headers}\n${rows}`;
}

function generatePDFContent(type: string, data: any, period: string): any {
  const template = exportTemplates[type as keyof typeof exportTemplates]?.pdf;
  if (!template) {
    throw new Error('Template tidak ditemukan');
  }

  return {
    title: template.title,
    subtitle: template.subtitle.replace('{period}', period),
    summary: template.summary,
    generatedAt: new Date().toLocaleString('id-ID'),
    // In real app, this would contain actual PDF content
    content: 'PDF content would be generated here using a PDF library like jsPDF or Puppeteer'
  };
}

function getDateRangeString(period: string, startDate?: string, endDate?: string): string {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return now.toLocaleDateString('id-ID');
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString('id-ID');
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return `${weekStart.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')}`;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${monthStart.toLocaleDateString('id-ID')} - ${monthEnd.toLocaleDateString('id-ID')}`;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return `${quarterStart.toLocaleDateString('id-ID')} - ${quarterEnd.toLocaleDateString('id-ID')}`;
    case 'year':
      return now.getFullYear().toString();
    case 'custom':
      const start = startDate ? new Date(startDate).toLocaleDateString('id-ID') : '';
      const end = endDate ? new Date(endDate).toLocaleDateString('id-ID') : '';
      return `${start} - ${end}`;
    default:
      return now.toLocaleDateString('id-ID');
  }
}

// ======================================================================
// API HANDLERS
// ======================================================================

// POST /api/reports/export - Export report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = ExportQuerySchema.parse(body);

    const periodString = getDateRangeString(query.period, query.startDate, query.endDate);
    const filename = query.filename || generateFilename(query.type, query.format, query.period);

    let content: any;
    let contentType: string;
    let fileExtension: string;

    if (query.format === 'excel') {
      content = generateExcelContent(query.type, {});
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else if (query.format === 'pdf') {
      content = generatePDFContent(query.type, {}, periodString);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      return NextResponse.json({
        success: false,
        error: 'Format ekspor tidak didukung'
      }, { status: 400 });
    }

    // In real application, you would:
    // 1. Generate actual Excel file using libraries like ExcelJS
    // 2. Generate actual PDF using libraries like jsPDF or Puppeteer
    // 3. Store the file temporarily or return as blob
    // 4. Provide download URL

    // For now, return mock response
    return NextResponse.json({
      success: true,
      data: {
        filename,
        contentType,
        fileExtension,
        size: query.format === 'excel' ? content.length : 1024, // Mock size
        downloadUrl: `/api/reports/download/${filename}`, // Mock download URL
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        preview: query.format === 'pdf' ? content : null
      },
      message: `Laporan ${query.type} berhasil diekspor ke format ${query.format.toUpperCase()}`
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parameter ekspor tidak valid',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/reports/export - Get export templates and options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type && !['sales', 'products', 'customers', 'payments', 'shifts', 'inventory'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipe laporan tidak valid'
      }, { status: 400 });
    }

    const templates = type ? 
      { [type]: exportTemplates[type as keyof typeof exportTemplates] } : 
      exportTemplates;

    const exportOptions = {
      formats: [
        { value: 'excel', label: 'Excel (.xlsx)', icon: 'excel' },
        { value: 'pdf', label: 'PDF (.pdf)', icon: 'pdf' }
      ],
      periods: [
        { value: 'today', label: 'Hari Ini' },
        { value: 'yesterday', label: 'Kemarin' },
        { value: 'week', label: 'Minggu Ini' },
        { value: 'month', label: 'Bulan Ini' },
        { value: 'quarter', label: 'Kuartal Ini' },
        { value: 'year', label: 'Tahun Ini' },
        { value: 'custom', label: 'Periode Kustom' }
      ],
      reportTypes: [
        { value: 'sales', label: 'Laporan Penjualan', description: 'Transaksi, pendapatan, dan analisis penjualan' },
        { value: 'products', label: 'Laporan Produk', description: 'Inventori, stok, dan performa produk' },
        { value: 'customers', label: 'Laporan Pelanggan', description: 'Data pelanggan dan analisis demografis' },
        { value: 'payments', label: 'Laporan Pembayaran', description: 'Metode pembayaran dan rekonsiliasi' },
        { value: 'shifts', label: 'Laporan Shift', description: 'Kinerja kasir dan shift kerja' },
        { value: 'inventory', label: 'Laporan Inventori', description: 'Pergerakan stok dan nilai inventori' }
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        templates,
        options: exportOptions
      }
    });

  } catch (error) {
    console.error('Error fetching export options:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}