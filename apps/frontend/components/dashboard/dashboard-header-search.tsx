"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock, Search, Trash2, X } from "@/lib/lucide";

import {
  HEADER_SEARCH_POPULAR_FALLBACK,
  type HeaderPopularQuery,
} from "@/constants/header-search-popular-fallback";
import { ROUTES, catalogBuyUnitsPath } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  useLocalizedSearchLinks,
  type LocalizedSearchLink,
} from "@/hooks/use-localized-search-links";
import {
  clearHeaderSearchHistory,
  getHeaderSearchHistory,
  pushHeaderSearchHistory,
  type HeaderSearchHistoryItem,
} from "@/lib/search/header-search-history";
import { fetchMarketOverviewTopReleases } from "@/services/market-overview.service";
import { cn } from "@/lib/utils";

const searchIconButtonClass =
  "flex size-9 shrink-0 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/8 hover:text-white";

const modalShellClass =
  "relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#2b2b2b] shadow-[0_24px_80px_rgba(0,0,0,0.55)]";

const listItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-white/90 transition hover:bg-white/[0.08]";

function matchesQuery(q: string, item: LocalizedSearchLink) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    item.title.toLowerCase().includes(s) ||
    item.hint.toLowerCase().includes(s) ||
    item.id.includes(s)
  );
}

