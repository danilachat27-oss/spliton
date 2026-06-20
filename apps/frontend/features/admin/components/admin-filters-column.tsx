"use client";

import * as React from "react";
import { SlidersHorizontal } from "@/lib/lucide";

import { ADMIN_SECTION_NAV } from "@/features/admin/config/admin-nav";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import type { AdminTabId } from "@/features/admin/lib/admin-tabs";
import { cn } from "@/lib/utils";

function sectionLabel(tab: AdminTabId): string {
  return ADMIN_SECTION_NAV.find((s) => s.tab === tab)?.label ?? tab;
}

const PERIOD_OPTIONS = [
  { id: "7d", label: "7 дн." },
  { id: "30d", label: "30 дн." },
  { id: "90d", label: "90 дн." },
  { id: "all", label: "Всё" },
] as const;

const TAB_FILTER_HINT: Partial<Record<AdminTabId, string>> = {
  overview: "Срез KPI по выбранному периоду (подключение к API позже).",
  releases: "Раунды: статус сбора, поиск по треку и артисту.",
  investors: "Клиенты: статус учётной записи, диапазон баланса.",
  finances: "Депозиты и выводы: статус заявки, сумма.",
  payouts: "Начисления: период, релиз, статус выплаты.",
  market: "Вторичка: сторона сделки, релиз, диапазон цены.",
  audit: "События: тип, актор, интервал времени.",
};

type ChipProps = { active: boolean; children: React.ReactNode; onClick: () => void };

function FilterChip({ active, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-zinc-800/90 text-zinc-100"
          : "bg-zinc-950/50 text-zinc-500 hover:bg-zinc-950/80 hover:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Вторая колонка CRM: фильтры (пока локальное состояние, без query string).
 */
export function AdminFiltersColumn({ tab }: { tab: AdminTabId }) {
  const { t } = useAdminI18n();
  const [query, setQuery] = React.useState("");
  const [period, setPeriod] = React.useState<(typeof PERIOD_OPTIONS)[number]["id"]>("30d");
  const [statusScope, setStatusScope] = React.useState<"active" | "all">("all");

  const label = sectionLabel(tab);
  const hint = TAB_FILTER_HINT[tab];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-950/60 text-zinc-500">
            <SlidersHorizontal className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">Фильтры</h2>
            <p className="truncate text-[11px] text-zinc-500">Раздел: {label}</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
        <div>
          <label className="text-[11px] font-medium text-zinc-500" htmlFor="admin-filter-q">
            Поиск
          </label>
          <input
            id="admin-filter-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.filters.searchPlaceholder")}
            autoComplete="off"
            className={cn(
              "mt-1.5 h-9 w-full rounded-2xl bg-zinc-950/80 px-3 text-xs text-zinc-200",
              "placeholder:text-zinc-400 outline-none",
              "focus:bg-zinc-950",
            )}
          />
        </div>

        <div>
          <p className="text-[11px] font-medium text-zinc-500">Период</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((p) => (
              <FilterChip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>
                {p.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-zinc-500">Статус</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FilterChip active={statusScope === "active"} onClick={() => setStatusScope("active")}>
              Активные
            </FilterChip>
            <FilterChip active={statusScope === "all"} onClick={() => setStatusScope("all")}>
              Все
            </FilterChip>
          </div>
        </div>

        {hint ? (
          <p className="text-[11px] leading-relaxed text-zinc-400">{hint}</p>
        ) : null}

        <p className="mt-auto text-[11px] leading-relaxed text-zinc-400">
          Привязка к URL и API — следующий шаг.
        </p>
      </div>
    </div>
  );
}
