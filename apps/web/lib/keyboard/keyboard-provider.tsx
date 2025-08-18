// ======================================================================
// KEYBOARD PROVIDER
// Provider untuk mengelola shortcut keyboard dalam aplikasi
// ======================================================================

'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';

type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description?: string;
};

type KeyboardProviderState = {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  shortcuts: KeyboardShortcut[];
};

const KeyboardProviderContext = createContext<KeyboardProviderState | undefined>(undefined);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = React.useState<KeyboardShortcut[]>([]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      const filtered = prev.filter(s => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = (s.ctrlKey || false) === event.ctrlKey;
      const altMatch = (s.altKey || false) === event.altKey;
      const shiftMatch = (s.shiftKey || false) === event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const value = {
    registerShortcut,
    unregisterShortcut,
    shortcuts,
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