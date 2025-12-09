import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AddressInput } from "@/components/AddressInput";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { EstimateResults } from "@/components/EstimateResults";
import { ManualQuoteForm } from "@/components/ManualQuoteForm";
import { generateProposalPDF } from "@/lib/generatePDF";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Home as HomeIcon, 
  Shield, 
  Clock, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  RotateCcw
} from "lucide-react";
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

    try {
      const result = await submitLeadMutation.mutateAsync({
        ...data,
        address: location.formattedAddress,
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        roofData,
      });

      setEstimate(result.estimate);
      setStep("results");
      toast.success("Your estimate is ready!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to generate estimate. Please try again.");
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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[oklch(0.15_0_0)] text-white">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <HomeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NextDoor Exteriors</h1>
                <p className="text-xs text-gray-400">Professional Roofing Solutions</p>
              </div>
            </div>
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
      </header>

      {/* Hero Section - Only show on address step */}
      {step === "address" && (
        <section className="relative bg-gradient-to-br from-[oklch(0.15_0_0)] via-[oklch(0.20_0_0)] to-[oklch(0.25_0.05_180)] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDE0di0yaDIyek0zNiAyNnYySDE0di0yaDIyek0zNiAyMnYySDE0di0yaDIyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
          <div className="container relative py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Get Your Instant
                <span className="text-primary block mt-2">Roof Estimate</span>
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

        {/* Lead Capture Step */}
        {step === "lead-capture" && roofData && (
          <div className="space-y-8">
            {/* Preview of roof data */}
            <div className="max-w-md mx-auto">
              <Card className="mb-6 overflow-hidden">
                <img
                  src={roofData.satelliteImageUrl}
                  alt="Your roof"
                  className="w-full h-48 object-cover"
                />
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Roof Analysis Complete!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We found {roofData.totalRoofArea.toLocaleString()} sq ft of roof area. 
                    Enter your info below to see your personalized estimate.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <LeadCaptureForm
              onSubmit={handleLeadSubmit}
              isLoading={submitLeadMutation.isPending}
            />
          </div>
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

      {/* Features Section - Only show on address step */}
      {step === "address" && (
        <section className="bg-muted/50 py-16">
          <div className="container">
            <h3 className="text-2xl font-bold text-center mb-10">Why Choose NextDoor Exteriors?</h3>
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

      {/* Footer */}
      <footer className="bg-[oklch(0.15_0_0)] text-white py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HomeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold">NextDoor Exteriors</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} NextDoor Exteriors. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
