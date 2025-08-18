// ======================================================================
// HALAMAN SETTINGS
// Pengaturan sistem dan konfigurasi aplikasi
// ======================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Title1,
  Title2,
  Title3,
  Body1,
  Badge,
  Spinner,
  Input,
  Dropdown,
  Option,
  Field,
  Textarea,
  Switch,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Slider,
  SpinButton,
  Checkbox,
  Radio,
  RadioGroup,
  Link,
  Image
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Save24Regular,
  Building24Regular,
  Receipt24Regular,
  Money24Regular,
  Print24Regular,
  Database24Regular,
  Shield24Regular,
  Person24Regular,
  Alert24Regular,
  Color24Regular,
  Globe24Regular,
  Clock24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Info24Regular,
  ArrowUpload24Regular,
  Delete24Regular
} from '@fluentui/react-icons';
import { useAuth } from '@/lib/auth/use-auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website?: string;
  tax_id: string;
  logo?: string;
  description?: string;
}

interface POSSettings {
  default_payment_method: string;
  auto_print_receipt: boolean;
  receipt_template: string;
  barcode_scanner_enabled: boolean;
  cash_drawer_enabled: boolean;
  customer_display_enabled: boolean;
  sound_enabled: boolean;
  auto_logout_minutes: number;
  default_tax_rate: number;
  currency_symbol: string;
  decimal_places: number;
}

interface PrinterSettings {
  receipt_printer: string;
  label_printer: string;
  receipt_width: number;
  print_logo: boolean;
  print_footer: boolean;
  footer_text: string;
  copies_count: number;
}

interface SystemSettings {
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  theme: 'light' | 'dark' | 'auto';
  auto_backup: boolean;
  backup_frequency: string;
  max_backup_files: number;
  session_timeout: number;
}

interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  max_login_attempts: number;
  lockout_duration: number;
  two_factor_enabled: boolean;
  audit_log_enabled: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  low_stock_alerts: boolean;
  daily_sales_report: boolean;
  weekly_summary: boolean;
  system_alerts: boolean;
  notification_email: string;
  notification_phone: string;
}

interface BranchSettings {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
  opening_hours: string;
  closing_hours: string;
}

interface UserSettings {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  branch_id: string;
  status: 'active' | 'inactive';
  last_login?: string;
  permissions: string[];
}

interface RoleSettings {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
}

