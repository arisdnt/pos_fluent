// ======================================================================
// POS SERVICE
// Logika bisnis untuk Point of Sale (scan barcode, hitung total, PPN, pembayaran)
// ======================================================================

import { z } from 'zod';
import { formatCurrency } from '@/lib/utils/format';

// ======================================================================
// TYPES & SCHEMAS
// ======================================================================

// Product Types
export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  unitId: string;
  unitName: string;
  unitSymbol: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  taxRate: number;
  isActive: boolean;
  hasVariants: boolean;
  trackStock: boolean;
  allowBackorder: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Cart Item Types
export interface CartItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  unitSymbol: string;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  notes?: string;
  addedAt: Date;
}

// Customer Types
export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  discount?: number; // customer discount percentage
  taxExempt?: boolean;
  creditLimit?: number;
  paymentTerms?: number; // days
  isActive: boolean;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'digital' | 'credit';
  isActive: boolean;
  requiresReference: boolean;
  allowsChange: boolean;
  feePercentage?: number;
  feeFixed?: number;
}

export interface Payment {
  id: string;
  methodId: string;
  methodName: string;
  amount: number;
  reference?: string;
  change?: number;
  fee?: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  receiptNumber: string;
  type: 'sale' | 'refund' | 'void';
  status: 'draft' | 'completed' | 'cancelled';
  customerId?: string;
  customer?: Customer;
  cashierId: string;
  sessionId: string;
  items: CartItem[];
  payments: Payment[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  total: number;
  change: number;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Calculation Result
export interface CalculationResult {
  subtotal: number;
  itemDiscounts: number;
  customerDiscount: number;
  additionalDiscount: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  totalItems: number;
  totalQuantity: number;
  averageItemPrice: number;
}

// Validation Schemas
export const BarcodeSchema = z.string().min(1, 'Barcode tidak boleh kosong');

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID diperlukan'),
  quantity: z.number().min(0.01, 'Quantity minimal 0.01'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  discount: z.number().min(0, 'Diskon tidak boleh negatif'),
  discountType: z.enum(['percentage', 'fixed']),
  notes: z.string().optional()
});

export const PaymentSchema = z.object({
  methodId: z.string().min(1, 'Metode pembayaran diperlukan'),
  amount: z.number().min(0.01, 'Jumlah pembayaran minimal 0.01'),
  reference: z.string().optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

const mockProducts: Product[] = [
  {
    id: 'prod-001',
    code: 'BRS-001',
    barcode: '8991002123456',
    name: 'Beras Premium 5kg',
    description: 'Beras premium kualitas terbaik',
    categoryId: 'cat-001',
    categoryName: 'Sembako',
    brandId: 'brand-001',
    brandName: 'Cap Beras',
    unitId: 'unit-001',
    unitName: 'Pieces',
    unitSymbol: 'pcs',
    price: 75000,
    cost: 65000,
    stock: 50,
    minStock: 10,
    maxStock: 100,
    taxRate: 0, // Sembako bebas pajak
    isActive: true,
    hasVariants: false,
    trackStock: true,
    allowBackorder: false,
    weight: 5000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod-002',
    code: 'MYK-001',
    barcode: '8991002234567',
    name: 'Minyak Goreng 2L',
    description: 'Minyak goreng berkualitas',
    categoryId: 'cat-001',
    categoryName: 'Sembako',
    brandId: 'brand-002',
    brandName: 'Tropical',
    unitId: 'unit-001',
    unitName: 'Pieces',
    unitSymbol: 'pcs',
    price: 35000,
    cost: 30000,
    stock: 25,
    minStock: 5,
    taxRate: 11, // PPN 11%
    isActive: true,
    hasVariants: false,
    trackStock: true,
    allowBackorder: false,
    weight: 2000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod-003',
    code: 'SSU-001',
    barcode: '8991002345678',
    name: 'Susu UHT 1L',
    description: 'Susu UHT segar',
    categoryId: 'cat-002',
    categoryName: 'Minuman',
    brandId: 'brand-003',
    brandName: 'Ultra Milk',
    unitId: 'unit-001',
    unitName: 'Pieces',
    unitSymbol: 'pcs',
    price: 15000,
    cost: 12000,
    stock: 100,
    minStock: 20,
    taxRate: 11,
    isActive: true,
    hasVariants: false,
    trackStock: true,
    allowBackorder: true,
    weight: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pay-001',
    name: 'Tunai',
    type: 'cash',
    isActive: true,
    requiresReference: false,
    allowsChange: true
  },
  {
    id: 'pay-002',
    name: 'Kartu Debit',
    type: 'card',
    isActive: true,
    requiresReference: true,
    allowsChange: false,
    feePercentage: 0.5
  },
  {
    id: 'pay-003',
    name: 'Kartu Kredit',
    type: 'card',
    isActive: true,
    requiresReference: true,
    allowsChange: false,
    feePercentage: 2.5
  },
  {
    id: 'pay-004',
    name: 'QRIS',
    type: 'digital',
    isActive: true,
    requiresReference: true,
    allowsChange: false,
    feePercentage: 0.7
  },
  {
    id: 'pay-005',
    name: 'Transfer Bank',
    type: 'digital',
    isActive: true,
    requiresReference: true,
    allowsChange: false,
    feeFixed: 2500
  }
];

// ======================================================================
// POS SERVICE CLASS
// ======================================================================

export class POSService {
  private products: Product[] = mockProducts;
  private paymentMethods: PaymentMethod[] = mockPaymentMethods;
  private taxRate: number = 11; // PPN 11%
  private roundingMethod: 'none' | 'up' | 'down' | 'nearest' = 'nearest';

  // ======================================================================
  // BARCODE & PRODUCT METHODS
  // ======================================================================

  /**
   * Scan barcode dan cari produk
   */
  async scanBarcode(barcode: string): Promise<Product | null> {
    try {
      const validatedBarcode = BarcodeSchema.parse(barcode);
      
      // Simulasi delay scanning
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Cari produk berdasarkan barcode atau kode
      const product = this.products.find(p => 
        p.barcode === validatedBarcode || 
        p.code === validatedBarcode
      );
      
      if (!product) {
        return null;
      }
      
      // Check if product is active
      if (!product.isActive) {
        throw new Error('Produk tidak aktif');
      }
      
      return product;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Format barcode tidak valid');
      }
      throw error;
    }
  }

  /**
   * Cari produk berdasarkan nama atau kode
   */
  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return this.products.filter(p => p.isActive).slice(0, limit);
    }
    
    return this.products
      .filter(p => 
        p.isActive && (
          p.name.toLowerCase().includes(searchTerm) ||
          p.code.toLowerCase().includes(searchTerm) ||
          p.barcode?.toLowerCase().includes(searchTerm) ||
          p.categoryName.toLowerCase().includes(searchTerm) ||
          p.brandName?.toLowerCase().includes(searchTerm)
        )
      )
      .slice(0, limit);
  }

