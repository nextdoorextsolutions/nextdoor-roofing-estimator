import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { makeRequest, GeocodingResult } from "./_core/map";
import { createLead, createEstimate, getAllLeads, getAllEstimates, getLeadWithEstimate } from "./db";
import { ENV } from "./_core/env";
import { 
  PRICING_TIERS, 
  WASTE_FACTOR, 
  PITCH_SURCHARGE, 
  PITCH_THRESHOLD,
  calculateEaveLength,
  calculateValleyRidgeLength,
  type SolarApiResponse,
  type RoofData,
  type EstimateResult 
} from "../shared/roofing";
import { notifyOwner } from "./_core/notification";

// Helper function to convert meters to feet
function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

// Helper function to convert square meters to square feet
function sqMetersToSqFeet(sqMeters: number): number {
  return sqMeters * 10.7639;
}

// Helper function to convert pitch degrees to x/12 format
function degreesToPitchRatio(degrees: number): number {
  // tan(degrees) = rise/run, and we want rise per 12 units of run
  return Math.round(Math.tan(degrees * Math.PI / 180) * 12);
}

// Helper function to estimate edge lengths using heuristic
// Eave Length ≈ sqrt(Total Area) * 4
// Valley/Ridge Length ≈ 20% of Eave Length
function estimateEdgeLengths(totalAreaSqFt: number): { eaveLength: number; ridgeValleyLength: number } {
  const eaveLength = calculateEaveLength(totalAreaSqFt);
  const ridgeValleyLength = calculateValleyRidgeLength(eaveLength);
  return { eaveLength, ridgeValleyLength };
}

// Calculate pricing based on roof data
function calculatePricing(roofData: RoofData): EstimateResult {
  // Apply waste factor
  const adjustedArea = roofData.totalRoofArea * (1 + WASTE_FACTOR);
  
  // Check for pitch surcharge
  const hasPitchSurcharge = roofData.averagePitch > PITCH_THRESHOLD;
  const pitchMultiplier = hasPitchSurcharge ? (1 + PITCH_SURCHARGE) : 1;
  
  // Calculate number of squares (100 sq ft each)
  const squares = adjustedArea / 100;
  
  // Calculate prices for each tier
  const pricing = {
    good: Math.round(squares * PRICING_TIERS[0].pricePerSquare * pitchMultiplier),
    better: Math.round(squares * PRICING_TIERS[1].pricePerSquare * pitchMultiplier),
    best: Math.round(squares * PRICING_TIERS[2].pricePerSquare * pitchMultiplier),
  };

  return {
    roofData,
    adjustedArea: Math.round(adjustedArea),
    hasPitchSurcharge,
    pricing,
  };
}

