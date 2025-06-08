import { useState, useCallback } from 'react';
import { debugLog } from '../utils/environment';

interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  file: File | null;
}

interface ImageUploadOptions {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
}

export const useImageUpload = (options: ImageUploadOptions = {}) => {
  const {
    maxSize = 5, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
  } = options;

  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    preview: null,
    file: null,
  });

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size too large. Maximum: ${maxSize}MB`;
    }

    return null;
  }, [allowedTypes, maxSize]);

  const resizeImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality compression
        const base64 = canvas.toDataURL(file.type, quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [maxWidth, maxHeight, quality]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0, 
      error: null 
    }));

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      debugLog('Starting image upload:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
      });

      // Simulate progress
      setState(prev => ({ ...prev, progress: 25 }));

      // Resize and compress image
      const base64 = await resizeImage(file);
      
      setState(prev => ({ ...prev, progress: 75 }));

      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 500));

      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        progress: 100,
        preview: base64,
        file,
      }));

      debugLog('Image upload completed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(base64.length * 0.75 / 1024 / 1024).toFixed(2)}MB`,
      });

      return base64;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        progress: 0,
        error: errorMessage,
      }));

      debugLog('Image upload error:', errorMessage);
      throw error;
    }
  }, [validateFile, resizeImage]);

  const clearImage = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      preview: null,
      file: null,
    });
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    uploadImage,
    clearImage,
    resetError,
    canUpload: !state.isUploading,
  };
};

export default useImageUpload;