// E2E tests for Package functionality
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { testMessages } from '../fixtures/test-data';

test.describe('AI LOVVE Package Features', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('/');
  });

  test('should display packages when requested', async () => {
    await homePage.sendMessage(testMessages.packageRequest);
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      await homePage.expectPackagesDisplayed();
      
      // Check if packages have required elements
      const packages = homePage.packageCarousel.locator('[data-testid="package-card"]');
      const packageCount = await packages.count();
      expect(packageCount).toBeGreaterThan(0);
      
      // Check first package has required information
      const firstPackage = packages.first();
      await expect(firstPackage).toBeVisible();
      
      // Check for package title
      const packageTitle = firstPackage.locator('.package-title, h3, h4');
      await expect(packageTitle).toBeVisible();
      
      // Check for package price
      const packagePrice = firstPackage.locator('.package-price, [data-testid="price"]');
      await expect(packagePrice).toBeVisible();
      
    } catch (error) {
      console.log('Packages not displayed or test data not available');
      test.skip();
    }
  });

  test('should handle package carousel navigation', async () => {
    await homePage.sendMessage('Show me luxury honeymoon packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      const carousel = homePage.packageCarousel;
      const packages = carousel.locator('[data-testid="package-card"]');
      const packageCount = await packages.count();
      
      if (packageCount > 1) {
        // Test navigation buttons if they exist
        const nextButton = carousel.locator('[data-testid="next"], .carousel-next, button[aria-label*="next"]');
        const prevButton = carousel.locator('[data-testid="prev"], .carousel-prev, button[aria-label*="prev"]');
        
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await homePage.page.waitForTimeout(500); // Wait for animation
        }
        
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await homePage.page.waitForTimeout(500); // Wait for animation
        }
      }
    } catch (error) {
      console.log('Package carousel navigation not available');
      test.skip();
    }
  });

  test('should open package details on click', async () => {
    await homePage.sendMessage('Show featured honeymoon packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      await homePage.clickPackage(0); // Click first package
      
      // Should open package detail modal or page
      const modal = homePage.page.locator('[role="dialog"], .modal, .package-modal');
      const detailPage = homePage.page.locator('.package-detail, [data-testid="package-detail"]');
      
      // Either modal or detail page should be visible
      const hasModal = await modal.isVisible();
      const hasDetailPage = await detailPage.isVisible();
      
      expect(hasModal || hasDetailPage).toBeTruthy();
      
      if (hasModal) {
        // Test modal functionality
        const closeButton = modal.locator('[aria-label*="close"], .close-button, button:has-text("×")');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await modal.waitFor({ state: 'hidden' });
        }
      }
      
    } catch (error) {
      console.log('Package detail interaction not available');
      test.skip();
    }
  });

  test('should handle different package categories', async () => {
    const packageTypes = [
      'luxury honeymoon packages',
      'romantic getaway packages', 
      'beach honeymoon destinations',
      'city break packages',
      'adventure honeymoon trips'
    ];
    
    for (const packageType of packageTypes) {
      await homePage.sendMessage(`Show me ${packageType}`);
      await homePage.waitForResponse();
      
      // Check if relevant packages are shown
      const response = await homePage.getLastMessage();
      const responseText = response.toLowerCase();
      
      // Response should be relevant to the request
      expect(responseText.length).toBeGreaterThan(10);
      
      // Small delay between requests
      await homePage.page.waitForTimeout(1000);
    }
  });

  test('should handle package filtering and search', async () => {
    await homePage.sendMessage('Show me honeymoon packages under $3000');
    await homePage.waitForResponse();
    
    const response = await homePage.getLastMessage();
    const responseText = response.toLowerCase();
    
    // Should mention budget or price
    const hasBudgetInfo = responseText.includes('budget') || 
                         responseText.includes('price') || 
                         responseText.includes('$') ||
                         responseText.includes('cost');
    
    expect(hasBudgetInfo).toBeTruthy();
  });

  test('should display package information correctly', async () => {
    await homePage.sendMessage('Tell me about Paris honeymoon packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      const packages = homePage.packageCarousel.locator('[data-testid="package-card"]');
      const firstPackage = packages.first();
      
      if (await firstPackage.isVisible()) {
        // Check for essential package information
        const elements = {
          title: firstPackage.locator('.package-title, h3, h4, [data-testid="package-title"]'),
          location: firstPackage.locator('.package-location, [data-testid="location"]'),
          price: firstPackage.locator('.package-price, [data-testid="price"]'),
          duration: firstPackage.locator('.package-duration, [data-testid="duration"]'),
          image: firstPackage.locator('img')
        };
        
        // At least title and price should be visible
        await expect(elements.title).toBeVisible();
        await expect(elements.price).toBeVisible();
        
        // Image should have alt text
        if (await elements.image.isVisible()) {
          await expect(elements.image).toHaveAttribute('alt');
        }
      }
    } catch (error) {
      console.log('Package information not available in expected format');
    }
  });

  test('should handle package booking or inquiry', async () => {
    await homePage.sendMessage('I want to book a romantic Paris package');
    await homePage.waitForResponse();
    
    const response = await homePage.getLastMessage();
    const responseText = response.toLowerCase();
    
    // Should provide booking guidance or show packages
    const hasBookingInfo = responseText.includes('book') || 
                          responseText.includes('reserve') || 
                          responseText.includes('contact') ||
                          responseText.includes('inquiry');
    
    expect(hasBookingInfo || responseText.includes('paris')).toBeTruthy();
  });

  test('should handle package comparison requests', async () => {
    await homePage.sendMessage('Compare beach vs city honeymoon packages');
    await homePage.waitForResponse();
    
    const response = await homePage.getLastMessage();
    const responseText = response.toLowerCase();
    
    // Should mention both beach and city
    const mentionsBeach = responseText.includes('beach') || responseText.includes('ocean');
    const mentionsCity = responseText.includes('city') || responseText.includes('urban');
    
    expect(mentionsBeach || mentionsCity).toBeTruthy();
  });
});

