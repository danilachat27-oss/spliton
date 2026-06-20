"use client";

import Link from "next/link";
import { ArrowUpRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { MARKET_SEGMENT_SNAPSHOT } from "@/constants/market-overview/page";
import { ROUTES } from "@/constants/routes";
import { mapGenresToSegmentRows } from "@/lib/market-overview/market-overview-live-mappers";
import type { MarketOverviewStatsApi } from "@/services/market-overview.service";
import { cn } from "@/lib/utils";

function liquidityTextClass(liquidity: string) {
  const l = liquidity.trim();
  if (l === "Deep" || l === "Высокая") return "font-mono text-[11px] font-semibold tabular-nums text-[#B7F500]";
  if (l === "Mid" || l === "Средняя") return "font-mono text-[11px] font-semibold tabular-nums text-zinc-300";
  if (l === "—") return "font-mono text-[11px] font-semibold tabular-nums text-zinc-500";
  return "font-mono text-[11px] font-semibold tabular-nums text-fuchsia-400/90";
}

function stabilityTone(stability: string) {
  const t = stability.trim();
  if (t === "Высокая" || t === "High") return "text-emerald-300/95";
  if (t === "Средняя" || t === "Mid") return "text-zinc-200";
  if (t === "Переменная" || t === "Variable") return "text-amber-200/90";
  if (t === "—") return "text-zinc-500";
  return "text-zinc-300";
}

function demandTone(demand: string) {
  const d = demand.trim();
  if (d === "Пик" || d === "Peak" || d === "Рост" || d === "Growth") return "text-[#c4f570]";
  if (d === "Ниша" || d === "Niche") return "text-rose-300/90";
  return "text-zinc-200";
}

const STABILITY_KEYS: Record<string, string> = {
  Высокая: "high",
  High: "high",
  Средняя: "mid",
  Mid: "mid",
  Переменная: "variable",
  Variable: "variable",
};

const DEMAND_KEYS: Record<string, string> = {
  Пик: "peak",
  Peak: "peak",
  Рост: "growth",
  Growth: "growth",
  Стабильно: "stable",
  Stable: "stable",
  Умеренно: "moderate",
  Moderate: "moderate",
  Ниша: "niche",
  Niche: "niche",
};

const LIQUIDITY_KEYS: Record<string, string> = {
  Deep: "deep",
  Mid: "mid",
  Thin: "thin",
  Высокая: "deep",
  Средняя: "mid",
};

export function MarketOverviewSegments({
  live,
  stats,
}: {
  live?: boolean;
  stats?: MarketOverviewStatsApi | null;
}) {
  const { t } = useI18n();

  const rows =
    live && stats?.distributions?.genres?.length
      ? mapGenresToSegmentRows(stats.distributions.genres)
      : live
        ? []
        : [...MARKET_SEGMENT_SNAPSHOT];

  const translateStability = (value: string) => {
    const key = STABILITY_KEYS[value.trim()];
    return key ? t(`marketOverview.segments.stability.${key}`) : value;
  };

  const translateDemand = (value: string) => {
    const key = DEMAND_KEYS[value.trim()];
    return key ? t(`marketOverview.segments.demand.${key}`) : value;
  };

  const translateLiquidity = (value: string) => {
    const key = LIQUIDITY_KEYS[value.trim()];
    return key ? t(`marketOverview.segments.liquidity.${key}`) : value;
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            {t("marketOverview.segments.kicker")}
          </span>
          {!live ? (
            <span className="rounded-lg bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {t("marketOverview.segments.mockBadge")}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <h2 className="min-w-0 text-xl font-semibold tracking-tight text-white md:text-2xl">
            {t("marketOverview.segments.title")}
          </h2>
          <Link
            href={ROUTES.analyticsReleases}
            className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[12px] font-medium text-black transition-opacity hover:opacity-90"
          >
            {t("marketOverview.segments.openAnalytics")}
            <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          </Link>
        </div>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-zinc-500">
          {t("marketOverview.segments.descriptionBefore")}{" "}
          <span className="text-zinc-400">{t("marketOverview.segments.liquidity")}</span>,{" "}
          <span className="text-zinc-400">{t("marketOverview.segments.demand")}</span>,{" "}
          <span className="text-zinc-400">{t("marketOverview.segments.activity")}</span>
          {live ? t("marketOverview.segments.descriptionLive") : t("marketOverview.segments.descriptionDemo")}
          {t("marketOverview.segments.descriptionAfter")}{" "}
          <Link
            href={ROUTES.analyticsReleases}
            className="font-medium text-[#c4f570] underline decoration-[#B7F500]/35 underline-offset-2 transition-colors hover:text-[#d4ff66] hover:decoration-[#B7F500]/55"
          >
            {t("marketOverview.segments.analyticsLink")}
          </Link>
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-[#111111]">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr className="text-zinc-500">
              <th className="px-3 py-2.5 font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.genre")}</span>
              </th>
              <th className="px-3 py-2.5 text-right font-normal sm:px-4" title="Deep+">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.deepPlus")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.stability")}</span>
              </th>
              <th className="px-3 py-2.5 text-right font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.activity")}</span>
              </th>
              <th className="px-3 py-2.5 font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.demand")}</span>
              </th>
              <th className="px-3 py-2.5 text-right font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.liquidity")}</span>
              </th>
              <th className="px-3 py-2.5 text-right font-normal sm:px-4">
                <span className="text-[11px] uppercase tracking-wide">{t("marketOverview.segments.table.action")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t("marketOverview.segments.empty")}
                </td>
              </tr>
            ) : (
              rows.map((s) => {
                const analyticsHref = `${ROUTES.analyticsReleases}?segment=${encodeURIComponent(s.id)}`;
                return (
                  <tr key={s.id} className="text-zinc-300 transition-colors hover:bg-white/4">
                    <td className="px-3 py-2 align-middle sm:px-4">
                      <div className="min-w-0">
                        <Link
                          href={analyticsHref}
                          className="text-[13px] font-semibold text-white transition-colors hover:text-[#c4f570]"
                        >
                          {s.label}
                        </Link>
                        <div className="mt-1 font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                          {s.id.toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle text-right sm:px-4">
                      <span className="font-mono text-[12px] font-semibold tabular-nums text-[#B7F500]">
                        {s.deepPlusShare}
                      </span>
                    </td>
                    <td className={cn("px-3 py-2 align-middle text-[12px] sm:px-4", stabilityTone(s.stability))}>
                      {translateStability(s.stability)}
                    </td>
                    <td className="px-3 py-2 align-middle text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-200 sm:px-4">
                      {s.activity}
                    </td>
                    <td className={cn("px-3 py-2 align-middle text-[12px] sm:px-4", demandTone(s.demand))}>
                      {translateDemand(s.demand)}
                    </td>
                    <td className="px-3 py-2 align-middle text-right sm:px-4">
                      <span className={liquidityTextClass(s.liquidity)}>{translateLiquidity(s.liquidity)}</span>
                    </td>
                    <td className="px-3 py-2 align-middle text-right sm:px-4">
                      <Link
                        href={analyticsHref}
                        className="text-[12px] font-medium text-zinc-400 transition-colors hover:text-white hover:underline"
                      >
                        {t("marketOverview.segments.analytics")}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
