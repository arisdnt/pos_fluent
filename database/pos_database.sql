-- ======================================================================
-- SKEMA DATABASE APLIKASI KASIR (POS)
-- Target: PostgreSQL 12+ dengan ekstensi uuid-ossp dan pg_trgm
-- Bahasa: Indonesia (VIEW dan COMMENT)
-- Zona Waktu: Asia/Jakarta (WIB)
-- Mata Uang: Rupiah (INTEGER, tanpa desimal)
-- ======================================================================

-- Buat ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Buat role authenticated_users jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_users') THEN
        CREATE ROLE authenticated_users NOLOGIN;
    END IF;
END
$$;

-- ======================================================================
-- TABEL MASTER DATA
-- ======================================================================

-- Tabel Perusahaan
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    tax_id VARCHAR(50), -- NPWP
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Data perusahaan/grup usaha';
COMMENT ON COLUMN companies.tax_id IS 'Nomor Pokok Wajib Pajak (NPWP)';

-- Tabel Cabang
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE branches IS 'Data cabang/toko';

-- Enable RLS untuk branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Tabel Peran/Role
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Peran pengguna (Super Admin, Kasir, dll)';

-- Tabel Izin/Permission
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Izin akses sistem';

-- Tabel Izin Peran
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabel Pengguna
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Data pengguna sistem';

-- Tabel Peran Pengguna per Cabang
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id, branch_id)
);

COMMENT ON TABLE user_roles IS 'Peran pengguna per cabang';

-- ======================================================================
-- TABEL PRODUK DAN KATEGORI
-- ======================================================================

-- Tabel Kategori Produk
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Kategori produk';

-- Tabel Merek
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE brands IS 'Merek produk';

-- Tabel Satuan
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE units IS 'Satuan produk (PCS, KG, LTR, dll)';

-- Tabel Grup Pajak
CREATE TABLE tax_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- 0.1100 untuk PPN 11%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tax_groups IS 'Grup pajak (PPN, Non-Taxable, dll)';
COMMENT ON COLUMN tax_groups.rate IS 'Tarif pajak dalam desimal (0.1100 = 11%)';

-- Tabel Produk
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    tax_group_id UUID REFERENCES tax_groups(id),
    cost INTEGER DEFAULT 0, -- Harga pokok dalam Rupiah
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Data produk';
COMMENT ON COLUMN products.cost IS 'Harga pokok dalam Rupiah (integer)';

-- Tabel Harga Produk
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_level VARCHAR(50) DEFAULT 'default',
    branch_id UUID REFERENCES branches(id), -- NULL = berlaku untuk semua cabang
    price INTEGER NOT NULL, -- Harga jual dalam Rupiah
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE product_prices IS 'Harga jual produk per level dan cabang';
COMMENT ON COLUMN product_prices.price IS 'Harga jual dalam Rupiah (integer)';

-- ======================================================================
-- TABEL PELANGGAN DAN PEMASOK
-- ======================================================================

-- Tabel Pelanggan
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50), -- NPWP
    credit_limit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customers IS 'Data pelanggan';
COMMENT ON COLUMN customers.credit_limit IS 'Limit kredit dalam Rupiah';

-- Tabel Pemasok
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50), -- NPWP
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Data pemasok';

-- ======================================================================
-- TABEL PERSEDIAAN/STOK
-- ======================================================================

-- Tabel Stok per Cabang
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0, -- Stok yang direservasi
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, branch_id)
);

COMMENT ON TABLE stocks IS 'Stok produk per cabang';
COMMENT ON COLUMN stocks.reserved_quantity IS 'Jumlah stok yang direservasi';

-- Enable RLS untuk stocks
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Tabel Mutasi Stok
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjust', 'transfer_in', 'transfer_out')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'pos_order', 'purchase', 'adjustment', 'transfer'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stock_movements IS 'Riwayat mutasi stok';
COMMENT ON COLUMN stock_movements.movement_type IS 'Jenis mutasi: in, out, adjust, transfer_in, transfer_out';

-- Enable RLS untuk stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ======================================================================
-- TABEL POS (POINT OF SALE)
-- ======================================================================

-- Sequence untuk nomor transaksi
CREATE SEQUENCE pos_order_seq START 1;
CREATE SEQUENCE session_seq START 1;

