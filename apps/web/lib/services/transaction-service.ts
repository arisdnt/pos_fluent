// ======================================================================
// TRANSACTION SERVICE
// Service untuk menangani transaksi POS
// ======================================================================

import { z } from 'zod';
import { posService, type CartItem, type Customer, type Product } from './pos-service';
import { paymentService, type Payment, type PaymentSplit } from './payment-service';
import { taxService } from './tax-service';

// ======================================================================
// TYPES & INTERFACES
// ======================================================================

export interface TransactionItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountReason?: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  notes?: string;
  isRefunded?: boolean;
  refundedQuantity?: number;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  number: string;
  type: 'sale' | 'refund' | 'void' | 'exchange';
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded' | 'voided';
  
  // Items
  items: TransactionItem[];
  itemCount: number;
  totalQuantity: number;
  
  // Customer
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Amounts
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  
  // Payments
  payments: Payment[];
  totalPaid: number;
  totalChange: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  
  // Metadata
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  terminalId?: string;
  locationId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Additional info
  notes?: string;
  tags?: string[];
  referenceNumber?: string;
  originalTransactionId?: string; // For refunds/voids
  
  // Audit
  createdBy: string;
  updatedBy: string;
  version: number;
}

export interface TransactionSummary {
  subtotal: number;
  itemDiscount: number;
  customerDiscount: number;
  additionalDiscount: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  roundingAdjustment: number;
  finalAmount: number;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  status?: Transaction['status'][];
  type?: Transaction['type'][];
  cashierId?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  search?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  averageTransaction: number;
  transactionsByStatus: Record<string, number>;
  transactionsByType: Record<string, number>;
  transactionsByHour: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amount: number;
  }>;
  paymentMethodStats: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface RefundRequest {
  originalTransactionId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  refundAmount?: number;
  refundToOriginalPayment: boolean;
  notes?: string;
}

export interface VoidRequest {
  transactionId: string;
  reason: string;
  managerApproval?: string;
  notes?: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const TransactionItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percentage', 'fixed']).default('fixed'),
  notes: z.string().optional()
});

const RefundRequestSchema = z.object({
  originalTransactionId: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().min(0.01),
    reason: z.string().min(1)
  })).min(1),
  reason: z.string().min(1),
  refundAmount: z.number().min(0).optional(),
  refundToOriginalPayment: z.boolean().default(true),
  notes: z.string().optional()
});

const VoidRequestSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(1),
  managerApproval: z.string().optional(),
  notes: z.string().optional()
});

// ======================================================================
// TRANSACTION SERVICE CLASS
// ======================================================================

export class TransactionService {
  private transactions: Map<string, Transaction> = new Map();
  private transactionCounter: number = 1;

  constructor() {
    this.initializeMockData();
  }

  // ======================================================================
  // INITIALIZATION
  // ======================================================================

  /**
   * Initialize mock transaction data
   */
  private initializeMockData(): void {
    // Create some sample transactions for testing
    const sampleTransactions = this.generateSampleTransactions();
    sampleTransactions.forEach(transaction => {
      this.transactions.set(transaction.id, transaction);
    });
  }

