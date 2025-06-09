/**
 * Secret Scanner Utility
 * Scans build output and source files for accidentally exposed secrets
 */

interface SecretPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface ScanResult {
  found: boolean;
  matches: Array<{
    file: string;
    line: number;
    column: number;
    pattern: string;
    severity: string;
    description: string;
  }>;
}

export class SecretScanner {
  private patterns: SecretPattern[] = [
    {
      name: 'Firebase API Key',
      pattern: /AIzaSy[0-9A-Za-z_-]{33}/g,
      description: 'Firebase API key detected',
      severity: 'high'
    },
    {
      name: 'Gemini API Key',
      pattern: /AIzaSy[0-9A-Za-z_-]{33}/g,
      description: 'Google AI/Gemini API key detected',
      severity: 'high'
    },
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      description: 'AWS access key detected',
      severity: 'high'
    },
    {
      name: 'AWS Secret Key',
      pattern: /[0-9a-zA-Z/+]{40}/g,
      description: 'Potential AWS secret key detected',
      severity: 'medium'
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
      description: 'Private key detected',
      severity: 'high'
    },
    {
      name: 'GitHub Token',
      pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g,
      description: 'GitHub token detected',
      severity: 'high'
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9a-zA-Z-]+/g,
      description: 'Slack token detected',
      severity: 'high'
    },
    {
      name: 'Discord Token',
      pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
      description: 'Discord token detected',
      severity: 'high'
    },
    {
      name: 'Generic Secret',
      pattern: /(secret|password|token|key)\s*[:=]\s*["']?[A-Za-z0-9+/=]{20,}["']?/gi,
      description: 'Generic secret pattern detected',
      severity: 'medium'
    }
  ];

  async scanFile(filePath: string, content: string): Promise<ScanResult> {
    const result: ScanResult = {
      found: false,
      matches: []
    };

    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const pattern of this.patterns) {
        const matches = [...line.matchAll(pattern.pattern)];
        
        for (const match of matches) {
          if (match.index !== undefined) {
            result.found = true;
            result.matches.push({
              file: filePath,
              line: lineIndex + 1,
              column: match.index + 1,
              pattern: pattern.name,
              severity: pattern.severity,
              description: pattern.description
            });
          }
        }
      }
    }

    return result;
  }

  async scanDirectory(directoryPath: string, extensions: string[] = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json']): Promise<ScanResult> {
    const fs = await import('fs');
    const path = await import('path');
    
    const result: ScanResult = {
      found: false,
      matches: []
    };

    const scanRecursive = async (dirPath: string) => {
      try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
              await scanRecursive(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const fileResult = await this.scanFile(fullPath, content);
                
                if (fileResult.found) {
                  result.found = true;
                  result.matches.push(...fileResult.matches);
                }
              } catch (error) {
                console.warn(`Could not scan file ${fullPath}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
    };

    await scanRecursive(directoryPath);
    return result;
  }

  generateReport(result: ScanResult): string {
    if (!result.found) {
      return '✅ No secrets detected in scan.';
    }

    const highSeverity = result.matches.filter(m => m.severity === 'high');
    const mediumSeverity = result.matches.filter(m => m.severity === 'medium');
    const lowSeverity = result.matches.filter(m => m.severity === 'low');

    let report = `🚨 SECRET EXPOSURE DETECTED!\n\n`;
    report += `Total matches: ${result.matches.length}\n`;
    report += `High severity: ${highSeverity.length}\n`;
    report += `Medium severity: ${mediumSeverity.length}\n`;
    report += `Low severity: ${lowSeverity.length}\n\n`;

    if (highSeverity.length > 0) {
      report += `🔴 HIGH SEVERITY ISSUES:\n`;
      for (const match of highSeverity) {
        report += `  - ${match.pattern} in ${match.file}:${match.line}:${match.column}\n`;
        report += `    ${match.description}\n\n`;
      }
    }

    if (mediumSeverity.length > 0) {
      report += `🟡 MEDIUM SEVERITY ISSUES:\n`;
      for (const match of mediumSeverity) {
        report += `  - ${match.pattern} in ${match.file}:${match.line}:${match.column}\n`;
        report += `    ${match.description}\n\n`;
      }
    }

    report += `\nIMMEDIATE ACTIONS REQUIRED:\n`;
    report += `1. Remove all detected secrets from source code\n`;
    report += `2. Use environment variables for configuration\n`;
    report += `3. Regenerate all exposed API keys\n`;
    report += `4. Add detected patterns to .gitignore\n`;
    report += `5. Review git history for leaked secrets\n`;

    return report;
  }

  // Quick scan for specific known patterns
  quickScanForKnownSecrets(content: string): boolean {
    const knownExposedKeys = [
      'AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY', // Firebase API key
      'AIzaSyBiZUVH0esE5Y88yGz3uf0v9wZFYFDnqMo'  // Gemini API key
    ];

    for (const key of knownExposedKeys) {
      if (content.includes(key)) {
        return true;
      }
    }

    return false;
  }
}

export const secretScanner = new SecretScanner();