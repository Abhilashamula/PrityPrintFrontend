import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  define: {
    // Required for pdfjs-dist
    'process.env': {},
  },
})

