// ======================================================================
// CLIENT PROVIDERS
// Komponen client yang menggabungkan semua provider untuk aplikasi
// ======================================================================

'use client';

import React from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth/use-auth';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { KeyboardProvider } from '@/lib/keyboard/keyboard-provider';
import { PrintProvider } from '@/lib/print/print-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { ShortcutsHelp } from '@/components/keyboard/shortcuts-help';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FluentProvider theme={webLightTheme}>
          <AuthProvider>
            <KeyboardProvider>
              <PrintProvider>
                <div id="app-root" className="h-screen w-screen flex flex-col">
                  {/* Skip to main content untuk accessibility */}
                  <a 
                    href="#main-content" 
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
                  >
                    Lewati ke konten utama
                  </a>
                  
                  {/* Main Content */}
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                  
                  {/* Keyboard Shortcuts Help */}
                  <ShortcutsHelp />
                  
                  {/* Toast Notifications */}
                  <Toaster
                    position="top-right"
                    reverseOrder={false}
                    gutter={8}
                    containerClassName=""
                    containerStyle={{}}
                    toastOptions={{
                      // Default options
                      className: '',
                      duration: 4000,
                      style: {
                        background: '#ffffff',
                        color: '#1a1a1a',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Segoe UI, system-ui, sans-serif',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        maxWidth: '400px'
                      },
                      
                      // Success toast
                      success: {
                        duration: 3000,
                        style: {
                          background: '#f0f9ff',
                          color: '#0c4a6e',
                          border: '1px solid #0ea5e9'
                        },
                        iconTheme: {
                          primary: '#0ea5e9',
                          secondary: '#f0f9ff'
                        }
                      },
                      
                      // Error toast
                      error: {
                        duration: 5000,
                        style: {
                          background: '#fef2f2',
                          color: '#991b1b',
                          border: '1px solid #ef4444'
                        },
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fef2f2'
                        }
                      },
                      
                      // Loading toast
                      loading: {
                        duration: Infinity,
                        style: {
                          background: '#fefce8',
                          color: '#a16207',
                          border: '1px solid #eab308'
                        },
                        iconTheme: {
                          primary: '#eab308',
                          secondary: '#fefce8'
                        }
                      }
                    }}
                  />
                </div>
              </PrintProvider>
            </KeyboardProvider>
          </AuthProvider>
        </FluentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}