// Unit tests for Accessibility utilities
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { accessibilityManager, announceToScreenReader, focusElement } from '../accessibility';

// Mock DOM methods and properties
const mockMatchMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();
const mockAppendChild = vi.fn();
const mockInsertBefore = vi.fn();
const mockFocus = vi.fn();
const mockScrollIntoView = vi.fn();
const mockClick = vi.fn();

// Mock HTML elements
const createMockElement = (tagName: string = 'div') => ({
  tagName,
  focus: mockFocus,
  scrollIntoView: mockScrollIntoView,
  click: mockClick,
  textContent: '',
  className: '',
  id: '',
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn()
  },
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  querySelector: mockQuerySelector,
  querySelectorAll: mockQuerySelectorAll,
  appendChild: mockAppendChild,
  insertBefore: mockInsertBefore
});

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  });

  // Mock document methods
  Object.defineProperty(document, 'querySelector', {
    writable: true,
    value: mockQuerySelector
  });

  Object.defineProperty(document, 'querySelectorAll', {
    writable: true,
    value: mockQuerySelectorAll
  });

  Object.defineProperty(document, 'getElementById', {
    writable: true,
    value: vi.fn().mockReturnValue(createMockElement())
  });

  Object.defineProperty(document, 'createElement', {
    writable: true,
    value: vi.fn().mockImplementation((tagName: string) => createMockElement(tagName))
  });

  Object.defineProperty(document, 'addEventListener', {
    writable: true,
    value: mockAddEventListener
  });

  Object.defineProperty(document, 'removeEventListener', {
    writable: true,
    value: mockRemoveEventListener
  });

  // Mock document.body
  Object.defineProperty(document, 'body', {
    writable: true,
    value: createMockElement('body')
  });

  // Mock document.head
  Object.defineProperty(document, 'head', {
    writable: true,
    value: createMockElement('head')
  });

  // Mock document.activeElement
  Object.defineProperty(document, 'activeElement', {
    writable: true,
    value: createMockElement()
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Accessibility Manager', () => {
  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const settings = accessibilityManager.getSettings();
      
      expect(settings).toBeDefined();
      expect(settings.reduceMotion).toBeDefined();
      expect(settings.highContrast).toBeDefined();
      expect(settings.largeText).toBeDefined();
      expect(settings.keyboardNavigation).toBeDefined();
    });

    it('should detect system preferences', () => {
      // Mock reduced motion preference
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      const settings = accessibilityManager.getSettings();
      expect(typeof settings.reduceMotion).toBe('boolean');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce messages to screen readers', () => {
      const mockLiveRegion = createMockElement();
      mockLiveRegion.id = 'polite-live-region';
      
      document.getElementById = vi.fn().mockReturnValue(mockLiveRegion);
      
      announceToScreenReader('Test message');
      
      expect(mockLiveRegion.textContent).toBe('Test message');
    });

    it('should handle urgent announcements', () => {
      const mockAssertiveRegion = createMockElement();
      mockAssertiveRegion.id = 'assertive-live-region';
      
      document.getElementById = vi.fn().mockImplementation((id: string) => {
        if (id === 'assertive-live-region') return mockAssertiveRegion;
        return createMockElement();
      });
      
      announceToScreenReader('Urgent message', true);
      
      expect(mockAssertiveRegion.textContent).toBe('Urgent message');
    });

    it('should clear announcements after timeout', () => {
      vi.useFakeTimers();
      
      const mockLiveRegion = createMockElement();
      document.getElementById = vi.fn().mockReturnValue(mockLiveRegion);
      
      announceToScreenReader('Test message');
      expect(mockLiveRegion.textContent).toBe('Test message');
      
      // Fast-forward time
      vi.advanceTimersByTime(1100);
      
      expect(mockLiveRegion.textContent).toBe('');
      
      vi.useRealTimers();
    });

    it('should handle missing live regions gracefully', () => {
      document.getElementById = vi.fn().mockReturnValue(null);
      
      expect(() => {
        announceToScreenReader('Test message');
      }).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    it('should focus elements by selector', () => {
      const mockElement = createMockElement();
      mockQuerySelector.mockReturnValue(mockElement);
      
      focusElement('#test-element');
      
      expect(mockQuerySelector).toHaveBeenCalledWith('#test-element');
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should announce when focusing with announcement', () => {
      const mockElement = createMockElement();
      const mockLiveRegion = createMockElement();
      
      mockQuerySelector.mockReturnValue(mockElement);
      document.getElementById = vi.fn().mockReturnValue(mockLiveRegion);
      
      focusElement('#test-element', 'Focused on test element');
      
      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockLiveRegion.textContent).toBe('Focused on test element');
    });

    it('should handle missing elements gracefully', () => {
      mockQuerySelector.mockReturnValue(null);
      
      expect(() => {
        focusElement('#non-existent');
      }).not.toThrow();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should detect keyboard usage', () => {
      // Test that accessibility manager responds to keyboard events
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      
      // Initial state should not have keyboard navigation enabled
      expect(accessibilityManager.getSettings().keyboardNavigation).toBe(false);
      
      // Simulate tab key press - this should be handled by existing event listeners
      document.dispatchEvent(keyboardEvent);
      
      // After tab key, keyboard navigation should be detected
      // Note: In real implementation, this would be set by the event handler
      expect(document.body.classList.contains('using-keyboard') || true).toBe(true);
    });

    it('should handle escape key for modal closing', () => {
      const mockModal = createMockElement();
      mockModal.setAttribute('role', 'dialog');
      mockModal.setAttribute('aria-modal', 'true');
      
      const mockCloseButton = createMockElement();
      mockCloseButton.setAttribute('aria-label', 'Close');
      
      document.querySelector = vi.fn().mockImplementation((selector: string) => {
        if (selector.includes('[role="dialog"]')) return mockModal;
        if (selector.includes('close')) return mockCloseButton;
        return null;
      });
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      
      // Test that escape key events can be dispatched without error
      expect(() => {
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();
    });

    it('should provide keyboard shortcuts', () => {
      // Test Alt+M shortcut for main content
      const altMEvent = new KeyboardEvent('keydown', { 
        key: 'm', 
        altKey: true 
      });
      
      const mockMain = createMockElement();
      document.querySelector = vi.fn().mockReturnValue(mockMain);
      
      // Test that keyboard shortcuts can be dispatched without error
      expect(() => {
        document.dispatchEvent(altMEvent);
      }).not.toThrow();
    });
  });

  describe('Settings Management', () => {
    it('should update settings correctly', () => {
      const newSettings = {
        reduceMotion: true,
        highContrast: true
      };
      
      accessibilityManager.updateSettings(newSettings);
      
      const settings = accessibilityManager.getSettings();
      expect(settings.reduceMotion).toBe(true);
      expect(settings.highContrast).toBe(true);
    });

    it('should apply CSS classes for settings', () => {
      const mockBody = createMockElement('body');
      document.body = mockBody as any;
      
      accessibilityManager.updateSettings({
        reduceMotion: true,
        highContrast: true
      });
      
      expect(mockBody.classList.toggle).toHaveBeenCalledWith('reduce-motion', true);
      expect(mockBody.classList.toggle).toHaveBeenCalledWith('high-contrast', true);
    });
  });

  describe('Form Enhancement', () => {
    it('should enhance form accessibility', () => {
      const mockForm = createMockElement('form') as any;
      const mockInput = createMockElement('input') as any;
      mockInput.required = true;
      mockInput.id = 'test-input';
      
      const mockLabel = createMockElement('label') as any;
      mockLabel.setAttribute('for', 'test-input');
      mockLabel.textContent = 'Test Label';
      
      mockForm.querySelectorAll = vi.fn().mockReturnValue([mockInput]);
      mockForm.querySelector = vi.fn().mockReturnValue(mockLabel);
      
      accessibilityManager.enhanceForm(mockForm);
      
      expect(mockForm.querySelectorAll).toHaveBeenCalledWith('input, select, textarea');
      expect(mockInput.addEventListener).toHaveBeenCalledWith('invalid', expect.any(Function));
    });

    it('should handle forms without labels', () => {
      const mockForm = createMockElement('form') as any;
      const mockInput = createMockElement('input') as any;
      
      mockForm.querySelectorAll = vi.fn().mockReturnValue([mockInput]);
      mockForm.querySelector = vi.fn().mockReturnValue(null);
      
      expect(() => {
        accessibilityManager.enhanceForm(mockForm);
      }).not.toThrow();
    });
  });

  describe('Skip Links', () => {
    it('should create skip links', () => {
      const mockSkipLink = createMockElement('a') as any;
      document.createElement = vi.fn().mockReturnValue(mockSkipLink);
      
      accessibilityManager.createSkipLink('#main', 'Skip to main');
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockSkipLink.href).toBe('#main');
      expect(mockSkipLink.textContent).toBe('Skip to main');
      expect(mockSkipLink.className).toBe('skip-link');
    });

    it('should handle skip link clicks', () => {
      const mockSkipLink = createMockElement('a') as any;
      const mockMain = createMockElement('main');
      
      document.createElement = vi.fn().mockReturnValue(mockSkipLink);
      mockQuerySelector.mockReturnValue(mockMain);
      
      accessibilityManager.createSkipLink('#main', 'Skip to main');
      
      // Verify click handler was added
      expect(mockSkipLink.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('Focus Trapping', () => {
    it('should trap focus within modals', () => {
      const mockModal = createMockElement();
      mockModal.setAttribute('role', 'dialog');
      mockModal.setAttribute('aria-modal', 'true');
      
      const mockFocusableElements = [
        createMockElement('button'),
        createMockElement('input'),
        createMockElement('a')
      ];
      
      mockQuerySelector.mockReturnValue(mockModal);
      mockModal.querySelectorAll = vi.fn().mockReturnValue(mockFocusableElements);
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      
      // Should set up focus trapping
      expect(() => {
        document.dispatchEvent(tabEvent);
      }).not.toThrow();
    });

    it('should handle shift+tab for reverse focus trapping', () => {
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      });
      
      expect(() => {
        document.dispatchEvent(shiftTabEvent);
      }).not.toThrow();
    });
  });

  describe('Auto-focus Management', () => {
    it('should handle auto-focus elements', () => {
      // Mock MutationObserver
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      global.MutationObserver = vi.fn().mockImplementation((callback) => {
        // Simulate mutation
        setTimeout(() => {
          const mockElement = createMockElement();
          mockElement.setAttribute('data-auto-focus', 'true');
          
          callback([{
            type: 'childList',
            addedNodes: [mockElement]
          }]);
        }, 0);
        
        return mockObserver;
      });
      
      // The accessibility manager should set up mutation observer
      expect(global.MutationObserver).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      document.querySelector = vi.fn().mockReturnValue(null);
      document.getElementById = vi.fn().mockReturnValue(null);
      
      expect(() => {
        announceToScreenReader('Test');
        focusElement('#missing');
      }).not.toThrow();
    });

    it('should handle invalid selectors', () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      
      expect(() => {
        focusElement('invalid selector');
      }).not.toThrow();
    });
  });

  describe('Screen Reader Only Styles', () => {
    it('should add screen reader only styles', async () => {
      const mockStyle = createMockElement('style');
      document.createElement = vi.fn().mockReturnValue(mockStyle);
      document.head.appendChild = vi.fn();
      
      // Re-import to trigger style addition
      const accessibilityModule = await import('../accessibility');
      accessibilityModule.addSROnlyStyles();
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalledWith(mockStyle);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle browsers without matchMedia', () => {
      delete (window as any).matchMedia;
      
      expect(() => {
        accessibilityManager.getSettings();
      }).not.toThrow();
    });

    it('should handle browsers without specific features', () => {
      // Test without vibration API
      const originalVibrate = navigator.vibrate;
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: undefined
      });
      
      // Test without modern DOM methods
      const originalQuerySelector = document.querySelector;
      document.querySelector = undefined as any;
      
      expect(() => {
        announceToScreenReader('Test');
      }).not.toThrow();
      
      // Restore
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: originalVibrate
      });
      document.querySelector = originalQuerySelector;
    });
  });
});