# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Backend deployed on Render
- Environment variables configured

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import this GitHub repository
4. Vercel will auto-detect the framework settings from `vercel.json`

### 2. Configure Environment Variables
In Vercel Project Settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend.onrender.com/api/trpc
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
VITE_APP_ID=your_app_id
```

**Important:** Replace `your-backend.onrender.com` with your actual Render backend URL.

### 3. Deploy
Click "Deploy" and Vercel will:
- Install dependencies using `pnpm install`
- Build the frontend using `vite build`
- Deploy to production

## Build Configuration

The repository is configured with:
- **Build Command:** `vite build`
- **Output Directory:** `dist/public`
- **Install Command:** `pnpm install`
- **Framework:** Vite + React

## SPA Routing
The `vercel.json` includes rewrite rules to handle client-side routing. All routes redirect to `/index.html` for the React Router to handle.

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `pnpm` version matches `packageManager` in package.json

### API Connection Issues
- Verify `VITE_API_URL` points to your Render backend
- Check CORS configuration on Render backend
- Ensure backend is running and accessible

### Environment Variables Not Working
- Environment variables must be prefixed with `VITE_` to be exposed to the client
- Rebuild/redeploy after changing environment variables
