# Solar API Debug Notes

## Issue
The Solar API is returning "Satellite Data Unavailable" for addresses.

## Test Case
- Address: 123 Main St, Los Angeles, CA 90012, USA
- Result: Solar API returned unavailable

## Possible Causes
1. The Solar API endpoint URL format may be incorrect
2. The API key may not have Solar API access enabled
3. The proxy URL path may be wrong

## Current Implementation
The current URL format is:
`${baseUrl}/v1/maps/proxy/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`

## Google Solar API Correct Format
The correct Google Solar API URL should be:
`https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`

## Action Required
Need to check if the Manus Maps proxy supports the Solar API endpoint, or if we need to use a different approach.

## Confirmed Correct URL Format
The correct Google Solar API endpoint is:
`https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=37.4450&location.longitude=-122.1390&requiredQuality=HIGH&key=YOUR_API_KEY`

The issue is that the Manus Maps proxy (`/v1/maps/proxy`) is designed for Google Maps APIs, but the Solar API uses a different base URL (`solar.googleapis.com`) not the standard Maps API (`maps.googleapis.com`).

## Solution
Need to call the Solar API directly at `https://solar.googleapis.com` instead of through the Maps proxy.
