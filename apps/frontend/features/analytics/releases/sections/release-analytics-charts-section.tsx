"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { analyticsReleaseDetailPath } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type {
  ReleaseAnalyticsCompareApi,
  ReleaseAnalyticsFunnelApi,
  ReleaseAnalyticsGenresApi,
  ReleaseAnalyticsTimeseriesApi,
} from "@/services/release-analytics.service";

const shell = "rounded-2xl bg-[#101010] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.42)] md:p-5";

function EmptyChart({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={shell}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <p className="mt-3 font-sans text-sm text-zinc-400">Недостаточно данных для графика</p>
      <p className="mt-1 font-mono text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}

function VolumeBars({
  title,
  points,
  valueKey,
  countKey,
  hint,
}: {
  title: string;
  points: { date: string; volumeUsdt: string; ordersCount?: number; tradesCount?: number }[];
  valueKey: "volumeUsdt";
  countKey?: "ordersCount" | "tradesCount";
  hint: string;
}) {
  if (!points.length) return <EmptyChart title={title} hint={hint} />;
  const max = Math.max(...points.map((p) => Number.parseFloat(p.volumeUsdt) || 0), 1);
  return (
    <div className={shell}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <div className="mt-4 flex h-36 items-end gap-1">
        {points.slice(-24).map((p) => {
          const value = Number.parseFloat(p.volumeUsdt) || 0;
          const h = Math.max(4, Math.round((value / max) * 100));
          const count = countKey ? (p[countKey] ?? 0) : null;
          return (
            <div key={p.date} className="group flex min-w-0 flex-1 flex-col items-center gap-1" title={`${p.date}: ${value} USDT`}>
              <div className="w-full rounded-t bg-[#B7F500]/70" style={{ height: `${h}%` }} />
              {count != null ? (
                <span className="hidden text-[9px] text-zinc-600 group-hover:block">{count}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReleaseAnalyticsChartsSection({
  timeseries,
  compare,
  genres,
  funnel,
  loading,
  error,
}: {
  timeseries: ReleaseAnalyticsTimeseriesApi | null;
  compare: ReleaseAnalyticsCompareApi | null;
  genres: ReleaseAnalyticsGenresApi | null;
  funnel: ReleaseAnalyticsFunnelApi | null;
  loading?: boolean;
  error?: boolean;
}) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("mt-6", shell)}>
        <p className="text-sm text-zinc-400">Метрики временно недоступны. Попробуйте обновить страницу.</p>
      </div>
    );
  }

  const funnelSteps = funnel?.steps;
  const genreItems = genres?.items ?? [];

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <VolumeBars
          title="Primary volume"
          points={timeseries?.primaryVolume ?? []}
          valueKey="volumeUsdt"
          countKey="ordersCount"
          hint={t("analytics.releases.charts.hintPrimary")}
        />
        <VolumeBars
          title="Secondary volume"
          points={timeseries?.secondaryVolume ?? []}
          valueKey="volumeUsdt"
          countKey="tradesCount"
          hint={t("analytics.releases.charts.hintSecondary")}
        />
        <VolumeBars
          title="Payouts / accruals"
          points={(timeseries?.payouts ?? []).map((p) => ({
            date: p.date,
            volumeUsdt: p.payoutsUsdt,
          }))}
          valueKey="volumeUsdt"
          hint={t("analytics.releases.charts.hintPayouts")}
        />
        <div className={shell}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Release funnel
          </p>
          {!funnelSteps ? (
            <p className="mt-3 text-sm text-zinc-400">Недостаточно данных</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li className="flex justify-between gap-3"><span>Релизы</span><span>{funnelSteps.createdReleases}</span></li>
              <li className="flex justify-between gap-3"><span>Активные раунды</span><span>{funnelSteps.activeRounds}</span></li>
              <li className="flex justify-between gap-3"><span>UNT продано</span><span>{funnelSteps.soldUnits}</span></li>
              <li className="flex justify-between gap-3"><span>Холдеры</span><span>{funnelSteps.holders}</span></li>
              <li className="flex justify-between gap-3"><span>Релизы с выплатами</span><span>{funnelSteps.payoutsReleases}</span></li>
              <li className="flex justify-between gap-3"><span>Листинги</span><span>{funnelSteps.secondaryListings}</span></li>
              <li className="flex justify-between gap-3"><span>Сделки (период)</span><span>{funnelSteps.secondaryTrades}</span></li>
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={shell}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Сравнение релизов
          </p>
          {!compare?.items?.length ? (
            <p className="mt-3 text-sm text-zinc-400">Недостаточно данных для сравнения</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {compare.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={analyticsReleaseDetailPath(item.id)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 truncate text-sm text-zinc-200">{item.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-500">{item.secondaryVolumeUsdt} USDT</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={shell}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">По жанрам</p>
          {!genreItems.length ? (
            <p className="mt-3 text-sm text-zinc-400">Недостаточно данных по жанрам</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {genreItems.slice(0, 8).map((g) => (
                <li key={g.genre} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-300">{g.genre}</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {g.count} · {g.volumeUsdt} USDT
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
