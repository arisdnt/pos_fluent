// ======================================================================
// KOMPONEN KERANJANG BELANJA
// Komponen untuk mengelola item dalam keranjang POS
// ======================================================================

'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Text,
  Title3,
  Caption1,
  Badge,
  Divider,
  Input,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Tooltip,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  ShoppingBag24Regular,
  Delete24Regular,
  Add24Regular,
  Subtract24Regular,
  Edit24Regular,
  Tag24Regular,
  Calculator24Regular,
  Warning24Filled,
  Info24Regular
} from '@fluentui/react-icons';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ======================================================================
// TYPES
// ======================================================================

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  taxRate: number;
  image?: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'amount' | 'percentage';
  subtotal: number;
  tax: number;
  total: number;
  note?: string;
}

interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateDiscount: (itemId: string, discount: number, type: 'amount' | 'percentage') => void;
  onUpdateNote: (itemId: string, note: string) => void;
  onClearCart: () => void;
  className?: string;
  showActions?: boolean;
  readonly?: boolean;
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const calculateItemTotals = (item: CartItem): Omit<CartItem, 'id' | 'product' | 'note'> => {
  const { quantity, unitPrice, discount, discountType, product } = item;
  
  const subtotal = quantity * unitPrice;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount * quantity;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * product.taxRate;
  const total = discountedSubtotal + tax;
  
  return {
    quantity,
    unitPrice,
    discount,
    discountType,
    subtotal,
    tax,
    total
  };
};

const calculateCartTotals = (items: CartItem[]): CartTotals => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discount = items.reduce((sum, item) => {
    const discountAmount = item.discountType === 'percentage'
      ? (item.quantity * item.unitPrice * item.discount) / 100
      : item.discount * item.quantity;
    return sum + discountAmount;
  }, 0);
  const tax = items.reduce((sum, item) => sum + item.tax, 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    subtotal,
    discount,
    tax,
    total,
    itemCount
  };
};

// ======================================================================
// CART ITEM COMPONENT
// ======================================================================

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onUpdateDiscount: (discount: number, type: 'amount' | 'percentage') => void;
  onUpdateNote: (note: string) => void;
  readonly?: boolean;
  showActions?: boolean;
}

