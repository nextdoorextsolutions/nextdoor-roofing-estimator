# Quick Start: Fix the 405 Error

Your marketing site is trying to call backend APIs that don't exist yet. Here's how to fix it in 3 steps:

## The Problem

When a homeowner enters their address on nextdoorestimate.com, the site tries to:
- POST to `/api/trpc/geocode` → **405 Method Not Allowed**

This fails because your marketing site (Vercel) is just static HTML/CSS/JS. It has no backend server to handle API requests.

## The Solution

Deploy your backend to Render, then configure Vercel to proxy API requests to it.

---

## Step 1: Deploy Backend to Render (10 minutes)

1. **Go to https://render.com** and sign up with GitHub
2. **Click "New +" → "Web Service"**
3. **Connect your repository**: `nextdoor-roofing-estimator`
4. **Configure**:
   - Name: `nextdoor-backend`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm run start`
   - Instance Type: **Free**
5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key
   ```
6. **Click "Create Web Service"** and wait 2-5 minutes
7. **Copy your backend URL** (e.g., `https://nextdoor-backend.onrender.com`)

### Need a Database?

In Render, click "New +" → "PostgreSQL" → Create a free database → Copy the "Internal Database URL" → Use it as `DATABASE_URL`

---

## Step 2: Update Vercel Configuration (2 minutes)

1. **Open `vercel.json`** in your project
2. **Replace** `YOUR-BACKEND-URL.onrender.com` with your actual Render URL
3. **Commit and push**:
   ```bash
   git add vercel.json
   git commit -m "Connect marketing site to Render backend"
   git push
   ```

Vercel will automatically redeploy (takes ~1 minute).

---

## Step 3: Add Backend URL to Vercel (1 minute)

1. **Go to Vercel Dashboard** → Your project → Settings → Environment Variables
2. **Add**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com/api/trpc`
3. **Redeploy** (Deployments tab → 3 dots → Redeploy)

---

## Test It

1. Go to **nextdoorestimate.com**
2. Enter a home address
3. Click "Get Estimate"
4. You should see the roof estimate appear! 🎉

---

## Troubleshooting

### Still getting 405 errors?
- Check that `vercel.json` has the correct Render URL
- Verify Render service is running (green status in dashboard)
- Hard refresh your browser (Ctrl+Shift+R)

### Getting 500 errors?
- Check Render logs for errors (Render dashboard → Logs tab)
- Verify `DATABASE_URL` is set correctly
- Make sure Google Maps API key is valid

### Slow first request?
- Render free tier sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Upgrade to paid tier ($7/month) for instant responses

---

## What Happens Next?

Once deployed, your system will automatically:
1. ✅ Capture homeowner addresses from your marketing site
2. ✅ Calculate roof estimates using Google Solar API
3. ✅ Save leads to your CRM database
4. ✅ Send you notifications for new leads

Access your CRM dashboard at: **nextdoorestimate.com/admin**

---

## Need More Details?

See `RENDER_DEPLOYMENT.md` for comprehensive deployment instructions.
