import { getPublicApiBaseUrl } from "@/lib/public-env";

export type PublicPlatformFees = {
  primaryPurchaseFeePct: string;
  secondaryMarketFeePct: string;
  withdrawalFeeFixedUsdt: string;
  withdrawalFeePct: string;
  depositFeePct: string;
  effectiveFrom: string | null;
  source: string;
  disclaimer: string;
};

export async function fetchPublicPlatformFees(): Promise<PublicPlatformFees> {
  const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/platform/fees`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Не удалось загрузить тарифы");
  }
  return res.json() as Promise<PublicPlatformFees>;
}

export function pctToRate(pct: string): number {
  const n = Number(pct);
  return Number.isFinite(n) ? n / 100 : 0;
}
