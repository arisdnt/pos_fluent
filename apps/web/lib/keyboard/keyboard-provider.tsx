// ======================================================================
// ENHANCED KEYBOARD PROVIDER
// Provider untuk mengelola shortcut keyboard dengan database komprehensif
// ======================================================================

'use client';

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  KeyboardShortcutDefinition, 
  getActiveShortcuts, 
  formatShortcutKey,
  ALL_SHORTCUTS
} from './shortcuts-database';

type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
};

type ShortcutAction = {
  [key: string]: () => void;
};

type KeyboardProviderState = {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  registerAction: (actionId: string, action: () => void) => void;
  unregisterAction: (actionId: string) => void;
  shortcuts: KeyboardShortcut[];
  activeShortcuts: KeyboardShortcutDefinition[];
  showHelp: () => void;
  hideHelp: () => void;
  isHelpVisible: boolean;
};

const KeyboardProviderContext = createContext<KeyboardProviderState | undefined>(undefined);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [actions, setActions] = useState<ShortcutAction>({});
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get active shortcuts for current page
  const activeShortcuts = getActiveShortcuts(pathname);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const filtered = prev.filter(s => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  const registerAction = useCallback((actionId: string, action: () => void) => {
    setActions(prev => ({ ...prev, [actionId]: action }));
  }, []);

  const unregisterAction = useCallback((actionId: string) => {
    setActions(prev => {
      const newActions = { ...prev };
      delete newActions[actionId];
      return newActions;
    });
  }, []);

  const showHelp = useCallback(() => {
    setIsHelpVisible(true);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
  }, []);

  // Default navigation actions
  const defaultActions: ShortcutAction = {
    'navigate-dashboard': () => router.push('/dashboard'),
    'navigate-pos': () => router.push('/pos'),
    'navigate-products': () => router.push('/products'),
    'navigate-inventory': () => router.push('/inventory'),
    'navigate-customers': () => router.push('/customers'),
    'navigate-reports': () => router.push('/reports'),
    'navigate-orders': () => router.push('/orders'),
    'navigate-settings': () => router.push('/settings'),
    'show-help': showHelp,
    'close-modal': hideHelp,
    'refresh-page': () => window.location.reload(),
    'open-search': () => {
      // TODO: Implement global search
      console.log('Global search not implemented yet');
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Check custom shortcuts first
    const customShortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = (s.ctrlKey || false) === event.ctrlKey;
      const altMatch = (s.altKey || false) === event.altKey;
      const shiftMatch = (s.shiftKey || false) === event.shiftKey;
      const metaMatch = (s.metaKey || false) === event.metaKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
    });

    if (customShortcut) {
      event.preventDefault();
      customShortcut.action();
      return;
    }

    // Check database shortcuts
    const dbShortcut = activeShortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = (s.ctrlKey || false) === event.ctrlKey;
      const altMatch = (s.altKey || false) === event.altKey;
      const shiftMatch = (s.shiftKey || false) === event.shiftKey;
      const metaMatch = (s.metaKey || false) === event.metaKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
    });

    if (dbShortcut) {
      const action = actions[dbShortcut.action] || defaultActions[dbShortcut.action];
      if (action) {
        event.preventDefault();
        action();
      }
    }

  }, [shortcuts, activeShortcuts, actions, defaultActions]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const value = {
    registerShortcut,
    unregisterShortcut,
    registerAction,
    unregisterAction,
    shortcuts,
    activeShortcuts,
    showHelp,
    hideHelp,
    isHelpVisible,
  };

  return (
    <KeyboardProviderContext.Provider value={value}>
      {children}
    </KeyboardProviderContext.Provider>
  );
}

export const useKeyboard = () => {
  const context = useContext(KeyboardProviderContext);

  if (context === undefined)
    throw new Error('useKeyboard must be used within a KeyboardProvider');

  return context;
};

// Hook untuk mendaftarkan shortcut dengan mudah
export const useKeyboardShortcut = (shortcut: KeyboardShortcut) => {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    registerShortcut(shortcut);
    return () => unregisterShortcut(shortcut.key);
  }, [registerShortcut, unregisterShortcut, shortcut]);
};