"use client";

import Link from "next/link";
import Image from "next/image";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import type { ReleaseDetailPageData, ReleaseDetailPayoutRow } from "@/types/analytics/release-detail";

import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";

import { DetailSection } from "./detail-section";
import { DetailEmptyState } from "./detail-empty-state";

function payoutRow(label: string, value: string, valueClassName?: string) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/6 py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="max-w-[min(100%,22rem)] text-[13px] leading-snug text-zinc-500">{label}</span>
      <span className={cn("shrink-0 text-right font-mono text-[13px] font-medium tabular-nums", valueClassName ?? "text-zinc-100")}>
        {value}
      </span>
    </li>
  );
}

function PayoutPeriodCard({ r }: { r: ReleaseDetailPayoutRow }) {
  return (
    <div className="rounded-xl bg-[#111111] px-4 py-4 ring-1 ring-white/6">
      <p className="font-mono text-sm font-semibold text-white">Отчётный период · {r.period}</p>
      <ul className="mt-3">
        {payoutRow("Выручка релиза (gross)", r.gross)}
        {payoutRow("Доля пула инвесторов от выручки", r.poolShare, "text-zinc-400")}
        {payoutRow("Сумма в distribution (период)", r.distribution)}
        {payoutRow("Выплата на один unit", r.perUnit, "text-[#B7F500]/95")}
        {payoutRow("Всего к держателям units", r.toHolders, "text-zinc-200")}
      </ul>
    </div>
  );
}

export function ReleaseDetailPayoutHistory({
  data,
  className,
  variant = "full",
  analyticsHref,
  sectionTitleClassName,
}: {
  data: ReleaseDetailPageData;
  className?: string;
  variant?: "full" | "teaser";
  /** Для `variant="teaser"` — ссылка на полную аналитику релиза. */
  analyticsHref?: string;
  /** Для `variant="teaser"` — класс заголовка секции (например компактный на странице лота). */
  sectionTitleClassName?: string;
}) {
  const { t, locale } = useI18n();

  if (variant === "full" && data.payoutHistory.length === 0) {
    return (
      <DetailSection
        className={cn(className)}
        eyebrow={t("analytics.detail.payouts.eyebrow")}
        title={t("analytics.detail.payouts.fullTitle")}
      >
        <div className="overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/6">
          <DetailEmptyState
            imageSrc={RELEASE_DETAIL_ANALYTICS_ICONS.payoutsEmpty}
            title={detailPageText(locale, "analytics.detail.payouts.emptyTitle")}
            body={detailPageText(locale, "analytics.detail.payouts.emptyBody")}
          />
        </div>
      </DetailSection>
    );
  }

  if (variant === "teaser") {
    const rows = data.payoutHistory.slice(0, 3);
    return (
      <DetailSection
        className={cn(className)}
        eyebrow="Payouts"
        title={t("analytics.detail.payouts.teaserTitle")}
        titleClassName={sectionTitleClassName}
        titleAside={
          analyticsHref ? (
            <Link
              href={analyticsHref}
              className="inline-flex h-10 shrink-0 items-center justify-center self-start rounded-full bg-white px-5 text-[13px] font-semibold text-black transition hover:opacity-90 sm:self-center"
            >
              Полная история выплат
            </Link>
          ) : null
        }
        description="Закрытый месяц: сначала валовая выручка релиза, затем доля, относимая к пулу инвесторов, удержания по distribution, выплата на один unit и итог к держателям. Начисления рассчитываются по владельцам долей на дату окончания периода. Не путать с лентой сделок по лоту (Tape выше)."
      >
        <div className="space-y-3">
          {rows.map((r) => (
            <PayoutPeriodCard key={r.period} r={r} />
          ))}
        </div>
      </DetailSection>
    );
  }

  return (
    <DetailSection
      className={cn(className)}
      eyebrow={t("analytics.detail.payouts.eyebrow")}
      title={t("analytics.detail.payouts.fullTitle")}
      description={t("analytics.detail.payouts.fullDescription")}
    >
      <div className="space-y-3 lg:hidden">
        {data.payoutHistory.map((r) => (
          <PayoutPeriodCard key={r.period} r={r} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/6 lg:block">
        <table className="w-full table-fixed border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-white/6 text-[10px] font-medium uppercase leading-tight tracking-wide text-zinc-500">
              <th className="w-[12%] px-3 py-3">Период</th>
              <th className="w-[17%] px-2 py-3">Выручка</th>
              <th className="w-[12%] px-2 py-3">Пул инв.</th>
              <th className="w-[17%] px-2 py-3">Distribution</th>
              <th className="w-[18%] px-2 py-3">На unit</th>
              <th className="px-2 py-3 pr-3 text-right">К держателям</th>
            </tr>
          </thead>
          <tbody>
            {data.payoutHistory.map((r) => (
              <tr key={r.period} className="border-t border-white/5 text-zinc-300 transition-colors hover:bg-white/4">
                <td className="wrap-break-word px-3 py-2.5 font-mono text-zinc-200">{r.period}</td>
                <td className="wrap-break-word px-2 py-2.5 font-mono text-white">{r.gross}</td>
                <td className="wrap-break-word px-2 py-2.5 font-mono text-zinc-400">{r.poolShare}</td>
                <td className="wrap-break-word px-2 py-2.5 font-mono text-white">{r.distribution}</td>
                <td className="wrap-break-word px-2 py-2.5 font-mono text-[#B7F500]/90">{r.perUnit}</td>
                <td className="wrap-break-word px-2 py-2.5 pr-3 text-right font-mono text-zinc-200">{r.toHolders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailSection>
  );
}
