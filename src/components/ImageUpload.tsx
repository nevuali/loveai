import React, { useRef, useState } from 'react';
import { Image, X, Upload, Camera, FileImage, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useImageUpload } from '../hooks/useImageUpload';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  onImageClear: () => void;
  currentImage?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showPreview?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageClear,
  currentImage,
  className,
  size = 'md',
  disabled = false,
  showPreview = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    isUploading,
    progress,
    error,
    preview,
    uploadImage,
    clearImage,
    resetError,
    canUpload,
  } = useImageUpload({
    maxSize: 10, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
  });

  const displayImage = currentImage || preview;

  const handleFileSelect = async (file: File) => {
    if (!canUpload || disabled) return;

    try {
      resetError();
      const base64 = await uploadImage(file);
      onImageSelect(base64);
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClear = () => {
    clearImage();
    onImageClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    console.log('📸 Image upload clicked', { disabled, isUploading, canUpload });
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          'gemini-plus-button',
          {
            'uploading': isUploading,
            'has-image': displayImage,
            'error': error,
            'disabled': disabled,
          },
          className
        )}
        title={currentImage 
          ? 'Change photo'
          : 'Upload photo'
        }
      >
        {isUploading ? (
          <Upload size={getIconSize()} className="animate-pulse" />
        ) : error ? (
          <AlertCircle size={getIconSize()} />
        ) : displayImage ? (
          <Camera size={getIconSize()} />
        ) : (
          <FileImage size={getIconSize()} />
        )}
      </button>

      {/* Upload progress ring */}
      {isUploading && (
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              className="transition-all duration-300"
            />
          </svg>
        </div>
      )}

      {/* Image preview modal/tooltip */}
      {showPreview && displayImage && (
        <div className="absolute top-full left-0 mt-2 z-50 group">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            {/* Preview image */}
            <div className="relative">
              <img
                src={displayImage}
                alt="Uploaded preview"
                className="w-48 h-32 object-cover rounded"
              />
              
              {/* Clear button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              >
                <X size={12} />
              </Button>
            </div>

            {/* Image info */}
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <div>Ready to send with your message</div>
              {isUploading && (
                <div className="mt-1">
                  <Progress value={progress} className="h-1" />
                  <div className="text-center mt-1">{Math.round(progress)}%</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded max-w-xs z-50">
          {error}
        </div>
      )}

      {/* Drag and drop overlay */}
      {dragOver && (
        <div
          className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl border-2 border-dashed border-blue-500">
            <div className="text-center">
              <Upload size={48} className="mx-auto text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Drop your image here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                JPEG, PNG, WebP, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;