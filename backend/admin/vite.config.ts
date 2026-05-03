import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library — heavy, used only on Dashboard
          'vendor-charts': ['recharts'],
          // Real-time communication
          'vendor-socket': ['socket.io-client'],
          // Icon library
          'vendor-icons': ['lucide-react'],
          // UI utilities
          'vendor-ui': ['react-hot-toast', 'axios'],
        }
      }
    }
  },
  // Strip console.log and debugger from production builds
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}))
