import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AddressInput } from "@/components/AddressInput";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { EstimateResults } from "@/components/EstimateResults";
import { HomeownerAssistedForm, type HomeownerAssistedAnswers } from "@/components/HomeownerAssistedForm";
import { generateProposalPDF } from "@/lib/generatePDF";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Shield, 
  Clock, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  RotateCcw,
  Phone,
  AlertTriangle,
  MapPinOff
} from "lucide-react";
import { CallNowButton } from "@/components/CallNowButton";
import { GoogleReviewsSlider } from "@/components/GoogleReviewsSlider";
import { StormDamageCTA } from "@/components/StormDamageCTA";
import type { RoofData, EstimateResult } from "../../../shared/roofing";

/**
 * The funnel's states map 1:1 onto the backend's result taxonomy, deliberately.
 *
 *   OK             -> lead-capture -> results
 *   NO_DATA        -> assisted-questions -> lead-capture -> results (preliminary)
 *   UPSTREAM_ERROR -> upstream-error   (retry; NEVER the questions form)
 *   BAD_INPUT      -> bad-address      (fix the address)
 *
 * Keeping these distinct on the client is half the root-cause fix. The retired
 * funnel had one failure branch, so an outage and a genuine coverage gap looked
 * identical to the visitor and produced the same (wrong) conclusion for us.
 */
/** Static satellite tile for the results page. Uses the browser key on purpose —
 *  the server key must never appear in a URL the page loads. */
