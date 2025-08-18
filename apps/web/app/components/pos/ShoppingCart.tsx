'use client';

import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Divider,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  Tooltip,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Textarea,
  Dropdown,
  Option,
  SpinButton
} from '@fluentui/react-components';
import {
  ShoppingCart20Regular,
  Delete20Regular,
  Add20Regular,
  Subtract20Regular,
  Receipt20Regular,
  Person20Regular,
  Tag20Regular,
  Calculator20Regular,
  Clear20Regular,
  Save20Regular
} from '@fluentui/react-icons';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },
  header: {
    padding: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colorNeutralBackground2
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  itemsList: {
    flex: 1,
    padding: '8px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: tokens.colorNeutralForeground2,
    gap: '8px'
  },
  cartItem: {
    padding: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderColor: tokens.colorNeutralStroke1Hover
    }
  },
  itemImage: {
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300
  },
  itemCode: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  itemPrice: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1
  },
  itemControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  quantityInput: {
    width: '60px',
    textAlign: 'center'
  },
  itemTotal: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold
  },
  summary: {
    padding: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalRow: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    paddingTop: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  actions: {
    padding: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  customerSection: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  discountSection: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }
});

// ======================================================================
// TYPES
// ======================================================================

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  image?: string;
  category?: string;
  unit?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points?: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  customer?: Customer;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onApplyDiscount: (discount: number, type: 'percentage' | 'fixed') => void;
  onCheckout: () => void;
  onSaveCart: () => void;
  isLoading?: boolean;
}