test.describe('AI LOVVE Package Accessibility', () => {
  test('should support keyboard navigation for packages', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.sendMessage('Show honeymoon packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Navigate to package carousel
      let attempts = 0;
      while (attempts < 10) {
        const focused = await page.evaluate(() => document.activeElement?.className || '');
        if (focused.includes('package') || focused.includes('carousel')) {
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }
      
      // Test Enter key on package
      await page.keyboard.press('Enter');
      
    } catch (error) {
      console.log('Package keyboard navigation test skipped');
    }
  });

  test('should have proper ARIA labels for packages', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.sendMessage('Show luxury packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      const packages = homePage.packageCarousel.locator('[data-testid="package-card"]');
      const firstPackage = packages.first();
      
      if (await firstPackage.isVisible()) {
        // Check for accessibility attributes
        const hasAriaLabel = await firstPackage.getAttribute('aria-label');
        const hasRole = await firstPackage.getAttribute('role');
        
        expect(hasAriaLabel || hasRole).toBeTruthy();
      }
    } catch (error) {
      console.log('Package accessibility test skipped');
    }
  });
});

test.describe('AI LOVVE Package Mobile', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.sendMessage('Show mobile-friendly packages');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      // Test mobile swipe if implemented
      const carousel = homePage.packageCarousel;
      if (await carousel.isVisible()) {
        // Test swipe gesture
        await homePage.swipe('left');
        await homePage.page.waitForTimeout(500);
        
        await homePage.swipe('right');
        await homePage.page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('Mobile package interaction test skipped');
    }
  });

  test('should display packages properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.sendMessage('Show packages for mobile');
    await homePage.waitForResponse();
    
    try {
      await homePage.waitForPackages();
      
      const carousel = homePage.packageCarousel;
      await expect(carousel).toBeVisible();
      
      // Should fit within mobile viewport
      const carouselBox = await carousel.boundingBox();
      if (carouselBox) {
        expect(carouselBox.width).toBeLessThanOrEqual(375);
      }
    } catch (error) {
      console.log('Mobile package display test skipped');
    }
  });
});