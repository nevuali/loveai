// Production-safe logging utility

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    // Warnings always visible
    console.warn(...args);
  },
  error: (...args: any[]) => {
    // Errors always visible
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;