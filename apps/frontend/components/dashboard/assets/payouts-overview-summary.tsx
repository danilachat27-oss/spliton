"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { usePayoutsOverview } from "@/hooks/use-payouts-overview";
import { formatDate, formatUsdtAmount } from "@/lib/i18n/formatters";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

function formatUsdt(value: string, locale: Parameters<typeof formatUsdtAmount>[1]) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${formatUsdtAmount(n, locale)} USDT`;
}

export function PayoutsOverviewSummary() {
  const { t, locale } = useI18n();
  const { live, data, loading, error, reload } = usePayoutsOverview();

  if (!live) return null;

  if (loading && !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {error}
        <button type="button" className="ml-3 font-semibold underline" onClick={() => void reload()}>
          {t("actions.retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: t("payouts.kpi.totalAccrued"), value: formatUsdt(data.totalAccruedUsdt, locale) },
    { label: t("payouts.kpi.totalPaid"), value: formatUsdt(data.totalPaidUsdt, locale) },
    { label: t("payouts.kpi.pending"), value: formatUsdt(data.pendingPayoutUsdt, locale) },
    { label: t("payouts.kpi.available"), value: formatUsdt(data.availableBalance, locale) },
    { label: t("payouts.kpi.locked"), value: formatUsdt(data.lockedBalance, locale) },
  ];

  const hasAnyData =
    Number(data.totalAccruedUsdt) > 0 ||
    Number(data.totalPaidUsdt) > 0 ||
    Number(data.availableBalance) > 0;

  return (
    <div className="space-y-4">
      {!hasAnyData ? (
        <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {t("payouts.emptyAfterFirstPeriod")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-neutral-50 px-4 py-4 sm:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{card.label}</p>
            <p className={cn("mt-1.5 font-mono text-base font-semibold tracking-tight text-neutral-900 sm:text-lg")}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {data.latestPayout ? (
        <p className="text-xs text-neutral-500">
          {tf(t("payouts.kpi.latestPayout"), {
            date: formatDate(new Date(data.latestPayout.paidAt), locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            amount: formatUsdt(data.latestPayout.amountUsdt, locale),
            release: data.latestPayout.releaseTitle ?? "—",
          })}
        </p>
      ) : null}
    </div>
  );
}
