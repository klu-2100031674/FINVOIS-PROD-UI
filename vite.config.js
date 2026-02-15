import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
          ui: ['@headlessui/react', '@heroicons/react', 'framer-motion', 'lucide-react'],
          utils: ['axios', 'clsx', 'tailwind-merge', 'jspdf', 'html2canvas']
        }
      }
    }
  }
})
