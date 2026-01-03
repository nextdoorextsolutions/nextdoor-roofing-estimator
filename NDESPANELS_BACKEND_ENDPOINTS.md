# Required Endpoints for NDEspanels Backend

The roofing estimator frontend needs these endpoints added to the NDEspanels backend.

## Endpoints to Add

### 1. `geocode` - Convert Address to Coordinates

**Location**: Add to your tRPC router in NDEspanels backend

```typescript
geocode: publicProcedure
  .input(z.object({ address: z.string() }))
  .mutation(async ({ input }) => {
    const apiKey = process.env.VITE_GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input.address)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.status !== "OK" || result.results.length === 0) {
      throw new Error("Could not geocode address");
    }
    
    const location = result.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.results[0].formatted_address,
    };
  }),
```

### 2. `getRoofData` - Get Roof Measurements from Google Solar API

```typescript
getRoofData: publicProcedure
  .input(z.object({
    lat: z.number(),
    lng: z.number(),
  }))
  .mutation(async ({ input }) => {
    try {
      const solarApiKey = process.env.VITE_GOOGLE_MAPS_KEY;
      
      if (!solarApiKey) {
        return {
          solarApiAvailable: false,
          roofData: null,
          satelliteImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${input.lat},${input.lng}&zoom=20&size=600x400&maptype=satellite&key=${solarApiKey}`,
        };
      }
      
      const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${input.lat}&location.longitude=${input.lng}&requiredQuality=HIGH&key=${solarApiKey}`;
      
      const response = await fetch(solarUrl);
      
      if (!response.ok) {
        return {
          solarApiAvailable: false,
          roofData: null,
          satelliteImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${input.lat},${input.lng}&zoom=20&size=600x400&maptype=satellite&key=${solarApiKey}`,
        };
      }

      const solarData = await response.json();
      
      if (!solarData.solarPotential || !solarData.solarPotential.roofSegmentStats) {
        return {
          solarApiAvailable: false,
          roofData: null,
          satelliteImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${input.lat},${input.lng}&zoom=20&size=600x400&maptype=satellite&key=${solarApiKey}`,
        };
      }

      const segments = solarData.solarPotential.roofSegmentStats;
      const wholeRoof = solarData.solarPotential.wholeRoofStats;

      // Convert square meters to square feet
      const totalRoofArea = Math.round(wholeRoof.areaMeters2 * 10.7639);

      // Calculate average pitch from all segments
      const totalPitchDegrees = segments.reduce((sum, seg) => sum + seg.pitchDegrees, 0);
      const avgPitchDegrees = totalPitchDegrees / segments.length;
      const averagePitch = Math.round(Math.tan(avgPitchDegrees * Math.PI / 180) * 12);

      // Estimate edge lengths
      const eaveLength = Math.round(Math.sqrt(totalRoofArea) * 4);
      const ridgeValleyLength = Math.round(eaveLength * 0.2);

      const roofData = {
        totalRoofArea,
        averagePitch,
        eaveLength,
        ridgeValleyLength,
        satelliteImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${input.lat},${input.lng}&zoom=20&size=600x400&maptype=satellite&key=${solarApiKey}`,
        solarApiAvailable: true,
      };

      return {
        solarApiAvailable: true,
        roofData,
        satelliteImageUrl: roofData.satelliteImageUrl,
      };
    } catch (error) {
      console.error("Solar API error:", error);
      return {
        solarApiAvailable: false,
        roofData: null,
        satelliteImageUrl: `https://maps.googleapis.com/maps/api/staticmap?center=${input.lat},${input.lng}&zoom=20&size=600x400&maptype=satellite&key=${process.env.VITE_GOOGLE_MAPS_KEY}`,
      };
    }
  }),
