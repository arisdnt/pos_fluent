// ======================================================================
// KOMPONEN DIALOG PEMBAYARAN
// Dialog untuk memproses pembayaran transaksi POS
// ======================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Title3,
  Caption1,
  Input,
  Card,
  Badge,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
  Tooltip,
  ToggleButton
} from '@fluentui/react-components';
import {
  Money24Regular,
  Payment24Regular,
  Code24Regular,
  Calculator24Regular,
  Receipt24Regular,
  Print24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Dismiss24Regular,
  Add24Regular,
  Subtract24Regular,
  Delete24Regular,
  Save24Regular,
  ArrowUndo24Regular
} from '@fluentui/react-icons';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ======================================================================
// TYPES
// ======================================================================

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'ewallet' | 'qris' | 'credit';
  icon: React.ReactNode;
  enabled: boolean;
  requiresAmount?: boolean;
  maxAmount?: number;
  minAmount?: number;
  fee?: number;
  feeType?: 'fixed' | 'percentage';
}

interface PaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentComplete: (payments: PaymentSplit[], change: number) => void;
  onPaymentCancel: () => void;
  customerName?: string;
  allowSplitPayment?: boolean;
  allowPartialPayment?: boolean;
}

// ======================================================================
// PAYMENT METHODS DATA
// ======================================================================

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Tunai',
    type: 'cash',
    icon: <Money24Regular />,
    enabled: true,
    requiresAmount: true
  },
  {
    id: 'debit',
    name: 'Kartu Debit',
    type: 'card',
    icon: <Payment24Regular />,
    enabled: true,
    requiresAmount: false
  },
  {
    id: 'credit',
    name: 'Kartu Kredit',
    type: 'card',
    icon: <Payment24Regular />,
    enabled: true,
    requiresAmount: false,
    fee: 2.5,
    feeType: 'percentage'
  },
  {
    id: 'qris',
    name: 'QRIS',
    type: 'qris',
    icon: <Code24Regular />,
    enabled: true,
    requiresAmount: false
  },
  {
    id: 'transfer',
    name: 'Transfer Bank',
    type: 'transfer',
    icon: <Payment24Regular />,
    enabled: true,
    requiresAmount: false
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'ewallet',
    icon: <Money24Regular />,
    enabled: true,
    requiresAmount: false
  },
  {
    id: 'ovo',
    name: 'OVO',
    type: 'ewallet',
    icon: <Money24Regular />,
    enabled: true,
    requiresAmount: false
  },
  {
    id: 'dana',
    name: 'DANA',
    type: 'ewallet',
    icon: <Money24Regular />,
    enabled: true,
    requiresAmount: false
  }
];

// Quick amount buttons for cash payments
const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000];

// ======================================================================
// CALCULATOR COMPONENT
// ======================================================================

interface CalculatorProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

