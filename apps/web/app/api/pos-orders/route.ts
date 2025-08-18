// ======================================================================
// POS ORDERS API ROUTE
// API endpoints untuk manajemen pesanan/transaksi POS
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface PosOrderLine {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface PosPayment {
  id: string;
  method: 'cash' | 'card' | 'transfer' | 'other';
  amount: number;
  reference?: string;
  notes?: string;
}

interface PosOrder {
  id: string;
  orderNo: string;
  sessionId: string;
  sessionNumber: string;
  branchId: string;
  branchName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  orderLines: PosOrderLine[];
  payments: PosPayment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const OrderQuerySchema = z.object({
  search: z.string().optional(),
  sessionId: z.string().optional(),
  branchId: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['draft', 'completed', 'cancelled', 'refunded']).optional(),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  sortBy: z.enum(['orderNo', 'createdAt', 'totalAmount', 'customerName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const OrderLineSchema = z.object({
  productId: z.string().min(1, 'ID produk wajib diisi'),
  quantity: z.number().min(0.01, 'Kuantitas minimal 0.01'),
  unitPrice: z.number().min(0, 'Harga satuan tidak boleh negatif'),
  discount: z.number().min(0, 'Diskon tidak boleh negatif').default(0)
});

const PaymentSchema = z.object({
  method: z.enum(['cash', 'card', 'transfer', 'other'], {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' })
  }),
  amount: z.number().min(0.01, 'Jumlah pembayaran minimal 0.01'),
  reference: z.string().max(100, 'Referensi maksimal 100 karakter').optional(),
  notes: z.string().max(255, 'Catatan maksimal 255 karakter').optional()
});

const OrderCreateSchema = z.object({
  sessionId: z.string().min(1, 'ID sesi wajib diisi'),
  customerId: z.string().optional(),
  customerName: z.string().max(100, 'Nama pelanggan maksimal 100 karakter').optional(),
  customerPhone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  orderLines: z.array(OrderLineSchema).min(1, 'Minimal satu item produk'),
  payments: z.array(PaymentSchema).min(1, 'Minimal satu metode pembayaran'),
  discountAmount: z.number().min(0, 'Diskon tidak boleh negatif').default(0),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
});

const OrderUpdateSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().max(100, 'Nama pelanggan maksimal 100 karakter').optional(),
  customerPhone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  orderLines: z.array(OrderLineSchema).optional(),
  payments: z.array(PaymentSchema).optional(),
  discountAmount: z.number().min(0, 'Diskon tidak boleh negatif').optional(),
  status: z.enum(['draft', 'completed', 'cancelled', 'refunded']).optional(),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
});

const OrderBulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'Minimal satu pesanan harus dipilih'),
  updates: z.object({
    status: z.enum(['draft', 'completed', 'cancelled', 'refunded']).optional()
  })
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockOrders: PosOrder[] = [
  {
    id: 'order_001',
    orderNo: 'ORD-20241201-001',
    sessionId: 'session_001',
    sessionNumber: 'SES-20241201-001',
    branchId: 'branch_001',
    branchName: 'Cabang Utama',
    customerId: 'customer_001',
    customerName: 'John Doe',
    customerPhone: '081234567890',
    subtotal: 150000,
    discountAmount: 5000,
    taxAmount: 15950,
    totalAmount: 160950,
    paidAmount: 200000,
    changeAmount: 39050,
    status: 'completed',
    paymentStatus: 'paid',
    orderLines: [
      {
        id: 'line_001',
        productId: 'product_001',
        productName: 'Kopi Americano',
        productCode: 'COFFEE-001',
        quantity: 2,
        unitPrice: 25000,
        discount: 0,
        taxAmount: 5500,
        subtotal: 50000,
        total: 55500
      },
      {
        id: 'line_002',
        productId: 'product_002',
        productName: 'Sandwich Club',
        productCode: 'FOOD-001',
        quantity: 1,
        unitPrice: 100000,
        discount: 5000,
        taxAmount: 10450,
        subtotal: 95000,
        total: 105450
      }
    ],
    payments: [
      {
        id: 'payment_001',
        method: 'cash',
        amount: 200000,
        notes: 'Pembayaran tunai'
      }
    ],
    notes: 'Pesanan untuk makan di tempat',
    createdAt: new Date('2024-12-01T10:30:00'),
    updatedAt: new Date('2024-12-01T10:35:00')
  },
  {
    id: 'order_002',
    orderNo: 'ORD-20241201-002',
    sessionId: 'session_001',
    sessionNumber: 'SES-20241201-001',
    branchId: 'branch_001',
    branchName: 'Cabang Utama',
    customerName: 'Jane Smith',
    customerPhone: '081987654321',
    subtotal: 75000,
    discountAmount: 0,
    taxAmount: 8250,
    totalAmount: 83250,
    paidAmount: 83250,
    changeAmount: 0,
    status: 'completed',
    paymentStatus: 'paid',
    orderLines: [
      {
        id: 'line_003',
        productId: 'product_003',
        productName: 'Cappuccino',
        productCode: 'COFFEE-002',
        quantity: 1,
        unitPrice: 30000,
        discount: 0,
        taxAmount: 3300,
        subtotal: 30000,
        total: 33300
      },
      {
        id: 'line_004',
        productId: 'product_004',
        productName: 'Croissant',
        productCode: 'PASTRY-001',
        quantity: 1,
        unitPrice: 45000,
        discount: 0,
        taxAmount: 4950,
        subtotal: 45000,
        total: 49950
      }
    ],
    payments: [
      {
        id: 'payment_002',
        method: 'card',
        amount: 83250,
        reference: 'CARD-123456',
        notes: 'Pembayaran kartu debit'
      }
    ],
    notes: 'Pesanan takeaway',
    createdAt: new Date('2024-12-01T11:15:00'),
    updatedAt: new Date('2024-12-01T11:20:00')
  },
  {
    id: 'order_003',
    orderNo: 'ORD-20241202-001',
    sessionId: 'session_003',
    sessionNumber: 'SES-20241202-001',
    branchId: 'branch_002',
    branchName: 'Cabang Mall',
    subtotal: 120000,
    discountAmount: 10000,
    taxAmount: 12100,
    totalAmount: 122100,
    paidAmount: 122100,
    changeAmount: 0,
    status: 'completed',
    paymentStatus: 'paid',
    orderLines: [
      {
        id: 'line_005',
        productId: 'product_005',
        productName: 'Latte',
        productCode: 'COFFEE-003',
        quantity: 2,
        unitPrice: 35000,
        discount: 5000,
        taxAmount: 7150,
        subtotal: 65000,
        total: 72150
      },
      {
        id: 'line_006',
        productId: 'product_006',
        productName: 'Muffin Blueberry',
        productCode: 'PASTRY-002',
        quantity: 1,
        unitPrice: 55000,
        discount: 5000,
        taxAmount: 4950,
        subtotal: 45000,
        total: 49950
      }
    ],
    payments: [
      {
        id: 'payment_003',
        method: 'transfer',
        amount: 122100,
        reference: 'TRF-789012',
        notes: 'Transfer bank'
      }
    ],
    createdAt: new Date('2024-12-02T14:20:00'),
    updatedAt: new Date('2024-12-02T14:25:00')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateOrderNo(): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const todayOrders = mockOrders.filter(order => 
    order.orderNo.includes(dateStr)
  );
  const nextNumber = (todayOrders.length + 1).toString().padStart(3, '0');
  return `ORD-${dateStr}-${nextNumber}`;
}

function calculateOrderTotals(orderLines: any[], discountAmount: number = 0) {
  const subtotal = orderLines.reduce((sum, line) => {
    const lineSubtotal = (line.unitPrice * line.quantity) - (line.discount || 0);
    return sum + lineSubtotal;
  }, 0);
  
  const taxAmount = (subtotal - discountAmount) * 0.11; // 11% PPN
  const totalAmount = subtotal - discountAmount + taxAmount;
  
  return {
    subtotal,
    taxAmount: Math.round(taxAmount),
    totalAmount: Math.round(totalAmount)
  };
}

function filterOrders(orders: PosOrder[], query: any): PosOrder[] {
  let filtered = [...orders];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(order => 
      order.orderNo.toLowerCase().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm) ||
      order.customerPhone?.includes(searchTerm) ||
      order.notes?.toLowerCase().includes(searchTerm)
    );
  }

  // Session filter
  if (query.sessionId) {
    filtered = filtered.filter(order => order.sessionId === query.sessionId);
  }

  // Branch filter
  if (query.branchId) {
    filtered = filtered.filter(order => order.branchId === query.branchId);
  }

  // Customer filter
  if (query.customerId) {
    filtered = filtered.filter(order => order.customerId === query.customerId);
  }

  // Status filter
  if (query.status) {
    filtered = filtered.filter(order => order.status === query.status);
  }

  // Payment status filter
  if (query.paymentStatus) {
    filtered = filtered.filter(order => order.paymentStatus === query.paymentStatus);
  }

  // Date range filter
  if (query.startDate) {
    const startDate = new Date(query.startDate);
    filtered = filtered.filter(order => order.createdAt >= startDate);
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate + 'T23:59:59');
    filtered = filtered.filter(order => order.createdAt <= endDate);
  }

  // Amount range filter
  if (query.minAmount) {
    const minAmount = parseFloat(query.minAmount);
    filtered = filtered.filter(order => order.totalAmount >= minAmount);
  }

  if (query.maxAmount) {
    const maxAmount = parseFloat(query.maxAmount);
    filtered = filtered.filter(order => order.totalAmount <= maxAmount);
  }

  return filtered;
}

