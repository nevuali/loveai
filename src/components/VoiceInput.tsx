import React, { useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { cn } from '../lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  language?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onStart,
  onStop,
  onError,
  language = 'tr-TR',
  className,
  size = 'md',
  variant = 'ghost',
  disabled = false,
}) => {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
    resetError,
    fullTranscript,
  } = useVoiceInput({
    language,
    continuous: false,
    interimResults: true,
  });

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript(); // Clear after sending
    }
  }, [transcript, onTranscript, clearTranscript]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle listening state changes
  useEffect(() => {
    if (isListening && onStart) {
      onStart();
    } else if (!isListening && onStop) {
      onStop();
    }
  }, [isListening, onStart, onStop]);

  const handleClick = () => {
    console.log('🎤 Voice input clicked', { disabled, error, isListening });
    if (disabled) return;

    if (error) {
      resetError();
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn(
          getSizeClasses(),
          'rounded-full text-gray-400 cursor-not-allowed',
          className
        )}
        title="Voice input not supported in this browser"
      >
        <VolumeX size={getIconSize()} />
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'gemini-mic-button',
          {
            'recording': isListening,
            'error': error,
            'disabled': disabled,
          },
          className
        )}
        title={
          error 
            ? `Hata: ${error}. Tekrar denemek için tıklayın.`
            : isListening 
              ? 'Kaydı durdur' 
              : 'Sesli mesaj başlat'
        }
      >
        {error ? (
          <AlertCircle size={getIconSize()} />
        ) : isListening ? (
          <Mic size={getIconSize()} />
        ) : (
          <MicOff size={getIconSize()} />
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -inset-1 rounded-full border-2 border-red-300 animate-ping" />
      )}

      {/* Interim transcript preview (for development) */}
      {interimTranscript && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-black/80 text-white text-xs rounded max-w-xs break-words z-50">
          <div className="font-medium">Listening...</div>
          <div className="opacity-70">{interimTranscript}</div>
          {confidence > 0 && (
            <div className="text-xs opacity-50 mt-1">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;