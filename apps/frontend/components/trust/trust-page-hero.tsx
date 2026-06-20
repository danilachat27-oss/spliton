"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function TrustPageHero() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[inherit] flex-col items-center justify-center gap-3 px-1 py-10 pb-14 text-center sm:gap-5 sm:px-2 sm:py-12 sm:pb-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 sm:text-[11px] sm:tracking-[0.2em] [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
        {t("trust.hero.eyebrow")}
      </p>
      <h1 className="max-w-4xl text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-white min-[400px]:text-3xl sm:text-5xl lg:text-[3.25rem] [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]">
        {t("trust.hero.title")}
      </h1>
      <p className="max-w-2xl px-1 text-[13px] leading-relaxed text-white/90 sm:px-0 sm:text-base [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
        {t("trust.hero.subtitle")}
      </p>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-2.5 sm:mt-1 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
        <Link
          href={ROUTES.systemStatus}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 sm:w-auto"
        >
          {t("trust.hero.systemStatus")}
        </Link>
        <Link
          href={ROUTES.support}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
        >
          {t("trust.hero.support")}
        </Link>
      </div>
    </div>
  );
}