// Get static map URL for satellite image
function getStaticMapUrl(lat: number, lng: number): string {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, "");
  const apiKey = ENV.forgeApiKey;
  return `${baseUrl}/v1/maps/proxy/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=600x400&maptype=satellite&key=${apiKey}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Geocoding endpoint
  geocode: publicProcedure
    .input(z.object({ address: z.string() }))
    .mutation(async ({ input }) => {
      const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
        address: input.address,
      });

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

  // Solar API endpoint to get roof data
  getRoofData: publicProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Use the Google Solar API key directly with solar.googleapis.com
        const solarApiKey = ENV.googleSolarApiKey;
        
        if (!solarApiKey) {
          console.error("Google Solar API key not configured");
          return {
            solarApiAvailable: false,
            roofData: null,
            satelliteImageUrl: getStaticMapUrl(input.lat, input.lng),
          };
        }
        
        // Call Google Solar API buildingInsights endpoint directly
        const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${input.lat}&location.longitude=${input.lng}&requiredQuality=HIGH&key=${solarApiKey}`;
        
        const response = await fetch(solarUrl);
        
        if (!response.ok) {
          // Solar API not available for this location
          return {
            solarApiAvailable: false,
            roofData: null,
            satelliteImageUrl: getStaticMapUrl(input.lat, input.lng),
          };
        }

        const solarData: SolarApiResponse = await response.json();
        
        if (!solarData.solarPotential || !solarData.solarPotential.roofSegmentStats) {
          return {
            solarApiAvailable: false,
            roofData: null,
            satelliteImageUrl: getStaticMapUrl(input.lat, input.lng),
          };
        }

        const segments = solarData.solarPotential.roofSegmentStats;
        const wholeRoof = solarData.solarPotential.wholeRoofStats;

        // Calculate total roof area in sq ft
        const totalRoofArea = Math.round(sqMetersToSqFeet(wholeRoof.areaMeters2));

        // Calculate average pitch from all segments
        const totalPitchDegrees = segments.reduce((sum, seg) => sum + seg.pitchDegrees, 0);
        const avgPitchDegrees = totalPitchDegrees / segments.length;
        const averagePitch = degreesToPitchRatio(avgPitchDegrees);

        // Estimate edge lengths using heuristic based on total area
        const { eaveLength, ridgeValleyLength } = estimateEdgeLengths(totalRoofArea);

        const roofData: RoofData = {
          totalRoofArea,
          averagePitch,
          eaveLength,
          ridgeValleyLength,
          satelliteImageUrl: getStaticMapUrl(input.lat, input.lng),
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
          satelliteImageUrl: getStaticMapUrl(input.lat, input.lng),
        };
      }
    }),

  // Calculate estimate
  calculateEstimate: publicProcedure
    .input(z.object({
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
      return calculatePricing(input.roofData);
    }),

  // Submit lead and create estimate
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
      // Validate at least one contact method
      if (!input.name && !input.email && !input.phone) {
        throw new Error("Please provide at least one contact method (name, email, or phone)");
      }

      // Calculate pricing
      const estimate = calculatePricing(input.roofData);

      // Create lead in database
      const lead = await createLead({
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      if (!lead) {
        throw new Error("Failed to create lead");
      }

      // Create estimate in database
      const estimateRecord = await createEstimate({
        leadId: lead.id,
        totalRoofArea: input.roofData.totalRoofArea,
        averagePitch: input.roofData.averagePitch,
        eaveLength: input.roofData.eaveLength,
        ridgeValleyLength: input.roofData.ridgeValleyLength,
        adjustedArea: estimate.adjustedArea,
        hasPitchSurcharge: estimate.hasPitchSurcharge,
        goodPrice: estimate.pricing.good,
        betterPrice: estimate.pricing.better,
        bestPrice: estimate.pricing.best,
        satelliteImageUrl: input.roofData.satelliteImageUrl,
        solarApiAvailable: input.roofData.solarApiAvailable,
        status: "pending",
      });

      // Send notification to admin
      try {
        await notifyOwner({
          title: "New Roofing Lead",
          content: `
New lead received!

Contact Information:
- Name: ${input.name || "Not provided"}
- Email: ${input.email || "Not provided"}
- Phone: ${input.phone || "Not provided"}

Property:
- Address: ${input.address}

Roof Analysis:
- Total Area: ${input.roofData.totalRoofArea.toLocaleString()} sq ft
- Pitch: ${input.roofData.averagePitch}/12
- Pitch Surcharge: ${estimate.hasPitchSurcharge ? "Yes (10%)" : "No"}

Estimated Prices:
- Good (3-Tab): $${estimate.pricing.good.toLocaleString()}
- Better (Architectural): $${estimate.pricing.better.toLocaleString()}
- Best (Premium): $${estimate.pricing.best.toLocaleString()}
          `.trim(),
        });
      } catch (error) {
        console.error("Failed to send admin notification:", error);
      }

      return {
        leadId: lead.id,
        estimateId: estimateRecord?.id,
        estimate,
      };
    }),

  // Request manual quote (when Solar API unavailable)
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
      // Validate at least one contact method
      if (!input.name && !input.email && !input.phone) {
        throw new Error("Please provide at least one contact method (name, email, or phone)");
      }

      // Create lead in database
      const lead = await createLead({
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      if (!lead) {
        throw new Error("Failed to create lead");
      }

      // Create estimate with manual_quote status
      await createEstimate({
        leadId: lead.id,
        status: "manual_quote",
        solarApiAvailable: false,
      });

      // Send notification to admin
      try {
        await notifyOwner({
          title: "Manual Quote Request",
          content: `
New manual quote request!

Contact Information:
- Name: ${input.name || "Not provided"}
- Email: ${input.email || "Not provided"}
- Phone: ${input.phone || "Not provided"}

Property:
- Address: ${input.address}

Note: Satellite data was not available for this property. Manual inspection required.
          `.trim(),
        });
      } catch (error) {
        console.error("Failed to send admin notification:", error);
      }

      return {
        leadId: lead.id,
        message: "Your manual quote request has been submitted. We will contact you within 24 hours.",
      };
    }),

  // Admin: Get all leads
  getLeads: publicProcedure.query(async () => {
    return await getAllLeads();
  }),

  // Admin: Get all estimates
  getEstimates: publicProcedure.query(async () => {
    return await getAllEstimates();
  }),

  // Get lead with estimate
  getLeadWithEstimate: publicProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return await getLeadWithEstimate(input.leadId);
    }),
});

export type AppRouter = typeof appRouter;
