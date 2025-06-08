// PDF Export utilities for chat history
// Using jsPDF for client-side PDF generation

interface ChatExportData {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  exportDate: string;
  userEmail?: string;
}

class PDFExporter {
  private readonly margins = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  };

  /**
   * Export single chat to PDF
   */
  public async exportChat(
    chatId: string,
    chatTitle: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>,
    userEmail?: string
  ): Promise<void> {
    try {
      // Validate required parameters
      if (!chatId || !chatTitle) {
        throw new Error('Chat ID and title are required');
      }
      
      // Handle empty messages array
      if (!messages || messages.length === 0) {
        console.warn('No messages to export');
        return;
      }
      
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // PDF metadata
      doc.setProperties({
        title: `AI LOVVE Chat - ${chatTitle}`,
        subject: 'Honeymoon Chat Export',
        author: 'AI LOVVE',
        creator: 'AI LOVVE Chat App',
        keywords: 'chat, export, honeymoon, ai'
      });

      await this.generateChatPDF(doc, {
        id: chatId,
        title: chatTitle,
        messages,
        exportDate: new Date().toISOString(),
        userEmail
      });

      // Save the PDF
      const fileName = `AI_LOVVE_Chat_${this.sanitizeFileName(chatTitle)}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('📄 Chat exported to PDF successfully:', fileName);
    } catch (error) {
      console.error('❌ Error exporting chat to PDF:', error);
      throw new Error('Failed to export chat to PDF');
    }
  }

  /**
   * Export multiple chats to PDF
   */
  public async exportMultipleChats(
    chats: Array<{
      id: string;
      title: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>;
    }>,
    userEmail?: string
  ): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setProperties({
        title: 'AI LOVVE Chat History Export',
        subject: 'Complete Chat History',
        author: 'AI LOVVE',
        creator: 'AI LOVVE Chat App',
        keywords: 'chat, export, honeymoon, ai, history'
      });

      // Add title page
      await this.addTitlePage(doc, chats.length, userEmail);

      // Add each chat
      for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];
        
        if (i > 0) {
          doc.addPage();
        }
        
        await this.generateChatPDF(doc, {
          id: chat.id,
          title: chat.title,
          messages: chat.messages,
          exportDate: new Date().toISOString(),
          userEmail
        }, i === 0);
      }

      // Save the PDF
      const fileName = `AI_LOVVE_Complete_History_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('📄 Multiple chats exported to PDF successfully:', fileName);
    } catch (error) {
      console.error('❌ Error exporting multiple chats to PDF:', error);
      throw new Error('Failed to export chat history to PDF');
    }
  }

  /**
   * Generate PDF content for a single chat
   */
  private async generateChatPDF(
    doc: any,
    chatData: ChatExportData,
    skipHeader = false
  ): Promise<void> {
    let yPosition = this.margins.top;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - this.margins.left - this.margins.right;

    if (!skipHeader) {
      // Add header
      yPosition = await this.addHeader(doc, yPosition, contentWidth);
    }

    // Add chat title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // AI LOVVE golden color
    
    const titleLines = doc.splitTextToSize(chatData.title, contentWidth);
    doc.text(titleLines, this.margins.left, yPosition);
    yPosition += titleLines.length * 6 + 10;

    // Add export info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    const exportDate = new Date(chatData.exportDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`Exported on: ${exportDate}`, this.margins.left, yPosition);
    if (chatData.userEmail) {
      doc.text(`User: ${chatData.userEmail}`, this.margins.left, yPosition + 4);
      yPosition += 4;
    }
    yPosition += 15;

    // Add messages
    for (const message of chatData.messages) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = this.margins.top;
      }

      yPosition = await this.addMessage(doc, message, yPosition, contentWidth);
    }

    // Add footer
    await this.addFooter(doc, pageHeight);
  }

  /**
   * Add PDF header
   */
  private async addHeader(doc: any, yPosition: number, contentWidth: number): Promise<number> {
    // AI LOVVE Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // Golden color
    doc.text('AI LOVVE', this.margins.left, yPosition);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Honeymoon Chat Export', this.margins.left, yPosition + 8);

    // Decorative line
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(this.margins.left, yPosition + 12, this.margins.left + contentWidth, yPosition + 12);

    return yPosition + 20;
  }

  /**
   * Add title page for multiple chats export
   */
  private async addTitlePage(doc: any, chatCount: number, userEmail?: string): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Center content vertically
    let yPosition = pageHeight / 2 - 40;

    // Main title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    const title = 'AI LOVVE';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);

    // Subtitle
    yPosition += 12;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const subtitle = 'Complete Chat History Export';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, yPosition);

    // Statistics
    yPosition += 20;
    doc.setFontSize(12);
    const stats = [
      `Total Conversations: ${chatCount}`,
      `Export Date: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`,
      ...(userEmail ? [`User: ${userEmail}`] : [])
    ];

    stats.forEach(stat => {
      const statWidth = doc.getTextWidth(stat);
      doc.text(stat, (pageWidth - statWidth) / 2, yPosition);
      yPosition += 6;
    });

    // Decorative elements
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    const lineY = pageHeight / 2 + 30;
    doc.line(pageWidth / 2 - 50, lineY, pageWidth / 2 + 50, lineY);

    doc.addPage();
  }

  /**
   * Add a single message to the PDF
   */
  private async addMessage(
    doc: any,
    message: { role: 'user' | 'assistant'; content: string; timestamp?: string },
    yPosition: number,
    contentWidth: number
  ): Promise<number> {
    const isUser = message.role === 'user';
    
    // Clean content (remove package commands)
    const cleanContent = message.content
      .replace(/\*\*SHOW_PACKAGES:[^*]+\*\*/g, '')
      .trim();

    if (!cleanContent) return yPosition;

    // Message header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // Set color based on user/AI
    if (isUser) {
      doc.setTextColor(59, 130, 246); // Blue for user
    } else {
      doc.setTextColor(34, 197, 94); // Green for AI
    }
    
    const roleText = isUser ? '👤 You' : '🤖 AI LOVVE';
    doc.text(roleText, this.margins.left, yPosition);

    // Timestamp
    if (message.timestamp) {
      const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const timestampWidth = doc.getTextWidth(timestamp);
      doc.text(timestamp, this.margins.left + contentWidth - timestampWidth, yPosition);
    }

    yPosition += 8;

    // Message content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    const contentLines = doc.splitTextToSize(cleanContent, contentWidth - 10);
    
    // Add background color for message bubble
    const bubbleHeight = contentLines.length * 4 + 6;
    
    // Set background color based on user/AI
    if (isUser) {
      doc.setFillColor(239, 246, 255); // Light blue for user
    } else {
      doc.setFillColor(240, 253, 244); // Light green for AI
    }
    doc.rect(this.margins.left + (isUser ? 20 : 0), yPosition - 2, 
             contentWidth - 20, bubbleHeight, 'F');

    // Add content text
    doc.text(contentLines, this.margins.left + (isUser ? 25 : 5), yPosition + 2);
    
    return yPosition + bubbleHeight + 8;
  }

  /**
   * Add footer to each page
   */
  private async addFooter(doc: any, pageHeight: number): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    
    const footerText = 'Generated by AI LOVVE - Your Magical Honeymoon Assistant';
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
    
    // Page number
    const pageNumber = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
    const pageNumberWidth = doc.getTextWidth(pageNumber);
    doc.text(pageNumber, pageWidth - this.margins.right - pageNumberWidth, pageHeight - 10);
  }

  /**
   * Sanitize filename for safe file saving
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  /**
   * Estimate PDF size before generation
   */
  public estimatePDFSize(messageCount: number): string {
    const avgMessageSize = 0.5; // KB per message
    const baseSize = 50; // KB for headers, footers, etc.
    const estimatedSize = baseSize + (messageCount * avgMessageSize);
    
    if (estimatedSize < 1024) {
      return `~${Math.round(estimatedSize)} KB`;
    } else {
      return `~${Math.round(estimatedSize / 1024 * 10) / 10} MB`;
    }
  }
}

// Export singleton instance
export const pdfExporter = new PDFExporter();

// Utility functions
export const exportChatToPDF = (
  chatId: string,
  chatTitle: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>,
  userEmail?: string
) => pdfExporter.exportChat(chatId, chatTitle, messages, userEmail);

export const exportAllChatsToPDF = (
  chats: Array<{
    id: string;
    title: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>;
  }>,
  userEmail?: string
) => pdfExporter.exportMultipleChats(chats, userEmail);

export const estimatePDFSize = (messageCount: number) => 
  pdfExporter.estimatePDFSize(messageCount);

console.log('📄 PDF Export utilities loaded');