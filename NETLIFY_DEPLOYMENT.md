# 🚀 Netlify Deployment Guide

## Prerequisites

1. **Netlify Account**: Create account at [netlify.com](https://netlify.com)
2. **Firebase Project**: Ensure your Firebase project is ready
3. **Environment Variables**: Prepare your production environment variables

## Step 1: Environment Variables

In Netlify dashboard, go to **Site settings > Environment variables** and add:

```
VITE_FIREBASE_API_KEY=AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY
VITE_FIREBASE_AUTH_DOMAIN=ailovve.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ailovve
VITE_FIREBASE_STORAGE_BUCKET=ailovve.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=67784907260
VITE_FIREBASE_APP_ID=1:67784907260:web:bdde3514cea143949ffa79
VITE_FIREBASE_MEASUREMENT_ID=G-70KJQL4737
VITE_GEMINI_API_KEY=AIzaSyBiZUVH0esE5Y88yGz3uf0v9wZFYFDnqMo
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

## Step 2: Deploy Methods

### Method A: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Connect Netlify to your GitHub repository
3. Netlify will auto-deploy on commits

### Method B: Manual Deploy

1. Build locally: `npm run build`
2. Drag & drop `dist` folder to Netlify

### Method C: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## Step 3: Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

## Step 4: Domain & DNS

1. Set custom domain in Netlify
2. Configure DNS records
3. Enable HTTPS (automatic)

## Step 5: Firebase Security

Update Firebase console for production:
- Add your Netlify domain to authorized domains
- Update CORS settings if needed
- Verify Firestore rules are deployed

## Configuration Files

The project includes:
- ✅ `netlify.toml` - Netlify configuration
- ✅ `_redirects` - SPA routing (auto-generated)
- ✅ Security headers
- ✅ Caching rules

## Post-Deployment Checklist

- [ ] Test user authentication
- [ ] Verify Firebase connection
- [ ] Test subscription system
- [ ] Check PWA functionality
- [ ] Verify all pages load correctly
- [ ] Test responsive design

## Performance Optimizations

The build includes:
- Code splitting
- Bundle optimization
- Asset compression
- CDN caching headers

## Troubleshooting

### Build Fails
- Check Node version (18+)
- Verify all environment variables
- Run `npm run type-check` and `npm run lint`

### Firebase Connection Issues
- Verify API keys in environment variables
- Check Firebase project permissions
- Ensure domains are authorized

### 404 Errors
- `netlify.toml` includes SPA redirects
- Check if file exists in `dist` folder

## Monitoring

Consider adding:
- Netlify Analytics
- Firebase Analytics
- Error tracking (Sentry already configured)

---

**Ready to deploy!** 🎉