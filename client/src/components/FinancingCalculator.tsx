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

import type { FinancingRates } from "@shared/roofing";

interface FinancingCalculatorProps {
  goodPrice: number;
  betterPrice: number;
  bestPrice: number;
  /**
   * Rates from the CRM's published pricing config (crm.getRoofData /
   * submitEstimatorLead). When absent — older backend, direct render — the
   * compiled fallbacks below apply, which mirror the CRM's own defaults.
   */
  financing?: FinancingRates;
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

// ─────────────────────────────────────────────────────────────────────────────
// PACE (RenewPACE) — repaid as an ANNUAL assessment on the property tax bill.
//
// This is real assessment math, not a marketing factor:
//
//   amountFinanced   = projectCost × (1 + PACE_PROGRAM_FEE_RATE)
//                      (PACE one-time program/district/recording fees are
//                       capitalized into the assessment, not paid out of pocket)
//   annualAssessment = amountFinanced × r ÷ (1 − (1+r)^−years)
//                      + PACE_ANNUAL_ADMIN_FEE
//   "monthly"        = annualAssessment ÷ 12 — a budgeting equivalent only.
//                      PACE bills ONCE A YEAR via property taxes (or through
//                      mortgage escrow); there are no 12 real payments.
//
// Annual amortization matters: an annual-payment loan at the same rate costs
// slightly more per year than 12 monthly payments, so borrowing the monthly
// formula here understates the tax bill. The previous implementation used
// hardcoded "factors" that silently implied ~0.3–0.5% higher rates than the
// APR shown beside them — the number on screen and the number charged must
// come from the same arithmetic.
//
// ── RATE SHEET — UPDATE THIS BLOCK ONLY ──────────────────────────────────────
// Renew quotes Florida PACE rates case-by-case; the live sheet is in the Renew
// dealer portal. Public ranges as of 2026-08: FL PACE ~6–9%, Renew historical
// 3.69–8.49%. The rates below are carried from the previous version (in-band)
// and the fees are typical FL PACE figures — CONFIRM against the dealer portal
// before quoting a homeowner.
const PACE_PROGRAM_FEE_RATE = 0.05; // one-time, capitalized into the assessment
const PACE_ANNUAL_ADMIN_FEE = 95; // $/yr assessment administration, each tax bill

const PACE_TERMS: FinancingTerm[] = [
  {
    months: 120,
    apr: 7.49,
    label: "10 years",
    type: "pace",
    icon: <Leaf className="h-4 w-4 text-green-400" />,
    highlight: "7.49%",
  },
  {
    months: 180,
    apr: 7.99,
    label: "15 years",
    type: "pace",
    icon: <Home className="h-4 w-4 text-green-400" />,
    highlight: "7.99%",
  },
  {
    months: 240,
    apr: 8.49,
    label: "20 years",
    type: "pace",
    icon: <Building2 className="h-4 w-4 text-green-400" />,
    highlight: "8.49%",
  },
  {
    months: 300,
    apr: 8.99,
    label: "25 years",
    type: "pace",
    icon: <Award className="h-4 w-4 text-green-400" />,
    highlight: "8.99%",
  },
];
// ─────────────────────────────────────────────────────────────────────────────

// Standard interest-based calculation for Renew Financial
function calculateMonthlyPayment(principal: number, apr: number, months: number): number {
  if (apr === 0) {
    return principal / months;
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return payment;
}

/** What PACE actually finances: project cost plus the capitalized one-time fees. */
function paceAmountFinanced(projectCost: number, feePct: number): number {
  return projectCost * (1 + feePct / 100);
}

/** The number that appears on the property tax bill each year. */
function paceAnnualAssessment(
  projectCost: number,
  apr: number,
  months: number,
  feePct: number,
  adminFee: number,
): number {
  const years = months / 12;
  const r = apr / 100;
  const base = (paceAmountFinanced(projectCost, feePct) * r) / (1 - Math.pow(1 + r, -years));
  return base + adminFee;
}

/** Monthly BUDGETING equivalent — PACE has no monthly payment. */
function paceMonthlyEquivalent(
  projectCost: number,
  apr: number,
  months: number,
  feePct: number,
  adminFee: number,
): number {
  return paceAnnualAssessment(projectCost, apr, months, feePct, adminFee) / 12;
}

// Icon pools for config-driven terms, in display order. Extra terms beyond the
// pool reuse the last icon rather than crashing on an index miss.
const STANDARD_TERM_ICONS = [
  <Sparkles className="h-4 w-4 text-yellow-400" />,
  <Star className="h-4 w-4 text-yellow-400" />,
  <TrendingUp className="h-4 w-4 text-primary" />,
  <Timer className="h-4 w-4 text-primary" />,
  <Clock className="h-4 w-4 text-blue-400" />,
];
const PACE_TERM_ICONS = [
  <Leaf className="h-4 w-4 text-green-400" />,
  <Home className="h-4 w-4 text-green-400" />,
  <Building2 className="h-4 w-4 text-green-400" />,
  <Award className="h-4 w-4 text-green-400" />,
];
const iconAt = (pool: React.ReactNode[], i: number) => pool[Math.min(i, pool.length - 1)];
const termLabelFor = (months: number) => (months < 36 ? `${months} months` : `${months / 12} years`);

export default function FinancingCalculator({ goodPrice, betterPrice, bestPrice, financing }: FinancingCalculatorProps) {
  const [financingType, setFinancingType] = useState<"renew" | "pace">("renew");
  const [selectedTerm, setSelectedTerm] = useState<string>("24");
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">("better");

  // Config-driven terms when the backend sent them; compiled fallbacks otherwise.
  const standardTerms: FinancingTerm[] = financing
    ? financing.standardTerms.map((t, i) => ({
        months: t.months,
        apr: t.apr,
        type: "standard" as const,
        label: termLabelFor(t.months),
        icon: iconAt(STANDARD_TERM_ICONS, i),
        highlight: t.apr === 0 ? "0% APR" : `${t.apr}%`,
      }))
    : RENEW_STANDARD_TERMS;
  const paceTerms: FinancingTerm[] = financing
    ? financing.pace.terms.map((t, i) => ({
        months: t.years * 12,
        apr: t.rate,
        type: "pace" as const,
        label: `${t.years} years`,
        icon: iconAt(PACE_TERM_ICONS, i),
        highlight: `${t.rate}%`,
      }))
    : PACE_TERMS;
  const paceFeePct = financing ? financing.pace.programFeePct : PACE_PROGRAM_FEE_RATE * 100;
  const paceAdminFee = financing ? financing.pace.annualAdminFee : PACE_ANNUAL_ADMIN_FEE;

  const terms = financingType === "renew" ? standardTerms : paceTerms;

  // Reset term when switching financing type; the preferred defaults (24 mo /
  // 15 yr) may not exist in a config-driven list, so fall back to what does.
  const handleFinancingTypeChange = (type: "renew" | "pace") => {
    setFinancingType(type);
    const list = type === "renew" ? standardTerms : paceTerms;
    const preferred = type === "renew" ? 24 : 180;
    const target = list.find((t) => t.months === preferred) ?? list[Math.min(1, list.length - 1)];
    setSelectedTerm(String(target.months));
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

  const isPace = financingType === "pace";

  const monthlyPayment = isPace
    ? paceMonthlyEquivalent(selectedPrice, term.apr, term.months, paceFeePct, paceAdminFee)
    : calculateMonthlyPayment(selectedPrice, term.apr, term.months);

  // PACE repays whole annual assessments; Renew repays real monthly payments.
  const annualAssessment = isPace
    ? paceAnnualAssessment(selectedPrice, term.apr, term.months, paceFeePct, paceAdminFee)
    : 0;
  const amountFinanced = isPace ? paceAmountFinanced(selectedPrice, paceFeePct) : selectedPrice;
  const totalCost = isPace
    ? annualAssessment * (term.months / 12)
    : monthlyPayment * term.months;

  // Calculate monthly payments for all tiers at selected term
  const allTierPayments = {
    good: isPace
      ? paceMonthlyEquivalent(goodPrice, term.apr, term.months, paceFeePct, paceAdminFee)
      : calculateMonthlyPayment(goodPrice, term.apr, term.months),
    better: isPace
      ? paceMonthlyEquivalent(betterPrice, term.apr, term.months, paceFeePct, paceAdminFee)
      : calculateMonthlyPayment(betterPrice, term.apr, term.months),
    best: isPace
      ? paceMonthlyEquivalent(bestPrice, term.apr, term.months, paceFeePct, paceAdminFee)
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
                      <PiggyBank className="h-3 w-3" /> Interest May Be Tax-Deductible
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
          <p className="text-gray-400 text-sm mb-1">
            {financingType === "pace" ? "Estimated Monthly Set-Aside" : "Your Estimated Monthly Payment"}
          </p>
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
                Billed once a year on your property tax bill (or via mortgage escrow) — not a monthly bill
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Amount financed: ${Math.round(amountFinanced).toLocaleString()} (project cost + one-time program fees)
                {" "}· includes ${paceAdminFee}/yr admin fee
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
            {/* PACE quotes an interest rate; the one-time fees financed on top
                mean the true APR is higher. Calling this "APR" would understate
                the cost of money — the fees are itemized above instead. */}
            <p className="text-xs text-gray-400">{isPace ? "Interest Rate" : "Fixed APR"}</p>
            <p className={`text-lg font-semibold ${term.apr === 0 ? "text-yellow-400" : "text-white"}`}>{term.apr}%</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4 text-center border border-gray-700/50">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
              financingType === "pace" ? "bg-green-600/20" : "bg-primary/20"
            }`}>
              <CreditCard className={`h-5 w-5 ${financingType === "pace" ? "text-green-400" : "text-primary"}`} />
            </div>
            <p className="text-xs text-gray-400">{isPace ? "Total Repaid" : "Total Cost"}</p>
            <p className="text-lg font-semibold text-white">${Math.round(totalCost).toLocaleString()}</p>
          </div>
        </div>

        {/* All Tiers Comparison */}
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-white font-medium mb-4 text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isPace ? "Monthly Set-Aside by Package" : "Monthly Payments by Package"}
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
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            <span className="text-yellow-500 font-medium">Important:</span> These are estimates only. Final financing terms, rates, and payments are subject to the financing provider's approval and may vary based on creditworthiness, property eligibility, and program availability. PACE financing is repaid as an annual assessment on your property tax bill (or through mortgage escrow), includes one-time program fees financed into the assessment, and your first assessment may also include interest capitalized between funding and your first tax bill. PACE estimates here exclude that first-year capitalized interest. Interest deductibility should be verified with a qualified tax advisor. Contact us or the financing provider directly for exact terms and to begin the application process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
