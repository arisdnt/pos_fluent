// ======================================================================
// USE SHIFT MANAGEMENT HOOK
// React hook untuk mengelola shift kasir
// ======================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  paymentService,
  transactionService,
  type CashDrawer,
  type CashDenomination,
  type CashCount,
  type Transaction,
  type TransactionSummary
} from '../services';

// ======================================================================
// TYPES
// ======================================================================

export interface Shift {
  id: string;
  kasirId: string;
  kasirNama: string;
  tanggalMulai: Date;
  tanggalSelesai?: Date;
  kasAwal: number;
  kasAkhir?: number;
  totalTransaksi: number;
  totalPenjualan: number;
  jumlahTransaksi: number;
  status: 'aktif' | 'selesai';
  catatan?: string;
  
  // Detail kas
  kasAwalDetail: CashCount;
  kasAkhirDetail?: CashCount;
  
  // Ringkasan pembayaran
  ringkasanPembayaran: {
    tunai: number;
    kartu: number;
    digital: number;
    kredit: number;
    voucher: number;
  };
  
  // Transaksi
  transaksi: Transaction[];
}

export interface ShiftSummary {
  totalKasAwal: number;
  totalKasAkhir: number;
  totalPenjualan: number;
  totalTransaksi: number;
  jumlahTransaksi: number;
  selisihKas: number;
  
  // Breakdown pembayaran
  pembayaranTunai: number;
  pembayaranKartu: number;
  pembayaranDigital: number;
  pembayaranKredit: number;
  pembayaranVoucher: number;
  
  // Statistik
  transaksiPerJam: number;
  rataRataTransaksi: number;
  transaksiTerbesar: number;
  transaksiTerkecil: number;
}

export interface ShiftManagementState {
  // Current shift
  currentShift: Shift | null;
  isShiftActive: boolean;
  
  // Cash drawer
  cashDrawer: CashDrawer;
  denominations: CashDenomination[];
  
  // Shift history
  shiftHistory: Shift[];
  
  // Summary
  shiftSummary: ShiftSummary | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Dialogs
  showOpenShiftDialog: boolean;
  showCloseShiftDialog: boolean;
  showCashCountDialog: boolean;
  showShiftReportDialog: boolean;
}

export interface ShiftManagementActions {
  // Shift operations
  openShift: (kasirId: string, kasirNama: string, kasAwal: CashCount, catatan?: string) => Promise<boolean>;
  closeShift: (kasAkhir: CashCount, catatan?: string) => Promise<boolean>;
  
  // Cash drawer
  openCashDrawer: () => Promise<boolean>;
  closeCashDrawer: () => Promise<boolean>;
  countCash: () => Promise<CashCount>;
  updateCashCount: (count: CashCount) => void;
  
  // Transactions
  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (transactionId: string) => void;
  
  // History
  loadShiftHistory: (startDate?: Date, endDate?: Date) => Promise<void>;
  getShiftById: (shiftId: string) => Shift | null;
  
  // Reports
  generateShiftReport: (shiftId?: string) => ShiftSummary;
  exportShiftReport: (shiftId: string, format: 'pdf' | 'excel') => Promise<boolean>;
  
  // UI actions
  showOpenShiftDialog: () => void;
  hideOpenShiftDialog: () => void;
  showCloseShiftDialog: () => void;
  hideCloseShiftDialog: () => void;
  showCashCountDialog: () => void;
  hideCashCountDialog: () => void;
  showShiftReportDialog: () => void;
  hideShiftReportDialog: () => void;
  
  // Error handling
  clearError: () => void;
}

export interface ShiftManagementCallbacks {
  onShiftOpened?: (shift: Shift) => void;
  onShiftClosed?: (shift: Shift) => void;
  onTransactionAdded?: (transaction: Transaction) => void;
  onCashDrawerOpened?: () => void;
  onCashDrawerClosed?: () => void;
  onError?: (error: string) => void;
}

// ======================================================================
// HOOK IMPLEMENTATION
// ======================================================================

