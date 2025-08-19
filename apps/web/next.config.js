/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone untuk Tauri sidecar
  output: 'standalone',
  
  // Telemetry disabled via env variable
  
  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['127.0.0.1', 'localhost']
    },
    // Enable Turbopack optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Development optimizations
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Optimize for desktop app
    if (isServer) {
      config.externals.push('pg-native')
    }
    
    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/
      }
    }
    
    return config
  },
  
  // Image optimization
  images: {
    unoptimized: true // Disable for desktop app
  },
  
  // Disable SWC minify for better compatibility
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1'
  }
}

module.exports = nextConfig