  /**
   * Get produk berdasarkan ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    return this.products.find(p => p.id === productId && p.isActive) || null;
  }

  /**
   * Check stok produk
   */
  checkStock(product: Product, requestedQuantity: number): {
    available: boolean;
    currentStock: number;
    message?: string;
  } {
    if (!product.trackStock) {
      return { available: true, currentStock: Infinity };
    }
    
    if (product.stock >= requestedQuantity) {
      return { available: true, currentStock: product.stock };
    }
    
    if (product.allowBackorder) {
      return { 
        available: true, 
        currentStock: product.stock,
        message: `Stok tersedia: ${product.stock}, sisanya akan di-backorder`
      };
    }
    
    return { 
      available: false, 
      currentStock: product.stock,
      message: `Stok tidak mencukupi. Tersedia: ${product.stock}`
    };
  }

  // ======================================================================
  // CART METHODS
  // ======================================================================

  /**
   * Tambah item ke keranjang
   */
  addToCart(
    cart: CartItem[], 
    product: Product, 
    quantity: number = 1,
    customPrice?: number,
    discount: number = 0,
    discountType: 'percentage' | 'fixed' = 'fixed',
    notes?: string
  ): CartItem[] {
    // Validate input
    const validatedData = CartItemSchema.parse({
      productId: product.id,
      quantity,
      price: customPrice || product.price,
      discount,
      discountType,
      notes
    });
    
    // Check stock
    const stockCheck = this.checkStock(product, quantity);
    if (!stockCheck.available) {
      throw new Error(stockCheck.message || 'Stok tidak mencukupi');
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => 
      item.productId === product.id && 
      item.price === (customPrice || product.price) &&
      item.discount === discount &&
      item.discountType === discountType
    );
    
    const newCart = [...cart];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = newCart[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock for new total quantity
      const newStockCheck = this.checkStock(product, newQuantity);
      if (!newStockCheck.available) {
        throw new Error(newStockCheck.message || 'Stok tidak mencukupi');
      }
      
      newCart[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        notes: notes || existingItem.notes
      };
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        price: customPrice || product.price,
        quantity,
        unit: product.unitName,
        unitSymbol: product.unitSymbol,
        taxRate: product.taxRate,
        discount,
        discountType,
        notes,
        addedAt: new Date()
      };
      
      newCart.push(newItem);
    }
    
