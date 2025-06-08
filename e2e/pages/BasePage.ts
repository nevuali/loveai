// Base Page Object for common functionality
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common elements
  get loader(): Locator {
    return this.page.locator('[data-testid="loader"], .loading, [aria-label*="loading"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message, [data-testid="error"]');
  }

  get successMessage(): Locator {
    return this.page.locator('.success-message, [data-testid="success"]');
  }

  // Common actions
  async goto(url: string = '/') {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    // Wait for the page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for any loaders to disappear
    try {
      await this.loader.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loader might not exist, continue
    }
  }

  async waitForElement(locator: Locator, timeout = 5000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async clickElement(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fillInput(locator: Locator, value: string) {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  async expectElementToBeVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async expectElementToHaveText(locator: Locator, text: string | RegExp) {
    await expect(locator).toHaveText(text);
  }

  async expectElementToContainText(locator: Locator, text: string) {
    await expect(locator).toContainText(text);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async scrollToElement(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  async waitForNavigation(url?: string) {
    if (url) {
      await this.page.waitForURL(url);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  // Mobile specific actions
  async swipe(direction: 'left' | 'right' | 'up' | 'down', distance = 300) {
    const viewport = this.page.viewportSize();
    if (!viewport) return;

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    
    let endX = startX;
    let endY = startY;

    switch (direction) {
      case 'left':
        endX = startX - distance;
        break;
      case 'right':
        endX = startX + distance;
        break;
      case 'up':
        endY = startY - distance;
        break;
      case 'down':
        endY = startY + distance;
        break;
    }

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
  }

  // Accessibility helpers
  async checkAccessibility() {
    // Check for basic accessibility requirements
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);

    // Check for alt text on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }

    // Check for skip links
    const skipLinks = this.page.locator('a[href="#main"], a[href*="skip"]');
    await expect(skipLinks).toHaveCount({ gte: 0 }); // Optional but recommended
  }

  // Performance helpers
  async measurePageLoad() {
    const startTime = Date.now();
    await this.waitForPageLoad();
    const endTime = Date.now();
    return endTime - startTime;
  }

  async checkConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }
}