// Test data fixtures for E2E tests

export const testUsers = {
  validUser: {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'TestPassword123!'
  },
  
  newUser: {
    name: 'New Test User',
    email: `new.user.${Date.now()}@example.com`,
    password: 'NewTestPassword123!'
  },
  
  invalidUser: {
    email: 'invalid-email',
    password: '123'
  }
};

export const testMessages = {
  simple: 'Hello AI LOVVE!',
  honeymoonRequest: 'Plan a romantic honeymoon in Paris for 7 days',
  budgetRequest: 'Find budget honeymoon destinations under $3000',
  packageRequest: 'Show me luxury honeymoon packages',
  longMessage: 'I want to plan the perfect honeymoon for my partner and me. We love romantic destinations with beautiful beaches, great food, and luxurious accommodations. Our budget is around $5000 and we prefer destinations in Europe or the Mediterranean. Please suggest some amazing packages with detailed itineraries.',
  
  multipleRequests: [
    'Hi there!',
    'What are the best honeymoon destinations?',
    'Tell me about Paris packages',
    'Show me beach destinations',
    'What about winter honeymoons?'
  ]
};

export const testSelectors = {
  // Common selectors that might change
  chatInput: '.gemini-input, textarea[placeholder*="whisper"], textarea[placeholder*="message"]',
  sendButton: '.gemini-send-button, button[type="submit"]',
  message: '.gemini-message, [data-testid="message"]',
  userMessage: '.gemini-message-user, [data-testid="user-message"]',
  assistantMessage: '.gemini-message-assistant, [data-testid="assistant-message"]',
  
  // Navigation
  sidebar: '.gemini-sidebar, [data-testid="sidebar"]',
  sidebarToggle: '.gemini-menu-button, [data-testid="sidebar-toggle"]',
  newChatButton: '.gemini-new-chat, [data-testid="new-chat"]',
  
  // Auth
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  loginButton: 'button[type="submit"]:has-text("Sign In"), button:has-text("Login")',
  
  // Packages
  packageCarousel: '[data-testid="package-carousel"], .package-carousel',
  packageCard: '[data-testid="package-card"], .package-card'
};

export const testScenarios = {
  chatFlow: {
    name: 'Basic Chat Flow',
    steps: [
      'User opens application',
      'User sends a message',
      'AI responds with relevant information',
      'User can see the conversation history'
    ]
  },
  
  honeymoonPlanning: {
    name: 'Honeymoon Planning Flow',
    steps: [
      'User requests honeymoon suggestions',
      'AI provides package recommendations',
      'User can view package details',
      'User can export chat as PDF'
    ]
  },
  
  authentication: {
    name: 'User Authentication',
    steps: [
      'User accesses auth page',
      'User can register new account',
      'User can login with credentials',
      'User can access protected features'
    ]
  }
};

export const testEnvironment = {
  baseURL: 'http://localhost:5173',
  timeouts: {
    short: 2000,
    medium: 5000,
    long: 10000,
    xlarge: 30000
  },
  
  viewport: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },
  
  // Test specific configurations
  retries: 2,
  parallel: true
};

export const mockData = {
  // Mock API responses for testing
  packages: [
    {
      id: 'test-package-1',
      title: 'Romantic Paris Getaway',
      description: 'Experience the city of love',
      location: 'Paris',
      country: 'France',
      duration: 7,
      price: 3500,
      currency: 'USD'
    },
    {
      id: 'test-package-2',
      title: 'Tropical Bali Escape',
      description: 'Relax in paradise',
      location: 'Bali',
      country: 'Indonesia',
      duration: 10,
      price: 2800,
      currency: 'USD'
    }
  ],
  
  aiResponses: {
    greeting: 'Hello! I\'m AI LOVVE, your personal honeymoon planning assistant.',
    packageSuggestion: 'Here are some romantic honeymoon packages I recommend:',
    error: 'I apologize, but I encountered an error. Please try again.'
  }
};

export const accessibility = {
  // Accessibility test requirements
  requiredElements: [
    'h1, h2, h3, h4, h5, h6', // Headings
    '[role="main"]',          // Main content
    '[role="button"]',        // Interactive elements
    'img[alt]'               // Images with alt text
  ],
  
  keyboardNavigation: [
    'Tab',
    'Enter',
    'Space',
    'Escape',
    'ArrowUp',
    'ArrowDown'
  ],
  
  colorContrast: {
    minimum: 4.5,  // WCAG AA
    enhanced: 7.0  // WCAG AAA
  }
};

export const performance = {
  budgets: {
    LCP: 2500,     // Largest Contentful Paint (ms)
    FID: 100,      // First Input Delay (ms)
    CLS: 0.1,      // Cumulative Layout Shift
    FCP: 1800,     // First Contentful Paint (ms)
    TTFB: 800      // Time to First Byte (ms)
  },
  
  resourceLimits: {
    maxBundleSize: 1024 * 1024,  // 1MB
    maxImageSize: 500 * 1024,    // 500KB
    maxRequests: 50              // Number of requests
  }
};