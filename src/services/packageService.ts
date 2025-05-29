import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Honeymoon Package Interface
export interface HoneymoonPackage {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  duration: number; // days
  price: number; // USD
  currency: string;
  category: 'luxury' | 'adventure' | 'romantic' | 'cultural' | 'beach' | 'city';
  features: string[];
  inclusions: string[];
  images: string[];
  rating: number;
  reviews: number;
  availability: boolean;
  seasonality: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageFilters {
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  limit?: number;
}

export interface PackageResponse {
  success: boolean;
  packages?: HoneymoonPackage[];
  message?: string;
  error?: unknown;
}

export interface SinglePackageResponse {
  success: boolean;
  package?: HoneymoonPackage;
  message?: string;
}

export interface InitializeResponse {
  success: boolean;
  message: string;
}

// Package Service Class
class PackageService {
  private getHoneymoonPackages = httpsCallable<PackageFilters, PackageResponse>(
    functions, 
    'getHoneymoonPackages'
  );
  
  private getHoneymoonPackage = httpsCallable<{packageId: string}, SinglePackageResponse>(
    functions, 
    'getHoneymoonPackage'
  );
  
  private initializeHoneymoonPackages = httpsCallable<{}, InitializeResponse>(
    functions, 
    'initializeHoneymoonPackages'
  );

  /**
   * Get honeymoon packages with optional filters
   */
  async getPackages(filters: PackageFilters = {}): Promise<HoneymoonPackage[]> {
    try {
      console.log('📦 Fetching honeymoon packages...', filters);
      
      const result = await this.getHoneymoonPackages(filters);
      const data = result.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch packages');
      }

      console.log(`📦 Successfully fetched ${data.packages?.length || 0} packages`);
      return data.packages || [];
      
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch packages');
    }
  }

  /**
   * Get a single package by ID
   */
  async getPackage(packageId: string): Promise<HoneymoonPackage | null> {
    try {
      console.log('📦 Fetching package:', packageId);
      
      const result = await this.getHoneymoonPackage({ packageId });
      const data = result.data;

      if (!data.success) {
        console.warn('📦 Package not found:', data.message);
        return null;
      }

      console.log('📦 Successfully fetched package:', data.package?.title);
      return data.package || null;
      
    } catch (error) {
      console.error('❌ Error fetching package:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch package');
    }
  }

  /**
   * Initialize sample packages (admin function)
   */
  async initializePackages(): Promise<string> {
    try {
      console.log('🚀 Initializing honeymoon packages...');
      
      const result = await this.initializeHoneymoonPackages({});
      const data = result.data;

      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize packages');
      }

      console.log('✅ Packages initialized:', data.message);
      return data.message;
      
    } catch (error) {
      console.error('❌ Error initializing packages:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize packages');
    }
  }

  /**
   * Get packages by category
   */
  async getPackagesByCategory(category: string): Promise<HoneymoonPackage[]> {
    return this.getPackages({ category, limit: 10 });
  }

  /**
   * Get packages by location
   */
  async getPackagesByLocation(location: string): Promise<HoneymoonPackage[]> {
    return this.getPackages({ location, limit: 10 });
  }

  /**
   * Get packages by price range
   */
  async getPackagesByPriceRange(minPrice: number, maxPrice: number): Promise<HoneymoonPackage[]> {
    return this.getPackages({ minPrice, maxPrice, limit: 15 });
  }

  /**
   * Search packages by multiple criteria
   */
  async searchPackages(filters: PackageFilters): Promise<HoneymoonPackage[]> {
    return this.getPackages(filters);
  }

  /**
   * Get featured packages (top rated)
   */
  async getFeaturedPackages(): Promise<HoneymoonPackage[]> {
    return this.getPackages({ limit: 20 });
  }

  /**
   * Format package price for display
   */
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      luxury: '💎 Luxury',
      adventure: '🏔️ Adventure',
      romantic: '💕 Romantic',
      cultural: '🏛️ Cultural',
      beach: '🏖️ Beach',
      city: '🏙️ City'
    };
    return categoryNames[category] || category;
  }
}

// Export singleton instance
export const packageService = new PackageService();
export default packageService; 