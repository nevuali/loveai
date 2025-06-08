// Accessibility utilities for improved user experience

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
}

class AccessibilityManager {
  private settings: AccessibilitySettings;
  private focusableElements: string[] = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  constructor() {
    this.settings = this.detectPreferences();
    this.initialize();
  }

  /**
   * Detect user preferences from system settings
   */
  private detectPreferences(): AccessibilitySettings {
    return {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: window.matchMedia('(prefers-font-size: large)').matches,
      keyboardNavigation: false // Will be detected on first keyboard use
    };
  }

  /**
   * Initialize accessibility features
   */
  private initialize() {
    this.setupKeyboardNavigation();
    this.setupMotionPreferences();
    this.setupContrastPreferences();
    this.setupFocusManagement();
    this.setupAriaLiveRegions();
    
    console.log('♿ Accessibility Manager initialized', this.settings);
  }

  /**
   * Setup keyboard navigation detection and enhancement
   */
  private setupKeyboardNavigation() {
    let isUsingKeyboard = false;

    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('using-keyboard');
        this.settings.keyboardNavigation = true;
      }
    });

    // Reset on mouse usage
    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.remove('using-keyboard');
    });

    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.skipToMain();
      }

      // Skip to navigation (Alt + N)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        this.skipToNavigation();
      }

      // Toggle high contrast (Alt + H)
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        this.toggleHighContrast();
      }

      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }

  /**
   * Setup motion preferences
   */
  private setupMotionPreferences() {
    if (this.settings.reduceMotion) {
      document.body.classList.add('reduce-motion');
    }

    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.settings.reduceMotion = e.matches;
      document.body.classList.toggle('reduce-motion', e.matches);
    });
  }

  /**
   * Setup contrast preferences
   */
  private setupContrastPreferences() {
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    }

    // Listen for preference changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.settings.highContrast = e.matches;
      document.body.classList.toggle('high-contrast', e.matches);
    });
  }

  /**
   * Setup focus management
   */
  private setupFocusManagement() {
    // Focus trap for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          this.trapFocus(e, modal as HTMLElement);
        }
      }
    });

    // Auto-focus management
    this.setupAutoFocus();
  }

  /**
   * Setup ARIA live regions for dynamic content
   */
  private setupAriaLiveRegions() {
    // Create polite live region for non-urgent updates
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    politeRegion.id = 'polite-live-region';
    document.body.appendChild(politeRegion);

    // Create assertive live region for urgent updates
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'assertive-live-region';
    document.body.appendChild(assertiveRegion);
  }

  /**
   * Skip to main content
   */
  private skipToMain() {
    const main = document.querySelector('main, [role="main"], #main');
    if (main instanceof HTMLElement) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.announceToScreenReader('Skipped to main content');
    }
  }

  /**
   * Skip to navigation
   */
  private skipToNavigation() {
    const nav = document.querySelector('nav, [role="navigation"], .sidebar');
    if (nav instanceof HTMLElement) {
      const firstFocusable = nav.querySelector(this.focusableElements.join(','));
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
        this.announceToScreenReader('Focused on navigation');
      }
    }
  }

  /**
   * Toggle high contrast mode
   */
  private toggleHighContrast() {
    this.settings.highContrast = !this.settings.highContrast;
    document.body.classList.toggle('high-contrast', this.settings.highContrast);
    
    const message = this.settings.highContrast ? 'High contrast enabled' : 'High contrast disabled';
    this.announceToScreenReader(message);
  }

  /**
   * Handle escape key
   */
  private handleEscape() {
    // Close modals
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"], .close');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    }

    // Close dropdowns
    const dropdown = document.querySelector('[aria-expanded="true"]');
    if (dropdown instanceof HTMLElement) {
      dropdown.click();
    }
  }

  /**
   * Trap focus within an element
   */
  private trapFocus(event: KeyboardEvent, container: HTMLElement) {
    const focusableEls = container.querySelectorAll(this.focusableElements.join(','));
    const firstFocusable = focusableEls[0] as HTMLElement;
    const lastFocusable = focusableEls[focusableEls.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Setup auto-focus management
   */
  private setupAutoFocus() {
    // Focus management for route changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              const autoFocus = node.querySelector('[data-auto-focus]');
              if (autoFocus instanceof HTMLElement) {
                setTimeout(() => autoFocus.focus(), 100);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Announce message to screen readers
   */
  public announceToScreenReader(message: string, urgent = false) {
    const regionId = urgent ? 'assertive-live-region' : 'polite-live-region';
    const region = document.getElementById(regionId);
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Set focus to element with announcement
   */
  public focusElement(selector: string, announcement?: string) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
        if (announcement) {
          this.announceToScreenReader(announcement);
        }
      }
    } catch (error) {
      console.warn('Failed to focus element:', selector, error);
    }
  }

  /**
   * Create skip link
   */
  public createSkipLink(target: string, text: string) {
    const skipLink = document.createElement('a');
    skipLink.href = target;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.skipToMain();
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Enhance form accessibility
   */
  public enhanceForm(form: HTMLFormElement) {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      
      // Add required indicator
      if (htmlInput.required) {
        const label = form.querySelector(`label[for="${htmlInput.id}"]`);
        if (label && !label.textContent?.includes('*')) {
          label.innerHTML += ' <span aria-label="required">*</span>';
        }
      }

      // Add error handling
      htmlInput.addEventListener('invalid', (e) => {
        const target = e.target as HTMLInputElement;
        this.announceToScreenReader(`Error in ${target.name || target.id}: ${target.validationMessage}`, true);
      });
    });
  }

  /**
   * Get current accessibility settings
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update accessibility settings
   */
  public updateSettings(newSettings: Partial<AccessibilitySettings>) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Apply changes
    document.body.classList.toggle('reduce-motion', this.settings.reduceMotion);
    document.body.classList.toggle('high-contrast', this.settings.highContrast);
    
    console.log('♿ Accessibility settings updated', this.settings);
  }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();

// Utility functions
export const announceToScreenReader = (message: string, urgent = false) => 
  accessibilityManager.announceToScreenReader(message, urgent);

export const focusElement = (selector: string, announcement?: string) => 
  accessibilityManager.focusElement(selector, announcement);

export const enhanceForm = (form: HTMLFormElement) => 
  accessibilityManager.enhanceForm(form);

// Screen reader only class
export const addSROnlyStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
};

// Initialize screen reader styles
addSROnlyStyles();

console.log('♿ Accessibility utilities loaded');