// ======================================================================
// USE BARCODE SCANNER HOOK
// React hook untuk mengelola barcode scanner
// ======================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  barcodeService, 
  type BarcodeResult, 
  type ScannerSettings, 
  type CameraDevice, 
  type ScannerStatus,
  type ScanHistory
} from '../services';

// ======================================================================
// TYPES
// ======================================================================

export interface BarcodeScannerState {
  // Scanner status
  status: ScannerStatus;
  isScanning: boolean;
  isInitialized: boolean;
  
  // Camera
  cameras: CameraDevice[];
  selectedCamera: CameraDevice | null;
  hasPermission: boolean;
  
  // Scan results
  lastResult: BarcodeResult | null;
  scanHistory: ScanHistory[];
  
  // Settings
  settings: ScannerSettings;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Video element
  videoElement: HTMLVideoElement | null;
}

export interface BarcodeScannerActions {
  // Initialization
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  
  // Scanning
  startScanning: () => Promise<boolean>;
  stopScanning: () => void;
  
  // Camera management
  switchCamera: (cameraId: string) => Promise<boolean>;
  toggleFlash: () => Promise<boolean>;
  
  // Settings
  updateSettings: (settings: Partial<ScannerSettings>) => void;
  
  // History
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  
  // Video element
  setVideoElement: (element: HTMLVideoElement | null) => void;
  
  // Error handling
  clearError: () => void;
}

export interface BarcodeScannerCallbacks {
  onScan?: (result: BarcodeResult) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ScannerStatus) => void;
}

// ======================================================================
// HOOK IMPLEMENTATION
// ======================================================================

