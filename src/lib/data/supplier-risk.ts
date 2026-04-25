// ─────────────────────────────────────────────────────────────────────────────
// Supplier risk scoring
//
// Pure functions. Take a SupplierOffer + the user's baseline and return a
// risk score (0 = safe, 100 = avoid) with itemized warnings.
//
// Rules:
//   - variable rate          = high risk
//   - teaser intro rate      = warning + high risk if savings only during intro
//   - monthly fee            = warning
//   - early termination fee  = warning
//   - unclear contract term  = high risk
//   - projected savings below threshold = "not recommended"
//   - renewable plan with premium must show premium clearly
// ─────────────────────────────────────────────────────────────────────────────

import type { SupplierOffer } from "./supplier-offers";
import { PEPCO_STANDARD_OFFER_RATE } from "./supplier-offers";

export type WarningSeverity = "info" | "warning" | "high";

export interface Warning {
  severity: WarningSeverity;
  message: string;
}

export interface RiskAssessment {
  /** Numeric score 0-100. Higher = riskier. */
  score: number;
  /** "safe" | "watch" | "avoid" — derived from score. */
  band: "safe" | "watch" | "avoid";
  warnings: Warning[];
  /** Estimated annual savings (positive) or cost (negative) vs the baseline. */
  estimatedAnnualSavings: number;
  /** Annual cost difference if the user only saw the intro rate. */
  introOnlyAnnualSavings: number | null;
  /** Whether we recommend reviewing this offer. */
  recommended: boolean;
}

/**
 * Score a supplier offer against the user's baseline annual usage and the
 * baseline rate they'd otherwise pay (utility standard offer).
 */
export function assessOffer(
  offer: SupplierOffer,
  annualKwh: number,
  baselineRate: number = PEPCO_STANDARD_OFFER_RATE
): RiskAssessment {
  const warnings: Warning[] = [];
  let score = 0;

  // Variable / teaser detection
  if (offer.rateType === "variable") {
    score += 50;
    warnings.push({
      severity: "high",
      message:
        "Variable rate — your bill can spike at any time. Maryland PSC complaints are dominated by variable-rate switching surprises.",
    });
  }
  if (offer.rateType === "intro_then_variable") {
    score += 35;
    warnings.push({
      severity: "high",
      message: `Teaser intro rate ($${offer.introRate?.toFixed(4)}/kWh for ${offer.introMonths ?? "?"} months), then converts to a variable rate. Most savings disappear after the intro window.`,
    });
  }

  // Monthly fee
  if (offer.monthlyFee > 0) {
    score += 15;
    warnings.push({
      severity: "warning",
      message: `$${offer.monthlyFee.toFixed(2)}/month recurring fee on top of usage. Adds $${(offer.monthlyFee * 12).toFixed(0)}/year regardless of how little electricity you use.`,
    });
  }

  // Early termination fee
  if (offer.earlyTerminationFee > 0) {
    score += 10;
    warnings.push({
      severity: "warning",
      message: `$${offer.earlyTerminationFee} early termination fee — you can't switch back without paying this if rates change.`,
    });
  }

  // Unclear contract term (month-to-month with variable rate)
  if (offer.termMonths === 0 && offer.rateType === "variable") {
    score += 15;
    warnings.push({
      severity: "high",
      message: "Month-to-month variable rate gives the supplier total pricing flexibility — your savings can vanish next billing cycle.",
    });
  }

  // Compute annual savings vs baseline
  const supplyOnlyDelta = (baselineRate - offer.rate) * annualKwh;
  const annualFees = offer.monthlyFee * 12;
  const estimatedAnnualSavings = supplyOnlyDelta - annualFees;

  // Intro-only savings (if applicable)
  let introOnlyAnnualSavings: number | null = null;
  if (offer.rateType === "intro_then_variable" && offer.introRate && offer.introMonths) {
    const introMonths = offer.introMonths;
    const variableMonths = 12 - introMonths;
    const introSavings =
      (baselineRate - offer.introRate) * (annualKwh / 12) * introMonths;
    const variableSavings =
      (baselineRate - offer.rate) * (annualKwh / 12) * variableMonths;
    introOnlyAnnualSavings = introSavings + variableSavings - annualFees;
  }

  // Renewable premium disclosure
  if (offer.renewablePercent > 0 && offer.rate > baselineRate * 1.05) {
    const premium = (offer.rate - baselineRate) * annualKwh;
    warnings.push({
      severity: "info",
      message: `Renewable content (${offer.renewablePercent}%) costs about $${premium.toFixed(0)}/year extra vs the utility standard offer. That premium is real money — make sure the renewable claim matters to you.`,
    });
  }

  // Recommendation: positive expected savings AND no high-severity flags
  const hasHighRisk = warnings.some((w) => w.severity === "high");
  const recommended = estimatedAnnualSavings > 50 && !hasHighRisk;

  if (estimatedAnnualSavings <= 0) {
    warnings.push({
      severity: "warning",
      message: `Projected to cost about $${Math.abs(estimatedAnnualSavings).toFixed(0)}/year MORE than your utility's standard offer at your usage level.`,
    });
  }

  // Cap score at 100, derive band
  score = Math.min(100, score);
  const band: RiskAssessment["band"] =
    score >= 50 ? "avoid" : score >= 20 ? "watch" : "safe";

  return {
    score,
    band,
    warnings,
    estimatedAnnualSavings,
    introOnlyAnnualSavings,
    recommended,
  };
}
