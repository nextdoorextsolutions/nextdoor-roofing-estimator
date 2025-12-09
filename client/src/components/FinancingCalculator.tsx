import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, Calendar, Percent, CreditCard, Home, Leaf, Shield, Zap } from "lucide-react";

interface FinancingCalculatorProps {
  goodPrice: number;
  betterPrice: number;
  bestPrice: number;
}

interface FinancingTerm {
  months: number;
  apr: number;
  label: string;
  type: "standard" | "pace";
}

// Renew Financial Standard Financing Options
const RENEW_STANDARD_TERMS: FinancingTerm[] = [
  { months: 12, apr: 0, label: "12 months - 0% APR", type: "standard" },
  { months: 24, apr: 0, label: "24 months - 0% APR", type: "standard" },
  { months: 60, apr: 4.99, label: "5 years - 4.99% APR", type: "standard" },
  { months: 84, apr: 4.99, label: "7 years - 4.99% APR", type: "standard" },
  { months: 120, apr: 6.99, label: "10 years - 6.99% APR", type: "standard" },
];

// PACE Program Options (Property Tax Based)
const PACE_TERMS: FinancingTerm[] = [
  { months: 120, apr: 5.99, label: "10 years - 5.99% Fixed", type: "pace" },
  { months: 180, apr: 6.99, label: "15 years - 6.99% Fixed", type: "pace" },
  { months: 240, apr: 7.49, label: "20 years - 7.49% Fixed", type: "pace" },
  { months: 300, apr: 7.99, label: "25 years - 7.99% Fixed", type: "pace" },
];

