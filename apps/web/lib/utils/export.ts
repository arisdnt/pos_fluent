// ======================================================================
// EXPORT/IMPORT UTILITIES
// Utilitas untuk ekspor dan impor data dalam berbagai format
// ======================================================================

import * as XLSX from 'xlsx';

// ======================================================================
// TYPES
// ======================================================================

export interface ExportConfig {
  filename: string;
  format: 'excel' | 'csv' | 'pdf' | 'json';
  includeHeaders: boolean;
  dateFormat: string;
  currencyFormat: string;
  sheetName?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter';
}

export interface ExportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
  width?: number;
  format?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ImportResult {
  success: boolean;
  data: any[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ImportConfig {
  skipFirstRow: boolean;
  dateFormat: string;
  currencyFormat: string;
  validateData: boolean;
  maxRows: number;
}

// ======================================================================
// EXCEL EXPORT/IMPORT
// ======================================================================

export class ExcelExporter {
  private config: ExportConfig;
  private columns: ExportColumn[];

  constructor(config: ExportConfig, columns: ExportColumn[]) {
    this.config = config;
    this.columns = columns;
  }

  // Export data to Excel
  async exportToExcel(data: any[]): Promise<void> {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = this.prepareDataForExport(data);
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData, {
        header: this.columns.map(col => col.key)
      });
      
      // Set column headers if enabled
      if (this.config.includeHeaders) {
        const headerRow: any = {};
        this.columns.forEach(col => {
          headerRow[col.key] = col.label;
        });
        XLSX.utils.sheet_add_json(worksheet, [headerRow], {
          origin: 'A1',
          skipHeader: true
        });
      }
      
      // Set column widths
      const columnWidths = this.columns.map(col => ({
        wch: col.width || 15
      }));
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, this.config.sheetName || 'Data');
      
      // Generate and download file
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });
      
      this.downloadFile(excelBuffer, this.config.filename + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Gagal mengekspor data ke Excel');
    }
  }

  // Export data to CSV
  async exportToCSV(data: any[]): Promise<void> {
    try {
      // Prepare data for export
      const exportData = this.prepareDataForExport(data);
      
      // Create CSV content
      let csvContent = '';
      
      // Add headers if enabled
      if (this.config.includeHeaders) {
        csvContent += this.columns.map(col => `"${col.label}"`).join(',') + '\n';
      }
      
      // Add data rows
      exportData.forEach(row => {
        const csvRow = this.columns.map(col => {
          const value = row[col.key] || '';
          return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes
        }).join(',');
        csvContent += csvRow + '\n';
      });
      
      // Convert to blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, this.config.filename + '.csv');
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Gagal mengekspor data ke CSV');
    }
  }

  // Export data to JSON
  async exportToJSON(data: any[]): Promise<void> {
    try {
      // Prepare data for export
      const exportData = this.prepareDataForExport(data);
      
      // Create JSON content
      const jsonContent = JSON.stringify(exportData, null, 2);
      
      // Convert to blob and download
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      this.downloadBlob(blob, this.config.filename + '.json');
      
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Gagal mengekspor data ke JSON');
    }
  }

  // Prepare data for export based on column configuration
  private prepareDataForExport(data: any[]): any[] {
    return data.map(row => {
      const exportRow: any = {};
      
      this.columns.forEach(col => {
        let value = row[col.key];
        
        // Format value based on column type
        switch (col.type) {
          case 'date':
            if (value) {
              const date = new Date(value);
              value = this.formatDate(date);
            }
            break;
            
          case 'currency':
            if (value !== null && value !== undefined) {
              value = this.formatCurrency(Number(value));
            }
            break;
            
          case 'number':
            if (value !== null && value !== undefined) {
              value = Number(value);
            }
            break;
            
          case 'boolean':
            value = value ? 'Ya' : 'Tidak';
            break;
            
          default:
            value = String(value || '');
        }
        
        exportRow[col.key] = value;
      });
      
      return exportRow;
    });
  }

  // Format date according to configuration
  private formatDate(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    
    switch (this.config.dateFormat) {
      case 'dd/mm/yyyy':
        return date.toLocaleDateString('id-ID');
      case 'dd-mm-yyyy':
        return date.toLocaleDateString('id-ID').replace(/\//g, '-');
      case 'yyyy-mm-dd':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('id-ID');
    }
  }

  // Format currency according to configuration
  private formatCurrency(amount: number): string {
    if (isNaN(amount)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Download file as array buffer
  private downloadFile(buffer: ArrayBuffer, filename: string, mimeType: string): void {
    const blob = new Blob([buffer], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  // Download blob as file
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// ======================================================================
// EXCEL IMPORTER
// ======================================================================

export class ExcelImporter {
  private config: ImportConfig;
  private columns: ExportColumn[];

  constructor(config: ImportConfig, columns: ExportColumn[]) {
    this.config = config;
    this.columns = columns;
  }

  // Import data from Excel file
  async importFromExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
          }) as any[][];
          
          // Process imported data
          const result = this.processImportedData(jsonData);
          resolve(result);
          
        } catch (error) {
          reject(new Error('Gagal membaca file Excel: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Import data from CSV file
  async importFromCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const lines = csvText.split('\n').filter(line => line.trim());
          
          // Parse CSV lines
          const csvData = lines.map(line => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"';
                  i++; // Skip next quote
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            
            values.push(current.trim());
            return values;
          });
          
          // Process imported data
          const result = this.processImportedData(csvData);
          resolve(result);
          
        } catch (error) {
          reject(new Error('Gagal membaca file CSV: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }

  // Process imported data
  private processImportedData(rawData: any[][]): ImportResult {
    const result: ImportResult = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0
    };

    if (!rawData || rawData.length === 0) {
      result.errors.push('File kosong atau tidak valid');
      return result;
    }

    // Skip header row if configured
    const dataRows = this.config.skipFirstRow ? rawData.slice(1) : rawData;
    result.totalRows = dataRows.length;

    // Check max rows limit
    if (dataRows.length > this.config.maxRows) {
      result.warnings.push(`File memiliki ${dataRows.length} baris, hanya ${this.config.maxRows} baris pertama yang akan diproses`);
    }

    const processRows = dataRows.slice(0, this.config.maxRows);

    // Process each row
    processRows.forEach((row, index) => {
      try {
        const processedRow = this.processRow(row, index + 1);
        
        if (processedRow.isValid) {
          result.data.push(processedRow.data);
          result.validRows++;
        } else {
          result.invalidRows++;
          result.errors.push(...processedRow.errors.map(error => `Baris ${index + 1}: ${error}`));
        }
        
        if (processedRow.warnings.length > 0) {
          result.warnings.push(...processedRow.warnings.map(warning => `Baris ${index + 1}: ${warning}`));
        }
        
      } catch (error) {
        result.invalidRows++;
        result.errors.push(`Baris ${index + 1}: ${(error as Error).message}`);
      }
    });

    result.success = result.validRows > 0 && result.errors.length === 0;
    return result;
  }

  // Process individual row
  private processRow(row: any[], rowIndex: number): {
    isValid: boolean;
    data: any;
    errors: string[];
    warnings: string[];
  } {
    const processedData: any = {};
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    // Check if row has enough columns
    if (row.length < this.columns.length) {
      warnings.push('Jumlah kolom kurang dari yang diharapkan');
    }

    // Process each column
    this.columns.forEach((col, colIndex) => {
      const rawValue = row[colIndex] || '';
      
      try {
        const processedValue = this.processValue(rawValue, col);
        processedData[col.key] = processedValue;
        
      } catch (error) {
        errors.push(`Kolom ${col.label}: ${(error as Error).message}`);
        isValid = false;
      }
    });

    // Validate data if configured
    if (this.config.validateData && isValid) {
      const validationResult = this.validateRowData(processedData);
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
        isValid = false;
      }
      warnings.push(...validationResult.warnings);
    }

    return {
      isValid,
      data: processedData,
      errors,
      warnings
    };
  }

  // Process individual value based on column type
  private processValue(rawValue: any, column: ExportColumn): any {
    if (!rawValue && rawValue !== 0) {
      return null;
    }

    const stringValue = String(rawValue).trim();
    
    switch (column.type) {
      case 'number':
        const numValue = Number(stringValue.replace(/[^0-9.-]/g, ''));
        if (isNaN(numValue)) {
          throw new Error('Bukan angka yang valid');
        }
        return numValue;
        
      case 'currency':
        const currencyValue = this.parseCurrency(stringValue);
        if (isNaN(currencyValue)) {
          throw new Error('Format mata uang tidak valid');
        }
        return currencyValue;
        
      case 'date':
        const dateValue = this.parseDate(stringValue);
        if (!dateValue) {
          throw new Error('Format tanggal tidak valid');
        }
        return dateValue;
        
      case 'boolean':
        const lowerValue = stringValue.toLowerCase();
        if (['ya', 'yes', 'true', '1', 'benar'].includes(lowerValue)) {
          return true;
        } else if (['tidak', 'no', 'false', '0', 'salah'].includes(lowerValue)) {
          return false;
        } else {
          throw new Error('Format boolean tidak valid (gunakan: Ya/Tidak, True/False, 1/0)');
        }
        
      default:
        return stringValue;
    }
  }

  // Parse currency string to number
  private parseCurrency(value: string): number {
    // Remove currency symbols and separators
    const cleanValue = value.replace(/[Rp\s\.]/g, '').replace(',', '.');
    return parseFloat(cleanValue);
  }

  // Parse date string to Date object
  private parseDate(value: string): Date | null {
    if (!value) return null;
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-mm-yyyy
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
    ];
    
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        let day, month, year;
        
        if (format === formats[2]) { // yyyy-mm-dd
          [, year, month, day] = match;
        } else { // dd/mm/yyyy or dd-mm-yyyy
          [, day, month, year] = match;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try parsing as ISO string
    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    return null;
  }

  // Validate row data (override in subclasses for specific validation)
  protected validateRowData(data: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

// ======================================================================
// PDF EXPORT (Basic implementation)
// ======================================================================

export class PDFExporter {
  private config: ExportConfig;
  private columns: ExportColumn[];

  constructor(config: ExportConfig, columns: ExportColumn[]) {
    this.config = config;
    this.columns = columns;
  }

  // Export data to PDF (basic HTML to PDF conversion)
  async exportToPDF(data: any[], title?: string): Promise<void> {
    try {
      // Create HTML content
      const htmlContent = this.createHTMLContent(data, title);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Gagal mengekspor data ke PDF');
    }
  }

  // Create HTML content for PDF
  private createHTMLContent(data: any[], title?: string): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .currency { text-align: right; }
        .number { text-align: right; }
        .center { text-align: center; }
        @media print {
          body { margin: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    `;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title || 'Laporan Data'}</title>
        ${styles}
      </head>
      <body>
    `;
    
    if (title) {
      html += `<h1>${title}</h1>`;
    }
    
    html += '<table>';
    
    // Add headers
    if (this.config.includeHeaders) {
      html += '<thead><tr>';
      this.columns.forEach(col => {
        html += `<th>${col.label}</th>`;
      });
      html += '</tr></thead>';
    }
    
    // Add data rows
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>';
      this.columns.forEach(col => {
        const value = row[col.key] || '';
        const cssClass = col.type === 'currency' || col.type === 'number' ? col.type : '';
        html += `<td class="${cssClass}">${this.formatValueForHTML(value, col.type)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
    html += '</body></html>';
    
    return html;
  }

  // Format value for HTML display
  private formatValueForHTML(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'currency':
        return this.formatCurrency(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString('id-ID');
      case 'boolean':
        return value ? 'Ya' : 'Tidak';
      default:
        return String(value);
    }
  }

  // Format currency
  private formatCurrency(amount: number): string {
    if (isNaN(amount)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// ======================================================================
// PREDEFINED EXPORTERS
// ======================================================================

// Create customer data exporter
export function createCustomerExporter(): ExcelExporter {
  const config: ExportConfig = {
    filename: `data-pelanggan-${new Date().toISOString().split('T')[0]}`,
    format: 'excel',
    includeHeaders: true,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'IDR',
    sheetName: 'Data Pelanggan'
  };
  
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID', type: 'string', width: 10 },
    { key: 'name', label: 'Nama', type: 'string', width: 25 },
    { key: 'email', label: 'Email', type: 'string', width: 30 },
    { key: 'phone', label: 'Telepon', type: 'string', width: 15 },
    { key: 'address', label: 'Alamat', type: 'string', width: 40 },
    { key: 'city', label: 'Kota', type: 'string', width: 15 },
    { key: 'memberType', label: 'Tipe Member', type: 'string', width: 15 },
    { key: 'totalTransactions', label: 'Total Transaksi', type: 'number', width: 15 },
    { key: 'totalSpent', label: 'Total Belanja', type: 'currency', width: 15 },
    { key: 'lastTransaction', label: 'Transaksi Terakhir', type: 'date', width: 15 },
    { key: 'status', label: 'Status', type: 'string', width: 10 }
  ];
  
  return new ExcelExporter(config, columns);
}

// Create product data exporter
export function createProductExporter(): ExcelExporter {
  const config: ExportConfig = {
    filename: `data-produk-${new Date().toISOString().split('T')[0]}`,
    format: 'excel',
    includeHeaders: true,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'IDR',
    sheetName: 'Data Produk'
  };
  
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID', type: 'string', width: 10 },
    { key: 'name', label: 'Nama Produk', type: 'string', width: 30 },
    { key: 'sku', label: 'SKU', type: 'string', width: 15 },
    { key: 'barcode', label: 'Barcode', type: 'string', width: 15 },
    { key: 'category', label: 'Kategori', type: 'string', width: 15 },
    { key: 'price', label: 'Harga Jual', type: 'currency', width: 15 },
    { key: 'cost', label: 'Harga Beli', type: 'currency', width: 15 },
    { key: 'stock', label: 'Stok', type: 'number', width: 10 },
    { key: 'minStock', label: 'Stok Minimum', type: 'number', width: 12 },
    { key: 'unit', label: 'Satuan', type: 'string', width: 10 },
    { key: 'status', label: 'Status', type: 'string', width: 10 }
  ];
  
  return new ExcelExporter(config, columns);
}

// Create transaction data exporter
export function createTransactionExporter(): ExcelExporter {
  const config: ExportConfig = {
    filename: `data-transaksi-${new Date().toISOString().split('T')[0]}`,
    format: 'excel',
    includeHeaders: true,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'IDR',
    sheetName: 'Data Transaksi'
  };
  
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID', type: 'string', width: 10 },
    { key: 'transactionNumber', label: 'No. Transaksi', type: 'string', width: 15 },
    { key: 'customerName', label: 'Nama Pelanggan', type: 'string', width: 25 },
    { key: 'itemCount', label: 'Jumlah Item', type: 'number', width: 12 },
    { key: 'subtotal', label: 'Subtotal', type: 'currency', width: 15 },
    { key: 'tax', label: 'Pajak', type: 'currency', width: 15 },
    { key: 'discount', label: 'Diskon', type: 'currency', width: 15 },
    { key: 'total', label: 'Total', type: 'currency', width: 15 },
    { key: 'paymentMethod', label: 'Metode Bayar', type: 'string', width: 15 },
    { key: 'paymentStatus', label: 'Status Bayar', type: 'string', width: 12 },
    { key: 'status', label: 'Status', type: 'string', width: 10 },
    { key: 'createdAt', label: 'Tanggal', type: 'date', width: 15 }
  ];
  
  return new ExcelExporter(config, columns);
}

// Create inventory data exporter
export function createInventoryExporter(): ExcelExporter {
  const config: ExportConfig = {
    filename: `data-inventori-${new Date().toISOString().split('T')[0]}`,
    format: 'excel',
    includeHeaders: true,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'IDR',
    sheetName: 'Data Inventori'
  };
  
  const columns: ExportColumn[] = [
    { key: 'id', label: 'ID', type: 'string', width: 10 },
    { key: 'name', label: 'Nama Produk', type: 'string', width: 30 },
    { key: 'sku', label: 'SKU', type: 'string', width: 15 },
    { key: 'category', label: 'Kategori', type: 'string', width: 15 },
    { key: 'currentStock', label: 'Stok Saat Ini', type: 'number', width: 12 },
    { key: 'minStock', label: 'Stok Minimum', type: 'number', width: 12 },
    { key: 'maxStock', label: 'Stok Maksimum', type: 'number', width: 12 },
    { key: 'stockValue', label: 'Nilai Stok', type: 'currency', width: 15 },
    { key: 'lastRestockDate', label: 'Restock Terakhir', type: 'date', width: 15 },
    { key: 'stockStatus', label: 'Status Stok', type: 'string', width: 12 }
  ];
  
  return new ExcelExporter(config, columns);
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

// Validate file type for import
export function validateImportFile(file: File, allowedTypes: string[]): boolean {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension || '');
}

// Get file size in human readable format
export function getFileSizeString(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create download link for data
export function createDownloadLink(data: any, filename: string, mimeType: string): string {
  const blob = new Blob([data], { type: mimeType });
  return window.URL.createObjectURL(blob);
}

// Cleanup download link
export function cleanupDownloadLink(url: string): void {
  window.URL.revokeObjectURL(url);
}