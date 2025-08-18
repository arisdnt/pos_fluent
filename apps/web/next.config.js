/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone untuk Tauri sidecar
  output: 'standalone',
  
  // Telemetry disabled via env variable
  
  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['127.0.0.1', 'localhost']
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
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize for desktop app
    if (isServer) {
      config.externals.push('pg-native')
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