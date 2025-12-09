import { describe, expect, it } from "vitest";

// Test the Google Solar API key by making a lightweight request
describe("Google Solar API Key Validation", () => {
  it("should have GOOGLE_SOLAR_API_KEY environment variable set", () => {
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
  });

  it("should be able to call the Solar API buildingInsights endpoint", async () => {
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY;
    if (!apiKey) {
      console.warn("Skipping Solar API test - no API key configured");
      return;
    }

    // Test with a known location (Google HQ in Mountain View)
    const lat = 37.4220;
    const lng = -122.0841;
    
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`;
    
    const response = await fetch(url);
    
    // The API should return 200 OK or 404 (no building found) - both indicate valid key
    // 400/401/403 would indicate invalid key or permissions issue
    expect([200, 404]).toContain(response.status);
    
    if (response.ok) {
      const data = await response.json();
      // Verify the response has expected structure
      expect(data).toHaveProperty("name");
    }
  });
});
