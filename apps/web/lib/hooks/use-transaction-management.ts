// ======================================================================
// USE TRANSACTION MANAGEMENT HOOK
// React hook untuk mengelola transaksi dan riwayat
// ======================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  transactionService,
  type Transaction,
  type TransactionItem,
  type TransactionSummary,
  type TransactionFilter,
  type TransactionStats,
  type RefundRequest,
  type VoidRequest
} from '../services';

// ======================================================================
// TYPES
// ======================================================================

export interface TransactionManagementState {
  // Transactions
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedTransaction: Transaction | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  
  // Filters
  filters: TransactionFilter;
  searchQuery: string;
  sortBy: keyof Transaction;
  sortOrder: 'asc' | 'desc';
  
  // Statistics
  stats: TransactionStats | null;
  summary: TransactionSummary | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Dialogs
  showTransactionDetail: boolean;
  showRefundDialog: boolean;
  showVoidDialog: boolean;
  showExportDialog: boolean;
  
  // Selection
  selectedTransactionIds: string[];
  isMultiSelectMode: boolean;
}

export interface TransactionManagementActions {
  // Transaction operations
  loadTransactions: (filters?: Partial<TransactionFilter>) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | null;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<TransactionFilter>) => void;
  clearFilters: () => void;
  
  // Sorting
  setSorting: (sortBy: keyof Transaction, sortOrder?: 'asc' | 'desc') => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  
  // Transaction actions
  refundTransaction: (transactionId: string, request: RefundRequest) => Promise<boolean>;
  voidTransaction: (transactionId: string, request: VoidRequest) => Promise<boolean>;
  printTransaction: (transactionId: string) => Promise<boolean>;
  
  // Export
  exportTransactions: (format: 'pdf' | 'excel', transactionIds?: string[]) => Promise<boolean>;
  
  // Selection
  selectTransaction: (transaction: Transaction) => void;
  selectTransactionById: (id: string) => void;
  toggleTransactionSelection: (id: string) => void;
  selectAllTransactions: () => void;
  clearSelection: () => void;
  toggleMultiSelectMode: () => void;
  
  // UI actions
  showTransactionDetail: (transaction: Transaction) => void;
  hideTransactionDetail: () => void;
  showRefundDialog: (transaction: Transaction) => void;
  hideRefundDialog: () => void;
  showVoidDialog: (transaction: Transaction) => void;
  hideVoidDialog: () => void;
  showExportDialog: () => void;
  hideExportDialog: () => void;
  
  // Statistics
  calculateStats: (transactions?: Transaction[]) => TransactionStats;
  generateSummary: (transactions?: Transaction[]) => TransactionSummary;
  
  // Error handling
  clearError: () => void;
}

export interface TransactionManagementCallbacks {
  onTransactionRefunded?: (transaction: Transaction) => void;
  onTransactionVoided?: (transaction: Transaction) => void;
  onTransactionPrinted?: (transaction: Transaction) => void;
  onTransactionsExported?: (format: string, count: number) => void;
  onError?: (error: string) => void;
}

// ======================================================================
// HOOK IMPLEMENTATION
// ======================================================================

