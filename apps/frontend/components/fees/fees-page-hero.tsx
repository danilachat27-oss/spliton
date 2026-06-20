"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function FeesPageHero() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 pb-6 text-center sm:min-h-[240px] sm:pb-8 lg:min-h-[260px] lg:pb-10">
      <p className="text-xs font-medium text-white/70">
        {t("fees.breadcrumb.learnMore")} <span className="mx-1 text-white/40">›</span> {t("fees.breadcrumb.current")}
      </p>
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-[56px]">
        {t("fees.hero.title")}
      </h1>
      <p className="max-w-2xl text-sm text-white/80 sm:text-base">{t("fees.hero.subtitle")}</p>
    </div>
  );
}
