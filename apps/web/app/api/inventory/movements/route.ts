// ======================================================================
// STOCK MOVEMENTS API ROUTE
// API endpoints untuk riwayat mutasi stok
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  branchId: string;
  branchName: string;
  movementType: 'in' | 'out' | 'adjust' | 'transfer_in' | 'transfer_out';
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const MovementQuerySchema = z.object({
  productId: z.string().optional(),
  branchId: z.string().optional(),
  movementType: z.enum(['in', 'out', 'adjust', 'transfer_in', 'transfer_out']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'productName', 'quantity', 'movementType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockStockMovements: StockMovement[] = [
  {
    id: 'movement_001',
    productId: 'prod_001',
    productName: 'Indomie Goreng',
    productSku: 'BRG001',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    movementType: 'in',
    quantity: 50,
    referenceType: 'purchase',
    referenceId: 'po_001',
    notes: 'Pembelian dari supplier ABC',
    createdBy: 'user_001',
    createdByName: 'Admin Gudang',
    createdAt: new Date('2024-01-15T08:30:00')
  },
  {
    id: 'movement_002',
    productId: 'prod_001',
    productName: 'Indomie Goreng',
    productSku: 'BRG001',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    movementType: 'out',
    quantity: -10,
    referenceType: 'pos_order',
    referenceId: 'order_001',
    notes: 'Penjualan POS',
    createdBy: 'user_002',
    createdByName: 'Kasir 1',
    createdAt: new Date('2024-01-16T10:15:00')
  },
  {
    id: 'movement_003',
    productId: 'prod_002',
    productName: 'Aqua 600ml',
    productSku: 'BRG002',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    movementType: 'adjust',
    quantity: 5,
    referenceType: 'adjustment',
    referenceId: 'adj_001',
    notes: 'Penyesuaian stok fisik',
    createdBy: 'user_001',
    createdByName: 'Admin Gudang',
    createdAt: new Date('2024-01-17T14:20:00')
  },
  {
    id: 'movement_004',
    productId: 'prod_003',
    productName: 'Beras Premium 5kg',
    productSku: 'BRG003',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    movementType: 'transfer_out',
    quantity: -10,
    referenceType: 'transfer',
    referenceId: 'tf_001',
    notes: 'Transfer ke cabang Bandung',
    createdBy: 'user_001',
    createdByName: 'Admin Gudang',
    createdAt: new Date('2024-01-18T09:45:00')
  },
  {
    id: 'movement_005',
    productId: 'prod_003',
    productName: 'Beras Premium 5kg',
    productSku: 'BRG003',
    branchId: 'branch_002',
    branchName: 'Toko Bandung',
    movementType: 'transfer_in',
    quantity: 10,
    referenceType: 'transfer',
    referenceId: 'tf_001',
    notes: 'Transfer dari cabang Jakarta',
    createdBy: 'user_001',
    createdByName: 'Admin Gudang',
    createdAt: new Date('2024-01-18T09:45:00')
  },
  {
    id: 'movement_006',
    productId: 'prod_001',
    productName: 'Indomie Goreng',
    productSku: 'BRG001',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    movementType: 'out',
    quantity: -5,
    referenceType: 'pos_order',
    referenceId: 'order_002',
    notes: 'Penjualan POS',
    createdBy: 'user_003',
    createdByName: 'Kasir 2',
    createdAt: new Date('2024-01-19T11:30:00')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function filterMovements(movements: StockMovement[], query: any): StockMovement[] {
  let filtered = [...movements];

  // Product filter
  if (query.productId) {
    filtered = filtered.filter(movement => movement.productId === query.productId);
  }

  // Branch filter
  if (query.branchId) {
    filtered = filtered.filter(movement => movement.branchId === query.branchId);
  }

  // Movement type filter
  if (query.movementType) {
    filtered = filtered.filter(movement => movement.movementType === query.movementType);
  }

  // Date range filter
  if (query.dateFrom) {
    const fromDate = new Date(query.dateFrom);
    filtered = filtered.filter(movement => movement.createdAt >= fromDate);
  }

  if (query.dateTo) {
    const toDate = new Date(query.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(movement => movement.createdAt <= toDate);
  }

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(movement => 
      movement.productName.toLowerCase().includes(searchTerm) ||
      movement.productSku.toLowerCase().includes(searchTerm) ||
      movement.branchName.toLowerCase().includes(searchTerm) ||
      movement.notes?.toLowerCase().includes(searchTerm) ||
      movement.createdByName?.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
}

function sortMovements(movements: StockMovement[], sortBy: string, sortOrder: string): StockMovement[] {
  return movements.sort((a, b) => {
    let aValue = a[sortBy as keyof StockMovement];
    let bValue = b[sortBy as keyof StockMovement];

    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
    if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

function paginateMovements(movements: StockMovement[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: movements.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: movements.length,
      totalPages: Math.ceil(movements.length / limit),
      hasNext: endIndex < movements.length,
      hasPrev: page > 1
    }
  };
}

function getMovementTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    'in': 'Masuk',
    'out': 'Keluar',
    'adjust': 'Penyesuaian',
    'transfer_in': 'Transfer Masuk',
    'transfer_out': 'Transfer Keluar'
  };
  return labels[type] || type;
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/inventory/movements - Get stock movements with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = MovementQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Filter movements
    let filteredMovements = filterMovements(mockStockMovements, query);

    // Sort movements
    filteredMovements = sortMovements(filteredMovements, sortBy, sortOrder);

    // Add formatted data
    const formattedMovements = filteredMovements.map(movement => ({
      ...movement,
      movementTypeLabel: getMovementTypeLabel(movement.movementType),
      quantityFormatted: movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity.toString(),
      createdAtFormatted: movement.createdAt.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // Paginate movements
    const result = paginateMovements(formattedMovements, page, limit);

    // Calculate summary statistics
    const summary = {
      totalMovements: filteredMovements.length,
      totalIn: filteredMovements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0),
      totalOut: Math.abs(filteredMovements.filter(m => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0)),
      movementTypes: {
        in: filteredMovements.filter(m => m.movementType === 'in').length,
        out: filteredMovements.filter(m => m.movementType === 'out').length,
        adjust: filteredMovements.filter(m => m.movementType === 'adjust').length,
        transfer_in: filteredMovements.filter(m => m.movementType === 'transfer_in').length,
        transfer_out: filteredMovements.filter(m => m.movementType === 'transfer_out').length
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Data mutasi stok berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data mutasi stok'
    }, { status: 500 });
  }
}