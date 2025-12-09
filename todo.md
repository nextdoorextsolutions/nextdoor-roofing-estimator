# NextDoor Exteriors - Roofing Estimator TODO

## Core Features
- [x] Address input landing page with Google Places Autocomplete
- [x] Google Maps Geocoding API integration for coordinates
- [x] Google Solar API (buildingInsights) integration for roof data
- [x] Google Static Maps API for satellite imagery display
- [x] Three-tier pricing calculator (Good $500/sq, Better $600/sq, Best $750/sq)
- [x] 10% waste factor applied automatically
- [x] 10% pitch surcharge for slopes > 6/12
- [x] Technical details accordion with eave/ridge/valley lengths
- [x] Lead capture form (Name, Email, or Phone required)
- [x] PDF proposal generation with company branding
- [x] Email notification to admin with lead details (via notifyOwner)
- [x] Admin notification system integrated
- [x] Error handling for unavailable Solar API data
- [x] Manual quote request fallback

## Design
- [x] Teal and black color scheme
- [x] Modern construction-themed UI
- [x] Responsive design for mobile/desktop
- [x] Company logo and branding

## Database
- [x] Leads table for storing customer information
- [x] Estimates table for storing quote data

## Notes
- The Google Solar API requires HIGH quality imagery to return roof data
- Coverage varies by location - many residential areas have coverage, but some newer homes or rural areas may not
- When Solar API data is unavailable, the app correctly falls back to manual quote request
- Disclaimer is shown on all estimates: "Estimates are based on satellite data. Final price subject to onsite inspection."
