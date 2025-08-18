// ======================================================================
// DATABASE CONFIGURATION
// Drizzle ORM + PostgreSQL untuk Aplikasi Kasir
// ======================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './schema';

// ======================================================================
// DATABASE CONNECTION
// ======================================================================

/**
 * Konfigurasi koneksi database PostgreSQL
 */
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:password@localhost:5432/pos_kasir';

/**
 * Client PostgreSQL dengan konfigurasi optimized untuk aplikasi kasir
 */
const client = postgres(connectionString, {
  // Konfigurasi connection pool
  max: 20, // Maximum connections
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout 10s
  
  // Konfigurasi untuk performa
  prepare: true, // Enable prepared statements
  transform: {
    undefined: null, // Transform undefined to null
  },
  
  // Konfigurasi timezone untuk Indonesia
  types: {
    // Ensure dates are handled in WIB timezone
    date: {
      to: 1184,
      from: [1082, 1114, 1184],
      serialize: (x: Date) => x.toISOString(),
      parse: (x: string) => new Date(x)
    }
  },
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  
  // Debug mode untuk development
  debug: process.env.NODE_ENV === 'development',
  
  // Connection options
  connection: {
    application_name: 'pos-kasir-app',
    timezone: 'Asia/Jakarta'
  }
});

/**
 * Drizzle database instance dengan schema
 */
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

/**
 * Raw PostgreSQL client untuk query khusus
 */
export const sql = client;

// ======================================================================
// DATABASE UTILITIES
// ======================================================================

/**
 * Jalankan migrasi database
 */
export async function runMigrations() {
  try {
    console.log('🔄 Menjalankan migrasi database...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrasi database berhasil');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi:', error);
    throw error;
  }
}

/**
 * Test koneksi database
 */
export async function testConnection() {
  try {
    console.log('🔄 Testing koneksi database...');
    const result = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Koneksi database berhasil:', {
      time: result[0].current_time,
      version: result[0].version.split(' ')[0]
    });
    return true;
  } catch (error) {
    console.error('❌ Gagal koneksi database:', error);
    return false;
  }
}

/**
 * Tutup koneksi database
 */
export async function closeConnection() {
  try {
    await sql.end();
    console.log('✅ Koneksi database ditutup');
  } catch (error) {
    console.error('❌ Gagal menutup koneksi database:', error);
  }
}

/**
 * Health check database
 */
export async function healthCheck() {
  try {
    const start = Date.now();
    await sql`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [connections, size, activity] = await Promise.all([
      // Active connections
      sql`
        SELECT count(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active' AND datname = current_database()
      `,
      
      // Database size
      sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `,
      
      // Recent activity
      sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
        LIMIT 10
      `
    ]);
    
    return {
      activeConnections: connections[0].active_connections,
      databaseSize: size[0].size,
      tableActivity: activity,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Gagal mendapatkan statistik database:', error);
    throw error;
  }
}

/**
 * Vacuum dan analyze database untuk optimasi performa
 */
export async function optimizeDatabase() {
  try {
    console.log('🔄 Mengoptimasi database...');
    
    // Vacuum analyze untuk semua tabel
    await sql`VACUUM ANALYZE`;
    
    // Reindex untuk performa query
    await sql`REINDEX DATABASE CONCURRENTLY`;
    
    console.log('✅ Optimasi database selesai');
  } catch (error) {
    console.error('❌ Gagal mengoptimasi database:', error);
    throw error;
  }
}

// ======================================================================
// TRANSACTION UTILITIES
// ======================================================================

/**
 * Wrapper untuk menjalankan operasi dalam transaction
 */
export async function withTransaction<T>(
  operation: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      return await operation(tx);
    } catch (error) {
      console.error('❌ Transaction error:', error);
      throw error;
    }
  });
}

/**
 * Wrapper untuk operasi batch dengan retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        console.error(`❌ Operation failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// ======================================================================
// BACKUP UTILITIES
// ======================================================================

/**
 * Backup data penting untuk recovery
 */
export async function createBackup() {
  try {
    console.log('🔄 Membuat backup data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      companies: await sql`SELECT * FROM companies`,
      branches: await sql`SELECT * FROM branches`,
      users: await sql`SELECT id, username, email, full_name, is_active, created_at FROM users`,
      products: await sql`SELECT * FROM products`,
      categories: await sql`SELECT * FROM categories`,
      brands: await sql`SELECT * FROM brands`,
      units: await sql`SELECT * FROM units`,
      tax_groups: await sql`SELECT * FROM tax_groups`
    };
    
    console.log('✅ Backup data berhasil dibuat');
    return backupData;
  } catch (error) {
    console.error('❌ Gagal membuat backup:', error);
    throw error;
  }
}

// ======================================================================
// MONITORING UTILITIES
// ======================================================================

/**
 * Monitor slow queries
 */
export async function getSlowQueries(limit: number = 10) {
  try {
    const slowQueries = await sql`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT ${limit}
    `;
    
    return slowQueries;
  } catch (error) {
    console.error('❌ Gagal mendapatkan slow queries:', error);
    return [];
  }
}

/**
 * Monitor table sizes
 */
export async function getTableSizes() {
  try {
    const tableSizes = await sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    
    return tableSizes;
  } catch (error) {
    console.error('❌ Gagal mendapatkan ukuran tabel:', error);
    return [];
  }
}

// ======================================================================
// CLEANUP UTILITIES
// ======================================================================

/**
 * Cleanup data lama untuk menghemat storage
 */
export async function cleanupOldData(daysToKeep: number = 365) {
  try {
    console.log(`🔄 Membersihkan data lebih dari ${daysToKeep} hari...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Cleanup old stock movements (keep 1 year)
    const deletedMovements = await sql`
      DELETE FROM stock_movements 
      WHERE created_at < ${cutoffDate.toISOString()}
      AND reference_type != 'adjustment'
    `;
    
    // Cleanup old sessions (keep 1 year)
    const deletedSessions = await sql`
      DELETE FROM pos_sessions 
      WHERE created_at < ${cutoffDate.toISOString()}
      AND status = 'closed'
    `;
    
    console.log('✅ Cleanup selesai:', {
      deletedMovements: deletedMovements.count,
      deletedSessions: deletedSessions.count
    });
    
    return {
      deletedMovements: deletedMovements.count,
      deletedSessions: deletedSessions.count
    };
  } catch (error) {
    console.error('❌ Gagal cleanup data:', error);
    throw error;
  }
}

// ======================================================================
// EXPORT DEFAULT
// ======================================================================

export default db;