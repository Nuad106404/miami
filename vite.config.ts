import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://miamibeachchaam.com',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://miamibeachchaam.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});
