import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for debouncing values - prevents excessive API calls and improves performance
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for debouncing functions - prevents excessive function calls
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): [T, () => void] => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cancel pending calls when deps change
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, deps || []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
};

/**
 * Hook for throttling values - limits update frequency
 */
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Hook for advanced debouncing with immediate execution option
 */
export const useAdvancedDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;  // Execute immediately on first call
    trailing?: boolean; // Execute after delay (default behavior)
    maxWait?: number;   // Maximum time to wait before executing
  } = {}
): [T, () => void, () => void] => {
  const { leading = false, trailing = true, maxWait } = options;
  
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTime = useRef<number>(0);
  const lastInvokeTime = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invokeCallback = useCallback((...args: Parameters<T>) => {
    lastInvokeTime.current = Date.now();
    return callbackRef.current(...args);
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      invokeCallback();
      cancel();
    }
  }, [invokeCallback, cancel]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      lastCallTime.current = now;

      const shouldInvokeLeading = leading && !timeoutRef.current;
      const shouldInvokeMaxWait = maxWait && 
        (now - lastInvokeTime.current >= maxWait);

      if (shouldInvokeLeading || shouldInvokeMaxWait) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }
        return invokeCallback(...args);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = undefined;
          invokeCallback(...args);
        }, delay);
      }

      // Set max wait timeout
      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          maxTimeoutRef.current = undefined;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
          }
          invokeCallback(...args);
        }, maxWait);
      }
    }) as T,
    [delay, leading, trailing, maxWait, invokeCallback]
  );

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedCallback, cancel, flush];
};

export default useDebounce;