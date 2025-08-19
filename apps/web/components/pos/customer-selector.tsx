// ======================================================================
// KOMPONEN CUSTOMER SELECTOR
// Dialog untuk memilih atau menambah pelanggan dalam transaksi POS
// ======================================================================

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Caption1,
  Input,
  Card,
  Badge,
  Spinner,
  Divider,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Field,
  Textarea,
  RadioGroup,
  Radio,
  Checkbox
} from '@fluentui/react-components';
import {
  Person24Regular,
  PersonAdd24Regular,
  Search24Regular,
  Filter24Regular,
  Phone24Regular,
  Mail24Regular,
  Location24Regular,
  Building24Regular,
  Calendar24Regular,
  Star24Regular,
  Star24Filled,
  Edit24Regular,
  Delete24Regular,
  ChevronDown24Regular,
  Dismiss24Regular,
  Checkmark24Regular,
  Add24Regular
} from '@fluentui/react-icons';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ======================================================================
// TYPES
// ======================================================================

interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  taxId?: string; // NPWP
  customerType: 'individual' | 'company';
  isActive: boolean;
  isFavorite: boolean;
  creditLimit?: number;
  paymentTerms?: number; // days
  discount?: number; // percentage
  notes?: string;
  createdAt: Date;
  lastTransactionAt?: Date;
  totalTransactions: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints?: number;
}

interface CustomerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
  allowCreateNew?: boolean;
  showCustomerInfo?: boolean;
  filterFavorites?: boolean;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  taxId: string;
  customerType: 'individual' | 'company';
  notes: string;
}

interface SearchFilters {
  customerType: 'all' | 'individual' | 'company';
  favorites: boolean;
  active: boolean;
  sortBy: 'name' | 'lastTransaction' | 'totalSpent' | 'totalTransactions';
  sortOrder: 'asc' | 'desc';
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'CUST001',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123',
    city: 'Jakarta',
    postalCode: '12345',
    customerType: 'individual',
    isActive: true,
    isFavorite: true,
    paymentTerms: 30,
    discount: 5,
    notes: 'Pelanggan setia, sering beli dalam jumlah besar',
    createdAt: new Date('2024-01-15'),
    lastTransactionAt: new Date('2024-01-20'),
    totalTransactions: 25,
    totalSpent: 2500000,
    averageOrderValue: 100000,
    loyaltyPoints: 250
  },
  {
    id: '2',
    code: 'CUST002',
    name: 'PT. Maju Jaya',
    email: 'purchasing@majujaya.com',
    phone: '0215551234',
    address: 'Jl. Sudirman No. 456',
    city: 'Jakarta',
    postalCode: '12345',
    taxId: '01.234.567.8-901.000',
    customerType: 'company',
    isActive: true,
    isFavorite: true,
    creditLimit: 10000000,
    paymentTerms: 45,
    discount: 10,
    notes: 'Perusahaan besar, pembayaran selalu tepat waktu',
    createdAt: new Date('2024-01-10'),
    lastTransactionAt: new Date('2024-01-19'),
    totalTransactions: 15,
    totalSpent: 5000000,
    averageOrderValue: 333333,
    loyaltyPoints: 500
  },
  {
    id: '3',
    code: 'CUST003',
    name: 'Siti Nurhaliza',
    email: 'siti.nur@email.com',
    phone: '081987654321',
    address: 'Jl. Kebon Jeruk No. 789',
    city: 'Bandung',
    postalCode: '40123',
    customerType: 'individual',
    isActive: true,
    isFavorite: false,
    paymentTerms: 0, // cash only
    discount: 0,
    notes: 'Pelanggan baru, masih dalam masa percobaan',
    createdAt: new Date('2024-01-18'),
    lastTransactionAt: new Date('2024-01-18'),
    totalTransactions: 3,
    totalSpent: 150000,
    averageOrderValue: 50000,
    loyaltyPoints: 15
  },
  {
    id: '4',
    code: 'CUST004',
    name: 'CV. Berkah Mandiri',
    email: 'admin@berkahmandiri.co.id',
    phone: '0227771234',
    address: 'Jl. Asia Afrika No. 321',
    city: 'Bandung',
    postalCode: '40111',
    taxId: '02.345.678.9-012.000',
    customerType: 'company',
    isActive: true,
    isFavorite: false,
    creditLimit: 5000000,
    paymentTerms: 30,
    discount: 7.5,
    notes: 'CV kecil, pembayaran kadang terlambat',
    createdAt: new Date('2024-01-12'),
    lastTransactionAt: new Date('2024-01-17'),
    totalTransactions: 8,
    totalSpent: 1200000,
    averageOrderValue: 150000,
    loyaltyPoints: 120
  },
  {
    id: '5',
    code: 'CUST005',
    name: 'Ahmad Wijaya',
    phone: '081555666777',
    address: 'Jl. Diponegoro No. 654',
    city: 'Surabaya',
    customerType: 'individual',
    isActive: true,
    isFavorite: false,
    paymentTerms: 0,
    discount: 0,
    notes: 'Pelanggan walk-in, tidak ada email',
    createdAt: new Date('2024-01-16'),
    lastTransactionAt: new Date('2024-01-16'),
    totalTransactions: 1,
    totalSpent: 75000,
    averageOrderValue: 75000,
    loyaltyPoints: 7
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const getCustomerTypeLabel = (type: string) => {
  switch (type) {
    case 'individual': return 'Perorangan';
    case 'company': return 'Perusahaan';
    default: return type;
  }
};

const getCustomerStatusColor = (customer: Customer) => {
  if (!customer.isActive) return 'danger';
  if (customer.isFavorite) return 'success';
  return 'brand';
};

const formatLastTransaction = (date?: Date) => {
  if (!date) return 'Belum pernah';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return date.toLocaleDateString('id-ID');
};

// ======================================================================
// CUSTOMER CARD COMPONENT
// ======================================================================

interface CustomerCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onToggleFavorite?: (customer: Customer) => void;
  isSelected?: boolean;
  showInfo?: boolean;
}

