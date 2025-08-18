// ======================================================================
// KOMPONEN PENCARIAN PRODUK
// Dialog untuk mencari dan memilih produk dalam POS
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
  Checkbox,
  RadioGroup,
  Radio,
  Field
} from '@fluentui/react-components';
import {
  Search24Regular,
  Filter24Regular,
  ShoppingBag24Regular,
  Add24Regular,
  Barcode24Regular,
  Tag24Regular,
  Building24Regular,
  Box24Regular,
  ChevronDown24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Info24Regular
} from '@fluentui/react-icons';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// ======================================================================
// TYPES
// ======================================================================

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
  unit: string;
  taxRate: number;
  image?: string;
  description?: string;
  isActive: boolean;
  minStock?: number;
  maxStock?: number;
  cost?: number;
  margin?: number;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  productCount: number;
}

interface ProductSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: Product, quantity?: number) => void;
  onMultipleSelect?: (products: { product: Product; quantity: number }[]) => void;
  allowMultipleSelection?: boolean;
  showStockInfo?: boolean;
  filterByStock?: boolean;
  excludeProducts?: string[]; // Product IDs to exclude
}

interface SearchFilters {
  category: string;
  brand: string;
  stockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'price' | 'stock' | 'category';
  sortOrder: 'asc' | 'desc';
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockProducts: Product[] = [
  {
    id: '1',
    code: 'KPI001',
    name: 'Kopi Arabica Premium 250g',
    price: 45000,
    stock: 25,
    category: 'Minuman',
    brand: 'Kopi Nusantara',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Kopi arabica premium dari dataran tinggi Jawa',
    isActive: true,
    minStock: 10,
    cost: 30000,
    margin: 33.33
  },
  {
    id: '2',
    code: 'TEH001',
    name: 'Teh Hijau Premium 100g',
    price: 35000,
    stock: 15,
    category: 'Minuman',
    brand: 'Teh Asli',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Teh hijau berkualitas tinggi',
    isActive: true,
    minStock: 5,
    cost: 25000,
    margin: 28.57
  },
  {
    id: '3',
    code: 'SNK001',
    name: 'Keripik Singkong Original',
    price: 12000,
    stock: 50,
    category: 'Snack',
    brand: 'Keripik Enak',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Keripik singkong renyah dan gurih',
    isActive: true,
    minStock: 20,
    cost: 8000,
    margin: 33.33
  },
  {
    id: '4',
    code: 'MIE001',
    name: 'Mie Instan Ayam Bawang',
    price: 3500,
    stock: 100,
    category: 'Makanan',
    brand: 'Mie Sedap',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Mie instan rasa ayam bawang',
    isActive: true,
    minStock: 50,
    cost: 2500,
    margin: 28.57
  },
  {
    id: '5',
    code: 'AIR001',
    name: 'Air Mineral 600ml',
    price: 3000,
    stock: 200,
    category: 'Minuman',
    brand: 'Aqua',
    unit: 'btl',
    taxRate: 0.11,
    description: 'Air mineral dalam kemasan 600ml',
    isActive: true,
    minStock: 100,
    cost: 2000,
    margin: 33.33
  },
  {
    id: '6',
    code: 'BIS001',
    name: 'Biskuit Cokelat',
    price: 8000,
    stock: 3,
    category: 'Snack',
    brand: 'Biskuit Manis',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Biskuit dengan rasa cokelat',
    isActive: true,
    minStock: 10,
    cost: 5500,
    margin: 31.25
  },
  {
    id: '7',
    code: 'JUS001',
    name: 'Jus Jeruk 250ml',
    price: 15000,
    stock: 0,
    category: 'Minuman',
    brand: 'Jus Segar',
    unit: 'btl',
    taxRate: 0.11,
    description: 'Jus jeruk segar tanpa pengawet',
    isActive: true,
    minStock: 20,
    cost: 10000,
    margin: 33.33
  }
];

const mockCategories: Category[] = [
  { id: 'all', name: 'Semua Kategori', productCount: mockProducts.length },
  { id: 'minuman', name: 'Minuman', productCount: 4 },
  { id: 'makanan', name: 'Makanan', productCount: 1 },
  { id: 'snack', name: 'Snack', productCount: 2 }
];

const mockBrands: Brand[] = [
  { id: 'all', name: 'Semua Merek', productCount: mockProducts.length },
  { id: 'kopi-nusantara', name: 'Kopi Nusantara', productCount: 1 },
  { id: 'teh-asli', name: 'Teh Asli', productCount: 1 },
  { id: 'keripik-enak', name: 'Keripik Enak', productCount: 1 },
  { id: 'mie-sedap', name: 'Mie Sedap', productCount: 1 },
  { id: 'aqua', name: 'Aqua', productCount: 1 },
  { id: 'biskuit-manis', name: 'Biskuit Manis', productCount: 1 },
  { id: 'jus-segar', name: 'Jus Segar', productCount: 1 }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const getStockStatus = (product: Product) => {
  if (product.stock === 0) return 'out_of_stock';
  if (product.stock <= (product.minStock || 10)) return 'low_stock';
  return 'in_stock';
};

const getStockBadgeColor = (status: string) => {
  switch (status) {
    case 'out_of_stock': return 'danger';
    case 'low_stock': return 'warning';
    default: return 'success';
  }
};

const getStockStatusText = (status: string) => {
  switch (status) {
    case 'out_of_stock': return 'Habis';
    case 'low_stock': return 'Menipis';
    default: return 'Tersedia';
  }
};

// ======================================================================
// PRODUCT CARD COMPONENT
// ======================================================================

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  isSelected?: boolean;
  showStockInfo?: boolean;
  disabled?: boolean;
}

function ProductCard({ 
  product, 
  onSelect, 
  onAddToCart, 
  isSelected = false, 
  showStockInfo = true,
  disabled = false 
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === 'out_of_stock';
  const isLowStock = stockStatus === 'low_stock';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, quantity);
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onSelect(product)}
    >
      <div className="p-4 space-y-3">
        {/* Product Image Placeholder */}
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <Box24Regular className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* Product Info */}
        <div className="space-y-1">
          <Text weight="semibold" className="block text-sm line-clamp-2">
            {product.name}
          </Text>
          <Caption1 className="text-gray-600">
            {product.code}
          </Caption1>
          <div className="flex items-center space-x-2">
            <Badge appearance="outline" size="small">
              {product.category}
            </Badge>
            {product.brand && (
              <Badge appearance="outline" size="small" color="brand">
                {product.brand}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Price */}
        <div>
          <Text weight="bold" className="text-blue-600">
            {formatCurrency(product.price)}
          </Text>
          <Caption1 className="text-gray-500">per {product.unit}</Caption1>
        </div>
        
        {/* Stock Info */}
        {showStockInfo && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Badge 
                appearance="filled" 
                size="small"
                color={getStockBadgeColor(stockStatus) as any}
              >
                {getStockStatusText(stockStatus)}
              </Badge>
              {isLowStock && !isOutOfStock && (
                <Tooltip content="Stok menipis" relationship="label">
                  <Warning24Filled className="w-4 h-4 text-orange-500" />
                </Tooltip>
              )}
            </div>
            <Caption1 className="text-gray-600">
              {product.stock} {product.unit}
            </Caption1>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16"
            size="small"
            disabled={isOutOfStock || disabled}
          />
          <Button
            appearance="primary"
            size="small"
            icon={<Add24Regular />}
            onClick={handleAddToCart}
            disabled={isOutOfStock || disabled || quantity > product.stock}
            className="flex-1"
          >
            Tambah
          </Button>
        </div>
        
        {/* Additional Info */}
        {product.description && (
          <Caption1 className="text-gray-500 line-clamp-2">
            {product.description}
          </Caption1>
        )}
      </div>
    </Card>
  );
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function ProductSearch({
  open,
  onOpenChange,
  onProductSelect,
  onMultipleSelect,
  allowMultipleSelection = false,
  showStockInfo = true,
  filterByStock = false,
  excludeProducts = []
}: ProductSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    brand: 'all',
    stockStatus: 'all',
    priceRange: { min: 0, max: 1000000 },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = mockProducts.filter(product => {
      // Exclude specified products
      if (excludeProducts.includes(product.id)) return false;
      
      // Filter by active status
      if (!product.isActive) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCode = product.code.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesDescription) return false;
      }
      
      // Filter by category
      if (filters.category !== 'all' && product.category.toLowerCase() !== filters.category) {
        return false;
      }
      
      // Filter by brand
      if (filters.brand !== 'all' && product.brand?.toLowerCase().replace(/\s+/g, '-') !== filters.brand) {
        return false;
      }
      
      // Filter by stock status
      if (filters.stockStatus !== 'all') {
        const stockStatus = getStockStatus(product);
        if (stockStatus !== filters.stockStatus) return false;
      }
      
      // Filter by stock availability
      if (filterByStock && product.stock === 0) return false;
      
      // Filter by price range
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false;
      }
      
      return true;
    });
    
    // Sort products
    products.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return products;
  }, [searchQuery, filters, excludeProducts, filterByStock]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedProducts(new Set());
      setFilters({
        category: 'all',
        brand: 'all',
        stockStatus: filterByStock ? 'in_stock' : 'all',
        priceRange: { min: 0, max: 1000000 },
        sortBy: 'name',
        sortOrder: 'asc'
      });
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open, filterByStock]);

  const handleProductSelect = (product: Product) => {
    if (allowMultipleSelection) {
      const newSelected = new Set(selectedProducts);
      if (newSelected.has(product.id)) {
        newSelected.delete(product.id);
      } else {
        newSelected.add(product.id);
      }
      setSelectedProducts(newSelected);
    } else {
      onProductSelect(product, 1);
      onOpenChange(false);
    }
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    onProductSelect(product, quantity);
    toast.success(`${product.name} ditambahkan ke keranjang`);
    
    if (!allowMultipleSelection) {
      onOpenChange(false);
    }
  };

  const handleMultipleAdd = () => {
    if (selectedProducts.size === 0) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    
    const productsToAdd = Array.from(selectedProducts).map(productId => {
      const product = mockProducts.find(p => p.id === productId)!;
      return { product, quantity: 1 };
    });
    
    if (onMultipleSelect) {
      onMultipleSelect(productsToAdd);
    } else {
      productsToAdd.forEach(({ product, quantity }) => {
        onProductSelect(product, quantity);
      });
    }
    
    toast.success(`${selectedProducts.size} produk ditambahkan ke keranjang`);
    onOpenChange(false);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      brand: 'all',
      stockStatus: 'all',
      priceRange: { min: 0, max: 1000000 },
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
              <Search24Regular />
              <Text className="text-xl font-semibold">Cari Produk</Text>
            </div>
            <Badge appearance="outline">
              {filteredProducts.length} produk ditemukan
            </Badge>
          </DialogTitle>
          
          <DialogContent className="flex-1 overflow-hidden">
            <div className="space-y-4 h-full flex flex-col">
              {/* Search and Filters */}
              <div className="space-y-3">
                {/* Search Input */}
                <div className="flex items-center space-x-2">
                  <Input
                    ref={searchInputRef}
                    placeholder="Cari berdasarkan nama, kode, atau deskripsi produk..."
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
                        {/* Category Filter */}
                        <Field label="Kategori">
                          <RadioGroup
                            value={filters.category}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, category: data.value }))}
                          >
                            {mockCategories.map(category => (
                              <Radio
                                key={category.id}
                                value={category.id}
                                label={`${category.name} (${category.productCount})`}
                              />
                            ))}
                          </RadioGroup>
                        </Field>
                        
                        <Divider />
                        
                        {/* Stock Status Filter */}
                        <Field label="Status Stok">
                          <RadioGroup
                            value={filters.stockStatus}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, stockStatus: data.value as any }))}
                          >
                            <Radio value="all" label="Semua" />
                            <Radio value="in_stock" label="Tersedia" />
                            <Radio value="low_stock" label="Stok Menipis" />
                            <Radio value="out_of_stock" label="Habis" />
                          </RadioGroup>
                        </Field>
                        
                        <Divider />
                        
                        {/* Sort Options */}
                        <Field label="Urutkan Berdasarkan">
                          <RadioGroup
                            value={filters.sortBy}
                            onChange={(_, data) => setFilters(prev => ({ ...prev, sortBy: data.value as any }))}
                          >
                            <Radio value="name" label="Nama" />
                            <Radio value="price" label="Harga" />
                            <Radio value="stock" label="Stok" />
                            <Radio value="category" label="Kategori" />
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
                </div>
                
                {/* Active Filters */}
                {(filters.category !== 'all' || filters.stockStatus !== 'all' || searchQuery) && (
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Caption1>Filter aktif:</Caption1>
                    {searchQuery && (
                      <Badge appearance="filled" color="brand">
                        Pencarian: "{searchQuery}"
                      </Badge>
                    )}
                    {filters.category !== 'all' && (
                      <Badge appearance="filled" color="success">
                        Kategori: {mockCategories.find(c => c.id === filters.category)?.name}
                      </Badge>
                    )}
                    {filters.stockStatus !== 'all' && (
                      <Badge appearance="filled" color="warning">
                        Stok: {getStockStatusText(filters.stockStatus)}
                      </Badge>
                    )}
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Dismiss24Regular />}
                      onClick={clearFilters}
                    >
                      Hapus Semua
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Products Grid */}
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner size="large" />
                    <Text className="ml-3">Memuat produk...</Text>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <ShoppingBag24Regular className="w-16 h-16 text-gray-300 mb-4" />
                    <Text className="text-gray-600 mb-2">Tidak ada produk ditemukan</Text>
                    <Caption1 className="text-gray-500">
                      Coba ubah kata kunci pencarian atau filter
                    </Caption1>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                        onAddToCart={handleAddToCart}
                        isSelected={selectedProducts.has(product.id)}
                        showStockInfo={showStockInfo}
                        disabled={filterByStock && product.stock === 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
            
            {allowMultipleSelection && selectedProducts.size > 0 && (
              <Button
                appearance="primary"
                onClick={handleMultipleAdd}
                icon={<CheckmarkCircle24Filled />}
              >
                Tambah {selectedProducts.size} Produk
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

// ======================================================================
// EXPORT TYPES
// ======================================================================

export type { Product, ProductSearchProps, Category, Brand };