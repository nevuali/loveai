/**
 * Advanced Content Security Policy (CSP) Manager
 * AAA-Grade XSS and injection attack prevention
 */

interface CSPConfig {
  reportOnly?: boolean;
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
  environment: 'development' | 'staging' | 'production';
}

interface NonceManager {
  scriptNonce: string;
  styleNonce: string;
  timestamp: number;
}

export class ContentSecurityPolicyManager {
  private nonceCache = new Map<string, NonceManager>();
  private violationReports: any[] = [];
  private trustedDomains = new Set<string>();
  
  constructor(private config: CSPConfig) {
    this.initializeTrustedDomains();
    this.setupViolationReporting();
  }

  private initializeTrustedDomains(): void {
    // Core trusted domains for AI LOVVE
    const baseDomains = [
      'self',
      'data:',
      'blob:',
      // Firebase domains
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.gstatic.com',
      'firebase.google.com',
      // Google AI/Gemini domains
      'generativelanguage.googleapis.com',
      'ai.google.dev',
      // CDN and analytics
      'cdnjs.cloudflare.com',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    // Add environment-specific domains
    if (this.config.environment === 'development') {
      baseDomains.push(
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*'
      );
    }
    
    baseDomains.forEach(domain => this.trustedDomains.add(domain));
  }

  generateNonce(sessionId?: string): NonceManager {
    const key = sessionId || 'global';
    
    // Generate cryptographically secure nonces
    const scriptNonce = this.generateSecureNonce();
    const styleNonce = this.generateSecureNonce();
    
    const nonceManager: NonceManager = {
      scriptNonce,
      styleNonce,
      timestamp: Date.now()
    };
    
    this.nonceCache.set(key, nonceManager);
    
    // Auto-expire nonces after 1 hour
    setTimeout(() => {
      this.nonceCache.delete(key);
    }, 3600000);
    
    return nonceManager;
  }

  private generateSecureNonce(): string {
    // Generate 128-bit random nonce
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
  }

  generateCSPHeader(sessionId?: string): string {
    const nonces = this.generateNonce(sessionId);
    
    const directives = this.buildCSPDirectives(nonces);
    
    const cspHeader = Object.entries(directives)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ');
    
    return this.config.reportOnly 
      ? `Content-Security-Policy-Report-Only: ${cspHeader}`
      : `Content-Security-Policy: ${cspHeader}`;
  }

  private buildCSPDirectives(nonces: NonceManager): Record<string, string[]> {
    const directives: Record<string, string[]> = {
      // Default source - most restrictive
      'default-src': ["'self'"],
      
      // Script sources with nonce
      'script-src': [
        "'self'",
        `'nonce-${nonces.scriptNonce}'`,
        // Allow specific trusted scripts
        'https://www.gstatic.com',
        'https://firebase.google.com',
        'https://apis.google.com'
      ],
      
      // Style sources with nonce
      'style-src': [
        "'self'",
        `'nonce-${nonces.styleNonce}'`,
        "'unsafe-inline'", // Required for some UI libraries
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com'
      ],
      
      // Image sources
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        // Allow Firebase Storage
        'https://*.googleapis.com',
        'https://*.gstatic.com'
      ],
      
      // Font sources  
      'font-src': [
        "'self'",
        'data:',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com'
      ],
      
      // Connect sources (AJAX, WebSocket, etc.)
      'connect-src': [
        "'self'",
        // Firebase endpoints
        'https://*.firebaseapp.com',
        'https://*.googleapis.com',
        'wss://*.firebaseapp.com',
        // Google AI endpoints
        'https://generativelanguage.googleapis.com',
        'https://ai.google.dev'
      ],
      
      // Media sources
      'media-src': [
        "'self'",
        'blob:',
        'data:'
      ],
      
      // Object/embed sources
      'object-src': ["'none'"],
      
      // Base URI restriction
      'base-uri': ["'self'"],
      
      // Form action restriction
      'form-action': [
        "'self'",
        'https://*.firebaseapp.com'
      ],
      
      // Frame ancestors (clickjacking protection)
      'frame-ancestors': ["'none'"],
      
      // Frame sources
      'frame-src': [
        "'self'",
        'https://*.firebaseapp.com',
        'https://accounts.google.com'
      ],
      
      // Worker sources
      'worker-src': [
        "'self'",
        'blob:'
      ],
      
      // Manifest source
      'manifest-src': ["'self'"]
    };

    // Add development-specific permissions
    if (this.config.environment === 'development') {
      directives['connect-src'].push(
        'ws://localhost:*',
        'ws://127.0.0.1:*',
        'http://localhost:*',
        'http://127.0.0.1:*'
      );
      directives['script-src'].push(
        'http://localhost:*',
        "'unsafe-eval'" // For dev tools
      );
    }

    // Add reporting
    if (this.config.reportUri) {
      directives['report-uri'] = [this.config.reportUri];
      directives['report-to'] = ['"csp-reports"'];
    }

    // Upgrade insecure requests in production
    if (this.config.upgradeInsecureRequests && this.config.environment === 'production') {
      directives['upgrade-insecure-requests'] = [];
    }

    return directives;
  }

  setupViolationReporting(): void {
    if (typeof window !== 'undefined') {
      // Listen for CSP violations
      document.addEventListener('securitypolicyviolation', (event) => {
        this.handleCSPViolation(event);
      });

      // Setup reporting API endpoint
      if (this.config.reportUri && 'ReportingObserver' in window) {
        const observer = new ReportingObserver((reports) => {
          for (const report of reports) {
            if (report.type === 'csp-violation') {
              this.handleCSPViolation(report.body);
            }
          }
        });
        observer.observe();
      }
    }
  }

