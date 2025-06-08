# 🔧 Environment Setup Guide

This guide will help you set up AI LOVVE for development or production.

## 📋 Prerequisites

- Node.js 18+
- Firebase Account
- Google Cloud Console Access (for Gemini AI)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo>
cd ai-lovve-app
npm install
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your Firebase credentials
```

### 3. Firebase Setup
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy Firebase Functions (optional)
firebase deploy --only functions
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔑 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSyA...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `my-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID | - |
| `VITE_GEMINI_API_KEY` | Gemini AI API Key | - |
| `VITE_APP_ENV` | Environment | `development` |
| `VITE_DEBUG_MODE` | Debug logging | `true` |

## 🔥 Firebase Configuration

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication (Google provider)
4. Enable Firestore Database
5. Enable Firebase Functions

### 2. Get Configuration
1. Go to Project Settings
2. Add Web App
3. Copy configuration values to `.env`

### 3. Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Conversations are accessible by authenticated users
    match /conversations/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Packages are publicly readable
    match /honeymoonPackages/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🤖 Gemini AI Setup

### Option 1: Client-side (Development)
```bash
# Get API key from Google AI Studio
# Add to .env file
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Option 2: Server-side (Production)
```bash
# Set as Firebase Function secret
firebase functions:secrets:set GEMINI_KEY your_gemini_api_key_here
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🔍 Troubleshooting

### Common Issues

**Firebase Connection Error**
```
Check your API keys in .env file
Ensure Firebase project is active
Verify internet connection
```

**Build Errors**
```
npm run clean
npm install
npm run build
```

**Functions Deployment Issues**
```
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 📱 Development Features

- Hot Module Replacement (HMR)
- TypeScript support
- ESLint + Prettier
- Automatic imports
- PWA features
- Offline support

## 🛡️ Security Notes

- Never commit `.env` files to git
- Use Firebase Functions secrets for production API keys
- Implement proper Firestore security rules
- Enable App Check for production

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review Firebase console for errors
3. Check browser console for client errors
4. Review Firebase Functions logs for server errors

---

For more detailed Firebase setup, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)