function sortOrders(orders: PosOrder[], sortBy: string, sortOrder: string): PosOrder[] {
  return orders.sort((a, b) => {
    let aValue = a[sortBy as keyof PosOrder];
    let bValue = b[sortBy as keyof PosOrder];

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

function paginateOrders(orders: PosOrder[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: orders.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: orders.length,
      totalPages: Math.ceil(orders.length / limit),
      hasNext: endIndex < orders.length,
      hasPrev: page > 1
    }
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/pos-orders - Get all orders with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = OrderQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Filter orders
    let filteredOrders = filterOrders(mockOrders, query);

    // Sort orders
    filteredOrders = sortOrders(filteredOrders, sortBy, sortOrder);

    // Paginate orders
    const result = paginateOrders(filteredOrders, page, limit);

    // Calculate summary
    const summary = {
      total: filteredOrders.length,
      completed: filteredOrders.filter(order => order.status === 'completed').length,
      draft: filteredOrders.filter(order => order.status === 'draft').length,
      cancelled: filteredOrders.filter(order => order.status === 'cancelled').length,
      refunded: filteredOrders.filter(order => order.status === 'refunded').length,
      totalRevenue: filteredOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: filteredOrders.length > 0 ? 
        filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length : 0,
      totalItems: filteredOrders.reduce((sum, order) => 
        sum + order.orderLines.reduce((lineSum, line) => lineSum + line.quantity, 0), 0
      )
    };

    return NextResponse.json({
      success: true,
      message: 'Data pesanan berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data pesanan'
    }, { status: 500 });
  }
}

// POST /api/pos-orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = OrderCreateSchema.parse(body);

    // Calculate totals
    const totals = calculateOrderTotals(data.orderLines, data.discountAmount);
    
    // Calculate payment totals
    const paidAmount = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const changeAmount = Math.max(0, paidAmount - totals.totalAmount);
    
    // Determine payment status
    let paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' = 'pending';
    if (paidAmount >= totals.totalAmount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    // Create order lines with calculated totals
    const orderLines: PosOrderLine[] = data.orderLines.map(line => {
      const lineSubtotal = (line.unitPrice * line.quantity) - (line.discount || 0);
      const lineTaxAmount = lineSubtotal * 0.11;
      const lineTotal = lineSubtotal + lineTaxAmount;
      
      return {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: line.productId,
        productName: 'Nama Produk', // In real implementation, get from products table
        productCode: 'PROD-CODE', // In real implementation, get from products table
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount || 0,
        taxAmount: Math.round(lineTaxAmount),
        subtotal: lineSubtotal,
        total: Math.round(lineTotal)
      };
    });

    // Create payments
    const payments: PosPayment[] = data.payments.map(payment => ({
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method: payment.method,
      amount: payment.amount,
      reference: payment.reference,
      notes: payment.notes
    }));

    // Create new order
    const newOrder: PosOrder = {
      id: generateId(),
      orderNo: generateOrderNo(),
      sessionId: data.sessionId,
      sessionNumber: 'SES-NUMBER', // In real implementation, get from sessions table
      branchId: 'branch_id', // In real implementation, get from sessions table
      branchName: 'Nama Cabang', // In real implementation, get from branches table
      customerId: data.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      subtotal: totals.subtotal,
      discountAmount: data.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount,
      changeAmount,
      status: paymentStatus === 'paid' ? 'completed' : 'draft',
      paymentStatus,
      orderLines,
      payments,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockOrders.push(newOrder);

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: newOrder
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal membuat pesanan'
    }, { status: 500 });
  }
}

