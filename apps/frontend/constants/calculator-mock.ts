/**
 * Illustrative coefficients for the standalone calculator (non-live).
 * Primary/secondary rates align with backend defaults — see platform-fee-fallbacks.
 */
import {
  PRIMARY_FEE_FALLBACK_RATE,
  SECONDARY_FEE_FALLBACK_RATE,
} from "@/lib/market/platform-fee-fallbacks";

export const CALCULATOR_MOCK = {
  buyPlatformFeeRate: PRIMARY_FEE_FALLBACK_RATE,
  secondaryMarketFeeRate: SECONDARY_FEE_FALLBACK_RATE,
  withdrawFeeMinUsdt: 1,
  withdrawFeeRate: 0.005,
  defaultPricePerUnitUsdt: 12.5,
  defaultTotalUnitsOutstanding: 1_000_000,
} as const;
