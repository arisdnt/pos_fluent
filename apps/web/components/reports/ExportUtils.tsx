'use client';

// ======================================================================
// EXPORT UTILITIES
// Komponen dan utilitas untuk ekspor laporan ke Excel/PDF
// ======================================================================

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Input,
  Label,
  Dropdown,
  Option,
  Checkbox,
  Text,
  Caption1,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  DocumentTableRegular,
  DocumentPdfRegular,
  SettingsRegular,
  ArrowDownloadRegular
} from '@fluentui/react-icons';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '400px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  formRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  exportProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  errorMessage: {
    marginTop: tokens.spacingVerticalS
  }
});

// ======================================================================
// TYPES
// ======================================================================

interface ExportOptions {
  format: 'excel' | 'pdf';
  filename: string;
  template: string;
  includeHeaders: boolean;
  includeSummary: boolean;
  includeCharts: boolean;
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  currencyFormat: 'IDR' | 'USD' | 'EUR';
  paperSize?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

interface ExportDialogProps {
  reportType: string;
  reportData: any[];
  summary?: any;
  onExport: (options: ExportOptions) => Promise<void>;
  children: React.ReactNode;
}

interface ExportButtonProps {
  format: 'excel' | 'pdf';
  reportType: string;
  reportData: any[];
  summary?: any;
  onExport: (options: ExportOptions) => Promise<void>;
  disabled?: boolean;
  appearance?: 'primary' | 'secondary' | 'outline';
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const generateDefaultFilename = (reportType: string, format: string): string => {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  return `laporan_${reportType}_${date}_${time}.${format}`;
};

const getReportTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    sales: 'Penjualan',
    products: 'Produk',
    customers: 'Pelanggan',
    payments: 'Pembayaran',
    shifts: 'Shift',
    inventory: 'Inventori'
  };
  return labels[type] || type;
};

const getTemplateOptions = (reportType: string, format: string) => {
  const templates: Record<string, Record<string, string[]>> = {
    sales: {
      excel: ['Standard', 'Ringkas', 'Detail', 'Analitik'],
      pdf: ['Standard', 'Executive Summary', 'Detail dengan Chart']
    },
    products: {
      excel: ['Daftar Produk', 'Stok & Harga', 'Analisis Margin'],
      pdf: ['Katalog Produk', 'Laporan Stok', 'Analisis Performa']
    },
    customers: {
      excel: ['Daftar Pelanggan', 'Analisis Pembelian', 'Segmentasi'],
      pdf: ['Profil Pelanggan', 'Analisis Loyalitas', 'Demografi']
    }
  };
  
  return templates[reportType]?.[format] || ['Standard'];
};

// ======================================================================
// EXPORT DIALOG COMPONENT
// ======================================================================

