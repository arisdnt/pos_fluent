// ======================================================================
// INVENTORY API ROUTE
// API endpoints untuk manajemen persediaan/stok
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface Stock {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  branchId: string;
  branchName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStock: number;
  maxStock: number;
  updatedAt: Date;
}

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
  createdAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const StockQuerySchema = z.object({
  search: z.string().optional(),
  branchId: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['productName', 'quantity', 'availableQuantity', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const StockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID wajib diisi'),
  branchId: z.string().min(1, 'Branch ID wajib diisi'),
  quantity: z.number().int('Quantity harus berupa integer'),
  notes: z.string().optional()
});

const StockTransferSchema = z.object({
  productId: z.string().min(1, 'Product ID wajib diisi'),
  fromBranchId: z.string().min(1, 'Branch asal wajib diisi'),
  toBranchId: z.string().min(1, 'Branch tujuan wajib diisi'),
  quantity: z.number().int().positive('Quantity harus positif'),
  notes: z.string().optional()
});

const StockMovementQuerySchema = z.object({
  productId: z.string().optional(),
  branchId: z.string().optional(),
  movementType: z.enum(['in', 'out', 'adjust', 'transfer_in', 'transfer_out']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockStocks: Stock[] = [
  {
    id: 'stock_001',
    productId: 'prod_001',
    productName: 'Indomie Goreng',
    productSku: 'BRG001',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    quantity: 100,
    reservedQuantity: 5,
    availableQuantity: 95,
    minStock: 10,
    maxStock: 200,
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'stock_002',
    productId: 'prod_002',
    productName: 'Aqua 600ml',
    productSku: 'BRG002',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    quantity: 50,
    reservedQuantity: 0,
    availableQuantity: 50,
    minStock: 5,
    maxStock: 100,
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'stock_003',
    productId: 'prod_003',
    productName: 'Beras Premium 5kg',
    productSku: 'BRG003',
    branchId: 'branch_001',
    branchName: 'Toko Jakarta Pusat',
    quantity: 3,
    reservedQuantity: 0,
    availableQuantity: 3,
    minStock: 5,
    maxStock: 50,
    updatedAt: new Date('2024-01-15')
  }
];

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
    notes: 'Pembelian dari supplier',
    createdBy: 'user_001',
    createdAt: new Date('2024-01-15')
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
    createdAt: new Date('2024-01-16')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMovementId(): string {
  return `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function filterStocks(stocks: Stock[], query: any): Stock[] {
  let filtered = [...stocks];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(stock => 
      stock.productName.toLowerCase().includes(searchTerm) ||
      stock.productSku.toLowerCase().includes(searchTerm) ||
      stock.branchName.toLowerCase().includes(searchTerm)
    );
  }

  // Branch filter
  if (query.branchId) {
    filtered = filtered.filter(stock => stock.branchId === query.branchId);
  }

  // Low stock filter
  if (query.lowStock === 'true') {
    filtered = filtered.filter(stock => stock.availableQuantity <= stock.minStock);
  }

  return filtered;
}

function sortStocks(stocks: Stock[], sortBy: string, sortOrder: string): Stock[] {
  return stocks.sort((a, b) => {
    let aValue = a[sortBy as keyof Stock];
    let bValue = b[sortBy as keyof Stock];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
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

function paginateStocks(stocks: Stock[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: stocks.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: stocks.length,
      totalPages: Math.ceil(stocks.length / limit),
      hasNext: endIndex < stocks.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/inventory - Get all stocks with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = StockQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'productName';
    const sortOrder = query.sortOrder || 'asc';

    // Filter stocks
    let filteredStocks = filterStocks(mockStocks, query);

    // Sort stocks
    filteredStocks = sortStocks(filteredStocks, sortBy, sortOrder);

    // Paginate stocks
    const result = paginateStocks(filteredStocks, page, limit);

    return NextResponse.json({
      success: true,
      message: 'Data stok berhasil diambil',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data stok'
    }, { status: 500 });
  }
}

// POST /api/inventory - Adjust stock or transfer stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'adjust') {
      const data = StockAdjustmentSchema.parse(body);
      
      // Find existing stock
      const stockIndex = mockStocks.findIndex(
        stock => stock.productId === data.productId && stock.branchId === data.branchId
      );

      if (stockIndex === -1) {
        return NextResponse.json({
          success: false,
          message: 'Stok produk tidak ditemukan'
        }, { status: 404 });
      }

      // Update stock quantity
      const oldQuantity = mockStocks[stockIndex].quantity;
      mockStocks[stockIndex].quantity = data.quantity;
      mockStocks[stockIndex].availableQuantity = data.quantity - mockStocks[stockIndex].reservedQuantity;
      mockStocks[stockIndex].updatedAt = new Date();

      // Create stock movement record
      const movement: StockMovement = {
        id: generateMovementId(),
        productId: data.productId,
        productName: mockStocks[stockIndex].productName,
        productSku: mockStocks[stockIndex].productSku,
        branchId: data.branchId,
        branchName: mockStocks[stockIndex].branchName,
        movementType: 'adjust',
        quantity: data.quantity - oldQuantity,
        referenceType: 'adjustment',
        notes: data.notes || 'Penyesuaian stok',
        createdBy: 'current_user', // Should be from auth
        createdAt: new Date()
      };
      mockStockMovements.push(movement);

      return NextResponse.json({
        success: true,
        message: 'Stok berhasil disesuaikan',
        data: mockStocks[stockIndex]
      });
    }

    if (action === 'transfer') {
      const data = StockTransferSchema.parse(body);
      
      // Find source stock
      const sourceStockIndex = mockStocks.findIndex(
        stock => stock.productId === data.productId && stock.branchId === data.fromBranchId
      );

      if (sourceStockIndex === -1) {
        return NextResponse.json({
          success: false,
          message: 'Stok produk di cabang asal tidak ditemukan'
        }, { status: 404 });
      }

      if (mockStocks[sourceStockIndex].availableQuantity < data.quantity) {
        return NextResponse.json({
          success: false,
          message: 'Stok tidak mencukupi untuk transfer'
        }, { status: 400 });
      }

      // Update source stock
      mockStocks[sourceStockIndex].quantity -= data.quantity;
      mockStocks[sourceStockIndex].availableQuantity -= data.quantity;
      mockStocks[sourceStockIndex].updatedAt = new Date();

      // Find or create destination stock
      let destStockIndex = mockStocks.findIndex(
        stock => stock.productId === data.productId && stock.branchId === data.toBranchId
      );

      if (destStockIndex === -1) {
        // Create new stock entry for destination
        const newStock: Stock = {
          id: generateId(),
          productId: data.productId,
          productName: mockStocks[sourceStockIndex].productName,
          productSku: mockStocks[sourceStockIndex].productSku,
          branchId: data.toBranchId,
          branchName: 'Branch Tujuan', // Should be fetched from branch data
          quantity: data.quantity,
          reservedQuantity: 0,
          availableQuantity: data.quantity,
          minStock: 0,
          maxStock: 0,
          updatedAt: new Date()
        };
        mockStocks.push(newStock);
        destStockIndex = mockStocks.length - 1;
      } else {
        // Update existing destination stock
        mockStocks[destStockIndex].quantity += data.quantity;
        mockStocks[destStockIndex].availableQuantity += data.quantity;
        mockStocks[destStockIndex].updatedAt = new Date();
      }

      // Create movement records
      const outMovement: StockMovement = {
        id: generateMovementId(),
        productId: data.productId,
        productName: mockStocks[sourceStockIndex].productName,
        productSku: mockStocks[sourceStockIndex].productSku,
        branchId: data.fromBranchId,
        branchName: mockStocks[sourceStockIndex].branchName,
        movementType: 'transfer_out',
        quantity: -data.quantity,
        referenceType: 'transfer',
        notes: data.notes || 'Transfer keluar',
        createdBy: 'current_user',
        createdAt: new Date()
      };

      const inMovement: StockMovement = {
        id: generateMovementId(),
        productId: data.productId,
        productName: mockStocks[destStockIndex].productName,
        productSku: mockStocks[destStockIndex].productSku,
        branchId: data.toBranchId,
        branchName: mockStocks[destStockIndex].branchName,
        movementType: 'transfer_in',
        quantity: data.quantity,
        referenceType: 'transfer',
        notes: data.notes || 'Transfer masuk',
        createdBy: 'current_user',
        createdAt: new Date()
      };

      mockStockMovements.push(outMovement, inMovement);

      return NextResponse.json({
        success: true,
        message: 'Transfer stok berhasil',
        data: {
          source: mockStocks[sourceStockIndex],
          destination: mockStocks[destStockIndex]
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Action tidak valid'
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing inventory action:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memproses aksi inventory'
    }, { status: 500 });
  }
}