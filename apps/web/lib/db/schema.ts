// ======================================================================
// DATABASE SCHEMA
// Drizzle ORM Schema untuk Aplikasi Kasir
// Sesuai dengan pos_database.sql
// ======================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ======================================================================
// ENUMS
// ======================================================================

export const orderStatusEnum = pgEnum('order_status', ['draft', 'paid', 'void', 'refund']);
export const sessionStatusEnum = pgEnum('session_status', ['open', 'closed']);
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['in', 'out', 'adjust', 'transfer_in', 'transfer_out']);
export const referenceTypeEnum = pgEnum('reference_type', ['pos_order', 'purchase', 'adjustment', 'transfer']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'ewallet', 'transfer', 'voucher']);

// ======================================================================
// CORE TABLES
// ======================================================================

/**
 * Tabel Companies - Data perusahaan
 */
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  taxId: varchar('tax_id', { length: 50 }), // NPWP
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    codeIdx: uniqueIndex('companies_code_idx').on(table.code),
    nameIdx: index('companies_name_idx').on(table.name),
    activeIdx: index('companies_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Branches - Data cabang
 */
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    companyCodeIdx: uniqueIndex('branches_company_code_idx').on(table.companyId, table.code),
    nameIdx: index('branches_name_idx').on(table.name),
    activeIdx: index('branches_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Roles - Data peran pengguna
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: uniqueIndex('roles_name_idx').on(table.name)
  };
});

/**
 * Tabel Permissions - Data izin akses
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  module: varchar('module', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: uniqueIndex('permissions_name_idx').on(table.name),
    moduleIdx: index('permissions_module_idx').on(table.module)
  };
});

/**
 * Tabel Role Permissions - Relasi peran dan izin
 */
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.roleId, table.permissionId] })
  };
});

/**
 * Tabel Users - Data pengguna
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
    emailIdx: index('users_email_idx').on(table.email),
    activeIdx: index('users_active_idx').on(table.isActive)
  };
});

/**
 * Tabel User Roles - Relasi pengguna, peran, dan cabang
 */
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  isActive: boolean('is_active').notNull().default(true),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.roleId, table.branchId] }),
    activeIdx: index('user_roles_active_idx').on(table.isActive)
  };
});

// ======================================================================
// PRODUCT TABLES
// ======================================================================

/**
 * Tabel Categories - Kategori produk
 */
export const categories: any = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references((): any => categories.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: index('categories_name_idx').on(table.name),
    parentIdx: index('categories_parent_idx').on(table.parentId),
    activeIdx: index('categories_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Brands - Merek produk
 */
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: uniqueIndex('brands_name_idx').on(table.name),
    activeIdx: index('brands_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Units - Satuan produk
 */
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: uniqueIndex('units_name_idx').on(table.name),
    symbolIdx: index('units_symbol_idx').on(table.symbol)
  };
});

/**
 * Tabel Tax Groups - Grup pajak
 */
export const taxGroups = pgTable('tax_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  rate: decimal('rate', { precision: 5, scale: 4 }).notNull(), // 0.1100 untuk 11%
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    nameIdx: uniqueIndex('tax_groups_name_idx').on(table.name),
    activeIdx: index('tax_groups_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Products - Data produk
 */
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),
  brandId: uuid('brand_id').references(() => brands.id),
  unitId: uuid('unit_id').notNull().references(() => units.id),
  taxGroupId: uuid('tax_group_id').references(() => taxGroups.id),
  cost: integer('cost').notNull().default(0), // Harga pokok dalam Rupiah
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    skuIdx: uniqueIndex('products_sku_idx').on(table.sku),
    barcodeIdx: index('products_barcode_idx').on(table.barcode),
    nameIdx: index('products_name_idx').on(table.name),
    categoryIdx: index('products_category_idx').on(table.categoryId),
    brandIdx: index('products_brand_idx').on(table.brandId),
    activeIdx: index('products_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Product Prices - Harga jual produk
 */
export const productPrices = pgTable('product_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  priceLevel: varchar('price_level', { length: 50 }).notNull().default('default'),
  branchId: uuid('branch_id').references(() => branches.id),
  price: integer('price').notNull(), // Harga jual dalam Rupiah
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    productLevelIdx: index('product_prices_product_level_idx').on(table.productId, table.priceLevel),
    branchIdx: index('product_prices_branch_idx').on(table.branchId),
    effectiveIdx: index('product_prices_effective_idx').on(table.effectiveFrom, table.effectiveTo),
    activeIdx: index('product_prices_active_idx').on(table.isActive)
  };
});

// ======================================================================
// CUSTOMER & SUPPLIER TABLES
// ======================================================================

/**
 * Tabel Customers - Data pelanggan
 */
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxId: varchar('tax_id', { length: 50 }), // NPWP
  creditLimit: integer('credit_limit').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    codeIdx: index('customers_code_idx').on(table.code),
    nameIdx: index('customers_name_idx').on(table.name),
    phoneIdx: index('customers_phone_idx').on(table.phone),
    activeIdx: index('customers_active_idx').on(table.isActive)
  };
});

