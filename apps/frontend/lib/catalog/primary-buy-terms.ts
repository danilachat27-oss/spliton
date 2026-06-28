/**
 * Buy-page purchase terms from SSR catalog round + live orders preview.
 * availableUnits here = active primary round remainder — not market-overview release.unitsAvailablePrimary.
 */
import { PRIMARY_FEE_FALLBACK_PCT } from "@/lib/market/platform-fee-fallbacks";
import {
  effectiveMaxUnits,
  effectiveMinUnits,
  parsePositiveInt,
  parseUnitPrice,
  type PrimaryPurchaseQuote,
} from "@/lib/market/pricing-calculator";
import type { CatalogPrimaryRoundPublic } from "@/services/catalog.service";
import type { PrimaryOrderPreview, PrimaryRoundInfo } from "@/services/wallet.service";
import type { MarketOverviewRow } from "@/types/market-overview";

export type PrimaryBuyTerms = {
  unitPrice: number | null;
  availableUnits: number;
  minUnits: number;
  maxUnits: number;
  feePct: number;
  totalUnits: number | null;
  roundId: string | null;
  priceInvalid: boolean;
  source: "ssr" | "client";
};

function parseFeePct(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function availableFromRound(round: CatalogPrimaryRoundPublic | PrimaryRoundInfo | null | undefined): number {
  if (!round) return 0;
  return Math.max(0, Math.floor(Number.parseFloat(String(round.availableUnits)) || 0));
}

export function derivePrimaryBuyTermsFromSsr(
  row: MarketOverviewRow,
  primaryRound: CatalogPrimaryRoundPublic | null | undefined,
  options?: { mockFeePct?: number },
): PrimaryBuyTerms {
  const mockFee = options?.mockFeePct ?? PRIMARY_FEE_FALLBACK_PCT;
  const unitPrice =
    parseUnitPrice(primaryRound?.pricePerUnit) ?? parseUnitPrice(row.primaryUnitPriceUsdt);
  const availableUnits = primaryRound
    ? availableFromRound(primaryRound)
    : Math.max(0, Math.floor(row.availableUnits));
  const feePct = primaryRound
    ? parseFeePct(primaryRound.primaryPurchaseFeePct, mockFee)
    : mockFee;
  const totalUnits = primaryRound ? parsePositiveInt(primaryRound.totalUnits) : null;
  const minUnits = effectiveMinUnits(null);
  const maxUnits = effectiveMaxUnits(availableUnits, null);

  return {
    unitPrice,
    availableUnits,
    minUnits,
    maxUnits,
    feePct,
    totalUnits,
    roundId: primaryRound?.roundId ?? null,
    priceInvalid: unitPrice == null,
    source: "ssr",
  };
}

export function mergePrimaryBuyTermsFromClientRound(
  base: PrimaryBuyTerms,
  round: PrimaryRoundInfo,
): PrimaryBuyTerms {
  const unitPrice = parseUnitPrice(round.pricePerUnit) ?? base.unitPrice;
  const availableUnits = availableFromRound(round);
  const feePct = parseFeePct(round.primaryPurchaseFeePct, base.feePct);
  const maxCap =
    base.maxUnits > 0 && base.maxUnits < base.availableUnits ? base.maxUnits : null;
  const minUnits = effectiveMinUnits(base.minUnits > 1 ? base.minUnits : null, base.minUnits);
  const maxUnits = effectiveMaxUnits(availableUnits, maxCap);

  return {
    ...base,
    unitPrice,
    availableUnits,
    minUnits,
    maxUnits,
    feePct,
    roundId: round.roundId,
    priceInvalid: unitPrice == null,
    source: "client",
  };
}

export function mergePrimaryBuyTermsFromPreview(
  base: PrimaryBuyTerms,
  preview: PrimaryOrderPreview,
): PrimaryBuyTerms {
  const unitPrice = parseUnitPrice(preview.pricePerUnit) ?? base.unitPrice;
  const availableUnits = Math.max(0, Math.floor(Number.parseFloat(preview.availableUnits) || 0));
  const minFromPreview = preview.minPurchaseUnits
    ? parsePositiveInt(preview.minPurchaseUnits)
    : null;
  const maxFromPreview = preview.maxPurchaseUnits
    ? parsePositiveInt(preview.maxPurchaseUnits)
    : null;
  const minUnits = effectiveMinUnits(minFromPreview, base.minUnits);
  const maxUnits = effectiveMaxUnits(availableUnits, maxFromPreview);
  const feePct = parseFeePct(preview.feePct, base.feePct);

  return {
    ...base,
    unitPrice,
    availableUnits,
    minUnits,
    maxUnits,
    feePct,
    priceInvalid: unitPrice == null,
    source: "client",
  };
}

export function quoteFromPreview(preview: PrimaryOrderPreview): PrimaryPurchaseQuote | null {
  const gross = Number.parseFloat(preview.grossAmount);
  const fee = Number.parseFloat(preview.feeAmount);
  const total = Number.parseFloat(preview.totalPaid);
  if (!Number.isFinite(gross) || gross <= 0) return null;
  return {
    grossAmount: gross,
    feeAmount: Number.isFinite(fee) ? fee : 0,
    totalPaid: Number.isFinite(total) ? total : gross,
  };
}
