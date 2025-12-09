// Shared types for the Roofing Estimator

export interface RoofData {
  totalRoofArea: number; // in sq ft
  averagePitch: number; // pitch value (e.g., 6 for 6/12)
  eaveLength: number; // in feet
  ridgeValleyLength: number; // in feet
  satelliteImageUrl: string;
  solarApiAvailable: boolean;
}

export interface PricingTier {
  name: "good" | "better" | "best";
  label: string;
  description: string;
  pricePerSquare: number; // price per 100 sq ft
  warranty: {
    shingleYears: number;
    windSpeed: number;
    workmanship: string;
    fullStart?: number; // years of full-start coverage
  };
  shortDescription: string;
}

export interface EstimateResult {
  roofData: RoofData;
  adjustedArea: number; // with waste factor
  hasPitchSurcharge: boolean;
  pricing: {
    good: number;
    better: number;
    best: number;
  };
}

export interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface SolarApiResponse {
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  imageryDate: {
    year: number;
    month: number;
    day: number;
  };
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
    roofSegmentStats: RoofSegmentStat[];
    solarPanelConfigs: unknown[];
    financialAnalyses: unknown[];
    buildingStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundAreaMeters2: number;
    };
  };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryQuality: string;
  imageryProcessedDate: {
    year: number;
    month: number;
    day: number;
  };
}

export interface RoofSegmentStat {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    sunshineQuantiles: number[];
    groundAreaMeters2: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  planeHeightAtCenterMeters: number;
}

// Pricing constants
export const PRICING_TIERS: PricingTier[] = [
  {
    name: "good",
    label: "House Brand",
    description: "Standard 3-Tab Shingles",
    shortDescription: "Reliable protection at an affordable price",
    pricePerSquare: 450,
    warranty: {
      shingleYears: 25,
      windSpeed: 60,
      workmanship: "Standard workmanship warranty",
    },
  },
  {
    name: "better",
    label: "Better",
    description: "Architectural Shingles",
    shortDescription: "Enhanced durability with dimensional style",
    pricePerSquare: 550,
    warranty: {
      shingleYears: 30,
      windSpeed: 130,
      workmanship: "Extended workmanship warranty",
    },
  },
  {
    name: "best",
    label: "Best",
    description: "Titan XT Premium",
    shortDescription: "Ultimate protection with industry-leading warranty",
    pricePerSquare: 650,
    warranty: {
      shingleYears: 50,
      windSpeed: 160,
      workmanship: "Lifetime workmanship warranty",
      fullStart: 20,
    },
  },
];

export const WASTE_FACTOR = 0.10; // 10% waste
export const PITCH_SURCHARGE = 0.10; // 10% surcharge for steep roofs
export const PITCH_THRESHOLD = 6; // 6/12 pitch threshold

// Helper function to calculate eave length using heuristic
// Eave Length ≈ sqrt(Total Area) * 4
export function calculateEaveLength(totalAreaSqFt: number): number {
  return Math.round(Math.sqrt(totalAreaSqFt) * 4);
}

// Helper function to calculate valley/ridge length
// Valley/Ridge Length ≈ 20% of Eave Length
export function calculateValleyRidgeLength(eaveLength: number): number {
  return Math.round(eaveLength * 0.20);
}
