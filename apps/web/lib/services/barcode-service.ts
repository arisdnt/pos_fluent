// ======================================================================
// BARCODE SERVICE
// Service untuk scanning barcode dengan kamera dan audio feedback
// ======================================================================

import { z } from 'zod';

// ======================================================================
// TYPES & INTERFACES
// ======================================================================

export interface BarcodeResult {
  code: string;
  format: string;
  timestamp: Date;
  confidence?: number;
}

export interface ScannerSettings {
  enableSound: boolean;
  enableVibration: boolean;
  enableFlash: boolean;
  scanDelay: number; // ms
  autoFocus: boolean;
  preferredCamera: 'front' | 'back' | 'auto';
  scanFormats: BarcodeFormat[];
}

export type BarcodeFormat = 
  | 'CODE_128'
  | 'CODE_39'
  | 'CODE_93'
  | 'EAN_8'
  | 'EAN_13'
  | 'UPC_A'
  | 'UPC_E'
  | 'QR_CODE'
  | 'DATA_MATRIX'
  | 'PDF_417'
  | 'AZTEC'
  | 'CODABAR'
  | 'ITF'
  | 'RSS_14'
  | 'RSS_EXPANDED';

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
  facing?: 'front' | 'back';
}

export interface ScannerState {
  isScanning: boolean;
  isInitializing: boolean;
  hasPermission: boolean;
  error?: string;
  currentCamera?: CameraDevice;
  availableCameras: CameraDevice[];
}

// ======================================================================
// VALIDATION SCHEMAS
// ======================================================================

const BarcodeSchema = z.string()
  .min(1, 'Barcode tidak boleh kosong')
  .max(50, 'Barcode terlalu panjang')
  .regex(/^[0-9A-Za-z\-_\.]+$/, 'Format barcode tidak valid');

// ======================================================================
// BARCODE SERVICE CLASS
// ======================================================================

