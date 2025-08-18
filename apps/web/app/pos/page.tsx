// ======================================================================
// HALAMAN POS (POINT OF SALE) - APLIKASI KASIR
// Interface utama untuk transaksi penjualan kasir
// ======================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  Input,
  Text,
  Title2,
  Title3,
  Body1,
  Caption1,
  Badge,
  Divider,
  Spinner,
  Avatar,
  Tooltip,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  MessageBar,
  MessageBarBody
} from '@fluentui/react-components';
import {
  Cart24Regular,
  ScanCamera24Regular,
  Calculator24Regular,
  Receipt24Regular,
  Delete24Regular,
  Add24Regular,
  Subtract24Regular,
  Search24Regular,
  Person24Regular,
  Payment24Regular,
  Money24Regular,
  Print24Regular,
  Save24Regular,
  ArrowLeft24Regular,
  Settings24Regular,
  QrCode24Regular,
  ShoppingBag24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Dismiss24Regular,
  Wallet24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { MainLayout } from '@/app/components/layout/MainLayout';
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
  subtotal: number;
  tax: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  membershipLevel?: 'regular' | 'silver' | 'gold' | 'platinum';
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'ewallet' | 'qris';
  icon: React.ReactNode;
  enabled: boolean;
}

interface Transaction {
  id: string;
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethod;
  amountPaid: number;
  change: number;
  status: 'draft' | 'completed' | 'cancelled' | 'hold';
  timestamp: Date;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockProducts: Product[] = [
  {
    id: '1',
    code: 'KPI001',
    name: 'Kopi Arabica 250g',
    price: 45000,
    stock: 25,
    category: 'Minuman',
    unit: 'pcs',
    taxRate: 0.11
  },
  {
    id: '2',
    code: 'TEH001',
    name: 'Teh Hijau Premium 100g',
    price: 35000,
    stock: 15,
    category: 'Minuman',
    unit: 'pcs',
    taxRate: 0.11
  },
  {
    id: '3',
    code: 'SNK001',
    name: 'Keripik Singkong Original',
    price: 12000,
    stock: 50,
    category: 'Snack',
    unit: 'pcs',
    taxRate: 0.11
  },
  {
    id: '4',
    code: 'MIE001',
    name: 'Mie Instan Ayam Bawang',
    price: 3500,
    stock: 100,
    category: 'Makanan',
    unit: 'pcs',
    taxRate: 0.11
  },
  {
    id: '5',
    code: 'AIR001',
    name: 'Air Mineral 600ml',
    price: 3000,
    stock: 200,
    category: 'Minuman',
    unit: 'btl',
    taxRate: 0.11
  }
];

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Pelanggan Umum',
    membershipLevel: 'regular'
  },
  {
    id: '2',
    name: 'Ahmad Wijaya',
    phone: '081234567890',
    email: 'ahmad@email.com',
    membershipLevel: 'silver'
  },
  {
    id: '3',
    name: 'Sari Dewi',
    phone: '081234567891',
    email: 'sari@email.com',
    membershipLevel: 'gold'
  }
];

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Tunai',
    type: 'cash',
    icon: <Money24Regular />,
    enabled: true
  },
  {
    id: 'card',
    name: 'Kartu Debit/Kredit',
    type: 'card',
    icon: <Wallet24Regular />,
    enabled: true
  },
  {
    id: 'qris',
    name: 'QRIS',
    type: 'qris',
    icon: <QrCode24Regular />,
    enabled: true
  }
];

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function POSPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(mockCustomers[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(paymentMethods[0]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Filtered products based on search
  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ======================================================================
  // CALCULATIONS
  // ======================================================================

  const calculateCartTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
    const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    
    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total
    };
  }, [cart]);

  const totals = calculateCartTotals();
  const change = amountPaid - totals.total;

  // ======================================================================
  // CART OPERATIONS
  // ======================================================================

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update existing item
        return prevCart.map(item => {
          if (item.product.id === product.id) {
            const newQuantity = item.quantity + quantity;
            const subtotal = newQuantity * item.unitPrice;
            const tax = subtotal * product.taxRate;
            const total = subtotal + tax - (item.discount * newQuantity);
            
            return {
              ...item,
              quantity: newQuantity,
              subtotal,
              tax,
              total
            };
          }
          return item;
        });
      } else {
        // Add new item
        const unitPrice = product.price;
        const subtotal = quantity * unitPrice;
        const tax = subtotal * product.taxRate;
        const total = subtotal + tax;
        
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          unitPrice,
          discount: 0,
          subtotal,
          tax,
          total
        };
        
        return [...prevCart, newItem];
      }
    });
    
    toast.success(`${product.name} ditambahkan ke keranjang`);
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          const subtotal = newQuantity * item.unitPrice;
          const tax = subtotal * item.product.taxRate;
          const total = subtotal + tax - (item.discount * newQuantity);
          
          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            tax,
            total
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item dihapus dari keranjang');
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(mockCustomers[0]);
    setAmountPaid(0);
    toast.success('Keranjang dikosongkan');
  };

  // ======================================================================
  // BARCODE HANDLING
  // ======================================================================

  const handleBarcodeInput = (barcode: string) => {
    const product = mockProducts.find(p => p.code === barcode);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast.error(`Produk dengan kode ${barcode} tidak ditemukan`);
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeInput(barcodeInput.trim());
    }
  };

  // ======================================================================
  // PAYMENT PROCESSING
  // ======================================================================

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    
    if (amountPaid < totals.total) {
      toast.error('Jumlah pembayaran kurang');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transaction: Transaction = {
        id: `TRX-${Date.now()}`,
        items: [...cart],
        customer: selectedCustomer.id !== '1' ? selectedCustomer : undefined,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: selectedPaymentMethod,
        amountPaid,
        change,
        status: 'completed',
        timestamp: new Date()
      };
      
      setCurrentTransaction(transaction);
      
      // Clear cart and reset form
      clearCart();
      setShowPaymentDialog(false);
      
      toast.success('Transaksi berhasil!');
      
      // Auto print receipt (simulate)
      setTimeout(() => {
        toast.success('Struk berhasil dicetak');
      }, 1000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  // ======================================================================
  // KEYBOARD SHORTCUTS
  // ======================================================================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F2 - Focus barcode input
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      
      // F3 - Clear cart
      if (e.key === 'F3') {
        e.preventDefault();
        clearCart();
      }
      
      // F4 - Open payment
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowPaymentDialog(true);
        }
      }
      
      // Escape - Close dialogs
      if (e.key === 'Escape') {
        setShowPaymentDialog(false);
        setShowCustomerDialog(false);
        setShowProductSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [cart.length]);

  // Auto focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // ======================================================================
  // RENDER
  // ======================================================================

  return (
    <div className="h-full bg-gray-50 flex flex-col">

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="w-2/3 flex flex-col border-r border-gray-200">
          {/* Unified Search */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ScanCamera24Regular className="text-blue-600" />
              <Input
                ref={barcodeInputRef}
                placeholder="Scan barcode, ketik kode produk, atau cari nama produk (F2)"
                value={barcodeInput || searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setBarcodeInput(value);
                  setSearchQuery(value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value;
                    // Jika input berupa angka/kode, tambahkan ke cart
                    if (/^[0-9]+$/.test(value)) {
                      handleBarcodeInput(value);
                    }
                  }
                }}
                className="flex-1"
                contentBefore={<Search24Regular />}
              />
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => {
                  const value = barcodeInput || searchQuery;
                  if (/^[0-9]+$/.test(value)) {
                    handleBarcodeInput(value);
                  }
                }}
                disabled={!(barcodeInput || searchQuery)?.trim()}
              >
                Tambah
              </Button>
            </div>
          </div>

          {/* Product Table */}
          <div className="flex-1 overflow-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag24Regular className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Text className="text-gray-600">Tidak ada produk ditemukan</Text>
                <Caption1 className="text-gray-500 mt-1">
                  Coba ubah kata kunci pencarian
                </Caption1>
              </div>
            ) : (
              <div className="bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Produk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Caption1 className="text-gray-900 font-mono">
                            {product.code}
                          </Caption1>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <ShoppingBag24Regular className="text-gray-400 w-4 h-4" />
                            </div>
                            <div>
                              <Text weight="semibold" className="text-gray-900">
                                {product.name}
                              </Text>
                              <Caption1 className="text-gray-500">
                                {product.unit}
                              </Caption1>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge appearance="outline" size="small">
                            {product.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <Text weight="bold" className="text-blue-600">
                            {formatCurrency(product.price)}
                          </Text>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Badge 
                            appearance="outline" 
                            size="small"
                            color={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
                          >
                            {product.stock}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Button
                            appearance="primary"
                            size="small"
                            icon={<Add24Regular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                          >
                            Tambah
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-1/3 flex flex-col bg-white">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Title3>Keranjang Belanja</Title3>
              <Badge appearance="filled" color="brand">
                {cart.length} item
              </Badge>
            </div>
            
            {/* Customer Selection */}
            <div className="flex items-center space-x-2">
              <Person24Regular className="text-gray-500" />
              <Button
                appearance="outline"
                className="flex-1 justify-start"
                onClick={() => setShowCustomerDialog(true)}
              >
                {selectedCustomer.name}
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Cart24Regular className="w-16 h-16 text-gray-300 mb-4" />
                <Text className="text-gray-600 mb-2">Keranjang masih kosong</Text>
                <Caption1 className="text-gray-500">
                  Scan barcode atau pilih produk untuk memulai transaksi
                </Caption1>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Text weight="semibold" className="block text-sm">
                            {item.product.name}
                          </Text>
                          <Caption1 className="text-gray-600">
                            {item.product.code} | {formatCurrency(item.unitPrice)}
                          </Caption1>
                        </div>
                        <Button
                          appearance="subtle"
                          icon={<Delete24Regular />}
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            appearance="outline"
                            icon={<Subtract24Regular />}
                            size="small"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          />
                          <Text weight="semibold" className="min-w-[2rem] text-center">
                            {item.quantity}
                          </Text>
                          <Button
                            appearance="outline"
                            icon={<Add24Regular />}
                            size="small"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          />
                        </div>
                        <Text weight="bold" className="text-blue-600">
                          {formatCurrency(item.total)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Caption1>Subtotal:</Caption1>
                  <Text>{formatCurrency(totals.subtotal)}</Text>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <Caption1>Diskon:</Caption1>
                    <Text>-{formatCurrency(totals.discount)}</Text>
                  </div>
                )}
                <div className="flex justify-between">
                  <Caption1>PPN (11%):</Caption1>
                  <Text>{formatCurrency(totals.tax)}</Text>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <Text weight="bold">Total:</Text>
                  <Text weight="bold" className="text-lg text-blue-600">
                    {formatCurrency(totals.total)}
                  </Text>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  appearance="primary"
                  size="large"
                  className="w-full"
                  icon={<Payment24Regular />}
                  onClick={() => setShowPaymentDialog(true)}
                >
                  Bayar (F4)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    appearance="outline"
                    icon={<Save24Regular />}
                    onClick={() => toast.info('Fitur hold transaksi akan segera tersedia')}
                  >
                    Hold
                  </Button>
                  <Button
                    appearance="outline"
                    icon={<Delete24Regular />}
                    onClick={clearCart}
                  >
                    Hapus (F3)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(_, data) => setShowPaymentDialog(data.open)}>
        <DialogSurface className="max-w-md">
          <DialogBody>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogContent className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <Text weight="bold">Total Pembayaran:</Text>
                  <Text weight="bold" className="text-xl text-blue-600">
                    {formatCurrency(totals.total)}
                  </Text>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="space-y-2">
                <Text weight="semibold">Metode Pembayaran:</Text>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethods.filter(pm => pm.enabled).map((method) => (
                    <Button
                      key={method.id}
                      appearance={selectedPaymentMethod.id === method.id ? "primary" : "outline"}
                      className="justify-start"
                      icon={method.icon}
                      onClick={() => setSelectedPaymentMethod(method)}
                    >
                      {method.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="space-y-2">
                <Text weight="semibold">Jumlah Dibayar:</Text>
                <Input
                  type="number"
                  placeholder="0"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  contentBefore={<Text>Rp</Text>}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => setAmountPaid(totals.total)}
                  >
                    Pas
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => setAmountPaid(Math.ceil(totals.total / 50000) * 50000)}
                  >
                    50rb
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    onClick={() => setAmountPaid(Math.ceil(totals.total / 100000) * 100000)}
                  >
                    100rb
                  </Button>
                </div>
              </div>
              
              {/* Change */}
              {amountPaid > 0 && (
                <div className={cn(
                  "p-3 rounded-lg",
                  change >= 0 ? "bg-green-50" : "bg-red-50"
                )}>
                  <div className="flex justify-between items-center">
                    <Text weight="semibold">
                      {change >= 0 ? 'Kembalian:' : 'Kurang:'}
                    </Text>
                    <Text weight="bold" className={cn(
                      "text-lg",
                      change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(Math.abs(change))}
                    </Text>
                  </div>
                </div>
              )}
              
              {change < 0 && (
                <MessageBar intent="error">
                  <MessageBarBody>
                    Jumlah pembayaran kurang dari total yang harus dibayar
                  </MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowPaymentDialog(false)}
              >
                Batal
              </Button>
              <Button
                appearance="primary"
                onClick={handlePayment}
                disabled={isProcessing || change < 0 || amountPaid === 0}
                icon={isProcessing ? <Spinner size="tiny" /> : <CheckmarkCircle24Filled />}
              >
                {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Success Transaction */}
      {currentTransaction && (
        <Dialog open={!!currentTransaction} onOpenChange={() => setCurrentTransaction(null)}>
          <DialogSurface className="max-w-md">
            <DialogBody>
              <DialogTitle className="text-center">
                <CheckmarkCircle24Filled className="text-green-600 w-8 h-8 mx-auto mb-2" />
                Transaksi Berhasil!
              </DialogTitle>
              <DialogContent className="space-y-4 text-center">
                <div className="space-y-2">
                  <Text weight="bold">No. Transaksi: {currentTransaction.id}</Text>
                  <Text>Total: {formatCurrency(currentTransaction.total)}</Text>
                  <Text>Dibayar: {formatCurrency(currentTransaction.amountPaid)}</Text>
                  <Text>Kembalian: {formatCurrency(currentTransaction.change)}</Text>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <Text className="text-green-800">
                    Struk sedang dicetak...
                  </Text>
                </div>
              </DialogContent>
              <DialogActions className="justify-center">
                <Button
                  appearance="primary"
                  icon={<Receipt24Regular />}
                  onClick={() => {
                    setCurrentTransaction(null);
                    toast.success('Struk berhasil dicetak');
                  }}
                >
                  Cetak Ulang Struk
                </Button>
                <Button
                  appearance="secondary"
                  onClick={() => setCurrentTransaction(null)}
                >
                  Tutup
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}

// ======================================================================
// EXPORT DENGAN PROTEKSI
// ======================================================================

export default function POSPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked');
  };

  return (
    <ProtectedRoute requiredPermissions={['pos.create', 'pos.read']}>
      <MainLayout
        user={{
          id: 'user1',
          name: 'Admin Kasir',
          email: 'admin@kasir.com',
          role: 'Kasir'
        }}
        shift={{
          id: 'shift1',
          number: 'SH-001',
          startTime: new Date(),
          cashier: 'Admin Kasir',
          status: 'active'
        }}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        onThemeToggle={handleThemeToggle}
        isDarkMode={false}
      >
        <POSPageContent />
      </MainLayout>
    </ProtectedRoute>
  );
}