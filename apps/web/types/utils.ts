// ======================================================================
// UTILITY TYPES UNTUK APLIKASI KASIR
// ======================================================================

// ======================================================================
// COMMON UTILITY TYPES
// ======================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// ======================================================================
// FORM TYPES
// ======================================================================

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

export interface FormValidation<T> {
  field: keyof T;
  rule: string;
  message: string;
  params?: any[];
}

export interface FormConfig<T> {
  initialValues: T;
  validations?: FormValidation<T>[];
  onSubmit: (values: T) => void | Promise<void>;
  onReset?: () => void;
}

// ======================================================================
// TABLE TYPES
// ======================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
  value: any;
}

export interface TableState {
  page: number;
  pageSize: number;
  sort?: TableSort;
  filters: TableFilter[];
  search?: string;
}

export interface TableConfig<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    total: number;
    current: number;
    pageSize: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
  };
  selection?: {
    type: 'checkbox' | 'radio';
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
  };
  onStateChange?: (state: TableState) => void;
}

// ======================================================================
// MODAL TYPES
// ======================================================================

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  className?: string;
}

export interface ConfirmModalProps extends Omit<ModalProps, 'onClose'> {
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonProps?: any;
  cancelButtonProps?: any;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// ======================================================================
// NOTIFICATION TYPES
// ======================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export interface ToastConfig {
  type: NotificationType;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  closable?: boolean;
}

// ======================================================================
// LOADING TYPES
// ======================================================================

export interface LoadingState {
  loading: boolean;
  error?: string;
  data?: any;
}

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  lastFetch?: Date;
}

export interface LoadingConfig {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  delay?: number;
}

// ======================================================================
// CURRENCY TYPES
// ======================================================================

export interface CurrencyConfig {
  code: string; // 'IDR'
  symbol: string; // 'Rp'
  locale: string; // 'id-ID'
  precision: number; // 0 for IDR
  thousandSeparator: string; // '.'
  decimalSeparator: string; // ','
  symbolPosition: 'before' | 'after'; // 'before'
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  compact?: boolean; // Show as 1.2K, 1.5M, etc.
  precision?: number;
}

// ======================================================================
// DATE TYPES
// ======================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateFormatOptions {
  format?: string;
  locale?: string;
  timezone?: string;
  relative?: boolean; // Show as "2 hours ago", etc.
}

export type DatePreset = 
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days';

// ======================================================================
// VALIDATION TYPES
// ======================================================================

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  numeric?: boolean;
  integer?: boolean;
  positive?: boolean;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};

// ======================================================================
// SEARCH TYPES
// ======================================================================

export interface SearchConfig {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  maxResults?: number;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  searchFields?: string[];
  highlightMatches?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    value: string;
    indices: [number, number][];
  }[];
}

export interface SearchResponse<T> {
  query: string;
  results: SearchResult<T>[];
  total: number;
  took: number; // milliseconds
}

// ======================================================================
// KEYBOARD TYPES
// ======================================================================

export type KeyboardKey = 
  | 'Enter'
  | 'Escape'
  | 'Space'
  | 'Tab'
  | 'Backspace'
  | 'Delete'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6'
  | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12';

export interface KeyboardShortcut {
  key: KeyboardKey;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export interface KeyboardEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

// ======================================================================
// PRINT TYPES
// ======================================================================

export interface PrintConfig {
  paperSize?: 'A4' | 'A5' | 'thermal-58' | 'thermal-80';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale?: number;
  copies?: number;
  silent?: boolean; // Print without dialog
}

export interface PrintTemplate {
  id: string;
  name: string;
  type: 'receipt' | 'invoice' | 'report';
  template: string; // HTML template
  styles: string; // CSS styles
  variables: string[]; // Available template variables
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export interface ExportColumn {
  key: string;
  title: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'boolean';
  transform?: (value: any) => any;
}

export interface ExportConfig {
  filename: string;
  format: 'excel' | 'csv' | 'pdf';
  columns: ExportColumn[];
  title?: string;
  subtitle?: string;
  footer?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter';
}

// ======================================================================
// THEME TYPES
// ======================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  divider: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
}

// ======================================================================
// STORAGE TYPES
// ======================================================================

export interface StorageConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  version?: string;
}

// ======================================================================
// PERFORMANCE TYPES
// ======================================================================

export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  bundleSize: number;
  apiResponseTime: number;
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  sampleRate: number; // 0-1
  reportInterval: number; // milliseconds
  thresholds: {
    renderTime: number;
    loadTime: number;
    memoryUsage: number;
    apiResponseTime: number;
  };
}

// ======================================================================
// ERROR BOUNDARY TYPES
// ======================================================================

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; errorInfo: ErrorInfo; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  children: React.ReactNode;
}

// ======================================================================
// ACCESSIBILITY TYPES
// ======================================================================

export interface A11yConfig {
  announceChanges: boolean;
  focusManagement: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-owns'?: string;
  'aria-activedescendant'?: string;
  role?: string;
  tabIndex?: number;
}