  /**
   * Generate sample transactions
   */
  private generateSampleTransactions(): Transaction[] {
    const transactions: Transaction[] = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const transactionDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const transaction = this.createSampleTransaction(transactionDate, i + 1);
      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Create sample transaction
   */
  private createSampleTransaction(date: Date, index: number): Transaction {
    const transactionId = `txn-${Date.now()}-${index}`;
    const transactionNumber = this.generateTransactionNumber();

    // Sample items
    const items: TransactionItem[] = [
      {
        id: `item-${index}-1`,
        productId: 'prod-001',
        productCode: 'BRG001',
        productName: 'Indomie Goreng',
        productCategory: 'Makanan',
        quantity: 2,
        unitPrice: 3500,
        originalPrice: 3500,
        discount: 0,
        discountType: 'fixed',
        subtotal: 7000,
        taxAmount: 700,
        taxRate: 10,
        total: 7700
      },
      {
        id: `item-${index}-2`,
        productId: 'prod-002',
        productCode: 'BRG002',
        productName: 'Aqua 600ml',
        productCategory: 'Minuman',
        quantity: 1,
        unitPrice: 3000,
        originalPrice: 3000,
        discount: 0,
        discountType: 'fixed',
        subtotal: 3000,
        taxAmount: 300,
        taxRate: 10,
        total: 3300
      }
    ];

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;

    // Sample payment
    const payment: Payment = {
      id: `pay-${index}`,
      methodId: 'cash',
      methodName: 'Tunai',
      methodType: 'cash',
      amount: totalAmount,
      fee: 0,
      netAmount: totalAmount,
      status: 'completed',
      processedAt: date
    };

    return {
      id: transactionId,
      number: transactionNumber,
      type: 'sale',
      status: 'completed',
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      customerId: index % 3 === 0 ? `cust-${index}` : undefined,
      customerName: index % 3 === 0 ? `Pelanggan ${index}` : undefined,
      subtotal,
      totalDiscount: 0,
      totalTax,
      totalAmount,
      payments: [payment],
      totalPaid: totalAmount,
      totalChange: 0,
      paymentStatus: 'paid',
      cashierId: 'cashier-001',
      cashierName: 'Kasir 1',
      shiftId: `shift-${Math.floor(index / 10)}`,
      terminalId: 'terminal-001',
      createdAt: date,
      updatedAt: date,
      completedAt: date,
      createdBy: 'cashier-001',
      updatedBy: 'cashier-001',
      version: 1
    };
  }

  // ======================================================================
  // TRANSACTION CREATION
  // ======================================================================

  /**
   * Create new transaction
   */
  createTransaction(
    cashierId: string,
    cashierName: string,
    customerId?: string,
    shiftId?: string
  ): Transaction {
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionNumber = this.generateTransactionNumber();

    const transaction: Transaction = {
      id: transactionId,
      number: transactionNumber,
      type: 'sale',
      status: 'draft',
      items: [],
      itemCount: 0,
      totalQuantity: 0,
      customerId,
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalAmount: 0,
      payments: [],
      totalPaid: 0,
      totalChange: 0,
      paymentStatus: 'unpaid',
      cashierId,
      cashierName,
      shiftId,
      terminalId: 'terminal-001', // TODO: Get from config
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: cashierId,
      updatedBy: cashierId,
      version: 1
    };

    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  /**
   * Generate transaction number
   */
  private generateTransactionNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const counter = this.transactionCounter.toString().padStart(4, '0');
    
    this.transactionCounter++;
    
    return `TXN${year}${month}${day}${counter}`;
  }

  // ======================================================================
  // TRANSACTION MANAGEMENT
  // ======================================================================

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): Transaction | null {
    return this.transactions.get(id) || null;
  }

  /**
   * Get transaction by number
   */
  getTransactionByNumber(number: string): Transaction | null {
    for (const transaction of this.transactions.values()) {
      if (transaction.number === number) {
        return transaction;
      }
    }
    return null;
  }

  /**
   * Update transaction
   */
  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;