```

### 3. `submitLead` - Create Lead with Estimate

```typescript
submitLead: publicProcedure
  .input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    roofData: z.object({
      totalRoofArea: z.number(),
      averagePitch: z.number(),
      eaveLength: z.number(),
      ridgeValleyLength: z.number(),
      satelliteImageUrl: z.string(),
      solarApiAvailable: z.boolean(),
    }),
  }))
  .mutation(async ({ input }) => {
    // Calculate pricing
    const WASTE_FACTOR = 0.10;
    const PITCH_THRESHOLD = 6;
    const PITCH_SURCHARGE = 0.15;
    
    const adjustedArea = input.roofData.totalRoofArea * (1 + WASTE_FACTOR);
    const pitchMultiplier = input.roofData.averagePitch > PITCH_THRESHOLD ? (1 + PITCH_SURCHARGE) : 1;
    
    const PRICING_TIERS = {
      good: { shingles: 3.50, labor: 2.00, underlayment: 0.50, ventilation: 0.30, flashing: 0.40, disposal: 0.50 },
      better: { shingles: 4.50, labor: 2.50, underlayment: 0.60, ventilation: 0.40, flashing: 0.50, disposal: 0.60 },
      best: { shingles: 6.00, labor: 3.00, underlayment: 0.75, ventilation: 0.50, flashing: 0.60, disposal: 0.75 },
    };
    
    const calculateTier = (tier) => {
      const materials = (tier.shingles + tier.underlayment) * adjustedArea;
      const labor = tier.labor * adjustedArea;
      const edgeWork = (tier.flashing * input.roofData.eaveLength) + (tier.flashing * 0.5 * input.roofData.ridgeValleyLength);
      const ventilation = tier.ventilation * adjustedArea;
      const disposal = tier.disposal * input.roofData.totalRoofArea;
      const subtotal = (materials + labor + edgeWork + ventilation + disposal) * pitchMultiplier;
      return Math.round(subtotal);
    };
    
    const estimate = {
      roofData: input.roofData,
      pricing: {
        good: calculateTier(PRICING_TIERS.good),
        better: calculateTier(PRICING_TIERS.better),
        best: calculateTier(PRICING_TIERS.best),
      },
      breakdown: {
        adjustedArea,
        pitchMultiplier,
      },
    };

    // Use your existing submitEstimatorLead endpoint
    const lead = await ctx.db.leads.create({
      data: {
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address,
        status: 'lead',
        source: 'estimator',
        estimatorData: {
          roofData: input.roofData,
          estimate: estimate,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      },
    });

    return { estimate, leadId: lead.id };
  }),
```

### 4. `requestManualQuote` - Handle Manual Quote Requests

```typescript
requestManualQuote: publicProcedure
  .input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string(),
    latitude: z.string(),
    longitude: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Create lead for manual quote
    const lead = await ctx.db.leads.create({
      data: {
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address,
        status: 'lead',
        source: 'estimator',
        notes: 'Manual quote requested - Solar API not available for this location',
        estimatorData: {
          latitude: input.latitude,
          longitude: input.longitude,
          manualQuoteRequested: true,
        },
      },
    });

    return { success: true, leadId: lead.id };
  }),
```

## Implementation Steps

1. **Open NDEspanels backend code** in Windsurf
2. **Find your tRPC router** (likely in `server/routers.ts` or similar)
3. **Add these 4 endpoints** to your router
4. **Make sure you have** `VITE_GOOGLE_MAPS_KEY` in your Render environment variables
5. **Deploy to Render** (Render will auto-deploy when you push)
6. **Test** by entering an address on nextdoorestimate.com

## Environment Variables

Make sure these are set in your NDEspanels Render service:

```
VITE_GOOGLE_MAPS_KEY=[your Google Maps API key]
```

This key needs access to:
- Geocoding API
- Maps Static API  
- Solar API

## Database Schema

The `submitEstimatorLead` endpoint you already have should work, or you can use the `submitLead` code above which stores:

- Lead contact info (name, email, phone)
- Address and coordinates
- Roof measurements
- Pricing estimate
- Status: 'lead'
- Source: 'estimator'

All leads will appear in your existing CRM with these fields populated.

## After Adding Endpoints

Once you've added these endpoints to NDEspanels and deployed:

1. The `vercel.json` is already pointing to `www.ndespanels.com`
2. No changes needed on the frontend
3. Test the complete flow
4. All leads will flow into your NDEspanels CRM

The 405 errors will be resolved once these endpoints exist in the NDEspanels backend.
