# Backend Deployment Required - 405 Error Fix

## The Problem

You're getting **405 Method Not Allowed** errors because the NDEspanels backend doesn't have the roofing estimator endpoints that the frontend needs:

- ❌ `geocode` - Convert address to coordinates
- ❌ `getRoofData` - Get roof measurements from Google Solar API  
- ❌ `submitLead` - Create lead with estimate data
- ❌ `requestManualQuote` - Handle manual quote requests

The NDEspanels backend has the CRM functionality, but not the roofing-specific endpoints.

## The Solution

Deploy **this project's backend** to Render. It has all the endpoints the frontend needs AND can store leads in the NDEspanels database.

## Quick Deployment Steps

### 1. Create Render Web Service (5 minutes)

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect repository: `nextdoor-roofing-estimator`
4. Configure:
   - **Name**: `nextdoor-estimator-backend`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`
   - **Instance Type**: Free

### 2. Set Environment Variables

Add these in Render dashboard:

```
NODE_ENV=production
DATABASE_URL=[your NDEspanels database URL]
VITE_GOOGLE_MAPS_KEY=[your Google Maps API key]
```

**Where to get DATABASE_URL:**
- Go to your NDEspanels Render service
- Settings → Environment Variables
- Copy the `DATABASE_URL` value
- Use the SAME database so all leads go to one place

### 3. Copy Your Backend URL

After deployment completes, copy the URL:
- Example: `https://nextdoor-estimator-backend.onrender.com`

### 4. Update Vercel Configuration

Update `vercel.json` to point to your new backend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://nextdoor-estimator-backend.onrender.com/api/:path*"
    }
  ]
}
```

### 5. Update Backend CORS

In your new backend, the CORS is already configured to allow:
- `https://nextdoorestimate.com`
- `https://www.nextdoorestimate.com`
- `*.vercel.app`

No changes needed!

### 6. Commit and Push

```bash
git add vercel.json
git commit -m "Update proxy to use dedicated estimator backend"
git push
```

Vercel will auto-redeploy and connect to your new backend.

## Why This Works

**Before (Not Working):**
- Frontend → NDEspanels backend
- NDEspanels backend doesn't have `geocode`, `getRoofData` endpoints
- 405 errors

**After (Working):**
- Frontend → Estimator backend (has all endpoints)
- Estimator backend → Same database as NDEspanels
- All leads appear in NDEspanels CRM
- No 405 errors

## Benefits

✅ All roofing estimator endpoints work
✅ Leads still go to NDEspanels database
✅ View all leads in NDEspanels CRM dashboard
✅ Separate backend = easier to maintain
✅ Can scale independently

## Cost

- **Render Free Tier**: Backend sleeps after 15 min inactivity
  - First request after sleep: ~30 seconds
  - Good for testing and low traffic
  
- **Render Paid ($7/month)**: Backend stays awake 24/7
  - Instant response times
  - Recommended for production

## Next Steps

1. Deploy backend to Render (steps above)
2. Update `vercel.json` with your backend URL
3. Push changes
4. Test the complete flow

Once deployed, your roofing estimator will work end-to-end with all leads flowing into your unified CRM.
