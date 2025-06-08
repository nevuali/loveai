// Global teardown for E2E tests
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up test artifacts
    const authFilePath = path.join(__dirname, 'fixtures', 'auth.json');
    if (fs.existsSync(authFilePath)) {
      fs.unlinkSync(authFilePath);
      console.log('🗑️ Cleaned up authentication file');
    }
    
    // Clean up any test data
    console.log('🧽 Cleaning up test data...');
    
    // Clear any test files or temporary data
    const tempFiles = [
      'test-results',
      'playwright-report'
    ];
    
    tempFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`🗑️ Cleaning up ${file}`);
        // Note: In real scenario, you might want to keep reports
      }
    });
    
    console.log('✅ Global teardown completed');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;