export class BarcodeService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private lastScanTime: number = 0;
  private scanHistory: BarcodeResult[] = [];
  private settings: ScannerSettings = {
    enableSound: true,
    enableVibration: true,
    enableFlash: false,
    scanDelay: 500,
    autoFocus: true,
    preferredCamera: 'back',
    scanFormats: ['EAN_13', 'EAN_8', 'CODE_128', 'CODE_39', 'QR_CODE']
  };

  private state: ScannerState = {
    isScanning: false,
    isInitializing: false,
    hasPermission: false,
    availableCameras: []
  };

  private callbacks: {
    onScan?: (result: BarcodeResult) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: ScannerState) => void;
  } = {};

  // ======================================================================
  // INITIALIZATION METHODS
  // ======================================================================

  /**
   * Initialize barcode service
   */
  async initialize(): Promise<void> {
    try {
      this.updateState({ isInitializing: true, error: undefined });
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung di browser ini');
      }
      
      // Request camera permission
      await this.requestCameraPermission();
      
      // Get available cameras
      await this.getAvailableCameras();
      
      this.updateState({ 
        isInitializing: false, 
        hasPermission: true 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menginisialisasi scanner';
      this.updateState({ 
        isInitializing: false, 
        hasPermission: false, 
        error: errorMessage 
      });
      throw error;
    }
  }

  /**
   * Request camera permission
   */
  private async requestCameraPermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Akses kamera ditolak. Silakan berikan izin kamera.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('Kamera tidak ditemukan.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Kamera tidak didukung.');
        }
      }
      throw new Error('Gagal mengakses kamera');
    }
  }

  /**
   * Get available cameras
   */
  private async getAvailableCameras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Kamera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
          facing: this.detectCameraFacing(device.label)
        }));
      
      this.updateState({ availableCameras: cameras });
      
    } catch (error) {
      console.warn('Gagal mendapatkan daftar kamera:', error);
      this.updateState({ availableCameras: [] });
    }
  }

  /**
   * Detect camera facing from label
   */
  private detectCameraFacing(label: string): 'front' | 'back' | undefined {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
      return 'front';
    } else if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
      return 'back';
    }
    return undefined;
  }

  // ======================================================================
  // SCANNING METHODS
  // ======================================================================

  /**
   * Start scanning
   */
  async startScanning(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): Promise<void> {
    try {
      if (this.state.isScanning) {
        return;
      }
      
      if (!this.state.hasPermission) {
        await this.initialize();
      }
      
      this.videoElement = videoElement;
      this.canvasElement = canvasElement || document.createElement('canvas');
      this.context = this.canvasElement.getContext('2d');
      
      if (!this.context) {
        throw new Error('Gagal membuat canvas context');
      }
      
      // Start camera stream
      await this.startCameraStream();
      
      // Start scanning loop
      this.startScanningLoop();
      
      this.updateState({ isScanning: true, error: undefined });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulai scanning';
      this.updateState({ error: errorMessage });
      this.callbacks.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.updateState({ 
      isScanning: false, 
      currentCamera: undefined 
    });
  }

  /**
   * Start camera stream
   */
  private async startCameraStream(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: this.settings.preferredCamera === 'front' ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    };
    
    // Use specific camera if available
    const preferredCamera = this.getPreferredCamera();
    if (preferredCamera) {
      constraints.video = {
        ...constraints.video,
        deviceId: { exact: preferredCamera.deviceId }
      };
    }
    
    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (this.videoElement) {
      this.videoElement.srcObject = this.mediaStream;
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element tidak tersedia'));
          return;
        }
        
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play()
            .then(() => resolve())
            .catch(reject);
        };
        
        this.videoElement.onerror = () => {
          reject(new Error('Gagal memuat video stream'));
        };
      });
    }
    
    this.updateState({ currentCamera: preferredCamera });
  }

  /**
   * Get preferred camera
   */
  private getPreferredCamera(): CameraDevice | undefined {
    const { availableCameras } = this.state;
    
    if (availableCameras.length === 0) {
      return undefined;
    }
    
    // Try to find camera based on preference
    if (this.settings.preferredCamera === 'front') {
      return availableCameras.find(cam => cam.facing === 'front') || availableCameras[0];
    } else if (this.settings.preferredCamera === 'back') {
      return availableCameras.find(cam => cam.facing === 'back') || availableCameras[0];
    }
    
    return availableCameras[0];
  }

  /**
   * Start scanning loop
   */
  private startScanningLoop(): void {
    this.scanInterval = setInterval(() => {
      this.scanFrame();
    }, this.settings.scanDelay);
  }

  /**
   * Scan current frame
   */
  private scanFrame(): void {
    if (!this.videoElement || !this.canvasElement || !this.context) {
      return;
    }
    
    const { videoWidth, videoHeight } = this.videoElement;
    if (videoWidth === 0 || videoHeight === 0) {
      return;
    }
    
    // Set canvas size to match video
    this.canvasElement.width = videoWidth;
    this.canvasElement.height = videoHeight;
    
    // Draw current frame to canvas
    this.context.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);
    
    // Get image data for processing
    const imageData = this.context.getImageData(0, 0, videoWidth, videoHeight);
    
    // Simulate barcode detection (in real implementation, use a library like ZXing)
    this.simulateBarcodeDetection(imageData);
  }

  /**
   * Simulate barcode detection
   * In real implementation, use a proper barcode detection library
   */
  private simulateBarcodeDetection(imageData: ImageData): void {
    // This is a simulation - in real implementation, use ZXing or similar library
    const now = Date.now();
    
    // Prevent too frequent scans
    if (now - this.lastScanTime < this.settings.scanDelay) {
      return;
    }
    
    // Simulate random barcode detection (for demo purposes)
    if (Math.random() < 0.1) { // 10% chance of detecting a barcode
      const mockBarcodes = [
        '8991002123456',
        '8991002234567',
        '8991002345678',
        '1234567890123',
        '9876543210987'
      ];
      
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      const result: BarcodeResult = {
        code: randomBarcode,
        format: 'EAN_13',
        timestamp: new Date(),
        confidence: 0.95
      };
      
      this.handleBarcodeDetected(result);
      this.lastScanTime = now;
    }
  }

  /**
   * Handle barcode detected
   */
  private handleBarcodeDetected(result: BarcodeResult): void {
    try {
      // Validate barcode
      BarcodeSchema.parse(result.code);
      
      // Add to history
      this.addToHistory(result);
      
      // Play feedback
      this.playFeedback();
      
      // Notify callback
      this.callbacks.onScan?.(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Barcode tidak valid';
      this.callbacks.onError?.(errorMessage);
    }
  }

  // ======================================================================
  // FEEDBACK METHODS
  // ======================================================================

  /**
   * Play audio and haptic feedback
   */
  private playFeedback(): void {
    // Play sound
    if (this.settings.enableSound) {
      this.playBeepSound();
    }
    
    // Vibrate
    if (this.settings.enableVibration && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  /**
   * Play beep sound
   */
  private playBeepSound(): void {
    try {
      // Create audio context for beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
    } catch (error) {
      console.warn('Gagal memutar suara beep:', error);
    }
  }

  // ======================================================================
  // HISTORY METHODS
  // ======================================================================

  /**
   * Add barcode to history
   */
  private addToHistory(result: BarcodeResult): void {
    this.scanHistory.unshift(result);
    
    // Keep only last 50 scans
    if (this.scanHistory.length > 50) {
      this.scanHistory = this.scanHistory.slice(0, 50);
    }
  }

  /**
   * Get scan history
   */
  getScanHistory(): BarcodeResult[] {
    return [...this.scanHistory];
  }

  /**
   * Clear scan history
   */
  clearScanHistory(): void {
    this.scanHistory = [];
  }

  // ======================================================================
  // CAMERA CONTROL METHODS
  // ======================================================================

  /**
   * Switch camera
   */
  async switchCamera(deviceId?: string): Promise<void> {
    if (!this.state.isScanning) {
      return;
    }
    
    const targetCamera = deviceId 
      ? this.state.availableCameras.find(cam => cam.deviceId === deviceId)
      : this.getNextCamera();
    
    if (!targetCamera) {
      throw new Error('Kamera tidak ditemukan');
    }
    
    // Stop current stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    // Start new stream with target camera
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: targetCamera.deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    };
    
    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (this.videoElement) {
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();
    }
    
    this.updateState({ currentCamera: targetCamera });
  }

  /**
   * Get next camera in list
   */
  private getNextCamera(): CameraDevice | undefined {
    const { availableCameras, currentCamera } = this.state;
    
    if (availableCameras.length <= 1) {
      return currentCamera;
    }
    
    if (!currentCamera) {
      return availableCameras[0];
    }
    
    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCamera.deviceId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    
    return availableCameras[nextIndex];
  }

  /**
   * Toggle flash (if supported)
   */
  async toggleFlash(): Promise<void> {
    if (!this.mediaStream) {
      return;
    }
    
    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }
    
    try {
      const capabilities = videoTrack.getCapabilities();
      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !this.settings.enableFlash } as any]
        });
        
        this.settings.enableFlash = !this.settings.enableFlash;
      }
    } catch (error) {
      console.warn('Flash tidak didukung:', error);
      throw new Error('Flash tidak didukung pada kamera ini');
    }
  }

  // ======================================================================
  // SETTINGS METHODS
  // ======================================================================

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ScannerSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): ScannerSettings {
    return { ...this.settings };
  }

  // ======================================================================
  // STATE MANAGEMENT
  // ======================================================================

  /**
   * Update state and notify callbacks
   */
  private updateState(updates: Partial<ScannerState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Get current state
   */
  getState(): ScannerState {
    return { ...this.state };
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onScan?: (result: BarcodeResult) => void;
    onError?: (error: string) => void;
    onStateChange?: (state: ScannerState) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ======================================================================
  // CLEANUP
  // ======================================================================

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopScanning();
    this.callbacks = {};
    this.scanHistory = [];
  }
}

// ======================================================================
// SINGLETON INSTANCE
// ======================================================================

export const barcodeService = new BarcodeService();
export default barcodeService;