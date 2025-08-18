// ======================================================================
// USE POS HOOK
// React hook untuk mengelola state POS
// ======================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  posService, 
  transactionService, 
  paymentService,
  type Product, 
  type CartItem, 
  type Customer, 
  type Transaction,
  type PaymentSplit,
  type TransactionSummary
} from '../services';

// ======================================================================
// TYPES
// ======================================================================

export interface POSState {
  // Current transaction
  currentTransaction: Transaction | null;
  
  // Cart
  cartItems: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  
  // Customer
  selectedCustomer: Customer | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Dialogs
  showPaymentDialog: boolean;
  showProductSearch: boolean;
  showBarcodeScanner: boolean;
  showCustomerSelector: boolean;
  
  // Payment
  paymentSplit: PaymentSplit | null;
  transactionSummary: TransactionSummary | null;
}

export interface POSActions {
  // Transaction management
  startNewTransaction: () => void;
  completeTransaction: () => Promise<boolean>;
  cancelTransaction: () => void;
  
  // Cart management
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  
  // Customer management
  selectCustomer: (customer: Customer | null) => void;
  
  // Product operations
  scanBarcode: (barcode: string) => Promise<boolean>;
  searchProduct: (query: string) => Product[];
  
  // Payment operations
  startPayment: () => void;
  addPayment: (methodId: string, amount: number, reference?: string) => Promise<boolean>;
  completePayment: () => Promise<boolean>;
  
