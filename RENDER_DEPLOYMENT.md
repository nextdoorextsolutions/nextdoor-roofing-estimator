# Backend Deployment to Render

This guide explains how to deploy the backend API to Render so your marketing site can process roof estimates.

## Why Deploy the Backend?

Your marketing site (nextdoorestimate.com) is static HTML/CSS/JS hosted on Vercel. When a homeowner enters their address, the site needs to:
1. Geocode the address (convert to coordinates)
2. Call Google Solar API to get roof measurements
3. Calculate pricing estimates
4. Save the lead to your CRM database

All of this requires a **backend server** with API endpoints, which is what we're deploying to Render.

## Step 1: Create a Render Account

1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

## Step 2: Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `nextdoor-roofing-estimator`
3. Configure the service:
   - **Name**: `nextdoor-backend` (or any name you prefer)
   - **Region**: Choose closest to your users (e.g., Oregon USA)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses repo root)
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`
   - **Instance Type**: `Free` (for testing, upgrade later if needed)

## Step 3: Set Environment Variables

In the Render dashboard, add these environment variables:

### Required Variables

```
NODE_ENV=production
DATABASE_URL=your_database_connection_string
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

### Optional Variables (for full CRM functionality)

```
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
VITE_APP_ID=your_app_id
```

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your backend
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Copy your backend URL (e.g., `https://nextdoor-backend.onrender.com`)

## Step 5: Update Vercel Configuration

1. Open `vercel.json` in your project
2. Replace `YOUR-BACKEND-URL.onrender.com` with your actual Render URL
3. Commit and push the changes:

```bash
git add vercel.json
git commit -m "Update backend URL for Render deployment"
git push
```

4. Vercel will automatically redeploy your marketing site with the new configuration

## Step 6: Test the Integration

1. Go to your marketing site (nextdoorestimate.com)
2. Enter a home address
3. Click "Get Estimate"
4. You should see the roof estimate appear

## Troubleshooting

### 405 Method Not Allowed
- Make sure `vercel.json` has the correct Render URL
- Verify the Render service is running (check Render dashboard)

### 500 Internal Server Error
- Check Render logs for errors
- Verify all environment variables are set correctly
- Make sure DATABASE_URL is valid

### CORS Errors
- The backend is configured to accept requests from any origin
- If you see CORS errors, check the browser console for details

## Database Setup

If you don't have a database yet:

1. **Option A: Use Render PostgreSQL (Recommended)**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Create a free PostgreSQL database
   - Copy the "Internal Database URL"
   - Add it as `DATABASE_URL` environment variable

2. **Option B: Use Supabase**
   - Go to https://supabase.com
   - Create a new project
   - Get the connection string from Settings → Database
   - Add it as `DATABASE_URL` environment variable

3. **Run Database Migrations**
   - After setting DATABASE_URL, the app will auto-create tables on first run
   - Or manually run: `pnpm run db:push`

## Cost Considerations

- **Render Free Tier**: Your backend will sleep after 15 minutes of inactivity
  - First request after sleep takes ~30 seconds to wake up
  - Subsequent requests are instant
  - Good for testing and low-traffic sites

- **Render Paid Tier ($7/month)**: Backend stays awake 24/7
  - Instant response times
  - Recommended for production use

## Next Steps

Once deployed, your marketing site will automatically:
1. Capture homeowner addresses
2. Calculate roof estimates
3. Save leads to your CRM
4. Send you notifications for new leads

You can access the full CRM dashboard at: `https://nextdoorestimate.com/admin`
