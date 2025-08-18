/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fluent UI color tokens
        'fluent-neutral': {
          '10': '#fafafa',
          '20': '#f5f5f5',
          '30': '#ededed',
          '40': '#e1e1e1',
          '50': '#d1d1d1',
          '60': '#c8c8c8',
          '70': '#b3b3b3',
          '80': '#9e9e9e',
          '90': '#8a8a8a',
          '100': '#757575',
          '110': '#616161',
          '120': '#525252',
          '130': '#424242',
          '140': '#333333',
          '150': '#292929',
          '160': '#1f1f1f'
        },
        'fluent-brand': {
          '10': '#061724',
          '20': '#082338',
          '30': '#0a2e4a',
          '40': '#0c3b5e',
          '50': '#0e4775',
          '60': '#0f548c',
          '70': '#115ea3',
          '80': '#0f6cbd',
          '90': '#2886de',
          '100': '#479ef5',
          '110': '#62abf5',
          '120': '#77b7f7',
          '130': '#96c6fa',
          '140': '#b4d6fa',
          '150': '#cfe4fa',
          '160': '#ebf3fc'
        },
        // Status colors untuk kasir
        'status': {
          'success': '#107c10',
          'warning': '#ff8c00',
          'error': '#d13438',
          'info': '#0078d4'
        }
      },
      fontFamily: {
        'segoe': ['Segoe UI', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display-large': ['68px', { lineHeight: '92px', fontWeight: '600' }],
        'display-medium': ['52px', { lineHeight: '68px', fontWeight: '600' }],
        'display-small': ['40px', { lineHeight: '52px', fontWeight: '600' }],
        'title-large': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'title-medium': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-small': ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'body-large': ['16px', { lineHeight: '22px', fontWeight: '400' }],
        'body-medium': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'caption': ['10px', { lineHeight: '14px', fontWeight: '400' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      borderRadius: {
        'fluent': '4px',
        'fluent-large': '8px'
      },
      boxShadow: {
        'fluent-2': '0 1px 2px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
        'fluent-4': '0 2px 4px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
        'fluent-8': '0 4px 8px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
        'fluent-16': '0 8px 16px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)',
        'fluent-64': '0 32px 64px rgba(0, 0, 0, 0.14), 0 0px 2px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}