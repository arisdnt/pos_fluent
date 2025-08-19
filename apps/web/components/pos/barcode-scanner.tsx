// ======================================================================
// KOMPONEN BARCODE SCANNER
// Dialog untuk scan barcode dan input manual kode produk
// ======================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Field,
  Switch,
  ProgressBar
} from '@fluentui/react-components';
import {
  Code24Regular,
  Camera24Regular,
  CameraOff24Regular,
  Search24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Warning24Regular,
  Info24Regular,
  Settings24Regular,
  ScanCamera24Regular
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
  barcode?: string;
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
}

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (product: Product, quantity?: number) => void;
  onBarcodeScanned?: (barcode: string) => void;
  allowManualInput?: boolean;
  autoClose?: boolean;
  showProductPreview?: boolean;
}

interface ScanResult {
  barcode: string;
  product?: Product;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface CameraSettings {
  enabled: boolean;
  deviceId?: string;
  resolution: 'low' | 'medium' | 'high';
  torch: boolean;
  beep: boolean;
  vibrate: boolean;
}

// ======================================================================
// MOCK DATA
// ======================================================================

const mockProducts: Product[] = [
  {
    id: '1',
    code: 'KPI001',
    barcode: '8901030895562',
    name: 'Kopi Arabica Premium 250g',
    price: 45000,
    stock: 25,
    category: 'Minuman',
    brand: 'Kopi Nusantara',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Kopi arabica premium dari dataran tinggi Jawa',
    isActive: true
  },
  {
    id: '2',
    code: 'TEH001',
    barcode: '8901030895563',
    name: 'Teh Hijau Premium 100g',
    price: 35000,
    stock: 15,
    category: 'Minuman',
    brand: 'Teh Asli',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Teh hijau berkualitas tinggi',
    isActive: true
  },
  {
    id: '3',
    code: 'SNK001',
    barcode: '8901030895564',
    name: 'Keripik Singkong Original',
    price: 12000,
    stock: 50,
    category: 'Snack',
    brand: 'Keripik Enak',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Keripik singkong renyah dan gurih',
    isActive: true
  },
  {
    id: '4',
    code: 'MIE001',
    barcode: '8901030895565',
    name: 'Mie Instan Ayam Bawang',
    price: 3500,
    stock: 100,
    category: 'Makanan',
    brand: 'Mie Sedap',
    unit: 'pcs',
    taxRate: 0.11,
    description: 'Mie instan rasa ayam bawang',
    isActive: true
  },
  {
    id: '5',
    code: 'AIR001',
    barcode: '8901030895566',
    name: 'Air Mineral 600ml',
    price: 3000,
    stock: 200,
    category: 'Minuman',
    brand: 'Aqua',
    unit: 'btl',
    taxRate: 0.11,
    description: 'Air mineral dalam kemasan 600ml',
    isActive: true
  }
];

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

const findProductByBarcode = (barcode: string): Product | undefined => {
  return mockProducts.find(product => 
    product.barcode === barcode || product.code === barcode
  );
};

const playBeepSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.warn('Could not play beep sound:', error);
  }
};

const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
};

// ======================================================================
// PRODUCT PREVIEW COMPONENT
// ======================================================================

interface ProductPreviewProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

