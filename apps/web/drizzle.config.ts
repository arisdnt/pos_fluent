import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pos_kasir'
  },
  verbose: true,
  strict: true
}) satisfies Config;

// ======================================================================
// ENVIRONMENT VARIABLES VALIDATION
// ======================================================================

// Validasi environment variables yang diperlukan
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL environment variable is required in production');
}

// Log konfigurasi untuk debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Drizzle Config:', {
    dialect: 'postgresql',
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dbUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[DEFAULT]'
  });
}