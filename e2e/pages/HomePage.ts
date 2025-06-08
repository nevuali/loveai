// Home Page Object for AI LOVVE application
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Page elements
  get welcomeTitle(): Locator {
    return this.page.locator('.gemini-welcome-title, [data-testid="welcome-title"]');
  }

  get welcomeSubtitle(): Locator {
    return this.page.locator('.gemini-welcome-subtitle, [data-testid="welcome-subtitle"]');
  }

  get chatInput(): Locator {
    return this.page.locator('.gemini-input, textarea[placeholder*="whisper"], textarea[placeholder*="message"]');
  }

  get sendButton(): Locator {
    return this.page.locator('.gemini-send-button, button[type="submit"]');
  }

  get newChatButton(): Locator {
    return this.page.locator('.gemini-new-chat, [data-testid="new-chat"]');
  }

  get sidebarToggle(): Locator {
    return this.page.locator('.gemini-menu-button, [data-testid="sidebar-toggle"]');
  }

  get sidebar(): Locator {
    return this.page.locator('.gemini-sidebar, [data-testid="sidebar"]');
  }

  get profileMenu(): Locator {
    return this.page.locator('.gemini-profile, [data-testid="profile-menu"]');
  }

  get modelSelector(): Locator {
    return this.page.locator('.gemini-model-selector, [data-testid="model-selector"]');
  }

  get quickActions(): Locator {
    return this.page.locator('.gemini-toolbox-button, [data-testid="quick-action"]');
  }

  get packageCarousel(): Locator {
    return this.page.locator('[data-testid="package-carousel"], .package-carousel');
  }

  get messages(): Locator {
    return this.page.locator('.gemini-message, [data-testid="message"]');
  }

  get userMessage(): Locator {
    return this.page.locator('.gemini-message-user, [data-testid="user-message"]');
  }

  get assistantMessage(): Locator {
    return this.page.locator('.gemini-message-assistant, [data-testid="assistant-message"]');
  }

  get typingIndicator(): Locator {
    return this.page.locator('.gemini-thinking, [data-testid="typing-indicator"]');
  }

  get voiceInputButton(): Locator {
    return this.page.locator('[data-testid="voice-input"], button[aria-label*="voice"]');
  }

  get imageUploadButton(): Locator {
    return this.page.locator('[data-testid="image-upload"], input[type="file"]');
  }

  get exportButton(): Locator {
    return this.page.locator('[data-testid="export-button"], button[aria-label*="export"]');
  }

  // Suggestion elements
  get suggestionItems(): Locator {
    return this.page.locator('.gemini-chat-item, [data-testid="suggestion-item"]');
  }

  get romantichoneymoonSuggestion(): Locator {
    return this.page.locator('text="Romantic Paris Honeymoon"');
  }

  get budgetSuggestion(): Locator {
    return this.page.locator('text="Budget Honeymoon Destinations"');
  }

  // Actions
  async sendMessage(message: string) {
    await this.fillInput(this.chatInput, message);
    await this.clickElement(this.sendButton);
    
    // Wait for typing indicator to appear and disappear
    try {
      await this.typingIndicator.waitFor({ state: 'visible', timeout: 2000 });
      await this.typingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Typing indicator might not appear for quick responses
    }
  }

  async clickQuickAction(index: number = 0) {
    const actions = this.quickActions;
    await actions.nth(index).click();
  }

  async openSidebar() {
    const isOpen = await this.sidebar.isVisible();
    if (!isOpen) {
      await this.clickElement(this.sidebarToggle);
      await this.waitForElement(this.sidebar);
    }
  }

  async closeSidebar() {
    const isOpen = await this.sidebar.isVisible();
    if (isOpen) {
      await this.clickElement(this.sidebarToggle);
      await this.sidebar.waitFor({ state: 'hidden' });
    }
  }

  async createNewChat() {
    await this.openSidebar();
    await this.clickElement(this.newChatButton);
    await this.waitForPageLoad();
  }

  async selectModel(model: 'ai-lovv3' | 'ai-lovv2') {
    await this.clickElement(this.modelSelector);
    const modelOption = this.page.locator(`text="${model}"`);
    await this.clickElement(modelOption);
  }

  async clickSuggestion(suggestionText: string) {
    const suggestion = this.page.locator(`text="${suggestionText}"`);
    await this.clickElement(suggestion);
  }

  async uploadImage(filePath: string) {
    await this.imageUploadButton.setInputFiles(filePath);
  }

  async waitForResponse() {
    // Wait for assistant response to appear
    await this.assistantMessage.last().waitFor({ state: 'visible', timeout: 30000 });
  }

  async getLastMessage(): Promise<string> {
    const lastMessage = this.messages.last();
    return await lastMessage.textContent() || '';
  }

  async getMessageCount(): Promise<number> {
    return await this.messages.count();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      const messagesContainer = document.querySelector('.gemini-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  // Package interaction
  async clickPackage(packageIndex: number = 0) {
    const packages = this.packageCarousel.locator('[data-testid="package-card"]');
    await packages.nth(packageIndex).click();
  }

  async waitForPackages() {
    await this.packageCarousel.waitFor({ state: 'visible', timeout: 10000 });
  }

  // Profile actions
  async openProfileMenu() {
    await this.clickElement(this.profileMenu);
  }

  async exportCurrentChat() {
    await this.openProfileMenu();
    const exportOption = this.page.locator('text="Export to PDF"');
    await this.clickElement(exportOption);
  }

  // Validation methods
  async expectWelcomeScreen() {
    await this.expectElementToBeVisible(this.welcomeTitle);
    await this.expectElementToBeVisible(this.welcomeSubtitle);
    await this.expectElementToContainText(this.welcomeTitle, 'AI LOVVE');
  }

  async expectMessageSent(messageText: string) {
    const userMsg = this.userMessage.filter({ hasText: messageText });
    await this.expectElementToBeVisible(userMsg);
  }

  async expectResponseReceived() {
    await this.expectElementToBeVisible(this.assistantMessage.last());
  }

  async expectPackagesDisplayed() {
    await this.expectElementToBeVisible(this.packageCarousel);
  }

  async expectSidebarOpen() {
    await this.expectElementToBeVisible(this.sidebar);
  }

  async expectSidebarClosed() {
    await this.sidebar.waitFor({ state: 'hidden' });
  }
}