interface AllSettings {
  company: CompanySettings;
  pos: POSSettings;
  printer: PrinterSettings;
  system: SystemSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  branches: BranchSettings[];
  users: UserSettings[];
  roles: RoleSettings[];
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockSettings: AllSettings = {
  company: {
    name: 'Toko Serbaguna Maju Jaya',
    address: 'Jl. Merdeka No. 123',
    city: 'Jakarta',
    postal_code: '12345',
    phone: '021-12345678',
    email: 'info@tokoserbaguna.com',
    website: 'www.tokoserbaguna.com',
    tax_id: '01.234.567.8-901.000',
    description: 'Toko serbaguna yang melayani kebutuhan sehari-hari'
  },
  pos: {
    default_payment_method: 'cash',
    auto_print_receipt: true,
    receipt_template: 'standard',
    barcode_scanner_enabled: true,
    cash_drawer_enabled: true,
    customer_display_enabled: false,
    sound_enabled: true,
    auto_logout_minutes: 30,
    default_tax_rate: 11,
    currency_symbol: 'Rp',
    decimal_places: 0
  },
  printer: {
    receipt_printer: 'EPSON TM-T82',
    label_printer: 'Brother QL-800',
    receipt_width: 80,
    print_logo: true,
    print_footer: true,
    footer_text: 'Terima kasih atas kunjungan Anda!',
    copies_count: 1
  },
  system: {
    language: 'id',
    timezone: 'Asia/Jakarta',
    date_format: 'dd/MM/yyyy',
    time_format: '24h',
    theme: 'light',
    auto_backup: true,
    backup_frequency: 'daily',
    max_backup_files: 30,
    session_timeout: 60
  },
  security: {
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    max_login_attempts: 5,
    lockout_duration: 15,
    two_factor_enabled: false,
    audit_log_enabled: true
  },
  notifications: {
    email_notifications: true,
    sms_notifications: false,
    low_stock_alerts: true,
    daily_sales_report: true,
    weekly_summary: true,
    system_alerts: true,
    notification_email: 'admin@tokoserbaguna.com',
    notification_phone: '081234567890'
  },
  branches: [
    {
      id: '1',
      name: 'Cabang Utama',
      code: 'MAIN',
      address: 'Jl. Merdeka No. 123',
      city: 'Jakarta',
      phone: '021-12345678',
      manager: 'Ahmad Manager',
      status: 'active',
      opening_hours: '08:00',
      closing_hours: '22:00'
    },
    {
      id: '2',
      name: 'Cabang Bekasi',
      code: 'BKS',
      address: 'Jl. Raya Bekasi No. 456',
      city: 'Bekasi',
      phone: '021-87654321',
      manager: 'Siti Manager',
      status: 'active',
      opening_hours: '09:00',
      closing_hours: '21:00'
    },
    {
      id: '3',
      name: 'Cabang Depok',
      code: 'DPK',
      address: 'Jl. Margonda Raya No. 789',
      city: 'Depok',
      phone: '021-11223344',
      manager: 'Budi Manager',
      status: 'active',
      opening_hours: '08:30',
      closing_hours: '21:30'
    }
  ],
  users: [
    {
      id: '1',
      username: 'admin',
      full_name: 'Administrator',
      email: 'admin@tokoserbaguna.com',
      phone: '081234567890',
      role: 'Super Admin',
      branch_id: '1',
      status: 'active',
      last_login: '2024-01-15 10:30:00',
      permissions: ['*']
    },
    {
      id: '2',
      username: 'manager1',
      full_name: 'Ahmad Manager',
      email: 'ahmad@tokoserbaguna.com',
      phone: '081234567891',
      role: 'Manager',
      branch_id: '1',
      status: 'active',
      last_login: '2024-01-15 09:15:00',
      permissions: ['sales.*', 'inventory.*', 'reports.read']
    },
    {
      id: '3',
      username: 'kasir1',
      full_name: 'Siti Kasir',
      email: 'siti@tokoserbaguna.com',
      phone: '081234567892',
      role: 'Kasir',
      branch_id: '1',
      status: 'active',
      last_login: '2024-01-15 08:00:00',
      permissions: ['sales.create', 'sales.read', 'customers.read']
    }
  ],
  roles: [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Akses penuh ke semua fitur sistem',
      permissions: ['*'],
      is_system: true
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Akses manajemen cabang dan laporan',
      permissions: ['sales.*', 'inventory.*', 'customers.*', 'reports.read', 'settings.read'],
      is_system: false
    },
    {
      id: '3',
      name: 'Kasir',
      description: 'Akses penjualan dan pelanggan',
      permissions: ['sales.create', 'sales.read', 'customers.read', 'customers.create'],
      is_system: false
    },
    {
      id: '4',
      name: 'Gudang',
      description: 'Akses manajemen inventori',
      permissions: ['inventory.*', 'products.read'],
      is_system: false
    }
  ]
};

// ======================================================================
// STYLES
// ======================================================================

const styles = {
  container: 'space-y-6',
  header: 'flex items-center justify-between',
  tabsContainer: 'w-full',
  settingsGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  settingsCard: 'p-6',
  fieldGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  actionButtons: 'flex items-center gap-2 justify-end',
  logoUpload: 'flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg'
};