export function useTransactionManagement(callbacks?: TransactionManagementCallbacks) {
  // ======================================================================
  // STATE
  // ======================================================================
  
  const [state, setState] = useState<TransactionManagementState>({
    transactions: [],
    filteredTransactions: [],
    selectedTransaction: null,
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    totalItems: 0,
    filters: {
      tanggalMulai: undefined,
      tanggalSelesai: undefined,
      status: undefined,
      kasirId: undefined,
      pelangganId: undefined,
      minTotal: undefined,
      maxTotal: undefined,
      metodePembayaran: undefined
    },
    searchQuery: '',
    sortBy: 'tanggal',
    sortOrder: 'desc',
    stats: null,
    summary: null,
    isLoading: false,
    error: null,
    showTransactionDetail: false,
    showRefundDialog: false,
    showVoidDialog: false,
    showExportDialog: false,
    selectedTransactionIds: [],
    isMultiSelectMode: false
  });

  // Refs for stable references
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  stateRef.current = state;
  callbacksRef.current = callbacks;

  // ======================================================================
  // UTILITY FUNCTIONS
  // ======================================================================

  const updateState = useCallback((updates: Partial<TransactionManagementState>) => {
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

  // ======================================================================
  // FILTERING AND SEARCHING
  // ======================================================================

  const applyFiltersAndSearch = useCallback((
    transactions: Transaction[],
    filters: TransactionFilter,
    searchQuery: string
  ): Transaction[] => {
    let filtered = [...transactions];

    // Apply filters
    if (filters.tanggalMulai) {
      filtered = filtered.filter(t => t.tanggal >= filters.tanggalMulai!);
    }
    
    if (filters.tanggalSelesai) {
      filtered = filtered.filter(t => t.tanggal <= filters.tanggalSelesai!);
    }
    
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    if (filters.kasirId) {
      filtered = filtered.filter(t => t.kasirId === filters.kasirId);
    }
    
    if (filters.pelangganId) {
      filtered = filtered.filter(t => t.pelangganId === filters.pelangganId);
    }
    
    if (filters.minTotal !== undefined) {
      filtered = filtered.filter(t => t.total >= filters.minTotal!);
    }
    
    if (filters.maxTotal !== undefined) {
      filtered = filtered.filter(t => t.total <= filters.maxTotal!);
    }
    
    if (filters.metodePembayaran) {
      filtered = filtered.filter(t => 
        t.pembayaran.some(p => p.metode.tipe === filters.metodePembayaran)
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(query) ||
        t.kasirNama.toLowerCase().includes(query) ||
        t.pelangganNama?.toLowerCase().includes(query) ||
        t.catatan?.toLowerCase().includes(query) ||
        t.items.some(item => 
          item.produk.nama.toLowerCase().includes(query) ||
          item.produk.kode.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, []);

  const applySorting = useCallback((
    transactions: Transaction[],
    sortBy: keyof Transaction,
    sortOrder: 'asc' | 'desc'
  ): Transaction[] => {
    return [...transactions].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      let comparison = 0;
      
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, []);

  const applyPagination = useCallback((
    transactions: Transaction[],
    page: number,
    pageSize: number
  ): { paginatedTransactions: Transaction[], totalPages: number } => {
    const totalPages = Math.ceil(transactions.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    return { paginatedTransactions, totalPages };
  }, []);

  // ======================================================================
  // TRANSACTION OPERATIONS
  // ======================================================================

  const loadTransactions = useCallback(async (filters?: Partial<TransactionFilter>): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      // Update filters if provided
      const updatedFilters = filters ? { ...state.filters, ...filters } : state.filters;

      // Load transactions from service
      const transactions = await transactionService.getTransactions(updatedFilters);

      // Apply filtering, searching, and sorting
      const filtered = applyFiltersAndSearch(transactions, updatedFilters, state.searchQuery);
      const sorted = applySorting(filtered, state.sortBy, state.sortOrder);

      // Apply pagination
      const { paginatedTransactions, totalPages } = applyPagination(
        sorted, 
        state.currentPage, 
        state.pageSize
      );

      updateState({
        transactions,
        filteredTransactions: paginatedTransactions,
        totalPages,
        totalItems: sorted.length,
        filters: updatedFilters
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat transaksi';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    state.filters,
    state.searchQuery,
    state.sortBy,
    state.sortOrder,
    state.currentPage,
    state.pageSize,
    setLoading,
    clearError,
    setError,
    applyFiltersAndSearch,
    applySorting,
    applyPagination,
    updateState
  ]);

  const refreshTransactions = useCallback(async (): Promise<void> => {
    await loadTransactions();
  }, [loadTransactions]);

  const getTransactionById = useCallback((id: string): Transaction | null => {
    return state.transactions.find(t => t.id === id) || null;
  }, [state.transactions]);

  // ======================================================================
  // SEARCH AND FILTER
  // ======================================================================

  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query, currentPage: 1 });
    
    // Apply search immediately
    const filtered = applyFiltersAndSearch(state.transactions, state.filters, query);
    const sorted = applySorting(filtered, state.sortBy, state.sortOrder);
    const { paginatedTransactions, totalPages } = applyPagination(sorted, 1, state.pageSize);

    updateState({
      filteredTransactions: paginatedTransactions,
      totalPages,
      totalItems: sorted.length
    });
  }, [
    updateState,
    state.transactions,
    state.filters,
    state.sortBy,
    state.sortOrder,
    state.pageSize,
    applyFiltersAndSearch,
    applySorting,
    applyPagination
  ]);

  const updateFilters = useCallback((newFilters: Partial<TransactionFilter>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    updateState({ filters: updatedFilters, currentPage: 1 });
    
    // Apply filters immediately
    const filtered = applyFiltersAndSearch(state.transactions, updatedFilters, state.searchQuery);
    const sorted = applySorting(filtered, state.sortBy, state.sortOrder);
    const { paginatedTransactions, totalPages } = applyPagination(sorted, 1, state.pageSize);

    updateState({
      filteredTransactions: paginatedTransactions,
      totalPages,
      totalItems: sorted.length
    });
  }, [
    state.filters,
    state.transactions,
    state.searchQuery,
    state.sortBy,
    state.sortOrder,
    state.pageSize,
    updateState,
    applyFiltersAndSearch,
    applySorting,
    applyPagination
  ]);

  const clearFilters = useCallback(() => {
    const emptyFilters: TransactionFilter = {
      tanggalMulai: undefined,
      tanggalSelesai: undefined,
      status: undefined,
      kasirId: undefined,
      pelangganId: undefined,
      minTotal: undefined,
      maxTotal: undefined,
      metodePembayaran: undefined
    };
    
    updateFilters(emptyFilters);
  }, [updateFilters]);

  // ======================================================================
  // SORTING
  // ======================================================================

  const setSorting = useCallback((sortBy: keyof Transaction, sortOrder?: 'asc' | 'desc') => {
    const newSortOrder = sortOrder || (state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc');
    
    updateState({ sortBy, sortOrder: newSortOrder, currentPage: 1 });
    
    // Apply sorting immediately
    const filtered = applyFiltersAndSearch(state.transactions, state.filters, state.searchQuery);
    const sorted = applySorting(filtered, sortBy, newSortOrder);
    const { paginatedTransactions, totalPages } = applyPagination(sorted, 1, state.pageSize);

    updateState({
      filteredTransactions: paginatedTransactions,
      totalPages,
      totalItems: sorted.length
    });
  }, [
    state.sortBy,
    state.sortOrder,
    state.transactions,
    state.filters,
    state.searchQuery,
    state.pageSize,
    updateState,
    applyFiltersAndSearch,
    applySorting,
    applyPagination
  ]);

  // ======================================================================
  // PAGINATION
  // ======================================================================

  const setPage = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return;
    
    updateState({ currentPage: page });
    
    // Apply pagination immediately
    const filtered = applyFiltersAndSearch(state.transactions, state.filters, state.searchQuery);
    const sorted = applySorting(filtered, state.sortBy, state.sortOrder);
    const { paginatedTransactions } = applyPagination(sorted, page, state.pageSize);

    updateState({ filteredTransactions: paginatedTransactions });
  }, [
    state.totalPages,
    state.transactions,
    state.filters,
    state.searchQuery,
    state.sortBy,
    state.sortOrder,
    state.pageSize,
    updateState,
    applyFiltersAndSearch,
    applySorting,
    applyPagination
  ]);

  const setPageSize = useCallback((size: number) => {
    updateState({ pageSize: size, currentPage: 1 });
    
    // Apply pagination immediately
    const filtered = applyFiltersAndSearch(state.transactions, state.filters, state.searchQuery);
    const sorted = applySorting(filtered, state.sortBy, state.sortOrder);
    const { paginatedTransactions, totalPages } = applyPagination(sorted, 1, size);

    updateState({
      filteredTransactions: paginatedTransactions,
      totalPages,
      currentPage: 1
    });
  }, [
    state.transactions,
    state.filters,
    state.searchQuery,
    state.sortBy,
    state.sortOrder,
    updateState,
    applyFiltersAndSearch,
    applySorting,
    applyPagination
  ]);

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);
  const goToLastPage = useCallback(() => setPage(state.totalPages), [setPage, state.totalPages]);
  const goToNextPage = useCallback(() => setPage(state.currentPage + 1), [setPage, state.currentPage]);
  const goToPreviousPage = useCallback(() => setPage(state.currentPage - 1), [setPage, state.currentPage]);

  // ======================================================================
  // TRANSACTION ACTIONS
  // ======================================================================

  const refundTransaction = useCallback(async (
    transactionId: string, 
    request: RefundRequest
  ): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const success = await transactionService.refundTransaction(transactionId, request);
      
      if (success) {
        // Refresh transactions to get updated data
        await refreshTransactions();
        
        const transaction = getTransactionById(transactionId);
        if (transaction && callbacksRef.current?.onTransactionRefunded) {
          callbacksRef.current.onTransactionRefunded(transaction);
        }
      }
      
      return success;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal melakukan refund';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setError, refreshTransactions, getTransactionById]);

  const voidTransaction = useCallback(async (
    transactionId: string, 
    request: VoidRequest
  ): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const success = await transactionService.voidTransaction(transactionId, request);
      
      if (success) {
        // Refresh transactions to get updated data
        await refreshTransactions();
        
        const transaction = getTransactionById(transactionId);
        if (transaction && callbacksRef.current?.onTransactionVoided) {
          callbacksRef.current.onTransactionVoided(transaction);
        }
      }
      
      return success;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal membatalkan transaksi';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setError, refreshTransactions, getTransactionById]);

  const printTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const transaction = getTransactionById(transactionId);
      if (!transaction) {
        setError('Transaksi tidak ditemukan');
        return false;
      }

      // In real implementation, this would send to printer
      console.log('Printing transaction:', transaction);
      
      // Simulate printing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (callbacksRef.current?.onTransactionPrinted) {
        callbacksRef.current.onTransactionPrinted(transaction);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mencetak transaksi';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, setError, getTransactionById]);

  // ======================================================================
  // EXPORT
  // ======================================================================

  const exportTransactions = useCallback(async (
    format: 'pdf' | 'excel', 
    transactionIds?: string[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const transactionsToExport = transactionIds 
        ? state.transactions.filter(t => transactionIds.includes(t.id))
        : state.filteredTransactions;

      if (transactionsToExport.length === 0) {
        setError('Tidak ada transaksi untuk diekspor');
        return false;
      }

      // In real implementation, this would generate and download the file
      console.log(`Exporting ${transactionsToExport.length} transactions as ${format}`);
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (callbacksRef.current?.onTransactionsExported) {
        callbacksRef.current.onTransactionsExported(format, transactionsToExport.length);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengekspor transaksi';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    state.transactions,
    state.filteredTransactions,
    setLoading,
    clearError,
    setError
  ]);

  // ======================================================================
  // SELECTION
  // ======================================================================

  const selectTransaction = useCallback((transaction: Transaction) => {
    updateState({ selectedTransaction: transaction });
  }, [updateState]);

  const selectTransactionById = useCallback((id: string) => {
    const transaction = getTransactionById(id);
    if (transaction) {
      selectTransaction(transaction);
    }
  }, [getTransactionById, selectTransaction]);

  const toggleTransactionSelection = useCallback((id: string) => {
    const isSelected = state.selectedTransactionIds.includes(id);
    const updatedSelection = isSelected
      ? state.selectedTransactionIds.filter(selectedId => selectedId !== id)
      : [...state.selectedTransactionIds, id];
    
    updateState({ selectedTransactionIds: updatedSelection });
  }, [state.selectedTransactionIds, updateState]);

  const selectAllTransactions = useCallback(() => {
    const allIds = state.filteredTransactions.map(t => t.id);
    updateState({ selectedTransactionIds: allIds });
  }, [state.filteredTransactions, updateState]);

  const clearSelection = useCallback(() => {
    updateState({ selectedTransactionIds: [], selectedTransaction: null });
  }, [updateState]);

  const toggleMultiSelectMode = useCallback(() => {
    const newMode = !state.isMultiSelectMode;
    updateState({ 
      isMultiSelectMode: newMode,
      selectedTransactionIds: newMode ? state.selectedTransactionIds : []
    });
  }, [state.isMultiSelectMode, state.selectedTransactionIds, updateState]);

  // ======================================================================
  // UI ACTIONS
  // ======================================================================

  const showTransactionDetail = useCallback((transaction: Transaction) => {
    updateState({ 
      selectedTransaction: transaction,
      showTransactionDetail: true 
    });
  }, [updateState]);

  const hideTransactionDetail = useCallback(() => {
    updateState({ showTransactionDetail: false });
  }, [updateState]);

  const showRefundDialog = useCallback((transaction: Transaction) => {
    updateState({ 
      selectedTransaction: transaction,
      showRefundDialog: true 
    });
  }, [updateState]);

  const hideRefundDialog = useCallback(() => {
    updateState({ showRefundDialog: false });
  }, [updateState]);

  const showVoidDialog = useCallback((transaction: Transaction) => {
    updateState({ 
      selectedTransaction: transaction,
      showVoidDialog: true 
    });
  }, [updateState]);

  const hideVoidDialog = useCallback(() => {
    updateState({ showVoidDialog: false });
  }, [updateState]);

  const showExportDialog = useCallback(() => {
    updateState({ showExportDialog: true });
  }, [updateState]);

  const hideExportDialog = useCallback(() => {
    updateState({ showExportDialog: false });
  }, [updateState]);

  // ======================================================================
  // STATISTICS
  // ======================================================================

  const calculateStats = useCallback((transactions?: Transaction[]): TransactionStats => {
    const data = transactions || state.transactions;
    
    if (data.length === 0) {
      return {
        totalTransaksi: 0,
        totalPenjualan: 0,
        rataRataTransaksi: 0,
        transaksiTerbesar: 0,
        transaksiTerkecil: 0,
        jumlahItem: 0,
        pelangganUnik: 0
      };
    }

    const totals = data.map(t => t.total);
    const totalPenjualan = totals.reduce((sum, total) => sum + total, 0);
    const rataRataTransaksi = totalPenjualan / data.length;
    const transaksiTerbesar = Math.max(...totals);
    const transaksiTerkecil = Math.min(...totals);
    const jumlahItem = data.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.kuantitas, 0), 0);
    const pelangganUnik = new Set(data.filter(t => t.pelangganId).map(t => t.pelangganId)).size;

    const stats: TransactionStats = {
      totalTransaksi: data.length,
      totalPenjualan,
      rataRataTransaksi,
      transaksiTerbesar,
      transaksiTerkecil,
      jumlahItem,
      pelangganUnik
    };

    updateState({ stats });
    return stats;
  }, [state.transactions, updateState]);

  const generateSummary = useCallback((transactions?: Transaction[]): TransactionSummary => {
    const data = transactions || state.transactions;
    
    const summary: TransactionSummary = {
      periode: {
        mulai: data.length > 0 ? new Date(Math.min(...data.map(t => t.tanggal.getTime()))) : new Date(),
        selesai: data.length > 0 ? new Date(Math.max(...data.map(t => t.tanggal.getTime()))) : new Date()
      },
      totalTransaksi: data.length,
      totalPenjualan: data.reduce((sum, t) => sum + t.total, 0),
      totalDiskon: data.reduce((sum, t) => sum + t.diskon, 0),
      totalPajak: data.reduce((sum, t) => sum + t.pajak, 0),
      
      // Group by status
      berdasarkanStatus: data.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Group by payment method
      berdasarkanPembayaran: data.reduce((acc, t) => {
        t.pembayaran.forEach(p => {
          acc[p.metode.tipe] = (acc[p.metode.tipe] || 0) + p.jumlah;
        });
        return acc;
      }, {} as Record<string, number>),
      
      // Group by cashier
      berdasarkanKasir: data.reduce((acc, t) => {
        acc[t.kasirNama] = (acc[t.kasirNama] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    updateState({ summary });
    return summary;
  }, [state.transactions, updateState]);

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Load initial data
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ======================================================================
  // RETURN
  // ======================================================================

  const actions: TransactionManagementActions = {
    // Transaction operations
    loadTransactions,
    refreshTransactions,
    getTransactionById,
    
    // Search and filter
    setSearchQuery,
    updateFilters,
    clearFilters,
    
    // Sorting
    setSorting,
    
    // Pagination
    setPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    
    // Transaction actions
    refundTransaction,
    voidTransaction,
    printTransaction,
    
    // Export
    exportTransactions,
    
    // Selection
    selectTransaction,
    selectTransactionById,
    toggleTransactionSelection,
    selectAllTransactions,
    clearSelection,
    toggleMultiSelectMode,
    
    // UI actions
    showTransactionDetail,
    hideTransactionDetail,
    showRefundDialog,
    hideRefundDialog,
    showVoidDialog,
    hideVoidDialog,
    showExportDialog,
    hideExportDialog,
    
    // Statistics
    calculateStats,
    generateSummary,
    
    // Error handling
    clearError
  };

  return {
    state,
    actions
  };
}

export type UseTransactionManagementReturn = ReturnType<typeof useTransactionManagement>;