function formatChangePct(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function mapTopReleasesToPopular(
  items: Array<{ id: string; symbol: string; title: string; artist: string; value: string }>,
): HeaderPopularQuery[] {
  return items.slice(0, 7).map((row, index) => {
    const rank = index + 1;
    const changePct = index % 3 === 0 ? 1.31 : index % 3 === 1 ? -0.72 : 0.18;
    return {
      id: row.id,
      rank,
      label: `${row.symbol}/USDT`,
      subtitle: row.title,
      href: catalogBuyUnitsPath(row.id),
      priceLabel: row.value.includes(".") ? row.value.replace(".", ",") : row.value,
      changePct,
      hot: rank <= 3,
    };
  });
}

function SearchDropdownPanel({
  q,
  setQ,
  open,
  onNavigate,
}: {
  q: string;
  setQ: (value: string) => void;
  open: boolean;
  onNavigate: (href: string, label?: string) => void;
}) {
  const { t } = useI18n();
  const searchLinks = useLocalizedSearchLinks();
  const [history, setHistory] = React.useState<HeaderSearchHistoryItem[]>([]);
  const [popular, setPopular] = React.useState<HeaderPopularQuery[]>(HEADER_SEARCH_POPULAR_FALLBACK);

  React.useEffect(() => {
    if (!open) return;
    setHistory(getHeaderSearchHistory());
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    void fetchMarketOverviewTopReleases({ limit: 7 })
      .then((res) => {
        if (res.items.length > 0) setPopular(mapTopReleasesToPopular(res.items));
      })
      .catch(() => setPopular(HEADER_SEARCH_POPULAR_FALLBACK));
  }, [open]);

  const filtered = React.useMemo(
    () => searchLinks.filter((item) => matchesQuery(q, item)),
    [q, searchLinks],
  );

  const hasQuery = q.trim().length > 0;

  return (
    <div
      className="max-h-[min(420px,55vh)] overflow-y-auto overscroll-contain px-2 pb-3 pt-1 [scrollbar-color:#555_transparent] [scrollbar-width:thin]"
      role="listbox"
      aria-label={t("navigation.search.title")}
    >
      {hasQuery ? (
        filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-white/45">{t("navigation.search.noResults")}</p>
        ) : (
          <ul className="py-1">
            {filtered.map((item) => {
              const Icon = item.Icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={listItemClass}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onNavigate(item.href, item.title)}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white/70">
                      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white/90">{item.title}</span>
                      <span className="block truncate text-xs text-white/45">{item.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <>
          <section className="px-2 py-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <h3 className="text-xs font-medium text-white/45">{t("navigation.search.historyTitle")}</h3>
              {history.length > 0 ? (
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/[0.08] hover:text-white/70"
                  aria-label={t("navigation.search.clearHistory")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    clearHeaderSearchHistory();
                    setHistory([]);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            {history.length === 0 ? (
              <p className="mt-1 px-1 text-xs text-white/35">{t("navigation.search.historyEmpty")}</p>
            ) : (
              <ul className="mt-1">
                {history.map((item) => (
                  <li key={`${item.query}-${item.at}`}>
                    <button
                      type="button"
                      className={listItemClass}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (item.href) {
                          onNavigate(item.href, item.query);
                          return;
                        }
                        setQ(item.query);
                      }}
                    >
                      <Clock className="size-4 shrink-0 text-white/40" aria-hidden />
                      <span className="truncate">{item.query}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-1 border-t border-white/[0.08] px-2 py-2">
            <h3 className="px-1 text-xs font-medium text-white/45">{t("navigation.search.popularTitle")}</h3>
            <ul className="mt-1">
              {popular.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={listItemClass}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onNavigate(item.href, item.label)}
                  >
                    <span
                      className={cn(
                        "w-3 shrink-0 text-center text-xs font-semibold tabular-nums",
                        item.rank <= 3 ? "text-amber-500/80" : "text-white/30",
                      )}
                    >
                      {item.rank}
                    </span>
                    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] text-[10px] font-bold text-white/60">
                      {item.coverUrl ? (
                        <Image src={item.coverUrl} alt="" width={24} height={24} className="size-full object-cover" unoptimized />
                      ) : (
                        item.label.slice(0, 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-sm font-medium text-white/90">
                        {item.label}
                        {item.hot ? <span aria-hidden>🔥</span> : null}
                      </span>
                      <span className="block truncate text-xs text-white/45">{item.subtitle}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {item.priceLabel !== "—" ? (
                        <span className="block font-mono text-xs text-white/80">{item.priceLabel}</span>
                      ) : null}
                      {item.changePct !== 0 ? (
                        <span
                          className={cn(
                            "block text-xs font-medium tabular-nums",
                            item.changePct > 0 ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {formatChangePct(item.changePct)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

export function DashboardHeaderSearchInline() {
  const { t } = useI18n();
  const router = useRouter();
  const searchLinks = useLocalizedSearchLinks();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  const openModal = React.useCallback(() => {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const navigate = React.useCallback(
    (href: string, label?: string) => {
      if (label?.trim()) pushHeaderSearchHistory({ query: label.trim(), href });
      router.push(href);
      setQ("");
      close();
    },
    [router, close],
  );

  const submitQuery = React.useCallback(() => {
    const query = q.trim();
    if (!query) return;
    const match = searchLinks.find((item) => matchesQuery(query, item));
    if (match) {
      navigate(match.href, query);
      return;
    }
    pushHeaderSearchHistory({ query });
    router.push(`${ROUTES.dashboardCatalog}?search=${encodeURIComponent(query)}`);
    setQ("");
    close();
  }, [q, searchLinks, navigate, router, close]);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const el = event.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      openModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModal]);

  return (
    <>
      <button
        type="button"
        className={cn(searchIconButtonClass, open && "bg-white/12 text-white")}
        aria-label={t("navigation.header.search")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openModal}
      >
        <Search className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[220] flex items-start justify-center px-4 pt-[min(18vh,8rem)] sm:pt-[min(20vh,10rem)]"
              role="dialog"
              aria-modal="true"
              aria-label={t("navigation.search.title")}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                aria-label={t("navigation.search.closeBackdrop")}
                onClick={close}
              />
              <div className={modalShellClass}>
                <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
                  <label htmlFor="dashboard-header-search" className="sr-only">
                    {t("navigation.search.queryLabel")}
                  </label>
                  <input
                    id="dashboard-header-search"
                    ref={inputRef}
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitQuery();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        close();
                      }
                    }}
                    placeholder={t("navigation.search.headerPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
                    autoComplete="off"
                    spellCheck={false}
                    role="combobox"
                    aria-expanded
                  />
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.08] hover:text-white/80"
                    aria-label={t("navigation.search.close")}
                    onClick={close}
                  >
                    <X className="size-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
                <SearchDropdownPanel q={q} setQ={setQ} open={open} onNavigate={navigate} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function DashboardHeaderSearchMobileTrigger({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={cn(searchIconButtonClass, open && "bg-white/12 text-white")}
      aria-label={t("navigation.header.search")}
      aria-expanded={open}
      onClick={onToggle}
    >
      <Search className="size-[18px]" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
