'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Divider,
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Dropdown,
  Option,
  SpinButton,
  Card,
  CardHeader,
  CardPreview,
  ProgressBar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import {
  Money20Regular,
  CreditCardClock20Regular,
  Wallet20Regular,
  Receipt20Regular,
  Calculator20Regular,
  Print20Regular,
  Checkmark20Regular,
  Warning20Regular,
  ErrorCircle20Regular,
  ArrowLeft20Regular,
  Add20Regular
} from '@fluentui/react-icons';

// ======================================================================
// STYLES
// ======================================================================

const useStyles = makeStyles({
  container: {
    width: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '60vh',
    overflowY: 'auto'
  },
  orderSummary: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  totalRow: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    paddingTop: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  paymentMethods: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '8px'
  },
  paymentMethod: {
    padding: '16px 12px',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  paymentMethodActive: {
    backgroundColor: tokens.colorBrandBackground2
  },
  paymentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium
  },
  amountInput: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'right'
  },
  quickAmounts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  quickAmount: {
    padding: '8px',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold
  },
  changeAmount: {
    padding: '16px',
    backgroundColor: tokens.colorPaletteGreenBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`,
    textAlign: 'center'
  },
  changeText: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteGreenForeground2
  },
  multiplePayments: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  paymentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  paymentItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  processingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px',
    textAlign: 'center'
  },
  successState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px',
    textAlign: 'center'
  }
});

// ======================================================================
// TYPES
// ======================================================================

export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactElement;
  type: 'cash' | 'card' | 'digital' | 'bank_transfer' | 'qris';
  enabled: boolean;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface PaymentData {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Payment[];
  change: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  orderItems: any[];
  customer?: any;
  onPaymentComplete: (paymentData: PaymentData) => void;
  onPrintReceipt?: () => void;
}

// ======================================================================
// PAYMENT METHODS
// ======================================================================

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Tunai',
    icon: <Money20Regular />,
    type: 'cash',
    enabled: true
  },
  {
    id: 'debit',
    name: 'Kartu Debit',
    icon: <CreditCardClock20Regular />,
    type: 'card',
    enabled: true
  },
  {
    id: 'credit',
    name: 'Kartu Kredit',
    icon: <CreditCardClock20Regular />,
    type: 'card',
    enabled: true
  },
  {
    id: 'qris',
    name: 'QRIS',
    icon: <Wallet20Regular />,
    type: 'qris',
    enabled: true
  },
  {
    id: 'transfer',
    name: 'Transfer Bank',
    icon: <Wallet20Regular />,
    type: 'bank_transfer',
    enabled: true
  }
];

// ======================================================================
// PAYMENT MODAL COMPONENT
// ======================================================================

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderTotal,
  orderItems = [],
  customer,
  onPaymentComplete,
  onPrintReceipt
}) => {
  const styles = useStyles();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(paymentMethods[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(orderTotal);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = orderTotal - totalPaid;
  const changeAmount = totalPaid > orderTotal ? totalPaid - orderTotal : 0;

  const quickAmounts = [
    50000, 100000, 200000,
    500000, 1000000, orderTotal
  ];

  const resetModal = () => {
    setSelectedMethod(paymentMethods[0]);
    setPaymentAmount(orderTotal);
    setPayments([]);
    setPaymentStatus('input');
    setErrorMessage('');
    setReference('');
  };

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen, orderTotal]);

  const handleAddPayment = () => {
    if (paymentAmount <= 0) {
      setErrorMessage('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (paymentAmount > remainingAmount && selectedMethod.type !== 'cash') {
      setErrorMessage('Jumlah pembayaran melebihi sisa tagihan');
      return;
    }

    const newPayment: Payment = {
      id: `payment_${Date.now()}`,
      method: selectedMethod,
      amount: paymentAmount,
      reference: reference || undefined,
      status: 'pending'
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount(Math.max(0, remainingAmount - paymentAmount));
    setReference('');
    setErrorMessage('');
  };

  const handleRemovePayment = (paymentId: string) => {
    setPayments(payments.filter(p => p.id !== paymentId));
  };

  const handleProcessPayment = async () => {
    if (remainingAmount > 0 && paymentAmount > 0) {
      handleAddPayment();
      return;
    }

    if (totalPaid < orderTotal) {
      setErrorMessage('Total pembayaran kurang dari jumlah tagihan');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      const completedPayments = payments.map(payment => ({
        ...payment,
        status: 'completed' as const
      }));

      const paymentData: PaymentData = {
        subtotal: orderTotal * 0.9, // Assuming 10% tax
        discount: 0,
        tax: orderTotal * 0.1,
        total: orderTotal,
        payments: completedPayments,
        change: changeAmount,
        status: 'completed'
      };

      setPaymentStatus('success');
      onPaymentComplete(paymentData);
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage('Pembayaran gagal. Silakan coba lagi.');
    }
  };

  const handleClose = () => {
    if (paymentStatus === 'processing') return;
    resetModal();
    onClose();
  };

  const renderPaymentInput = () => (
    <div className={styles.content}>
      {/* Order Summary */}
      <div className={styles.orderSummary}>
        <Text size={400} weight="semibold" style={{ marginBottom: '12px' }}>
          Ringkasan Pesanan
        </Text>
        <div className={styles.summaryRow}>
          <Text>Subtotal ({orderItems.length} item)</Text>
          <Text>{formatCurrency(orderTotal * 0.9)}</Text>
        </div>
        <div className={styles.summaryRow}>
          <Text>PPN (11%)</Text>
          <Text>{formatCurrency(orderTotal * 0.1)}</Text>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <Text>Total</Text>
          <Text>{formatCurrency(orderTotal)}</Text>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <Text size={400} weight="semibold" style={{ marginBottom: '12px' }}>
          Metode Pembayaran
        </Text>
        <div className={styles.paymentMethods}>
          {paymentMethods.filter(method => method.enabled).map((method) => (
            <div
              key={method.id}
              className={`${styles.paymentMethod} ${
                selectedMethod.id === method.id ? styles.paymentMethodActive : ''
              }`}
              onClick={() => setSelectedMethod(method)}
            >
              {method.icon}
              <Text size={200} weight="semibold">
                {method.name}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div className={styles.paymentDetails}>
        <Text size={400} weight="semibold">
          Detail Pembayaran - {selectedMethod.name}
        </Text>

        {selectedMethod.type === 'cash' && (
          <>
            <Field label="Jumlah Diterima">
              <Input
                className={styles.amountInput}
                value={paymentAmount.toLocaleString('id-ID')}
                onChange={(_, data) => {
                  const value = parseInt(data.value.replace(/\D/g, '')) || 0;
                  setPaymentAmount(value);
                }}
                placeholder="0"
              />
            </Field>

            <div>
              <Text size={300} weight="semibold" style={{ marginBottom: '8px' }}>
                Jumlah Cepat
              </Text>
              <div className={styles.quickAmounts}>
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    className={styles.quickAmount}
                    appearance="outline"
                    size="small"
                    onClick={() => setPaymentAmount(amount)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedMethod.type !== 'cash' && (
          <>
            <Field label="Jumlah Pembayaran">
              <Input
                className={styles.amountInput}
                value={paymentAmount.toLocaleString('id-ID')}
                onChange={(_, data) => {
                  const value = parseInt(data.value.replace(/\D/g, '')) || 0;
                  setPaymentAmount(value);
                }}
                placeholder="0"
              />
            </Field>

            {(selectedMethod.type === 'card' || selectedMethod.type === 'bank_transfer') && (
              <Field label="Nomor Referensi (Opsional)">
                <Input
                  value={reference}
                  onChange={(_, data) => setReference(data.value)}
                  placeholder="Masukkan nomor referensi"
                />
              </Field>
            )}
          </>
        )}

        {remainingAmount > 0 && (
          <Button
            appearance="outline"
            icon={<Add20Regular />}
            onClick={handleAddPayment}
            disabled={paymentAmount <= 0}
          >
            Tambah Pembayaran
          </Button>
        )}
      </div>

      {/* Multiple Payments */}
      {payments.length > 0 && (
        <div>
          <Text size={400} weight="semibold" style={{ marginBottom: '12px' }}>
            Pembayaran yang Ditambahkan
          </Text>
          <div className={styles.multiplePayments}>
            {payments.map((payment) => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentItemLeft}>
                  {payment.method.icon}
                  <div>
                    <Text size={300} weight="semibold">
                      {payment.method.name}
                    </Text>
                    {payment.reference && (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                        Ref: {payment.reference}
                      </Text>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text size={300} weight="semibold">
                    {formatCurrency(payment.amount)}
                  </Text>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={() => handleRemovePayment(payment.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div className={styles.summaryRow}>
            <Text size={400} weight="semibold">Total Dibayar</Text>
            <Text size={400} weight="semibold">{formatCurrency(totalPaid)}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text size={400} weight="semibold">Sisa Tagihan</Text>
            <Text size={400} weight="semibold" style={{ 
              color: remainingAmount > 0 ? tokens.colorPaletteRedForeground1 : tokens.colorPaletteGreenForeground1 
            }}>
              {formatCurrency(remainingAmount)}
            </Text>
          </div>
        </div>
      )}

      {/* Change Amount */}
      {changeAmount > 0 && (
        <div className={styles.changeAmount}>
          <Text size={300}>Kembalian</Text>
          <Text className={styles.changeText}>
            {formatCurrency(changeAmount)}
          </Text>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {errorMessage}
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );

  const renderProcessing = () => (
    <div className={styles.processingState}>
      <Spinner size="large" />
      <Text size={500} weight="semibold">
        Memproses Pembayaran...
      </Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
        Mohon tunggu, pembayaran sedang diproses
      </Text>
      <ProgressBar />
    </div>
  );

  const renderSuccess = () => (
    <div className={styles.successState}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '50%', 
        backgroundColor: tokens.colorPaletteGreenBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Checkmark20Regular style={{ 
          fontSize: '32px', 
          color: tokens.colorPaletteGreenForeground2 
        }} />
      </div>
      <Text size={500} weight="semibold">
        Pembayaran Berhasil!
      </Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
        Transaksi telah selesai dan struk akan dicetak
      </Text>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: tokens.borderRadiusMedium,
        width: '100%'
      }}>
        <div className={styles.summaryRow}>
          <Text>Total Dibayar</Text>
          <Text weight="semibold">{formatCurrency(totalPaid)}</Text>
        </div>
        {changeAmount > 0 && (
          <div className={styles.summaryRow}>
            <Text>Kembalian</Text>
            <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground1 }}>
              {formatCurrency(changeAmount)}
            </Text>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <Button
          appearance="outline"
          icon={<Print20Regular />}
          onClick={onPrintReceipt}
          style={{ flex: 1 }}
        >
          Cetak Struk
        </Button>
        <Button
          appearance="primary"
          onClick={handleClose}
          style={{ flex: 1 }}
        >
          Selesai
        </Button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className={styles.processingState}>
      <div style={{ 
        width: '64px', 
        height: '64px', 
        borderRadius: '50%', 
        backgroundColor: tokens.colorPaletteRedBackground2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ErrorCircle20Regular style={{ 
          fontSize: '32px', 
          color: tokens.colorPaletteRedForeground2 
        }} />
      </div>
      <Text size={500} weight="semibold">
        Pembayaran Gagal
      </Text>
      <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
        {errorMessage || 'Terjadi kesalahan saat memproses pembayaran'}
      </Text>
      <Button
        appearance="primary"
        onClick={() => setPaymentStatus('input')}
      >
        Coba Lagi
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.container}>
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {paymentStatus === 'input' && <Calculator20Regular />}
            {paymentStatus === 'processing' && <Money20Regular />}
            {paymentStatus === 'success' && <Receipt20Regular />}
            {paymentStatus === 'error' && <Warning20Regular />}
            <Text size={500} weight="semibold">
              {paymentStatus === 'input' && 'Pembayaran'}
              {paymentStatus === 'processing' && 'Memproses Pembayaran'}
              {paymentStatus === 'success' && 'Pembayaran Berhasil'}
              {paymentStatus === 'error' && 'Pembayaran Gagal'}
            </Text>
          </div>
        </DialogTitle>

        <DialogContent>
          <DialogBody>
            {paymentStatus === 'input' && renderPaymentInput()}
            {paymentStatus === 'processing' && renderProcessing()}
            {paymentStatus === 'success' && renderSuccess()}
            {paymentStatus === 'error' && renderError()}
          </DialogBody>

          {paymentStatus === 'input' && (
            <DialogActions className={styles.actions}>
              <Button
                appearance="secondary"
                icon={<ArrowLeft20Regular />}
                onClick={handleClose}
              >
                Kembali
              </Button>
              <Button
                appearance="primary"
                icon={<Money20Regular />}
                onClick={handleProcessPayment}
                disabled={totalPaid < orderTotal && paymentAmount <= 0}
              >
                {remainingAmount > 0 && paymentAmount > 0 
                  ? 'Tambah & Bayar' 
                  : totalPaid >= orderTotal 
                    ? `Bayar ${formatCurrency(orderTotal)}`
                    : 'Bayar'
                }
              </Button>
            </DialogActions>
          )}
        </DialogContent>
      </DialogSurface>
    </Dialog>
  );
};

export default PaymentModal;