-- Tabel Sesi Kasir
CREATE TABLE pos_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_no VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    opening_cash INTEGER NOT NULL DEFAULT 0, -- Kas awal dalam Rupiah
    closed_at TIMESTAMPTZ,
    closing_cash INTEGER DEFAULT 0, -- Kas akhir dalam Rupiah
    expected_cash INTEGER DEFAULT 0, -- Kas yang seharusnya
    cash_difference INTEGER DEFAULT 0, -- Selisih kas
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pos_sessions IS 'Sesi kasir (buka/tutup shift)';
COMMENT ON COLUMN pos_sessions.opening_cash IS 'Kas awal dalam Rupiah';
COMMENT ON COLUMN pos_sessions.closing_cash IS 'Kas akhir dalam Rupiah';
COMMENT ON COLUMN pos_sessions.cash_difference IS 'Selisih kas (closing - expected)';

-- Enable RLS untuk pos_sessions
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;

-- Tabel Transaksi POS
CREATE TABLE pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(50) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    session_id UUID REFERENCES pos_sessions(id),
    customer_id UUID REFERENCES customers(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'void', 'refund')),
    subtotal INTEGER NOT NULL DEFAULT 0, -- Subtotal dalam Rupiah
    discount_amount INTEGER DEFAULT 0, -- Diskon dalam Rupiah
    tax_amount INTEGER DEFAULT 0, -- PPN dalam Rupiah
    rounding_amount INTEGER DEFAULT 0, -- Pembulatan dalam Rupiah
    total INTEGER NOT NULL DEFAULT 0, -- Total akhir dalam Rupiah
    paid_total INTEGER DEFAULT 0, -- Total dibayar dalam Rupiah
    change_amount INTEGER DEFAULT 0, -- Kembalian dalam Rupiah
    notes TEXT,
    paid_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES users(id),
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pos_orders IS 'Transaksi kasir (struk)';
COMMENT ON COLUMN pos_orders.order_no IS 'Nomor struk/transaksi';
COMMENT ON COLUMN pos_orders.subtotal IS 'Subtotal dalam Rupiah';
COMMENT ON COLUMN pos_orders.total IS 'Total akhir dalam Rupiah';
COMMENT ON COLUMN pos_orders.rounding_amount IS 'Pembulatan dalam Rupiah';

-- Enable RLS untuk pos_orders
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;

-- Tabel Item Transaksi POS
CREATE TABLE pos_order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL, -- Harga satuan dalam Rupiah
    discount_amount INTEGER DEFAULT 0, -- Diskon item dalam Rupiah
    tax_amount INTEGER DEFAULT 0, -- PPN item dalam Rupiah
    line_total INTEGER GENERATED ALWAYS AS ((quantity * price) - discount_amount + tax_amount) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pos_order_lines IS 'Item transaksi kasir';
COMMENT ON COLUMN pos_order_lines.price IS 'Harga satuan dalam Rupiah';
COMMENT ON COLUMN pos_order_lines.line_total IS 'Total baris (otomatis dihitung)';

-- Tabel Pembayaran
CREATE TABLE pos_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'ewallet', 'transfer', 'voucher')),
    amount INTEGER NOT NULL, -- Jumlah bayar dalam Rupiah
    reference VARCHAR(100), -- Nomor referensi (untuk non-cash)
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pos_payments IS 'Pembayaran transaksi';
COMMENT ON COLUMN pos_payments.amount IS 'Jumlah bayar dalam Rupiah';

-- ======================================================================
-- FUNGSI HELPER
-- ======================================================================

