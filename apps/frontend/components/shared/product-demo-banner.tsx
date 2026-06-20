"use client";

import { useI18n } from "@/components/providers/i18n-provider";

type ProductDemoBannerProps = {
  /** i18n key; defaults to common.demoBanner */
  messageKey?: string;
  className?: string;
};

export function ProductDemoBanner({
  messageKey = "common.demoBanner",
  className,
}: ProductDemoBannerProps) {
  const { t } = useI18n();
  return (
    <p
      className={
        className ??
        "rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-600"
      }
      role="status"
    >
      {t(messageKey)}
    </p>
  );
}
