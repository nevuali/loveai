import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// Bundle analyzer (only when ANALYZE env var is set)
const shouldAnalyze = process.env.ANALYZE === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  
  base: '/',
  
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
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', 'lucide-react'],
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-functions': ['firebase/functions'],
          'firebase-analytics': ['firebase/analytics'],
          'google-vendor': ['@google/generative-ai'],
          'utils-vendor': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf'],
        }
      }
    },
    sourcemap: false,
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Preload critical dependencies
        if (filename.includes('react-vendor')) {
          return deps;
        }
        if (filename.includes('Index')) {
          return deps.filter(dep => 
            dep.includes('react-vendor') || 
            dep.includes('ui-vendor')
          );
        }
        return [];
      }
    },
  },
  
  // Vite 6 performance optimizations
  esbuild: {
    target: 'esnext',
    legalComments: 'none'
  },
  
  server: {
    port: 2000,
    host: 'localhost',
    hmr: {
      port: 2000,
      host: 'localhost',
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
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