function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
  onUpdateDiscount,
  onUpdateNote,
  readonly = false,
  showActions = true
}: CartItemComponentProps) {
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [discountValue, setDiscountValue] = useState(item.discount);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>(item.discountType);
  const [noteValue, setNoteValue] = useState(item.note || '');

  const handleDiscountSave = () => {
    onUpdateDiscount(discountValue, discountType);
    setShowDiscountDialog(false);
    toast.success('Diskon berhasil diperbarui');
  };

  const handleNoteSave = () => {
    onUpdateNote(noteValue);
    setShowNoteDialog(false);
    toast.success('Catatan berhasil diperbarui');
  };

  const isLowStock = item.product.stock < item.quantity;
  const stockWarning = item.product.stock < 10;

  return (
    <Card className="p-3">
      <div className="space-y-3">
        {/* Product Info */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Text weight="semibold" className="block text-sm">
                {item.product.name}
              </Text>
              {isLowStock && (
                <Tooltip content="Stok tidak mencukupi" relationship="label">
                  <Warning24Filled className="text-red-500 w-4 h-4" />
                </Tooltip>
              )}
              {stockWarning && !isLowStock && (
                <Tooltip content="Stok menipis" relationship="label">
                  <Warning24Filled className="text-orange-500 w-4 h-4" />
                </Tooltip>
              )}
            </div>
            <Caption1 className="text-gray-600">
              {item.product.code} | {formatCurrency(item.unitPrice)} per {item.product.unit}
            </Caption1>
            <Caption1 className="text-gray-500">
              Stok tersedia: {item.product.stock} {item.product.unit}
            </Caption1>
            
            {/* Discount Info */}
            {item.discount > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <Tag24Regular className="w-3 h-3 text-green-600" />
                <Caption1 className="text-green-600">
                  Diskon: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                </Caption1>
              </div>
            )}
            
            {/* Note */}
            {item.note && (
              <div className="flex items-center space-x-1 mt-1">
                <Info24Regular className="w-3 h-3 text-blue-600" />
                <Caption1 className="text-blue-600">
                  {item.note}
                </Caption1>
              </div>
            )}
          </div>
          
          {showActions && !readonly && (
            <div className="flex items-center space-x-1">
              <Tooltip content="Edit diskon" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Tag24Regular />}
                  size="small"
                  onClick={() => setShowDiscountDialog(true)}
                />
              </Tooltip>
              <Tooltip content="Tambah catatan" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Edit24Regular />}
                  size="small"
                  onClick={() => setShowNoteDialog(true)}
                />
              </Tooltip>
              <Tooltip content="Hapus item" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Delete24Regular />}
                  size="small"
                  onClick={onRemove}
                />
              </Tooltip>
            </div>
          )}
        </div>
        
        {/* Quantity and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!readonly && (
              <>
                <Button
                  appearance="outline"
                  icon={<Subtract24Regular />}
                  size="small"
                  onClick={() => onUpdateQuantity(Math.max(0, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                />
                <Text weight="semibold" className="min-w-[3rem] text-center">
                  {item.quantity}
                </Text>
                <Button
                  appearance="outline"
                  icon={<Add24Regular />}
                  size="small"
                  onClick={() => onUpdateQuantity(item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                />
              </>
            )}
            {readonly && (
              <Text weight="semibold">
                {item.quantity} {item.product.unit}
              </Text>
            )}
          </div>
          
          <div className="text-right">
            <Text weight="bold" className="text-blue-600">
              {formatCurrency(item.total)}
            </Text>
            {item.discount > 0 && (
              <Caption1 className="text-gray-500 line-through">
                {formatCurrency(item.quantity * item.unitPrice)}
              </Caption1>
            )}
          </div>
        </div>
        
        {/* Stock Warning */}
        {isLowStock && (
          <MessageBar intent="error" className="mt-2">
            <MessageBarBody>
              Stok tidak mencukupi! Tersedia: {item.product.stock} {item.product.unit}
            </MessageBarBody>
          </MessageBar>
        )}
      </div>

      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={(_, data) => setShowDiscountDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Diskon - {item.product.name}</DialogTitle>
            <DialogContent className="space-y-4">
              <div className="space-y-2">
                <Text weight="semibold">Tipe Diskon:</Text>
                <div className="flex space-x-2">
                  <Button
                    appearance={discountType === 'percentage' ? 'primary' : 'outline'}
                    onClick={() => setDiscountType('percentage')}
                    className="flex-1"
                  >
                    Persentase (%)
                  </Button>
                  <Button
                    appearance={discountType === 'amount' ? 'primary' : 'outline'}
                    onClick={() => setDiscountType('amount')}
                    className="flex-1"
                  >
                    Nominal (Rp)
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Text weight="semibold">
                  Nilai Diskon {discountType === 'percentage' ? '(%)' : '(Rp)'}:
                </Text>
                <Input
                  type="number"
                  placeholder="0"
                  value={discountValue ? discountValue.toString() : ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  contentBefore={discountType === 'amount' ? <Text>Rp</Text> : undefined}
                  contentAfter={discountType === 'percentage' ? <Text>%</Text> : undefined}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <Text className="text-sm">
                  <strong>Preview:</strong><br />
                  Harga asli: {formatCurrency(item.quantity * item.unitPrice)}<br />
                  Diskon: {discountType === 'percentage' 
                    ? `${discountValue}% = ${formatCurrency((item.quantity * item.unitPrice * discountValue) / 100)}`
                    : formatCurrency(discountValue * item.quantity)
                  }<br />
                  <strong>Total: {formatCurrency(
                    item.quantity * item.unitPrice - 
                    (discountType === 'percentage' 
                      ? (item.quantity * item.unitPrice * discountValue) / 100
                      : discountValue * item.quantity
                    ) + 
                    ((item.quantity * item.unitPrice - 
                      (discountType === 'percentage' 
                        ? (item.quantity * item.unitPrice * discountValue) / 100
                        : discountValue * item.quantity
                      )) * item.product.taxRate)
                  )}</strong>
                </Text>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowDiscountDialog(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handleDiscountSave}
              >
                Simpan Diskon
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={(_, data) => setShowNoteDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Catatan - {item.product.name}</DialogTitle>
            <DialogContent className="space-y-4">
              <div className="space-y-2">
                <Text weight="semibold">Catatan:</Text>
                <Textarea
                  placeholder="Masukkan catatan untuk item ini..."
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  rows={3}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowNoteDialog(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handleNoteSave}
              >
                Simpan Catatan
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Card>
  );
}

// ======================================================================
// MAIN SHOPPING CART COMPONENT
// ======================================================================

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  onUpdateNote,
  onClearCart,
  className,
  showActions = true,
  readonly = false
}: ShoppingCartProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  const totals = calculateCartTotals(items);
  const hasLowStockItems = items.some(item => item.product.stock < item.quantity);

  const handleClearCart = () => {
    onClearCart();
    setShowClearDialog(false);
    toast.success('Keranjang berhasil dikosongkan');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Title3 className="flex items-center space-x-2">
            <ShoppingBag24Regular />
            <span>Keranjang Belanja</span>
          </Title3>
          <Badge appearance="filled" color="brand">
            {totals.itemCount} item
          </Badge>
        </div>
        
        {showActions && !readonly && items.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              appearance="outline"
              icon={<Calculator24Regular />}
              size="small"
              onClick={() => toast('Kalkulator akan segera tersedia')}
            >
              Kalkulator
            </Button>
            <Button
              appearance="outline"
              icon={<Delete24Regular />}
              size="small"
              onClick={() => setShowClearDialog(true)}
            >
              Kosongkan
            </Button>
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <ShoppingBag24Regular className="w-16 h-16 text-gray-300 mb-4" />
            <Text className="text-gray-600 mb-2">Keranjang masih kosong</Text>
            <Caption1 className="text-gray-500">
              {readonly 
                ? 'Tidak ada item dalam transaksi ini'
                : 'Scan barcode atau pilih produk untuk memulai transaksi'
              }
            </Caption1>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Low Stock Warning */}
            {hasLowStockItems && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <Warning24Filled className="mr-2" />
                  Beberapa item memiliki stok yang tidak mencukupi
                </MessageBarBody>
              </MessageBar>
            )}
            
            {/* Cart Items */}
            {items.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
                onRemove={() => onRemoveItem(item.id)}
                onUpdateDiscount={(discount, type) => onUpdateDiscount(item.id, discount, type)}
                onUpdateNote={(note) => onUpdateNote(item.id, note)}
                readonly={readonly}
                showActions={showActions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Caption1>Subtotal ({totals.itemCount} item):</Caption1>
              <Text>{formatCurrency(totals.subtotal)}</Text>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <Caption1>Total Diskon:</Caption1>
                <Text>-{formatCurrency(totals.discount)}</Text>
              </div>
            )}
            <div className="flex justify-between">
              <Caption1>PPN (11%):</Caption1>
              <Text>{formatCurrency(totals.tax)}</Text>
            </div>
            <Divider />
            <div className="flex justify-between">
              <Text weight="bold">Total Pembayaran:</Text>
              <Text weight="bold" className="text-lg text-blue-600">
                {formatCurrency(totals.total)}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={(_, data) => setShowClearDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Konfirmasi Kosongkan Keranjang</DialogTitle>
            <DialogContent>
              <Text>
                Apakah Anda yakin ingin mengosongkan keranjang belanja?
              </Text>
              <Text className="text-gray-600 mt-2">
                Semua item ({totals.itemCount} item) akan dihapus dari keranjang.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowClearDialog(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handleClearCart}
                icon={<Delete24Regular />}
              >
                Ya, Kosongkan
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}

// ======================================================================
// EXPORT UTILITIES
// ======================================================================

export { calculateCartTotals, calculateItemTotals };
export type { CartItem, CartTotals, Product };