    return newCart;
  }

  /**
   * Update item di keranjang
   */
  updateCartItem(
    cart: CartItem[], 
    itemId: string, 
    updates: Partial<Pick<CartItem, 'quantity' | 'price' | 'discount' | 'discountType' | 'notes'>>
  ): CartItem[] {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item tidak ditemukan di keranjang');
    }
    
    const newCart = [...cart];
    const currentItem = newCart[itemIndex];
    
    // Validate updates
    if (updates.quantity !== undefined) {
      if (updates.quantity <= 0) {
        throw new Error('Quantity harus lebih dari 0');
      }
      
      // Get product to check stock
      const product = this.products.find(p => p.id === currentItem.productId);
      if (product) {
        const stockCheck = this.checkStock(product, updates.quantity);
        if (!stockCheck.available) {
          throw new Error(stockCheck.message || 'Stok tidak mencukupi');
        }
      }
    }
    
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error('Harga tidak boleh negatif');
    }
    
    if (updates.discount !== undefined && updates.discount < 0) {
      throw new Error('Diskon tidak boleh negatif');
    }
    
    // Apply updates
    newCart[itemIndex] = {
      ...currentItem,
      ...updates
    };
    
    return newCart;
  }

  /**
   * Hapus item dari keranjang
   */
  removeFromCart(cart: CartItem[], itemId: string): CartItem[] {
    return cart.filter(item => item.id !== itemId);
  }

  /**
   * Kosongkan keranjang
   */
  clearCart(): CartItem[] {
    return [];
  }

  // ======================================================================
  // CALCULATION METHODS
  // ======================================================================

  /**
   * Hitung total item
   */
  calculateItemTotal(item: CartItem): number {
    const baseAmount = item.price * item.quantity;
    let discountAmount = 0;
    
    if (item.discount > 0) {
      if (item.discountType === 'percentage') {
        discountAmount = baseAmount * (item.discount / 100);
      } else {
        discountAmount = item.discount * item.quantity;
      }
    }
    
    return Math.max(0, baseAmount - discountAmount);
  }

  /**
   * Hitung pajak item
   */
  calculateItemTax(item: CartItem): number {
    const itemTotal = this.calculateItemTotal(item);
    return itemTotal * (item.taxRate / 100);
  }

  /**
   * Hitung total transaksi
   */
  calculateTransaction(
    items: CartItem[],
    customer?: Customer,
    additionalDiscount: number = 0,
    additionalDiscountType: 'percentage' | 'fixed' = 'percentage'
  ): CalculationResult {
    // Calculate subtotal (before any discounts)
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate item-level discounts
    const itemDiscounts = items.reduce((sum, item) => {
      const baseAmount = item.price * item.quantity;
      let discountAmount = 0;
      
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          discountAmount = baseAmount * (item.discount / 100);
        } else {
          discountAmount = item.discount * item.quantity;
        }
      }
      
      return sum + discountAmount;
    }, 0);
    
    // Calculate subtotal after item discounts
    const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
    
    // Calculate customer discount
    let customerDiscount = 0;
    if (customer?.discount && customer.discount > 0) {
      customerDiscount = subtotalAfterItemDiscounts * (customer.discount / 100);
    }
    
    // Calculate additional discount
    let additionalDiscountAmount = 0;
    if (additionalDiscount > 0) {
      const baseForAdditionalDiscount = subtotalAfterItemDiscounts - customerDiscount;
      if (additionalDiscountType === 'percentage') {
        additionalDiscountAmount = baseForAdditionalDiscount * (additionalDiscount / 100);
      } else {
        additionalDiscountAmount = additionalDiscount;
      }
    }
    
    // Total discount
    const totalDiscount = itemDiscounts + customerDiscount + additionalDiscountAmount;
    
    // Calculate taxable amount
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    
    // Calculate tax (only if customer is not tax exempt)
    let taxAmount = 0;
    if (!customer?.taxExempt) {
      taxAmount = items.reduce((sum, item) => {
        const itemAfterDiscount = this.calculateItemTotal(item);
        // Apply proportional additional discounts
        const proportionalCustomerDiscount = customerDiscount * (itemAfterDiscount / (subtotalAfterItemDiscounts || 1));
        const proportionalAdditionalDiscount = additionalDiscountAmount * (itemAfterDiscount / (subtotalAfterItemDiscounts - customerDiscount || 1));
        const finalItemAmount = Math.max(0, itemAfterDiscount - proportionalCustomerDiscount - proportionalAdditionalDiscount);
        return sum + (finalItemAmount * (item.taxRate / 100));
      }, 0);
    }
    
    // Calculate final total
    const rawTotal = taxableAmount + taxAmount;
    const total = this.applyRounding(rawTotal);
    
    // Calculate statistics
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const averageItemPrice = totalQuantity > 0 ? subtotal / totalQuantity : 0;
    
    return {
      subtotal,
      itemDiscounts,
      customerDiscount,
      additionalDiscount: additionalDiscountAmount,
      totalDiscount,
      taxableAmount,
      taxAmount,
      total,
      totalItems,
      totalQuantity,
      averageItemPrice
    };
  }

  /**
   * Apply rounding
   */
  private applyRounding(amount: number): number {
    switch (this.roundingMethod) {
      case 'up':
        return Math.ceil(amount);
      case 'down':
        return Math.floor(amount);
      case 'nearest':
        return Math.round(amount);
      default:
        return amount;
    }
  }

  // ======================================================================
  // PAYMENT METHODS
  // ======================================================================

  /**
   * Get available payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods.filter(pm => pm.isActive);
  }

  /**
   * Get payment method by ID
   */
  getPaymentMethodById(methodId: string): PaymentMethod | null {
    return this.paymentMethods.find(pm => pm.id === methodId && pm.isActive) || null;
  }

  /**
   * Calculate payment fee
   */
  calculatePaymentFee(methodId: string, amount: number): number {
    const method = this.getPaymentMethodById(methodId);
    if (!method) return 0;
    
    let fee = 0;
    if (method.feePercentage) {
      fee += amount * (method.feePercentage / 100);
    }
    if (method.feeFixed) {
      fee += method.feeFixed;
    }
    
    return fee;
  }

  /**
   * Validate payment
   */
  validatePayment(payment: Payment, totalAmount: number): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate payment method
    const method = this.getPaymentMethodById(payment.methodId);
    if (!method) {
      errors.push('Metode pembayaran tidak valid');
      return { valid: false, errors };
    }
    
    // Validate amount
    if (payment.amount <= 0) {
      errors.push('Jumlah pembayaran harus lebih dari 0');
    }
    
    // Validate reference for methods that require it
    if (method.requiresReference && !payment.reference?.trim()) {
      errors.push(`Referensi diperlukan untuk ${method.name}`);
    }
    
    // Validate change for cash payments
    if (method.type === 'cash' && payment.change && payment.change < 0) {
      errors.push('Kembalian tidak boleh negatif');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Process payment
   */
  processPayment(
    payments: Payment[], 
    totalAmount: number
  ): {
    success: boolean;
    totalPaid: number;
    totalFees: number;
    change: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let totalPaid = 0;
    let totalFees = 0;
    
    // Validate each payment
    for (const payment of payments) {
      const validation = this.validatePayment(payment, totalAmount);
      if (!validation.valid) {
        errors.push(...validation.errors);
        continue;
      }
      
      totalPaid += payment.amount;
      totalFees += this.calculatePaymentFee(payment.methodId, payment.amount);
    }
    
    if (errors.length > 0) {
      return { success: false, totalPaid: 0, totalFees: 0, change: 0, errors };
    }
    
    // Check if payment is sufficient
    const netAmount = totalAmount + totalFees;
    if (totalPaid < netAmount) {
      errors.push(`Pembayaran kurang. Diperlukan: ${formatCurrency(netAmount)}, Dibayar: ${formatCurrency(totalPaid)}`);
      return { success: false, totalPaid, totalFees, change: 0, errors };
    }
    
    const change = totalPaid - netAmount;
    
    return { success: true, totalPaid, totalFees, change, errors: [] };
  }

  // ======================================================================
  // TRANSACTION METHODS
  // ======================================================================

  /**
   * Generate receipt number
   */
  generateReceiptNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    return `RC-${year}${month}${day}-${time}`;
  }

  /**
   * Create transaction
   */
  async createTransaction(
    items: CartItem[],
    payments: Payment[],
    customer?: Customer,
    cashierId: string = 'default-cashier',
    sessionId: string = 'default-session',
    additionalDiscount: number = 0,
    additionalDiscountType: 'percentage' | 'fixed' = 'percentage',
    notes?: string
  ): Promise<Transaction> {
    if (items.length === 0) {
      throw new Error('Keranjang kosong');
    }
    
    if (payments.length === 0) {
      throw new Error('Metode pembayaran diperlukan');
    }
    
    // Calculate transaction totals
    const calculation = this.calculateTransaction(items, customer, additionalDiscount, additionalDiscountType);
    
    // Process payments
    const paymentResult = this.processPayment(payments, calculation.total);
    if (!paymentResult.success) {
      throw new Error(paymentResult.errors.join(', '));
    }
    
    // Create transaction
    const transaction: Transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receiptNumber: this.generateReceiptNumber(),
      type: 'sale',
      status: 'completed',
      customerId: customer?.id,
      customer,
      cashierId,
      sessionId,
      items: [...items],
      payments: [...payments],
      subtotal: calculation.subtotal,
      discount: calculation.totalDiscount,
      discountType: additionalDiscountType,
      taxAmount: calculation.taxAmount,
      total: calculation.total,
      change: paymentResult.change,
      notes,
      createdAt: new Date(),
      completedAt: new Date()
    };
    
    // Update stock (in real implementation, this would be done in database)
    this.updateStock(items);
    
    return transaction;
  }

  /**
   * Update stock after transaction
   */
  private updateStock(items: CartItem[]): void {
    for (const item of items) {
      const productIndex = this.products.findIndex(p => p.id === item.productId);
      if (productIndex >= 0 && this.products[productIndex].trackStock) {
        this.products[productIndex].stock -= item.quantity;
      }
    }
  }

  // ======================================================================
  // UTILITY METHODS
  // ======================================================================

  /**
   * Set tax rate
   */
  setTaxRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new Error('Tax rate harus antara 0-100%');
    }
    this.taxRate = rate;
  }

  /**
   * Set rounding method
   */
  setRoundingMethod(method: 'none' | 'up' | 'down' | 'nearest'): void {
    this.roundingMethod = method;
  }

  /**
   * Get current settings
   */
  getSettings(): {
    taxRate: number;
    roundingMethod: string;
  } {
    return {
      taxRate: this.taxRate,
      roundingMethod: this.roundingMethod
    };
  }
}

// ======================================================================
// SINGLETON INSTANCE
// ======================================================================

export const posService = new POSService();
export default posService;