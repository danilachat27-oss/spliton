"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useI18n } from "@/components/providers/i18n-provider";
import { buildMockCatalogSuggestions } from "@/lib/catalog/catalog-mock-suggestions";
import { cn } from "@/lib/utils";
import type { CatalogSearchSuggestionItem } from "@/types/catalog/page";
import { fetchCatalogSearchSuggestions } from "@/services/catalog.service";

const DEBOUNCE_MS = 280;

export function CatalogSearchInput({
  value,
  onChange,
  onSelectSuggestion,
  liveMode = true,
  className,
  embedded = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (item: CatalogSearchSuggestionItem) => void;
  liveMode?: boolean;
  className?: string;
  /** Inline suggestions list (for modal / constrained layouts). */
  embedded?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogSearchSuggestionItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      if (!liveMode) {
        setItems(buildMockCatalogSuggestions(term, 8));
        setOpen(true);
        setLoading(false);
        return;
      }

      void fetchCatalogSearchSuggestions(term, 8)
        .then((res) => {
          setItems(res.items);
          setOpen(true);
        })
        .catch(() => setError(t("catalog.search.suggestionsError")))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, t, liveMode]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-zinc-600"
          strokeWidth={1.9}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setOpen(true);
          }}
          placeholder={t("catalog.search.placeholder")}
          className={cn(
            "h-11 w-full rounded-2xl py-2 pl-10 pr-10 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600",
            embedded
              ? "bg-white/[0.06] focus:ring-1 focus:ring-white/25"
              : "bg-black/30 focus:ring-1 focus:ring-white/20",
          )}
          autoComplete="off"
        />
        {loading ? (
          <SplitonLoader
            size="xxs"
            variant="light"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            label={t("common.loading")}
          />
        ) : null}
      </div>

      {open && value.trim().length >= 2 ? (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-white/10 shadow-2xl",
            embedded
              ? "mt-2 max-h-[min(320px,45vh)] bg-black/25 backdrop-blur-md"
              : "absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-[#0a0a0a]",
          )}
        >
          {error ? (
            <p className="px-4 py-3 text-sm text-rose-300">{error}</p>
          ) : items.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-zinc-500">{t("catalog.search.noResults")}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {items.map((item, index) => (
                <li key={`${item.type}-${item.value}-${index}`}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition hover:bg-white/[0.04]"
                    onClick={() => {
                      onSelectSuggestion(item);
                      setOpen(false);
                    }}
                  >
                    <span className="text-[13px] font-medium text-zinc-100">{item.label}</span>
                    {item.subtitle ? (
                      <span className="text-[11px] text-zinc-500">
                        {item.type === "release"
                          ? item.subtitle
                          : `${item.type}: ${item.subtitle}`}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
