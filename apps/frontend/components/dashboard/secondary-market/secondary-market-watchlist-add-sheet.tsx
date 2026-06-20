"use client";

import * as React from "react";
import { CheckCircle2, ChevronRight, Search } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { localizedApiError } from "@/lib/api/localized-error";
import { SecondaryMarketResponsiveSheet } from "@/components/dashboard/secondary-market/secondary-market-responsive-sheet";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import type { WatchlistAddCandidate } from "@/components/dashboard/secondary-market/secondary-market-watchlist.types";
import { cn } from "@/lib/utils";

function ReleaseThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-11 shrink-0 rounded-xl ring-1 ring-white/10"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: WatchlistAddCandidate[];
  onAdd: (releaseId: string, releaseUuid?: string) => Promise<void>;
};

export function SecondaryMarketWatchlistAddSheet({ open, onOpenChange, candidates, onAdd }: Props) {
  const { t, locale } = useI18n();
  const [search, setSearch] = React.useState("");
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const [addedId, setAddedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setAddingId(null);
      setAddedId(null);
      setError(null);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.track.toLowerCase().includes(q) ||
        c.artist.toLowerCase().includes(q),
    );
  }, [candidates, search]);

  const handleAdd = async (c: WatchlistAddCandidate) => {
    setError(null);
    setAddingId(c.releaseId);
    try {
      await onAdd(c.releaseId, c.releaseUuid);
      setAddedId(c.releaseId);
      window.setTimeout(() => setAddedId(null), 1600);
    } catch (e) {
      setError(localizedApiError(e, locale));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <SecondaryMarketResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("secondaryMarket.watchlist.addTitle")}
      description={t("secondaryMarket.watchlist.addDesc")}
      widthClassName="md:w-[min(100vw-1rem,440px)]"
    >
      <div className="space-y-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("secondaryMarket.watchlist.searchPlaceholder")}
            className={cn(smExchange.inputPill, "pl-10")}
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/25">{error}</p>
        ) : null}

        {candidates.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-white">{t("secondaryMarket.watchlist.allReleasesInList")}</p>
            <p className="mt-2 text-[13px] text-zinc-500">{t("secondaryMarket.watchlist.openMarketForNew")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{t("secondaryMarket.listings.noMatches")}</p>
        ) : (
          <ul className="max-h-[min(420px,52vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]">
            {filtered.map((c) => {
              const isAdding = addingId === c.releaseId;
              const isAdded = addedId === c.releaseId;
              return (
                <li key={c.releaseId}>
                  <button
                    type="button"
                    disabled={isAdding}
                    onClick={() => void handleAdd(c)}
                    className="flex w-full items-center gap-3 rounded-xl bg-[#111111] px-3 py-2.5 text-left ring-1 ring-white/6 transition hover:bg-[#161616] hover:ring-white/10 disabled:opacity-60"
                  >
                    <ReleaseThumb symbol={c.symbol} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white">{c.track}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        {c.artist} · {c.symbol} · {formatUsdt(c.pricePerUnit)} USDT
                      </p>
                    </div>
                    {isAdded ? (
                      <CheckCircle2 className="size-5 shrink-0 text-[#B7F500]" aria-hidden />
                    ) : isAdding ? (
                      <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-zinc-600" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SecondaryMarketResponsiveSheet>
  );
}
