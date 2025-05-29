import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@google/generative-ai',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/functions'
    ]
  },
  
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'google-vendor': ['@google/generative-ai'],
        }
      }
    },
    sourcemap: false,
    emptyOutDir: true,
    assetsInlineLimit: 4096,
  },
  
  // Vite 6 performance optimizations
  esbuild: {
    target: 'esnext',
    legalComments: 'none'
  },
  
  server: {
    port: 8080,
    host: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  
  preview: {
    port: 4173,
    host: true,
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  }
});
