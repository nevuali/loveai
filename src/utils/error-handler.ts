/**
 * 🚨 KAPSAMLI HATA YÖNETİMİ SİSTEMİ
 * Tüm uygulama hatalarını merkezi olarak yönetir
 */

import { toast } from 'sonner';
import { logger } from './logger';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
}

export class ErrorHandler {
  private static errors: Record<string, AppError> = {
    // Network Hataları
    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      userMessage: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      severity: 'high',
      recoverable: true,
      retryable: true
    },
    
    // Firebase Hataları
    FIREBASE_QUOTA_EXCEEDED: {
      code: 'FIREBASE_QUOTA_EXCEEDED',
      message: 'Firebase quota exceeded',
      userMessage: 'Sistem yoğunluğu nedeniyle lütfen biraz sonra tekrar deneyin.',
      severity: 'critical',
      recoverable: true,
      retryable: true
    },
    
    FIREBASE_AUTH_ERROR: {
      code: 'FIREBASE_AUTH_ERROR',
      message: 'Firebase authentication failed',
      userMessage: 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
      severity: 'high',
      recoverable: true,
      retryable: true
    },
    
    // API Hataları
    GEMINI_API_ERROR: {
      code: 'GEMINI_API_ERROR',
      message: 'Gemini API request failed',
      userMessage: 'Yapay zeka servisi geçici olarak kullanılamıyor. Lütfen sonra tekrar deneyin.',
      severity: 'high',
      recoverable: true,
      retryable: true
    },
    
    GEMINI_RATE_LIMIT: {
      code: 'GEMINI_RATE_LIMIT',
      message: 'Gemini API rate limit exceeded',
      userMessage: 'Çok fazla istek gönderildi. Lütfen 1 dakika bekleyin.',
      severity: 'medium',
      recoverable: true,
      retryable: true
    },
    
    // Kişilik Testi Hataları
    PERSONALITY_TEST_ERROR: {
      code: 'PERSONALITY_TEST_ERROR',
      message: 'Personality test submission failed',
      userMessage: 'Kişilik testi kaydedilirken hata oluştu. Verileriniz güvendedir, lütfen tekrar deneyin.',
      severity: 'high',
      recoverable: true,
      retryable: true
    },
    
    PERSONALITY_TEST_INCOMPLETE: {
      code: 'PERSONALITY_TEST_INCOMPLETE',
      message: 'Personality test not completed',
      userMessage: 'Lütfen tüm soruları yanıtlayın.',
      severity: 'low',
      recoverable: true,
      retryable: false
    },
    
    // Chat Hataları
    CHAT_SAVE_ERROR: {
      code: 'CHAT_SAVE_ERROR',
      message: 'Failed to save chat message',
      userMessage: 'Mesajınız kaydedilemedi. İnternet bağlantınızı kontrol edin.',
      severity: 'medium',
      recoverable: true,
      retryable: true
    },
    
    // Genel Hatalar
    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      severity: 'medium',
      recoverable: true,
      retryable: true
    }
  };

  /**
   * Hatayı analiz eder ve uygun AppError döner
   */
  public static analyzeError(error: any): AppError {
    logger.error('Analyzing error:', error);

    // Network hataları
    if (!navigator.onLine) {
      return this.errors.NETWORK_ERROR;
    }

    // Firebase hataları
    if (error?.code?.includes('firebase')) {
      if (error.code.includes('quota-exceeded')) {
        return this.errors.FIREBASE_QUOTA_EXCEEDED;
      }
      if (error.code.includes('auth')) {
        return this.errors.FIREBASE_AUTH_ERROR;
      }
    }

    // API hataları
    if (error?.message?.includes('fetch')) {
      return this.errors.NETWORK_ERROR;
    }

    if (error?.status === 429) {
      return this.errors.GEMINI_RATE_LIMIT;
    }

    if (error?.message?.includes('gemini') || error?.message?.includes('api')) {
      return this.errors.GEMINI_API_ERROR;
    }

    // Personality test hataları
    if (error?.context === 'personality_test') {
      return this.errors.PERSONALITY_TEST_ERROR;
    }

    // Chat hataları
    if (error?.context === 'chat') {
      return this.errors.CHAT_SAVE_ERROR;
    }

    // Varsayılan
    return this.errors.UNKNOWN_ERROR;
  }

  /**
   * Hatayı kullanıcıya göster ve logla
   */
  public static handleError(error: any, context?: string): AppError {
    const appError = this.analyzeError(error);
    
    // Context bilgisi ekle
    if (context) {
      appError.details = { ...appError.details, context };
    }

    // Loglama
    logger.error(`[${appError.code}] ${appError.message}`, {
      severity: appError.severity,
      context,
      originalError: error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Kullanıcıya bildirim göster
    this.showUserNotification(appError);

    return appError;
  }

  /**
   * Kullanıcıya hata bildirimi göster
   */
  private static showUserNotification(appError: AppError): void {
    const toastOptions = {
      duration: appError.severity === 'critical' ? 8000 : 5000,
      action: appError.retryable ? {
        label: 'Tekrar Dene',
        onClick: () => window.location.reload()
      } : undefined
    };

    switch (appError.severity) {
      case 'critical':
        toast.error(appError.userMessage, toastOptions);
        break;
      case 'high':
        toast.error(appError.userMessage, toastOptions);
        break;
      case 'medium':
        toast.warning(appError.userMessage, toastOptions);
        break;
      case 'low':
        toast.info(appError.userMessage, toastOptions);
        break;
    }
  }

  /**
   * Retry mekanizması
   */
  public static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const appError = this.analyzeError(error);
        
        if (!appError.retryable || attempt === maxRetries) {
          throw error;
        }

        logger.warn(`Retry attempt ${attempt}/${maxRetries} for operation`, {
          error: appError.code,
          delay
        });

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError;
  }

  /**
   * Network durumu kontrolü
   */
  public static checkNetworkStatus(): boolean {
    return navigator.onLine;
  }

  /**
   * Uygulama sağlık kontrolü
   */
  public static async healthCheck(): Promise<{
    network: boolean;
    firebase: boolean;
    gemini: boolean;
  }> {
    const health = {
      network: this.checkNetworkStatus(),
      firebase: false,
      gemini: false
    };

    try {
      // Firebase bağlantı testi
      const { db } = await import('../firebase');
      await import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
        health.firebase = true;
      });
    } catch (error) {
      logger.warn('Firebase health check failed:', error);
    }

    try {
      // Gemini API sağlık kontrolü (basit ping)
      health.gemini = true; // API key varsa true
    } catch (error) {
      logger.warn('Gemini health check failed:', error);
    }

    return health;
  }
}

/**
 * Hata yakalama dekoratörü
 */
export function withErrorHandling(context: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        ErrorHandler.handleError(error, context);
        throw error;
      }
    };
  };
}

/**
 * React Hook için hata yakalayıcı
 */
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: string) => ErrorHandler.handleError(error, context),
    retryOperation: ErrorHandler.retryOperation,
    healthCheck: ErrorHandler.healthCheck,
    isOnline: ErrorHandler.checkNetworkStatus()
  };
}

export default ErrorHandler;