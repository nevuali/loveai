import { Timestamp } from 'firebase/firestore';

// User document structure
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'premium' | 'admin';
  isAdmin: boolean;
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    location?: string;
    preferences: {
      language: string;
      theme: 'light' | 'dark' | 'auto';
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    };
  };
  subscription?: {
    type: 'free' | 'premium';
    startDate?: Timestamp;
    endDate?: Timestamp;
    features: string[];
  };
  stats: {
    totalChats: number;
    totalMessages: number;
    totalBookings: number;
    totalSpent: number;
    favoriteCategories: string[];
  };
}

// Package document structure
export interface Package {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  location: string;
  country: string;
  region: string;
  duration: number;
  price: number;
  originalPrice?: number;
  currency: string;
  category: 'luxury' | 'adventure' | 'romantic' | 'cultural' | 'beach' | 'city' | 'mountain' | 'safari';
  subcategory?: string;
  features: string[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  images: {
    url: string;
    caption?: string;
    order: number;
  }[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
    meals: ('breakfast' | 'lunch' | 'dinner')[];
    accommodation?: string;
  }[];
  accommodation: {
    name: string;
    type: string;
    rating: number;
    description: string;
    amenities: string[];
  }[];
  transportation: {
    type: string;
    details: string;
  }[];
  rating: number;
  reviews: number;
  reviewsData: {
    total: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  availability: boolean;
  seasonality: string[];
  bestTime: string[];
  maxGuests: number;
  minAge?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  tags: string[];
  seoData: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  status: 'draft' | 'published' | 'archived';
  views: number;
  bookings: number;
  isPromoted: boolean;
  promotionData?: {
    startDate: Timestamp;
    endDate: Timestamp;
    discountPercent: number;
  };
}

// Chat document structure
export interface Chat {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  messageCount: number;
  category: string;
  tags: string[];
  summary?: string;
  satisfaction?: {
    rating: number;
    feedback: string;
    createdAt: Timestamp;
  };
  packages: {
    packageId: string;
    title: string;
    price: number;
    status: 'discussed' | 'interested' | 'booked';
  }[];
}

// Message document structure (subcollection of Chat)
export interface Message {
  id: string;
  chatId: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: {
    packageRecommendations?: string[];
    userLocation?: string;
    preferences?: Record<string, any>;
    images?: string[];
  };
  reactions?: {
    helpful: boolean;
    notHelpful: boolean;
  };
}

// Booking document structure
export interface Booking {
  id: string;
  userId: string;
  packageId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDetails: {
    startDate: Timestamp;
    endDate: Timestamp;
    guests: number;
    adults: number;
    children: number;
    rooms: number;
    specialRequests?: string;
  };
  pricing: {
    basePrice: number;
    taxes: number;
    fees: number;
    discounts: number;
    totalPrice: number;
    currency: string;
  };
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: Timestamp;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportNumber?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancellationReason?: string;
  refundAmount?: number;
}

// Review document structure
export interface Review {
  id: string;
  userId: string;
  packageId: string;
  bookingId?: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  images?: string[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  response?: {
    content: string;
    respondedBy: string;
    respondedAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
}

// Analytics aggregation document
export interface Analytics {
  id: string;
  date: string; // YYYY-MM-DD format
  type: 'daily' | 'weekly' | 'monthly';
  metrics: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    totalChats: number;
    totalMessages: number;
    totalBookings: number;
    totalRevenue: number;
    avgSessionDuration: number;
    topCategories: {
      category: string;
      count: number;
    }[];
    topPackages: {
      packageId: string;
      title: string;
      views: number;
      bookings: number;
    }[];
    topDestinations: {
      location: string;
      bookings: number;
      revenue: number;
    }[];
    userSatisfaction: {
      avgRating: number;
      totalReviews: number;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Settings document structure
export interface AppSettings {
  id: string;
  gemini: {
    apiKey: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    enablePackageIntegration: boolean;
  };
  features: {
    chatEnabled: boolean;
    bookingEnabled: boolean;
    reviewsEnabled: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    accentColor: string;
    showPromotion: boolean;
    maintenanceMode: boolean;
  };
  limits: {
    maxMessagesPerChat: number;
    maxChatsPerUser: number;
    maxFileUploadSize: number;
  };
  updatedBy: string;
  updatedAt: Timestamp;
}

// CreatePackageData for form submissions
export interface CreatePackageData {
  title: string;
  description: string;
  longDescription: string;
  location: string;
  country: string;
  region: string;
  duration: number;
  price: number;
  originalPrice?: number;
  currency: string;
  category: Package['category'];
  subcategory?: string;
  features: string[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  images: Array<{
    url: string;
    caption?: string;
    order: number;
  }>;
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    activities: string[];
    meals: ('breakfast' | 'lunch' | 'dinner')[];
    accommodation?: string;
  }>;
  accommodation: Array<{
    name: string;
    type: string;
    rating: number;
    description: string;
    amenities: string[];
  }>;
  transportation: Array<{
    type: string;
    details: string;
  }>;
  seasonality: string[];
  bestTime: string[];
  maxGuests: number;
  minAge?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  tags: string[];
  seoData: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PACKAGES: 'packages',
  CHATS: 'chats',
  MESSAGES: 'messages', // subcollection of chats
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings'
} as const;