function calculateMonthlyPayment(principal: number, apr: number, months: number): number {
  if (apr === 0) {
    return principal / months;
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return payment;
}

function calculateTotalCost(monthlyPayment: number, months: number): number {
  return monthlyPayment * months;
}

export default function FinancingCalculator({ goodPrice, betterPrice, bestPrice }: FinancingCalculatorProps) {
  const [financingType, setFinancingType] = useState<"renew" | "pace">("renew");
  const [selectedTerm, setSelectedTerm] = useState<string>("24");
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");

  const terms = financingType === "renew" ? RENEW_STANDARD_TERMS : PACE_TERMS;
  const defaultTerm = financingType === "renew" ? "24" : "180";
  
  // Reset term when switching financing type
  const handleFinancingTypeChange = (type: "renew" | "pace") => {
    setFinancingType(type);
    setSelectedTerm(type === "renew" ? "24" : "180");
  };

  const term = terms.find(t => t.months.toString() === selectedTerm) || terms[0];
  
  const prices = {
    good: goodPrice,
    better: betterPrice,
    best: bestPrice,
  };

  const tierLabels = {
    good: "House Brand",
    better: "Better",
    best: "Best (Titan XT)",
  };

  const selectedPrice = prices[selectedTier];
  const monthlyPayment = calculateMonthlyPayment(selectedPrice, term.apr, term.months);
  const totalCost = calculateTotalCost(monthlyPayment, term.months);
  const totalInterest = totalCost - selectedPrice;

  // Calculate monthly payments for all tiers at selected term
  const allTierPayments = {
    good: calculateMonthlyPayment(goodPrice, term.apr, term.months),
    better: calculateMonthlyPayment(betterPrice, term.apr, term.months),
    best: calculateMonthlyPayment(bestPrice, term.apr, term.months),
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-primary/30 overflow-hidden">
      <CardHeader className="bg-primary/10 border-b border-primary/20">
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Financing Options
        </CardTitle>
        <p className="text-sm text-gray-400">
          Flexible payment plans through Renew Financial & PACE Programs
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Financing Type Tabs */}
        <Tabs value={financingType} onValueChange={(v) => handleFinancingTypeChange(v as "renew" | "pace")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="renew" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Renew Financial
            </TabsTrigger>
            <TabsTrigger value="pace" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Home className="h-4 w-4 mr-2" />
              PACE Program
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="renew" className="mt-4">
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Renew Financial</h4>
                  <p className="text-sm text-gray-400">
                    Traditional financing with 0% APR options available. Quick approval, no home equity required.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="border-primary/50 text-primary text-xs">0% APR Available</Badge>
                    <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs">No Prepayment Penalty</Badge>
                    <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs">Quick Approval</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pace" className="mt-4">
            <div className="bg-green-900/30 rounded-lg p-4 mb-4 border border-green-700/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">PACE Program (Property Assessed Clean Energy)</h4>
                  <p className="text-sm text-gray-400">
                    Finance up to $250,000 with repayment through your property taxes. No credit score minimum, transfers with property sale.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">Up to 25 Year Terms</Badge>
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">Tax Deductible Interest</Badge>
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">Transfers with Sale</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Term Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Select Financing Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.months} value={t.months.toString()}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Select Package</label>
            <div className="flex gap-2">
              {(["good", "better", "best"] as const).map((tier) => (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTier(tier)}
                  className={selectedTier === tier 
                    ? (financingType === "pace" ? "bg-green-600 text-white" : "bg-primary text-white") 
                    : "border-gray-600 text-gray-300"}
                >
                  {tier === "good" ? "House" : tier === "better" ? "Better" : "Best"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Payment Display */}
        <div className={`rounded-xl p-6 mb-6 text-center border ${
          financingType === "pace" 
            ? "bg-green-900/20 border-green-600/30" 
            : "bg-gray-800/50 border-primary/20"
        }`}>
          <p className="text-gray-400 text-sm mb-1">Your Estimated Monthly Payment</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-5xl font-bold ${financingType === "pace" ? "text-green-400" : "text-primary"}`}>
              ${Math.round(monthlyPayment).toLocaleString()}
            </span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            for {tierLabels[selectedTier]} package over {term.months / 12} years
          </p>
          {term.apr === 0 && (
            <Badge className="mt-3 bg-green-600 text-white">0% Interest - No Finance Charges!</Badge>
          )}
          {financingType === "pace" && (
            <p className="text-xs text-green-400 mt-2">
              <Home className="h-3 w-3 inline mr-1" />
              Paid through your property tax bill
            </p>
          )}
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <DollarSign className={`h-5 w-5 mx-auto mb-2 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            <p className="text-xs text-gray-400">Project Cost</p>
            <p className="text-lg font-semibold text-white">${selectedPrice.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <Calendar className={`h-5 w-5 mx-auto mb-2 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            <p className="text-xs text-gray-400">Term Length</p>
            <p className="text-lg font-semibold text-white">{term.months / 12} years</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <Percent className={`h-5 w-5 mx-auto mb-2 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            <p className="text-xs text-gray-400">Fixed APR</p>
            <p className="text-lg font-semibold text-white">{term.apr}%</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <CreditCard className={`h-5 w-5 mx-auto mb-2 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            <p className="text-xs text-gray-400">Total Cost</p>
            <p className="text-lg font-semibold text-white">${Math.round(totalCost).toLocaleString()}</p>
          </div>
        </div>

        {/* All Tiers Comparison */}
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-white font-medium mb-4 text-center">Monthly Payments by Package</h4>
          <div className="grid grid-cols-3 gap-3">
            <div 
              className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                selectedTier === "good" 
                  ? (financingType === "pace" ? "bg-green-600/20 border-2 border-green-500" : "bg-primary/20 border-2 border-primary")
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedTier("good")}
            >
              <p className="text-xs text-gray-400 mb-1">House Brand</p>
              <p className="text-xl font-bold text-white">${Math.round(allTierPayments.good)}</p>
              <p className="text-xs text-gray-500">/month</p>
            </div>
            <div 
              className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                selectedTier === "better" 
                  ? (financingType === "pace" ? "bg-green-600/20 border-2 border-green-500" : "bg-primary/20 border-2 border-primary")
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedTier("better")}
            >
              <p className="text-xs text-gray-400 mb-1">Better</p>
              <p className={`text-xl font-bold ${financingType === "pace" ? "text-green-400" : "text-primary"}`}>
                ${Math.round(allTierPayments.better)}
              </p>
              <p className="text-xs text-gray-500">/month</p>
              <Badge className={`mt-1 text-xs ${financingType === "pace" ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                Popular
              </Badge>
            </div>
            <div 
              className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                selectedTier === "best" 
                  ? (financingType === "pace" ? "bg-green-600/20 border-2 border-green-500" : "bg-primary/20 border-2 border-primary")
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedTier("best")}
            >
              <p className="text-xs text-gray-400 mb-1">Best (Titan XT)</p>
              <p className="text-xl font-bold text-amber-400">${Math.round(allTierPayments.best)}</p>
              <p className="text-xs text-gray-500">/month</p>
            </div>
          </div>
        </div>

        {/* PACE Benefits (only show for PACE) */}
        {financingType === "pace" && (
          <div className="mt-6 p-4 bg-green-900/20 rounded-lg border border-green-700/30">
            <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              PACE Program Benefits
            </h4>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                No credit score minimum required
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                100% financing - $0 down payment
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Interest may be tax deductible*
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Transfers to new owner if you sell
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Fixed rate for entire term
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                No prepayment penalties
              </li>
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          * Financing subject to credit approval. Rates and terms may vary based on creditworthiness and program availability. 
          PACE financing is repaid through property taxes. Consult a tax advisor regarding deductibility. 
          This calculator provides estimates only. Contact us for exact financing options.
        </p>
      </CardContent>
    </Card>
  );
}
