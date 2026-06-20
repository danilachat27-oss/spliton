"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { CatalogSearchSuggestionItem } from "@/types/catalog/page";

import { CatalogSearchInput } from "./catalog-search-input";

export function CatalogSearchModal({
  open,
  onOpenChange,
  query,
  onQuery,
  onSelectSuggestion,
  liveMode = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQuery: (value: string) => void;
  onSelectSuggestion: (item: CatalogSearchSuggestionItem) => void;
  liveMode?: boolean;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-start justify-center px-4 pt-[min(14vh,6.5rem)] sm:pt-[min(18vh,9rem)]"
      role="dialog"
      aria-modal="true"
      aria-label={t("catalog.search.modalTitle")}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-md"
        aria-label={t("navigation.search.closeBackdrop")}
        onClick={close}
      />
      <div
        className={cn(
          "relative w-full max-w-[520px] overflow-hidden rounded-[28px]",
          "border border-white/20",
          "bg-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "backdrop-blur-2xl backdrop-saturate-150",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.18] via-white/[0.04] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-white/[0.06] blur-3xl"
        />
        <div className="relative p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold tracking-tight text-white/92">
              {t("catalog.search.modalTitle")}
            </p>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.1] hover:text-white/90"
              aria-label={t("navigation.search.close")}
              onClick={close}
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <CatalogSearchInput
            value={query}
            onChange={onQuery}
            onSelectSuggestion={(item) => {
              onSelectSuggestion(item);
              close();
            }}
            liveMode={liveMode}
            embedded
            autoFocus
          />
          <p className="mt-3 text-[11px] text-white/40">{t("catalog.search.modalHint")}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
