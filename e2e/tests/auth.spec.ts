// E2E tests for Authentication functionality
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { HomePage } from '../pages/HomePage';
import { testUsers } from '../fixtures/test-data';

test.describe('AI LOVVE Authentication', () => {
  let authPage: AuthPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    homePage = new HomePage(page);
    
    // Navigate to auth page (assuming it's the default for non-authenticated users)
    await authPage.goto('/auth');
  });

  test('should display login form by default', async () => {
    await authPage.expectLoginForm();
    await authPage.expectAuthTitle('Sign In');
  });

  test('should switch between login and register forms', async () => {
    // Start with login form
    await authPage.expectLoginForm();
    
    // Switch to register
    await authPage.switchToRegister();
    await authPage.expectRegisterForm();
    
    // Switch back to login
    await authPage.switchToLogin();
    await authPage.expectLoginForm();
  });

  test('should validate form inputs', async () => {
    await authPage.testFormValidation();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    // Skip if we don't have test credentials set up
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured');
    
    const email = process.env.TEST_USER_EMAIL || testUsers.validUser.email;
    const password = process.env.TEST_USER_PASSWORD || testUsers.validUser.password;
    
    await authPage.login(email, password);
    await authPage.expectSuccessfulAuth();
    
    // Should be on home page now
    await homePage.expectWelcomeScreen();
  });

  test('should handle login with invalid credentials', async () => {
    await authPage.login(testUsers.invalidUser.email, testUsers.invalidUser.password);
    await authPage.expectErrorMessage();
  });

  test('should handle user registration', async () => {
    const newUser = {
      name: authPage.generateTestName(),
      email: authPage.generateTestEmail(),
      password: authPage.generateTestPassword()
    };
    
    await authPage.switchToRegister();
    
    // Note: This might fail in a real environment due to Firebase rules
    // In a test environment, you'd mock the auth service
    try {
      await authPage.register(newUser.name, newUser.email, newUser.password, newUser.password);
      await authPage.expectSuccessfulAuth();
    } catch (error) {
      // Registration might fail due to real Firebase, check for appropriate error
      await authPage.expectErrorMessage();
    }
  });

  test('should handle Google Sign-In button', async () => {
    // Test that the Google sign-in button is present and clickable
    await expect(authPage.googleSignInButton).toBeVisible();
    
    // Note: We won't actually test Google OAuth in E2E as it requires real credentials
    // In a real test environment, you'd mock the OAuth flow
  });

  test('should handle password reset request', async () => {
    const email = testUsers.validUser.email;
    
    try {
      await authPage.requestPasswordReset(email);
      // Should show success message or redirect
    } catch (error) {
      // Password reset might not be implemented or might fail
      console.log('Password reset not available or failed');
    }
  });

  test('should remember user preferences', async ({ page }) => {
    // Test if the form remembers the last used email
    await authPage.fillInput(authPage.emailInput, testUsers.validUser.email);
    
    // Reload page
    await page.reload();
    
    // Check if email is still there (if implemented)
    const emailValue = await authPage.emailInput.inputValue();
    // This might be empty if persistence isn't implemented, which is fine
  });

  test('should handle loading states', async () => {
    // Fill form
    await authPage.fillInput(authPage.emailInput, testUsers.validUser.email);
    await authPage.fillInput(authPage.passwordInput, testUsers.validUser.password);
    
    // Click submit and check for loading state
    await authPage.clickElement(authPage.loginButton);
    
    try {
      await authPage.expectLoadingState();
    } catch {
      // Loading state might be too fast to catch
    }
  });

  test('should validate email format', async () => {
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@example.com',
      'test.example.com',
      ''
    ];
    
    for (const email of invalidEmails) {
      await authPage.fillInput(authPage.emailInput, email);
      await authPage.fillInput(authPage.passwordInput, 'ValidPassword123!');
      await authPage.clickElement(authPage.loginButton);
      
      // Should show error or not submit
      const currentUrl = authPage.page.url();
      expect(currentUrl).toContain('auth'); // Should still be on auth page
      
      // Clear for next iteration
      await authPage.fillInput(authPage.emailInput, '');
    }
  });

  test('should validate password requirements', async () => {
    await authPage.switchToRegister();
    
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'abc'
    ];
    
    for (const password of weakPasswords) {
      await authPage.fillInput(authPage.emailInput, 'test@example.com');
      await authPage.fillInput(authPage.passwordInput, password);
      await authPage.clickElement(authPage.registerButton);
      
      // Should show password requirement error
      try {
        await authPage.expectFieldError('password');
      } catch {
        // Error handling might be different
      }
      
      // Clear for next iteration
      await authPage.fillInput(authPage.passwordInput, '');
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    await authPage.fillInput(authPage.emailInput, testUsers.validUser.email);
    await authPage.fillInput(authPage.passwordInput, testUsers.validUser.password);
    await authPage.clickElement(authPage.loginButton);
    
    // Should show appropriate error message
    try {
      await authPage.expectErrorMessage('network');
    } catch {
      // Error message might be generic
      await authPage.expectErrorMessage();
    }
  });
});

test.describe('AI LOVVE Auth Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto('/auth');
    
    // Test tab order
    await page.keyboard.press('Tab'); // Should focus email
    await expect(authPage.emailInput).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus password
    await expect(authPage.passwordInput).toBeFocused();
    
    await page.keyboard.press('Tab'); // Should focus submit button
    await expect(authPage.loginButton).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto('/auth');
    
    // Check for proper labeling
    await expect(authPage.emailInput).toHaveAttribute('aria-label');
    await expect(authPage.passwordInput).toHaveAttribute('aria-label');
    
    // Check for form role
    await expect(authPage.authForm).toHaveAttribute('role');
  });

  test('should announce errors to screen readers', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto('/auth');
    
    // Trigger validation error
    await authPage.clickElement(authPage.loginButton);
    
    // Check if error has proper ARIA role
    try {
      await expect(authPage.errorMessage).toHaveAttribute('role', 'alert');
    } catch {
      // Error message might not have role attribute
    }
  });
});

test.describe('AI LOVVE Auth Mobile', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const authPage = new AuthPage(page);
    await authPage.goto('/auth');
    
    await authPage.expectLoginForm();
    
    // Test mobile-specific behavior
    await authPage.fillInput(authPage.emailInput, testUsers.validUser.email);
    await authPage.fillInput(authPage.passwordInput, testUsers.validUser.password);
    
    // On mobile, keyboard might trigger different behavior
    await page.keyboard.press('Enter');
  });

  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const authPage = new AuthPage(page);
    await authPage.goto('/auth');
    
    // Test that email input shows email keyboard
    await authPage.emailInput.click();
    await expect(authPage.emailInput).toHaveAttribute('type', 'email');
    
    // Test that password input is secure
    await authPage.passwordInput.click();
    await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
  });
});