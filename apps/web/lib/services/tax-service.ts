// ======================================================================
// TAX SERVICE
// Service untuk perhitungan pajak dan diskon yang kompleks
// ======================================================================

import { z } from 'zod';

// ======================================================================
// TYPES & INTERFACES
// ======================================================================

export interface TaxRule {
  id: string;
  name: string;
  rate: number; // percentage
  type: 'inclusive' | 'exclusive';
  isActive: boolean;
  applicableCategories?: string[];
  exemptCategories?: string[];
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  minQuantity?: number;
  minAmount?: number;
  maxDiscount?: number;
  customerGroups?: string[];
  startDate?: Date;
  endDate?: Date;
  // For buy X get Y discounts
  buyQuantity?: number;
  getQuantity?: number;
  getFreeProduct?: boolean;
}

export interface TaxCalculation {
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  taxRules: TaxRule[];
  exemptAmount: number;
  breakdown: {
    ruleId: string;
    ruleName: string;
    rate: number;
    amount: number;
    taxAmount: number;
  }[];
}

export interface DiscountCalculation {
  discountAmount: number;
  discountPercentage: number;
  appliedRules: {
    ruleId: string;
    ruleName: string;
    type: string;
    value: number;
    discountAmount: number;
    affectedItems: string[];
  }[];
  totalSavings: number;
}

export interface LineItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryId: string;
  price: number;
  quantity: number;
  subtotal: number;
  taxRate?: number;
  taxExempt?: boolean;
}

export interface Customer {
  id: string;
  groupId?: string;
  taxExempt?: boolean;
  discountPercentage?: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const TaxRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  type: z.enum(['inclusive', 'exclusive']),
  isActive: z.boolean()
});

const DiscountRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y']),
  value: z.number().min(0),
  isActive: z.boolean()
});

// ======================================================================
// TAX SERVICE CLASS
// ======================================================================

export class TaxService {
  private taxRules: TaxRule[] = [];
  private discountRules: DiscountRule[] = [];
  private defaultTaxRate: number = 11; // PPN 11%

  constructor() {
    this.initializeDefaultRules();
  }

  // ======================================================================
  // INITIALIZATION
  // ======================================================================

  /**
   * Initialize default tax and discount rules
   */
  private initializeDefaultRules(): void {
    // Default tax rules
    this.taxRules = [
      {
        id: 'ppn-11',
        name: 'PPN 11%',
        rate: 11,
        type: 'exclusive',
        isActive: true,
        exemptCategories: ['sembako', 'obat-obatan', 'buku']
      },
      {
        id: 'ppn-0-sembako',
        name: 'Bebas PPN - Sembako',
        rate: 0,
        type: 'exclusive',
        isActive: true,
        applicableCategories: ['sembako']
      },
      {
        id: 'ppn-0-obat',
        name: 'Bebas PPN - Obat-obatan',
        rate: 0,
        type: 'exclusive',
        isActive: true,
        applicableCategories: ['obat-obatan']
      }
    ];

    // Default discount rules
    this.discountRules = [
      {
        id: 'member-5',
        name: 'Diskon Member 5%',
        type: 'percentage',
        value: 5,
        isActive: true,
        customerGroups: ['member'],
        minAmount: 50000
      },
      {
        id: 'vip-10',
        name: 'Diskon VIP 10%',
        type: 'percentage',
        value: 10,
        isActive: true,
        customerGroups: ['vip'],
        minAmount: 100000
      },
      {
        id: 'buy-2-get-1',
        name: 'Beli 2 Gratis 1',
        type: 'buy_x_get_y',
        value: 0,
        isActive: true,
        buyQuantity: 2,
        getQuantity: 1,
        getFreeProduct: true,
        applicableCategories: ['promo']
      }
    ];
  }

  // ======================================================================
  // TAX CALCULATION METHODS
  // ======================================================================

