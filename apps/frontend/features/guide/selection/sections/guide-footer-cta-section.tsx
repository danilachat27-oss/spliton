"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import { GuideSectionShell } from "../ui/guide-section-shell";

export function GuideFooterCtaSection() {
  const { t } = useI18n();

  return (
    <GuideSectionShell id="cta" title={t("guide.cta.title")} subtitle={t("guide.cta.subtitle")} headerAlign="center">
      <div className="guide-panel mx-auto flex max-w-xl flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#B7F500] px-6 text-[13px] font-semibold text-black transition hover:bg-[#c4f570] active:scale-[0.98]"
          >
            {t("guide.cta.catalog")}
          </Link>
          <Link
            href={ROUTES.analyticsReleases}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-full px-6 text-[13px] font-semibold transition active:scale-[0.98]",
              "bg-white/10 text-white hover:bg-white/14",
            )}
          >
            {t("guide.cta.compare")}
          </Link>
        </div>
      </div>
    </GuideSectionShell>
  );
}