// ======================================================================
// SHOPPING CART COMPONENT
// ======================================================================

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  items = [],
  customer,
  discount = 0,
  discountType = 'percentage',
  taxRate = 0.11, // PPN 11%
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectCustomer,
  onApplyDiscount,
  onCheckout,
  onSaveCart,
  isLoading = false
}) => {
  const styles = useStyles();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(discount);
  const [tempDiscountType, setTempDiscountType] = useState(discountType);

  // Calculate cart summary
  const calculateSummary = useCallback((): CartSummary => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = item.discount || 0;
      const discountAmount = item.discountType === 'percentage' 
        ? itemTotal * (itemDiscount / 100)
        : itemDiscount;
      return sum + (itemTotal - discountAmount);
    }, 0);

    const cartDiscountAmount = discountType === 'percentage'
      ? subtotal * (discount / 100)
      : discount;

    const afterDiscount = subtotal - cartDiscountAmount;
    const tax = afterDiscount * taxRate;
    const total = afterDiscount + tax;

    return {
      subtotal,
      discount: cartDiscountAmount,
      tax,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [items, discount, discountType, taxRate]);

  const summary = calculateSummary();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= 999) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleApplyDiscount = () => {
    onApplyDiscount(tempDiscount, tempDiscountType);
    setDiscountDialogOpen(false);
  };

  const mockCustomers: Customer[] = [
    { id: '1', name: 'Pelanggan Umum', points: 0 },
    { id: '2', name: 'John Doe', email: 'john@email.com', phone: '081234567890', points: 150 },
    { id: '3', name: 'Jane Smith', email: 'jane@email.com', phone: '081234567891', points: 250 }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <ShoppingCart20Regular />
          <Text size={500} weight="semibold">
            Keranjang Belanja
          </Text>
          {items.length > 0 && (
            <Badge appearance="filled" color="brand" size="small">
              {summary.itemCount}
            </Badge>
          )}
        </div>
        {items.length > 0 && (
          <Tooltip content="Kosongkan Keranjang" relationship="label">
            <Button
              appearance="subtle"
              icon={<Clear20Regular />}
              onClick={() => setClearDialogOpen(true)}
              size="small"
            />
          </Tooltip>
        )}
      </div>

      {/* Items List */}
      <div className={styles.itemsList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingCart20Regular style={{ fontSize: '48px' }} />
            <Text size={400} weight="semibold">
              Keranjang Kosong
            </Text>
            <Text size={300} style={{ textAlign: 'center' }}>
              Scan barcode atau pilih produk untuk menambahkan ke keranjang
            </Text>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemImage}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: tokens.borderRadiusMedium }}
                  />
                ) : (
                  <Receipt20Regular />
                )}
              </div>

              <div className={styles.itemDetails}>
                <Text className={styles.itemName}>
                  {item.name}
                </Text>
                <Text className={styles.itemCode}>
                  {item.code}
                </Text>
                <Text className={styles.itemPrice}>
                  {formatCurrency(item.price)}
                  {item.unit && ` / ${item.unit}`}
                </Text>
                {item.discount && (
                  <Badge appearance="outline" color="success" size="small">
                    Diskon {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                  </Badge>
                )}
              </div>

              <div className={styles.itemControls}>
                <div className={styles.quantityControls}>
                  <Button
                    appearance="subtle"
                    icon={<Subtract20Regular />}
                    size="small"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  />
                  <SpinButton
                    className={styles.quantityInput}
                    value={item.quantity}
                    min={1}
                    max={999}
                    step={1}
                    onChange={(_, data) => {
                      if (data.value !== undefined) {
                        handleQuantityChange(item.id, data.value);
                      }
                    }}
                    size="small"
                  />
                  <Button
                    appearance="subtle"
                    icon={<Add20Regular />}
                    size="small"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={item.quantity >= 999}
                  />
                </div>

                <Text className={styles.itemTotal}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>

                <Tooltip content="Hapus Item" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<Delete20Regular />}
                    size="small"
                    onClick={() => onRemoveItem(item.id)}
                  />
                </Tooltip>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <>
          {/* Customer Section */}
          <div className={styles.customerSection}>
            <Text size={300} weight="semibold">
              Pelanggan
            </Text>
            <Button
              appearance="outline"
              icon={<Person20Regular />}
              onClick={() => setCustomerDialogOpen(true)}
              style={{ justifyContent: 'flex-start' }}
            >
              {customer ? customer.name : 'Pilih Pelanggan'}
            </Button>
            {customer && customer.points && customer.points > 0 && (
              <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
                Poin: {customer.points}
              </Text>
            )}
          </div>

          {/* Discount Section */}
          <div className={styles.discountSection}>
            <Text size={300} weight="semibold">
              Diskon
            </Text>
            <Button
              appearance="outline"
              icon={<Tag20Regular />}
              onClick={() => setDiscountDialogOpen(true)}
              style={{ justifyContent: 'flex-start' }}
            >
              {discount > 0 
                ? `${discountType === 'percentage' ? `${discount}%` : formatCurrency(discount)}`
                : 'Tambah Diskon'
              }
            </Button>
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <Text>Subtotal ({summary.itemCount} item)</Text>
              <Text>{formatCurrency(summary.subtotal)}</Text>
            </div>
            {summary.discount > 0 && (
              <div className={styles.summaryRow}>
                <Text>Diskon</Text>
                <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>
                  -{formatCurrency(summary.discount)}
                </Text>
              </div>
            )}
            <div className={styles.summaryRow}>
              <Text>PPN ({Math.round(taxRate * 100)}%)</Text>
              <Text>{formatCurrency(summary.tax)}</Text>
            </div>
            <Divider />
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <Text>Total</Text>
              <Text>{formatCurrency(summary.total)}</Text>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<Calculator20Regular />}
              onClick={onCheckout}
              disabled={isLoading}
              size="large"
              style={{ width: '100%' }}
            >
              Bayar ({formatCurrency(summary.total)})
            </Button>
            <Button
              appearance="outline"
              icon={<Save20Regular />}
              onClick={onSaveCart}
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              Simpan Keranjang
            </Button>
          </div>
        </>
      )}

      {/* Clear Cart Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={(_, data) => setClearDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>Kosongkan Keranjang</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                Apakah Anda yakin ingin mengosongkan keranjang belanja? 
                Semua item akan dihapus dan tidak dapat dikembalikan.
              </Text>
            </DialogBody>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setClearDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  onClearCart();
                  setClearDialogOpen(false);
                }}
              >
                Kosongkan
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={(_, data) => setCustomerDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>Pilih Pelanggan</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mockCustomers.map((cust) => (
                  <Button
                    key={cust.id}
                    appearance="outline"
                    onClick={() => {
                      onSelectCustomer(cust);
                      setCustomerDialogOpen(false);
                    }}
                    style={{ 
                      justifyContent: 'flex-start',
                      padding: '12px',
                      height: 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Text weight="semibold">{cust.name}</Text>
                      {cust.email && <Text size={200}>{cust.email}</Text>}
                      {cust.phone && <Text size={200}>{cust.phone}</Text>}
                      {cust.points && cust.points > 0 && (
                        <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
                          Poin: {cust.points}
                        </Text>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </DialogBody>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setCustomerDialogOpen(false)}
              >
                Batal
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={(_, data) => setDiscountDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>Tambah Diskon</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label="Tipe Diskon">
                  <Dropdown
                    value={tempDiscountType === 'percentage' ? 'Persentase' : 'Nominal'}
                    onOptionSelect={(_, data) => {
                      setTempDiscountType(data.optionValue === 'Persentase' ? 'percentage' : 'fixed');
                    }}
                  >
                    <Option value="Persentase">Persentase (%)</Option>
                    <Option value="Nominal">Nominal (Rp)</Option>
                  </Dropdown>
                </Field>
                <Field label={`Nilai Diskon ${tempDiscountType === 'percentage' ? '(%)' : '(Rp)'}`}>
                  <SpinButton
                    value={tempDiscount}
                    min={0}
                    max={tempDiscountType === 'percentage' ? 100 : summary.subtotal}
                    step={tempDiscountType === 'percentage' ? 1 : 1000}
                    onChange={(_, data) => {
                      if (data.value !== undefined) {
                        setTempDiscount(data.value);
                      }
                    }}
                  />
                </Field>
                {tempDiscount > 0 && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    Diskon: {tempDiscountType === 'percentage' 
                      ? formatCurrency(summary.subtotal * (tempDiscount / 100))
                      : formatCurrency(tempDiscount)
                    }
                  </Text>
                )}
              </div>
            </DialogBody>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => {
                  setTempDiscount(discount);
                  setTempDiscountType(discountType);
                  setDiscountDialogOpen(false);
                }}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handleApplyDiscount}
              >
                Terapkan
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ShoppingCart;