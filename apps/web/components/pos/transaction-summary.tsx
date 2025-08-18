// ======================================================================
// KOMPONEN TRANSACTION SUMMARY
// Ringkasan transaksi dengan perhitungan pajak, diskon, dan total
// ======================================================================

'use client';

import { useMemo } from 'react';
import {
  Card,
  Text,
  Caption1,
  Badge,
  Divider,
  Button,
  Tooltip
} from '@fluentui/react-components';
import {
  Calculator24Regular,
  Receipt24Regular,
  Tag24Regular,
  Person24Regular,
  Info24Regular,
  Warning24Regular
} from '@fluentui/react-icons';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface CartItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  discount?: number; // customer discount percentage
  taxExempt?: boolean;
}

interface TransactionSummaryProps {
  items: CartItem[];
  customer?: Customer | null;
  additionalDiscount?: number;
  additionalDiscountType?: 'percentage' | 'fixed';
  taxRate?: number;
  roundingMethod?: 'none' | 'up' | 'down' | 'nearest';
  showDetails?: boolean;
  className?: string;
}

interface CalculationResult {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  totalItems: number;
  totalQuantity: number;
  averageItemPrice: number;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const calculateItemTotal = (item: CartItem): number => {
  const baseAmount = item.price * item.quantity;
  let discountAmount = 0;
  
  if (item.discount > 0) {
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (item.discount / 100);
    } else {
      discountAmount = item.discount * item.quantity;
    }
  }
  
  return baseAmount - discountAmount;
};

const calculateItemTax = (item: CartItem): number => {
  const itemTotal = calculateItemTotal(item);
  return itemTotal * (item.taxRate / 100);
};

const applyRounding = (amount: number, method: string): number => {
  switch (method) {
    case 'up':
      return Math.ceil(amount);
    case 'down':
      return Math.floor(amount);
    case 'nearest':
      return Math.round(amount);
    default:
      return amount;
  }
};

// ======================================================================
// CALCULATION HOOK
// ======================================================================

function useTransactionCalculation({
  items,
  customer,
  additionalDiscount = 0,
  additionalDiscountType = 'percentage',
  taxRate = 11,
  roundingMethod = 'nearest'
}: Omit<TransactionSummaryProps, 'showDetails' | 'className'>): CalculationResult {
  return useMemo(() => {
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
    const taxableAmount = subtotal - totalDiscount;
    
    // Calculate tax
    let taxAmount = 0;
    if (!customer?.taxExempt && taxRate > 0) {
      taxAmount = taxableAmount * (taxRate / 100);
    }
    
    // Calculate final total
    const rawTotal = taxableAmount + taxAmount;
    const total = applyRounding(rawTotal, roundingMethod);
    
    // Calculate statistics
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const averageItemPrice = totalItems > 0 ? subtotal / totalQuantity : 0;
    
    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      taxAmount,
      total,
      totalItems,
      totalQuantity,
      averageItemPrice
    };
  }, [items, customer, additionalDiscount, additionalDiscountType, taxRate, roundingMethod]);
}

// ======================================================================
// DETAIL ROW COMPONENT
// ======================================================================

interface DetailRowProps {
  label: string;
  value: string | number;
  isTotal?: boolean;
  isTax?: boolean;
  isDiscount?: boolean;
  tooltip?: string;
  badge?: string;
}

