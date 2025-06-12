# Email OTP Deployment Guide

## Real Email OTP Implementation Complete

The authentication system has been upgraded to use real email OTP delivery via Firebase Functions with nodemailer.

### What's Been Implemented

1. **Firebase Functions for Email OTP**:
   - `sendEmailOTP`: Generates 6-digit codes and sends via email
   - `verifyEmailOTP`: Validates codes and returns custom tokens
   - Professional email templates with AI LOVVE branding
   - 5-minute expiration for security

2. **Updated Frontend**:
   - AuthPage now calls Firebase Functions
   - Fallback to development mode (localStorage) when functions unavailable
   - Proper custom token authentication flow

### Deployment Steps

1. **Install Dependencies** (✅ Complete):
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. **Set Email Configuration Secret**:
   ```bash
   # Login to Firebase
   firebase login
   
   # Set email configuration (replace with real credentials)
   echo '{"service":"gmail","user":"ailovve.tech@gmail.com","password":"YOUR_GMAIL_APP_PASSWORD"}' | firebase functions:secrets:set EMAIL_CONFIG
   ```

3. **Deploy Firebase Functions**:
   ```bash
   firebase deploy --only functions
   ```

4. **Gmail Setup for Email Service**:
   - Create Gmail account: ailovve.tech@gmail.com
   - Enable 2-factor authentication
   - Generate App Password for SMTP
   - Use App Password in EMAIL_CONFIG secret

### Email Service Configuration

The system expects the following JSON format for EMAIL_CONFIG secret:
```json
{
  "service": "gmail",
  "user": "ailovve.tech@gmail.com", 
  "password": "YOUR_16_CHAR_APP_PASSWORD"
}
```

### Email Template Features

- 🎨 Beautiful gradient design matching AI LOVVE branding
- 📧 Large, bold 6-digit code display
- ⏱️ Clear 5-minute expiration notice
- 💕 Romantic branding elements
- 📱 Mobile-responsive HTML email

### Development Mode

When Firebase Functions are unavailable, the system automatically falls back to:
- localStorage-based OTP storage
- Console logging of codes
- Alert popups for development testing

### Security Features

- ✅ 6-digit numeric codes
- ✅ 5-minute expiration
- ✅ One-time use (marked as used after verification)
- ✅ Email validation
- ✅ Custom token authentication
- ✅ Firestore-based OTP storage

### User Experience

1. User enters email and clicks "Send Email OTP"
2. Real email arrives with branded template
3. User enters 6-digit code
4. System verifies via Firebase Functions
5. Custom token creates secure authentication
6. User is logged in seamlessly

The system now provides enterprise-grade email OTP authentication as requested! 🚀