  // UI operations
  setShowPaymentDialog: (show: boolean) => void;
  setShowProductSearch: (show: boolean) => void;
  setShowBarcodeScanner: (show: boolean) => void;
  setShowCustomerSelector: (show: boolean) => void;
  
  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

// ======================================================================
// HOOK IMPLEMENTATION
// ======================================================================

export function usePOS(cashierId: string, cashierName: string, shiftId?: string) {
  // ======================================================================
  // STATE
  // ======================================================================
  
  const [state, setState] = useState<POSState>({
    currentTransaction: null,
    cartItems: [],
    cartTotal: 0,
    cartItemCount: 0,
    selectedCustomer: null,
    isLoading: false,
    error: null,
    showPaymentDialog: false,
    showProductSearch: false,
    showBarcodeScanner: false,
    showCustomerSelector: false,
    paymentSplit: null,
    transactionSummary: null
  });

  // Refs for stable references
  const stateRef = useRef(state);
  stateRef.current = state;

  // ======================================================================
  // UTILITY FUNCTIONS
  // ======================================================================

  const updateState = useCallback((updates: Partial<POSState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // ======================================================================
  // CART CALCULATIONS
  // ======================================================================

  const calculateCartTotals = useCallback((items: CartItem[]) => {
    const cartTotal = posService.calculateCartTotal(items);
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { cartTotal, cartItemCount };
  }, []);

  const updateCartTotals = useCallback((items: CartItem[]) => {
    const { cartTotal, cartItemCount } = calculateCartTotals(items);
    updateState({ cartItems: items, cartTotal, cartItemCount });
  }, [calculateCartTotals, updateState]);

  // ======================================================================
  // TRANSACTION MANAGEMENT
  // ======================================================================

  const startNewTransaction = useCallback(() => {
    try {
      const transaction = transactionService.createTransaction(
        cashierId,
        cashierName,
        state.selectedCustomer?.id,
        shiftId
      );

      updateState({
        currentTransaction: transaction,
        cartItems: [],
        cartTotal: 0,
        cartItemCount: 0,
        paymentSplit: null,
        transactionSummary: null,
        error: null
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal membuat transaksi baru');
    }
  }, [cashierId, cashierName, shiftId, state.selectedCustomer?.id, updateState, setError]);

  const completeTransaction = useCallback(async (): Promise<boolean> => {
    if (!state.currentTransaction) {
      setError('Tidak ada transaksi aktif');
      return false;
    }

    if (state.cartItems.length === 0) {
      setError('Keranjang kosong');
      return false;
    }

    if (!state.paymentSplit?.isComplete) {
      setError('Pembayaran belum lengkap');
      return false;
    }

    try {
      setLoading(true);

      // Process split payment
      const result = await transactionService.processSplitPayment(
        state.currentTransaction.id,
        state.paymentSplit
      );

      if (!result.success) {
        setError(result.error || 'Gagal menyelesaikan transaksi');
        return false;
      }

      // Reset state for new transaction
      updateState({
        currentTransaction: null,
        cartItems: [],
        cartTotal: 0,
        cartItemCount: 0,
        paymentSplit: null,
        transactionSummary: null,
        showPaymentDialog: false
      });

      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal menyelesaikan transaksi');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.currentTransaction, state.cartItems, state.paymentSplit, setLoading, setError, updateState]);

  const cancelTransaction = useCallback(() => {
    if (!state.currentTransaction) return;

    try {
      transactionService.cancelTransaction(state.currentTransaction.id, 'Dibatalkan oleh kasir');
      
      updateState({
        currentTransaction: null,
        cartItems: [],
        cartTotal: 0,
        cartItemCount: 0,
        paymentSplit: null,
        transactionSummary: null,
        showPaymentDialog: false
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal membatalkan transaksi');
    }
  }, [state.currentTransaction, updateState, setError]);

  // ======================================================================
  // CART MANAGEMENT
  // ======================================================================

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    try {
      const updatedCart = posService.addToCart(state.cartItems, product, quantity);
      updateCartTotals(updatedCart);

      // Add to transaction if exists
      if (state.currentTransaction) {
        const cartItem = updatedCart.find(item => item.productId === product.id);
        if (cartItem) {
          transactionService.addItemToTransaction(
            state.currentTransaction.id,
            cartItem,
            product
          );
        }
      }

      clearError();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal menambah produk ke keranjang');
    }
  }, [state.cartItems, state.currentTransaction, updateCartTotals, clearError, setError]);

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    try {
      const updatedCart = posService.updateCartItem(state.cartItems, itemId, updates);
      updateCartTotals(updatedCart);

      // Update in transaction if exists
      if (state.currentTransaction) {
        const updatedItem = updatedCart.find(item => item.id === itemId);
        if (updatedItem) {
          transactionService.updateTransactionItem(
            state.currentTransaction.id,
            itemId,
            updates as any
          );
        }
      }

      clearError();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memperbarui item keranjang');
    }
  }, [state.cartItems, state.currentTransaction, updateCartTotals, clearError, setError]);

  const removeFromCart = useCallback((itemId: string) => {
    try {
      const updatedCart = posService.removeFromCart(state.cartItems, itemId);
      updateCartTotals(updatedCart);

      // Remove from transaction if exists
      if (state.currentTransaction) {
        transactionService.removeItemFromTransaction(state.currentTransaction.id, itemId);
      }

      clearError();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal menghapus item dari keranjang');
    }
  }, [state.cartItems, state.currentTransaction, updateCartTotals, clearError, setError]);

  const clearCart = useCallback(() => {
    updateCartTotals([]);
    clearError();
  }, [updateCartTotals, clearError]);

  // ======================================================================
  // CUSTOMER MANAGEMENT
  // ======================================================================

  const selectCustomer = useCallback((customer: Customer | null) => {
    updateState({ selectedCustomer: customer });
    
    // Update transaction if exists
    if (state.currentTransaction && customer) {
      transactionService.updateTransaction(state.currentTransaction.id, {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email
      });
    }
  }, [state.currentTransaction, updateState]);

  // ======================================================================
  // PRODUCT OPERATIONS
  // ======================================================================

  const scanBarcode = useCallback(async (barcode: string): Promise<boolean> => {
    try {
      setLoading(true);
      const product = posService.findProductByBarcode(barcode);
      
      if (product) {
        addToCart(product);
        return true;
      } else {
        setError(`Produk dengan barcode ${barcode} tidak ditemukan`);
        return false;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memindai barcode');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToCart, setLoading, setError]);

  const searchProduct = useCallback((query: string): Product[] => {
    return posService.searchProducts(query);
  }, []);

  // ======================================================================
  // PAYMENT OPERATIONS
  // ======================================================================

  const startPayment = useCallback(() => {
    if (state.cartItems.length === 0) {
      setError('Keranjang kosong');
      return;
    }

    // Calculate transaction summary
    const summary = transactionService.calculateTransactionSummary(
      state.currentTransaction!,
      state.selectedCustomer || undefined
    );

    // Create payment split
    const paymentSplit = paymentService.createPaymentSplit(summary.finalAmount);

    updateState({
      transactionSummary: summary,
      paymentSplit,
      showPaymentDialog: true
    });
  }, [state.cartItems, state.currentTransaction, state.selectedCustomer, updateState, setError]);

  const addPayment = useCallback(async (
    methodId: string, 
    amount: number, 
    reference?: string
  ): Promise<boolean> => {
    if (!state.paymentSplit) {
      setError('Tidak ada split pembayaran aktif');
      return false;
    }

    try {
      setLoading(true);
      
      const result = await paymentService.addPaymentToSplit(
        state.paymentSplit,
        methodId,
        amount,
        reference
      );

      if (result.success) {
        updateState({ paymentSplit: result.split });
        clearError();
        return true;
      } else {
        setError(result.error || 'Gagal menambah pembayaran');
        return false;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memproses pembayaran');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.paymentSplit, setLoading, updateState, clearError, setError]);

  const completePayment = useCallback(async (): Promise<boolean> => {
    if (!state.paymentSplit?.isComplete) {
      setError('Pembayaran belum lengkap');
      return false;
    }

    return await completeTransaction();
  }, [state.paymentSplit, completeTransaction, setError]);

  // ======================================================================
  // UI OPERATIONS
  // ======================================================================

  const setShowPaymentDialog = useCallback((show: boolean) => {
    updateState({ showPaymentDialog: show });
  }, [updateState]);

  const setShowProductSearch = useCallback((show: boolean) => {
    updateState({ showProductSearch: show });
  }, [updateState]);

  const setShowBarcodeScanner = useCallback((show: boolean) => {
    updateState({ showBarcodeScanner: show });
  }, [updateState]);

  const setShowCustomerSelector = useCallback((show: boolean) => {
    updateState({ showCustomerSelector: show });
  }, [updateState]);

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Auto-start transaction on mount
  useEffect(() => {
    if (!state.currentTransaction) {
      startNewTransaction();
    }
  }, [state.currentTransaction, startNewTransaction]);

  // ======================================================================
  // RETURN
  // ======================================================================

  const actions: POSActions = {
    // Transaction management
    startNewTransaction,
    completeTransaction,
    cancelTransaction,
    
    // Cart management
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    
    // Customer management
    selectCustomer,
    
    // Product operations
    scanBarcode,
    searchProduct,
    
    // Payment operations
    startPayment,
    addPayment,
    completePayment,
    
    // UI operations
    setShowPaymentDialog,
    setShowProductSearch,
    setShowBarcodeScanner,
    setShowCustomerSelector,
    
    // Error handling
    clearError,
    setError
  };

  return {
    state,
    actions
  };
}

export type UsePOSReturn = ReturnType<typeof usePOS>;