  private handleCSPViolation(violation: any): void {
    const violationReport = {
      timestamp: Date.now(),
      blockedURI: violation.blockedURI || violation['blocked-uri'],
      documentURI: violation.documentURI || violation['document-uri'],
      effectiveDirective: violation.effectiveDirective || violation['effective-directive'],
      originalPolicy: violation.originalPolicy || violation['original-policy'],
      referrer: violation.referrer,
      statusCode: violation.statusCode || violation['status-code'],
      violatedDirective: violation.violatedDirective || violation['violated-directive'],
      sourceFile: violation.sourceFile || violation['source-file'],
      lineNumber: violation.lineNumber || violation['line-number'],
      columnNumber: violation.columnNumber || violation['column-number'],
      userAgent: navigator.userAgent,
      severity: this.calculateViolationSeverity(violation)
    };

    this.violationReports.push(violationReport);
    
    // Log severe violations immediately
    if (violationReport.severity === 'high' || violationReport.severity === 'critical') {
      console.error('🚨 CSP Violation (High Severity):', violationReport);
      
      // Auto-block suspicious sources
      if (this.isSuspiciousViolation(violationReport)) {
        this.blockSuspiciousSource(violationReport.blockedURI);
      }
    }
    
    // Keep only last 100 reports for performance
    if (this.violationReports.length > 100) {
      this.violationReports = this.violationReports.slice(-100);
    }
  }

  private calculateViolationSeverity(violation: any): 'low' | 'medium' | 'high' | 'critical' {
    const directive = violation.effectiveDirective || violation['effective-directive'];
    const blockedURI = violation.blockedURI || violation['blocked-uri'];
    
    // Critical: Script injection attempts
    if (directive === 'script-src' && (
      blockedURI.includes('javascript:') ||
      blockedURI.includes('data:text/javascript') ||
      blockedURI.includes('eval')
    )) {
      return 'critical';
    }
    
    // High: Inline script/style violations
    if ((directive === 'script-src' || directive === 'style-src') && 
        blockedURI === 'inline') {
      return 'high';
    }
    
    // Medium: External resource violations
    if (directive.includes('-src') && blockedURI.startsWith('http')) {
      return 'medium';
    }
    
    return 'low';
  }

  private isSuspiciousViolation(violation: any): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/javascript/i,
      /eval/i,
      /\.onion/i,
      /localhost:\d+/i // In production
    ];
    
    return suspiciousPatterns.some(pattern => 
      pattern.test(violation.blockedURI) || 
      pattern.test(violation.sourceFile)
    );
  }

  private blockSuspiciousSource(uri: string): void {
    // Add to blocked sources list
    console.warn(`🔒 Blocking suspicious source: ${uri}`);
    // In a real implementation, this would update server-side block lists
  }

  // Public API for getting nonces in React components
  getNonce(sessionId?: string, type: 'script' | 'style' = 'script'): string {
    const key = sessionId || 'global';
    const nonces = this.nonceCache.get(key);
    
    if (!nonces) {
      const newNonces = this.generateNonce(sessionId);
      return type === 'script' ? newNonces.scriptNonce : newNonces.styleNonce;
    }
    
    return type === 'script' ? nonces.scriptNonce : nonces.styleNonce;
  }

  // Analytics and monitoring
  getViolationReport(): any {
    const now = Date.now();
    const last24h = this.violationReports.filter(v => now - v.timestamp < 86400000);
    
    const severityCount = {
      critical: last24h.filter(v => v.severity === 'critical').length,
      high: last24h.filter(v => v.severity === 'high').length,
      medium: last24h.filter(v => v.severity === 'medium').length,
      low: last24h.filter(v => v.severity === 'low').length
    };
    
    const topViolatedDirectives = this.getTopViolatedDirectives(last24h);
    const topBlockedSources = this.getTopBlockedSources(last24h);
    
    return {
      totalViolations: last24h.length,
      severityDistribution: severityCount,
      topViolatedDirectives,
      topBlockedSources,
      riskScore: this.calculateRiskScore(severityCount)
    };
  }

  private getTopViolatedDirectives(violations: any[]): any[] {
    const directiveCounts = new Map<string, number>();
    
    violations.forEach(v => {
      const directive = v.effectiveDirective;
      directiveCounts.set(directive, (directiveCounts.get(directive) || 0) + 1);
    });
    
    return Array.from(directiveCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([directive, count]) => ({ directive, count }));
  }

  private getTopBlockedSources(violations: any[]): any[] {
    const sourceCounts = new Map<string, number>();
    
    violations.forEach(v => {
      const source = v.blockedURI;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    
    return Array.from(sourceCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }

  private calculateRiskScore(severityCount: any): number {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    const totalScore = Object.entries(severityCount)
      .reduce((sum, [severity, count]) => sum + (weights[severity as keyof typeof weights] * (count as number)), 0);
    
    // Normalize to 0-100 scale
    return Math.min(100, totalScore);
  }

  // Cleanup old data
  cleanup(): void {
    const now = Date.now();
    
    // Clean old nonces
    for (const [key, nonces] of this.nonceCache.entries()) {
      if (now - nonces.timestamp > 3600000) { // 1 hour
        this.nonceCache.delete(key);
      }
    }
    
    // Keep only last 7 days of violation reports
    this.violationReports = this.violationReports.filter(
      v => now - v.timestamp < 604800000
    );
  }
}

// Initialize CSP manager
export const cspManager = new ContentSecurityPolicyManager({
  environment: (import.meta.env.VITE_APP_ENV as any) || 'development',
  reportOnly: import.meta.env.DEV,
  upgradeInsecureRequests: !import.meta.env.DEV,
  reportUri: '/api/csp-reports'
});

// Auto-cleanup every hour
setInterval(() => {
  cspManager.cleanup();
}, 3600000);