function ProductPreview({ product, quantity, onQuantityChange, onAddToCart }: ProductPreviewProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Code24Regular className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <Text weight="semibold" className="block">
              {product.name}
            </Text>
            <Caption1 className="text-gray-600">
              {product.code} • {product.barcode}
            </Caption1>
            <div className="flex items-center space-x-2 mt-1">
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
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Text weight="bold" className="text-blue-600">
              {formatCurrency(product.price)}
            </Text>
            <Caption1 className="text-gray-500">per {product.unit}</Caption1>
          </div>
          <div className="text-right">
            <Caption1 className="text-gray-600">Stok tersedia</Caption1>
            <Text weight="semibold">{product.stock} {product.unit}</Text>
          </div>
        </div>
        
        <Divider />
        
        <div className="flex items-center space-x-3">
          <Field label="Jumlah" className="flex-1">
            <Input
              type="number"
              min="1"
              max={product.stock}
              value={quantity.toString()}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              size="large"
            />
          </Field>
          <Button
            appearance="primary"
            size="large"
            onClick={onAddToCart}
            disabled={quantity > product.stock}
            className="px-6"
          >
            Tambah ke Keranjang
          </Button>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <Text weight="semibold">Total:</Text>
            <Text weight="bold" className="text-blue-600 text-lg">
              {formatCurrency(product.price * quantity)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ======================================================================
// CAMERA SCANNER COMPONENT
// ======================================================================

interface CameraScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
}

function CameraScanner({ onBarcodeDetected, settings, onSettingsChange }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get available camera devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(cameras);
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    };
    
    getDevices();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError('');
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: settings.deviceId ? { exact: settings.deviceId } : undefined,
          width: settings.resolution === 'high' ? 1920 : settings.resolution === 'medium' ? 1280 : 640,
          height: settings.resolution === 'high' ? 1080 : settings.resolution === 'medium' ? 720 : 480,
          facingMode: 'environment' // Prefer back camera
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }, [settings.deviceId, settings.resolution]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, [stream]);

  // Mock barcode detection (in real app, use a library like ZXing or QuaggaJS)
  const detectBarcode = useCallback(() => {
    // This is a mock implementation
    // In a real app, you would use a barcode detection library
    const mockBarcodes = ['8901030895562', '8901030895563', '8901030895564'];
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    
    // Simulate random detection
    if (Math.random() < 0.1) { // 10% chance per scan
      onBarcodeDetected(randomBarcode);
    }
  }, [onBarcodeDetected]);

  // Start/stop scanning
  useEffect(() => {
    if (settings.enabled && isScanning) {
      startCamera();
      
      // Start barcode detection interval
      scanIntervalRef.current = setInterval(detectBarcode, 500);
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [settings.enabled, isScanning, startCamera, stopCamera, detectBarcode]);

  return (
    <div className="space-y-4">
      {/* Camera Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.enabled}
            onChange={(_, data) => onSettingsChange({ ...settings, enabled: data.checked })}
          />
          <Text>Aktifkan Kamera</Text>
        </div>
        
        {devices.length > 1 && (
          <select
            value={settings.deviceId || ''}
            onChange={(e) => onSettingsChange({ ...settings, deviceId: e.target.value })}
            className="px-3 py-1 border rounded"
          >
            <option value="">Kamera Default</option>
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Kamera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Camera View */}
      {settings.enabled && (
        <div className="relative">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                <div>
                  <CameraOff24Regular className="w-12 h-12 mx-auto mb-2" />
                  <Text className="text-white">{error}</Text>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <ScanCamera24Regular className="w-8 h-8 mx-auto mb-2" />
                      <Text className="text-white text-sm">Arahkan ke barcode</Text>
                    </div>
                  </div>
                </div>
                
                {/* Scanning Animation */}
                {isScanning && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-64 h-1 bg-red-500 opacity-75 animate-pulse"></div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Camera Controls */}
          <div className="flex items-center justify-center space-x-4 mt-2">
            <Button
              appearance="outline"
              size="small"
              onClick={() => onSettingsChange({ ...settings, torch: !settings.torch })}
              disabled={!isScanning}
            >
              {settings.torch ? 'Matikan' : 'Nyalakan'} Flash
            </Button>
            
            <Button
              appearance="outline"
              size="small"
              onClick={() => onSettingsChange({ ...settings, beep: !settings.beep })}
            >
              Suara: {settings.beep ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function BarcodeScanner({
  open,
  onOpenChange,
  onProductFound,
  onBarcodeScanned,
  allowManualInput = true,
  autoClose = true,
  showProductPreview = true
}: BarcodeScannerProps) {
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    enabled: true,
    resolution: 'medium',
    torch: false,
    beep: true,
    vibrate: true
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setManualBarcode('');
      setFoundProduct(null);
      setQuantity(1);
      setScanHistory([]);
      // Focus manual input
      setTimeout(() => manualInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle barcode detection
  const handleBarcodeDetected = useCallback((barcode: string) => {
    if (onBarcodeScanned) {
      onBarcodeScanned(barcode);
    }
    
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const product = findProductByBarcode(barcode);
      const scanResult: ScanResult = {
        barcode,
        product,
        timestamp: new Date(),
        success: !!product,
        error: product ? undefined : 'Produk tidak ditemukan'
      };
      
      setScanHistory(prev => [scanResult, ...prev.slice(0, 4)]); // Keep last 5 scans
      
      if (product) {
        setFoundProduct(product);
        setQuantity(1);
        
        // Play feedback
        if (cameraSettings.beep) playBeepSound();
        if (cameraSettings.vibrate) vibrateDevice();
        
        toast.success(`Produk ditemukan: ${product.name}`);
        
        if (autoClose && !showProductPreview) {
          onProductFound(product, 1);
          onOpenChange(false);
        }
      } else {
        setFoundProduct(null);
        toast.error(`Barcode ${barcode} tidak ditemukan`);
      }
      
      setIsSearching(false);
    }, 500);
  }, [onBarcodeScanned, onProductFound, autoClose, showProductPreview, cameraSettings.beep, cameraSettings.vibrate]);

  // Handle manual barcode input
  const handleManualSearch = () => {
    if (!manualBarcode.trim()) {
      toast.error('Masukkan kode barcode atau kode produk');
      return;
    }
    
    handleBarcodeDetected(manualBarcode.trim());
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (foundProduct) {
      onProductFound(foundProduct, quantity);
      toast.success(`${foundProduct.name} ditambahkan ke keranjang`);
      
      if (autoClose) {
        onOpenChange(false);
      } else {
        // Reset for next scan
        setFoundProduct(null);
        setManualBarcode('');
        setQuantity(1);
      }
    }
  };

  // Handle Enter key in manual input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogBody className="flex flex-col h-full">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code24Regular />
              <Text className="text-xl font-semibold">Scanner Barcode</Text>
            </div>
            <Badge appearance="outline">
              {scanHistory.length} scan terakhir
            </Badge>
          </DialogTitle>
          
          <DialogContent className="flex-1 overflow-hidden">
            <div className="space-y-6 h-full flex flex-col">
              {/* Manual Input */}
              {allowManualInput && (
                <div className="space-y-2">
                  <Text weight="semibold">Input Manual</Text>
                  <div className="flex items-center space-x-2">
                    <Input
                      ref={manualInputRef}
                      placeholder="Masukkan kode barcode atau kode produk..."
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      contentBefore={<Search24Regular />}
                      className="flex-1"
                      size="large"
                    />
                    <Button
                      appearance="primary"
                      onClick={handleManualSearch}
                      disabled={!manualBarcode.trim() || isSearching}
                      icon={isSearching ? <Spinner size="tiny" /> : <Search24Regular />}
                    >
                      {isSearching ? 'Mencari...' : 'Cari'}
                    </Button>
                  </div>
                </div>
              )}
              
              <Divider />
              
              {/* Camera Scanner */}
              <div className="space-y-2">
                <Text weight="semibold">Scanner Kamera</Text>
                <CameraScanner
                  onBarcodeDetected={handleBarcodeDetected}
                  settings={cameraSettings}
                  onSettingsChange={setCameraSettings}
                />
              </div>
              
              {/* Product Preview */}
              {showProductPreview && foundProduct && (
                <div className="space-y-2">
                  <Text weight="semibold">Produk Ditemukan</Text>
                  <ProductPreview
                    product={foundProduct}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              )}
              
              {/* Scan History */}
              {scanHistory.length > 0 && (
                <div className="space-y-2">
                  <Text weight="semibold">Riwayat Scan</Text>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center justify-between p-2 rounded border',
                          scan.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          {scan.success ? (
                            <Checkmark24Regular className="w-4 h-4 text-green-600" />
                          ) : (
                            <Warning24Regular className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <Text size={200} weight="semibold">
                              {scan.barcode}
                            </Text>
                            {scan.product && (
                              <Caption1 className="text-gray-600">
                                {scan.product.name}
                              </Caption1>
                            )}
                            {scan.error && (
                              <Caption1 className="text-red-600">
                                {scan.error}
                              </Caption1>
                            )}
                          </div>
                        </div>
                        <Caption1 className="text-gray-500">
                          {scan.timestamp.toLocaleTimeString()}
                        </Caption1>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
          
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
            
            {foundProduct && !showProductPreview && (
              <Button
                appearance="primary"
                onClick={handleAddToCart}
                icon={<Checkmark24Regular />}
              >
                Tambah ke Keranjang
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

export type { BarcodeScannerProps, Product, ScanResult, CameraSettings };