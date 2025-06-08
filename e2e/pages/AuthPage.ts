// Auth Page Object for login/register functionality
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  // Page elements
  get emailInput(): Locator {
    return this.page.locator('input[type="email"], input[name="email"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"], input[name="password"]');
  }

  get confirmPasswordInput(): Locator {
    return this.page.locator('input[name="confirmPassword"], input[placeholder*="confirm"]');
  }

  get nameInput(): Locator {
    return this.page.locator('input[name="name"], input[name="displayName"]');
  }

  get loginButton(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Sign In"), button:has-text("Login")');
  }

  get registerButton(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Sign Up"), button:has-text("Register")');
  }

  get googleSignInButton(): Locator {
    return this.page.locator('button:has-text("Google"), [data-testid="google-signin"]');
  }

  get switchToRegisterLink(): Locator {
    return this.page.locator('text="Sign up", text="Create account", text="Register"');
  }

  get switchToLoginLink(): Locator {
    return this.page.locator('text="Sign in", text="Login", text="Already have"');
  }

  get forgotPasswordLink(): Locator {
    return this.page.locator('text="Forgot password", text="Reset password"');
  }

  get authTitle(): Locator {
    return this.page.locator('h1, h2, .auth-title, [data-testid="auth-title"]');
  }

  get authSubtitle(): Locator {
    return this.page.locator('.auth-subtitle, [data-testid="auth-subtitle"]');
  }

  get authForm(): Locator {
    return this.page.locator('form, .auth-form, [data-testid="auth-form"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message, .auth-error');
  }

  get loadingIndicator(): Locator {
    return this.page.locator('.loading, .auth-loading, [data-testid="auth-loading"]');
  }

  get termsCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"], input[name="terms"]');
  }

  get privacyLink(): Locator {
    return this.page.locator('text="Privacy Policy", a[href*="privacy"]');
  }

  get termsLink(): Locator {
    return this.page.locator('text="Terms", a[href*="terms"]');
  }

  // Actions
  async login(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
    
    // Wait for either success navigation or error
    try {
      await this.page.waitForURL('/', { timeout: 10000 });
    } catch {
      // Check if there's an error message
      const hasError = await this.errorMessage.isVisible();
      if (hasError) {
        throw new Error('Login failed: ' + await this.errorMessage.textContent());
      }
    }
  }

  async register(name: string, email: string, password: string, confirmPassword?: string) {
    if (await this.nameInput.isVisible()) {
      await this.fillInput(this.nameInput, name);
    }
    
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    
    if (confirmPassword && await this.confirmPasswordInput.isVisible()) {
      await this.fillInput(this.confirmPasswordInput, confirmPassword);
    }
    
    // Accept terms if checkbox is present
    if (await this.termsCheckbox.isVisible()) {
      await this.clickElement(this.termsCheckbox);
    }
    
    await this.clickElement(this.registerButton);
    
    // Wait for either success navigation or error
    try {
      await this.page.waitForURL('/', { timeout: 10000 });
    } catch {
      const hasError = await this.errorMessage.isVisible();
      if (hasError) {
        throw new Error('Registration failed: ' + await this.errorMessage.textContent());
      }
    }
  }

  async signInWithGoogle() {
    await this.clickElement(this.googleSignInButton);
    
    // Handle Google OAuth popup
    const [popup] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.clickElement(this.googleSignInButton)
    ]);
    
    // Wait for popup to close (successful auth) or handle it
    await popup.waitForEvent('close');
  }

  async switchToRegister() {
    await this.clickElement(this.switchToRegisterLink);
    await this.waitForElement(this.registerButton);
  }

  async switchToLogin() {
    await this.clickElement(this.switchToLoginLink);
    await this.waitForElement(this.loginButton);
  }

  async requestPasswordReset(email: string) {
    await this.clickElement(this.forgotPasswordLink);
    await this.fillInput(this.emailInput, email);
    const resetButton = this.page.locator('button:has-text("Reset"), button:has-text("Send")');
    await this.clickElement(resetButton);
  }

  // Validation methods
  async expectLoginForm() {
    await this.expectElementToBeVisible(this.emailInput);
    await this.expectElementToBeVisible(this.passwordInput);
    await this.expectElementToBeVisible(this.loginButton);
  }

  async expectRegisterForm() {
    await this.expectElementToBeVisible(this.emailInput);
    await this.expectElementToBeVisible(this.passwordInput);
    await this.expectElementToBeVisible(this.registerButton);
  }

  async expectAuthTitle(text: string) {
    await this.expectElementToContainText(this.authTitle, text);
  }

  async expectErrorMessage(message?: string) {
    await this.expectElementToBeVisible(this.errorMessage);
    if (message) {
      await this.expectElementToContainText(this.errorMessage, message);
    }
  }

  async expectLoadingState() {
    await this.expectElementToBeVisible(this.loadingIndicator);
  }

  async expectSuccessfulAuth() {
    // Should redirect to home page
    await this.page.waitForURL('/');
  }

  // Test data helpers
  generateTestEmail(): string {
    const timestamp = Date.now();
    return `test.user.${timestamp}@example.com`;
  }

  generateTestPassword(): string {
    return 'TestPassword123!';
  }

  generateTestName(): string {
    const names = ['John Doe', 'Jane Smith', 'Test User', 'Demo Account'];
    return names[Math.floor(Math.random() * names.length)];
  }

  // Form validation
  async expectFieldError(field: 'email' | 'password' | 'name', errorMessage?: string) {
    let fieldInput: Locator;
    
    switch (field) {
      case 'email':
        fieldInput = this.emailInput;
        break;
      case 'password':
        fieldInput = this.passwordInput;
        break;
      case 'name':
        fieldInput = this.nameInput;
        break;
    }
    
    // Look for error message near the field
    const fieldError = this.page.locator(`${fieldInput} + .error, ${fieldInput} ~ .error-message`);
    await this.expectElementToBeVisible(fieldError);
    
    if (errorMessage) {
      await this.expectElementToContainText(fieldError, errorMessage);
    }
  }

  async testFormValidation() {
    // Test empty fields
    await this.clickElement(this.loginButton);
    await this.expectFieldError('email');
    
    // Test invalid email
    await this.fillInput(this.emailInput, 'invalid-email');
    await this.clickElement(this.loginButton);
    await this.expectFieldError('email', 'valid email');
    
    // Test short password
    await this.fillInput(this.emailInput, 'test@example.com');
    await this.fillInput(this.passwordInput, '123');
    await this.clickElement(this.loginButton);
    await this.expectFieldError('password');
  }
}