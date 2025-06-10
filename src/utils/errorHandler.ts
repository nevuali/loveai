export class ErrorHandler {
  static handleServiceError(error: any, serviceName: string, fallbackValue: any = null) {
    console.error(`❌ ${serviceName} error:`, error);
    
    // Log error details for debugging
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return fallbackValue;
  }

  static safeExecute<T>(
    operation: () => T,
    fallbackValue: T,
    operationName?: string
  ): T {
    try {
      return operation();
    } catch (error) {
      console.error(`❌ Safe execution failed for ${operationName || 'unknown operation'}:`, error);
      return fallbackValue;
    }
  }

  static safeAsyncExecute<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName?: string
  ): Promise<T> {
    return operation().catch(error => {
      console.error(`❌ Safe async execution failed for ${operationName || 'unknown operation'}:`, error);
      return fallbackValue;
    });
  }

  static ensureArray<T>(value: any, defaultValue: T[] = []): T[] {
    if (Array.isArray(value)) {
      return value;
    }
    console.warn('Expected array but got:', typeof value, value);
    return defaultValue;
  }

  static ensureObject<T>(value: any, defaultValue: T): T {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    console.warn('Expected object but got:', typeof value, value);
    return defaultValue;
  }

  static safeReduce<T, U>(
    array: any,
    reducer: (acc: U, current: T, index: number) => U,
    initialValue: U,
    operationName?: string
  ): U {
    if (!Array.isArray(array)) {
      console.warn(`❌ Safe reduce: Expected array for ${operationName}, got:`, typeof array);
      return initialValue;
    }

    try {
      return array.reduce(reducer, initialValue);
    } catch (error) {
      console.error(`❌ Safe reduce failed for ${operationName}:`, error);
      return initialValue;
    }
  }

  static safeAccess(obj: any, path: string, defaultValue: any = null): any {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current == null || typeof current !== 'object') {
          return defaultValue;
        }
        current = current[key];
      }
      
      return current ?? defaultValue;
    } catch (error) {
      console.error(`❌ Safe access failed for path ${path}:`, error);
      return defaultValue;
    }
  }
}

export default ErrorHandler; 