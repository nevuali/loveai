import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { Package, CreatePackageData, COLLECTIONS } from '../types/firestore';

export interface PackageFilters {
  category?: string;
  location?: string;
  country?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  status?: 'draft' | 'published' | 'archived';
  availability?: boolean;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

class PackageService {
  private packagesCollection = collection(db, COLLECTIONS.PACKAGES);

  /**
   * Create a new package
   */
  async createPackage(packageData: CreatePackageData, createdBy: string): Promise<string> {
    try {
      console.log('🎯 Creating new package:', packageData.title);
      
      const newPackage: Omit<Package, 'id'> = {
        ...packageData,
        rating: 0,
        reviews: 0,
        reviewsData: {
          total: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        },
        availability: true,
        views: 0,
        bookings: 0,
        isPromoted: false,
        status: 'published',
        createdBy,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        publishedAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(this.packagesCollection, newPackage);
      
      console.log('✅ Package created with ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Error creating package:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create package');
    }
  }

  /**
   * Get all packages with filters
   */
  async getPackages(filters: PackageFilters = {}): Promise<Package[]> {
    try {
      console.log('📦 Fetching packages with filters:', filters);
      
      let q = query(this.packagesCollection);
      
      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.location) {
        q = query(q, where('location', '==', filters.location));
      }
      
      if (filters.country) {
        q = query(q, where('country', '==', filters.country));
      }
      
      if (filters.region) {
        q = query(q, where('region', '==', filters.region));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.availability !== undefined) {
        q = query(q, where('availability', '==', filters.availability));
      }
      
      if (filters.minPrice && filters.maxPrice) {
        q = query(q, where('price', '>=', filters.minPrice), where('price', '<=', filters.maxPrice));
      } else if (filters.minPrice) {
        q = query(q, where('price', '>=', filters.minPrice));
      } else if (filters.maxPrice) {
        q = query(q, where('price', '<=', filters.maxPrice));
      }
      
      // Order by creation date (newest first)
      q = query(q, orderBy('createdAt', 'desc'));
      
      // Apply pagination
      if (filters.startAfter) {
        q = query(q, startAfter(filters.startAfter));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const packages: Package[] = [];
      
      querySnapshot.forEach((doc) => {
        packages.push({
          id: doc.id,
          ...doc.data()
        } as Package);
      });

      console.log(`📦 Successfully fetched ${packages.length} packages`);
      return packages;
      
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch packages');
    }
  }

  /**
   * Get a single package by ID
   */
  async getPackage(packageId: string): Promise<Package | null> {
    try {
      console.log('📦 Fetching package:', packageId);
      
      const packageDoc = await getDoc(doc(this.packagesCollection, packageId));
      
      if (!packageDoc.exists()) {
        console.warn('📦 Package not found');
        return null;
      }

      // Increment view count
      await this.incrementPackageViews(packageId);

      const packageData = {
        id: packageDoc.id,
        ...packageDoc.data()
      } as Package;

      console.log('📦 Successfully fetched package:', packageData.title);
      return packageData;
      
    } catch (error) {
      console.error('❌ Error fetching package:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch package');
    }
  }

  /**
   * Update an existing package
   */
  async updatePackage(packageId: string, packageData: Partial<CreatePackageData>): Promise<void> {
    try {
      console.log('📝 Updating package:', packageId);
      
      const packageRef = doc(this.packagesCollection, packageId);
      await updateDoc(packageRef, {
        ...packageData,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Package updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating package:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update package');
    }
  }

  /**
   * Delete a package
   */
  async deletePackage(packageId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting package:', packageId);
      
      const packageRef = doc(this.packagesCollection, packageId);
      await deleteDoc(packageRef);

      console.log('✅ Package deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting package:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete package');
    }
  }

  /**
   * Get all packages for admin dashboard
   */
  async getAllPackagesForAdmin(): Promise<Package[]> {
    try {
      console.log('👨‍💼 Fetching all packages for admin...');
      
      // First try simple query without orderBy to avoid index issues
      const querySnapshot = await getDocs(this.packagesCollection);
      
      const packages: Package[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        packages.push({
          id: doc.id,
          ...data,
          // Ensure required fields exist with defaults
          title: data.title || 'Untitled Package',
          description: data.description || 'No description',
          location: data.location || 'Unknown',
          country: data.country || 'Unknown',
          price: data.price || 0,
          duration: data.duration || 1,
          category: data.category || 'romantic',
          availability: data.availability !== false, // Default to true
          views: data.views || 0,
          bookings: data.bookings || 0,
          rating: data.rating || 0,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        } as Package);
      });

      // Sort in memory by creation date (newest first)
      packages.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      console.log(`📊 Fetched ${packages.length} packages for admin`);
      return packages;
      
    } catch (error) {
      console.error('❌ Error fetching admin packages:', error);
      // Return empty array instead of throwing to prevent dashboard crash
      console.warn('🔄 Returning empty array due to fetch error');
      return [];
    }
  }

  /**
   * Bulk update packages
   */
  async bulkUpdatePackages(updates: Array<{id: string, data: Partial<Package>}>): Promise<void> {
    try {
      console.log(`📦 Bulk updating ${updates.length} packages...`);
      
      const batch = writeBatch(db);
      
      updates.forEach(({id, data}) => {
        const packageRef = doc(this.packagesCollection, id);
        batch.update(packageRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log('✅ Bulk update completed');
      
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to bulk update packages');
    }
  }

  /**
   * Toggle package availability
   */
  async togglePackageAvailability(packageId: string, availability: boolean): Promise<void> {
    try {
      console.log(`🔄 Setting package ${packageId} availability to:`, availability);
      
      const packageRef = doc(this.packagesCollection, packageId);
      await updateDoc(packageRef, {
        availability,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Package availability updated');
      
    } catch (error) {
      console.error('❌ Error updating availability:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update availability');
    }
  }

  /**
   * Increment package views
   */
  async incrementPackageViews(packageId: string): Promise<void> {
    try {
      const packageRef = doc(this.packagesCollection, packageId);
      await updateDoc(packageRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('❌ Error incrementing views:', error);
    }
  }

  /**
   * Increment package bookings
   */
  async incrementPackageBookings(packageId: string): Promise<void> {
    try {
      const packageRef = doc(this.packagesCollection, packageId);
      await updateDoc(packageRef, {
        bookings: increment(1)
      });
    } catch (error) {
      console.error('❌ Error incrementing bookings:', error);
    }
  }

  /**
   * Search packages by text
   */
  async searchPackages(searchTerm: string, filters: PackageFilters = {}): Promise<Package[]> {
    try {
      console.log('🔍 Searching packages:', searchTerm);
      
      // Get all packages first (Firestore doesn't support full-text search natively)
      const packages = await this.getPackages(filters);
      
      // Filter by search term
      const searchResults = packages.filter(pkg => 
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      console.log(`🔍 Found ${searchResults.length} packages matching "${searchTerm}"`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Error searching packages:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search packages');
    }
  }

  /**
   * Get packages by category
   */
  async getPackagesByCategory(category: string, limit?: number): Promise<Package[]> {
    return this.getPackages({ category, limit: limit || 10, status: 'published', availability: true });
  }

  /**
   * Get featured packages
   */
  async getFeaturedPackages(): Promise<Package[]> {
    return this.getPackages({ 
      status: 'published', 
      availability: true, 
      limit: 20 
    });
  }

  /**
   * Get popular packages (most booked)
   */
  async getPopularPackages(limitCount: number = 10): Promise<Package[]> {
    try {
      // Simplified query to avoid index requirements for now
      const q = query(
        this.packagesCollection,
        where('status', '==', 'published'),
        where('availability', '==', true),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const packages: Package[] = [];
      
      querySnapshot.forEach((doc) => {
        packages.push({
          id: doc.id,
          ...doc.data()
        } as Package);
      });

      // Sort in memory until indexes are ready
      packages.sort((a, b) => (b.bookings || 0) - (a.bookings || 0));

      return packages;
    } catch (error) {
      console.error('❌ Error fetching popular packages:', error);
      return [];
    }
  }

  /**
   * Get package statistics for analytics
   */
  async getPackageStats(): Promise<{
    totalPackages: number;
    publishedPackages: number;
    draftPackages: number;
    archivedPackages: number;
    totalViews: number;
    totalBookings: number;
    categoryCounts: Record<string, number>;
    averageRating: number;
  }> {
    try {
      const packages = await this.getAllPackagesForAdmin();
      
      const stats = {
        totalPackages: packages.length,
        publishedPackages: packages.filter(p => p.status === 'published').length,
        draftPackages: packages.filter(p => p.status === 'draft').length,
        archivedPackages: packages.filter(p => p.status === 'archived').length,
        totalViews: packages.reduce((sum, p) => sum + (p.views || 0), 0),
        totalBookings: packages.reduce((sum, p) => sum + (p.bookings || 0), 0),
        categoryCounts: {} as Record<string, number>,
        averageRating: 0
      };

      // Calculate category counts
      packages.forEach(pkg => {
        stats.categoryCounts[pkg.category] = (stats.categoryCounts[pkg.category] || 0) + 1;
      });

      // Calculate average rating
      const packagesWithRatings = packages.filter(p => p.rating > 0);
      if (packagesWithRatings.length > 0) {
        stats.averageRating = packagesWithRatings.reduce((sum, p) => sum + p.rating, 0) / packagesWithRatings.length;
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting package stats:', error);
      throw new Error('Failed to get package statistics');
    }
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
      city: '🏙️ City',
      mountain: '⛰️ Mountain',
      safari: '🦁 Safari'
    };
    return categoryNames[category] || category;
  }
}

// Export singleton instance
export const packageService = new PackageService();
export default packageService;