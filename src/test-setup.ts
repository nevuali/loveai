import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Mock matchMedia for JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock localStorage with more realistic implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  value: (callback: FrameRequestCallback) => setTimeout(callback, 16),
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: (id: number) => clearTimeout(id),
  writable: true,
});

// Mock navigator
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) => 
      success({
        coords: {
          latitude: 51.1,
          longitude: 45.3,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn().mockReturnValue('mock-url'),
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});

// Mock console methods to reduce noise during tests
Object.defineProperty(console, 'log', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(console, 'warn', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(console, 'error', {
  value: vi.fn(),
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntriesByName: vi.fn().mockReturnValue([]),
    getEntriesByType: vi.fn().mockReturnValue([]),
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 10000000
    }
  },
  writable: true,
});

// Mock crypto for UUID generation
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
  },
  writable: true,
});

// Mock Firebase (will be overridden by specific mocks in tests)
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

// Mock React Router
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

// Setup and cleanup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage
  localStorageMock.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.restoreAllMocks();
});