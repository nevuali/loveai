// Global setup for E2E tests
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
    
    // Try to access the base URL with retries
    let retries = 10;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log('✅ Development server is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Development server not responding at ${baseURL}`);
        }
        console.log(`⏳ Retrying... (${retries} attempts left)`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Setup test data or authentication if needed
    console.log('🔧 Setting up test data...');
    
    // Store authentication state for reuse in tests
    await page.context().storageState({ path: 'e2e/fixtures/auth.json' });
    
    console.log('✅ Global setup completed');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;