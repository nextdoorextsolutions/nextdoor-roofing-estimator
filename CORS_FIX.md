# CORS Error Fix - IMPORTANT

## The Problem

If you're seeing CORS errors in the browser console, it's because `VITE_API_URL` is set incorrectly in Vercel.

## The Solution

In **Vercel Dashboard** → Settings → Environment Variables:

### ❌ WRONG (causes CORS errors):
```
VITE_API_URL = https://ndespanels.com/api/trpc
```

### ✅ CORRECT (uses Vercel proxy):
```
VITE_API_URL = /api/trpc
```

## Why This Matters

When you use a **relative path** (`/api/trpc`), the browser makes requests to your own domain:
- Request goes to: `https://nextdoorestimate.com/api/trpc`
- Vercel's proxy (configured in `vercel.json`) forwards it to: `https://ndespanels.com/api/trpc`
- No CORS errors because the browser thinks it's calling the same domain

When you use an **absolute URL** (`https://ndespanels.com/api/trpc`), the browser makes cross-origin requests:
- Request goes directly to: `https://ndespanels.com/api/trpc`
- Browser blocks it with CORS error because it's a different domain
- Even though the backend allows your domain, the browser is strict about this

## How to Fix Right Now

1. Go to **Vercel Dashboard**
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Change the value from `https://ndespanels.com/api/trpc` to `/api/trpc`
6. Go to **Deployments** tab
7. Click the **3 dots** next to the latest deployment
8. Click **"Redeploy"**

After redeploying, the CORS errors will be gone and leads will submit successfully to your CRM.

## Vercel Proxy Configuration

The `vercel.json` file is already configured correctly:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ndespanels.com/api/:path*"
    }
  ]
}
```

This tells Vercel: "When someone requests `/api/anything`, secretly forward it to `https://ndespanels.com/api/anything`"

## Summary

- ✅ Use relative path: `/api/trpc`
- ❌ Don't use absolute URL: `https://ndespanels.com/api/trpc`
- ✅ Let Vercel proxy handle the backend connection
- ✅ No CORS errors, everything works smoothly
