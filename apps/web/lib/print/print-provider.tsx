// ======================================================================
// PRINT PROVIDER
// Provider untuk mengelola fungsionalitas pencetakan dalam aplikasi
// ======================================================================

'use client';

import React, { createContext, useContext, useCallback } from 'react';

type PrintOptions = {
  title?: string;
  styles?: string;
  removeAfterPrint?: boolean;
};

type PrintProviderState = {
  printElement: (element: HTMLElement, options?: PrintOptions) => void;
  printHTML: (html: string, options?: PrintOptions) => void;
  printReceipt: (receiptData: any) => void;
};

const PrintProviderContext = createContext<PrintProviderState | undefined>(undefined);

export function PrintProvider({ children }: { children: React.ReactNode }) {
  const printElement = useCallback((element: HTMLElement, options: PrintOptions = {}) => {
    const {
      title = 'Print',
      styles = '',
      removeAfterPrint = true
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Tidak dapat membuka jendela print');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            ${styles}
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      if (removeAfterPrint) {
        printWindow.close();
      }
    };
  }, []);

  const printHTML = useCallback((html: string, options: PrintOptions = {}) => {
    const {
      title = 'Print',
      styles = '',
      removeAfterPrint = true
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Tidak dapat membuka jendela print');
      return;
    }

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            ${styles}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    printWindow.document.write(fullHTML);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      if (removeAfterPrint) {
        printWindow.close();
      }
    };
  }, []);

  const printReceipt = useCallback((receiptData: any) => {
    const receiptHTML = `
      <div style="width: 80mm; font-family: monospace; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 0;">${receiptData.storeName || 'TOKO SAYA'}</h3>
          <p style="margin: 0; font-size: 10px;">${receiptData.storeAddress || 'Alamat Toko'}</p>
          <p style="margin: 0; font-size: 10px;">Telp: ${receiptData.storePhone || '-'}</p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 5px;">
          <p style="margin: 0;">No: ${receiptData.receiptNumber || '-'}</p>
          <p style="margin: 0;">Tanggal: ${receiptData.date || new Date().toLocaleDateString('id-ID')}</p>
          <p style="margin: 0;">Kasir: ${receiptData.cashier || '-'}</p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 5px;">
          ${receiptData.items?.map((item: any) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>${item.name}</span>
              <span>Rp ${item.total?.toLocaleString('id-ID') || 0}</span>
            </div>
            <div style="font-size: 10px; color: #666; margin-bottom: 3px;">
              ${item.quantity} x Rp ${item.price?.toLocaleString('id-ID') || 0}
            </div>
          `).join('') || ''}
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>Rp ${receiptData.subtotal?.toLocaleString('id-ID') || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>PPN (${receiptData.taxRate || 11}%):</span>
            <span>Rp ${receiptData.tax?.toLocaleString('id-ID') || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>Total:</span>
            <span>Rp ${receiptData.total?.toLocaleString('id-ID') || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <span>Bayar:</span>
            <span>Rp ${receiptData.paid?.toLocaleString('id-ID') || 0}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Kembali:</span>
            <span>Rp ${receiptData.change?.toLocaleString('id-ID') || 0}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 15px; font-size: 10px;">
          <p style="margin: 0;">Terima kasih atas kunjungan Anda</p>
          <p style="margin: 0;">Barang yang sudah dibeli tidak dapat dikembalikan</p>
        </div>
      </div>
    `;

    printHTML(receiptHTML, {
      title: 'Struk Pembayaran',
      styles: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 5mm; }
        }
      `
    });
  }, [printHTML]);

  const value = {
    printElement,
    printHTML,
    printReceipt,
  };

  return (
    <PrintProviderContext.Provider value={value}>
      {children}
    </PrintProviderContext.Provider>
  );
}

export const usePrint = () => {
  const context = useContext(PrintProviderContext);

  if (context === undefined)
    throw new Error('usePrint must be used within a PrintProvider');

  return context;
};