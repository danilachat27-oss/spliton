"use client";

import Image from "next/image";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

const SUMMARY_KEYS = ["units", "investorShare", "raiseTarget", "payoutModel"] as const;

export function ReleaseParametersHero() {
  const { t } = useI18n();

  return (
    <section id="rp-top" data-release-parameters-section>
      <div className="relative isolate min-h-[168px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 sm:min-h-[190px] md:min-h-[min(28vh,260px)]">
        <Image
          src="/images/catalogbuy/2.png"
          alt=""
          fill
          className="object-cover object-[center_35%] sm:object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1280px"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-b from-black/35 via-black/55 to-black/75"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[168px] flex-col items-center justify-center px-4 py-6 text-center sm:min-h-[190px] sm:px-5 sm:py-7 md:min-h-[min(28vh,260px)] md:px-7 md:py-8">
          <h1 className="max-w-3xl text-xl font-semibold leading-[1.15] tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.5)] sm:text-2xl md:text-3xl lg:text-[2rem]">
            {t("catalog.releaseParameters.hero.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-300/90 sm:text-sm md:mt-3 md:text-[15px]">
            {t("catalog.releaseParameters.hero.intro1")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-5">
            <Link
              href={ROUTES.dashboardCatalog}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-5 text-[13px] font-semibold text-black transition hover:bg-[#c4f570] active:scale-[0.98]"
            >
              {t("catalog.releaseParameters.hero.ctaCatalog")}
            </Link>
            <Link
              href={ROUTES.guideSelection}
              className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-5 text-[13px] font-semibold text-white transition hover:bg-white/14 active:scale-[0.98]"
            >
              {t("catalog.releaseParameters.hero.ctaGuide")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl text-center md:mt-8">
        <p className="text-sm leading-relaxed text-zinc-500">{t("catalog.releaseParameters.hero.intro2")}</p>
      </div>

      <div className="guide-panel mt-6 px-4 py-4 sm:mt-8 sm:px-5 sm:py-5">
        <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {t("catalog.releaseParameters.hero.summaryLabel")}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-zinc-500">
          {t("catalog.releaseParameters.hero.summarySubtitle")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARY_KEYS.map((slug, index) => (
            <div key={slug} className="rounded-lg bg-[#0a0a0a]/60 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold text-[#c4f570]">
                  {index + 1}
                </span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {t(`catalog.releaseParameters.hero.summary.${slug}.label`)}
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {t(`catalog.releaseParameters.hero.summary.${slug}.value`)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {t(`catalog.releaseParameters.hero.summary.${slug}.hint`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
