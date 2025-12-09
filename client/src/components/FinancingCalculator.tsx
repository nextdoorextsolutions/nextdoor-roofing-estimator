import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  DollarSign,
  Calendar,
  Percent,
  CreditCard,
  Home,
  Leaf,
  Shield,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Building2,
  Award,
  Star,
  Crown,
  Timer,
  Banknote,
  PiggyBank,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";

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
  icon: React.ReactNode;
  highlight?: string;
}

// Renew Financial Standard Financing Options
const RENEW_STANDARD_TERMS: FinancingTerm[] = [
  { 
    months: 12, 
    apr: 0, 
    label: "12 months", 
    type: "standard",
    icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
    highlight: "0% APR"
  },
  { 
    months: 24, 
    apr: 0, 
    label: "24 months", 
    type: "standard",
    icon: <Star className="h-4 w-4 text-yellow-400" />,
    highlight: "0% APR"
  },
  { 
    months: 60, 
    apr: 4.99, 
    label: "5 years", 
    type: "standard",
    icon: <TrendingUp className="h-4 w-4 text-primary" />,
    highlight: "4.99%"
  },
  { 
    months: 84, 
    apr: 4.99, 
    label: "7 years", 
    type: "standard",
    icon: <Timer className="h-4 w-4 text-primary" />,
    highlight: "4.99%"
  },
  { 
    months: 120, 
    apr: 6.99, 
    label: "10 years", 
    type: "standard",
    icon: <Clock className="h-4 w-4 text-blue-400" />,
    highlight: "6.99%"
  },
];

// PACE Program Options (Property Tax Based) - Using factor-based calculations
// Factor = Annual Assessment / Project Cost, then divide by 12 for monthly
interface PaceTerm extends FinancingTerm {
  factor: number; // Annual assessment factor
}

const PACE_TERMS: PaceTerm[] = [
  { 
    months: 120, 
    apr: 7.49, 
    factor: 0.148,
    label: "10 years", 
    type: "pace",
    icon: <Leaf className="h-4 w-4 text-green-400" />,
    highlight: "~7.49%"
  },
  { 
    months: 180, 
    apr: 7.99, 
    factor: 0.120,
    label: "15 years", 
    type: "pace",
    icon: <Home className="h-4 w-4 text-green-400" />,
    highlight: "~7.99%"
  },
  { 
    months: 240, 
    apr: 8.49, 
    factor: 0.108,
    label: "20 years", 
    type: "pace",
    icon: <Building2 className="h-4 w-4 text-green-400" />,
    highlight: "~8.49%"
  },
  { 
    months: 300, 
    apr: 8.99, 
    factor: 0.103,
    label: "25 years", 
    type: "pace",
    icon: <Award className="h-4 w-4 text-green-400" />,
    highlight: "~8.99%"
  },
];