function satelliteTileUrl(lat: number, lng: number): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) return "";
  return (
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=20&size=600x400&scale=2&maptype=satellite&key=${key}`
  );
}

type Step =
  | "address"
  | "analyzing"
  | "lead-capture"
  | "results"
  | "assisted-questions"
  | "upstream-error"
  | "bad-address";

interface LocationData {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>("address");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [roofData, setRoofData] = useState<RoofData | null>(null);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [customerInfo, setCustomerInfo] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [assistedAnswers, setAssistedAnswers] = useState<HomeownerAssistedAnswers | null>(null);
  const [isPreliminary, setIsPreliminary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The measurement is a QUERY on the backend, fetched imperatively because it
  // runs in response to the visitor picking an address, not on render.
  const utils = trpc.useUtils();
  const submitLeadMutation = trpc.crm.submitEstimatorLead.useMutation();
  // getRoofData is fetched imperatively, so there is no query object to read a
  // pending flag from — the step machine carries it instead.
  const isMeasuring = step === "analyzing";

  const handleAddressSelect = useCallback(async (address: string) => {
    setStep("analyzing");
    setErrorMessage(null);

    try {
      const result: any = await utils.crm.getRoofData.fetch({ address });

      if (result.status === "OK") {
        setLocation({
          lat: result.location.lat,
          lng: result.location.lng,
          formattedAddress: result.location.formattedAddress,
        });
        setRoofData({
          totalRoofArea: Math.round(result.measurement.totalRoofAreaSqFt),
          averagePitch: result.measurement.pitchRise ?? 0,
          eaveLength: 0,
          ridgeValleyLength: 0,
          satelliteImageUrl: satelliteTileUrl(result.location.lat, result.location.lng),
          solarApiAvailable: true,
        });
        setIsPreliminary(false);
        setAssistedAnswers(null);
        setShowLeadModal(true);
        setStep("lead-capture");
        return;
      }

      if (result.status === "NO_DATA") {
        // Google genuinely has nothing here. Ask the homeowner instead.
        setLocation({
          lat: result.location.lat,
          lng: result.location.lng,
          formattedAddress: result.location.formattedAddress,
        });
        setIsPreliminary(true);
        setStep("assisted-questions");
        return;
      }

      if (result.status === "BAD_INPUT") {
        setErrorMessage(result.message ?? "We couldn't find that address.");
        setStep("bad-address");
        return;
      }

      // UPSTREAM_ERROR — our fault. Say so, offer a retry, and do NOT push the
      // visitor into the questions form: that would record our outage as this
      // address having no coverage, which is the exact mistake that killed the
      // previous integration.
      setErrorMessage("We couldn't reach our measurement service just now.");
      setStep("upstream-error");
    } catch (error) {
      console.error("Error analyzing address:", error);
      setErrorMessage("We couldn't reach our measurement service just now.");
      setStep("upstream-error");
    }
  }, [utils]);

  /** Shared by both paths: the lead is written before results are shown. */
  const handleLeadSubmit = useCallback(async (data: { name?: string; email?: string; phone?: string }) => {
    if (!location) return;

    setCustomerInfo(data);
    setShowLeadModal(false);

    try {
      const result: any = await submitLeadMutation.mutateAsync({
        ...data,
        address: location.formattedAddress,
        lat: location.lat,
        lng: location.lng,
        ...(assistedAnswers ? { homeownerAssisted: assistedAnswers } : {}),
      });

      // Tiers come from the server. The client renders them; it does not price.
      setEstimate({
        roofData: {
          totalRoofArea: result.roofAreaSqFt,
          averagePitch: result.pricing.pitchRise ?? roofData?.averagePitch ?? 0,
          eaveLength: roofData?.eaveLength ?? 0,
          ridgeValleyLength: roofData?.ridgeValleyLength ?? 0,
          satelliteImageUrl:
            roofData?.satelliteImageUrl || satelliteTileUrl(location.lat, location.lng),
          solarApiAvailable: !result.preliminary,
        },
        adjustedArea: result.pricing.adjustedAreaSqFt,
        squares: result.pricing.squares,
        hasPitchSurcharge: Boolean(result.pricing.hasPitchSurcharge),
        pricing: {
          good: result.pricing.good,
          better: result.pricing.better,
          best: result.pricing.best,
        },
      });
      setIsPreliminary(Boolean(result.preliminary));
      setStep("results");
      toast.success(result.preliminary ? "Your preliminary estimate is ready!" : "Your estimate is ready!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("We couldn't submit that just now. Please try again.");
      setShowLeadModal(true);
      setStep("lead-capture");
    }
  }, [location, roofData, assistedAnswers, submitLeadMutation]);

  /** NO_DATA path: collect the property answers, then capture the lead. */
  const handleAssistedAnswers = useCallback((answers: HomeownerAssistedAnswers) => {
    setAssistedAnswers(answers);
    setRoofData(null);
    setShowLeadModal(true);
    setStep("lead-capture");
  }, []);

  const handleDownloadPDF = useCallback(() => {
    if (!estimate || !location) return;

    setIsGeneratingPDF(true);
    try {
      generateProposalPDF({
        estimate,
        address: location.formattedAddress,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
      });
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [estimate, location, customerInfo]);

  const handleStartOver = () => {
    setStep("address");
    setLocation(null);
    setRoofData(null);
    setEstimate(null);
    setCustomerInfo({});
    setShowLeadModal(false);
    setAssistedAnswers(null);
    setIsPreliminary(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[oklch(0.10_0_0)] text-white">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="NextDoor Exterior Solutions" 
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h1 className="text-xl font-bold">NextDoor Exterior Solutions</h1>
                <p className="text-xs text-gray-400">Professional Roofing Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CallNowButton variant="compact" />
              {step !== "address" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Only show on address step */}
      {step === "address" && (
        <section className="relative bg-[oklch(0.10_0_0)] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDE0di0yaDIyek0zNiAyNnYySDE0di0yaDIyek0zNiAyMnYySDE0di0yaDIyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="container relative py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src="/logo.jpg" 
                  alt="NextDoor Exterior Solutions" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-primary shadow-lg shadow-primary/30"
                />
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Get Your Instant
                <span className="text-primary block mt-2">Roof Quote</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Enter your address below and get a detailed roofing estimate in seconds. 
                Powered by satellite technology for accurate measurements.
              </p>
              
              {/* Address Input */}
              <div className="mt-8 max-w-2xl mx-auto">
                <AddressInput
                  onAddressSelect={handleAddressSelect}
                  isLoading={isMeasuring}
                />
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Instant Estimates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Award className="h-5 w-5 text-primary" />
                  <span>5-Star Rated</span>
                </div>
              </div>

              {/* Hero Call Now Button */}
              <div className="mt-10 flex justify-center">
                <CallNowButton variant="hero" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="container py-12">
        {/* Analyzing Step */}
        {step === "analyzing" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold">Analyzing Your Roof</h2>
            <p className="text-muted-foreground">
              We're using satellite imagery to measure your roof and calculate your estimate...
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Locating property</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Measuring roof area</span>
              </div>
            </div>
          </div>
        )}

        {/* Lead Capture Modal */}
        {step === "lead-capture" && (roofData || assistedAnswers) && (
          <LeadCaptureModal
            isOpen={showLeadModal}
            onClose={() => setShowLeadModal(false)}
            onSubmit={handleLeadSubmit}
            isLoading={submitLeadMutation.isPending}
            roofArea={roofData?.totalRoofArea ?? 0}
          />
        )}

        {/* Results Step */}
        {step === "results" && estimate && location && (
          <div className="space-y-4">
            {isPreliminary && (
              <div className="max-w-3xl mx-auto rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Preliminary estimate</strong> — based on the details you provided, and
                  confirmed at your free inspection.
                </p>
              </div>
            )}
            <EstimateResults
              estimate={estimate}
              address={location.formattedAddress}
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        )}

        {/* NO_DATA: Solar has no building here — ask the homeowner instead. */}
        {step === "assisted-questions" && location && (
          <HomeownerAssistedForm
            address={location.formattedAddress}
            onSubmit={handleAssistedAnswers}
            isLoading={submitLeadMutation.isPending}
          />
        )}

        {/* UPSTREAM_ERROR: our fault. A retry, not a detour into the form. */}
        {step === "upstream-error" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">Something went wrong on our end</h2>
            <p className="text-muted-foreground">
              {errorMessage ?? "We couldn't reach our measurement service just now."} This is our
              problem, not your address — please try again in a moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleStartOver}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <CallNowButton />
            </div>
          </div>
        )}

        {/* BAD_INPUT: the address itself didn't resolve. */}
        {step === "bad-address" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MapPinOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">We couldn't find that address</h2>
            <p className="text-muted-foreground">
              {errorMessage ?? "Please check the address and try again."} Double-check the street
              number and city, or give us a call and we'll look it up with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleStartOver}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Try another address
              </Button>
              <CallNowButton />
            </div>
          </div>
        )}

      </main>

      {/* Storm Damage CTA - Show on address step */}
      {step === "address" && <StormDamageCTA />}

      {/* Features Section - Only show on address step */}
      {step === "address" && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <h3 className="text-2xl font-bold text-center mb-10">Why Choose NextDoor Exterior Solutions?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Quality Materials</h4>
                <p className="text-muted-foreground text-sm">
                  We use only top-tier roofing materials from trusted manufacturers with industry-leading warranties.
                </p>
              </Card>
              <Card className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Expert Installation</h4>
                <p className="text-muted-foreground text-sm">
                  Our certified contractors have years of experience and are committed to excellence on every project.
                </p>
              </Card>
              <Card className="text-center p-6">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Fast & Reliable</h4>
                <p className="text-muted-foreground text-sm">
                  We complete projects on time and on budget, minimizing disruption to your daily life.
                </p>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Google Reviews Slider - Show on address step */}
      {step === "address" && <GoogleReviewsSlider />}

      {/* Footer */}
      <footer className="bg-[oklch(0.10_0_0)] text-white py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="NextDoor Exterior Solutions" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-semibold">NextDoor Exterior Solutions</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} NextDoor Exterior Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
