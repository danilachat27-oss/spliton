"use client";

import Link from "next/link";

import { ExchangeNeonSparkline } from "@/components/shared/charts/exchange-neon-sparkline";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { buildCatalogHeroSparklines, type CatalogHeroSparkline } from "@/lib/catalog/catalog-hero-sparklines";
import { formatNumber } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import type { CatalogStats } from "@/types/catalog/page";

function formatStatNumber(value: number | string | undefined, locale: AppLocale): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return "—";
  return formatNumber(n, locale);
}

function formatVolume(value: number | string | undefined, locale: AppLocale): string {
  const raw = formatStatNumber(value, locale);
  if (raw === "—") return raw;
  return `$${raw}`;
}

type KpiCard = {
  label: string;
  value: string;
  caption?: string;
  captionPositive?: boolean | null;
  sparkline: CatalogHeroSparkline;
};

export function CatalogPageHero({
  stats,
  statsUnavailable = false,
}: {
  stats: CatalogStats | null;
  statsUnavailable?: boolean;
}) {
  const { t, locale } = useI18n();

  const sparklines = stats ? buildCatalogHeroSparklines(stats) : null;

  const cards: KpiCard[] =
    stats && sparklines
      ? [
          {
            label: t("catalog.hero.stats.releases"),
            value: formatStatNumber(stats.publicReleases, locale),
            sparkline: sparklines.releases,
          },
          {
            label: t("catalog.hero.stats.volume"),
            value: formatVolume(stats.totalVolume24hUsdt, locale),
            caption: stats.totalVolume7dUsdt ? `7д ${formatVolume(stats.totalVolume7dUsdt, locale)}` : undefined,
            captionPositive: true,
            sparkline: sparklines.volume,
          },
          {
            label: t("catalog.hero.stats.listings"),
            value: formatStatNumber(stats.activeSecondaryListings, locale),
            caption: t("catalog.markets.onSecondary"),
            captionPositive: null,
            sparkline: sparklines.listings,
          },
        ]
      : [];

  return (
    <div className="border-b border-white/[0.06] bg-black px-4 pt-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-white">{t("catalog.markets.title")}</h1>
          <Link
            href={ROUTES.assetsUnt}
            className="shrink-0 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            {t("catalog.hero.cta.unt.title")}
          </Link>
        </div>

        {statsUnavailable ? (
          <p className="mt-3 text-sm text-zinc-500">{t("catalog.hero.statsUnavailable")}</p>
        ) : cards.length > 0 ? (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cards.map((card) => (
              <div
                key={card.label}
                className="min-w-[168px] shrink-0 rounded-xl bg-[#141414] px-4 py-3.5 ring-1 ring-white/[0.06]"
              >
                <p className="text-[11px] leading-snug text-zinc-500">{card.label}</p>
                <p className="mt-2 font-mono text-[22px] font-semibold leading-none tabular-nums tracking-tight text-white sm:text-2xl">
                  {card.value}
                </p>
                <div className="mt-3 h-9 w-full">
                  <ExchangeNeonSparkline
                    values={card.sparkline.values}
                    trend={card.sparkline.trend}
                    palette={card.sparkline.muted ? "muted" : "neon"}
                    width={140}
                    height={36}
                    fitContainer
                    detailSegments={card.sparkline.muted ? 1 : 3}
                    className="h-full w-full"
                  />
                </div>
                {card.caption ? (
                  <p
                    className={
                      card.captionPositive === true
                        ? "mt-1 font-mono text-[10px] tabular-nums text-[#B7F500]/90"
                        : "mt-1 text-[10px] text-zinc-600"
                    }
                  >
                    {card.caption}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[108px] min-w-[148px] animate-pulse rounded-xl bg-[#141414]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
