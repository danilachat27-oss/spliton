"use client";

import NextImage from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";
import { useMemo } from "react";

import { DashboardJourneyTimeline } from "@/components/dashboard/dashboard-journey-timeline";
import { DashboardMiniOrderBook } from "@/components/dashboard/dashboard-mini-order-book";
import { DashboardRegisterOrCabinetLink } from "@/components/dashboard/dashboard-register-or-cabinet-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export { DashboardValueGrid } from "@/components/dashboard/dashboard-value-grid";

const surface = "rounded-2xl bg-[#111111] ring-1 ring-white/[0.06]";

export function DashboardTrustStrip({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-white/8 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600",
        className,
      )}
    >
      <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="text-zinc-500">{t("dashboard.trustStrip.spliton")}</span>
        <span className="text-zinc-800" aria-hidden>
          ·
        </span>
        <span className="text-zinc-400">{t("dashboard.trustStrip.cabinet")}</span>
        <span className="text-zinc-800" aria-hidden>
          ·
        </span>
        <span className="text-zinc-500">{t("dashboard.trustStrip.usdt")}</span>
      </p>
    </div>
  );
}

export function DashboardUnifiedJourneyBlock({ className }: { className?: string }) {
  const { t } = useI18n();

  const journeySteps = useMemo(
    () => [
      { n: "1", title: t("dashboard.journey.step1.title"), text: t("dashboard.journey.step1.text") },
      { n: "2", title: t("dashboard.journey.step2.title"), text: t("dashboard.journey.step2.text") },
      { n: "3", title: t("dashboard.journey.step3.title"), text: t("dashboard.journey.step3.text") },
      { n: "4", title: t("dashboard.journey.step4.title"), text: t("dashboard.journey.step4.text") },
    ],
    [t],
  );

  return (
    <section
      className={cn("scroll-mt-[5.5rem] py-8 sm:scroll-mt-24 sm:py-10 md:py-14", className)}
      aria-labelledby="dash-unified-journey-heading"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#050505] px-4 py-7 sm:rounded-3xl sm:px-7 sm:py-9 md:px-8 md:py-11">
        <div className="relative">
          <div className="mx-auto flex min-h-0 max-w-4xl flex-col items-center justify-center text-center sm:min-h-[320px] md:min-h-[420px]">
            <div className="mb-4 flex items-center justify-center sm:mb-5">
              <NextImage
                src="/images/LOGO/mini-logo.png"
                alt="Spliton"
                width={260}
                height={56}
                className="h-9 w-auto max-w-[200px] object-contain sm:h-12 sm:max-w-[280px]"
                priority
              />
            </div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:text-xs sm:tracking-[0.18em]">
              {t("dashboard.journey.kicker")}
            </p>
            <h2
              id="dash-unified-journey-heading"
              className="mt-3 max-w-[920px] text-balance text-[1.65rem] font-semibold leading-[1.08] tracking-tight text-white sm:mt-4 sm:text-4xl md:text-5xl lg:text-[4.1rem] lg:leading-[1.02]"
            >
              {t("dashboard.journey.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400 sm:mt-4 sm:text-base">
              {t("dashboard.journey.subtitle")}
            </p>
            <Link
              href={ROUTES.dashboardSecondaryMarket}
              className="mt-5 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98] sm:mt-7 sm:w-auto sm:rounded-lg"
            >
              {t("dashboard.journey.ctaMarket")}
            </Link>
          </div>

          <div className="mt-8 sm:mt-10">
            <DashboardJourneyTimeline steps={journeySteps} />
          </div>

          <div className="relative mt-4 overflow-hidden rounded-2xl p-4 sm:p-6">
            <NextImage
              src="/images/partner-programtab=about/4.jpg"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1120px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/88 via-black/72 to-black/55" aria-hidden />
            <div className="relative grid gap-5 md:grid-cols-[1fr_0.95fr] md:items-center">
              <div>
                <h4 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-[2rem]">
                  {t("dashboard.journey.readyTitle")}
                </h4>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                  {t("dashboard.journey.readyText")}
                </p>
                <div className="mt-4 hidden flex-wrap gap-2.5 sm:mt-5 sm:flex">
                  <Link
                    href={ROUTES.dashboardCatalog}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    {t("dashboard.journey.toCatalog")}
                  </Link>
                  <DashboardRegisterOrCabinetLink
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/14"
                    guestLabel={t("dashboard.journey.register")}
                    authLabel={t("dashboard.journey.portfolio")}
                  />
                  <Link
                    href={ROUTES.support}
                    className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                  >
                    {t("dashboard.journey.support")}
                  </Link>
                </div>
              </div>

              <DashboardMiniOrderBook demo className="border-white/10 bg-black/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardMarketsRow({ className }: { className?: string }) {
  const { t } = useI18n();

  const marketTiles = useMemo(
    () =>
      [
        {
          key: "secondary",
          href: ROUTES.dashboardSecondaryMarket,
          imageSrc: "/images/Сервисы площадки/1.png",
        },
        {
          key: "analytics",
          href: ROUTES.analyticsReleases,
          imageSrc: "/images/Сервисы площадки/2.png",
        },
        {
          key: "news",
          href: ROUTES.news,
          imageSrc: "/images/Сервисы площадки/3.png",
        },
        {
          key: "fees",
          href: ROUTES.fees,
          imageSrc: "/images/Сервисы площадки/4.png",
        },
      ] as const,
    [],
  );

  return (
    <section
      className={cn("scroll-mt-[5.5rem] border-t border-white/8 py-8 sm:scroll-mt-24 sm:py-12 md:py-16", className)}
      aria-labelledby="dash-markets-heading"
    >
      <div className="sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="mx-auto max-w-[22rem] text-center sm:mx-0 sm:max-w-none sm:text-left">
          <h2
            id="dash-markets-heading"
            className="text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-xl md:text-2xl"
          >
            {t("dashboard.markets.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:hidden">
            {t("dashboard.markets.subtitleMobile")}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {marketTiles.map(({ key, href, imageSrc }) => {
          const title = t(`dashboard.markets.${key}.title`);
          const subtitle = t(`dashboard.markets.${key}.subtitle`);
          const description = t(`dashboard.markets.${key}.description`);
          const cta = t(`dashboard.markets.${key}.cta`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group transition active:scale-[0.99]",
                "flex min-h-[8.75rem] items-center gap-5 rounded-2xl border border-white/10 bg-black px-5 py-6 hover:border-white/14",
                "sm:min-h-0 sm:flex-col sm:items-center sm:rounded-2xl sm:border-0 sm:px-5 sm:py-8 sm:text-center md:min-h-[340px] md:px-6 md:py-10 lg:min-h-[380px]",
              )}
            >
              <div className="relative size-24 shrink-0 sm:mb-7 sm:size-32 md:mb-8 md:size-40">
                <NextImage src={imageSrc} alt="" fill className="object-contain" sizes="160px" unoptimized />
              </div>
              <div className="min-w-0 flex-1 text-left sm:flex-none sm:text-center">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-lg md:text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 sm:mt-2 sm:hidden">{description}</p>
                <p className="mt-1.5 hidden max-w-[220px] text-sm leading-relaxed text-zinc-500 sm:mx-auto sm:mt-2 sm:block">
                  {subtitle}
                </p>
              </div>
              <span className="hidden min-w-[120px] items-center justify-center rounded-full bg-[#111111] px-5 py-2 text-xs font-medium text-zinc-200 transition group-hover:bg-[#1a1a1a] group-hover:text-white sm:mt-auto sm:inline-flex">
                {cta}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardLandingCta({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "scroll-mt-[5.5rem] border-t border-white/8 py-10 sm:scroll-mt-24 sm:py-14 md:py-20",
        className,
      )}
      aria-labelledby="dash-cta-heading"
    >
      <div className={cn(surface, "relative overflow-hidden px-5 py-10 sm:px-10 sm:py-14 md:px-12 md:py-16")}>
        <NextImage
          src="/images/gotov/1.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/60" aria-hidden />
        <div className="relative max-w-2xl">
          <h2 id="dash-cta-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
            {t("dashboard.cta.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:mt-4 md:text-base">{t("dashboard.cta.text")}</p>
          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href={ROUTES.dashboardCatalog}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B7F500] px-6 text-sm font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98] sm:w-auto sm:rounded-lg"
            >
              {t("dashboard.journey.toCatalog")}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
            <DashboardRegisterOrCabinetLink
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-[#0a0a0a] px-6 text-sm font-semibold text-zinc-100 ring-1 ring-white/10 transition hover:bg-white/5 active:scale-[0.98] sm:w-auto sm:rounded-lg"
              guestLabel={t("dashboard.journey.register")}
              authLabel={t("dashboard.journey.portfolio")}
            />
            <Link
              href={ROUTES.support}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-transparent px-4 text-sm font-medium text-zinc-400 transition hover:text-zinc-200 sm:w-auto sm:rounded-lg"
            >
              {t("dashboard.journey.support")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
