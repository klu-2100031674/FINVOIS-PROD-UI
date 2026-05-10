import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Local backend is running on :5000 (see API startup logs / PORT env)
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Excel + PDF + AI can exceed default proxy/socket timeouts
        timeout: 300000,
        proxyTimeout: 300000,
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
