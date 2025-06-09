#!/usr/bin/env node

/**
 * Pre-deployment Security Check Script
 * Run this before any production deployment
 */

import { buildSecurityCheck } from '../src/utils/build-security-check.js';
import { secretScanner } from '../src/utils/secret-scanner.js';

async function runSecurityChecks() {
  console.log('🛡️  Starting Pre-Deployment Security Checks\n');
  
  try {
    // 1. Quick scan for known exposed secrets
    console.log('🔍 Quick scan for known exposed secrets...');
    const knownSecretsFound = await scanForKnownSecrets();
    
    if (knownSecretsFound) {
      console.error('❌ DEPLOYMENT BLOCKED: Known exposed secrets found!');
      process.exit(1);
    }
    
    // 2. Run comprehensive build security check
    const result = await buildSecurityCheck.runPreDeploymentChecks();
    
    // 3. Display results
    console.log('\n' + result.summary);
    
    // 4. Exit with appropriate code
    if (!result.passed) {
      console.error('\n❌ DEPLOYMENT BLOCKED: Security check failed!');
      console.error('Fix all errors before deploying to production.');
      process.exit(1);
    } else {
      console.log('\n✅ Security check passed! Ready for deployment.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Security check failed with error:', error);
    process.exit(1);
  }
}

async function scanForKnownSecrets() {
  const knownExposedKeys = [
    'AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY', // Firebase API key
    'AIzaSyBiZUVH0esE5Y88yGz3uf0v9wZFYFDnqMo'  // Gemini API key
  ];
  
  const fs = await import('fs');
  const path = await import('path');
  
  // Check source files
  const sourceFiles = [
    'src',
    'public',
    'dist'
  ];
  
  for (const dir of sourceFiles) {
    try {
      await fs.promises.access(dir);
      const found = await scanDirectoryForSecrets(dir, knownExposedKeys);
      if (found) {
        return true;
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }
  
  return false;
}

async function scanDirectoryForSecrets(dirPath, secrets) {
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
        const found = await scanDirectoryForSecrets(fullPath, secrets);
        if (found) return true;
      } else if (entry.isFile()) {
        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          
          for (const secret of secrets) {
            if (content.includes(secret)) {
              console.error(`🚨 EXPOSED SECRET FOUND: ${secret.substring(0, 10)}... in ${fullPath}`);
              return true;
            }
          }
        } catch {
          // Can't read file, skip
        }
      }
    }
  } catch {
    // Can't read directory, skip
  }
  
  return false;
}

// Run the security checks
runSecurityChecks();