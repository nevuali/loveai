/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    
    // Include/exclude patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/**/*.spec.{js,ts,jsx,tsx}',
        'dist/',
        'build/',
        'coverage/',
        '**/*.config.{js,ts}',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose'],
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  
  // Resolve aliases for testing
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks')
    }
  },
  
  // Define constants for testing
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('test-api-key'),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify('test-domain'),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('test-project'),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify('test-bucket'),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify('123456789'),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify('test-app-id'),
    'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify('test-measurement-id')
  }
})