export function ExportDialog({ reportType, reportData, summary, onExport, children }: ExportDialogProps) {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'excel',
    filename: generateDefaultFilename(reportType, 'excel'),
    template: 'Standard',
    includeHeaders: true,
    includeSummary: true,
    includeCharts: false,
    dateFormat: 'dd/mm/yyyy',
    currencyFormat: 'IDR',
    paperSize: 'A4',
    orientation: 'portrait'
  });

  const handleFormatChange = (format: 'excel' | 'pdf') => {
    setOptions(prev => ({
      ...prev,
      format,
      filename: generateDefaultFilename(reportType, format),
      template: getTemplateOptions(reportType, format)[0]
    }));
  };

  const handleOptionChange = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      await onExport(options);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  const templateOptions = getTemplateOptions(reportType, options.format);

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {children}
      </DialogTrigger>
      <DialogSurface>
        <DialogTitle>
          Ekspor Laporan {getReportTypeLabel(reportType)}
        </DialogTitle>
        <DialogContent>
          <div className={styles.dialogContent}>
            {/* Format Selection */}
            <div className={styles.formGroup}>
              <Label>Format Ekspor</Label>
              <div className={styles.formRow}>
                <Button
                  appearance={options.format === 'excel' ? 'primary' : 'secondary'}
                  icon={<DocumentTableRegular />}
                  onClick={() => handleFormatChange('excel')}
                >
                  Excel (.xlsx)
                </Button>
                <Button
                  appearance={options.format === 'pdf' ? 'primary' : 'secondary'}
                  icon={<DocumentPdfRegular />}
                  onClick={() => handleFormatChange('pdf')}
                >
                  PDF (.pdf)
                </Button>
              </div>
            </div>

            {/* Filename */}
            <div className={styles.formGroup}>
              <Label>Nama File</Label>
              <Input
                value={options.filename}
                onChange={(_, data) => handleOptionChange('filename', data.value)}
                placeholder="Masukkan nama file"
              />
            </div>

            {/* Template */}
            <div className={styles.formGroup}>
              <Label>Template</Label>
              <Dropdown
                value={options.template}
                onOptionSelect={(_, data) => handleOptionChange('template', data.optionValue || 'Standard')}
              >
                {templateOptions.map(template => (
                  <Option key={template} value={template}>
                    {template}
                  </Option>
                ))}
              </Dropdown>
            </div>

            {/* Export Options */}
            <div className={styles.formGroup}>
              <Label>Opsi Ekspor</Label>
              <div className={styles.checkboxGroup}>
                <Checkbox
                  checked={options.includeHeaders}
                  onChange={(_, data) => handleOptionChange('includeHeaders', data.checked === true)}
                  label="Sertakan Header Kolom"
                />
                <Checkbox
                  checked={options.includeSummary}
                  onChange={(_, data) => handleOptionChange('includeSummary', data.checked === true)}
                  label="Sertakan Ringkasan"
                />
                <Checkbox
                  checked={options.includeCharts}
                  onChange={(_, data) => handleOptionChange('includeCharts', data.checked === true)}
                  label="Sertakan Grafik (hanya PDF)"
                  disabled={options.format === 'excel'}
                />
              </div>
            </div>

            {/* Format Options */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <Label>Format Tanggal</Label>
                <Dropdown
                  value={options.dateFormat}
                  onOptionSelect={(_, data) => handleOptionChange('dateFormat', data.optionValue as any)}
                >
                  <Option value="dd/mm/yyyy">DD/MM/YYYY</Option>
                  <Option value="mm/dd/yyyy">MM/DD/YYYY</Option>
                  <Option value="yyyy-mm-dd">YYYY-MM-DD</Option>
                </Dropdown>
              </div>
              <div className={styles.formGroup}>
                <Label>Format Mata Uang</Label>
                <Dropdown
                  value={options.currencyFormat}
                  onOptionSelect={(_, data) => handleOptionChange('currencyFormat', data.optionValue as any)}
                >
                  <Option value="IDR">Rupiah (IDR)</Option>
                  <Option value="USD">Dollar (USD)</Option>
                  <Option value="EUR">Euro (EUR)</Option>
                </Dropdown>
              </div>
            </div>

            {/* PDF Specific Options */}
            {options.format === 'pdf' && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label>Ukuran Kertas</Label>
                  <Dropdown
                    value={options.paperSize}
                    onOptionSelect={(_, data) => handleOptionChange('paperSize', data.optionValue as any)}
                  >
                    <Option value="A4">A4</Option>
                    <Option value="A3">A3</Option>
                    <Option value="Letter">Letter</Option>
                  </Dropdown>
                </div>
                <div className={styles.formGroup}>
                  <Label>Orientasi</Label>
                  <Dropdown
                    value={options.orientation}
                    onOptionSelect={(_, data) => handleOptionChange('orientation', data.optionValue as any)}
                  >
                    <Option value="portrait">Portrait</Option>
                    <Option value="landscape">Landscape</Option>
                  </Dropdown>
                </div>
              </div>
            )}

            {/* Export Progress */}
            {isExporting && (
              <div className={styles.exportProgress}>
                <Spinner size="small" />
                <Text>Sedang mengekspor laporan...</Text>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <MessageBar intent="error">
                  <MessageBarBody>
                    <MessageBarTitle>Error</MessageBarTitle>
                    {error}
                  </MessageBarBody>
                </MessageBar>
              </div>
            )}

            {/* Data Info */}
            <div className={styles.formGroup}>
              <Caption1>
                Data yang akan diekspor: {reportData.length} baris
                {summary && ' • Termasuk ringkasan'}
              </Caption1>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="secondary" disabled={isExporting}>
              Batal
            </Button>
          </DialogTrigger>
          <Button
            appearance="primary"
            icon={<ArrowDownloadRegular />}
            onClick={handleExport}
            disabled={isExporting || !options.filename.trim()}
          >
            {isExporting ? 'Mengekspor...' : `Ekspor ${options.format.toUpperCase()}`}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}

// ======================================================================
// EXPORT BUTTON COMPONENT
// ======================================================================

export function ExportButton({
  format,
  reportType,
  reportData,
  summary,
  onExport,
  disabled = false,
  appearance = 'secondary'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format,
        filename: generateDefaultFilename(reportType, format),
        template: 'Standard',
        includeHeaders: true,
        includeSummary: true,
        includeCharts: false,
        dateFormat: 'dd/mm/yyyy',
        currencyFormat: 'IDR',
        paperSize: 'A4',
        orientation: 'portrait'
      };
      
      await onExport(options);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      appearance={appearance}
      icon={format === 'excel' ? <DocumentTableRegular /> : <DocumentPdfRegular />}
      onClick={handleQuickExport}
      disabled={disabled || isExporting}
    >
      {isExporting ? 'Mengekspor...' : `Ekspor ${format.toUpperCase()}`}
    </Button>
  );
}

// ======================================================================
// ADVANCED EXPORT BUTTON COMPONENT
// ======================================================================

export function AdvancedExportButton({
  reportType,
  reportData,
  summary,
  onExport,
  disabled = false
}: Omit<ExportButtonProps, 'format' | 'appearance'>) {
  return (
    <ExportDialog
      reportType={reportType}
      reportData={reportData}
      summary={summary}
      onExport={onExport}
    >
      <Button
        appearance="primary"
        icon={<SettingsRegular />}
        disabled={disabled}
      >
        Ekspor Lanjutan
      </Button>
    </ExportDialog>
  );
}

// ======================================================================
// EXPORT UTILITIES
// ======================================================================

export const ExportUtils = {
  generateDefaultFilename,
  getReportTypeLabel,
  getTemplateOptions,
  
  // Format data for export
  formatDataForExport: (data: any[], format: 'excel' | 'pdf', options: ExportOptions) => {
    // This would contain the actual formatting logic
    return data;
  },
  
  // Validate export options
  validateExportOptions: (options: ExportOptions): string[] => {
    const errors: string[] = [];
    
    if (!options.filename.trim()) {
      errors.push('Nama file tidak boleh kosong');
    }
    
    if (options.filename.includes('/') || options.filename.includes('\\')) {
      errors.push('Nama file tidak boleh mengandung karakter / atau \\');
    }
    
    return errors;
  },
  
  // Get file extension
  getFileExtension: (format: 'excel' | 'pdf'): string => {
    return format === 'excel' ? '.xlsx' : '.pdf';
  },
  
  // Get MIME type
  getMimeType: (format: 'excel' | 'pdf'): string => {
    return format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
  }
};

export type { ExportOptions, ExportDialogProps, ExportButtonProps };