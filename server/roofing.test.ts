import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { PRICING_TIERS, WASTE_FACTOR, PITCH_SURCHARGE, PITCH_THRESHOLD, calculateEaveLength, calculateValleyRidgeLength } from "../shared/roofing";

// Create a mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Pricing Constants", () => {
  it("should have correct pricing tiers", () => {
    expect(PRICING_TIERS).toHaveLength(3);
    
    const good = PRICING_TIERS.find(t => t.name === "good");
    const better = PRICING_TIERS.find(t => t.name === "better");
    const best = PRICING_TIERS.find(t => t.name === "best");
    
    expect(good?.pricePerSquare).toBe(500);
    expect(better?.pricePerSquare).toBe(600);
    expect(best?.pricePerSquare).toBe(750);
  });

  it("should have correct waste factor of 10%", () => {
    expect(WASTE_FACTOR).toBe(0.10);
  });

  it("should have correct pitch surcharge of 10%", () => {
    expect(PITCH_SURCHARGE).toBe(0.10);
  });

  it("should have correct pitch threshold of 6/12", () => {
    expect(PITCH_THRESHOLD).toBe(6);
  });
});

describe("calculateEstimate procedure", () => {
  it("should calculate correct prices for standard roof without pitch surcharge", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const roofData = {
      totalRoofArea: 2000, // 2000 sq ft
      averagePitch: 4, // 4/12 pitch (below threshold)
      eaveLength: 100,
      ridgeValleyLength: 50,
      satelliteImageUrl: "https://example.com/image.jpg",
      solarApiAvailable: true,
    };

    const result = await caller.calculateEstimate({ roofData });

    // Adjusted area = 2000 * 1.10 = 2200 sq ft
    expect(result.adjustedArea).toBe(2200);
    expect(result.hasPitchSurcharge).toBe(false);

    // Number of squares = 2200 / 100 = 22 squares
    // Good: 22 * 500 = 11000
    // Better: 22 * 600 = 13200
    // Best: 22 * 750 = 16500
    expect(result.pricing.good).toBe(11000);
    expect(result.pricing.better).toBe(13200);
    expect(result.pricing.best).toBe(16500);
  });

  it("should apply pitch surcharge for steep roofs (pitch > 6/12)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const roofData = {
      totalRoofArea: 2000,
      averagePitch: 8, // 8/12 pitch (above threshold)
      eaveLength: 100,
      ridgeValleyLength: 50,
      satelliteImageUrl: "https://example.com/image.jpg",
      solarApiAvailable: true,
    };

    const result = await caller.calculateEstimate({ roofData });

    expect(result.hasPitchSurcharge).toBe(true);
    expect(result.adjustedArea).toBe(2200);

    // With 10% pitch surcharge:
    // Good: 22 * 500 * 1.10 = 12100
    // Better: 22 * 600 * 1.10 = 14520
    // Best: 22 * 750 * 1.10 = 18150
    expect(result.pricing.good).toBe(12100);
    expect(result.pricing.better).toBe(14520);
    expect(result.pricing.best).toBe(18150);
  });

  it("should not apply pitch surcharge at exactly 6/12 pitch", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const roofData = {
      totalRoofArea: 1000,
      averagePitch: 6, // Exactly at threshold
      eaveLength: 50,
      ridgeValleyLength: 25,
      satelliteImageUrl: "https://example.com/image.jpg",
      solarApiAvailable: true,
    };

    const result = await caller.calculateEstimate({ roofData });

    expect(result.hasPitchSurcharge).toBe(false);
  });

  it("should handle small roof areas correctly", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const roofData = {
      totalRoofArea: 500, // Small roof
      averagePitch: 4,
      eaveLength: 30,
      ridgeValleyLength: 15,
      satelliteImageUrl: "https://example.com/image.jpg",
      solarApiAvailable: true,
    };

    const result = await caller.calculateEstimate({ roofData });

    // Adjusted area = 500 * 1.10 = 550 sq ft
    expect(result.adjustedArea).toBe(550);
    
    // 5.5 squares
    // Good: 5.5 * 500 = 2750
    expect(result.pricing.good).toBe(2750);
  });

  it("should handle large roof areas correctly", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const roofData = {
      totalRoofArea: 5000, // Large roof
      averagePitch: 5,
      eaveLength: 200,
      ridgeValleyLength: 100,
      satelliteImageUrl: "https://example.com/image.jpg",
      solarApiAvailable: true,
    };

    const result = await caller.calculateEstimate({ roofData });

    // Adjusted area = 5000 * 1.10 = 5500 sq ft
    expect(result.adjustedArea).toBe(5500);
    
    // 55 squares
    // Good: 55 * 500 = 27500
    // Better: 55 * 600 = 33000
    // Best: 55 * 750 = 41250
    expect(result.pricing.good).toBe(27500);
    expect(result.pricing.better).toBe(33000);
    expect(result.pricing.best).toBe(41250);
  });
});

describe("Heuristic Edge Length Calculations", () => {
  it("should calculate eave length as sqrt(area) * 4", () => {
    const area = 2500; // 50x50 equivalent
    const eaveLength = calculateEaveLength(area);
    expect(eaveLength).toBe(200); // sqrt(2500) * 4 = 50 * 4 = 200
  });

  it("should calculate valley/ridge length as 20% of eave length", () => {
    const eaveLength = 200;
    const valleyLength = calculateValleyRidgeLength(eaveLength);
    expect(valleyLength).toBe(40); // 200 * 0.20 = 40
  });

  it("should handle larger roof areas", () => {
    const area = 4000;
    const eaveLength = calculateEaveLength(area);
    const valleyLength = calculateValleyRidgeLength(eaveLength);
    // sqrt(4000) ≈ 63.25, * 4 ≈ 253, rounded
    expect(eaveLength).toBe(253);
    expect(valleyLength).toBe(51); // 253 * 0.20 ≈ 50.6, rounded
  });
});

describe("Pricing tier labels", () => {
  it("should have correct tier labels", () => {
    const good = PRICING_TIERS.find(t => t.name === "good");
    const better = PRICING_TIERS.find(t => t.name === "better");
    const best = PRICING_TIERS.find(t => t.name === "best");

    expect(good?.label).toBe("Good");
    expect(better?.label).toBe("Better");
    expect(best?.label).toBe("Best");
  });

  it("should have correct tier descriptions", () => {
    const good = PRICING_TIERS.find(t => t.name === "good");
    const better = PRICING_TIERS.find(t => t.name === "better");
    const best = PRICING_TIERS.find(t => t.name === "best");

    expect(good?.description).toBe("3-Tab Shingles");
    expect(better?.description).toBe("Architectural Shingles");
    expect(best?.description).toBe("Premium/Metal Roofing");
  });
});
