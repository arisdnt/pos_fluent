// ======================================================================
// PAYMENT SERVICE
// Service untuk menangani berbagai metode pembayaran
// ======================================================================

import { z } from 'zod';

// ======================================================================
// TYPES & INTERFACES
// ======================================================================

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  type: 'cash' | 'card' | 'digital' | 'credit' | 'voucher';
  isActive: boolean;
  requiresReference: boolean;
  allowsChange: boolean;
  allowsPartial: boolean;
  feeType: 'none' | 'percentage' | 'fixed' | 'both';
  feePercentage?: number;
  feeFixed?: number;
  minAmount?: number;
  maxAmount?: number;
  dailyLimit?: number;
  icon?: string;
  description?: string;
  processingTime?: number; // seconds
  settings?: Record<string, any>;
}

export interface Payment {
  id: string;
  methodId: string;
  methodName: string;
  methodType: string;
  amount: number;
  fee: number;
  netAmount: number;
  reference?: string;
  authCode?: string;
  change?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentSplit {
  id: string;
  payments: Payment[];
  totalAmount: number;
  totalPaid: number;
  totalFees: number;
  totalChange: number;
  remainingAmount: number;
  isComplete: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentProcessResult {
  success: boolean;
  payment?: Payment;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationData?: Record<string, any>;
}

export interface CashDrawer {
  isOpen: boolean;
  lastOpenedAt?: Date;
  lastClosedAt?: Date;
  openedBy?: string;
  reason?: string;
}

export interface CashDenomination {
  value: number;
  count: number;
  total: number;
}

export interface CashCount {
  denominations: CashDenomination[];
  totalAmount: number;
  countedAt: Date;
  countedBy: string;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const PaymentMethodSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['cash', 'card', 'digital', 'credit', 'voucher']),
  isActive: z.boolean(),
  requiresReference: z.boolean(),
  allowsChange: z.boolean(),
  allowsPartial: z.boolean(),
  feeType: z.enum(['none', 'percentage', 'fixed', 'both'])
});

const PaymentSchema = z.object({
  methodId: z.string().min(1),
  amount: z.number().min(0.01),
  reference: z.string().optional(),
  authCode: z.string().optional()
});

// ======================================================================
// PAYMENT SERVICE CLASS
// ======================================================================