function Calculator({ value, onChange, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState(value.toString());
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
      onChange(newValue);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const clearEntry = () => {
    setDisplay('0');
    setWaitingForNewValue(false);
  };

  const handleUse = () => {
    onChange(parseFloat(display));
    onClose();
  };

  return (
    <Card className="p-4 w-80">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Text weight="semibold">Kalkulator</Text>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            size="small"
            onClick={onClose}
          />
        </div>
        
        {/* Display */}
        <div className="bg-gray-100 p-3 rounded text-right">
          <Text className="text-xl font-mono">{display}</Text>
        </div>
        
        {/* Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button appearance="outline" onClick={clear}>C</Button>
          <Button appearance="outline" onClick={clearEntry}>CE</Button>
          <Button appearance="outline" onClick={() => inputOperation('/')}>/</Button>
          <Button appearance="outline" onClick={() => inputOperation('*')}>×</Button>
          
          {/* Row 2 */}
          <Button appearance="outline" onClick={() => inputNumber('7')}>7</Button>
          <Button appearance="outline" onClick={() => inputNumber('8')}>8</Button>
          <Button appearance="outline" onClick={() => inputNumber('9')}>9</Button>
          <Button appearance="outline" onClick={() => inputOperation('-')}>-</Button>
          
          {/* Row 3 */}
          <Button appearance="outline" onClick={() => inputNumber('4')}>4</Button>
          <Button appearance="outline" onClick={() => inputNumber('5')}>5</Button>
          <Button appearance="outline" onClick={() => inputNumber('6')}>6</Button>
          <Button appearance="outline" onClick={() => inputOperation('+')}>+</Button>
          
          {/* Row 4 */}
          <Button appearance="outline" onClick={() => inputNumber('1')}>1</Button>
          <Button appearance="outline" onClick={() => inputNumber('2')}>2</Button>
          <Button appearance="outline" onClick={() => inputNumber('3')}>3</Button>
          <Button appearance="primary" onClick={performCalculation} className="row-span-2">=</Button>
          
          {/* Row 5 */}
          <Button appearance="outline" onClick={() => inputNumber('0')} className="col-span-2">0</Button>
          <Button appearance="outline" onClick={() => inputNumber('.')}>.</Button>
        </div>
        
        <div className="flex space-x-2">
          <Button appearance="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button appearance="primary" onClick={handleUse} className="flex-1">
            Gunakan
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ======================================================================
// MAIN PAYMENT DIALOG COMPONENT
// ======================================================================

export default function PaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  onPaymentComplete,
  onPaymentCancel,
  customerName,
  allowSplitPayment = true,
  allowPartialPayment = false
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(paymentMethods[0]);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);

  // Calculate totals
  const totalPaid = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  const change = totalPaid - totalAmount;
  const isFullyPaid = totalPaid >= totalAmount;
  const canComplete = isFullyPaid || (allowPartialPayment && totalPaid > 0);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPaymentSplits([]);
      setCurrentAmount(totalAmount);
      setReference('');
      setNote('');
      setIsProcessing(false);
      setIsSplitMode(false);
      setSelectedMethod(paymentMethods[0]);
    }
  }, [open, totalAmount]);

  // Auto-set amount for cash payments
  useEffect(() => {
    if (selectedMethod.type === 'cash' && !isSplitMode) {
      setCurrentAmount(totalAmount);
    } else if (selectedMethod.type !== 'cash' && !isSplitMode) {
      setCurrentAmount(remainingAmount);
    }
  }, [selectedMethod, totalAmount, remainingAmount, isSplitMode]);

  const addPaymentSplit = () => {
    if (currentAmount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (currentAmount > remainingAmount && !selectedMethod.requiresAmount) {
      toast.error('Jumlah pembayaran melebihi sisa tagihan');
      return;
    }

    const newSplit: PaymentSplit = {
      id: `split-${Date.now()}`,
      method: selectedMethod,
      amount: currentAmount,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined
    };

    setPaymentSplits(prev => [...prev, newSplit]);
    setCurrentAmount(0);
    setReference('');
    setNote('');
    
    toast.success(`Pembayaran ${selectedMethod.name} ditambahkan`);
  };

  const removePaymentSplit = (splitId: string) => {
    setPaymentSplits(prev => prev.filter(split => split.id !== splitId));
    toast.success('Pembayaran dihapus');
  };

  const handleQuickAmount = (amount: number) => {
    if (isSplitMode) {
      setCurrentAmount(Math.min(amount, remainingAmount));
    } else {
      setCurrentAmount(amount);
    }
  };

  const handleExactAmount = () => {
    setCurrentAmount(remainingAmount);
  };

  const processPayment = async () => {
    setIsProcessing(true);
    
    try {
      let finalPayments = [...paymentSplits];
      
      // Add current payment if not in split mode or if there's a current amount
      if (!isSplitMode || currentAmount > 0) {
        if (currentAmount <= 0) {
          toast.error('Jumlah pembayaran harus lebih dari 0');
          setIsProcessing(false);
          return;
        }
        
        const currentPayment: PaymentSplit = {
          id: `payment-${Date.now()}`,
          method: selectedMethod,
          amount: currentAmount,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined
        };
        
        finalPayments = [...finalPayments, currentPayment];
      }
      
      if (finalPayments.length === 0) {
        toast.error('Tidak ada pembayaran yang diproses');
        setIsProcessing(false);
        return;
      }
      
      const finalTotalPaid = finalPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const finalChange = Math.max(0, finalTotalPaid - totalAmount);
      
      if (!allowPartialPayment && finalTotalPaid < totalAmount) {
        toast.error('Jumlah pembayaran kurang dari total tagihan');
        setIsProcessing(false);
        return;
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPaymentComplete(finalPayments, finalChange);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateMethodFee = (method: PaymentMethod, amount: number) => {
    if (!method.fee) return 0;
    
    return method.feeType === 'percentage' 
      ? (amount * method.fee) / 100
      : method.fee;
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogBody>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <Text className="text-xl font-semibold">Pembayaran</Text>
              {customerName && (
                <Caption1 className="text-gray-600">Pelanggan: {customerName}</Caption1>
              )}
            </div>
            {allowSplitPayment && (
              <ToggleButton
                checked={isSplitMode}
                onClick={() => setIsSplitMode(!isSplitMode)}
                size="small"
              >
                Split Payment
              </ToggleButton>
            )}
          </DialogTitle>
          
          <DialogContent className="space-y-6">
            {/* Payment Summary */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Text weight="semibold">Total Tagihan:</Text>
                  <Text weight="bold" className="text-xl text-blue-600">
                    {formatCurrency(totalAmount)}
                  </Text>
                </div>
                
                {isSplitMode && paymentSplits.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <Caption1>Sudah Dibayar:</Caption1>
                      <Text className="text-green-600">{formatCurrency(totalPaid)}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Caption1>Sisa Tagihan:</Caption1>
                      <Text className={remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(remainingAmount)}
                      </Text>
                    </div>
                  </>
                )}
                
                {change > 0 && (
                  <div className="flex justify-between bg-green-50 p-2 rounded">
                    <Text weight="semibold" className="text-green-800">Kembalian:</Text>
                    <Text weight="bold" className="text-green-800">
                      {formatCurrency(change)}
                    </Text>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment Splits (if any) */}
            {paymentSplits.length > 0 && (
              <div className="space-y-2">
                <Text weight="semibold">Pembayaran yang Ditambahkan:</Text>
                {paymentSplits.map((split) => (
                  <Card key={split.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {split.method.icon}
                        <div>
                          <Text weight="semibold">{split.method.name}</Text>
                          <Caption1 className="text-gray-600">
                            {formatCurrency(split.amount)}
                            {split.reference && ` • Ref: ${split.reference}`}
                          </Caption1>
                        </div>
                      </div>
                      <Button
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        size="small"
                        onClick={() => removePaymentSplit(split.id)}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Text weight="semibold">Metode Pembayaran:</Text>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {paymentMethods.filter(method => method.enabled).map((method) => {
                  const fee = calculateMethodFee(method, currentAmount);
                  return (
                    <Button
                      key={method.id}
                      appearance={selectedMethod.id === method.id ? "primary" : "outline"}
                      className="h-auto p-3 flex-col space-y-1"
                      onClick={() => setSelectedMethod(method)}
                    >
                      <div className="flex items-center space-x-2">
                        {method.icon}
                        <Text className="text-sm">{method.name}</Text>
                      </div>
                      {fee > 0 && (
                        <Caption1 className="text-orange-600">
                          Biaya: {formatCurrency(fee)}
                        </Caption1>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text weight="semibold">Jumlah Pembayaran:</Text>
                <Button
                  appearance="outline"
                  icon={<Calculator24Regular />}
                  size="small"
                  onClick={() => setShowCalculator(!showCalculator)}
                >
                  Kalkulator
                </Button>
              </div>
              
              {showCalculator && (
                <div className="flex justify-center">
                  <Calculator
                    value={currentAmount}
                    onChange={setCurrentAmount}
                    onClose={() => setShowCalculator(false)}
                  />
                </div>
              )}
              
              <Input
                type="number"
                placeholder="0"
                value={currentAmount ? currentAmount.toString() : ''}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                contentBefore={<Text>Rp</Text>}
                size="large"
              />
              
              {/* Quick Amount Buttons */}
              {selectedMethod.type === 'cash' && (
                <div className="space-y-2">
                  <Caption1>Jumlah Cepat:</Caption1>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      appearance="outline"
                      size="small"
                      onClick={handleExactAmount}
                    >
                      Pas ({formatCurrency(isSplitMode ? remainingAmount : totalAmount)})
                    </Button>
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        appearance="outline"
                        size="small"
                        onClick={() => handleQuickAmount(amount)}
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reference and Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Text weight="semibold">Referensi (Opsional):</Text>
                <Input
                  placeholder="No. kartu, ref transfer, dll"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Text weight="semibold">Catatan (Opsional):</Text>
                <Input
                  placeholder="Catatan pembayaran"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* Validation Messages */}
            {currentAmount > remainingAmount && selectedMethod.type !== 'cash' && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <Warning24Filled className="mr-2" />
                  Jumlah pembayaran melebihi sisa tagihan
                </MessageBarBody>
              </MessageBar>
            )}
            
            {!canComplete && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <Warning24Filled className="mr-2" />
                  Pembayaran belum mencukupi total tagihan
                </MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onPaymentCancel}
              disabled={isProcessing}
            >
              Batal
            </Button>
            
            {isSplitMode && currentAmount > 0 && (
              <Button
                appearance="outline"
                onClick={addPaymentSplit}
                icon={<Add24Regular />}
                disabled={isProcessing}
              >
                Tambah Pembayaran
              </Button>
            )}
            
            <Button
              appearance="primary"
              onClick={processPayment}
              disabled={isProcessing || !canComplete}
              icon={isProcessing ? <Spinner size="tiny" /> : <CheckmarkCircle24Filled />}
            >
              {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type { PaymentMethod, PaymentSplit, PaymentDialogProps };