// ======================================================================
// POS COMPONENTS INDEX
// Export semua komponen Point of Sale
// ======================================================================

// Core POS Components
export { default as ShoppingCart } from './shopping-cart';
export { default as PaymentDialog } from './payment-dialog';
export { default as ProductSearch } from './product-search';
export { default as BarcodeScanner } from './barcode-scanner';
export { default as CustomerSelector } from './customer-selector';
export { default as TransactionSummary } from './transaction-summary';
export { default as ShiftManagement } from './shift-management';
export { default as TransactionHistory } from './transaction-history';

// Export types from each component
export type {
  CartItem,
  ShoppingCartProps
} from './shopping-cart';

export type {
  PaymentMethod,
  SplitPayment,
  PaymentDialogProps
} from './payment-dialog';

export type {
  Product,
  Category,
  Brand,
  ProductSearchProps
} from './product-search';

export type {
  BarcodeScannerProps
} from './barcode-scanner';

export type {
  Customer,
  CustomerSelectorProps
} from './customer-selector';

export type {
  TransactionSummaryProps,
  CalculationResult
} from './transaction-summary';

export type {
  ShiftManagementProps,
  ShiftData,
  CashDenomination,
  ShiftTransaction
} from './shift-management';

export type {
  TransactionHistoryProps,
  Transaction,
  TransactionItem,
  TransactionPayment
} from './transaction-history';

// Re-export utility functions
export {
  useTransactionCalculation,
  calculateItemTotal,
  calculateItemTax,
  applyRounding
} from './transaction-summary';