  /**
   * Calculate tax for line items
   */
  calculateTax(
    items: LineItem[],
    customer?: Customer,
    additionalExemptions?: string[]
  ): TaxCalculation {
    let taxableAmount = 0;
    let taxAmount = 0;
    let exemptAmount = 0;
    const breakdown: TaxCalculation['breakdown'] = [];
    const appliedRules: TaxRule[] = [];

    // Group items by tax treatment
    const taxGroups = this.groupItemsByTaxTreatment(items, customer, additionalExemptions);

    for (const [ruleId, groupItems] of taxGroups.entries()) {
      const rule = this.taxRules.find(r => r.id === ruleId);
      if (!rule || !rule.isActive) continue;

      const groupSubtotal = groupItems.reduce((sum, item) => sum + item.subtotal, 0);

      if (rule.rate === 0) {
        exemptAmount += groupSubtotal;
      } else {
        taxableAmount += groupSubtotal;
        const groupTaxAmount = this.calculateTaxAmount(groupSubtotal, rule);
        taxAmount += groupTaxAmount;

        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          rate: rule.rate,
          amount: groupSubtotal,
          taxAmount: groupTaxAmount
        });

        if (!appliedRules.find(r => r.id === rule.id)) {
          appliedRules.push(rule);
        }
      }
    }

    return {
      taxableAmount,
      taxAmount: this.roundAmount(taxAmount),
      taxRate: taxableAmount > 0 ? (taxAmount / taxableAmount) * 100 : 0,
      taxRules: appliedRules,
      exemptAmount,
      breakdown
    };
  }

  /**
   * Group items by tax treatment
   */
  private groupItemsByTaxTreatment(
    items: LineItem[],
    customer?: Customer,
    additionalExemptions?: string[]
  ): Map<string, LineItem[]> {
    const groups = new Map<string, LineItem[]>();

    for (const item of items) {
      const applicableRule = this.findApplicableTaxRule(item, customer, additionalExemptions);
      const ruleId = applicableRule?.id || 'ppn-11'; // Default to standard PPN

      if (!groups.has(ruleId)) {
        groups.set(ruleId, []);
      }
      groups.get(ruleId)!.push(item);
    }

    return groups;
  }

  /**
   * Find applicable tax rule for an item
   */
  private findApplicableTaxRule(
    item: LineItem,
    customer?: Customer,
    additionalExemptions?: string[]
  ): TaxRule | null {
    // Check if customer is tax exempt
    if (customer?.taxExempt) {
      return this.taxRules.find(r => r.rate === 0) || null;
    }

    // Check if item is explicitly tax exempt
    if (item.taxExempt) {
      return this.taxRules.find(r => r.rate === 0) || null;
    }

    // Check additional exemptions
    if (additionalExemptions?.includes(item.categoryId) || additionalExemptions?.includes(item.productId)) {
      return this.taxRules.find(r => r.rate === 0) || null;
    }

    // Find most specific applicable rule
    const applicableRules = this.taxRules.filter(rule => {
      if (!rule.isActive) return false;

      // Check date validity
      if (rule.startDate && new Date() < rule.startDate) return false;
      if (rule.endDate && new Date() > rule.endDate) return false;

      // Check amount limits
      if (rule.minAmount && item.subtotal < rule.minAmount) return false;
      if (rule.maxAmount && item.subtotal > rule.maxAmount) return false;

      // Check category exemptions
      if (rule.exemptCategories?.includes(item.categoryId)) return false;

      // Check category applicability
      if (rule.applicableCategories && !rule.applicableCategories.includes(item.categoryId)) {
        return false;
      }

      return true;
    });

    // Return most specific rule (with applicable categories) or default
    return applicableRules.find(r => r.applicableCategories) || 
           applicableRules.find(r => !r.applicableCategories) ||
           null;
  }

  /**
   * Calculate tax amount based on rule
   */
  private calculateTaxAmount(amount: number, rule: TaxRule): number {
    if (rule.type === 'inclusive') {
      // Tax is included in the price
      return amount - (amount / (1 + rule.rate / 100));
    } else {
      // Tax is added to the price
      return amount * (rule.rate / 100);
    }
  }

  // ======================================================================
  // DISCOUNT CALCULATION METHODS
  // ======================================================================

  /**
   * Calculate discounts for line items
   */
  calculateDiscounts(
    items: LineItem[],
    customer?: Customer,
    additionalDiscounts?: { type: 'percentage' | 'fixed'; value: number }[]
  ): DiscountCalculation {
    let totalDiscountAmount = 0;
    const appliedRules: DiscountCalculation['appliedRules'] = [];

    // Apply rule-based discounts
    for (const rule of this.discountRules) {
      if (!rule.isActive) continue;

      const ruleDiscount = this.applyDiscountRule(rule, items, customer);
      if (ruleDiscount.discountAmount > 0) {
        totalDiscountAmount += ruleDiscount.discountAmount;
        appliedRules.push(ruleDiscount);
      }
    }

    // Apply customer-specific discount
    if (customer?.discountPercentage && customer.discountPercentage > 0) {
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const customerDiscountAmount = subtotal * (customer.discountPercentage / 100);
      
      totalDiscountAmount += customerDiscountAmount;
      appliedRules.push({
        ruleId: 'customer-discount',
        ruleName: `Diskon Pelanggan ${customer.discountPercentage}%`,
        type: 'percentage',
        value: customer.discountPercentage,
        discountAmount: customerDiscountAmount,
        affectedItems: items.map(item => item.id)
      });
    }

    // Apply additional discounts
    if (additionalDiscounts) {
      for (const discount of additionalDiscounts) {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        let discountAmount = 0;

        if (discount.type === 'percentage') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }

        totalDiscountAmount += discountAmount;
        appliedRules.push({
          ruleId: 'additional-discount',
          ruleName: `Diskon Tambahan ${discount.type === 'percentage' ? discount.value + '%' : 'Rp ' + discount.value}`,
          type: discount.type,
          value: discount.value,
          discountAmount,
          affectedItems: items.map(item => item.id)
        });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountPercentage = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;

    return {
      discountAmount: this.roundAmount(totalDiscountAmount),
      discountPercentage: this.roundAmount(discountPercentage, 2),
      appliedRules,
      totalSavings: this.roundAmount(totalDiscountAmount)
    };
  }

  /**
   * Apply a specific discount rule
   */
  private applyDiscountRule(
    rule: DiscountRule,
    items: LineItem[],
    customer?: Customer
  ): DiscountCalculation['appliedRules'][0] {
    // Check if rule is applicable
    if (!this.isDiscountRuleApplicable(rule, items, customer)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        type: rule.type,
        value: rule.value,
        discountAmount: 0,
        affectedItems: []
      };
    }

    // Filter applicable items
    const applicableItems = this.filterApplicableItems(rule, items);
    if (applicableItems.length === 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        type: rule.type,
        value: rule.value,
        discountAmount: 0,
        affectedItems: []
      };
    }

    let discountAmount = 0;
    const affectedItems: string[] = [];

    switch (rule.type) {
      case 'percentage':
        const subtotal = applicableItems.reduce((sum, item) => sum + item.subtotal, 0);
        discountAmount = subtotal * (rule.value / 100);
        if (rule.maxDiscount && discountAmount > rule.maxDiscount) {
          discountAmount = rule.maxDiscount;
        }
        affectedItems.push(...applicableItems.map(item => item.id));
        break;

      case 'fixed':
        discountAmount = rule.value;
        affectedItems.push(...applicableItems.map(item => item.id));
        break;

      case 'buy_x_get_y':
        const buyXGetYResult = this.calculateBuyXGetYDiscount(rule, applicableItems);
        discountAmount = buyXGetYResult.discountAmount;
        affectedItems.push(...buyXGetYResult.affectedItems);
        break;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      type: rule.type,
      value: rule.value,
      discountAmount: this.roundAmount(discountAmount),
      affectedItems
    };
  }

  /**
   * Check if discount rule is applicable
   */
  private isDiscountRuleApplicable(
    rule: DiscountRule,
    items: LineItem[],
    customer?: Customer
  ): boolean {
    // Check date validity
    if (rule.startDate && new Date() < rule.startDate) return false;
    if (rule.endDate && new Date() > rule.endDate) return false;

    // Check customer group
    if (rule.customerGroups && customer?.groupId) {
      if (!rule.customerGroups.includes(customer.groupId)) return false;
    }

    // Check minimum quantity
    if (rule.minQuantity) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < rule.minQuantity) return false;
    }

    // Check minimum amount
    if (rule.minAmount) {
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      if (totalAmount < rule.minAmount) return false;
    }

    return true;
  }

  /**
   * Filter items applicable for discount rule
   */
  private filterApplicableItems(rule: DiscountRule, items: LineItem[]): LineItem[] {
    return items.filter(item => {
      // Check applicable products
      if (rule.applicableProducts && !rule.applicableProducts.includes(item.productId)) {
        return false;
      }

      // Check applicable categories
      if (rule.applicableCategories && !rule.applicableCategories.includes(item.categoryId)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate Buy X Get Y discount
   */
  private calculateBuyXGetYDiscount(
    rule: DiscountRule,
    items: LineItem[]
  ): { discountAmount: number; affectedItems: string[] } {
    if (!rule.buyQuantity || !rule.getQuantity) {
      return { discountAmount: 0, affectedItems: [] };
    }

    let discountAmount = 0;
    const affectedItems: string[] = [];

    // Group items by product
    const productGroups = new Map<string, LineItem[]>();
    for (const item of items) {
      if (!productGroups.has(item.productId)) {
        productGroups.set(item.productId, []);
      }
      productGroups.get(item.productId)!.push(item);
    }

    // Calculate discount for each product group
    for (const [productId, productItems] of productGroups.entries()) {
      const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
      const setsEligible = Math.floor(totalQuantity / rule.buyQuantity);
      const freeQuantity = setsEligible * rule.getQuantity;

      if (freeQuantity > 0) {
        // Sort items by price (ascending) to give discount on cheapest items
        const sortedItems = [...productItems].sort((a, b) => a.price - b.price);
        let remainingFreeQuantity = freeQuantity;

        for (const item of sortedItems) {
          if (remainingFreeQuantity <= 0) break;

          const discountQuantity = Math.min(remainingFreeQuantity, item.quantity);
          const itemDiscountAmount = discountQuantity * item.price;

          discountAmount += itemDiscountAmount;
          affectedItems.push(item.id);
          remainingFreeQuantity -= discountQuantity;
        }
      }
    }

    return { discountAmount, affectedItems };
  }

  // ======================================================================
  // RULE MANAGEMENT METHODS
  // ======================================================================

  /**
   * Add tax rule
   */
  addTaxRule(rule: Omit<TaxRule, 'id'>): TaxRule {
    const newRule: TaxRule = {
      ...rule,
      id: `tax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    TaxRuleSchema.parse(newRule);
    this.taxRules.push(newRule);
    return newRule;
  }

  /**
   * Update tax rule
   */
  updateTaxRule(id: string, updates: Partial<TaxRule>): TaxRule | null {
    const index = this.taxRules.findIndex(rule => rule.id === id);
    if (index === -1) return null;

    const updatedRule = { ...this.taxRules[index], ...updates };
    TaxRuleSchema.parse(updatedRule);
    
    this.taxRules[index] = updatedRule;
    return updatedRule;
  }

  /**
   * Delete tax rule
   */
  deleteTaxRule(id: string): boolean {
    const index = this.taxRules.findIndex(rule => rule.id === id);
    if (index === -1) return false;

    this.taxRules.splice(index, 1);
    return true;
  }

  /**
   * Add discount rule
   */
  addDiscountRule(rule: Omit<DiscountRule, 'id'>): DiscountRule {
    const newRule: DiscountRule = {
      ...rule,
      id: `discount-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    DiscountRuleSchema.parse(newRule);
    this.discountRules.push(newRule);
    return newRule;
  }

  /**
   * Update discount rule
   */
  updateDiscountRule(id: string, updates: Partial<DiscountRule>): DiscountRule | null {
    const index = this.discountRules.findIndex(rule => rule.id === id);
    if (index === -1) return null;

    const updatedRule = { ...this.discountRules[index], ...updates };
    DiscountRuleSchema.parse(updatedRule);
    
    this.discountRules[index] = updatedRule;
    return updatedRule;
  }

  /**
   * Delete discount rule
   */
  deleteDiscountRule(id: string): boolean {
    const index = this.discountRules.findIndex(rule => rule.id === id);
    if (index === -1) return false;

    this.discountRules.splice(index, 1);
    return true;
  }

  // ======================================================================
  // GETTER METHODS
  // ======================================================================

  /**
   * Get all tax rules
   */
  getTaxRules(): TaxRule[] {
    return [...this.taxRules];
  }

  /**
   * Get active tax rules
   */
  getActiveTaxRules(): TaxRule[] {
    return this.taxRules.filter(rule => rule.isActive);
  }

  /**
   * Get all discount rules
   */
  getDiscountRules(): DiscountRule[] {
    return [...this.discountRules];
  }

  /**
   * Get active discount rules
   */
  getActiveDiscountRules(): DiscountRule[] {
    return this.discountRules.filter(rule => rule.isActive);
  }

  /**
   * Get default tax rate
   */
  getDefaultTaxRate(): number {
    return this.defaultTaxRate;
  }

  /**
   * Set default tax rate
   */
  setDefaultTaxRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new Error('Tax rate harus antara 0-100%');
    }
    this.defaultTaxRate = rate;
  }

  // ======================================================================
  // UTILITY METHODS
  // ======================================================================

  /**
   * Round amount to specified decimal places
   */
  private roundAmount(amount: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Calculate effective tax rate for items
   */
  calculateEffectiveTaxRate(items: LineItem[], customer?: Customer): number {
    const taxCalc = this.calculateTax(items, customer);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    return subtotal > 0 ? (taxCalc.taxAmount / subtotal) * 100 : 0;
  }

  /**
   * Calculate effective discount rate for items
   */
  calculateEffectiveDiscountRate(items: LineItem[], customer?: Customer): number {
    const discountCalc = this.calculateDiscounts(items, customer);
    return discountCalc.discountPercentage;
  }
}

// ======================================================================
// SINGLETON INSTANCE
// ======================================================================

export const taxService = new TaxService();
export default taxService;