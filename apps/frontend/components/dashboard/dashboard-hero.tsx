"use client";

import Link from "next/link";

import { DashboardHeroJourneyPreview } from "@/components/dashboard/dashboard-hero-journey-preview";
import { DashboardHeroMacShowcase } from "@/components/dashboard/dashboard-hero-mac-showcase";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function DashboardHero({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <section
      id="deposit"
      className={cn(
        "scroll-mt-[5.5rem] relative z-1 w-full bg-black px-4 py-8 sm:scroll-mt-24 sm:px-0 sm:py-14 lg:py-16",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center text-center sm:px-0">
        <div className="w-full max-w-[1120px]">
          <h1 className="mx-auto mt-3 max-w-[920px] text-balance text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:mt-4 sm:text-[2.6rem] lg:text-[3.35rem]">
            {t("dashboard.hero.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-[700px] text-pretty text-[15px] leading-relaxed text-zinc-400 sm:mt-5 sm:text-[15px]">
            {t("dashboard.hero.subtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <Link
              href={ROUTES.dashboardCatalog}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] sm:h-10 sm:w-auto sm:rounded-lg sm:text-[13px]"
            >
              {t("dashboard.hero.ctaCatalog")}
            </Link>
            <Link
              href={ROUTES.dashboardOverview}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-800 px-5 text-[14px] font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.98] sm:h-10 sm:w-auto sm:rounded-lg sm:bg-zinc-700 sm:text-[13px] sm:hover:bg-zinc-600"
            >
              {t("dashboard.hero.ctaHowItWorks")}
            </Link>
          </div>

          <div className="relative mt-8 w-full sm:mt-12">
            {/* Мобилка: анимация на всю ширину без рамки MacBook */}
            <div className="relative -mx-4 w-[calc(100%+2rem)] sm:hidden">
              <div className="relative min-h-[min(72vh,680px)] w-full overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10">
                <DashboardHeroJourneyPreview layout="mobile" className="absolute inset-0 h-full w-full" />
              </div>
            </div>

            {/* Планшет и desktop: как было */}
            <div className="relative hidden w-full overflow-hidden rounded-2xl bg-black p-2 sm:block sm:rounded-3xl sm:p-3">
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-black sm:rounded-2xl">
                <DashboardHeroMacShowcase className="relative z-1 h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