function CustomerCard({ 
  customer, 
  onSelect, 
  onEdit, 
  onToggleFavorite, 
  isSelected = false, 
  showInfo = true 
}: CustomerCardProps) {
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(customer);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(customer);
    }
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        !customer.isActive && 'opacity-50'
      )}
      onClick={() => onSelect(customer)}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Text weight="semibold" className="truncate">
                {customer.name}
              </Text>
              {customer.isFavorite && (
                <Tooltip content="Pelanggan favorit" relationship="label">
                  <Star24Filled className="w-4 h-4 text-yellow-500" />
                </Tooltip>
              )}
            </div>
            <Caption1 className="text-gray-600">
              {customer.code}
            </Caption1>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge 
              appearance="outline" 
              size="small"
              color={getCustomerStatusColor(customer) as any}
            >
              {getCustomerTypeLabel(customer.customerType)}
            </Badge>
            
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<ChevronDown24Regular />}
                  onClick={(e) => e.stopPropagation()}
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={customer.isFavorite ? <Star24Filled /> : <Star24Regular />}
                    onClick={handleToggleFavorite}
                  >
                    {customer.isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                  </MenuItem>
                  {onEdit && (
                    <MenuItem
                      icon={<Edit24Regular />}
                      onClick={handleEdit}
                    >
                      Edit Pelanggan
                    </MenuItem>
                  )}
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone24Regular className="w-4 h-4 text-gray-400" />
              <Text size={200}>{customer.phone}</Text>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail24Regular className="w-4 h-4 text-gray-400" />
              <Text size={200} className="truncate">{customer.email}</Text>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center space-x-2 text-sm">
              <Location24Regular className="w-4 h-4 text-gray-400" />
              <Text size={200} className="truncate">
                {customer.address}, {customer.city}
              </Text>
            </div>
          )}
        </div>
        
        {/* Stats */}
        {showInfo && (
          <>
            <Divider />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <Text weight="bold" className="block">
                  {customer.totalTransactions}
                </Text>
                <Caption1 className="text-gray-600">Transaksi</Caption1>
              </div>
              <div>
                <Text weight="bold" className="block text-green-600">
                  {formatCurrency(customer.totalSpent)}
                </Text>
                <Caption1 className="text-gray-600">Total Belanja</Caption1>
              </div>
            </div>
            
            <div className="text-center">
              <Caption1 className="text-gray-600">
                Terakhir: {formatLastTransaction(customer.lastTransactionAt)}
              </Caption1>
            </div>
            
            {customer.discount && customer.discount > 0 && (
              <div className="bg-green-50 p-2 rounded text-center">
                <Text size={200} weight="semibold" className="text-green-700">
                  Diskon {customer.discount}%
                </Text>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ======================================================================
// CUSTOMER FORM COMPONENT
// ======================================================================

interface CustomerFormProps {
  customer?: Customer;
  onSave: (data: CustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function CustomerForm({ customer, onSave, onCancel, isLoading = false }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    postalCode: customer?.postalCode || '',
    taxId: customer?.taxId || '',
    customerType: customer?.customerType || 'individual',
    notes: customer?.notes || ''
  });
  
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <Field 
          label="Nama *" 
          validationMessage={errors.name}
          validationState={errors.name ? 'error' : 'none'}
          className="md:col-span-2"
        >
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Masukkan nama pelanggan"
            required
          />
        </Field>
        
        {/* Customer Type */}
        <Field label="Tipe Pelanggan" className="md:col-span-2">
          <RadioGroup
            value={formData.customerType}
            onChange={(_, data) => handleChange('customerType', data.value)}
            layout="horizontal"
          >
            <Radio value="individual" label="Perorangan" />
            <Radio value="company" label="Perusahaan" />
          </RadioGroup>
        </Field>
        
        {/* Email */}
        <Field 
          label="Email" 
          validationMessage={errors.email}
          validationState={errors.email ? 'error' : 'none'}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="email@contoh.com"
          />
        </Field>
        
        {/* Phone */}
        <Field 
          label="Nomor Telepon" 
          validationMessage={errors.phone}
          validationState={errors.phone ? 'error' : 'none'}
        >
          <Input
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="081234567890"
          />
        </Field>
        
        {/* Tax ID (for companies) */}
        {formData.customerType === 'company' && (
          <Field label="NPWP" className="md:col-span-2">
            <Input
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              placeholder="01.234.567.8-901.000"
            />
        </Field>
        )}
        
        {/* Address */}
        <Field label="Alamat" className="md:col-span-2">
          <Textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Masukkan alamat lengkap"
            rows={2}
          />
        </Field>
        
        {/* City */}
        <Field label="Kota">
          <Input
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Jakarta"
          />
        </Field>
        
        {/* Postal Code */}
        <Field label="Kode Pos">
          <Input
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="12345"
          />
        </Field>
        
        {/* Notes */}
        <Field label="Catatan" className="md:col-span-2">
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Catatan tambahan tentang pelanggan"
            rows={3}
          />
        </Field>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          appearance="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          appearance="primary"
          disabled={isLoading}
          icon={isLoading ? <Spinner size="tiny" /> : undefined}
        >
          {isLoading ? 'Menyimpan...' : (customer ? 'Update' : 'Simpan')}
        </Button>
      </div>
      </form>
    </>
  );
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function CustomerSelector({
  open,
  onOpenChange,
  onCustomerSelect,
  selectedCustomer,
  allowCreateNew = true,
  showCustomerInfo = true,
  filterFavorites = false
}: CustomerSelectorProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [filters, setFilters] = useState<SearchFilters>({
    customerType: 'all',
    favorites: filterFavorites,
    active: true,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = customer.name.toLowerCase().includes(query);
        const matchesCode = customer.code.toLowerCase().includes(query);
        const matchesPhone = customer.phone?.toLowerCase().includes(query);
        const matchesEmail = customer.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesPhone && !matchesEmail) {
          return false;
        }
      }
      
      // Filter by customer type
      if (filters.customerType !== 'all' && customer.customerType !== filters.customerType) {
        return false;
      }
      
      // Filter by favorites
      if (filters.favorites && !customer.isFavorite) {
        return false;
      }
      
      // Filter by active status
      if (filters.active && !customer.isActive) {
        return false;
      }
      
      return true;
    });
    
    // Sort customers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'lastTransaction':
          const aDate = a.lastTransactionAt?.getTime() || 0;
          const bDate = b.lastTransactionAt?.getTime() || 0;
          comparison = aDate - bDate;
          break;
        case 'totalSpent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'totalTransactions':
          comparison = a.totalTransactions - b.totalTransactions;
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [customers, searchQuery, filters]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setShowForm(false);
      setEditingCustomer(undefined);
      setFilters(prev => ({ ...prev, favorites: filterFavorites }));
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, filterFavorites]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    onOpenChange(false);
  };

  const handleCreateNew = () => {
    setEditingCustomer(undefined);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormSave = async (data: CustomerFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer: Customer = {
          ...editingCustomer,
          ...data,
          id: editingCustomer.id,
          code: editingCustomer.code,
          isActive: editingCustomer.isActive,
          isFavorite: editingCustomer.isFavorite,
          createdAt: editingCustomer.createdAt,
          totalTransactions: editingCustomer.totalTransactions,
          totalSpent: editingCustomer.totalSpent,
          averageOrderValue: editingCustomer.averageOrderValue,
          loyaltyPoints: editingCustomer.loyaltyPoints
        };
        
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
        toast.success('Pelanggan berhasil diupdate');
      } else {
        // Create new customer
        const newCustomer: Customer = {
          ...data,
          id: `CUST${Date.now()}`,
          code: `CUST${String(customers.length + 1).padStart(3, '0')}`,
          isActive: true,
          isFavorite: false,
          createdAt: new Date(),
          totalTransactions: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          loyaltyPoints: 0
        };
        
        setCustomers(prev => [newCustomer, ...prev]);
        toast.success('Pelanggan baru berhasil ditambahkan');
      }
      
      setShowForm(false);
      setEditingCustomer(undefined);
    } catch (error) {
      toast.error('Gagal menyimpan pelanggan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (customer: Customer) => {
    setCustomers(prev => prev.map(c => 
      c.id === customer.id 
        ? { ...c, isFavorite: !c.isFavorite }
        : c
    ));
    
    toast.success(
      customer.isFavorite 
        ? 'Dihapus dari favorit' 
        : 'Ditambahkan ke favorit'
    );
  };

  const clearFilters = () => {
    setFilters({
      customerType: 'all',
      favorites: false,
      active: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogBody className="flex flex-col h-full">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Person24Regular />
              <Text className="text-xl font-semibold">
                {showForm ? (editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan') : 'Pilih Pelanggan'}
              </Text>
            </div>
            {!showForm && (
              <Badge appearance="outline">
                {filteredCustomers.length} pelanggan
              </Badge>
            )}
          </DialogTitle>
          
          <DialogContent className="flex-1 overflow-hidden">
            {showForm ? (
              <CustomerForm
                customer={editingCustomer}
                onSave={handleFormSave}
                onCancel={() => setShowForm(false)}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                {/* Search and Actions */}
                <div className="flex items-center space-x-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Cari berdasarkan nama, kode, telepon, atau email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    contentBefore={<Search24Regular />}
                    className="flex-1"
                    size="large"
                  />
                  
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        appearance="outline"
                        icon={<Filter24Regular />}
                        iconPosition="before"
                      >
                        Filter
                        <ChevronDown24Regular />
                      </Button>
                    </MenuTrigger>
                    <MenuPopover>
                      <div className="p-4 space-y-4 w-80">
                        {/* Customer Type Filter */}
                        <Field label="Tipe Pelanggan">
                          <RadioGroup
                            value={filters.customerType}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, customerType: data.value as any }))}
                          >
                            <Radio value="all" label="Semua" />
                            <Radio value="individual" label="Perorangan" />
                            <Radio value="company" label="Perusahaan" />
                          </RadioGroup>
                        </Field>
                        
                        <Divider />
                        
                        {/* Other Filters */}
                        <div className="space-y-2">
                          <Checkbox
                            checked={filters.favorites}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, favorites: !!data.checked }))}
                            label="Hanya Favorit"
                          />
                          <Checkbox
                            checked={filters.active}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, active: !!data.checked }))}
                            label="Hanya Aktif"
                          />
                        </div>
                        
                        <Divider />
                        
                        {/* Sort Options */}
                        <Field label="Urutkan Berdasarkan">
                          <RadioGroup
                            value={filters.sortBy}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, sortBy: data.value as any }))}
                          >
                            <Radio value="name" label="Nama" />
                            <Radio value="lastTransaction" label="Transaksi Terakhir" />
                            <Radio value="totalSpent" label="Total Belanja" />
                            <Radio value="totalTransactions" label="Jumlah Transaksi" />
                          </RadioGroup>
                        </Field>
                        
                        <Field label="Urutan">
                          <RadioGroup
                            value={filters.sortOrder}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, sortOrder: data.value as any }))}
                          >
                            <Radio value="asc" label="A-Z / Rendah-Tinggi" />
                            <Radio value="desc" label="Z-A / Tinggi-Rendah" />
                          </RadioGroup>
                        </Field>
                        
                        <Button
                          appearance="outline"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          Reset Filter
                        </Button>
                      </div>
                    </MenuPopover>
                  </Menu>
                  
                  {allowCreateNew && (
                    <Button
                      appearance="primary"
                      icon={<PersonAdd24Regular />}
                      onClick={handleCreateNew}
                    >
                      Tambah Baru
                    </Button>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    appearance={selectedCustomer ? "outline" : "primary"}
                    size="small"
                    onClick={() => handleCustomerSelect(null as any)}
                  >
                    Pelanggan Umum
                  </Button>
                  
                  {customers.filter(c => c.isFavorite).slice(0, 3).map(customer => (
                    <Button
                      key={customer.id}
                      appearance="outline"
                      size="small"
                      icon={<Star24Filled />}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      {customer.name}
                    </Button>
                  ))}
                </div>
                
                {/* Customers List */}
                <div className="flex-1 overflow-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Spinner size="large" />
                      <Text className="ml-3">Memuat pelanggan...</Text>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Person24Regular className="w-16 h-16 text-gray-300 mb-4" />
                      <Text className="text-gray-600 mb-2">Tidak ada pelanggan ditemukan</Text>
                      <Caption1 className="text-gray-500 mb-4">
                        Coba ubah kata kunci pencarian atau filter
                      </Caption1>
                      {allowCreateNew && (
                        <Button
                          appearance="primary"
                          icon={<PersonAdd24Regular />}
                          onClick={handleCreateNew}
                        >
                          Tambah Pelanggan Baru
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                      {filteredCustomers.map((customer) => (
                        <CustomerCard
                          key={customer.id}
                          customer={customer}
                          onSelect={handleCustomerSelect}
                          onEdit={handleEdit}
                          onToggleFavorite={handleToggleFavorite}
                          isSelected={selectedCustomer?.id === customer.id}
                          showInfo={showCustomerInfo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => onOpenChange(false)}
            >
              {showForm ? 'Batal' : 'Tutup'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type { Customer, CustomerSelectorProps, CustomerFormData };