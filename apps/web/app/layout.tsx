// ======================================================================
// ROOT LAYOUT - APLIKASI KASIR
// Layout utama untuk seluruh aplikasi Point of Sale
// ======================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/providers/ClientProviders';
import '@/styles/globals.css';

// ======================================================================
// FONT CONFIGURATION
// ======================================================================

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// ======================================================================
// METADATA CONFIGURATION
// ======================================================================

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
  ]
};

export const metadata: Metadata = {
  title: {
    default: 'POS Kasir Suite',
    template: '%s | POS Kasir Suite'
  },
  description: 'Aplikasi Point of Sale untuk Kasir Indonesia - Sistem kasir modern dengan fitur lengkap',
  keywords: [
    'kasir', 'point of sale', 'pos', 'indonesia', 'retail', 'toko',
    'penjualan', 'inventory', 'stok', 'laporan', 'struk', 'barcode'
  ],
  authors: [{ name: 'POS Kasir Suite Team' }],
  creator: 'POS Kasir Suite',
  publisher: 'POS Kasir Suite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification tokens if needed
  },
  category: 'business',
  classification: 'Point of Sale System',
  referrer: 'origin-when-cross-origin',
  // manifest: '/manifest.json', // Disabled until manifest.json is created
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#0078d4' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'POS Kasir Suite',
    startupImage: [
      {
        url: '/apple-splash-2048-2732.jpg',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      }
    ]
  },
  applicationName: 'POS Kasir Suite',
  generator: 'Next.js',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'http://localhost:3000',
    siteName: 'POS Kasir Suite',
    title: 'POS Kasir Suite - Aplikasi Point of Sale Indonesia',
    description: 'Sistem kasir modern untuk toko dan retail di Indonesia dengan fitur lengkap',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'POS Kasir Suite - Aplikasi Point of Sale Indonesia'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POS Kasir Suite - Aplikasi Point of Sale Indonesia',
    description: 'Sistem kasir modern untuk toko dan retail di Indonesia dengan fitur lengkap',
    images: ['/twitter-image.png'],
    creator: '@poskasir'
  }
};

// ======================================================================
// ROOT LAYOUT COMPONENT
// ======================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        {/* Font preload removed - using Google Fonts instead */}
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Performance hints */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* PWA configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS Kasir" />
        
        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Viewport moved to viewport export */}
      </head>
      
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        <ClientProviders>
          {children}
        </ClientProviders>
        
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <div id="dev-tools" className="fixed bottom-4 right-4 z-50">
            {/* Development indicators */}
          </div>
        )}
        
        {/* Service Worker Registration - Disabled for now */}
        {/* Will be enabled when sw.js is properly configured */}
        
        {/* Keyboard shortcuts help */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global keyboard shortcuts
              document.addEventListener('keydown', function(e) {
                // F1 - Help
                if (e.key === 'F1') {
                  e.preventDefault();
                  // Show help modal
                }
                
                // F2 - Quick search
                if (e.key === 'F2') {
                  e.preventDefault();
                  // Focus search input
                }
                
                // F3 - New transaction
                if (e.key === 'F3') {
                  e.preventDefault();
                  // Start new transaction
                }
                
                // F4 - Payment
                if (e.key === 'F4') {
                  e.preventDefault();
                  // Open payment modal
                }
                
                // F5 - Refresh (prevent default)
                if (e.key === 'F5') {
                  e.preventDefault();
                  // Custom refresh logic
                }
                
                // F12 - Developer tools (allow default)
                if (e.key === 'F12') {
                  // Allow default behavior
                }
                
                // Escape - Close modals
                if (e.key === 'Escape') {
                  // Close any open modals
                }
                
                // Ctrl+S - Save (prevent default)
                if (e.ctrlKey && e.key === 's') {
                  e.preventDefault();
                  // Custom save logic
                }
                
                // Ctrl+P - Print receipt
                if (e.ctrlKey && e.key === 'p') {
                  e.preventDefault();
                  // Print receipt
                }
                
                // Ctrl+N - New transaction
                if (e.ctrlKey && e.key === 'n') {
                  e.preventDefault();
                  // New transaction
                }
                
                // Ctrl+F - Search
                if (e.ctrlKey && e.key === 'f') {
                  e.preventDefault();
                  // Focus search
                }
              });
              
              // Prevent context menu on production
              if (window.location.hostname !== 'localhost') {
                document.addEventListener('contextmenu', function(e) {
                  e.preventDefault();
                });
              }
              
              // Prevent drag and drop
              document.addEventListener('dragover', function(e) {
                e.preventDefault();
              });
              
              document.addEventListener('drop', function(e) {
                e.preventDefault();
              });
            `
          }}
        />
      </body>
    </html>
  );
}