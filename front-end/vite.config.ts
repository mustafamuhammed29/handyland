import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'HandyLand E-Commerce & Repair',
          short_name: 'HandyLand',
          description: 'Premium Phone Repair and Purchase Platform',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-utils': ['axios', 'i18next', 'react-i18next', '@tanstack/react-query'],
            'vendor-payment': ['@stripe/stripe-js', '@stripe/react-stripe-js', '@paypal/react-paypal-js'],
            'vendor-charts': ['recharts']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      host: true, // Allow localhost and other IPs
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: '',
        }
      }
    }
  };
});