export function useShiftManagement(callbacks?: ShiftManagementCallbacks) {
  // ======================================================================
  // STATE
  // ======================================================================
  
  const [state, setState] = useState<ShiftManagementState>({
    currentShift: null,
    isShiftActive: false,
    cashDrawer: {
      isOpen: false,
      lastOpened: null,
      lastClosed: null,
      currentCount: {
        total: 0,
        denominations: {}
      }
    },
    denominations: [
      { value: 100000, label: 'Rp 100.000', type: 'banknote' },
      { value: 50000, label: 'Rp 50.000', type: 'banknote' },
      { value: 20000, label: 'Rp 20.000', type: 'banknote' },
      { value: 10000, label: 'Rp 10.000', type: 'banknote' },
      { value: 5000, label: 'Rp 5.000', type: 'banknote' },
      { value: 2000, label: 'Rp 2.000', type: 'banknote' },
      { value: 1000, label: 'Rp 1.000', type: 'banknote' },
      { value: 1000, label: 'Rp 1.000 (koin)', type: 'coin' },
      { value: 500, label: 'Rp 500', type: 'coin' },
      { value: 200, label: 'Rp 200', type: 'coin' },
      { value: 100, label: 'Rp 100', type: 'coin' },
      { value: 50, label: 'Rp 50', type: 'coin' }
    ],
    shiftHistory: [],
    shiftSummary: null,
    isLoading: false,
    error: null,
    showOpenShiftDialog: false,
    showCloseShiftDialog: false,
    showCashCountDialog: false,
    showShiftReportDialog: false
  });

  // Refs for stable references
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  stateRef.current = state;
  callbacksRef.current = callbacks;

  // ======================================================================
  // UTILITY FUNCTIONS
  // ======================================================================

  const updateState = useCallback((updates: Partial<ShiftManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
    if (error && callbacksRef.current?.onError) {
      callbacksRef.current.onError(error);
    }
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const generateId = useCallback(() => {
    return `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // ======================================================================
  // CASH CALCULATIONS
  // ======================================================================

  const calculateCashTotal = useCallback((count: CashCount): number => {
    return Object.entries(count.denominations).reduce((total, [value, quantity]) => {
      return total + (parseInt(value) * quantity);
    }, 0);
  }, []);

  const createEmptyCashCount = useCallback((): CashCount => {
    const denominations: Record<string, number> = {};
    state.denominations.forEach(denom => {
      denominations[denom.value.toString()] = 0;
    });
    
    return {
      total: 0,
      denominations,
      countedAt: new Date(),
      countedBy: 'system'
    };
  }, [state.denominations]);

  // ======================================================================
  // SHIFT OPERATIONS
  // ======================================================================

  const openShift = useCallback(async (
    kasirId: string, 
    kasirNama: string, 
    kasAwal: CashCount, 
    catatan?: string
  ): Promise<boolean> => {
    if (state.currentShift) {
      setError('Shift sudah aktif. Tutup shift terlebih dahulu.');
      return false;
    }

    try {
      setLoading(true);
      clearError();

      // Calculate total kas awal
      const totalKasAwal = calculateCashTotal(kasAwal);

      // Create new shift
      const newShift: Shift = {
        id: generateId(),
        kasirId,
        kasirNama,
        tanggalMulai: new Date(),
        kasAwal: totalKasAwal,
        totalTransaksi: 0,
        totalPenjualan: 0,
        jumlahTransaksi: 0,
        status: 'aktif',
        catatan,
        kasAwalDetail: kasAwal,
        ringkasanPembayaran: {
          tunai: 0,
          kartu: 0,
          digital: 0,
          kredit: 0,
          voucher: 0
        },
        transaksi: []
      };

      // Open cash drawer
      await paymentService.openCashDrawer();

      // Update state
      updateState({
        currentShift: newShift,
        isShiftActive: true,
        cashDrawer: {
          ...state.cashDrawer,
          isOpen: true,
          lastOpened: new Date(),
          currentCount: kasAwal
        }
      });

      // Callback
      if (callbacksRef.current?.onShiftOpened) {
        callbacksRef.current.onShiftOpened(newShift);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuka shift';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    state.currentShift,
    state.cashDrawer,
    setLoading,
    clearError,
    setError,
    calculateCashTotal,
    generateId,
    updateState
  ]);

  const closeShift = useCallback(async (
    kasAkhir: CashCount, 
    catatan?: string
  ): Promise<boolean> => {
    if (!state.currentShift) {
      setError('Tidak ada shift yang aktif');
      return false;
    }

    try {
      setLoading(true);
      clearError();

      // Calculate total kas akhir
      const totalKasAkhir = calculateCashTotal(kasAkhir);

      // Update shift
      const updatedShift: Shift = {
        ...state.currentShift,
        tanggalSelesai: new Date(),
        kasAkhir: totalKasAkhir,
        kasAkhirDetail: kasAkhir,
        status: 'selesai',
        catatan: catatan || state.currentShift.catatan
      };

      // Close cash drawer
      await paymentService.closeCashDrawer();

      // Add to history
      const updatedHistory = [updatedShift, ...state.shiftHistory];

      // Update state
      updateState({
        currentShift: null,
        isShiftActive: false,
        shiftHistory: updatedHistory,
        cashDrawer: {
          ...state.cashDrawer,
          isOpen: false,
          lastClosed: new Date(),
          currentCount: kasAkhir
        }
      });

      // Callback
      if (callbacksRef.current?.onShiftClosed) {
        callbacksRef.current.onShiftClosed(updatedShift);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menutup shift';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    state.currentShift,
    state.shiftHistory,
    state.cashDrawer,
    setLoading,
    clearError,
    setError,
    calculateCashTotal,
    updateState
  ]);

  // ======================================================================
  // CASH DRAWER OPERATIONS
  // ======================================================================

  const openCashDrawer = useCallback(async (): Promise<boolean> => {
    try {
      const success = await paymentService.openCashDrawer();
      if (success) {
        updateState({
          cashDrawer: {
            ...state.cashDrawer,
            isOpen: true,
            lastOpened: new Date()
          }
        });

        if (callbacksRef.current?.onCashDrawerOpened) {
          callbacksRef.current.onCashDrawerOpened();
        }
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuka laci kas';
      setError(errorMessage);
      return false;
    }
  }, [state.cashDrawer, updateState, setError]);

  const closeCashDrawer = useCallback(async (): Promise<boolean> => {
    try {
      const success = await paymentService.closeCashDrawer();
      if (success) {
        updateState({
          cashDrawer: {
            ...state.cashDrawer,
            isOpen: false,
            lastClosed: new Date()
          }
        });

        if (callbacksRef.current?.onCashDrawerClosed) {
          callbacksRef.current.onCashDrawerClosed();
        }
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menutup laci kas';
      setError(errorMessage);
      return false;
    }
  }, [state.cashDrawer, updateState, setError]);

  const countCash = useCallback(async (): Promise<CashCount> => {
    try {
      const count = await paymentService.countCash();
      updateState({
        cashDrawer: {
          ...state.cashDrawer,
          currentCount: count
        }
      });
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghitung kas';
      setError(errorMessage);
      return createEmptyCashCount();
    }
  }, [state.cashDrawer, updateState, setError, createEmptyCashCount]);

  const updateCashCount = useCallback((count: CashCount) => {
    updateState({
      cashDrawer: {
        ...state.cashDrawer,
        currentCount: count
      }
    });
  }, [state.cashDrawer, updateState]);

  // ======================================================================
  // TRANSACTION MANAGEMENT
  // ======================================================================

  const addTransaction = useCallback((transaction: Transaction) => {
    if (!state.currentShift) return;

    // Update shift with new transaction
    const updatedShift: Shift = {
      ...state.currentShift,
      transaksi: [...state.currentShift.transaksi, transaction],
      totalTransaksi: state.currentShift.totalTransaksi + transaction.total,
      totalPenjualan: state.currentShift.totalPenjualan + transaction.subtotal,
      jumlahTransaksi: state.currentShift.jumlahTransaksi + 1
    };

    // Update payment summary
    transaction.pembayaran.forEach(payment => {
      switch (payment.metode.tipe) {
        case 'tunai':
          updatedShift.ringkasanPembayaran.tunai += payment.jumlah;
          break;
        case 'kartu':
          updatedShift.ringkasanPembayaran.kartu += payment.jumlah;
          break;
        case 'digital':
          updatedShift.ringkasanPembayaran.digital += payment.jumlah;
          break;
        case 'kredit':
          updatedShift.ringkasanPembayaran.kredit += payment.jumlah;
          break;
        case 'voucher':
          updatedShift.ringkasanPembayaran.voucher += payment.jumlah;
          break;
      }
    });

    updateState({ currentShift: updatedShift });

    if (callbacksRef.current?.onTransactionAdded) {
      callbacksRef.current.onTransactionAdded(transaction);
    }
  }, [state.currentShift, updateState]);

  const removeTransaction = useCallback((transactionId: string) => {
    if (!state.currentShift) return;

    const transaction = state.currentShift.transaksi.find(t => t.id === transactionId);
    if (!transaction) return;

    // Update shift by removing transaction
    const updatedTransaksi = state.currentShift.transaksi.filter(t => t.id !== transactionId);
    const updatedShift: Shift = {
      ...state.currentShift,
      transaksi: updatedTransaksi,
      totalTransaksi: state.currentShift.totalTransaksi - transaction.total,
      totalPenjualan: state.currentShift.totalPenjualan - transaction.subtotal,
      jumlahTransaksi: state.currentShift.jumlahTransaksi - 1
    };

    // Update payment summary
    transaction.pembayaran.forEach(payment => {
      switch (payment.metode.tipe) {
        case 'tunai':
          updatedShift.ringkasanPembayaran.tunai -= payment.jumlah;
          break;
        case 'kartu':
          updatedShift.ringkasanPembayaran.kartu -= payment.jumlah;
          break;
        case 'digital':
          updatedShift.ringkasanPembayaran.digital -= payment.jumlah;
          break;
        case 'kredit':
          updatedShift.ringkasanPembayaran.kredit -= payment.jumlah;
          break;
        case 'voucher':
          updatedShift.ringkasanPembayaran.voucher -= payment.jumlah;
          break;
      }
    });

    updateState({ currentShift: updatedShift });
  }, [state.currentShift, updateState]);

  // ======================================================================
  // HISTORY AND REPORTS
  // ======================================================================

  const loadShiftHistory = useCallback(async (startDate?: Date, endDate?: Date): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      // In real implementation, this would fetch from API
      // For now, we'll use the current history
      const history = state.shiftHistory.filter(shift => {
        if (!startDate && !endDate) return true;
        
        const shiftDate = shift.tanggalMulai;
        if (startDate && shiftDate < startDate) return false;
        if (endDate && shiftDate > endDate) return false;
        
        return true;
      });

      updateState({ shiftHistory: history });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat riwayat shift';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.shiftHistory, setLoading, clearError, setError, updateState]);

  const getShiftById = useCallback((shiftId: string): Shift | null => {
    if (state.currentShift?.id === shiftId) {
      return state.currentShift;
    }
    return state.shiftHistory.find(shift => shift.id === shiftId) || null;
  }, [state.currentShift, state.shiftHistory]);

  const generateShiftReport = useCallback((shiftId?: string): ShiftSummary => {
    const shift = shiftId ? getShiftById(shiftId) : state.currentShift;
    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    const totalKasAwal = shift.kasAwal;
    const totalKasAkhir = shift.kasAkhir || 0;
    const selisihKas = totalKasAkhir - totalKasAwal - shift.ringkasanPembayaran.tunai;

    // Calculate statistics
    const transaksiValues = shift.transaksi.map(t => t.total);
    const rataRataTransaksi = transaksiValues.length > 0 
      ? transaksiValues.reduce((sum, val) => sum + val, 0) / transaksiValues.length 
      : 0;
    const transaksiTerbesar = transaksiValues.length > 0 ? Math.max(...transaksiValues) : 0;
    const transaksiTerkecil = transaksiValues.length > 0 ? Math.min(...transaksiValues) : 0;

    // Calculate transactions per hour
    const durasiShift = shift.tanggalSelesai 
      ? (shift.tanggalSelesai.getTime() - shift.tanggalMulai.getTime()) / (1000 * 60 * 60)
      : 0;
    const transaksiPerJam = durasiShift > 0 ? shift.jumlahTransaksi / durasiShift : 0;

    const summary: ShiftSummary = {
      totalKasAwal,
      totalKasAkhir,
      totalPenjualan: shift.totalPenjualan,
      totalTransaksi: shift.totalTransaksi,
      jumlahTransaksi: shift.jumlahTransaksi,
      selisihKas,
      pembayaranTunai: shift.ringkasanPembayaran.tunai,
      pembayaranKartu: shift.ringkasanPembayaran.kartu,
      pembayaranDigital: shift.ringkasanPembayaran.digital,
      pembayaranKredit: shift.ringkasanPembayaran.kredit,
      pembayaranVoucher: shift.ringkasanPembayaran.voucher,
      transaksiPerJam,
      rataRataTransaksi,
      transaksiTerbesar,
      transaksiTerkecil
    };

    updateState({ shiftSummary: summary });
    return summary;
  }, [getShiftById, state.currentShift, updateState]);

  const exportShiftReport = useCallback(async (
    shiftId: string, 
    format: 'pdf' | 'excel'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const shift = getShiftById(shiftId);
      if (!shift) {
        setError('Shift tidak ditemukan');
        return false;
      }

      const summary = generateShiftReport(shiftId);

      // In real implementation, this would generate and download the report
      console.log(`Exporting shift report for ${shiftId} as ${format}`, { shift, summary });

      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengekspor laporan';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getShiftById, generateShiftReport, setLoading, clearError, setError]);

  // ======================================================================
  // UI ACTIONS
  // ======================================================================

  const showOpenShiftDialog = useCallback(() => {
    updateState({ showOpenShiftDialog: true });
  }, [updateState]);

  const hideOpenShiftDialog = useCallback(() => {
    updateState({ showOpenShiftDialog: false });
  }, [updateState]);

  const showCloseShiftDialog = useCallback(() => {
    updateState({ showCloseShiftDialog: true });
  }, [updateState]);

  const hideCloseShiftDialog = useCallback(() => {
    updateState({ showCloseShiftDialog: false });
  }, [updateState]);

  const showCashCountDialog = useCallback(() => {
    updateState({ showCashCountDialog: true });
  }, [updateState]);

  const hideCashCountDialog = useCallback(() => {
    updateState({ showCashCountDialog: false });
  }, [updateState]);

  const showShiftReportDialog = useCallback(() => {
    updateState({ showShiftReportDialog: true });
  }, [updateState]);

  const hideShiftReportDialog = useCallback(() => {
    updateState({ showShiftReportDialog: false });
  }, [updateState]);

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Load initial data
  useEffect(() => {
    loadShiftHistory();
  }, [loadShiftHistory]);

  // ======================================================================
  // RETURN
  // ======================================================================

  const actions: ShiftManagementActions = {
    // Shift operations
    openShift,
    closeShift,
    
    // Cash drawer
    openCashDrawer,
    closeCashDrawer,
    countCash,
    updateCashCount,
    
    // Transactions
    addTransaction,
    removeTransaction,
    
    // History
    loadShiftHistory,
    getShiftById,
    
    // Reports
    generateShiftReport,
    exportShiftReport,
    
    // UI actions
    showOpenShiftDialog,
    hideOpenShiftDialog,
    showCloseShiftDialog,
    hideCloseShiftDialog,
    showCashCountDialog,
    hideCashCountDialog,
    showShiftReportDialog,
    hideShiftReportDialog,
    
    // Error handling
    clearError
  };

  return {
    state,
    actions
  };
}

export type UseShiftManagementReturn = ReturnType<typeof useShiftManagement>;