function DetailRow({ 
  label, 
  value, 
  isTotal = false, 
  isTax = false, 
  isDiscount = false, 
  tooltip, 
  badge 
}: DetailRowProps) {
  const formattedValue = typeof value === 'number' ? formatCurrency(value) : value;
  
  const content = (
    <div className={cn(
      'flex items-center justify-between py-1',
      isTotal && 'py-2 font-semibold text-lg'
    )}>
      <div className="flex items-center space-x-2">
        <Text 
          size={isTotal ? 300 : 200} 
          weight={isTotal ? 'semibold' : 'regular'}
          className={cn(
            isDiscount && 'text-red-600',
            isTax && 'text-orange-600',
            isTotal && 'text-blue-600'
          )}
        >
          {label}
        </Text>
        {badge && (
          <Badge appearance="outline" size="small">
            {badge}
          </Badge>
        )}
        {tooltip && (
          <Tooltip content={tooltip} relationship="label">
            <Info24Regular className="w-3 h-3 text-gray-400" />
          </Tooltip>
        )}
      </div>
      <Text 
        size={isTotal ? 300 : 200} 
        weight={isTotal ? 'bold' : 'semibold'}
        className={cn(
          isDiscount && 'text-red-600',
          isTax && 'text-orange-600',
          isTotal && 'text-blue-600'
        )}
      >
        {isDiscount && value > 0 ? '-' : ''}{formattedValue}
      </Text>
    </div>
  );
  
  return tooltip ? (
    <Tooltip content={tooltip} relationship="label">
      {content}
    </Tooltip>
  ) : content;
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function TransactionSummary({
  items,
  customer,
  additionalDiscount = 0,
  additionalDiscountType = 'percentage',
  taxRate = 11,
  roundingMethod = 'nearest',
  showDetails = true,
  className
}: TransactionSummaryProps) {
  const calculation = useTransactionCalculation({
    items,
    customer,
    additionalDiscount,
    additionalDiscountType,
    taxRate,
    roundingMethod
  });
  
  const hasDiscount = calculation.totalDiscount > 0;
  const hasTax = calculation.taxAmount > 0;
  const isEmpty = items.length === 0;
  
  if (isEmpty) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="text-center py-8">
          <Receipt24Regular className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <Text className="text-gray-600">Keranjang kosong</Text>
          <Caption1 className="text-gray-500">Tambahkan produk untuk melihat ringkasan</Caption1>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator24Regular className="w-5 h-5" />
          <Text weight="semibold">Ringkasan Transaksi</Text>
        </div>
        <Badge appearance="outline">
          {calculation.totalItems} item
        </Badge>
      </div>
      
      {/* Customer Info */}
      {customer && (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
          <Person24Regular className="w-4 h-4 text-blue-600" />
          <Text size={200} className="text-blue-700">
            {customer.name}
          </Text>
          {customer.discount && customer.discount > 0 && (
            <Badge appearance="filled" color="success" size="small">
              Diskon {customer.discount}%
            </Badge>
          )}
          {customer.taxExempt && (
            <Badge appearance="filled" color="warning" size="small">
              Bebas Pajak
            </Badge>
          )}
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
        <div className="text-center">
          <Text weight="bold" className="block">
            {calculation.totalQuantity}
          </Text>
          <Caption1 className="text-gray-600">Total Qty</Caption1>
        </div>
        <div className="text-center">
          <Text weight="bold" className="block">
            {formatCurrency(calculation.averageItemPrice)}
          </Text>
          <Caption1 className="text-gray-600">Rata-rata</Caption1>
        </div>
      </div>
      
      <Divider />
      
      {/* Calculation Details */}
      <div className="space-y-1">
        <DetailRow
          label="Subtotal"
          value={calculation.subtotal}
          tooltip="Total harga sebelum diskon dan pajak"
        />
        
        {hasDiscount && (
          <DetailRow
            label="Total Diskon"
            value={calculation.totalDiscount}
            isDiscount
            tooltip="Gabungan diskon item, pelanggan, dan tambahan"
          />
        )}
        
        {showDetails && hasDiscount && (
          <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
            {/* Item discounts */}
            {items.some(item => item.discount > 0) && (
              <DetailRow
                label="Diskon Item"
                value={items.reduce((sum, item) => {
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
                }, 0)}
                isDiscount
              />
            )}
            
            {/* Customer discount */}
            {customer?.discount && customer.discount > 0 && (
              <DetailRow
                label="Diskon Pelanggan"
                value={(calculation.subtotal - items.reduce((sum, item) => {
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
                }, 0)) * (customer.discount / 100)}
                isDiscount
                badge={`${customer.discount}%`}
              />
            )}
            
            {/* Additional discount */}
            {additionalDiscount > 0 && (
              <DetailRow
                label="Diskon Tambahan"
                value={additionalDiscountType === 'percentage' 
                  ? (calculation.taxableAmount * (additionalDiscount / 100))
                  : additionalDiscount
                }
                isDiscount
                badge={additionalDiscountType === 'percentage' ? `${additionalDiscount}%` : 'Fixed'}
              />
            )}
          </div>
        )}
        
        {hasTax && (
          <>
            <DetailRow
              label="Jumlah Kena Pajak"
              value={calculation.taxableAmount}
              tooltip="Subtotal setelah dikurangi diskon"
            />
            <DetailRow
              label={`PPN ${taxRate}%`}
              value={calculation.taxAmount}
              isTax
              tooltip="Pajak Pertambahan Nilai"
            />
          </>
        )}
        
        {customer?.taxExempt && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
            <Warning24Regular className="w-4 h-4 text-yellow-600" />
            <Caption1 className="text-yellow-700">
              Pelanggan bebas pajak
            </Caption1>
          </div>
        )}
      </div>
      
      <Divider />
      
      {/* Total */}
      <DetailRow
        label="TOTAL BAYAR"
        value={calculation.total}
        isTotal
      />
      
      {/* Rounding Info */}
      {roundingMethod !== 'none' && (
        <Caption1 className="text-gray-500 text-center">
          *Pembulatan: {roundingMethod === 'up' ? 'Ke atas' : roundingMethod === 'down' ? 'Ke bawah' : 'Terdekat'}
        </Caption1>
      )}
      
      {/* Savings Info */}
      {hasDiscount && (
        <div className="bg-green-50 p-3 rounded text-center">
          <Text size={200} weight="semibold" className="text-green-700">
            Hemat {formatCurrency(calculation.totalDiscount)}
          </Text>
          <Caption1 className="text-green-600 block">
            {((calculation.totalDiscount / calculation.subtotal) * 100).toFixed(1)}% dari harga normal
          </Caption1>
        </div>
      )}
    </Card>
  );
}

// ======================================================================
// EXPORT TYPES AND UTILITIES
// ======================================================================

export type { 
  TransactionSummaryProps, 
  CartItem, 
  Customer, 
  CalculationResult 
};

export { 
  useTransactionCalculation, 
  calculateItemTotal, 
  calculateItemTax, 
  applyRounding 
};