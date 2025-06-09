/**
 * Build Security Check
 * Pre-deployment security validation script
 */

import { secretScanner } from './secret-scanner';

interface SecurityCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

export class BuildSecurityCheck {
  async runPreDeploymentChecks(buildDir: string = 'dist'): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      passed: true,
      errors: [],
      warnings: [],
      summary: ''
    };

    console.log('🔍 Running pre-deployment security checks...');

    // 1. Scan build output for secrets
    console.log('📊 Scanning build output for secrets...');
    const scanResult = await secretScanner.scanDirectory(buildDir, ['.js', '.css', '.html', '.json']);
    
    if (scanResult.found) {
      const highSeveritySecrets = scanResult.matches.filter(m => m.severity === 'high');
      
      if (highSeveritySecrets.length > 0) {
        result.passed = false;
        result.errors.push(`🚨 CRITICAL: ${highSeveritySecrets.length} high-severity secrets found in build output`);
        
        for (const secret of highSeveritySecrets) {
          result.errors.push(`  - ${secret.pattern} in ${secret.file}:${secret.line}`);
        }
      }

      const mediumSeveritySecrets = scanResult.matches.filter(m => m.severity === 'medium');
      if (mediumSeveritySecrets.length > 0) {
        result.warnings.push(`⚠️  ${mediumSeveritySecrets.length} medium-severity potential secrets found`);
      }
    }

    // 2. Check for exposed API endpoints in JavaScript bundles
    console.log('🔍 Checking for exposed API endpoints...');
    await this.checkForExposedEndpoints(buildDir, result);

    // 3. Validate environment variable usage
    console.log('🔧 Validating environment variable usage...');
    await this.checkEnvironmentVariables(buildDir, result);

    // 4. Check for debug/development code
    console.log('🐛 Checking for debug code...');
    await this.checkForDebugCode(buildDir, result);

    // 5. Validate security headers configuration
    console.log('🛡️  Checking security configuration...');
    await this.checkSecurityConfiguration(result);

    // Generate summary
    result.summary = this.generateSummary(result);

    return result;
  }

  private async checkForExposedEndpoints(buildDir: string, result: SecurityCheckResult): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const jsFiles = await this.findFiles(buildDir, '.js');
      
      for (const file of jsFiles) {
        const content = await fs.promises.readFile(file, 'utf-8');
        
        // Check for exposed internal endpoints
        const internalEndpoints = [
          /localhost:\d+/g,
          /127\.0\.0\.1:\d+/g,
          /\.local:\d+/g,
          /internal\..*\.com/g
        ];

        for (const pattern of internalEndpoints) {
          if (pattern.test(content)) {
            result.warnings.push(`⚠️  Potential internal endpoint found in ${path.basename(file)}`);
          }
        }
      }
    } catch (error) {
      result.warnings.push(`⚠️  Could not check for exposed endpoints: ${error}`);
    }
  }

  private async checkEnvironmentVariables(buildDir: string, result: SecurityCheckResult): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const jsFiles = await this.findFiles(buildDir, '.js');
      
      for (const file of jsFiles) {
        const content = await fs.promises.readFile(file, 'utf-8');
        
        // Check for hardcoded environment values
        const hardcodedPatterns = [
          /VITE_.*=["'][^"']+["']/g,
          /process\.env\.[A-Z_]+=["'][^"']+["']/g
        ];

        for (const pattern of hardcodedPatterns) {
          if (pattern.test(content)) {
            result.errors.push(`🚨 Hardcoded environment variable found in ${path.basename(file)}`);
            result.passed = false;
          }
        }
      }
    } catch (error) {
      result.warnings.push(`⚠️  Could not check environment variables: ${error}`);
    }
  }

  private async checkForDebugCode(buildDir: string, result: SecurityCheckResult): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const jsFiles = await this.findFiles(buildDir, '.js');
      
      for (const file of jsFiles) {
        const content = await fs.promises.readFile(file, 'utf-8');
        
        // Check for debug code
        const debugPatterns = [
          /console\.log\(/g,
          /console\.debug\(/g,
          /debugger;/g,
          /\.log\(/g
        ];

        for (const pattern of debugPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 5) { // Allow some logging, but not excessive
            result.warnings.push(`⚠️  Excessive debug code found in ${path.basename(file)} (${matches.length} instances)`);
          }
        }
      }
    } catch (error) {
      result.warnings.push(`⚠️  Could not check for debug code: ${error}`);
    }
  }

  private async checkSecurityConfiguration(result: SecurityCheckResult): Promise<void> {
    const fs = await import('fs');
    
    // Check if security headers are configured
    const securityFiles = [
      'public/_headers',
      'public/.htaccess',
      'vercel.json',
      'netlify.toml'
    ];

    let hasSecurityConfig = false;
    
    for (const file of securityFiles) {
      try {
        await fs.promises.access(file);
        hasSecurityConfig = true;
        break;
      } catch {
        // File doesn't exist, continue checking
      }
    }

    if (!hasSecurityConfig) {
      result.warnings.push('⚠️  No security headers configuration found');
    }
  }

  private async findFiles(dir: string, extension: string): Promise<string[]> {
    const fs = await import('fs');
    const path = await import('path');
    const files: string[] = [];

    const scanDir = async (currentDir: string) => {
      try {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory might not exist or be accessible
      }
    };

    await scanDir(dir);
    return files;
  }

  private generateSummary(result: SecurityCheckResult): string {
    let summary = '🔍 Build Security Check Summary\n\n';
    
    if (result.passed) {
      summary += '✅ Security check PASSED\n';
    } else {
      summary += '❌ Security check FAILED\n';
    }

    summary += `Errors: ${result.errors.length}\n`;
    summary += `Warnings: ${result.warnings.length}\n\n`;

    if (result.errors.length > 0) {
      summary += 'ERRORS (must fix before deployment):\n';
      for (const error of result.errors) {
        summary += `${error}\n`;
      }
      summary += '\n';
    }

    if (result.warnings.length > 0) {
      summary += 'WARNINGS (recommended to fix):\n';
      for (const warning of result.warnings) {
        summary += `${warning}\n`;
      }
      summary += '\n';
    }

    if (!result.passed) {
      summary += 'DEPLOYMENT BLOCKED: Fix all errors before deploying to production.\n';
    } else {
      summary += 'Ready for deployment ✅\n';
    }

    return summary;
  }
}

export const buildSecurityCheck = new BuildSecurityCheck();