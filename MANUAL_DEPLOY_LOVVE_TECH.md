# 🚀 Manual Deploy to lovve.tech

## Step 1: Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/project/ailovve
2. **Authentication > Settings > Authorized domains**
3. **Add these domains**:
   ```
   lovve.tech
   www.lovve.tech
   *.netlify.app (temporary)
   ```

## Step 2: Manual Deploy to Netlify

### A. Deploy via Drag & Drop

1. **Go to Netlify**: https://app.netlify.com
2. **Drag & Drop**: Drop the `dist` folder to "Deploy manually"
3. **Note the temporary URL** (like: `amazing-site-123456.netlify.app`)

### B. Set Environment Variables

In Netlify dashboard → **Site settings → Environment variables**:

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

## Step 3: Domain Configuration

### A. In Netlify Dashboard

1. **Domain settings → Add custom domain**
2. **Add**: `lovve.tech`
3. **Add**: `www.lovve.tech` (optional)

### B. DNS Configuration at Domain Provider

**A Records** (for lovve.tech):
```
Type: A
Name: @
Value: 75.2.60.5
```

**CNAME Records** (for www.lovve.tech):
```
Type: CNAME
Name: www
Value: amazing-site-123456.netlify.app
```

**OR use Netlify DNS** (recommended):
- Change nameservers to Netlify's
- Netlify will handle all DNS automatically

## Step 4: SSL Certificate

- Netlify automatically provisions SSL
- Wait 24-48 hours for DNS propagation
- Verify HTTPS works

## Step 5: PWA Configuration

Update manifest.json for lovve.tech:

```json
{
  "start_url": "https://lovve.tech/",
  "scope": "https://lovve.tech/"
}
```

## Step 6: Testing Checklist

After deployment, test:

- [ ] **Home page loads**: https://lovve.tech
- [ ] **Authentication works**: Sign in/up
- [ ] **Firebase connection**: Chat functionality
- [ ] **Subscription system**: Message limits
- [ ] **PWA**: Install prompt
- [ ] **Mobile responsive**: All devices
- [ ] **HTTPS**: Secure connection
- [ ] **Performance**: Load speed

## Current Build Status

✅ **dist folder ready** (4.2MB total)  
✅ **44 optimized chunks**  
✅ **Security headers configured**  
✅ **PWA ready**  
✅ **Firebase rules deployed**

## Quick Deploy Commands

```bash
# Rebuild if needed
npm run build

# Compress for faster upload (optional)
cd dist && zip -r ../lovve-tech-deploy.zip . && cd ..
```

## Troubleshooting

### Domain Issues
- Check DNS propagation: https://dnschecker.org
- Verify A record points to Netlify IP
- Allow 24-48 hours for full propagation

### Firebase Issues
- Verify domain added to authorized domains
- Check browser console for CORS errors
- Test with temporary Netlify URL first

### Performance Issues
- Enable Netlify CDN
- Check asset caching headers
- Monitor Core Web Vitals

---

## Ready to Deploy! 🎉

1. **Drag `dist` folder** to Netlify
2. **Add environment variables**
3. **Configure lovve.tech domain**
4. **Update Firebase authorized domains**
5. **Test everything**

Your app will be live at **https://lovve.tech** 🚀