// PUT /api/pos-orders - Update order or bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Bulk update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, updates } = OrderBulkUpdateSchema.parse(body);
      
      // Check if orders exist
      const existingOrders = mockOrders.filter(order => ids.includes(order.id));
      if (existingOrders.length !== ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Beberapa pesanan tidak ditemukan'
        }, { status: 404 });
      }

      // Update orders
      mockOrders = mockOrders.map(order => {
        if (ids.includes(order.id)) {
          return {
            ...order,
            ...updates,
            updatedAt: new Date()
          };
        }
        return order;
      });

      return NextResponse.json({
        success: true,
        message: `${ids.length} pesanan berhasil diperbarui`,
        updatedCount: ids.length
      });
    }

    // Single update
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID pesanan wajib diisi'
      }, { status: 400 });
    }

    const data = OrderUpdateSchema.parse(updateData);

    // Find order
    const orderIndex = mockOrders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Pesanan tidak ditemukan'
      }, { status: 404 });
    }

    const order = mockOrders[orderIndex];

    // Check if order can be updated
    if (order.status === 'completed' && data.status !== 'refunded') {
      return NextResponse.json({
        success: false,
        message: 'Pesanan yang sudah selesai hanya dapat diubah statusnya menjadi refund'
      }, { status: 400 });
    }

    // Recalculate totals if order lines or discount changed
    let updatedOrder = { ...order, ...data };
    
    if (data.orderLines || data.discountAmount !== undefined) {
      const orderLines = data.orderLines || order.orderLines;
      const discountAmount = data.discountAmount ?? order.discountAmount;
      const totals = calculateOrderTotals(orderLines, discountAmount);
      
      updatedOrder = {
        ...updatedOrder,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount
      };
    }

    // Recalculate payment status if payments changed
    if (data.payments) {
      const paidAmount = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const changeAmount = Math.max(0, paidAmount - updatedOrder.totalAmount);
      
      let paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' = 'pending';
      if (paidAmount >= updatedOrder.totalAmount) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }
      
      updatedOrder = {
        ...updatedOrder,
        paidAmount,
        changeAmount,
        paymentStatus
      };
    }

    updatedOrder.updatedAt = new Date();
    mockOrders[orderIndex] = updatedOrder;

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil diperbarui',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui pesanan'
    }, { status: 500 });
  }
}

// DELETE /api/pos-orders - Delete orders (only draft orders)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = z.object({
      ids: z.array(z.string()).min(1, 'Minimal satu pesanan harus dipilih')
    }).parse(body);

    // Check if orders exist
    const existingOrders = mockOrders.filter(order => ids.includes(order.id));
    if (existingOrders.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa pesanan tidak ditemukan'
      }, { status: 404 });
    }

    // Check if orders can be deleted (only draft orders)
    const hasNonDraftOrders = existingOrders.some(order => order.status !== 'draft');
    if (hasNonDraftOrders) {
      return NextResponse.json({
        success: false,
        message: 'Hanya pesanan dengan status draft yang dapat dihapus'
      }, { status: 400 });
    }

    // Remove orders
    mockOrders = mockOrders.filter(order => !ids.includes(order.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} pesanan berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting orders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus pesanan'
    }, { status: 500 });
  }
}