/**
 * Tabel Suppliers - Data pemasok
 */
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  taxId: varchar('tax_id', { length: 50 }), // NPWP
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    codeIdx: index('suppliers_code_idx').on(table.code),
    nameIdx: index('suppliers_name_idx').on(table.name),
    phoneIdx: index('suppliers_phone_idx').on(table.phone),
    activeIdx: index('suppliers_active_idx').on(table.isActive)
  };
});

// ======================================================================
// STOCK TABLES
// ======================================================================

/**
 * Tabel Stocks - Stok produk per cabang
 */
export const stocks = pgTable('stocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').notNull().references(() => branches.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  reservedQuantity: integer('reserved_quantity').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  maxStock: integer('max_stock').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    productBranchIdx: uniqueIndex('stocks_product_branch_idx').on(table.productId, table.branchId),
    quantityIdx: index('stocks_quantity_idx').on(table.quantity),
    lowStockIdx: index('stocks_low_stock_idx').on(table.quantity, table.minStock)
  };
});

/**
 * Tabel Stock Movements - Mutasi stok
 */
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  referenceType: referenceTypeEnum('reference_type'),
  referenceId: uuid('reference_id'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    productBranchIdx: index('stock_movements_product_branch_idx').on(table.productId, table.branchId),
    typeIdx: index('stock_movements_type_idx').on(table.movementType),
    referenceIdx: index('stock_movements_reference_idx').on(table.referenceType, table.referenceId),
    createdAtIdx: index('stock_movements_created_at_idx').on(table.createdAt),
    createdByIdx: index('stock_movements_created_by_idx').on(table.createdBy)
  };
});

// ======================================================================
// POS TABLES
// ======================================================================

/**
 * Tabel POS Sessions - Sesi kasir
 */
export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionNo: varchar('session_no', { length: 50 }).notNull().unique(),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  cashierId: uuid('cashier_id').notNull().references(() => users.id),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  openingCash: integer('opening_cash').notNull().default(0),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closingCash: integer('closing_cash').notNull().default(0),
  expectedCash: integer('expected_cash').notNull().default(0),
  cashDifference: integer('cash_difference').notNull().default(0),
  status: sessionStatusEnum('status').notNull().default('open'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    sessionNoIdx: uniqueIndex('pos_sessions_session_no_idx').on(table.sessionNo),
    branchCashierIdx: index('pos_sessions_branch_cashier_idx').on(table.branchId, table.cashierId),
    statusIdx: index('pos_sessions_status_idx').on(table.status),
    openedAtIdx: index('pos_sessions_opened_at_idx').on(table.openedAt)
  };
});

/**
 * Tabel POS Orders - Transaksi penjualan
 */
export const posOrders = pgTable('pos_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  sessionId: uuid('session_id').references(() => posSessions.id),
  customerId: uuid('customer_id').references(() => customers.id),
  cashierId: uuid('cashier_id').notNull().references(() => users.id),
  status: orderStatusEnum('status').notNull().default('draft'),
  subtotal: integer('subtotal').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  roundingAmount: integer('rounding_amount').notNull().default(0),
  total: integer('total').notNull().default(0),
  paidTotal: integer('paid_total').notNull().default(0),
  changeAmount: integer('change_amount').notNull().default(0),
  notes: text('notes'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id),
  voidReason: text('void_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    orderNoIdx: uniqueIndex('pos_orders_order_no_idx').on(table.orderNo),
    branchSessionIdx: index('pos_orders_branch_session_idx').on(table.branchId, table.sessionId),
    customerIdx: index('pos_orders_customer_idx').on(table.customerId),
    cashierIdx: index('pos_orders_cashier_idx').on(table.cashierId),
    statusIdx: index('pos_orders_status_idx').on(table.status),
    createdAtIdx: index('pos_orders_created_at_idx').on(table.createdAt),
    paidAtIdx: index('pos_orders_paid_at_idx').on(table.paidAt)
  };
});

/**
 * Tabel POS Order Lines - Item transaksi
 */
export const posOrderLines = pgTable('pos_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => posOrders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // Harga satuan dalam Rupiah
  discountAmount: integer('discount_amount').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  lineTotal: integer('line_total').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    orderProductIdx: index('pos_order_lines_order_product_idx').on(table.orderId, table.productId),
    productIdx: index('pos_order_lines_product_idx').on(table.productId)
  };
});

/**
 * Tabel POS Payments - Pembayaran transaksi
 */
export const posPayments = pgTable('pos_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => posOrders.id, { onDelete: 'cascade' }),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  amount: integer('amount').notNull(),
  reference: varchar('reference', { length: 255 }), // Nomor referensi untuk non-cash
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => {
  return {
    orderMethodIdx: index('pos_payments_order_method_idx').on(table.orderId, table.paymentMethod),
    methodIdx: index('pos_payments_method_idx').on(table.paymentMethod),
    capturedAtIdx: index('pos_payments_captured_at_idx').on(table.capturedAt)
  };
});

