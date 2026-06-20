"use client";

import { ChevronDown, Search } from "@/lib/lucide";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { listTimezoneOptions, resolveTimezoneLabel } from "@/lib/i18n/timezones";
import { cn } from "@/lib/utils";

type TimezoneSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TimezoneSelect({ id, value, onChange, className }: TimezoneSelectProps) {
  const { locale, t } = useI18n();
  const autoId = useId();
  const triggerId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const allOptions = useMemo(() => listTimezoneOptions(locale), [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      (option) =>
        option.value.toLowerCase().includes(q) ||
        option.city.toLowerCase().includes(q) ||
        option.label.toLowerCase().includes(q),
    );
  }, [allOptions, query]);

  const currentLabel = resolveTimezoneLabel(value, locale);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border-0 bg-neutral-50 px-3.5 text-left text-[13px] font-normal text-neutral-900 transition",
          open && "bg-white shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]",
        )}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-neutral-100 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-2">
              <Search className="size-4 shrink-0 text-neutral-400" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("profile.settings.timezone.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
                aria-label={t("profile.settings.timezone.searchPlaceholder")}
              />
            </div>
          </div>
          <ul className="max-h-72 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-neutral-500">{t("profile.settings.timezone.empty")}</li>
            ) : (
              filtered.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center px-3 py-2.5 text-left text-[13px] transition",
                        selected
                          ? "bg-[#B7F500]/14 font-semibold text-neutral-900 ring-1 ring-inset ring-[#B7F500]/20"
                          : "text-neutral-700 hover:bg-neutral-50",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
