import crypto from "crypto";
import { PricingMethod } from "@prisma/client";

/**
 * Server-side pricing engine.
 *
 * Per Section 7 (Pricing Management) and the security principle established
 * for this project: rates are NEVER trusted from the client. Callers send
 * only { serviceId, quantity }; this module looks up the active
 * PricingRuleSetVersion and computes the price here.
 *
 * Supported methods (Section 7): Fixed, BHK, Room, Sq.ft, Visit, Unit,
 * Station, Contract, Tiered.
 *
 * For most methods, "quantity" means:
 *  - FIXED / CONTRACT: ignored, price = rate
 *  - BHK / ROOM / VISIT / UNIT / STATION: count (e.g. 3 rooms)
 *  - SQFT / TIERED: area in sq.ft
 */

export interface Tier {
  upTo: number | null; // null = no upper bound (last tier)
  rate: number;
}

export interface PricingRuleLike {
  method: PricingMethod;
  rate: number;
  minimumCharge: number;
  tiersJson?: string | null;
}

export function calculateLinePrice(rule: PricingRuleLike, quantity: number): number {
  let raw: number;

  switch (rule.method) {
    case "FIXED":
    case "CONTRACT":
      raw = rule.rate;
      break;

    case "BHK":
    case "ROOM":
    case "VISIT":
    case "UNIT":
    case "STATION":
      raw = rule.rate * Math.max(quantity, 0);
      break;

    case "SQFT":
      raw = rule.rate * Math.max(quantity, 0);
      break;

    case "TIERED": {
      const tiers: Tier[] = rule.tiersJson ? JSON.parse(rule.tiersJson) : [];
      raw = calculateTieredPrice(tiers, Math.max(quantity, 0));
      break;
    }

    default:
      throw new Error(`Unsupported pricing method: ${rule.method}`);
  }

  // Section 7: "Minimum charge is enforced when calculated price is below
  // the configured minimum."
  return Math.max(raw, rule.minimumCharge ?? 0);
}

/**
 * Tiered pricing: each tier applies its rate to the portion of quantity
 * that falls within that tier's band (progressive/marginal tiering).
 * Example tiers: [{upTo: 1000, rate: 8}, {upTo: 2000, rate: 6}, {upTo: null, rate: 5}]
 */
export function calculateTieredPrice(tiers: Tier[], quantity: number): number {
  if (!tiers.length) return 0;
  let remaining = quantity;
  let total = 0;
  let lowerBound = 0;

  for (const tier of tiers) {
    if (remaining <= 0) break;
    const bandSize = tier.upTo === null ? remaining : Math.max(tier.upTo - lowerBound, 0);
    const amountInBand = Math.min(remaining, bandSize);
    total += amountInBand * tier.rate;
    remaining -= amountInBand;
    lowerBound = tier.upTo ?? lowerBound;
  }

  return total;
}

export interface QuotationTotalsInput {
  lineTotals: number[];
  addOnAmounts: number[];
  surchargeAmounts: number[];
  discountAmount: number;
  taxRatePercent: number;
}

export interface QuotationTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

// GST calc per the original mockups: qty × rate + GST − discount, applied
// as: subtotal (services + add-ons + surcharges) -> discount -> tax on the
// discounted (taxable) amount -> total.
export function calculateQuotationTotals(input: QuotationTotalsInput): QuotationTotals {
  const servicesTotal = round2(input.lineTotals.reduce((a, b) => a + b, 0));
  const addOnsTotal = round2(input.addOnAmounts.reduce((a, b) => a + b, 0));
  const surchargesTotal = round2(input.surchargeAmounts.reduce((a, b) => a + b, 0));

  const subtotal = round2(servicesTotal + addOnsTotal + surchargesTotal);
  const discountAmount = round2(Math.min(input.discountAmount, subtotal));
  const taxableAmount = round2(subtotal - discountAmount);
  const taxAmount = round2((taxableAmount * input.taxRatePercent) / 100);
  const total = round2(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Sign the final totals with HMAC-SHA256 so tampering between calculation
 * and persistence can be detected. Secret must only ever live server-side.
 */
export function signTotals(totals: QuotationTotals, quotationNumber: string): string {
  const secret = process.env.PRICING_HMAC_SECRET;
  if (!secret) throw new Error("PRICING_HMAC_SECRET is not configured");
  const payload = `${quotationNumber}|${totals.subtotal}|${totals.discountAmount}|${totals.taxableAmount}|${totals.taxAmount}|${totals.total}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyTotalsSignature(
  totals: QuotationTotals,
  quotationNumber: string,
  signature: string
): boolean {
  const expected = signTotals(totals, quotationNumber);
  const actual = Buffer.from(signature || "", "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (actual.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actual);
}
