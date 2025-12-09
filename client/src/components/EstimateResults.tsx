import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Download, Home, Ruler, TrendingUp, AlertTriangle, Star } from "lucide-react";
import type { EstimateResult } from "../../../shared/roofing";
import { PRICING_TIERS } from "../../../shared/roofing";

interface EstimateResultsProps {
  estimate: EstimateResult;
  address: string;
  onDownloadPDF: () => void;
  isGeneratingPDF?: boolean;
}

export function EstimateResults({ estimate, address, onDownloadPDF, isGeneratingPDF }: EstimateResultsProps) {
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");

  const tierIcons = {
    good: <Check className="h-6 w-6" />,
    better: <Star className="h-6 w-6" />,
    best: <TrendingUp className="h-6 w-6" />,
  };

  const tierColors = {
    good: "border-gray-300 bg-gray-50",
    better: "border-primary bg-primary/5",
    best: "border-amber-400 bg-amber-50",
  };

  const tierBadgeColors = {
    good: "bg-gray-500",
    better: "bg-primary",
    best: "bg-amber-500",
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Your Roof Estimate</h2>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <Home className="h-4 w-4" />
          {address}
        </p>
      </div>

      {/* Satellite Image */}
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={estimate.roofData.satelliteImageUrl}
            alt="Satellite view of your roof"
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-sm">Satellite view of your property</p>
          </div>
        </div>
      </Card>

      {/* Roof Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">
            {estimate.roofData.totalRoofArea.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Roof Area (sq ft)</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">
            {estimate.adjustedArea.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">With 10% Waste</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">
            {estimate.roofData.averagePitch}/12
          </div>
          <div className="text-sm text-muted-foreground">Roof Pitch</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary">
            {Math.round(estimate.adjustedArea / 100)}
          </div>
          <div className="text-sm text-muted-foreground">Squares</div>
        </Card>
      </div>

      {/* Pitch Surcharge Notice */}
      {estimate.hasPitchSurcharge && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your roof has a steep pitch ({estimate.roofData.averagePitch}/12), which requires additional safety equipment and labor. A 10% pitch surcharge has been applied.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-4">
        {PRICING_TIERS.map((tier) => {
          const price = estimate.pricing[tier.name];
          const isSelected = selectedTier === tier.name;
          
          return (
            <Card
              key={tier.name}
              className={`cursor-pointer transition-all duration-200 ${
                tierColors[tier.name]
              } ${isSelected ? "ring-2 ring-primary shadow-lg scale-105" : "hover:shadow-md"}`}
              onClick={() => setSelectedTier(tier.name)}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <Badge className={`${tierBadgeColors[tier.name]} text-white`}>
                    {tier.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tier.description}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {tierIcons[tier.name]}
                </div>
                <div className="text-4xl font-bold text-foreground">
                  ${price.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${tier.pricePerSquare}/square
                </p>
                {isSelected && (
                  <div className="mt-3">
                    <Badge variant="outline" className="bg-primary text-primary-foreground">
                      Selected
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technical Details Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="technical-details">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Technical Details
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estimated Eave Length</CardTitle>
                  <CardDescription>Bottom edges of roof planes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {estimate.roofData.eaveLength.toLocaleString()} ft
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estimated Ridge/Valley Length</CardTitle>
                  <CardDescription>Shared edges between planes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {estimate.roofData.ridgeValleyLength.toLocaleString()} ft
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Calculation Breakdown</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Base Roof Area: {estimate.roofData.totalRoofArea.toLocaleString()} sq ft</li>
                <li>• Waste Factor: +10% ({Math.round(estimate.roofData.totalRoofArea * 0.1).toLocaleString()} sq ft)</li>
                <li>• Adjusted Area: {estimate.adjustedArea.toLocaleString()} sq ft</li>
                <li>• Number of Squares: {Math.round(estimate.adjustedArea / 100)}</li>
                {estimate.hasPitchSurcharge && (
                  <li>• Pitch Surcharge: +10% (pitch &gt; 6/12)</li>
                )}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Disclaimer */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> Estimates are based on satellite data and may vary. 
            Final price is subject to onsite inspection. Additional costs may apply for 
            tear-off, decking repairs, or complex roof features.
          </p>
        </CardContent>
      </Card>

      {/* Download PDF Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onDownloadPDF}
          disabled={isGeneratingPDF}
          className="h-14 px-8 text-lg font-semibold"
        >
          <Download className="mr-2 h-5 w-5" />
          {isGeneratingPDF ? "Generating PDF..." : "Download Proposal PDF"}
        </Button>
      </div>
    </div>
  );
}
