import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3006,
    host: true,
    strictPort: true,
    fs: {
      strict: false
    }
  },
  define: {
    'process.env': {}
  },
  cacheDir: '.vite-cache-3006'
}) 