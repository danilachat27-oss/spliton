"use client";

import { Search } from "@/lib/lucide";
import { useMemo, useState } from "react";

import { PayoutHistoryTable } from "@/components/dashboard/assets/payout-history-table";
import type { PayoutHistoryRow } from "@/components/dashboard/assets/payouts-mock-data";
import { payoutHistory } from "@/components/dashboard/assets/payouts-mock-data";
import { usePayoutsHistoryPage } from "@/hooks/use-payouts-history-page";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { cn } from "@/lib/utils";

const ASSET = "USDT · TRC20";

const TYPE_FILTERS: Array<{ id: "all" | PayoutHistoryRow["type"]; label: string }> = [
  { id: "all", label: "Все" },
  { id: "accrual", label: "Начисление" },
  { id: "payout", label: "Выплата" },
  { id: "withdrawal", label: "Вывод" },
  { id: "adjustment", label: "Корр." },
];

function parseUsdt(amount: string): number {
  const cleaned = amount
    .replace(/USDT/gi, "")
    .replace(/\u00a0/g, "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatSigned(n: number) {
  const abs = Math.abs(n);
  const fmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return `${n >= 0 ? "+" : "−"}${fmt}`;
}

export function PayoutsHistoryPageContent() {
  const { t } = useI18n();
  const { live, rows: payoutHistoryRows, loading, error, reload } = usePayoutsHistoryPage({ pageSize: 200 });
  const sourceRows = live ? (payoutHistoryRows ?? []) : payoutHistory;

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sourceRows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (!q) return true;
      return (
        row.release.toLowerCase().includes(q) ||
        row.ledgerRef.toLowerCase().includes(q) ||
        row.date.includes(q) ||
        row.type.toLowerCase().includes(q)
      );
    });
  }, [query, typeFilter, sourceRows]);

  const stats = useMemo(() => {
    const rows = filtered;
    let inflow = 0;
    let outflow = 0;
    let net = 0;
    for (const r of rows) {
      const v = parseUsdt(r.amount);
      net += v;
      if (r.type === "withdrawal") outflow += Math.abs(v);
      else if (r.type === "adjustment") {
        if (v < 0) outflow += Math.abs(v);
        else inflow += v;
      } else {
        inflow += Math.max(0, v);
      }
    }
    return {
      count: rows.length,
      inflow,
      outflow,
      net,
    };
  }, [filtered]);

  const outFmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    stats.outflow,
  );

  const statCards: {
    label: string;
    value: string;
    mono?: boolean;
    tone?: string;
  }[] = [
    { label: "Операций в ленте", value: String(stats.count) },
    { label: "Входящие", value: `${formatSigned(stats.inflow)} USDT`, mono: true, tone: "text-blue-800" },
    { label: "Исходящие", value: `−${outFmt} USDT`, mono: true, tone: "text-neutral-700" },
    {
      label: "Чистый итог",
      value: `${formatSigned(stats.net)} USDT`,
      mono: true,
      tone: stats.net >= 0 ? "text-blue-800" : "text-neutral-600",
    },
  ];

  if (live && loading && !payoutHistoryRows) {
    return <p className="text-sm text-neutral-500">Загрузка истории операций…</p>;
  }

  if (live && error) {
    return (
      <ReadOnlySectionError
        sectionId="payouts-history"
        error={error}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">{ASSET}</p>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Лента операций</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-neutral-50 px-4 py-4 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{card.label}</p>
            <p
              className={cn(
                "mt-1.5 text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl",
                card.mono && "font-mono text-base sm:text-lg",
                card.tone,
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("payouts.history.searchPlaceholder")}
            className="h-11 w-full rounded-2xl bg-neutral-50 py-2 pr-3 pl-10 text-sm text-neutral-900 outline-none ring-0 transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-blue-600/15"
            aria-label={t("payouts.history.searchAria")}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Фильтр по типу операции">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                "rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors",
                typeFilter === f.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {sourceRows.length > 0 && filtered.length === 0 ? (
        <div className="rounded-3xl bg-white px-5 py-10 text-center sm:px-8">
          <p className="text-sm font-medium text-neutral-800">Ничего не найдено</p>
          <p className="mt-1 text-xs text-neutral-500">Сбросьте фильтры или измените запрос.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTypeFilter("all");
            }}
            className="mt-4 inline-flex h-9 items-center rounded-xl bg-neutral-100 px-4 text-xs font-semibold text-neutral-800 hover:bg-neutral-200/90"
          >
            Сбросить
          </button>
        </div>
      ) : (
        <PayoutHistoryTable rows={filtered} showCaption={false} />
      )}
    </div>
  );
}
