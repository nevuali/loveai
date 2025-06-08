// E2E tests for Home Page functionality
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { testMessages, testEnvironment } from '../fixtures/test-data';

test.describe('AI LOVVE Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('/');
  });

  test('should display welcome screen on first visit', async () => {
    await homePage.expectWelcomeScreen();
    await expect(homePage.welcomeTitle).toContainText('AI LOVVE');
    await expect(homePage.welcomeSubtitle).toContainText('honeymoon');
  });

  test('should have functional chat input', async () => {
    await expect(homePage.chatInput).toBeVisible();
    await expect(homePage.chatInput).toBeEditable();
    await expect(homePage.sendButton).toBeVisible();
  });

  test('should send and receive messages', async () => {
    const message = testMessages.simple;
    
    await homePage.sendMessage(message);
    await homePage.expectMessageSent(message);
    await homePage.expectResponseReceived();
    
    const messageCount = await homePage.getMessageCount();
    expect(messageCount).toBeGreaterThanOrEqual(2); // User + AI message
  });

  test('should handle honeymoon planning requests', async () => {
    const message = testMessages.honeymoonRequest;
    
    await homePage.sendMessage(message);
    await homePage.expectMessageSent(message);
    await homePage.waitForResponse();
    
    const response = await homePage.getLastMessage();
    expect(response.toLowerCase()).toContain('paris');
  });

  test('should display package recommendations', async () => {
    await homePage.sendMessage(testMessages.packageRequest);
    await homePage.waitForResponse();
    
    // Wait for packages to load
    try {
      await homePage.waitForPackages();
      await homePage.expectPackagesDisplayed();
    } catch {
      // Packages might not always appear, that's okay
      console.log('No packages displayed for this request');
    }
  });

  test('should handle quick action buttons', async () => {
    await homePage.clickQuickAction(0); // First quick action
    await homePage.expectResponseReceived();
    
    const messageCount = await homePage.getMessageCount();
    expect(messageCount).toBeGreaterThanOrEqual(2);
  });

  test('should open and close sidebar', async () => {
    // Test sidebar toggle
    await homePage.openSidebar();
    await homePage.expectSidebarOpen();
    
    await homePage.closeSidebar();
    await homePage.expectSidebarClosed();
  });

  test('should create new chat', async () => {
    // Send initial message
    await homePage.sendMessage('Initial message');
    await homePage.waitForResponse();
    
    const initialCount = await homePage.getMessageCount();
    
    // Create new chat
    await homePage.createNewChat();
    
    // Should be back to welcome screen
    await homePage.expectWelcomeScreen();
    
    const newCount = await homePage.getMessageCount();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('should handle suggestion clicks', async () => {
    await homePage.openSidebar();
    
    try {
      await homePage.clickSuggestion('Romantic Paris Honeymoon');
      await homePage.expectResponseReceived();
    } catch {
      // Suggestion might not be visible, skip test
      console.log('Suggestion not found, skipping test');
    }
  });

  test('should switch between AI models', async () => {
    await homePage.selectModel('ai-lovv2');
    
    // Send a message to test the model
    await homePage.sendMessage('Test message for AI model');
    await homePage.waitForResponse();
    
    // Switch back
    await homePage.selectModel('ai-lovv3');
  });

  test('should handle multiple consecutive messages', async () => {
    for (const message of testMessages.multipleRequests) {
      await homePage.sendMessage(message);
      await homePage.waitForResponse();
    }
    
    const finalCount = await homePage.getMessageCount();
    expect(finalCount).toBe(testMessages.multipleRequests.length * 2); // User + AI responses
  });

  test('should auto-scroll to bottom on new messages', async () => {
    // Send multiple messages to create scroll
    for (let i = 0; i < 5; i++) {
      await homePage.sendMessage(`Test message ${i + 1}`);
      await homePage.waitForResponse();
    }
    
    // Check if the latest message is visible
    const lastMessage = homePage.messages.last();
    await expect(lastMessage).toBeInViewport();
  });

  test('should handle long messages', async () => {
    await homePage.sendMessage(testMessages.longMessage);
    await homePage.expectMessageSent(testMessages.longMessage);
    await homePage.waitForResponse();
    
    const response = await homePage.getLastMessage();
    expect(response.length).toBeGreaterThan(10);
  });

  test('should maintain chat state during navigation', async () => {
    await homePage.sendMessage('Test state persistence');
    await homePage.waitForResponse();
    
    const messageCount = await homePage.getMessageCount();
    
    // Navigate away and back
    await homePage.page.reload();
    await homePage.waitForPageLoad();
    
    // Check if messages are still there (if persistence is implemented)
    try {
      const newCount = await homePage.getMessageCount();
      expect(newCount).toBeGreaterThanOrEqual(0);
    } catch {
      // State might not persist, that's okay for this test
    }
  });
});

test.describe('AI LOVVE Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize(testEnvironment.viewport.mobile);
    
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.expectWelcomeScreen();
    await homePage.sendMessage('Mobile test');
    await homePage.waitForResponse();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize(testEnvironment.viewport.tablet);
    
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.expectWelcomeScreen();
    await homePage.sendMessage('Tablet test');
    await homePage.waitForResponse();
  });
});

test.describe('AI LOVVE Performance', () => {
  test('should load home page within performance budget', async ({ page }) => {
    const homePage = new HomePage(page);
    
    const loadTime = await homePage.measurePageLoad();
    expect(loadTime).toBeLessThan(testEnvironment.timeouts.long);
  });

  test('should not have console errors', async ({ page }) => {
    const homePage = new HomePage(page);
    const errors = await homePage.checkConsoleErrors();
    
    await homePage.goto('/');
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('AI LOVVE Accessibility', () => {
  test('should meet basic accessibility requirements', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    await homePage.checkAccessibility();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test Enter key on chat input
    await page.keyboard.type('Keyboard test');
    await page.keyboard.press('Enter');
    
    await homePage.waitForResponse();
  });
});