// Standard interest-based calculation for Renew Financial
function calculateMonthlyPayment(principal: number, apr: number, months: number): number {
  if (apr === 0) {
    return principal / months;
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return payment;
}

// Factor-based calculation for PACE program
// Annual Assessment = Project Cost × Factor, Monthly = Annual / 12
function calculatePaceMonthlyPayment(principal: number, factor: number): number {
  const annualAssessment = principal * factor;
  return annualAssessment / 12;
}

function calculateTotalCost(monthlyPayment: number, months: number): number {
  return monthlyPayment * months;
}

export default function FinancingCalculator({ goodPrice, betterPrice, bestPrice }: FinancingCalculatorProps) {
  const [financingType, setFinancingType] = useState<"renew" | "pace">("renew");
  const [selectedTerm, setSelectedTerm] = useState<string>("24");
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");

  const terms = financingType === "renew" ? RENEW_STANDARD_TERMS : PACE_TERMS;
  
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

  const tierConfig = {
    good: { 
      label: "House Brand", 
      icon: <Home className="h-4 w-4" />,
      color: "text-gray-300"
    },
    better: { 
      label: "Better", 
      icon: <Star className="h-4 w-4" />,
      color: "text-primary"
    },
    best: { 
      label: "Best (Titan XT)", 
      icon: <Crown className="h-4 w-4" />,
      color: "text-amber-400"
    },
  };

  const selectedPrice = prices[selectedTier];
  
  // Use factor-based calculation for PACE, standard calculation for Renew
  const isPace = financingType === "pace";
  const paceTerm = term as PaceTerm;
  
  const monthlyPayment = isPace && paceTerm.factor
    ? calculatePaceMonthlyPayment(selectedPrice, paceTerm.factor)
    : calculateMonthlyPayment(selectedPrice, term.apr, term.months);
  
  const totalCost = calculateTotalCost(monthlyPayment, term.months);
  const totalInterest = totalCost - selectedPrice;
  
  // Annual assessment for PACE display
  const annualAssessment = isPace && paceTerm.factor ? selectedPrice * paceTerm.factor : 0;

  // Calculate monthly payments for all tiers at selected term
  const allTierPayments = {
    good: isPace && paceTerm.factor
      ? calculatePaceMonthlyPayment(goodPrice, paceTerm.factor)
      : calculateMonthlyPayment(goodPrice, term.apr, term.months),
    better: isPace && paceTerm.factor
      ? calculatePaceMonthlyPayment(betterPrice, paceTerm.factor)
      : calculateMonthlyPayment(betterPrice, term.apr, term.months),
    best: isPace && paceTerm.factor
      ? calculatePaceMonthlyPayment(bestPrice, paceTerm.factor)
      : calculateMonthlyPayment(bestPrice, term.apr, term.months),
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 h-14">
            <TabsTrigger 
              value="renew" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 h-12"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Renew Financial</div>
                  <div className="text-xs opacity-70">0% APR Available</div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="pace" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2 h-12"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
                  <Leaf className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">PACE Program</div>
                  <div className="text-xs opacity-70">Tax-Based</div>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="renew" className="mt-4">
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium flex items-center gap-2">
                    Renew Financial
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  </h4>
                  <p className="text-sm text-gray-400">
                    Traditional financing with 0% APR options available. Quick approval, no home equity required.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> 0% APR Available
                    </Badge>
                    <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs flex items-center gap-1">
                      <CircleDollarSign className="h-3 w-3" /> No Prepayment Penalty
                    </Badge>
                    <Badge variant="outline" className="border-gray-500 text-gray-300 text-xs flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Quick Approval
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pace" className="mt-4">
            <div className="bg-green-900/30 rounded-lg p-4 mb-4 border border-green-700/30">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600/30 to-green-600/10 flex items-center justify-center flex-shrink-0 border border-green-600/30">
                  <Leaf className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium flex items-center gap-2">
                    PACE Program
                    <Badge className="bg-green-600/20 text-green-400 text-xs border-green-500/30">Property Assessed</Badge>
                  </h4>
                  <p className="text-sm text-gray-400">
                    Finance up to $250,000 with repayment through your property taxes. No credit score minimum.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Up to 25 Years
                    </Badge>
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs flex items-center gap-1">
                      <PiggyBank className="h-3 w-3" /> Tax Deductible
                    </Badge>
                    <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs flex items-center gap-1">
                      <Home className="h-3 w-3" /> Transfers with Sale
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Term Selection - Visual Cards */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-3 block flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Select Financing Term
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {terms.map((t) => (
              <button
                key={t.months}
                onClick={() => setSelectedTerm(t.months.toString())}
                className={`p-3 rounded-lg border transition-all text-center ${
                  selectedTerm === t.months.toString()
                    ? financingType === "pace"
                      ? "bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      : "bg-primary/20 border-primary shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className="flex justify-center mb-1">
                  {t.icon}
                </div>
                <div className="text-white font-medium text-sm">{t.label}</div>
                <div className={`text-xs ${t.apr === 0 ? "text-yellow-400 font-semibold" : "text-gray-400"}`}>
                  {t.highlight}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Package Selection */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-3 block flex items-center gap-2">
            <Award className="h-4 w-4" />
            Select Package
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["good", "better", "best"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedTier === tier 
                    ? financingType === "pace"
                      ? "bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      : "bg-primary/20 border-primary shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                    : "bg-gray-800/50 border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className={`flex justify-center mb-2 ${tierConfig[tier].color}`}>
                  {tierConfig[tier].icon}
                </div>
                <div className="text-white font-medium text-sm">{tierConfig[tier].label}</div>
                <div className="text-xs text-gray-400">${prices[tier].toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Payment Display */}
        <div className={`rounded-xl p-6 mb-6 text-center border ${
          financingType === "pace" 
            ? "bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-600/30" 
            : "bg-gradient-to-br from-gray-800/80 to-gray-800/40 border-primary/20"
        }`}>
          <div className="flex justify-center mb-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              financingType === "pace" 
                ? "bg-green-600/20 border-2 border-green-500/50" 
                : "bg-primary/20 border-2 border-primary/50"
            }`}>
              <Banknote className={`h-8 w-8 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Your Estimated Monthly Payment</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-5xl font-bold ${financingType === "pace" ? "text-green-400" : "text-primary"}`}>
              ${Math.round(monthlyPayment).toLocaleString()}
            </span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
            {tierConfig[selectedTier].icon}
            {tierConfig[selectedTier].label} package over {term.months / 12} years
          </p>
          {term.apr === 0 && (
            <Badge className="mt-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white border-0 flex items-center gap-1 mx-auto w-fit">
              <Sparkles className="h-3 w-3" /> 0% Interest - No Finance Charges!
            </Badge>
          )}
          {financingType === "pace" && (
            <div className="mt-3">
              <p className="text-sm text-green-400 font-medium">
                Annual Assessment: ${Math.round(annualAssessment).toLocaleString()}/year
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Home className="h-3 w-3" />
                Paid through your property tax bill
              </p>
            </div>
          )}
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
              financingType === "pace" ? "bg-green-600/20" : "bg-primary/20"
            }`}>
              <DollarSign className={`h-5 w-5 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
            <p className="text-xs text-gray-400">Project Cost</p>
            <p className="text-lg font-semibold text-white">${selectedPrice.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
              financingType === "pace" ? "bg-green-600/20" : "bg-primary/20"
            }`}>
              <Calendar className={`h-5 w-5 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
            <p className="text-xs text-gray-400">Term Length</p>
            <p className="text-lg font-semibold text-white">{term.months / 12} years</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
              term.apr === 0 ? "bg-yellow-500/20" : financingType === "pace" ? "bg-green-600/20" : "bg-primary/20"
            }`}>
              <Percent className={`h-5 w-5 ${term.apr === 0 ? "text-yellow-400" : financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
            <p className="text-xs text-gray-400">Fixed APR</p>
            <p className={`text-lg font-semibold ${term.apr === 0 ? "text-yellow-400" : "text-white"}`}>{term.apr}%</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
              financingType === "pace" ? "bg-green-600/20" : "bg-primary/20"
            }`}>
              <CreditCard className={`h-5 w-5 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
            <p className="text-xs text-gray-400">Total Cost</p>
            <p className="text-lg font-semibold text-white">${Math.round(totalCost).toLocaleString()}</p>
          </div>
        </div>

        {/* All Tiers Comparison */}
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-white font-medium mb-4 text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Payments by Package
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {(["good", "better", "best"] as const).map((tier) => (
              <div 
                key={tier}
                className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                  selectedTier === tier 
                    ? (financingType === "pace" ? "bg-green-600/20 border-2 border-green-500" : "bg-primary/20 border-2 border-primary")
                    : "bg-gray-800/50 border border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <div className={`flex justify-center mb-2 ${tierConfig[tier].color}`}>
                  {tierConfig[tier].icon}
                </div>
                <p className="text-xs text-gray-400 mb-1">{tierConfig[tier].label}</p>
                <p className={`text-xl font-bold ${
                  tier === "best" ? "text-amber-400" : 
                  tier === "better" ? (financingType === "pace" ? "text-green-400" : "text-primary") : 
                  "text-white"
                }`}>
                  ${Math.round(allTierPayments[tier])}
                </p>
                <p className="text-xs text-gray-500">/month</p>
                {tier === "better" && (
                  <Badge className={`mt-1 text-xs ${financingType === "pace" ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                    <Star className="h-3 w-3 mr-1" /> Popular
                  </Badge>
                )}
              </div>
            ))}
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
                <BadgeCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                No credit score minimum required
              </li>
              <li className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-green-400 flex-shrink-0" />
                100% financing - $0 down payment
              </li>
              <li className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-green-400 flex-shrink-0" />
                Interest may be tax deductible*
              </li>
              <li className="flex items-center gap-2">
                <Home className="h-4 w-4 text-green-400 flex-shrink-0" />
                Transfers to new owner if you sell
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
                Fixed rate for entire term
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400 flex-shrink-0" />
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