export class PaymentService {
  private paymentMethods: PaymentMethod[] = [];
  private cashDrawer: CashDrawer = { isOpen: false };
  private dailyLimits: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultMethods();
  }

  // ======================================================================
  // INITIALIZATION
  // ======================================================================

  /**
   * Initialize default payment methods
   */
  private initializeDefaultMethods(): void {
    this.paymentMethods = [
      {
        id: 'cash',
        code: 'CASH',
        name: 'Tunai',
        type: 'cash',
        isActive: true,
        requiresReference: false,
        allowsChange: true,
        allowsPartial: true,
        feeType: 'none',
        icon: '💵',
        description: 'Pembayaran tunai',
        processingTime: 0
      },
      {
        id: 'debit-card',
        code: 'DEBIT',
        name: 'Kartu Debit',
        type: 'card',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 0.5,
        minAmount: 10000,
        maxAmount: 50000000,
        dailyLimit: 20000000,
        icon: '💳',
        description: 'Pembayaran dengan kartu debit',
        processingTime: 3
      },
      {
        id: 'credit-card',
        code: 'CREDIT',
        name: 'Kartu Kredit',
        type: 'card',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 2.5,
        minAmount: 10000,
        maxAmount: 100000000,
        dailyLimit: 50000000,
        icon: '💳',
        description: 'Pembayaran dengan kartu kredit',
        processingTime: 5
      },
      {
        id: 'qris',
        code: 'QRIS',
        name: 'QRIS',
        type: 'digital',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 0.7,
        minAmount: 1000,
        maxAmount: 20000000,
        dailyLimit: 20000000,
        icon: '📱',
        description: 'Pembayaran dengan QRIS',
        processingTime: 10
      },
      {
        id: 'bank-transfer',
        code: 'TRANSFER',
        name: 'Transfer Bank',
        type: 'digital',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'fixed',
        feeFixed: 2500,
        minAmount: 10000,
        maxAmount: 500000000,
        icon: '🏦',
        description: 'Transfer bank',
        processingTime: 30
      },
      {
        id: 'ewallet-ovo',
        code: 'OVO',
        name: 'OVO',
        type: 'digital',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 1.0,
        minAmount: 1000,
        maxAmount: 10000000,
        dailyLimit: 20000000,
        icon: '📱',
        description: 'Pembayaran dengan OVO',
        processingTime: 5
      },
      {
        id: 'ewallet-gopay',
        code: 'GOPAY',
        name: 'GoPay',
        type: 'digital',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 1.0,
        minAmount: 1000,
        maxAmount: 10000000,
        dailyLimit: 20000000,
        icon: '📱',
        description: 'Pembayaran dengan GoPay',
        processingTime: 5
      },
      {
        id: 'ewallet-dana',
        code: 'DANA',
        name: 'DANA',
        type: 'digital',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: false,
        feeType: 'percentage',
        feePercentage: 1.0,
        minAmount: 1000,
        maxAmount: 10000000,
        dailyLimit: 20000000,
        icon: '📱',
        description: 'Pembayaran dengan DANA',
        processingTime: 5
      },
      {
        id: 'credit-term',
        code: 'CREDIT_TERM',
        name: 'Kredit Tempo',
        type: 'credit',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: true,
        feeType: 'none',
        minAmount: 100000,
        icon: '📋',
        description: 'Pembayaran kredit dengan tempo',
        processingTime: 0
      },
      {
        id: 'voucher',
        code: 'VOUCHER',
        name: 'Voucher',
        type: 'voucher',
        isActive: true,
        requiresReference: true,
        allowsChange: false,
        allowsPartial: true,
        feeType: 'none',
        icon: '🎫',
        description: 'Pembayaran dengan voucher',
        processingTime: 0
      }
    ];
  }

  // ======================================================================
  // PAYMENT METHOD MANAGEMENT
  // ======================================================================

  /**
   * Get all payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return [...this.paymentMethods];
  }

  /**
   * Get active payment methods
   */
  getActivePaymentMethods(): PaymentMethod[] {
    return this.paymentMethods.filter(method => method.isActive);
  }

  /**
   * Get payment method by ID
   */
  getPaymentMethodById(id: string): PaymentMethod | null {
    return this.paymentMethods.find(method => method.id === id) || null;
  }

  /**
   * Get payment methods by type
   */
  getPaymentMethodsByType(type: PaymentMethod['type']): PaymentMethod[] {
    return this.paymentMethods.filter(method => method.type === type && method.isActive);
  }

  /**
   * Add payment method
   */
  addPaymentMethod(method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    PaymentMethodSchema.parse(newMethod);
    this.paymentMethods.push(newMethod);
    return newMethod;
  }

  /**
   * Update payment method
   */
  updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): PaymentMethod | null {
    const index = this.paymentMethods.findIndex(method => method.id === id);
    if (index === -1) return null;

    const updatedMethod = { ...this.paymentMethods[index], ...updates };
    PaymentMethodSchema.parse(updatedMethod);
    
    this.paymentMethods[index] = updatedMethod;
    return updatedMethod;
  }

  /**
   * Delete payment method
   */
  deletePaymentMethod(id: string): boolean {
    const index = this.paymentMethods.findIndex(method => method.id === id);
    if (index === -1) return false;

    this.paymentMethods.splice(index, 1);
    return true;
  }

  // ======================================================================
  // PAYMENT VALIDATION
  // ======================================================================

  /**
   * Validate payment
   */
  validatePayment(
    methodId: string,
    amount: number,
    reference?: string,
    totalAmount?: number
  ): PaymentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get payment method
    const method = this.getPaymentMethodById(methodId);
    if (!method) {
      errors.push('Metode pembayaran tidak ditemukan');
      return { isValid: false, errors, warnings };
    }

    if (!method.isActive) {
      errors.push('Metode pembayaran tidak aktif');
    }

    // Validate amount
    if (amount <= 0) {
      errors.push('Jumlah pembayaran harus lebih dari 0');
    }

    if (method.minAmount && amount < method.minAmount) {
      errors.push(`Jumlah minimum untuk ${method.name} adalah ${this.formatCurrency(method.minAmount)}`);
    }

    if (method.maxAmount && amount > method.maxAmount) {
      errors.push(`Jumlah maksimum untuk ${method.name} adalah ${this.formatCurrency(method.maxAmount)}`);
    }

    // Check daily limit
    if (method.dailyLimit) {
      const dailyUsed = this.dailyLimits.get(methodId) || 0;
      if (dailyUsed + amount > method.dailyLimit) {
        errors.push(`Limit harian untuk ${method.name} terlampaui`);
      }
    }

    // Validate reference
    if (method.requiresReference && !reference?.trim()) {
      errors.push(`Referensi diperlukan untuk ${method.name}`);
    }

    // Validate partial payment
    if (totalAmount && amount < totalAmount && !method.allowsPartial) {
      errors.push(`${method.name} tidak mendukung pembayaran sebagian`);
    }

    // Add warnings
    if (method.type === 'cash' && totalAmount && amount > totalAmount) {
      const change = amount - totalAmount;
      warnings.push(`Kembalian: ${this.formatCurrency(change)}`);
    }

    if (method.feeType !== 'none') {
      const fee = this.calculateFee(method, amount);
      if (fee > 0) {
        warnings.push(`Biaya admin: ${this.formatCurrency(fee)}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ======================================================================
  // FEE CALCULATION
  // ======================================================================

  /**
   * Calculate payment fee
   */
  calculateFee(method: PaymentMethod, amount: number): number {
    let fee = 0;

    switch (method.feeType) {
      case 'percentage':
        if (method.feePercentage) {
          fee = amount * (method.feePercentage / 100);
        }
        break;

      case 'fixed':
        if (method.feeFixed) {
          fee = method.feeFixed;
        }
        break;

      case 'both':
        if (method.feePercentage) {
          fee += amount * (method.feePercentage / 100);
        }
        if (method.feeFixed) {
          fee += method.feeFixed;
        }
        break;

      default:
        fee = 0;
    }

    return Math.round(fee);
  }

  /**
   * Calculate total fees for multiple payments
   */
  calculateTotalFees(payments: { methodId: string; amount: number }[]): number {
    return payments.reduce((total, payment) => {
      const method = this.getPaymentMethodById(payment.methodId);
      if (!method) return total;
      
      return total + this.calculateFee(method, payment.amount);
    }, 0);
  }

  // ======================================================================
  // PAYMENT PROCESSING
  // ======================================================================

  /**
   * Process single payment
   */
  async processPayment(
    methodId: string,
    amount: number,
    reference?: string,
    authCode?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentProcessResult> {
    try {
      // Validate payment
      const validation = this.validatePayment(methodId, amount, reference);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const method = this.getPaymentMethodById(methodId)!;
      const fee = this.calculateFee(method, amount);
      const netAmount = amount - fee;

      // Create payment object
      const payment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        methodId,
        methodName: method.name,
        methodType: method.type,
        amount,
        fee,
        netAmount,
        reference,
        authCode,
        status: 'pending',
        metadata
      };

      // Process based on method type
      const processResult = await this.processPaymentByType(payment, method);
      
      if (processResult.success) {
        // Update daily limit
        if (method.dailyLimit) {
          const currentUsed = this.dailyLimits.get(methodId) || 0;
          this.dailyLimits.set(methodId, currentUsed + amount);
        }

        // Open cash drawer for cash payments
        if (method.type === 'cash') {
          await this.openCashDrawer('payment');
        }
      }

      return processResult;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memproses pembayaran'
      };
    }
  }

  /**
   * Process payment by type
   */
  private async processPaymentByType(
    payment: Payment,
    method: PaymentMethod
  ): Promise<PaymentProcessResult> {
    payment.status = 'processing';

    // Simulate processing time
    if (method.processingTime && method.processingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, method.processingTime! * 1000));
    }

    switch (method.type) {
      case 'cash':
        return this.processCashPayment(payment);

      case 'card':
        return this.processCardPayment(payment);

      case 'digital':
        return this.processDigitalPayment(payment);

      case 'credit':
        return this.processCreditPayment(payment);

      case 'voucher':
        return this.processVoucherPayment(payment);

      default:
        payment.status = 'failed';
        payment.failureReason = 'Tipe pembayaran tidak didukung';
        return {
          success: false,
          error: 'Tipe pembayaran tidak didukung'
        };
    }
  }

  /**
   * Process cash payment
   */
  private async processCashPayment(payment: Payment): Promise<PaymentProcessResult> {
    // Cash payments are always successful
    payment.status = 'completed';
    payment.processedAt = new Date();

    return {
      success: true,
      payment
    };
  }

  /**
   * Process card payment
   */
  private async processCardPayment(payment: Payment): Promise<PaymentProcessResult> {
    // Simulate card processing
    const success = Math.random() > 0.05; // 95% success rate

    if (success) {
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.authCode = `AUTH${Date.now().toString().slice(-6)}`;
      
      return {
        success: true,
        payment
      };
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Kartu ditolak';
      
      return {
        success: false,
        error: 'Pembayaran kartu ditolak'
      };
    }
  }

  /**
   * Process digital payment
   */
  private async processDigitalPayment(payment: Payment): Promise<PaymentProcessResult> {
    // Simulate digital payment processing
    const success = Math.random() > 0.02; // 98% success rate

    if (success) {
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.authCode = `DIG${Date.now().toString().slice(-6)}`;
      
      return {
        success: true,
        payment
      };
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Saldo tidak mencukupi atau koneksi gagal';
      
      return {
        success: false,
        error: 'Pembayaran digital gagal'
      };
    }
  }

  /**
   * Process credit payment
   */
  private async processCreditPayment(payment: Payment): Promise<PaymentProcessResult> {
    // Credit payments require approval
    payment.status = 'completed';
    payment.processedAt = new Date();
    payment.authCode = `CREDIT${Date.now().toString().slice(-6)}`;

    return {
      success: true,
      payment,
      requiresConfirmation: true,
      confirmationData: {
        message: 'Pembayaran kredit memerlukan persetujuan manager',
        approvalRequired: true
      }
    };
  }

  /**
   * Process voucher payment
   */
  private async processVoucherPayment(payment: Payment): Promise<PaymentProcessResult> {
    // Validate voucher (simulate)
    const isValidVoucher = payment.reference && payment.reference.length >= 8;

    if (isValidVoucher) {
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.authCode = `VOUCH${Date.now().toString().slice(-6)}`;
      
      return {
        success: true,
        payment
      };
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Voucher tidak valid atau sudah digunakan';
      
      return {
        success: false,
        error: 'Voucher tidak valid'
      };
    }
  }

  // ======================================================================
  // SPLIT PAYMENT
  // ======================================================================

  /**
   * Create payment split
   */
  createPaymentSplit(totalAmount: number): PaymentSplit {
    return {
      id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payments: [],
      totalAmount,
      totalPaid: 0,
      totalFees: 0,
      totalChange: 0,
      remainingAmount: totalAmount,
      isComplete: false,
      createdAt: new Date()
    };
  }

  /**
   * Add payment to split
   */
  async addPaymentToSplit(
    split: PaymentSplit,
    methodId: string,
    amount: number,
    reference?: string,
    authCode?: string
  ): Promise<{ success: boolean; split: PaymentSplit; error?: string }> {
    try {
      // Validate that we don't exceed remaining amount
      if (amount > split.remainingAmount) {
        return {
          success: false,
          split,
          error: 'Jumlah pembayaran melebihi sisa yang harus dibayar'
        };
      }

      // Process payment
      const result = await this.processPayment(methodId, amount, reference, authCode);
      
      if (!result.success || !result.payment) {
        return {
          success: false,
          split,
          error: result.error
        };
      }

      // Add payment to split
      split.payments.push(result.payment);
      split.totalPaid += result.payment.amount;
      split.totalFees += result.payment.fee;
      split.remainingAmount = split.totalAmount - split.totalPaid;

      // Calculate change for cash payments
      if (result.payment.methodType === 'cash' && split.remainingAmount <= 0) {
        const change = Math.abs(split.remainingAmount);
        result.payment.change = change;
        split.totalChange = change;
      }

      // Check if split is complete
      if (split.remainingAmount <= 0) {
        split.isComplete = true;
        split.completedAt = new Date();
      }

      return {
        success: true,
        split
      };

    } catch (error) {
      return {
        success: false,
        split,
        error: error instanceof Error ? error.message : 'Gagal menambah pembayaran'
      };
    }
  }

  /**
   * Remove payment from split
   */
  removePaymentFromSplit(split: PaymentSplit, paymentId: string): PaymentSplit {
    const paymentIndex = split.payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return split;

    const removedPayment = split.payments[paymentIndex];
    split.payments.splice(paymentIndex, 1);
    
    split.totalPaid -= removedPayment.amount;
    split.totalFees -= removedPayment.fee;
    split.totalChange = 0; // Reset change
    split.remainingAmount = split.totalAmount - split.totalPaid;
    split.isComplete = false;
    split.completedAt = undefined;

    // Recalculate change if there's still a cash payment
    const cashPayment = split.payments.find(p => p.methodType === 'cash');
    if (cashPayment && split.remainingAmount <= 0) {
      const change = Math.abs(split.remainingAmount);
      cashPayment.change = change;
      split.totalChange = change;
      split.isComplete = true;
      split.completedAt = new Date();
    }

    return split;
  }

  // ======================================================================
  // CASH DRAWER MANAGEMENT
  // ======================================================================

  /**
   * Open cash drawer
   */
  async openCashDrawer(reason: string = 'manual', openedBy?: string): Promise<void> {
    this.cashDrawer = {
      isOpen: true,
      lastOpenedAt: new Date(),
      openedBy,
      reason
    };

    // Simulate hardware command to open drawer
    console.log('Cash drawer opened:', reason);
  }

  /**
   * Close cash drawer
   */
  async closeCashDrawer(): Promise<void> {
    this.cashDrawer = {
      ...this.cashDrawer,
      isOpen: false,
      lastClosedAt: new Date()
    };

    console.log('Cash drawer closed');
  }

  /**
   * Get cash drawer status
   */
  getCashDrawerStatus(): CashDrawer {
    return { ...this.cashDrawer };
  }

  /**
   * Count cash
   */
  countCash(denominations: CashDenomination[], countedBy: string): CashCount {
    const totalAmount = denominations.reduce((sum, denom) => {
      denom.total = denom.value * denom.count;
      return sum + denom.total;
    }, 0);

    return {
      denominations: [...denominations],
      totalAmount,
      countedAt: new Date(),
      countedBy
    };
  }

  // ======================================================================
  // UTILITY METHODS
  // ======================================================================

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Reset daily limits
   */
  resetDailyLimits(): void {
    this.dailyLimits.clear();
  }

  /**
   * Get daily usage for method
   */
  getDailyUsage(methodId: string): number {
    return this.dailyLimits.get(methodId) || 0;
  }

  /**
   * Get payment statistics
   */
  getPaymentStatistics(payments: Payment[]): {
    totalAmount: number;
    totalFees: number;
    totalChange: number;
    countByMethod: Record<string, number>;
    amountByMethod: Record<string, number>;
  } {
    const stats = {
      totalAmount: 0,
      totalFees: 0,
      totalChange: 0,
      countByMethod: {} as Record<string, number>,
      amountByMethod: {} as Record<string, number>
    };

    for (const payment of payments) {
      stats.totalAmount += payment.amount;
      stats.totalFees += payment.fee;
      stats.totalChange += payment.change || 0;

      stats.countByMethod[payment.methodName] = (stats.countByMethod[payment.methodName] || 0) + 1;
      stats.amountByMethod[payment.methodName] = (stats.amountByMethod[payment.methodName] || 0) + payment.amount;
    }

    return stats;
  }
}

// ======================================================================
// SINGLETON INSTANCE
// ======================================================================

export const paymentService = new PaymentService();
export default paymentService;