-- Fungsi untuk generate nomor transaksi
CREATE OR REPLACE FUNCTION generate_order_no(branch_code TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    seq_num INTEGER;
    date_part TEXT;
BEGIN
    seq_num := nextval('pos_order_seq');
    date_part := to_char(NOW(), 'YYYYMMDD');
    RETURN branch_code || '-' || prefix || '-' || date_part || '-' || lpad(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_no IS 'Generate nomor transaksi: CABANG-PREFIX-YYYYMMDD-XXXXXX';

-- Fungsi untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- TRIGGER UNTUK AUTO UPDATE updated_at
-- ======================================================================

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================================================
-- INDEKS UNTUK PERFORMA
-- ======================================================================

-- Indeks untuk pencarian produk
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_barcode ON products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_active ON products (is_active);

-- Indeks untuk transaksi
CREATE INDEX idx_pos_orders_created_at_branch ON pos_orders (created_at, branch_id);
CREATE INDEX idx_pos_orders_status ON pos_orders (status);
CREATE INDEX idx_pos_orders_cashier ON pos_orders (cashier_id);
CREATE INDEX idx_pos_orders_session ON pos_orders (session_id);

-- Indeks untuk item transaksi
CREATE INDEX idx_pos_order_lines_order ON pos_order_lines (order_id);
CREATE INDEX idx_pos_order_lines_product ON pos_order_lines (product_id);

-- Indeks untuk mutasi stok
CREATE INDEX idx_stock_movements_product_created_branch ON stock_movements (product_id, created_at, branch_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements (reference_type, reference_id);

-- Indeks untuk pelanggan
CREATE INDEX idx_customers_phone ON customers (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);

-- ======================================================================
-- ROW LEVEL SECURITY POLICIES
-- ======================================================================

-- Policy untuk branches
CREATE POLICY branches_branch_policy ON branches
    FOR ALL TO authenticated_users
    USING (id IN (SELECT branch_id FROM user_roles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- Policy untuk stocks
CREATE POLICY stocks_branch_policy ON stocks
    FOR ALL TO authenticated_users
    USING (branch_id IN (SELECT branch_id FROM user_roles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- Policy untuk stock_movements
CREATE POLICY stock_movements_branch_policy ON stock_movements
    FOR ALL TO authenticated_users
    USING (branch_id IN (SELECT branch_id FROM user_roles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- Policy untuk pos_orders
CREATE POLICY pos_orders_branch_policy ON pos_orders
    FOR ALL TO authenticated_users
    USING (branch_id IN (SELECT branch_id FROM user_roles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- Policy untuk pos_sessions
CREATE POLICY pos_sessions_branch_policy ON pos_sessions
    FOR ALL TO authenticated_users
    USING (branch_id IN (SELECT branch_id FROM user_roles WHERE user_id = current_setting('app.current_user_id')::UUID));

-- ======================================================================
-- VIEW BERBAHASA INDONESIA
-- ======================================================================

-- VIEW Transaksi (Ringkasan per Struk)
CREATE VIEW vw_transaksi AS
SELECT 
    o.id as id_transaksi,
    o.order_no as nomor_struk,
    o.created_at AT TIME ZONE 'Asia/Jakarta' as tanggal_wib,
    b.name as cabang,
    u.full_name as kasir,
    CASE o.status 
        WHEN 'paid' THEN 'Lunas'
        WHEN 'void' THEN 'Batal'
        WHEN 'refund' THEN 'Retur'
        WHEN 'draft' THEN 'Draft'
        ELSE o.status
    END as status,
    o.subtotal as subtotal_rp,
    o.discount_amount as diskon_rp,
    o.tax_amount as ppn_rp,
    o.rounding_amount as pembulatan_rp,
    o.total as total_rp,
    o.paid_total as bayar_rp,
    o.change_amount as kembali_rp,
    (
        SELECT string_agg(DISTINCT pm.payment_method, ', ')
        FROM pos_payments pm 
        WHERE pm.order_id = o.id
    ) as metode_bayar,
    c.name as pelanggan
FROM pos_orders o
JOIN branches b ON o.branch_id = b.id
JOIN users u ON o.cashier_id = u.id
LEFT JOIN customers c ON o.customer_id = c.id;

COMMENT ON VIEW vw_transaksi IS 'Ringkasan transaksi/struk dalam Bahasa Indonesia (WIB, Rupiah)';

-- VIEW Item Transaksi
CREATE VIEW vw_transaksi_item AS
SELECT 
    o.id as id_transaksi,
    o.order_no as nomor_struk,
    o.created_at AT TIME ZONE 'Asia/Jakarta' as tanggal_wib,
    p.sku,
    p.barcode,
    p.name as nama_produk,
    ol.quantity as qty,
    ol.price as harga_satuan_rp,
    ol.discount_amount as diskon_item_rp,
    ol.tax_amount as ppn_item_rp,
    ol.line_total as subtotal_item_rp,
    b.name as cabang,
    u.full_name as kasir
FROM pos_order_lines ol
JOIN pos_orders o ON ol.order_id = o.id
JOIN products p ON ol.product_id = p.id
JOIN branches b ON o.branch_id = b.id
JOIN users u ON o.cashier_id = u.id;

COMMENT ON VIEW vw_transaksi_item IS 'Detail item transaksi dalam Bahasa Indonesia';

-- VIEW Produk
CREATE VIEW vw_produk AS
SELECT 
    p.id as id_produk,
    p.sku,
    p.barcode,
    p.name as nama,
    c.name as kategori,
    b.name as merek,
    u.name as satuan,
    tg.name as grup_pajak,
    tg.rate as tarif_pajak,
    p.cost as harga_pokok_rp,
    (
        SELECT pp.price 
        FROM product_prices pp 
        WHERE pp.product_id = p.id 
        AND pp.is_active = true 
        AND pp.price_level = 'default'
        AND (pp.effective_to IS NULL OR pp.effective_to > NOW())
        ORDER BY pp.effective_from DESC 
        LIMIT 1
    ) as harga_jual_aktif_rp,
    (
        SELECT COALESCE(SUM(s.quantity), 0)
        FROM stocks s 
        WHERE s.product_id = p.id
    ) as stok_tersedia,
    CASE WHEN p.is_active THEN 'Aktif' ELSE 'Nonaktif' END as status_aktif
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
JOIN units u ON p.unit_id = u.id
LEFT JOIN tax_groups tg ON p.tax_group_id = tg.id;

COMMENT ON VIEW vw_produk IS 'Katalog produk dengan harga aktif dan stok dalam Bahasa Indonesia';

-- VIEW Mutasi Stok
CREATE VIEW vw_mutasi_stok AS
SELECT 
    sm.created_at AT TIME ZONE 'Asia/Jakarta' as tanggal_wib,
    p.name as produk,
    p.sku,
    b.name as cabang,
    CASE sm.movement_type
        WHEN 'in' THEN 'Masuk'
        WHEN 'out' THEN 'Keluar'
        WHEN 'adjust' THEN 'Penyesuaian'
        WHEN 'transfer_in' THEN 'Transfer Masuk'
        WHEN 'transfer_out' THEN 'Transfer Keluar'
        ELSE sm.movement_type
    END as jenis_mutasi,
    sm.quantity as qty,
    sm.reference_type as tipe_referensi,
    sm.reference_id as id_referensi,
    sm.notes as keterangan,
    u.full_name as dibuat_oleh
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN branches b ON sm.branch_id = b.id
LEFT JOIN users u ON sm.created_by = u.id;

COMMENT ON VIEW vw_mutasi_stok IS 'Riwayat mutasi stok dalam Bahasa Indonesia';

-- VIEW Shift Kasir
CREATE VIEW vw_shift_kasir AS
SELECT 
    ps.id as id_shift,
    ps.session_no as nomor_sesi,
    b.name as cabang,
    u.full_name as kasir,
    ps.opened_at AT TIME ZONE 'Asia/Jakarta' as buka_pada_wib,
    ps.closed_at AT TIME ZONE 'Asia/Jakarta' as tutup_pada_wib,
    ps.opening_cash as kas_awal_rp,
    ps.closing_cash as kas_akhir_rp,
    ps.expected_cash as kas_seharusnya_rp,
    ps.cash_difference as selisih_kas_rp,
    (
        SELECT COALESCE(SUM(pp.amount), 0)
        FROM pos_payments pp
        JOIN pos_orders po ON pp.order_id = po.id
        WHERE po.session_id = ps.id AND pp.payment_method = 'cash'
    ) as penjualan_tunai_rp,
    (
        SELECT COALESCE(SUM(pp.amount), 0)
        FROM pos_payments pp
        JOIN pos_orders po ON pp.order_id = po.id
        WHERE po.session_id = ps.id AND pp.payment_method != 'cash'
    ) as penjualan_non_tunai_rp,
    CASE ps.status
        WHEN 'open' THEN 'Buka'
        WHEN 'closed' THEN 'Tutup'
        ELSE ps.status
    END as status
FROM pos_sessions ps
JOIN branches b ON ps.branch_id = b.id
JOIN users u ON ps.cashier_id = u.id;

COMMENT ON VIEW vw_shift_kasir IS 'Ringkasan sesi kasir dalam Bahasa Indonesia';

-- ======================================================================
-- DATA AWAL (SEED DATA)
-- ======================================================================

-- Insert perusahaan default
INSERT INTO companies (id, code, name, address, phone, email) VALUES 
('00000000-0000-0000-0000-000000000001', 'MAIN', 'PT. Contoh Retail Indonesia', 'Jakarta, Indonesia', '021-12345678', 'info@contohretail.co.id');

-- Insert cabang default
INSERT INTO branches (id, company_id, code, name, address, phone) VALUES 
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'JKT01', 'Toko Jakarta Pusat', 'Jakarta Pusat, DKI Jakarta', '021-87654321');

-- Insert roles
INSERT INTO roles (id, name, description) VALUES 
('00000000-0000-0000-0000-000000000003', 'Super Admin', 'Administrator sistem dengan akses penuh'),
('00000000-0000-0000-0000-000000000004', 'Manajer Cabang', 'Manajer cabang dengan akses laporan dan pengaturan'),
('00000000-0000-0000-0000-000000000005', 'Kasir', 'Kasir dengan akses transaksi POS'),
('00000000-0000-0000-0000-000000000006', 'Staff Gudang', 'Staff gudang dengan akses persediaan'),
('00000000-0000-0000-0000-000000000007', 'Akuntan', 'Akuntan dengan akses laporan keuangan');

-- Insert permissions
INSERT INTO permissions (id, name, description, module) VALUES 
('00000000-0000-0000-0000-000000000008', 'pos.create', 'Membuat transaksi POS', 'pos'),
('00000000-0000-0000-0000-000000000009', 'pos.void', 'Membatalkan transaksi POS', 'pos'),
('00000000-0000-0000-0000-00000000000a', 'pos.refund', 'Melakukan retur transaksi', 'pos'),
('00000000-0000-0000-0000-00000000000b', 'inventory.manage', 'Mengelola persediaan', 'inventory'),
('00000000-0000-0000-0000-00000000000c', 'reports.view', 'Melihat laporan', 'reports'),
('00000000-0000-0000-0000-00000000000d', 'users.manage', 'Mengelola pengguna', 'users'),
('00000000-0000-0000-0000-00000000000e', 'products.manage', 'Mengelola produk', 'products');

-- Insert admin user (password: admin123)
INSERT INTO users (id, username, email, full_name, password_hash) VALUES 
('00000000-0000-0000-0000-00000000000f', 'admin', 'admin@contohretail.co.id', 'Administrator', '$2b$10$rQZ8vQZ8vQZ8vQZ8vQZ8vOZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQ');

-- Assign admin role
INSERT INTO user_roles (user_id, role_id, branch_id) VALUES 
('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002');

-- Insert units
INSERT INTO units (id, name, symbol, description) VALUES 
('00000000-0000-0000-0000-000000000010', 'Pieces', 'PCS', 'Satuan buah/unit'),
('00000000-0000-0000-0000-000000000011', 'Kilogram', 'KG', 'Satuan berat kilogram'),
('00000000-0000-0000-0000-000000000012', 'Liter', 'LTR', 'Satuan volume liter'),
('00000000-0000-0000-0000-000000000013', 'Box', 'BOX', 'Satuan kotak/dus'),
('00000000-0000-0000-0000-000000000014', 'Set', 'SET', 'Satuan set/paket');

-- Insert tax groups
INSERT INTO tax_groups (id, name, rate) VALUES 
('00000000-0000-0000-0000-000000000015', 'PPN 11%', 0.1100),
('00000000-0000-0000-0000-000000000016', 'Non-Taxable', 0.0000);

-- Insert categories
INSERT INTO categories (id, name, description) VALUES 
('00000000-0000-0000-0000-000000000017', 'Makanan & Minuman', 'Produk makanan dan minuman'),
('00000000-0000-0000-0000-000000000018', 'Elektronik', 'Produk elektronik dan gadget'),
('00000000-0000-0000-0000-000000000019', 'Pakaian', 'Produk pakaian dan fashion'),
('00000000-0000-0000-0000-00000000001a', 'Kesehatan & Kecantikan', 'Produk kesehatan dan kecantikan'),
('00000000-0000-0000-0000-00000000001b', 'Rumah Tangga', 'Produk keperluan rumah tangga');

-- Insert default customer
INSERT INTO customers (id, code, name, phone) VALUES 
('00000000-0000-0000-0000-00000000001c', 'UMUM', 'Pelanggan Umum', NULL);

-- ======================================================================
-- SELESAI
-- ======================================================================

-- Tampilkan informasi koneksi
SELECT 'Database POS berhasil dibuat!' as status,
       'Gunakan: SET LOCAL app.current_user_id = ''00000000-0000-0000-0000-00000000000f'';' as catatan_rls,
       'Username: admin, Password: admin123' as login_default;