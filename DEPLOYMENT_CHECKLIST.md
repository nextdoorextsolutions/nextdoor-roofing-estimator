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
   - VITE_ANALYTICS_ENDPOINT (optional)
   - VITE_ANALYTICS_WEBSITE_ID (optional)

4. **Updated `vite.config.ts`** - Fixed production build
   - Conditionally loads Manus plugin only in development
   - Prevents dev-only plugins from running in production

5. **Created `VERCEL_DEPLOYMENT.md`** - Complete deployment guide

## 🔧 Required Actions Before Deployment

### 1. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```
VITE_API_URL=https://your-backend.onrender.com/api/trpc
VITE_OAUTH_PORTAL_URL=your_value_here
VITE_APP_ID=your_value_here
```

Optional analytics variables:
```
VITE_ANALYTICS_ENDPOINT=your_value_here
VITE_ANALYTICS_WEBSITE_ID=your_value_here
```

### 2. Update Backend CORS Configuration (Render)

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

### 3. Deploy Backend to Render First

Ensure your backend is:
- Deployed and running on Render
- Accessible at the URL you'll use for VITE_API_URL
- Configured with proper CORS headers
- Connected to Supabase database

### 4. Connect GitHub Repo to Vercel

1. Go to https://vercel.com/new
2. Import `nextdoorextsolutions/nextdoor-roofing-estimator`
3. Vercel will auto-detect settings from `vercel.json`
4. Add environment variables (step 1 above)
5. Deploy

## 🚨 Common Issues & Solutions

### Build Fails with "Cannot find module"
- Verify all dependencies in package.json are installed
- Check that pnpm version matches packageManager field

### API calls fail with CORS errors
- Update backend CORS configuration (see step 2)
- Verify VITE_API_URL is correct
- Check that backend is running and accessible

### Environment variables not working
- Must be prefixed with `VITE_` for Vite
- Rebuild/redeploy after changing environment variables
- Check that variables are set in Vercel dashboard

### 404 on refresh
- Already configured in vercel.json
- All routes should redirect to /index.html

## 📋 Post-Deployment Verification

After deploying, test:
1. ✅ Homepage loads
2. ✅ All routes work (don't 404 on refresh)
3. ✅ API calls connect to backend
4. ✅ OAuth login flow works
5. ✅ Static assets (images, fonts) load

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Render Documentation](https://render.com/docs)
