import { isLiveServicesEnabled, resolveApiUrl } from "@/lib/public-env";

export type CalculatorReleaseOption = {
  id: string;
  slug: string;
  title: string;
  pricePerUnitUsdt: string;
  availableUnits: string;
  totalUnits: string;
  minPurchaseUnits: string | null;
  maxPurchaseUnits: string | null;
};

export type CalculatorConfig = {
  fees: {
    primaryPurchaseFeePct: string;
    secondaryMarketFeePct: string;
    withdrawalFeeFixedUsdt: string;
    withdrawalFeePct: string;
    depositFeePct: string;
    effectiveFrom: string | null;
    source: string;
  };
  limits: {
    minWithdrawalUsdt: string;
    minDepositUsdt: string;
    disclaimer: string;
  };
  releases: CalculatorReleaseOption[];
  updatedAt: string;
};

export type CalculatorPreviewResult = Record<string, string | undefined> & {
  disclaimer?: string;
};

export async function fetchCalculatorConfig(): Promise<CalculatorConfig> {
  const res = await fetch(resolveApiUrl("/api/v1/services/calculator/config"), {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Calculator config error: ${res.status}`);
  }
  return res.json() as Promise<CalculatorConfig>;
}

export async function previewCalculator(
  body: Record<string, string | undefined>,
): Promise<CalculatorPreviewResult> {
  const res = await fetch(resolveApiUrl("/api/v1/services/calculator/preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? `Calculator preview error: ${res.status}`);
  }
  return res.json() as Promise<CalculatorPreviewResult>;
}

export function isCalculatorLiveEnabled(): boolean {
  return isLiveServicesEnabled();
}
