export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          brand: {
            primary: 'var(--color-primary, #06b6d4)',
            secondary: 'var(--color-secondary, #3b82f6)',
            highlight: '#a855f7', // purple-500
            accent: '#f0abfc', // pink-300
            surface: {
              light: '#f8fafc', // slate-50
              dark: '#020617', // slate-950
            }
          },
          slate: {
            950: '#020617',
          }
        },
        animation: {
          'shimmer': 'shimmer 2s infinite linear',
          'float': 'float 3s ease-in-out infinite',
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          shimmer: {
            '0%': { backgroundPosition: '-1000px 0' },
            '100%': { backgroundPosition: '1000px 0' },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          }
        },
        boxShadow: {
          'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          'brand': '0 0 20px rgba(6, 182, 212, 0.15)',
        }
      },
    },
    plugins: [],
  }
