import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    server: {
      port: 3000,
      host: true, // Allow localhost and other IPs
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
