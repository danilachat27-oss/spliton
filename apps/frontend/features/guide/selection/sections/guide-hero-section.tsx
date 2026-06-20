"use client";

import Image from "next/image";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function GuideHeroSection() {
  const { t } = useI18n();

  return (
    <section id="guide-top" data-guide-section>
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
            {t("guide.hero.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-300/90 sm:text-sm md:mt-3 md:text-[15px]">
            {t("guide.hero.subtitle")}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-5">
            <Link
              href={ROUTES.dashboardCatalog}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-5 text-[13px] font-semibold text-black transition hover:bg-[#c4f570] active:scale-[0.98]"
            >
              {t("guide.hero.cta.catalog")}
            </Link>
            <Link
              href={ROUTES.analyticsReleases}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-semibold transition active:scale-[0.98]",
                "bg-white/10 text-white hover:bg-white/14",
              )}
            >
              {t("guide.hero.cta.compare")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
