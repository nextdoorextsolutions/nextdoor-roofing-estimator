# Vercel Deployment Checklist

## ✅ Completed Configuration Changes

1. **Created `vercel.json`** - Configures Vercel build settings
   - Build command: `vite build`
   - Output directory: `dist/public`
   - SPA routing configured (all routes → /index.html)

2. **Updated `client/src/main.tsx`** - Added API URL configuration
   - Now reads `VITE_API_URL` from environment variables
   - Falls back to `/api/trpc` for local development

3. **Created `.env.example`** - Documents required environment variables
   - VITE_API_URL (backend URL)
   - VITE_OAUTH_PORTAL_URL
   - VITE_APP_ID
   - VITE_FRONTEND_FORGE_API_KEY (Google Maps)
   - VITE_FRONTEND_FORGE_API_URL (Google Maps proxy)
   - VITE_ANALYTICS_ENDPOINT (optional)
   - VITE_ANALYTICS_WEBSITE_ID (optional)

4. **Updated `vite.config.ts`** - Fixed production build
   - Conditionally loads Manus plugin only in development
   - Prevents dev-only plugins from running in production

5. **Fixed `StormDamageCTA.tsx`** - Removed dead Manus link
   - Changed "Schedule My Inspection" to phone call
   - Removes dependency on expired external service

6. **Created `VERCEL_DEPLOYMENT.md`** - Complete deployment guide

## 🔧 Required Actions Before Deployment

### 1. Set Up Google Maps API

**Get API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. Restrict the key (recommended):
   - Application restrictions: HTTP referrers
   - Add your Vercel domain: `*.vercel.app`
   - API restrictions: Select the 3 APIs listed above

### 2. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

**Required:**
```
VITE_API_URL=https://your-backend.onrender.com/api/trpc
VITE_FRONTEND_FORGE_API_KEY=your_google_maps_api_key
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
```

**If using OAuth:**
```
VITE_OAUTH_PORTAL_URL=your_value_here
VITE_APP_ID=your_value_here
```

**Optional analytics:**
```
VITE_ANALYTICS_ENDPOINT=your_value_here
VITE_ANALYTICS_WEBSITE_ID=your_value_here
```

### 3. Update Backend CORS Configuration (Render)

Your backend on Render needs to allow requests from Vercel. Add your Vercel domain to CORS allowed origins:

```javascript
// In your Express backend
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:5173' // for local dev
  ],
  credentials: true
}));
```

### 4. Deploy Backend to Render First

Ensure your backend is:
- Deployed and running on Render
- Accessible at the URL you'll use for VITE_API_URL
- Configured with proper CORS headers
- Connected to Supabase database
- Has Google Maps API key configured for server-side geocoding

### 5. Connect GitHub Repo to Vercel

1. Go to https://vercel.com/new
2. Import `nextdoorextsolutions/nextdoor-roofing-estimator`
3. Vercel will auto-detect settings from `vercel.json`
4. Add environment variables (steps 1-2 above)
5. Deploy

## 🚨 Common Issues & Solutions

### Build Fails with "Cannot find module"
- Verify all dependencies in package.json are installed
- Check that pnpm version matches packageManager field

### API calls fail with CORS errors
- Update backend CORS configuration (see step 3)
- Verify VITE_API_URL is correct
- Check that backend is running and accessible

### Address Input Not Working
- Verify `VITE_FRONTEND_FORGE_API_KEY` is set
- Check Google Maps API key has correct APIs enabled
- Ensure API key restrictions allow your Vercel domain
- Check browser console for API errors

### Environment variables not working
- Must be prefixed with `VITE_` for Vite
- Rebuild/redeploy after changing environment variables
- Check that variables are set in Vercel dashboard

### 404 on refresh
- Already configured in vercel.json
- All routes should redirect to /index.html

### "Call Now" Button Not Working
- This is a `tel:` link - works on mobile devices
- On desktop, requires default phone app configured
- Test on mobile device for best experience

### "Schedule My Inspection" Shows Error
- Fixed: Now triggers phone call instead of external link
- Uses same phone number as "Call Now" button

## 📋 Post-Deployment Verification

After deploying, test:
1. ✅ Homepage loads
2. ✅ All routes work (don't 404 on refresh)
3. ✅ Address autocomplete works (Google Maps)
4. ✅ Address submission triggers analysis
5. ✅ API calls connect to backend
6. ✅ "Call Now" button works (test on mobile)
7. ✅ "Schedule My Inspection" triggers call
8. ✅ OAuth login flow works (if configured)
9. ✅ Static assets (images, fonts) load

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)
- [Render Documentation](https://render.com/docs)
