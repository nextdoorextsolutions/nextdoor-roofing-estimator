import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AddressInput } from "@/components/AddressInput";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { EstimateResults } from "@/components/EstimateResults";
import { ManualQuoteForm } from "@/components/ManualQuoteForm";
import { generateProposalPDF } from "@/lib/generatePDF";
import { sendLeadEmail } from "@/lib/emailjs";
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
  Phone
} from "lucide-react";
import { CallNowButton } from "@/components/CallNowButton";
import { GoogleReviewsSlider } from "@/components/GoogleReviewsSlider";
import { StormDamageCTA } from "@/components/StormDamageCTA";
import type { RoofData, EstimateResult } from "../../../shared/roofing";

type Step = "address" | "analyzing" | "lead-capture" | "results" | "manual-quote" | "manual-submitted";

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

  // tRPC mutations
  const geocodeMutation = trpc.geocode.useMutation();
  const getRoofDataMutation = trpc.getRoofData.useMutation();
  const submitLeadMutation = trpc.submitLead.useMutation();
  const requestManualQuoteMutation = trpc.requestManualQuote.useMutation();

  const handleAddressSelect = useCallback(async (address: string) => {
    setStep("analyzing");
    
    try {
      // Step 1: Geocode the address
      const geoResult = await geocodeMutation.mutateAsync({ address });
      const locationData: LocationData = {
        lat: geoResult.lat,
        lng: geoResult.lng,
        formattedAddress: geoResult.formattedAddress,
      };
      setLocation(locationData);

      // Step 2: Get roof data from Solar API
      const roofResult = await getRoofDataMutation.mutateAsync({
        lat: geoResult.lat,
        lng: geoResult.lng,
      });

      if (roofResult.solarApiAvailable && roofResult.roofData) {
        setRoofData(roofResult.roofData);
        // Show the lead capture modal
        setShowLeadModal(true);
        setStep("lead-capture");
      } else {
        // Solar API not available - show manual quote form
        setRoofData({
          totalRoofArea: 0,
          averagePitch: 0,
          eaveLength: 0,
          ridgeValleyLength: 0,
          satelliteImageUrl: roofResult.satelliteImageUrl,
          solarApiAvailable: false,
        });
        setStep("manual-quote");
      }
    } catch (error) {
      console.error("Error analyzing address:", error);
      toast.error("Failed to analyze address. Please try again.");
      setStep("address");
    }
  }, [geocodeMutation, getRoofDataMutation]);

  const handleLeadSubmit = useCallback(async (data: { name?: string; email?: string; phone?: string }) => {
    if (!location || !roofData) return;

    setCustomerInfo(data);
    setShowLeadModal(false);

    try {
      const result = await submitLeadMutation.mutateAsync({
        ...data,
        address: location.formattedAddress,
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        roofData,
      });

      setEstimate(result.estimate);

      // Send email via EmailJS
      try {
        await sendLeadEmail({
          customerName: data.name || "Website Visitor",
          customerPhone: data.phone || "Not provided",
          customerEmail: data.email || "Not provided",
          address: location.formattedAddress,
          area: roofData.totalRoofArea,
          pitch: roofData.averagePitch,
          eaveLength: roofData.eaveLength,
          valleyLength: roofData.ridgeValleyLength,
          price: result.estimate.pricing.better, // Send the "Better" tier price
        });
        console.log("Lead email sent successfully");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't block the user flow if email fails
      }

      setStep("results");
      toast.success("Your estimate is ready!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to generate estimate. Please try again.");
      setShowLeadModal(true);
    }
  }, [location, roofData, submitLeadMutation]);

  const handleManualQuoteSubmit = useCallback(async (data: { name?: string; email?: string; phone?: string }) => {
    if (!location) return;

    setCustomerInfo(data);

    try {
      await requestManualQuoteMutation.mutateAsync({
        ...data,
        address: location.formattedAddress,
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
      });

      // Send email via EmailJS for manual quote request
      try {
        await sendLeadEmail({
          customerName: data.name || "Website Visitor",
          customerPhone: data.phone || "Not provided",
          customerEmail: data.email || "Not provided",
          address: location.formattedAddress,
          area: 0,
          pitch: 0,
          eaveLength: 0,
          valleyLength: 0,
          price: 0,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      setStep("manual-submitted");
      toast.success("Your quote request has been submitted!");
    } catch (error) {
      console.error("Error requesting manual quote:", error);
      toast.error("Failed to submit request. Please try again.");
    }
  }, [location, requestManualQuoteMutation]);

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
                  isLoading={geocodeMutation.isPending || getRoofDataMutation.isPending}
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
        {step === "lead-capture" && roofData && (
          <LeadCaptureModal
            isOpen={showLeadModal}
            onClose={() => setShowLeadModal(false)}
            onSubmit={handleLeadSubmit}
            isLoading={submitLeadMutation.isPending}
            roofArea={roofData.totalRoofArea}
          />
        )}

        {/* Results Step */}
        {step === "results" && estimate && location && (
          <EstimateResults
            estimate={estimate}
            address={location.formattedAddress}
            onDownloadPDF={handleDownloadPDF}
            isGeneratingPDF={isGeneratingPDF}
          />
        )}

        {/* Manual Quote Step */}
        {step === "manual-quote" && location && roofData && (
          <ManualQuoteForm
            address={location.formattedAddress}
            satelliteImageUrl={roofData.satelliteImageUrl}
            onSubmit={handleManualQuoteSubmit}
            isLoading={requestManualQuoteMutation.isPending}
          />
        )}

        {/* Manual Quote Submitted */}
        {step === "manual-submitted" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Request Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for your interest! Our team will review your property and contact you 
              within 24 hours with a detailed quote.
            </p>
            <Button onClick={handleStartOver} className="mt-4">
              <ArrowRight className="mr-2 h-4 w-4" />
              Get Another Estimate
            </Button>
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
