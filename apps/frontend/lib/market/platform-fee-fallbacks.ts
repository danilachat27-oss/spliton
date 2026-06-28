/**
 * Demo/UI fallback fee rates when public platform fees API is unavailable.
 * Matches backend defaults: primary 2%, secondary 1%.
 */
export const PRIMARY_FEE_FALLBACK_PCT = 2;
export const SECONDARY_FEE_FALLBACK_PCT = 1;

export const PRIMARY_FEE_FALLBACK_RATE = PRIMARY_FEE_FALLBACK_PCT / 100;
export const SECONDARY_FEE_FALLBACK_RATE = SECONDARY_FEE_FALLBACK_PCT / 100;
