# Estimator Configuration - Using NDEspanels Backend

## Current Setup

The estimator frontend is configured to use the **ndespanels.com backend exclusively** via Vercel proxy.

### Vercel Proxy Configuration
- All `/api/*` requests are proxied to `https://www.ndespanels.com/api/*`
- This is configured in `vercel.json`

### Required Endpoints (Frontend Calls)

The estimator frontend (`client/src/pages/Home.tsx`) calls these endpoints:

1. **`geocode`** - Convert address to coordinates
   - Input: `{ address: string }`
   - Output: `{ lat, lng, formattedAddress }`

2. **`getRoofData`** - Get roof measurements from Solar API
   - Input: `{ lat: number, lng: number }`
   - Output: `{ solarApiAvailable, roofData, satelliteImageUrl }`

3. **`submitLead`** - Submit lead with estimate
   - Input: `{ name?, email?, phone?, address, latitude, longitude, roofData }`
   - Output: `{ estimate, leadId }`

4. **`requestManualQuote`** - Request manual quote when Solar API unavailable
   - Input: `{ name?, email?, phone?, address, latitude, longitude }`
   - Output: `{ success, leadId }`

### NDEspanels Backend Endpoints

Located in `ndespanels.com-main/server/api/routers/jobs.ts`:

✅ **`geocode`** - Added (line 50-74)
✅ **`getRoofData`** - Added (line 632-727)
✅ **`submitLead`** - Added (line 829-876)
✅ **`requestManualQuote`** - Added (line 879-920)

### Type Compatibility Issue

**Problem:** The estimator's `client/src/lib/trpc.ts` imports `AppRouter` type from its local server:
```typescript
import type { AppRouter } from "../../../server/routers";
```

**Impact:** TypeScript will show type errors because the local router type doesn't match the actual ndespanels backend.

**Solutions:**

#### Option A: Use Generic Type (Quick Fix)
Replace the import with a generic type:
```typescript
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<any>();
```

#### Option B: Copy NDEspanels Router Type (Better)
1. Export the router type from ndespanels backend
2. Copy the type definition to estimator
3. Keep types in sync manually

#### Option C: Shared Package (Best - Future)
Create a shared types package that both repos import

## Current Status

- ✅ CORS configured for estimator domains
- ✅ All required endpoints exist in ndespanels backend
- ✅ Vercel proxy configured correctly
- ⚠️ TypeScript types need alignment

## Deployment Checklist

### NDEspanels Backend (www.ndespanels.com)
- ✅ CORS allows `nextdoorestimate.com` and `*.vercel.app`
- ✅ All 4 endpoints implemented
- ✅ Environment variable: `VITE_GOOGLE_MAPS_KEY` set

### Estimator Frontend (nextdoorestimate.com)
- ✅ Vercel proxy points to `www.ndespanels.com`
- ✅ Frontend calls correct endpoint names
- ⚠️ TypeScript types (optional fix)
- ✅ Environment variable: `VITE_API_URL=/api/trpc` (default)

## Testing

Once deployed, test the flow:
1. Visit nextdoorestimate.com
2. Enter an address
3. Verify geocoding works (no CORS errors)
4. Verify roof data fetches
5. Submit lead
6. Check lead appears in ndespanels CRM as unassigned

## Notes

- The estimator's local `server/` folder is **not used in production**
- All API calls go through Vercel proxy to ndespanels.com
- Leads are stored directly in the ndespanels CRM database
- No data sync needed - single source of truth
