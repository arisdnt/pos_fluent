// ======================================================================
// KEYBOARD SHORTCUTS DATABASE
// Database komprehensif untuk semua keyboard shortcuts dalam aplikasi
// ======================================================================

export type ShortcutCategory = 
  | 'navigation'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'reports'
  | 'customers'
  | 'settings'
  | 'general';

export type ShortcutScope = 
  | 'global'
  | 'page-specific'
  | 'modal'
  | 'component';

export interface KeyboardShortcutDefinition {
  id: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean; // Untuk Mac Command key
  category: ShortcutCategory;
  scope: ShortcutScope;
  description: string;
  action: string; // Action identifier
  page?: string; // Halaman spesifik jika scope adalah page-specific
  enabled: boolean;
  priority: number; // Untuk mengatasi konflik shortcut
}

// ======================================================================
// GLOBAL SHORTCUTS - Tersedia di seluruh aplikasi
// ======================================================================

export const GLOBAL_SHORTCUTS: KeyboardShortcutDefinition[] = [
  // Navigation Shortcuts
  {
    id: 'nav-dashboard',
    key: 'd',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Dashboard',
    action: 'navigate-dashboard',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-pos',
    key: 'p',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka POS',
    action: 'navigate-pos',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-products',
    key: 'r',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Produk',
    action: 'navigate-products',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-inventory',
    key: 'i',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Inventori',
    action: 'navigate-inventory',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-customers',
    key: 'u',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Pelanggan',
    action: 'navigate-customers',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-reports',
    key: 't',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Laporan',
    action: 'navigate-reports',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-orders',
    key: 'o',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Pesanan',
    action: 'navigate-orders',
    enabled: true,
    priority: 1
  },
  {
    id: 'nav-settings',
    key: ',',
    ctrlKey: true,
    category: 'navigation',
    scope: 'global',
    description: 'Buka Pengaturan',
    action: 'navigate-settings',
    enabled: true,
    priority: 1
  },

  // General Shortcuts
  {
    id: 'general-search',
    key: 'k',
    ctrlKey: true,
    category: 'general',
    scope: 'global',
    description: 'Pencarian Global',
    action: 'open-search',
    enabled: true,
    priority: 1
  },
  {
    id: 'general-help',
    key: '?',
    shiftKey: true,
    category: 'general',
    scope: 'global',
    description: 'Tampilkan Bantuan/Shortcuts',
    action: 'show-help',
    enabled: true,
    priority: 1
  },
  {
    id: 'general-refresh',
    key: 'F5',
    category: 'general',
    scope: 'global',
    description: 'Refresh Halaman',
    action: 'refresh-page',
    enabled: true,
    priority: 1
  },
  {
    id: 'general-escape',
    key: 'Escape',
    category: 'general',
    scope: 'global',
    description: 'Tutup Modal/Dialog',
    action: 'close-modal',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// POS SHORTCUTS - Khusus halaman POS
// ======================================================================

export const POS_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'pos-new-transaction',
    key: 'n',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Transaksi Baru',
    action: 'pos-new-transaction',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-payment',
    key: 'Enter',
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Proses Pembayaran',
    action: 'pos-process-payment',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-barcode-scan',
    key: 'b',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Scan Barcode',
    action: 'pos-scan-barcode',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-customer-select',
    key: 'c',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Pilih Pelanggan',
    action: 'pos-select-customer',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-clear-cart',
    key: 'Delete',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Kosongkan Keranjang',
    action: 'pos-clear-cart',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-hold-transaction',
    key: 'h',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Tahan Transaksi',
    action: 'pos-hold-transaction',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-recall-transaction',
    key: 'r',
    ctrlKey: true,
    shiftKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Panggil Transaksi Tertahan',
    action: 'pos-recall-transaction',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-quantity-input',
    key: 'q',
    ctrlKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Input Kuantitas',
    action: 'pos-quantity-input',
    enabled: true,
    priority: 1
  },
  {
    id: 'pos-discount',
    key: 'd',
    ctrlKey: true,
    shiftKey: true,
    category: 'pos',
    scope: 'page-specific',
    page: '/pos',
    description: 'Berikan Diskon',
    action: 'pos-apply-discount',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// PRODUCTS SHORTCUTS - Khusus halaman Products
// ======================================================================

export const PRODUCTS_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'products-add',
    key: 'n',
    ctrlKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Tambah Produk Baru',
    action: 'products-add-new',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-edit',
    key: 'e',
    ctrlKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Edit Produk Terpilih',
    action: 'products-edit-selected',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-delete',
    key: 'Delete',
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Hapus Produk Terpilih',
    action: 'products-delete-selected',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-search',
    key: 'f',
    ctrlKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Cari Produk',
    action: 'products-search',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-filter',
    key: 'l',
    ctrlKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Filter Produk',
    action: 'products-filter',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-export',
    key: 'e',
    ctrlKey: true,
    shiftKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Export Data Produk',
    action: 'products-export',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-import',
    key: 'i',
    ctrlKey: true,
    shiftKey: true,
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Import Data Produk',
    action: 'products-import',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-next',
    key: 'ArrowDown',
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Pilih Produk Berikutnya',
    action: 'products-select-next',
    enabled: true,
    priority: 1
  },
  {
    id: 'products-prev',
    key: 'ArrowUp',
    category: 'products',
    scope: 'page-specific',
    page: '/products',
    description: 'Pilih Produk Sebelumnya',
    action: 'products-select-prev',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// INVENTORY SHORTCUTS - Khusus halaman Inventory
// ======================================================================

export const INVENTORY_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'inventory-adjustment',
    key: 'a',
    ctrlKey: true,
    category: 'inventory',
    scope: 'page-specific',
    page: '/inventory',
    description: 'Penyesuaian Stok',
    action: 'inventory-stock-adjustment',
    enabled: true,
    priority: 1
  },
  {
    id: 'inventory-reorder',
    key: 'r',
    ctrlKey: true,
    category: 'inventory',
    scope: 'page-specific',
    page: '/inventory',
    description: 'Reorder Stok',
    action: 'inventory-reorder',
    enabled: true,
    priority: 1
  },
  {
    id: 'inventory-low-stock',
    key: 'l',
    ctrlKey: true,
    category: 'inventory',
    scope: 'page-specific',
    page: '/inventory',
    description: 'Tampilkan Stok Rendah',
    action: 'inventory-show-low-stock',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// REPORTS SHORTCUTS - Khusus halaman Reports
// ======================================================================

export const REPORTS_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'reports-generate',
    key: 'g',
    ctrlKey: true,
    category: 'reports',
    scope: 'page-specific',
    page: '/reports',
    description: 'Generate Laporan',
    action: 'reports-generate',
    enabled: true,
    priority: 1
  },
  {
    id: 'reports-export-pdf',
    key: 'p',
    ctrlKey: true,
    shiftKey: true,
    category: 'reports',
    scope: 'page-specific',
    page: '/reports',
    description: 'Export ke PDF',
    action: 'reports-export-pdf',
    enabled: true,
    priority: 1
  },
  {
    id: 'reports-export-excel',
    key: 'x',
    ctrlKey: true,
    shiftKey: true,
    category: 'reports',
    scope: 'page-specific',
    page: '/reports',
    description: 'Export ke Excel',
    action: 'reports-export-excel',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// CUSTOMERS SHORTCUTS - Khusus halaman Customers
// ======================================================================

export const CUSTOMERS_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'customers-add',
    key: 'n',
    ctrlKey: true,
    category: 'customers',
    scope: 'page-specific',
    page: '/customers',
    description: 'Tambah Pelanggan Baru',
    action: 'customers-add-new',
    enabled: true,
    priority: 1
  },
  {
    id: 'customers-edit',
    key: 'e',
    ctrlKey: true,
    category: 'customers',
    scope: 'page-specific',
    page: '/customers',
    description: 'Edit Pelanggan Terpilih',
    action: 'customers-edit-selected',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// SETTINGS SHORTCUTS - Khusus halaman Settings
// ======================================================================

export const SETTINGS_SHORTCUTS: KeyboardShortcutDefinition[] = [
  {
    id: 'settings-save',
    key: 's',
    ctrlKey: true,
    category: 'settings',
    scope: 'page-specific',
    page: '/settings',
    description: 'Simpan Pengaturan',
    action: 'settings-save',
    enabled: true,
    priority: 1
  },
  {
    id: 'settings-reset',
    key: 'r',
    ctrlKey: true,
    shiftKey: true,
    category: 'settings',
    scope: 'page-specific',
    page: '/settings',
    description: 'Reset ke Default',
    action: 'settings-reset',
    enabled: true,
    priority: 1
  }
];

// ======================================================================
// MASTER SHORTCUTS DATABASE
// ======================================================================

export const ALL_SHORTCUTS: KeyboardShortcutDefinition[] = [
  ...GLOBAL_SHORTCUTS,
  ...POS_SHORTCUTS,
  ...PRODUCTS_SHORTCUTS,
  ...INVENTORY_SHORTCUTS,
  ...REPORTS_SHORTCUTS,
  ...CUSTOMERS_SHORTCUTS,
  ...SETTINGS_SHORTCUTS
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

/**
 * Mendapatkan shortcuts berdasarkan kategori
 */
export function getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcutDefinition[] {
  return ALL_SHORTCUTS.filter(shortcut => shortcut.category === category);
}

/**
 * Mendapatkan shortcuts berdasarkan scope
 */
export function getShortcutsByScope(scope: ShortcutScope): KeyboardShortcutDefinition[] {
  return ALL_SHORTCUTS.filter(shortcut => shortcut.scope === scope);
}

/**
 * Mendapatkan shortcuts untuk halaman tertentu
 */
export function getShortcutsForPage(page: string): KeyboardShortcutDefinition[] {
  return ALL_SHORTCUTS.filter(shortcut => 
    shortcut.scope === 'global' || shortcut.page === page
  );
}

/**
 * Mendapatkan shortcut berdasarkan ID
 */
export function getShortcutById(id: string): KeyboardShortcutDefinition | undefined {
  return ALL_SHORTCUTS.find(shortcut => shortcut.id === id);
}

/**
 * Format shortcut key untuk display
 */
export function formatShortcutKey(shortcut: KeyboardShortcutDefinition): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key);
  
  return parts.join(' + ');
}

/**
 * Cek apakah shortcut key sudah digunakan
 */
export function isShortcutConflict(newShortcut: Omit<KeyboardShortcutDefinition, 'id'>): boolean {
  return ALL_SHORTCUTS.some(existing => 
    existing.key === newShortcut.key &&
    existing.ctrlKey === newShortcut.ctrlKey &&
    existing.altKey === newShortcut.altKey &&
    existing.shiftKey === newShortcut.shiftKey &&
    existing.metaKey === newShortcut.metaKey &&
    existing.scope === newShortcut.scope &&
    existing.page === newShortcut.page
  );
}

/**
 * Mendapatkan shortcuts yang aktif berdasarkan konteks
 */
export function getActiveShortcuts(currentPage: string): KeyboardShortcutDefinition[] {
  return ALL_SHORTCUTS.filter(shortcut => 
    shortcut.enabled && (
      shortcut.scope === 'global' || 
      (shortcut.scope === 'page-specific' && shortcut.page === currentPage)
    )
  ).sort((a, b) => b.priority - a.priority);
}