// ======================================================================
// MAIN COMPONENT
// ======================================================================

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<string>('company');
  const [settings, setSettings] = useState<AllSettings>(mockSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  const handleSettingChange = (section: keyof AllSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving settings:', settings);
      
      setHasChanges(false);
      setSaveMessage('Pengaturan berhasil disimpan!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Gagal menyimpan pengaturan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(mockSettings);
    setHasChanges(false);
    setSaveMessage(null);
  };

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderCompanySettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Building24Regular />
          Informasi Perusahaan
        </Title3>
        
        <div className="space-y-4">
          <Field label="Nama Perusahaan" required>
            <Input
              value={settings.company.name}
              onChange={(e) => handleSettingChange('company', 'name', e.target.value)}
              placeholder="Masukkan nama perusahaan"
            />
          </Field>
          
          <Field label="Alamat" required>
            <Textarea
              value={settings.company.address}
              onChange={(e) => handleSettingChange('company', 'address', e.target.value)}
              placeholder="Masukkan alamat lengkap"
              rows={3}
            />
          </Field>
          
          <div className={styles.fieldGrid}>
            <Field label="Kota">
              <Input
                value={settings.company.city}
                onChange={(e) => handleSettingChange('company', 'city', e.target.value)}
                placeholder="Kota"
              />
            </Field>
            
            <Field label="Kode Pos">
              <Input
                value={settings.company.postal_code}
                onChange={(e) => handleSettingChange('company', 'postal_code', e.target.value)}
                placeholder="12345"
              />
            </Field>
          </div>
          
          <div className={styles.fieldGrid}>
            <Field label="Telepon">
              <Input
                value={settings.company.phone}
                onChange={(e) => handleSettingChange('company', 'phone', e.target.value)}
                placeholder="021-12345678"
              />
            </Field>
            
            <Field label="Email">
              <Input
                type="email"
                value={settings.company.email}
                onChange={(e) => handleSettingChange('company', 'email', e.target.value)}
                placeholder="info@perusahaan.com"
              />
            </Field>
          </div>
          
          <div className={styles.fieldGrid}>
            <Field label="Website">
              <Input
                value={settings.company.website || ''}
                onChange={(e) => handleSettingChange('company', 'website', e.target.value)}
                placeholder="www.perusahaan.com"
              />
            </Field>
            
            <Field label="NPWP">
              <Input
                value={settings.company.tax_id}
                onChange={(e) => handleSettingChange('company', 'tax_id', e.target.value)}
                placeholder="01.234.567.8-901.000"
              />
            </Field>
          </div>
          
          <Field label="Deskripsi">
            <Textarea
              value={settings.company.description || ''}
              onChange={(e) => handleSettingChange('company', 'description', e.target.value)}
              placeholder="Deskripsi singkat tentang perusahaan"
              rows={2}
            />
          </Field>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4">Logo Perusahaan</Title3>
        
        <div className={styles.logoUpload}>
          <div className="flex-1">
            <Text weight="semibold">Upload Logo</Text>
            <Text size={200} className="text-gray-600 block mt-1">
              Format: PNG, JPG, SVG (Max: 2MB)
            </Text>
            <Text size={200} className="text-gray-600">
              Ukuran optimal: 200x200px
            </Text>
          </div>
          <Button
            appearance="outline"
            icon={<ArrowUpload24Regular />}
          >
            Pilih File
          </Button>
        </div>
        
        {settings.company.logo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building24Regular className="text-gray-500" />
                </div>
                <div>
                  <Text weight="semibold">logo-perusahaan.png</Text>
                  <Text size={200} className="text-gray-600">156 KB</Text>
                </div>
              </div>
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                onClick={() => handleSettingChange('company', 'logo', undefined)}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderBranchSettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Building24Regular />
          Manajemen Cabang
        </Title3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Body1>Kelola cabang dan lokasi toko</Body1>
            <Button appearance="primary" size="small">
              Tambah Cabang
            </Button>
          </div>
          
          <div className="space-y-3">
            {settings.branches.map((branch) => (
              <Card key={branch.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text weight="semibold">{branch.name}</Text>
                      <Badge 
                        appearance={branch.status === 'active' ? 'filled' : 'outline'}
                        color={branch.status === 'active' ? 'success' : 'danger'}
                      >
                        {branch.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <Text size={200} className="text-gray-600 block">
                      Kode: {branch.code} | Manager: {branch.manager}
                    </Text>
                    <Text size={200} className="text-gray-600 block">
                      {branch.address}, {branch.city}
                    </Text>
                    <Text size={200} className="text-gray-600 block">
                      Jam: {branch.opening_hours} - {branch.closing_hours} | Tel: {branch.phone}
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" appearance="outline">
                      Edit
                    </Button>
                    <Button size="small" appearance="outline" icon={<Delete24Regular />}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderUserSettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Person24Regular />
          Manajemen Pengguna
        </Title3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Body1>Kelola pengguna dan akses sistem</Body1>
            <Button appearance="primary" size="small">
              Tambah Pengguna
            </Button>
          </div>
          
          <div className="space-y-3">
            {settings.users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text weight="semibold">{user.full_name}</Text>
                      <Badge 
                        appearance={user.status === 'active' ? 'filled' : 'outline'}
                        color={user.status === 'active' ? 'success' : 'danger'}
                      >
                        {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <Text size={200} className="text-gray-600 block">
                      Username: {user.username} | Role: {user.role}
                    </Text>
                    <Text size={200} className="text-gray-600 block">
                      Email: {user.email} | Phone: {user.phone}
                    </Text>
                    <Text size={200} className="text-gray-600 block">
                      Cabang: {settings.branches.find(b => b.id === user.branch_id)?.name}
                    </Text>
                    {user.last_login && (
                      <Text size={200} className="text-gray-600 block">
                        Login terakhir: {user.last_login}
                      </Text>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" appearance="outline">
                      Edit
                    </Button>
                    <Button size="small" appearance="outline" icon={<Delete24Regular />}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Shield24Regular />
          Manajemen Peran
        </Title3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Body1>Kelola peran dan hak akses</Body1>
            <Button appearance="primary" size="small">
              Tambah Peran
            </Button>
          </div>
          
          <div className="space-y-3">
            {settings.roles.map((role) => (
              <Card key={role.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text weight="semibold">{role.name}</Text>
                      {role.is_system && (
                        <Badge appearance="filled" color="brand">
                          Sistem
                        </Badge>
                      )}
                    </div>
                    <Text size={200} className="text-gray-600 block mb-2">
                      {role.description}
                    </Text>
                    <Text size={200} className="text-gray-600">
                      Permissions: {role.permissions.join(', ')}
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" appearance="outline" disabled={role.is_system}>
                      Edit
                    </Button>
                    <Button size="small" appearance="outline" icon={<Delete24Regular />} disabled={role.is_system}>
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderPOSSettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Receipt24Regular />
          Pengaturan Kasir
        </Title3>
        
        <div className="space-y-4">
          <Field label="Metode Pembayaran Default">
            <Dropdown
              value={settings.pos.default_payment_method}
              onOptionSelect={(e, data) => handleSettingChange('pos', 'default_payment_method', data.optionValue)}
            >
              <Option value="cash">Tunai</Option>
              <Option value="card">Kartu</Option>
              <Option value="qris">QRIS</Option>
              <Option value="transfer">Transfer Bank</Option>
            </Dropdown>
          </Field>
          
          <Field label="Template Struk">
            <Dropdown
              value={settings.pos.receipt_template}
              onOptionSelect={(e, data) => handleSettingChange('pos', 'receipt_template', data.optionValue)}
            >
              <Option value="standard">Standard</Option>
              <Option value="compact">Compact</Option>
              <Option value="detailed">Detailed</Option>
            </Dropdown>
          </Field>
          
          <div className={styles.fieldGrid}>
            <Field label="Tarif Pajak Default (%)">
              <SpinButton
                value={settings.pos.default_tax_rate}
                onChange={(e, data) => handleSettingChange('pos', 'default_tax_rate', data.value || 0)}
                min={0}
                max={100}
                step={0.5}
              />
            </Field>
            
            <Field label="Auto Logout (menit)">
              <SpinButton
                value={settings.pos.auto_logout_minutes}
                onChange={(e, data) => handleSettingChange('pos', 'auto_logout_minutes', data.value || 30)}
                min={5}
                max={120}
                step={5}
              />
            </Field>
          </div>
          
          <div className={styles.fieldGrid}>
            <Field label="Simbol Mata Uang">
              <Input
                value={settings.pos.currency_symbol}
                onChange={(e) => handleSettingChange('pos', 'currency_symbol', e.target.value)}
                placeholder="Rp"
              />
            </Field>
            
            <Field label="Desimal">
              <SpinButton
                value={settings.pos.decimal_places}
                onChange={(e, data) => handleSettingChange('pos', 'decimal_places', data.value || 0)}
                min={0}
                max={4}
              />
            </Field>
          </div>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4">Fitur Kasir</Title3>
        
        <div className="space-y-4">
          <Field>
            <Switch
              checked={settings.pos.auto_print_receipt}
              onChange={(e, data) => handleSettingChange('pos', 'auto_print_receipt', data.checked)}
              label="Auto Print Struk"
            />
          </Field>
          
          <Field>
            <Switch
              checked={settings.pos.barcode_scanner_enabled}
              onChange={(e, data) => handleSettingChange('pos', 'barcode_scanner_enabled', data.checked)}
              label="Barcode Scanner"
            />
          </Field>
          
          <Field>
            <Switch
              checked={settings.pos.cash_drawer_enabled}
              onChange={(e, data) => handleSettingChange('pos', 'cash_drawer_enabled', data.checked)}
              label="Cash Drawer"
            />
          </Field>
          
          <Field>
            <Switch
              checked={settings.pos.customer_display_enabled}
              onChange={(e, data) => handleSettingChange('pos', 'customer_display_enabled', data.checked)}
              label="Customer Display"
            />
          </Field>
          
          <Field>
            <Switch
              checked={settings.pos.sound_enabled}
              onChange={(e, data) => handleSettingChange('pos', 'sound_enabled', data.checked)}
              label="Suara Notifikasi"
            />
          </Field>
        </div>
      </Card>
    </div>
  );

  const renderPrinterSettings = () => (
    <Card className={styles.settingsCard}>
      <Title3 className="mb-4 flex items-center gap-2">
        <Print24Regular />
        Pengaturan Printer
      </Title3>
      
      <div className="space-y-4">
        <div className={styles.fieldGrid}>
          <Field label="Printer Struk">
            <Dropdown
              value={settings.printer.receipt_printer}
              onOptionSelect={(e, data) => handleSettingChange('printer', 'receipt_printer', data.optionValue)}
            >
              <Option value="EPSON TM-T82">EPSON TM-T82</Option>
              <Option value="EPSON TM-T88V">EPSON TM-T88V</Option>
              <Option value="Star TSP143">Star TSP143</Option>
              <Option value="Bixolon SRP-350">Bixolon SRP-350</Option>
            </Dropdown>
          </Field>
          
          <Field label="Printer Label">
            <Dropdown
              value={settings.printer.label_printer}
              onOptionSelect={(e, data) => handleSettingChange('printer', 'label_printer', data.optionValue)}
            >
              <Option value="Brother QL-800">Brother QL-800</Option>
              <Option value="Brother QL-820NWB">Brother QL-820NWB</Option>
              <Option value="DYMO LabelWriter">DYMO LabelWriter</Option>
            </Dropdown>
          </Field>
        </div>
        
        <div className={styles.fieldGrid}>
          <Field label="Lebar Struk (mm)">
            <Dropdown
              value={settings.printer.receipt_width.toString()}
              onOptionSelect={(e, data) => handleSettingChange('printer', 'receipt_width', parseInt(data.optionValue || '80'))}
            >
              <Option value="58">58mm</Option>
              <Option value="80">80mm</Option>
            </Dropdown>
          </Field>
          
          <Field label="Jumlah Copy">
            <SpinButton
              value={settings.printer.copies_count}
              onChange={(e, data) => handleSettingChange('printer', 'copies_count', data.value || 1)}
              min={1}
              max={5}
            />
          </Field>
        </div>
        
        <Field label="Footer Struk">
          <Textarea
            value={settings.printer.footer_text}
            onChange={(e) => handleSettingChange('printer', 'footer_text', e.target.value)}
            placeholder="Terima kasih atas kunjungan Anda!"
            rows={2}
          />
        </Field>
        
        <div className="space-y-3">
          <Field>
            <Switch
              checked={settings.printer.print_logo}
              onChange={(e, data) => handleSettingChange('printer', 'print_logo', data.checked)}
              label="Cetak Logo di Struk"
            />
          </Field>
          
          <Field>
            <Switch
              checked={settings.printer.print_footer}
              onChange={(e, data) => handleSettingChange('printer', 'print_footer', data.checked)}
              label="Cetak Footer di Struk"
            />
          </Field>
        </div>
      </div>
    </Card>
  );

  const renderSystemSettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Globe24Regular />
          Pengaturan Regional
        </Title3>
        
        <div className="space-y-4">
          <Field label="Bahasa">
            <Dropdown
              value={settings.system.language}
              onOptionSelect={(e, data) => handleSettingChange('system', 'language', data.optionValue)}
            >
              <Option value="id">Bahasa Indonesia</Option>
              <Option value="en">English</Option>
            </Dropdown>
          </Field>
          
          <Field label="Zona Waktu">
            <Dropdown
              value={settings.system.timezone}
              onOptionSelect={(e, data) => handleSettingChange('system', 'timezone', data.optionValue)}
            >
              <Option value="Asia/Jakarta">WIB (Jakarta)</Option>
              <Option value="Asia/Makassar">WITA (Makassar)</Option>
              <Option value="Asia/Jayapura">WIT (Jayapura)</Option>
            </Dropdown>
          </Field>
          
          <div className={styles.fieldGrid}>
            <Field label="Format Tanggal">
              <Dropdown
                value={settings.system.date_format}
                onOptionSelect={(e, data) => handleSettingChange('system', 'date_format', data.optionValue)}
              >
                <Option value="dd/MM/yyyy">DD/MM/YYYY</Option>
                <Option value="MM/dd/yyyy">MM/DD/YYYY</Option>
                <Option value="yyyy-MM-dd">YYYY-MM-DD</Option>
              </Dropdown>
            </Field>
            
            <Field label="Format Waktu">
              <Dropdown
                value={settings.system.time_format}
                onOptionSelect={(e, data) => handleSettingChange('system', 'time_format', data.optionValue)}
              >
                <Option value="24h">24 Jam</Option>
                <Option value="12h">12 Jam (AM/PM)</Option>
              </Dropdown>
            </Field>
          </div>
          
          <Field label="Tema">
            <RadioGroup
              value={settings.system.theme}
              onChange={(e, data) => handleSettingChange('system', 'theme', data.value)}
            >
              <Radio value="light" label="Terang" />
              <Radio value="dark" label="Gelap" />
              <Radio value="auto" label="Otomatis" />
            </RadioGroup>
          </Field>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Database24Regular />
          Backup & Session
        </Title3>
        
        <div className="space-y-4">
          <Field>
            <Switch
              checked={settings.system.auto_backup}
              onChange={(e, data) => handleSettingChange('system', 'auto_backup', data.checked)}
              label="Auto Backup"
            />
          </Field>
          
          <Field label="Frekuensi Backup">
            <Dropdown
              value={settings.system.backup_frequency}
              onOptionSelect={(e, data) => handleSettingChange('system', 'backup_frequency', data.optionValue)}
              disabled={!settings.system.auto_backup}
            >
              <Option value="daily">Harian</Option>
              <Option value="weekly">Mingguan</Option>
              <Option value="monthly">Bulanan</Option>
            </Dropdown>
          </Field>
          
          <Field label="Maksimal File Backup">
            <SpinButton
              value={settings.system.max_backup_files}
              onChange={(e, data) => handleSettingChange('system', 'max_backup_files', data.value || 30)}
              min={5}
              max={100}
              step={5}
              disabled={!settings.system.auto_backup}
            />
          </Field>
          
          <Field label="Session Timeout (menit)">
            <SpinButton
              value={settings.system.session_timeout}
              onChange={(e, data) => handleSettingChange('system', 'session_timeout', data.value || 60)}
              min={15}
              max={480}
              step={15}
            />
          </Field>
        </div>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Shield24Regular />
          Kebijakan Password
        </Title3>
        
        <div className="space-y-4">
          <Field label="Panjang Minimum">
            <SpinButton
              value={settings.security.password_min_length}
              onChange={(e, data) => handleSettingChange('security', 'password_min_length', data.value || 8)}
              min={6}
              max={20}
            />
          </Field>
          
          <div className="space-y-3">
            <Field>
              <Switch
                checked={settings.security.password_require_uppercase}
                onChange={(e, data) => handleSettingChange('security', 'password_require_uppercase', data.checked)}
                label="Wajib Huruf Besar"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.security.password_require_lowercase}
                onChange={(e, data) => handleSettingChange('security', 'password_require_lowercase', data.checked)}
                label="Wajib Huruf Kecil"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.security.password_require_numbers}
                onChange={(e, data) => handleSettingChange('security', 'password_require_numbers', data.checked)}
                label="Wajib Angka"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.security.password_require_symbols}
                onChange={(e, data) => handleSettingChange('security', 'password_require_symbols', data.checked)}
                label="Wajib Simbol"
              />
            </Field>
          </div>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4">Keamanan Login</Title3>
        
        <div className="space-y-4">
          <Field label="Maksimal Percobaan Login">
            <SpinButton
              value={settings.security.max_login_attempts}
              onChange={(e, data) => handleSettingChange('security', 'max_login_attempts', data.value || 5)}
              min={3}
              max={10}
            />
          </Field>
          
          <Field label="Durasi Lockout (menit)">
            <SpinButton
              value={settings.security.lockout_duration}
              onChange={(e, data) => handleSettingChange('security', 'lockout_duration', data.value || 15)}
              min={5}
              max={60}
              step={5}
            />
          </Field>
          
          <div className="space-y-3">
            <Field>
              <Switch
                checked={settings.security.two_factor_enabled}
                onChange={(e, data) => handleSettingChange('security', 'two_factor_enabled', data.checked)}
                label="Two-Factor Authentication"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.security.audit_log_enabled}
                onChange={(e, data) => handleSettingChange('security', 'audit_log_enabled', data.checked)}
                label="Audit Log"
              />
            </Field>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className={styles.settingsGrid}>
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4 flex items-center gap-2">
          <Alert24Regular />
          Pengaturan Notifikasi
        </Title3>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Field>
              <Switch
                checked={settings.notifications.email_notifications}
                onChange={(e, data) => handleSettingChange('notifications', 'email_notifications', data.checked)}
                label="Notifikasi Email"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.notifications.sms_notifications}
                onChange={(e, data) => handleSettingChange('notifications', 'sms_notifications', data.checked)}
                label="Notifikasi SMS"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.notifications.low_stock_alerts}
                onChange={(e, data) => handleSettingChange('notifications', 'low_stock_alerts', data.checked)}
                label="Alert Stok Menipis"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.notifications.daily_sales_report}
                onChange={(e, data) => handleSettingChange('notifications', 'daily_sales_report', data.checked)}
                label="Laporan Harian"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.notifications.weekly_summary}
                onChange={(e, data) => handleSettingChange('notifications', 'weekly_summary', data.checked)}
                label="Ringkasan Mingguan"
              />
            </Field>
            
            <Field>
              <Switch
                checked={settings.notifications.system_alerts}
                onChange={(e, data) => handleSettingChange('notifications', 'system_alerts', data.checked)}
                label="Alert Sistem"
              />
            </Field>
          </div>
        </div>
      </Card>
      
      <Card className={styles.settingsCard}>
        <Title3 className="mb-4">Kontak Notifikasi</Title3>
        
        <div className="space-y-4">
          <Field label="Email Notifikasi">
            <Input
              type="email"
              value={settings.notifications.notification_email}
              onChange={(e) => handleSettingChange('notifications', 'notification_email', e.target.value)}
              placeholder="admin@perusahaan.com"
              disabled={!settings.notifications.email_notifications}
            />
          </Field>
          
          <Field label="Nomor HP Notifikasi">
            <Input
              value={settings.notifications.notification_phone}
              onChange={(e) => handleSettingChange('notifications', 'notification_phone', e.target.value)}
              placeholder="081234567890"
              disabled={!settings.notifications.sms_notifications}
            />
          </Field>
        </div>
      </Card>
    </div>
  );

  // ======================================================================
  // RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="large" />
          <Text className="mt-4 block">Memuat pengaturan...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title1>Pengaturan Sistem</Title1>
          <Body1 className="text-gray-600 mt-1">
            Konfigurasi sistem dan preferensi aplikasi
          </Body1>
        </div>
        <div className={styles.actionButtons}>
          {hasChanges && (
            <Button
              appearance="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
          )}
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <MessageBar intent={saveMessage.includes('berhasil') ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>
              {saveMessage.includes('berhasil') ? 'Berhasil' : 'Error'}
            </MessageBarTitle>
            {saveMessage}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Changes Indicator */}
      {hasChanges && (
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>Perubahan Belum Disimpan</MessageBarTitle>
            Anda memiliki perubahan yang belum disimpan. Jangan lupa untuk menyimpan perubahan.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Tabs */}
      <Card>
        <div className="p-6">
          <TabList
            selectedValue={activeTab}
            onTabSelect={handleTabSelect}
            size="large"
          >
            <Tab value="company" icon={<Building24Regular />}>
              Perusahaan
            </Tab>
            <Tab value="pos" icon={<Receipt24Regular />}>
              POS
            </Tab>
            <Tab value="printer" icon={<Print24Regular />}>
              Printer
            </Tab>
            <Tab value="system" icon={<Settings24Regular />}>
              Sistem
            </Tab>
            <Tab value="security" icon={<Shield24Regular />}>
              Keamanan
            </Tab>
            <Tab value="notifications" icon={<Alert24Regular />}>
              Notifikasi
            </Tab>
            <Tab value="branches" icon={<Building24Regular />}>
              Cabang
            </Tab>
            <Tab value="users" icon={<Person24Regular />}>
              Pengguna & Peran
            </Tab>
          </TabList>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'company' && renderCompanySettings()}
        {activeTab === 'pos' && renderPOSSettings()}
        {activeTab === 'printer' && renderPrinterSettings()}
        {activeTab === 'system' && renderSystemSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'branches' && renderBranchSettings()}
        {activeTab === 'users' && renderUserSettings()}
      </div>
    </div>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPermissions={['settings.read']}>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}