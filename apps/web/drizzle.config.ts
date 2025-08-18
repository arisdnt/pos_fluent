// ======================================================================
// DRIZZLE CONFIGURATION
// Konfigurasi untuk Drizzle Kit - Database Migration Tool
// ======================================================================

import type { Config } from 'drizzle-kit';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Database connection
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pos_kasir'
  },
  
  // Schema configuration
  schema: './lib/db/schema.ts',
  out: './drizzle',
  
  // Migration settings
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public'
  },
  
  // Introspection settings
  introspect: {
    casing: 'camel'
  },
  
  // Push settings
  push: {
    strict: true
  },
  
  // Studio settings
  studio: {
    port: 4983,
    host: '127.0.0.1',
    verbose: true
  },
  
  // Verbose logging
  verbose: true,
  
  // Strict mode
  strict: true,
  
  // Custom type mappings untuk PostgreSQL
  schemaFilter: ['public'],
  
  // Breakpoints untuk debugging
  breakpoints: true
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