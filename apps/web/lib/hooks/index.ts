// ======================================================================
// HOOKS INDEX
// Export semua custom hooks untuk aplikasi POS
// ======================================================================

import { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef, 
  useContext, 
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  useDeferredValue,
  useTransition,
  useId,
  type RefObject, 
  type MutableRefObject 
} from 'react';

// POS Core Hook
export { usePOS } from './use-pos';
export type { 
  POSState, 
  POSActions, 
  UsePOSReturn 
} from './use-pos';

// Barcode Scanner Hook
export { useBarcodeScanner } from './use-barcode-scanner';
export type { 
  BarcodeScannerState, 
  BarcodeScannerActions, 
  BarcodeScannerCallbacks,
  UseBarcodeScannerReturn 
} from './use-barcode-scanner';

// Shift Management Hook
export { useShiftManagement } from './use-shift-management';
export type { 
  Shift,
  ShiftSummary,
  ShiftManagementState, 
  ShiftManagementActions, 
  ShiftManagementCallbacks,
  UseShiftManagementReturn 
} from './use-shift-management';

// Transaction Management Hook
export { useTransactionManagement } from './use-transaction-management';
export type { 
  TransactionManagementState, 
  TransactionManagementActions, 
  TransactionManagementCallbacks,
  UseTransactionManagementReturn 
} from './use-transaction-management';

// ======================================================================
// UTILITY HOOKS
// ======================================================================

// Hook untuk mengelola local storage dengan type safety
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

// Hook untuk debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook untuk throttle
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Hook untuk previous value
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Hook untuk async operation dengan loading state
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}

// Hook untuk keyboard shortcuts
export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
    enabled?: boolean;
  } = {}
) {
  const {
    preventDefault = true,
    stopPropagation = true,
    enabled = true
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const pressedKeys: string[] = [];
      
      if (event.ctrlKey) pressedKeys.push('ctrl');
      if (event.altKey) pressedKeys.push('alt');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.metaKey) pressedKeys.push('meta');
      
      pressedKeys.push(event.key.toLowerCase());

      const isMatch = keys.every(key => pressedKeys.includes(key.toLowerCase()));

      if (isMatch) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keys, callback, preventDefault, stopPropagation, enabled]);
}

// Hook untuk window size
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Hook untuk media query
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Hook untuk click outside
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

// Hook untuk intersection observer
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

// Re-export React hooks untuk konsistensi
export { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef, 
  useContext, 
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  useDeferredValue,
  useTransition,
  useId
};

export type { RefObject, MutableRefObject };