// ======================================================================
// RELATIONS
// ======================================================================

// Company relations
export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches)
}));

// Branch relations
export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, {
    fields: [branches.companyId],
    references: [companies.id]
  }),
  userRoles: many(userRoles),
  stocks: many(stocks),
  posSessions: many(posSessions),
  posOrders: many(posOrders)
}));

// Role relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles)
}));

// Permission relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions)
}));

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  posSessions: many(posSessions),
  posOrders: many(posOrders),
  stockMovements: many(stockMovements)
}));

// Category relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  children: many(categories),
  products: many(products)
}));

// Brand relations
export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products)
}));

// Unit relations
export const unitsRelations = relations(units, ({ many }) => ({
  products: many(products)
}));

// Tax Group relations
export const taxGroupsRelations = relations(taxGroups, ({ many }) => ({
  products: many(products)
}));

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id]
  }),
  unit: one(units, {
    fields: [products.unitId],
    references: [units.id]
  }),
  taxGroup: one(taxGroups, {
    fields: [products.taxGroupId],
    references: [taxGroups.id]
  }),
  prices: many(productPrices),
  stocks: many(stocks),
  stockMovements: many(stockMovements),
  orderLines: many(posOrderLines)
}));

// Customer relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(posOrders)
}));

// Stock relations
export const stocksRelations = relations(stocks, ({ one }) => ({
  product: one(products, {
    fields: [stocks.productId],
    references: [products.id]
  }),
  branch: one(branches, {
    fields: [stocks.branchId],
    references: [branches.id]
  })
}));

// POS Session relations
export const posSessionsRelations = relations(posSessions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [posSessions.branchId],
    references: [branches.id]
  }),
  cashier: one(users, {
    fields: [posSessions.cashierId],
    references: [users.id]
  }),
  orders: many(posOrders)
}));

// POS Order relations
export const posOrdersRelations = relations(posOrders, ({ one, many }) => ({
  branch: one(branches, {
    fields: [posOrders.branchId],
    references: [branches.id]
  }),
  session: one(posSessions, {
    fields: [posOrders.sessionId],
    references: [posSessions.id]
  }),
  customer: one(customers, {
    fields: [posOrders.customerId],
    references: [customers.id]
  }),
  cashier: one(users, {
    fields: [posOrders.cashierId],
    references: [users.id]
  }),
  lines: many(posOrderLines),
  payments: many(posPayments)
}));

// POS Order Line relations
export const posOrderLinesRelations = relations(posOrderLines, ({ one }) => ({
  order: one(posOrders, {
    fields: [posOrderLines.orderId],
    references: [posOrders.id]
  }),
  product: one(products, {
    fields: [posOrderLines.productId],
    references: [products.id]
  })
}));

// POS Payment relations
export const posPaymentsRelations = relations(posPayments, ({ one }) => ({
  order: one(posOrders, {
    fields: [posPayments.orderId],
    references: [posOrders.id]
  })
}));

// ======================================================================
// ZOD SCHEMAS
// ======================================================================

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies);
export const insertBranchSchema = createInsertSchema(branches);
export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertPosOrderSchema = createInsertSchema(posOrders);
export const insertPosOrderLineSchema = createInsertSchema(posOrderLines);
export const insertPosPaymentSchema = createInsertSchema(posPayments);

// Select schemas
export const selectCompanySchema = createSelectSchema(companies);
export const selectBranchSchema = createSelectSchema(branches);
export const selectUserSchema = createSelectSchema(users);
export const selectProductSchema = createSelectSchema(products);
export const selectCustomerSchema = createSelectSchema(customers);
export const selectPosOrderSchema = createSelectSchema(posOrders);
export const selectPosOrderLineSchema = createSelectSchema(posOrderLines);
export const selectPosPaymentSchema = createSelectSchema(posPayments);

// Custom validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  branchId: z.string().uuid().optional()
});

export const productSearchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

export const orderCreateSchema = z.object({
  branchId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    discountAmount: z.number().min(0).default(0)
  })).min(1),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional()
});

// ======================================================================
// TYPE EXPORTS
// ======================================================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type PosOrder = typeof posOrders.$inferSelect;
export type NewPosOrder = typeof posOrders.$inferInsert;

export type PosOrderLine = typeof posOrderLines.$inferSelect;
export type NewPosOrderLine = typeof posOrderLines.$inferInsert;

export type PosPayment = typeof posPayments.$inferSelect;
export type NewPosPayment = typeof posPayments.$inferInsert;

export type PosSession = typeof posSessions.$inferSelect;
export type NewPosSession = typeof posSessions.$inferInsert;

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;