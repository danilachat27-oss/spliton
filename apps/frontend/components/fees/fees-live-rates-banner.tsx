"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { usePublicPlatformFees } from "@/hooks/use-public-platform-fees";

export function FeesLiveRatesBanner() {
  const { t } = useI18n();
  const { live, fees, loading, error } = usePublicPlatformFees();

  const text = useMemo(() => {
    if (!live) {
      return null;
    }
    if (loading) return t("fees.banner.loading");
    if (error) return error;
    if (!fees) return null;
    return t("fees.banner.liveSummary")
      .replace("{primary}", fees.primaryPurchaseFeePct)
      .replace("{secondary}", fees.secondaryMarketFeePct)
      .replace("{withdraw}", fees.withdrawalFeeFixedUsdt);
  }, [error, fees, live, loading, t]);

  if (!live) {
    return <ProductDemoBanner messageKey="fees.banner.demo" className="mb-4" />;
  }

  if (!text) return null;

  return (
    <p
      className={
        error
          ? "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          : "mb-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700"
      }
    >
      {text}
      {fees?.disclaimer ? ` ${fees.disclaimer}` : null}
    </p>
  );
}