export function useBarcodeScanner(callbacks?: BarcodeScannerCallbacks) {
  // ======================================================================
  // STATE
  // ======================================================================
  
  const [state, setState] = useState<BarcodeScannerState>({
    status: 'idle',
    isScanning: false,
    isInitialized: false,
    cameras: [],
    selectedCamera: null,
    hasPermission: false,
    lastResult: null,
    scanHistory: [],
    settings: {
      enableSound: true,
      enableVibration: true,
      enableFlash: false,
      scanDelay: 1000,
      formats: ['code128', 'ean13', 'ean8', 'qr'],
      continuous: true,
      preferredCamera: 'environment'
    },
    isLoading: false,
    error: null,
    videoElement: null
  });

  // Refs for stable references
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  stateRef.current = state;
  callbacksRef.current = callbacks;

  // ======================================================================
  // UTILITY FUNCTIONS
  // ======================================================================

  const updateState = useCallback((updates: Partial<BarcodeScannerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
    if (error && callbacksRef.current?.onError) {
      callbacksRef.current.onError(error);
    }
  }, [updateState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setStatus = useCallback((status: ScannerStatus) => {
    updateState({ status });
    if (callbacksRef.current?.onStatusChange) {
      callbacksRef.current.onStatusChange(status);
    }
  }, [updateState]);

  // ======================================================================
  // INITIALIZATION
  // ======================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setStatus('initializing');
      clearError();

      // Request camera permission
      const hasPermission = await barcodeService.requestCameraPermission();
      if (!hasPermission) {
        setError('Izin kamera diperlukan untuk memindai barcode');
        setStatus('error');
        return false;
      }

      // Get available cameras
      const cameras = await barcodeService.getCameras();
      if (cameras.length === 0) {
        setError('Tidak ada kamera yang tersedia');
        setStatus('error');
        return false;
      }

      // Select default camera
      const preferredCamera = cameras.find(cam => 
        cam.facingMode === state.settings.preferredCamera
      ) || cameras[0];

      updateState({
        hasPermission: true,
        cameras,
        selectedCamera: preferredCamera,
        isInitialized: true
      });

      setStatus('ready');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menginisialisasi scanner';
      setError(errorMessage);
      setStatus('error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.settings.preferredCamera, setLoading, setStatus, clearError, setError, updateState]);

  const cleanup = useCallback(() => {
    if (state.isScanning) {
      barcodeService.stopScanning();
    }
    
    updateState({
      status: 'idle',
      isScanning: false,
      isInitialized: false,
      selectedCamera: null,
      videoElement: null
    });
  }, [state.isScanning, updateState]);

  // ======================================================================
  // SCANNING
  // ======================================================================

  const startScanning = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized || !state.selectedCamera) {
      setError('Scanner belum diinisialisasi');
      return false;
    }

    if (!state.videoElement) {
      setError('Video element belum diset');
      return false;
    }

    try {
      setLoading(true);
      setStatus('starting');
      clearError();

      // Update scanner settings
      await barcodeService.updateSettings(state.settings);

      // Start scanning
      const success = await barcodeService.startScanning(
        state.selectedCamera.deviceId,
        state.videoElement
      );

      if (success) {
        updateState({ isScanning: true });
        setStatus('scanning');
        return true;
      } else {
        setError('Gagal memulai pemindaian');
        setStatus('error');
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulai pemindaian';
      setError(errorMessage);
      setStatus('error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    state.isInitialized, 
    state.selectedCamera, 
    state.videoElement, 
    state.settings,
    setLoading, 
    setStatus, 
    clearError, 
    setError, 
    updateState
  ]);

  const stopScanning = useCallback(() => {
    if (state.isScanning) {
      barcodeService.stopScanning();
      updateState({ isScanning: false });
      setStatus('ready');
    }
  }, [state.isScanning, updateState, setStatus]);

  // ======================================================================
  // CAMERA MANAGEMENT
  // ======================================================================

  const switchCamera = useCallback(async (cameraId: string): Promise<boolean> => {
    const camera = state.cameras.find(cam => cam.deviceId === cameraId);
    if (!camera) {
      setError('Kamera tidak ditemukan');
      return false;
    }

    try {
      setLoading(true);
      
      // Stop current scanning if active
      const wasScanning = state.isScanning;
      if (wasScanning) {
        stopScanning();
      }

      // Switch camera
      const success = await barcodeService.switchCamera(cameraId);
      if (success) {
        updateState({ selectedCamera: camera });
        
        // Restart scanning if it was active
        if (wasScanning) {
          await startScanning();
        }
        
        return true;
      } else {
        setError('Gagal beralih kamera');
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal beralih kamera';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.cameras, state.isScanning, setLoading, setError, updateState, stopScanning, startScanning]);

  const toggleFlash = useCallback(async (): Promise<boolean> => {
    try {
      const newFlashState = !state.settings.enableFlash;
      const success = await barcodeService.toggleFlash();
      
      if (success) {
        updateState({
          settings: { ...state.settings, enableFlash: newFlashState }
        });
        return true;
      } else {
        setError('Gagal mengubah flash');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah flash';
      setError(errorMessage);
      return false;
    }
  }, [state.settings, updateState, setError]);

  // ======================================================================
  // SETTINGS
  // ======================================================================

  const updateSettings = useCallback((newSettings: Partial<ScannerSettings>) => {
    const updatedSettings = { ...state.settings, ...newSettings };
    updateState({ settings: updatedSettings });
    
    // Update service settings if scanning
    if (state.isScanning) {
      barcodeService.updateSettings(updatedSettings);
    }
  }, [state.settings, state.isScanning, updateState]);

  // ======================================================================
  // HISTORY
  // ======================================================================

  const clearHistory = useCallback(() => {
    barcodeService.clearHistory();
    updateState({ scanHistory: [] });
  }, [updateState]);

  const removeFromHistory = useCallback((id: string) => {
    barcodeService.removeFromHistory(id);
    const updatedHistory = state.scanHistory.filter(item => item.id !== id);
    updateState({ scanHistory: updatedHistory });
  }, [state.scanHistory, updateState]);

  // ======================================================================
  // VIDEO ELEMENT
  // ======================================================================

  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    updateState({ videoElement: element });
  }, [updateState]);

  // ======================================================================
  // EVENT HANDLERS
  // ======================================================================

  const handleScanResult = useCallback((result: BarcodeResult) => {
    updateState({ 
      lastResult: result,
      scanHistory: barcodeService.getHistory()
    });
    
    if (callbacksRef.current?.onScan) {
      callbacksRef.current.onScan(result);
    }
  }, [updateState]);

  const handleScanError = useCallback((error: string) => {
    setError(error);
  }, [setError]);

  // ======================================================================
  // EFFECTS
  // ======================================================================

  // Setup event listeners
  useEffect(() => {
    const unsubscribeResult = barcodeService.onScanResult(handleScanResult);
    const unsubscribeError = barcodeService.onScanError(handleScanError);

    return () => {
      unsubscribeResult();
      unsubscribeError();
    };
  }, [handleScanResult, handleScanError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // ======================================================================
  // KEYBOARD SHORTCUTS
  // ======================================================================

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when scanner is active
      if (!state.isInitialized) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (state.isScanning) {
            stopScanning();
          } else {
            startScanning();
          }
          break;

        case 'KeyF':
          if (event.ctrlKey) {
            event.preventDefault();
            toggleFlash();
          }
          break;

        case 'KeyC':
          if (event.ctrlKey) {
            event.preventDefault();
            if (state.cameras.length > 1) {
              const currentIndex = state.cameras.findIndex(
                cam => cam.deviceId === state.selectedCamera?.deviceId
              );
              const nextIndex = (currentIndex + 1) % state.cameras.length;
              switchCamera(state.cameras[nextIndex].deviceId);
            }
          }
          break;

        case 'Escape':
          event.preventDefault();
          stopScanning();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    state.isInitialized,
    state.isScanning,
    state.cameras,
    state.selectedCamera,
    startScanning,
    stopScanning,
    toggleFlash,
    switchCamera
  ]);

  // ======================================================================
  // RETURN
  // ======================================================================

  const actions: BarcodeScannerActions = {
    // Initialization
    initialize,
    cleanup,
    
    // Scanning
    startScanning,
    stopScanning,
    
    // Camera management
    switchCamera,
    toggleFlash,
    
    // Settings
    updateSettings,
    
    // History
    clearHistory,
    removeFromHistory,
    
    // Video element
    setVideoElement,
    
    // Error handling
    clearError
  };

  return {
    state,
    actions
  };
}

export type UseBarcodeScannerReturn = ReturnType<typeof useBarcodeScanner>;