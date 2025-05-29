import { packageService } from '../services/packageService';

/**
 * Initialize sample honeymoon packages for development/testing
 */
export const initializeHoneymoonPackages = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing honeymoon packages...');
    
    const result = await packageService.initializePackages();
    
    console.log('✅ Success:', result);
    
    // Test fetching packages
    const packages = await packageService.getFeaturedPackages();
    console.log(`📦 Retrieved ${packages.length} packages:`, packages);
    
  } catch (error) {
    console.error('❌ Error initializing packages:', error);
    throw error;
  }
};

// Auto-run if called directly (for testing)
if (typeof window !== 'undefined' && window.location.search.includes('init=packages')) {
  initializeHoneymoonPackages();
} 