    const updatedTransaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date(),
      version: transaction.version + 1
    };

    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  /**
   * Delete transaction
   */
  deleteTransaction(id: string): boolean {
    return this.transactions.delete(id);
  }

  // ======================================================================
  // ITEM MANAGEMENT
  // ======================================================================

  /**
   * Add item to transaction
   */
  addItemToTransaction(
    transactionId: string,
    cartItem: CartItem,
    product: Product
  ): Transaction | null {
    const transaction = this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'draft') return null;

    const item: TransactionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productCategory: product.category,
      quantity: cartItem.quantity,
      unitPrice: cartItem.price,
      originalPrice: product.price,
      discount: cartItem.discount,
      discountType: cartItem.discountType,
      discountReason: cartItem.discountReason,
      subtotal: cartItem.subtotal,
      taxAmount: 0, // Will be calculated
      taxRate: 0,   // Will be calculated
      total: 0,     // Will be calculated
      notes: cartItem.notes
    };

    // Calculate tax
    const taxResult = taxService.calculateItemTax(item, product);
    item.taxAmount = taxResult.taxAmount;
    item.taxRate = taxResult.effectiveRate;
    item.total = item.subtotal + item.taxAmount;

    transaction.items.push(item);
    this.recalculateTransaction(transaction);

    return this.updateTransaction(transactionId, transaction);
  }

  /**
   * Update item in transaction
   */
  updateTransactionItem(
    transactionId: string,
    itemId: string,
    updates: Partial<TransactionItem>
  ): Transaction | null {
    const transaction = this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'draft') return null;

    const itemIndex = transaction.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const updatedItem = { ...transaction.items[itemIndex], ...updates };
    
    // Recalculate item totals
    updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice - updatedItem.discount;
    
    // Recalculate tax
    const product = posService.getProductById(updatedItem.productId);
    if (product) {
      const taxResult = taxService.calculateItemTax(updatedItem, product);
      updatedItem.taxAmount = taxResult.taxAmount;
      updatedItem.taxRate = taxResult.effectiveRate;
    }
    
    updatedItem.total = updatedItem.subtotal + updatedItem.taxAmount;

    transaction.items[itemIndex] = updatedItem;
    this.recalculateTransaction(transaction);

    return this.updateTransaction(transactionId, transaction);
  }

  /**
   * Remove item from transaction
   */
  removeItemFromTransaction(transactionId: string, itemId: string): Transaction | null {
    const transaction = this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'draft') return null;

    const itemIndex = transaction.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    transaction.items.splice(itemIndex, 1);
    this.recalculateTransaction(transaction);

    return this.updateTransaction(transactionId, transaction);
  }

  // ======================================================================
  // CALCULATION
  // ======================================================================

  /**
   * Recalculate transaction totals
   */
  private recalculateTransaction(transaction: Transaction): void {
    // Calculate item totals
    transaction.itemCount = transaction.items.length;
    transaction.totalQuantity = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
    transaction.subtotal = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
    transaction.totalTax = transaction.items.reduce((sum, item) => sum + item.taxAmount, 0);
    
    // Calculate discounts
    transaction.totalDiscount = transaction.items.reduce((sum, item) => sum + item.discount, 0);
    
    // Calculate total
    transaction.totalAmount = transaction.subtotal + transaction.totalTax;
    
    // Update payment status
    this.updatePaymentStatus(transaction);
  }

  /**
   * Calculate transaction summary
   */
  calculateTransactionSummary(
    transaction: Transaction,
    customer?: Customer,
    additionalDiscount?: number
  ): TransactionSummary {
    const itemDiscount = transaction.items.reduce((sum, item) => sum + item.discount, 0);
    
    // Customer discount (if applicable)
    let customerDiscount = 0;
    if (customer && customer.discountPercentage) {
      customerDiscount = transaction.subtotal * (customer.discountPercentage / 100);
    }

    const totalDiscount = itemDiscount + customerDiscount + (additionalDiscount || 0);
    const taxableAmount = transaction.subtotal - totalDiscount;
    const taxAmount = transaction.totalTax; // Already calculated per item
    const totalAmount = taxableAmount + taxAmount;
    
    // Rounding adjustment (round to nearest 50 or 100)
    const roundingAdjustment = this.calculateRoundingAdjustment(totalAmount);
    const finalAmount = totalAmount + roundingAdjustment;

    return {
      subtotal: transaction.subtotal,
      itemDiscount,
      customerDiscount,
      additionalDiscount: additionalDiscount || 0,
      totalDiscount,
      taxableAmount,
      taxAmount,
      totalAmount,
      roundingAdjustment,
      finalAmount
    };
  }

  /**
   * Calculate rounding adjustment
   */
  private calculateRoundingAdjustment(amount: number): number {
    const remainder = amount % 50;
    if (remainder === 0) return 0;
    
    if (remainder <= 25) {
      return -remainder; // Round down
    } else {
      return 50 - remainder; // Round up
    }
  }

  // ======================================================================
  // PAYMENT MANAGEMENT
  // ======================================================================

  /**
   * Add payment to transaction
   */
  async addPaymentToTransaction(
    transactionId: string,
    methodId: string,
    amount: number,
    reference?: string,
    authCode?: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    if (transaction.status !== 'draft' && transaction.status !== 'pending') {
      return { success: false, error: 'Transaksi tidak dapat diubah' };
    }

    // Process payment
    const paymentResult = await paymentService.processPayment(methodId, amount, reference, authCode);
    
    if (!paymentResult.success || !paymentResult.payment) {
      return { success: false, error: paymentResult.error };
    }

    // Add payment to transaction
    transaction.payments.push(paymentResult.payment);
    this.updatePaymentStatus(transaction);

    // Update transaction status
    if (transaction.paymentStatus === 'paid' || transaction.paymentStatus === 'overpaid') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
    } else {
      transaction.status = 'pending';
    }

    const updatedTransaction = this.updateTransaction(transactionId, transaction);
    return { success: true, transaction: updatedTransaction || undefined };
  }

  /**
   * Process split payment
   */
  async processSplitPayment(
    transactionId: string,
    paymentSplit: PaymentSplit
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) {
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    if (!paymentSplit.isComplete) {
      return { success: false, error: 'Pembayaran split belum lengkap' };
    }

    // Add all payments to transaction
    transaction.payments.push(...paymentSplit.payments);
    this.updatePaymentStatus(transaction);

    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = new Date();

    const updatedTransaction = this.updateTransaction(transactionId, transaction);
    return { success: true, transaction: updatedTransaction || undefined };
  }

  /**
   * Update payment status
   */
  private updatePaymentStatus(transaction: Transaction): void {
    transaction.totalPaid = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0);
    transaction.totalChange = transaction.payments.reduce((sum, payment) => sum + (payment.change || 0), 0);

    if (transaction.totalPaid === 0) {
      transaction.paymentStatus = 'unpaid';
    } else if (transaction.totalPaid < transaction.totalAmount) {
      transaction.paymentStatus = 'partial';
    } else if (transaction.totalPaid === transaction.totalAmount) {
      transaction.paymentStatus = 'paid';
    } else {
      transaction.paymentStatus = 'overpaid';
    }
  }

  // ======================================================================
  // TRANSACTION OPERATIONS
  // ======================================================================

  /**
   * Complete transaction
   */
  completeTransaction(transactionId: string): Transaction | null {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) return null;

    if (transaction.paymentStatus !== 'paid' && transaction.paymentStatus !== 'overpaid') {
      throw new Error('Pembayaran belum lengkap');
    }

    transaction.status = 'completed';
    transaction.completedAt = new Date();

    return this.updateTransaction(transactionId, transaction);
  }

  /**
   * Cancel transaction
   */
  cancelTransaction(transactionId: string, reason: string): Transaction | null {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) return null;

    if (transaction.status === 'completed') {
      throw new Error('Transaksi yang sudah selesai tidak dapat dibatalkan');
    }

    transaction.status = 'cancelled';
    transaction.cancelledAt = new Date();
    transaction.notes = (transaction.notes || '') + `\nDibatalkan: ${reason}`;

    return this.updateTransaction(transactionId, transaction);
  }

  /**
   * Process refund
   */
  async processRefund(refundRequest: RefundRequest): Promise<{
    success: boolean;
    refundTransaction?: Transaction;
    error?: string;
  }> {
    try {
      RefundRequestSchema.parse(refundRequest);

      const originalTransaction = this.getTransaction(refundRequest.originalTransactionId);
      if (!originalTransaction) {
        return { success: false, error: 'Transaksi asli tidak ditemukan' };
      }

      if (originalTransaction.status !== 'completed') {
        return { success: false, error: 'Hanya transaksi yang sudah selesai yang dapat di-refund' };
      }

      // Create refund transaction
      const refundTransaction = this.createRefundTransaction(originalTransaction, refundRequest);
      
      // Process refund payments
      if (refundRequest.refundToOriginalPayment) {
        await this.processRefundPayments(refundTransaction, originalTransaction);
      }

      // Mark original items as refunded
      this.markItemsAsRefunded(originalTransaction, refundRequest.items);

      return { success: true, refundTransaction };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memproses refund'
      };
    }
  }

  /**
   * Create refund transaction
   */
  private createRefundTransaction(
    originalTransaction: Transaction,
    refundRequest: RefundRequest
  ): Transaction {
    const refundId = `rfn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const refundNumber = this.generateTransactionNumber();

    // Create refund items
    const refundItems: TransactionItem[] = [];
    for (const refundItem of refundRequest.items) {
      const originalItem = originalTransaction.items.find(item => item.id === refundItem.itemId);
      if (originalItem) {
        const refundQuantity = Math.min(refundItem.quantity, originalItem.quantity);
        const refundRatio = refundQuantity / originalItem.quantity;

        refundItems.push({
          ...originalItem,
          id: `rfn-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: refundQuantity,
          subtotal: originalItem.subtotal * refundRatio,
          taxAmount: originalItem.taxAmount * refundRatio,
          total: originalItem.total * refundRatio,
          notes: `Refund: ${refundItem.reason}`
        });
      }
    }

    const subtotal = refundItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = refundItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;

    const refundTransaction: Transaction = {
      id: refundId,
      number: refundNumber,
      type: 'refund',
      status: 'completed',
      items: refundItems,
      itemCount: refundItems.length,
      totalQuantity: refundItems.reduce((sum, item) => sum + item.quantity, 0),
      customerId: originalTransaction.customerId,
      customerName: originalTransaction.customerName,
      customerPhone: originalTransaction.customerPhone,
      customerEmail: originalTransaction.customerEmail,
      subtotal,
      totalDiscount: 0,
      totalTax,
      totalAmount,
      payments: [],
      totalPaid: 0,
      totalChange: 0,
      paymentStatus: 'unpaid',
      cashierId: originalTransaction.cashierId,
      cashierName: originalTransaction.cashierName,
      shiftId: originalTransaction.shiftId,
      terminalId: originalTransaction.terminalId,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      originalTransactionId: originalTransaction.id,
      notes: refundRequest.notes,
      createdBy: originalTransaction.cashierId,
      updatedBy: originalTransaction.cashierId,
      version: 1
    };

    this.transactions.set(refundId, refundTransaction);
    return refundTransaction;
  }

  /**
   * Process refund payments
   */
  private async processRefundPayments(
    refundTransaction: Transaction,
    originalTransaction: Transaction
  ): Promise<void> {
    // For simplicity, refund to cash
    const refundPayment: Payment = {
      id: `rfn-pay-${Date.now()}`,
      methodId: 'cash',
      methodName: 'Tunai (Refund)',
      methodType: 'cash',
      amount: -refundTransaction.totalAmount, // Negative amount for refund
      fee: 0,
      netAmount: -refundTransaction.totalAmount,
      status: 'completed',
      processedAt: new Date()
    };

    refundTransaction.payments.push(refundPayment);
    refundTransaction.totalPaid = refundTransaction.totalAmount;
    refundTransaction.paymentStatus = 'paid';
  }

  /**
   * Mark items as refunded
   */
  private markItemsAsRefunded(
    originalTransaction: Transaction,
    refundItems: Array<{ itemId: string; quantity: number }>
  ): void {
    for (const refundItem of refundItems) {
      const originalItem = originalTransaction.items.find(item => item.id === refundItem.itemId);
      if (originalItem) {
        originalItem.isRefunded = true;
        originalItem.refundedQuantity = (originalItem.refundedQuantity || 0) + refundItem.quantity;
      }
    }

    this.updateTransaction(originalTransaction.id, originalTransaction);
  }

  /**
   * Void transaction
   */
  async voidTransaction(voidRequest: VoidRequest): Promise<{
    success: boolean;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      VoidRequestSchema.parse(voidRequest);

      const transaction = this.getTransaction(voidRequest.transactionId);
      if (!transaction) {
        return { success: false, error: 'Transaksi tidak ditemukan' };
      }

      if (transaction.status === 'voided') {
        return { success: false, error: 'Transaksi sudah di-void' };
      }

      if (transaction.status !== 'completed') {
        return { success: false, error: 'Hanya transaksi yang sudah selesai yang dapat di-void' };
      }

      // Update transaction status
      transaction.status = 'voided';
      transaction.notes = (transaction.notes || '') + `\nVoid: ${voidRequest.reason}`;
      if (voidRequest.managerApproval) {
        transaction.notes += `\nApproval: ${voidRequest.managerApproval}`;
      }

      const updatedTransaction = this.updateTransaction(voidRequest.transactionId, transaction);
      return { success: true, transaction: updatedTransaction || undefined };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal void transaksi'
      };
    }
  }

  // ======================================================================
  // QUERY & SEARCH
  // ======================================================================

  /**
   * Get transactions with filter
   */
  getTransactions(filter?: TransactionFilter): Transaction[] {
    let transactions = Array.from(this.transactions.values());

    if (!filter) return transactions;

    // Filter by date range
    if (filter.startDate) {
      transactions = transactions.filter(t => t.createdAt >= filter.startDate!);
    }
    if (filter.endDate) {
      transactions = transactions.filter(t => t.createdAt <= filter.endDate!);
    }

    // Filter by status
    if (filter.status && filter.status.length > 0) {
      transactions = transactions.filter(t => filter.status!.includes(t.status));
    }

    // Filter by type
    if (filter.type && filter.type.length > 0) {
      transactions = transactions.filter(t => filter.type!.includes(t.type));
    }

    // Filter by cashier
    if (filter.cashierId) {
      transactions = transactions.filter(t => t.cashierId === filter.cashierId);
    }

    // Filter by customer
    if (filter.customerId) {
      transactions = transactions.filter(t => t.customerId === filter.customerId);
    }

    // Filter by amount range
    if (filter.minAmount !== undefined) {
      transactions = transactions.filter(t => t.totalAmount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      transactions = transactions.filter(t => t.totalAmount <= filter.maxAmount!);
    }

    // Filter by payment method
    if (filter.paymentMethod) {
      transactions = transactions.filter(t => 
        t.payments.some(p => p.methodId === filter.paymentMethod)
      );
    }

    // Search in transaction number, customer name, or notes
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      transactions = transactions.filter(t => 
        t.number.toLowerCase().includes(searchTerm) ||
        t.customerName?.toLowerCase().includes(searchTerm) ||
        t.notes?.toLowerCase().includes(searchTerm) ||
        t.items.some(item => item.productName.toLowerCase().includes(searchTerm))
      );
    }

    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(filter?: TransactionFilter): TransactionStats {
    const transactions = this.getTransactions(filter);

    const stats: TransactionStats = {
      totalTransactions: transactions.length,
      totalAmount: 0,
      totalTax: 0,
      totalDiscount: 0,
      averageTransaction: 0,
      transactionsByStatus: {},
      transactionsByType: {},
      transactionsByHour: {},
      topProducts: [],
      paymentMethodStats: {}
    };

    // Calculate totals
    for (const transaction of transactions) {
      stats.totalAmount += transaction.totalAmount;
      stats.totalTax += transaction.totalTax;
      stats.totalDiscount += transaction.totalDiscount;

      // Count by status
      stats.transactionsByStatus[transaction.status] = 
        (stats.transactionsByStatus[transaction.status] || 0) + 1;

      // Count by type
      stats.transactionsByType[transaction.type] = 
        (stats.transactionsByType[transaction.type] || 0) + 1;

      // Count by hour
      const hour = transaction.createdAt.getHours().toString().padStart(2, '0');
      stats.transactionsByHour[hour] = 
        (stats.transactionsByHour[hour] || 0) + 1;

      // Payment method stats
      for (const payment of transaction.payments) {
        if (!stats.paymentMethodStats[payment.methodName]) {
          stats.paymentMethodStats[payment.methodName] = { count: 0, amount: 0 };
        }
        stats.paymentMethodStats[payment.methodName].count++;
        stats.paymentMethodStats[payment.methodName].amount += payment.amount;
      }
    }

    // Calculate average
    stats.averageTransaction = stats.totalTransactions > 0 
      ? stats.totalAmount / stats.totalTransactions 
      : 0;

    // Calculate top products
    const productStats = new Map<string, { name: string; quantity: number; amount: number }>();
    
    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const existing = productStats.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.amount += item.total;
        } else {
          productStats.set(item.productId, {
            name: item.productName,
            quantity: item.quantity,
            amount: item.total
          });
        }
      }
    }

    stats.topProducts = Array.from(productStats.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return stats;
  }
}

// ======================================================================
// SINGLETON INSTANCE
// ======================================================================

export const transactionService = new TransactionService();
export default transactionService;