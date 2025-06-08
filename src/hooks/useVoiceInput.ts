import { useState, useRef, useCallback, useEffect } from 'react';
import { debugLog } from '../utils/environment';

interface VoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  confidence: number;
}

export const useVoiceInput = (options: VoiceInputOptions = {}) => {
  const {
    language = 'tr-TR', // Default to Turkish
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
    transcript: '',
    interimTranscript: '',
    error: null,
    confidence: 0,
  });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    if (!state.isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition is not supported in this browser' 
      }));
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      debugLog('Voice recognition started');
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null 
      }));
    };

    recognition.onend = () => {
      debugLog('Voice recognition ended');
      setState(prev => ({ 
        ...prev, 
        isListening: false 
      }));
    };

    recognition.onerror = (event: any) => {
      debugLog('Voice recognition error:', event.error);
      let errorMessage = 'An error occurred during speech recognition';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture failed. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'language-not-supported':
          errorMessage = 'Language not supported for speech recognition.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.';
          break;
      }

      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: errorMessage 
      }));
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          debugLog('Final transcript:', transcript, 'Confidence:', confidence);
        } else {
          interimTranscript += transcript;
          debugLog('Interim transcript:', transcript);
        }
      }

      finalTranscriptRef.current = finalTranscript;

      setState(prev => ({
        ...prev,
        transcript: finalTranscript,
        interimTranscript,
        confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
      }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, state.isSupported]);

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition is not supported' 
      }));
      return;
    }

    if (recognitionRef.current && !state.isListening) {
      // Reset transcripts
      finalTranscriptRef.current = '';
      setState(prev => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        error: null,
      }));

      try {
        recognitionRef.current.start();
      } catch (error) {
        debugLog('Error starting recognition:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start speech recognition' 
        }));
      }
    }
  }, [state.isSupported, state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript,
    resetError,
    fullTranscript: state.transcript + state.interimTranscript,
  };
};

export default useVoiceInput;