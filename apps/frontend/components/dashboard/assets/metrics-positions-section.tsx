"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { StyledSelect } from "@/components/ui/styled-select";
import { ROUTES, assetsSellUnitsPath } from "@/constants/routes";
import { formatNumber, formatUsdtAmount } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";
import type { PortfolioPositionApi } from "@/services/portfolio.service";

const STATUS_ALL = "__all__";

function PositionRow({
  row,
  raw,
  locale,
}: {
  row: PositionPreviewItem;
  raw?: PortfolioPositionApi;
  locale: Parameters<typeof formatNumber>[1];
}) {
  const { t } = useI18n();
  const marketPrice = raw?.currentPrice
    ? `${raw.currentPrice} USDT`
    : t("assets.metrics.noMarketPrice");

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50/80">
      <td className="px-3 py-3 align-top">
        <p className="font-medium text-neutral-900">{row.release}</p>
        <p className="text-xs text-neutral-500">
          {row.artist} · {raw?.symbol ?? "—"}
        </p>
      </td>
      <td className="px-3 py-3 align-top text-neutral-600">{row.genre}</td>
      <td className="px-3 py-3 align-top font-mono tabular-nums">{row.units}</td>
      <td className="px-3 py-3 align-top font-mono tabular-nums text-neutral-600">
        {raw?.unitsLocked ?? "—"}
      </td>
      <td className="px-3 py-3 align-top font-mono tabular-nums">{marketPrice}</td>
      <td className="px-3 py-3 align-top font-mono font-semibold tabular-nums">{row.value}</td>
      <td className="px-3 py-3 align-top font-mono tabular-nums text-neutral-600">
        {raw?.totalAccruedUsdt ? `${raw.totalAccruedUsdt} USDT` : "—"}
      </td>
      <td className="px-3 py-3 align-top font-mono tabular-nums text-neutral-600">
        {raw?.totalPaidUsdt ? `${raw.totalPaidUsdt} USDT` : "—"}
      </td>
      <td className="px-3 py-3 align-top font-mono tabular-nums">{row.share}</td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-wrap gap-1.5">
          {row.catalogReleaseId ? (
            <Link
              href={assetsSellUnitsPath(row.catalogReleaseId)}
              className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              {t("positions.widgets.sellUnt")}
            </Link>
          ) : null}
          <Link
            href={ROUTES.dashboardSecondaryMarket}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Secondary
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function MetricsPositionsSection({
  live = false,
  rows,
  rawItems,
  total = 0,
  loading = false,
  error = null,
  onQueryChange,
  onRetry,
}: {
  live?: boolean;
  rows?: PositionPreviewItem[] | null;
  rawItems?: PortfolioPositionApi[] | null;
  total?: number;
  loading?: boolean;
  error?: string | null;
  onQueryChange?: (query: {
    q: string;
    status: string;
    genre: string;
    sort: string;
    page: number;
  }) => void;
  onRetry?: () => void;
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(STATUS_ALL);
  const [genre, setGenre] = useState(STATUS_ALL);
  const [sort, setSort] = useState("value");
  const [page, setPage] = useState(1);

  const genres = useMemo(() => {
    const set = new Set((rawItems ?? []).map((r) => r.genre).filter(Boolean));
    return [STATUS_ALL, ...set];
  }, [rawItems]);

  const applyFilters = () => {
    onQueryChange?.({
      q,
      status: status === STATUS_ALL ? "" : status,
      genre: genre === STATUS_ALL ? "" : genre,
      sort,
      page,
    });
  };

  if (!live) return null;

  return (
    <section
      className="space-y-5 rounded-3xl bg-white px-5 py-6 sm:space-y-6 sm:px-7 sm:py-8"
      aria-label={t("assets.metrics.positionsTableAria")}
    >
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Metrics · Positions
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {t("assets.metrics.positionsTableTitle")}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("assets.metrics.searchPlaceholder")}
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-neutral-200 px-3 text-sm"
        />
        <StyledSelect
          value={status}
          options={[
            { value: STATUS_ALL, label: t("assets.metrics.toolbarFilterAll") },
            ...["Active", "Open round", "Secondary", "Closed"].map((s) => ({ value: s, label: s })),
          ]}
          onChange={setStatus}
          className="min-w-[160px]"
        />
        <StyledSelect
          value={genre}
          options={genres.map((g) => ({
            value: g,
            label: g === STATUS_ALL ? t("assets.metrics.filterAllGenres") : g,
          }))}
          onChange={setGenre}
          className="min-w-[160px]"
        />
        <StyledSelect
          value={sort}
          options={[
            { value: "value", label: t("positions.sort.value") },
            { value: "units", label: t("positions.sort.units") },
            { value: "date", label: t("positions.sort.date") },
            { value: "share", label: t("positions.sort.share") },
          ]}
          onChange={setSort}
          className="min-w-[160px]"
        />
        <button
          type="button"
          onClick={applyFilters}
          className="h-10 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white"
        >
          {t("actions.apply")}
        </button>
      </div>

      {loading && !rows ? (
        <div className="h-64 animate-pulse rounded-2xl bg-neutral-50 ring-1 ring-neutral-100" />
      ) : error ? (
        <ReadOnlySectionError
          sectionId="metrics-positions"
          error={error}
          onRetry={onRetry}
        />
      ) : !rows?.length ? (
        <EmptyState message={t("assets.metrics.afterFirstPurchase")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl ring-1 ring-neutral-100">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-neutral-50/90 text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-3">{t("positions.widgets.tableRelease")}</th>
                  <th className="px-3 py-3">{t("assets.metrics.colGenre")}</th>
                  <th className="px-3 py-3">{t("positions.widgets.tableUnits")}</th>
                  <th className="px-3 py-3">{t("assets.metrics.colLockedUnits")}</th>
                  <th className="px-3 py-3">{t("assets.metrics.colMarketPrice")}</th>
                  <th className="px-3 py-3">{t("positions.widgets.tableValue")}</th>
                  <th className="px-3 py-3">{t("assets.metrics.colAccrued")}</th>
                  <th className="px-3 py-3">{t("assets.metrics.colPaid")}</th>
                  <th className="px-3 py-3">{t("positions.widgets.tableShare")}</th>
                  <th className="px-3 py-3">{t("positions.widgets.tableAction")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <PositionRow
                    key={row.id}
                    row={row}
                    raw={rawItems?.find((item) => item.id === row.id)}
                    locale={locale}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>
              {t("assets.metrics.positionsCount")}: {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const next = Math.max(1, page - 1);
                  setPage(next);
                  onQueryChange?.({
                    q,
                    status: status === STATUS_ALL ? "" : status,
                    genre: genre === STATUS_ALL ? "" : genre,
                    sort,
                    page: next,
                  });
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5",
                  page <= 1 ? "opacity-40" : "hover:bg-neutral-50",
                )}
              >
                {t("actions.prev")}
              </button>
              <button
                type="button"
                disabled={rows.length < 20 || page * 20 >= total}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  onQueryChange?.({
                    q,
                    status: status === STATUS_ALL ? "" : status,
                    genre: genre === STATUS_ALL ? "" : genre,
                    sort,
                    page: next,
                  });
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5",
                  rows.length < 20 || page * 20 >= total ? "opacity-40" : "hover:bg-neutral-50",
                )}
              >
                {t("actions.next")}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
