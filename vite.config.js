import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const TUNNEL_ALLOWED_HOST_SUFFIXES = [
  '.ngrok-free.dev',
  '.ngrok-free.app',
  '.ngrok-free.pizza',
  '.ngrok.io',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.pizza',
  '.loca.lt',
  '.trycloudflare.com',
]

const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000'

function createApiProxy() {
  return {
    target: API_PROXY_TARGET,
    changeOrigin: true,
    timeout: 300000,
    proxyTimeout: 300000,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        // ngrok free tier HTML interstitial breaks JSON API responses
        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
        // Preserve browser Origin (tunnel URL) so CORS Allow-Origin matches when needed
        const origin = req.headers.origin
        if (origin) {
          proxyReq.setHeader('Origin', origin)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ngrokHmrHost = env.VITE_NGROK_HMR_HOST || process.env.VITE_NGROK_HMR_HOST

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        buffer: 'buffer',
      },
    },
    optimizeDeps: {
      include: ['exceljs', 'buffer'],
    },
    server: {
      host: true,
      // Dynamic tunnel subdomains change every session — allow all in dev (Vite 6+)
      allowedHosts: mode === 'development' ? true : TUNNEL_ALLOWED_HOST_SUFFIXES,
      ...(ngrokHmrHost
        ? {
            hmr: {
              protocol: 'wss',
              host: ngrokHmrHost,
              clientPort: 443,
            },
          }
        : {}),
      proxy: {
        '/api': createApiProxy(),
      },
    },
    preview: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': createApiProxy(),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
            ui: ['@headlessui/react', '@heroicons/react', 'framer-motion', 'lucide-react'],
            utils: ['axios', 'clsx', 'tailwind-merge', 'jspdf', 'html2canvas'],
          },
        },
      },
    },
  }
})
