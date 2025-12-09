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

## Updates - December 8, 2025
- [x] Add company logo (NES.jpg) to the application
- [x] Update company name to "NextDoor Exterior Solutions"
- [x] Add EmailJS integration for lead email notifications
- [x] Update eave/valley calculation to use heuristic (sqrt(area)*4 for eave, 20% of eave for valley)
- [x] Add lead capture modal before showing results
- [x] Request EmailJS public key from user

- [x] Show typing in real-time in the Get Estimate button as user types address
- [x] Make address input text black for visibility
- [x] Keep button text as "Get Estimate" (not showing typed address)
- [x] Fix Solar API not returning satellite data - updated to use solar.googleapis.com directly

## New Features - Call Now Button & Sales Pipeline UI
- [x] Add fancy Call Now button with phone number 727-318-0006
- [x] Implement glassmorphism container (bg-slate-900/80, backdrop-blur-xl, border-white/10)
- [x] Create neon teal glow effect for active states (shadow-[0_0_20px_rgba(45,212,191,0.5)])
- [x] Design sales pipeline with completed/active/future stage styling
- [x] Add golden/amber glow for "Closed Deal" node with house+dollar icon
- [x] Implement pulsing heartbeat animation for active "Closed Deal" state
- [x] Make Next button a primary action (solid green/teal background)
- [x] Fix flow logic to show completed stages with bright connecting lines

## Pricing Tiers & Warranty Updates
- [x] Rename "Good" tier to "House Brand" shingles
- [x] Keep "Better" tier as Architectural with 30-year/130 MPH wind warranty
- [x] Rename "Best" tier with Titan XT - 50-year/160 MPH wind warranty/20-yr Full-Start
- [x] Add warranty descriptions to each pricing card
- [x] Add dedicated warranty information section
- [x] Explain "Full-Start" warranty coverage

## Google Reviews & Storm Damage Features
- [x] Add Google Reviews slider at the bottom of the page
- [x] Display 5-star reviews with customer names and review text
- [x] Add "Set Up My Free Damage Report" button
- [x] Link button to nextdoorstormdocs.pro

## Real Google Reviews
- [x] Extract actual 5-star reviews from Google Business profile
- [x] Update GoogleReviewsSlider with real customer testimonials

## Pricing Update
- [x] Update Good tier to $450/sq
- [x] Update Better tier to $550/sq
- [x] Update Best tier to $650/sq
- [x] Add disclaimer: price based on lowest value, does not include upgrades or chosen materials

## Admin Dashboard & CRM Integration
- [x] Create protected admin dashboard page (admin-only access)
- [x] Display all submitted leads with estimate details
- [x] Show lead info: name, email, phone, address, roof area, pitch, pricing tiers
- [x] Add lead status management (new, contacted, quoted, won, lost)
- [x] Create REST API endpoint for CRM integration (/api/trpc/admin.*)
- [x] Add API authentication for CRM access (admin role required)
- [x] Include filtering and search functionality
- [x] Add export to CSV option

## Financing Calculator
- [x] Create financing calculator component
- [x] Show monthly payment options for each pricing tier
- [x] Include multiple term lengths (12, 24, 36, 48, 60 months)
- [x] Display APR and total cost information
- [x] Integrate into EstimateResults component

## Renew Financial & PACE Financing
- [x] Update financing calculator with Renew Financial options
- [x] Add PACE program financing terms
- [x] Include property tax-based repayment option
- [x] Show longer term options (10-25 years typical for PACE)

## Financing Calculator UI Refinement
- [x] Add distinctive icons for each financing term option
- [x] Add icons to package selection buttons
- [x] Enhance visual hierarchy with better iconography
