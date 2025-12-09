import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, Calendar, Percent, CreditCard } from "lucide-react";

interface FinancingCalculatorProps {
  goodPrice: number;
  betterPrice: number;
  bestPrice: number;
}

interface FinancingTerm {
  months: number;
  apr: number;
  label: string;
}

const FINANCING_TERMS: FinancingTerm[] = [
  { months: 12, apr: 0, label: "12 months - 0% APR" },
  { months: 24, apr: 5.99, label: "24 months - 5.99% APR" },
  { months: 36, apr: 7.99, label: "36 months - 7.99% APR" },
  { months: 48, apr: 9.99, label: "48 months - 9.99% APR" },
  { months: 60, apr: 11.99, label: "60 months - 11.99% APR" },
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
  const [selectedTerm, setSelectedTerm] = useState<string>("24");
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");

  const term = FINANCING_TERMS.find(t => t.months.toString() === selectedTerm) || FINANCING_TERMS[1];
  
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
          Financing Calculator
        </CardTitle>
        <p className="text-sm text-gray-400">
          See how affordable your new roof can be with flexible payment options
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Term Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Select Financing Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {FINANCING_TERMS.map((t) => (
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
                  className={selectedTier === tier ? "bg-primary text-white" : "border-gray-600 text-gray-300"}
                >
                  {tier === "good" ? "House" : tier === "better" ? "Better" : "Best"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Payment Display */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 text-center border border-primary/20">
          <p className="text-gray-400 text-sm mb-1">Your Estimated Monthly Payment</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-bold text-primary">${Math.round(monthlyPayment).toLocaleString()}</span>
            <span className="text-gray-400">/month</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            for {tierLabels[selectedTier]} package over {term.months} months
          </p>
          {term.apr === 0 && (
            <Badge className="mt-3 bg-green-600 text-white">0% Interest - No Finance Charges!</Badge>
          )}
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-gray-400">Project Cost</p>
            <p className="text-lg font-semibold text-white">${selectedPrice.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-gray-400">Term Length</p>
            <p className="text-lg font-semibold text-white">{term.months} months</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <Percent className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-gray-400">APR</p>
            <p className="text-lg font-semibold text-white">{term.apr}%</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center">
            <CreditCard className="h-5 w-5 text-primary mx-auto mb-2" />
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
                  ? "bg-primary/20 border-2 border-primary" 
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
                  ? "bg-primary/20 border-2 border-primary" 
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedTier("better")}
            >
              <p className="text-xs text-gray-400 mb-1">Better</p>
              <p className="text-xl font-bold text-primary">${Math.round(allTierPayments.better)}</p>
              <p className="text-xs text-gray-500">/month</p>
              <Badge className="mt-1 text-xs bg-primary/20 text-primary border-primary/30">Popular</Badge>
            </div>
            <div 
              className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
                selectedTier === "best" 
                  ? "bg-primary/20 border-2 border-primary" 
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

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          * Financing subject to credit approval. Rates and terms may vary based on creditworthiness. 
          This calculator provides estimates only. Contact us for exact financing options.
        </p>
      </CardContent>
    </Card>
  );
}
