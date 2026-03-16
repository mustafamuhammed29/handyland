import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
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
            'vendor-charts': ['recharts'],
            'vendor-ai': ['@google/genai']
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
