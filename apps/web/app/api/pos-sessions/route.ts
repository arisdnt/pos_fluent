// ======================================================================
// POS SESSIONS API ROUTE
// API endpoints untuk manajemen sesi kasir
// ======================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ======================================================================
// TYPES
// ======================================================================

interface PosSession {
  id: string;
  branchId: string;
  branchName: string;
  userId: string;
  userName: string;
  sessionNumber: string;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalTransactions: number;
  status: 'active' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionSummary {
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  totalOther: number;
  totalRevenue: number;
  totalProfit: number;
  averageTransaction: number;
  largestTransaction: number;
  smallestTransaction: number;
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const SessionQuerySchema = z.object({
  search: z.string().optional(),
  branchId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['active', 'closed']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sortBy: z.enum(['sessionNumber', 'startTime', 'endTime', 'totalSales', 'totalTransactions']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional()
});

const SessionStartSchema = z.object({
  branchId: z.string().min(1, 'ID cabang wajib diisi'),
  userId: z.string().min(1, 'ID pengguna wajib diisi'),
  startingCash: z.number().min(0, 'Kas awal tidak boleh negatif'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
});

const SessionEndSchema = z.object({
  endingCash: z.number().min(0, 'Kas akhir tidak boleh negatif'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
});

const SessionUpdateSchema = z.object({
  startingCash: z.number().min(0, 'Kas awal tidak boleh negatif').optional(),
  endingCash: z.number().min(0, 'Kas akhir tidak boleh negatif').optional(),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional()
});

// ======================================================================
// MOCK DATA
// ======================================================================

let mockSessions: PosSession[] = [
  {
    id: 'session_001',
    branchId: 'branch_001',
    branchName: 'Cabang Utama',
    userId: 'user_002',
    userName: 'Kasir 1',
    sessionNumber: 'SES-20241201-001',
    startTime: new Date('2024-12-01T08:00:00'),
    endTime: new Date('2024-12-01T17:00:00'),
    startingCash: 500000,
    endingCash: 750000,
    totalSales: 2500000,
    totalTransactions: 45,
    status: 'closed',
    notes: 'Shift pagi, penjualan normal',
    createdAt: new Date('2024-12-01T08:00:00'),
    updatedAt: new Date('2024-12-01T17:00:00')
  },
  {
    id: 'session_002',
    branchId: 'branch_001',
    branchName: 'Cabang Utama',
    userId: 'user_003',
    userName: 'Kasir 2',
    sessionNumber: 'SES-20241201-002',
    startTime: new Date('2024-12-01T17:00:00'),
    endTime: new Date('2024-12-01T23:00:00'),
    startingCash: 750000,
    endingCash: 950000,
    totalSales: 1800000,
    totalTransactions: 32,
    status: 'closed',
    notes: 'Shift sore, ramai pengunjung',
    createdAt: new Date('2024-12-01T17:00:00'),
    updatedAt: new Date('2024-12-01T23:00:00')
  },
  {
    id: 'session_003',
    branchId: 'branch_002',
    branchName: 'Cabang Mall',
    userId: 'user_004',
    userName: 'Kasir 3',
    sessionNumber: 'SES-20241202-001',
    startTime: new Date('2024-12-02T09:00:00'),
    startingCash: 600000,
    totalSales: 1200000,
    totalTransactions: 18,
    status: 'active',
    notes: 'Shift pagi cabang mall',
    createdAt: new Date('2024-12-02T09:00:00'),
    updatedAt: new Date('2024-12-02T09:00:00')
  },
  {
    id: 'session_004',
    branchId: 'branch_001',
    branchName: 'Cabang Utama',
    userId: 'user_002',
    userName: 'Kasir 1',
    sessionNumber: 'SES-20241202-002',
    startTime: new Date('2024-12-02T08:00:00'),
    endTime: new Date('2024-12-02T16:00:00'),
    startingCash: 500000,
    endingCash: 820000,
    totalSales: 2800000,
    totalTransactions: 52,
    status: 'closed',
    notes: 'Shift pagi, promo weekend',
    createdAt: new Date('2024-12-02T08:00:00'),
    updatedAt: new Date('2024-12-02T16:00:00')
  },
  {
    id: 'session_005',
    branchId: 'branch_003',
    branchName: 'Cabang Plaza',
    userId: 'user_005',
    userName: 'Kasir 4',
    sessionNumber: 'SES-20241202-003',
    startTime: new Date('2024-12-02T10:00:00'),
    startingCash: 400000,
    totalSales: 850000,
    totalTransactions: 12,
    status: 'active',
    notes: 'Shift pagi cabang plaza',
    createdAt: new Date('2024-12-02T10:00:00'),
    updatedAt: new Date('2024-12-02T10:00:00')
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const todaySessions = mockSessions.filter(session => 
    session.sessionNumber.includes(dateStr)
  );
  const nextNumber = (todaySessions.length + 1).toString().padStart(3, '0');
  return `SES-${dateStr}-${nextNumber}`;
}

function filterSessions(sessions: PosSession[], query: any): PosSession[] {
  let filtered = [...sessions];

  // Search filter
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(session => 
      session.sessionNumber.toLowerCase().includes(searchTerm) ||
      session.userName.toLowerCase().includes(searchTerm) ||
      session.branchName.toLowerCase().includes(searchTerm) ||
      session.notes?.toLowerCase().includes(searchTerm)
    );
  }

  // Branch filter
  if (query.branchId) {
    filtered = filtered.filter(session => session.branchId === query.branchId);
  }

  // User filter
  if (query.userId) {
    filtered = filtered.filter(session => session.userId === query.userId);
  }

  // Status filter
  if (query.status) {
    filtered = filtered.filter(session => session.status === query.status);
  }

  // Date range filter
  if (query.startDate) {
    const startDate = new Date(query.startDate);
    filtered = filtered.filter(session => session.startTime >= startDate);
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate + 'T23:59:59');
    filtered = filtered.filter(session => session.startTime <= endDate);
  }

  return filtered;
}

function sortSessions(sessions: PosSession[], sortBy: string, sortOrder: string): PosSession[] {
  return sessions.sort((a, b) => {
    let aValue = a[sortBy as keyof PosSession];
    let bValue = b[sortBy as keyof PosSession];

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

function paginateSessions(sessions: PosSession[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    data: sessions.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: sessions.length,
      totalPages: Math.ceil(sessions.length / limit),
      hasNext: endIndex < sessions.length,
      hasPrev: page > 1
    }
  };
}

function calculateSessionSummary(sessions: PosSession[]): SessionSummary {
  const closedSessions = sessions.filter(session => session.status === 'closed');
  
  if (closedSessions.length === 0) {
    return {
      totalCash: 0,
      totalCard: 0,
      totalTransfer: 0,
      totalOther: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageTransaction: 0,
      largestTransaction: 0,
      smallestTransaction: 0
    };
  }

  const totalRevenue = closedSessions.reduce((sum, session) => sum + session.totalSales, 0);
  const totalTransactions = closedSessions.reduce((sum, session) => sum + session.totalTransactions, 0);
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Mock payment method breakdown (in real implementation, get from pos_payments table)
  const totalCash = totalRevenue * 0.4; // 40% cash
  const totalCard = totalRevenue * 0.35; // 35% card
  const totalTransfer = totalRevenue * 0.2; // 20% transfer
  const totalOther = totalRevenue * 0.05; // 5% other

  return {
    totalCash,
    totalCard,
    totalTransfer,
    totalOther,
    totalRevenue,
    totalProfit: totalRevenue * 0.25, // Mock 25% profit margin
    averageTransaction,
    largestTransaction: averageTransaction * 3, // Mock largest transaction
    smallestTransaction: averageTransaction * 0.2 // Mock smallest transaction
  };
}

// ======================================================================
// API HANDLERS
// ======================================================================

// GET /api/pos-sessions - Get all sessions with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const query = SessionQuerySchema.parse(queryParams);

    // Parse query parameters
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const sortBy = query.sortBy || 'startTime';
    const sortOrder = query.sortOrder || 'desc';

    // Filter sessions
    let filteredSessions = filterSessions(mockSessions, query);

    // Sort sessions
    filteredSessions = sortSessions(filteredSessions, sortBy, sortOrder);

    // Paginate sessions
    const result = paginateSessions(filteredSessions, page, limit);

    // Calculate summary
    const summary = calculateSessionSummary(filteredSessions);
    const stats = {
      total: filteredSessions.length,
      active: filteredSessions.filter(session => session.status === 'active').length,
      closed: filteredSessions.filter(session => session.status === 'closed').length,
      totalRevenue: summary.totalRevenue,
      averageSessionRevenue: filteredSessions.length > 0 ? 
        filteredSessions.reduce((sum, session) => sum + session.totalSales, 0) / filteredSessions.length : 0
    };

    return NextResponse.json({
      success: true,
      message: 'Data sesi kasir berhasil diambil',
      data: result.data,
      pagination: result.pagination,
      summary,
      stats
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data sesi kasir'
    }, { status: 500 });
  }
}

// POST /api/pos-sessions - Start new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = SessionStartSchema.parse(body);

    // Check if user already has an active session
    const activeSession = mockSessions.find(session => 
      session.userId === data.userId && session.status === 'active'
    );
    if (activeSession) {
      return NextResponse.json({
        success: false,
        message: 'Pengguna sudah memiliki sesi aktif'
      }, { status: 400 });
    }

    // Check if branch already has an active session
    const activeBranchSession = mockSessions.find(session => 
      session.branchId === data.branchId && session.status === 'active'
    );
    if (activeBranchSession) {
      return NextResponse.json({
        success: false,
        message: 'Cabang sudah memiliki sesi aktif'
      }, { status: 400 });
    }

    // Create new session
    const newSession: PosSession = {
      id: generateId(),
      branchId: data.branchId,
      branchName: 'Nama Cabang', // In real implementation, get from branches table
      userId: data.userId,
      userName: 'Nama Pengguna', // In real implementation, get from users table
      sessionNumber: generateSessionNumber(),
      startTime: new Date(),
      startingCash: data.startingCash,
      totalSales: 0,
      totalTransactions: 0,
      status: 'active',
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSessions.push(newSession);

    return NextResponse.json({
      success: true,
      message: 'Sesi kasir berhasil dimulai',
      data: newSession
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memulai sesi kasir'
    }, { status: 500 });
  }
}

// PUT /api/pos-sessions - Update or end session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID sesi wajib diisi'
      }, { status: 400 });
    }

    // Find session
    const sessionIndex = mockSessions.findIndex(session => session.id === id);
    if (sessionIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'Sesi tidak ditemukan'
      }, { status: 404 });
    }

    const session = mockSessions[sessionIndex];

    // End session
    if (action === 'end') {
      if (session.status === 'closed') {
        return NextResponse.json({
          success: false,
          message: 'Sesi sudah ditutup'
        }, { status: 400 });
      }

      const endData = SessionEndSchema.parse(updateData);
      
      mockSessions[sessionIndex] = {
        ...session,
        endTime: new Date(),
        endingCash: endData.endingCash,
        status: 'closed',
        notes: endData.notes || session.notes,
        updatedAt: new Date()
      };

      return NextResponse.json({
        success: true,
        message: 'Sesi kasir berhasil ditutup',
        data: mockSessions[sessionIndex]
      });
    }

    // Regular update
    const data = SessionUpdateSchema.parse(updateData);

    mockSessions[sessionIndex] = {
      ...session,
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Sesi kasir berhasil diperbarui',
      data: mockSessions[sessionIndex]
    });
  } catch (error) {
    console.error('Error updating session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal memperbarui sesi kasir'
    }, { status: 500 });
  }
}

// DELETE /api/pos-sessions - Delete sessions (only for closed sessions)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = z.object({
      ids: z.array(z.string()).min(1, 'Minimal satu sesi harus dipilih')
    }).parse(body);

    // Check if sessions exist and are closed
    const existingSessions = mockSessions.filter(session => ids.includes(session.id));
    if (existingSessions.length !== ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Beberapa sesi tidak ditemukan'
      }, { status: 404 });
    }

    const hasActiveSessions = existingSessions.some(session => session.status === 'active');
    if (hasActiveSessions) {
      return NextResponse.json({
        success: false,
        message: 'Tidak dapat menghapus sesi yang masih aktif'
      }, { status: 400 });
    }

    // Remove sessions
    mockSessions = mockSessions.filter(session => !ids.includes(session.id));

    return NextResponse.json({
      success: true,
      message: `${ids.length} sesi kasir berhasil dihapus`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus sesi kasir'
    }, { status: 500 });
  }
}