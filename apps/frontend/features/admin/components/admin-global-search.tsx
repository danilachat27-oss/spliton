"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { searchAdmin, type AdminSearchGroup } from "@/services/admin/adminSearch.service";
import { adminScrollbarHidden } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type Props = {
  className?: string;
};

export function AdminGlobalSearch({ className }: Props) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [groups, setGroups] = React.useState<AdminSearchGroup[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const shortcutLabel =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘ K" : "Ctrl K";

  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, groupTitle: g.title }))),
    [groups],
  );

  const close = React.useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openModal = React.useCallback(() => {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  React.useEffect(() => setMounted(true), []);

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
      if (!(event.metaKey || event.ctrlKey) || event.code !== "KeyK") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen((prev) => {
        if (prev) {
          setActiveIndex(-1);
          return false;
        }
        window.requestAnimationFrame(() => inputRef.current?.focus());
        return true;
      });
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  React.useEffect(() => {
    if (!open || query.trim().length < 2) {
      setGroups([]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      searchAdmin(query.trim(), client)
        .then((res) => {
          if (!cancelled) {
            setGroups(res.groups);
            setActiveIndex(-1);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, client, open]);

  function navigate(href: string) {
    close();
    setQuery("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      navigate(flatItems[activeIndex].href);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const showResults = query.trim().length >= 2;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={cn(
          "flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-zinc-900/40 px-3 text-left text-sm text-zinc-500 transition-colors",
          "hover:bg-zinc-900/70 hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/20",
          open && "bg-zinc-900/70 text-zinc-300",
          className,
        )}
        aria-label={a.portal.searchOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search className="size-4 shrink-0 text-zinc-400" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{a.portal.searchPlaceholder}</span>
        <kbd className="hidden rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
          {shortcutLabel}
        </kbd>
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-220 flex items-start justify-center px-4 pt-[min(16vh,7rem)] sm:items-center sm:px-6 sm:pt-0"
              role="dialog"
              aria-modal="true"
              aria-label={a.portal.searchModalTitle}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                aria-label={a.portal.searchCloseBackdrop}
                onClick={close}
              />

              <div className="relative flex max-h-[min(78vh,680px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#18181b] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <div className="flex items-center gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-5">
                  <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
                  <label htmlFor="admin-global-search-input" className="sr-only">
                    {a.portal.searchModalTitle}
                  </label>
                  <input
                    id="admin-global-search-input"
                    ref={inputRef}
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={a.portal.searchPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    role="combobox"
                    aria-expanded={showResults}
                    aria-controls="admin-search-results"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
                  />
                  {loading ? (
                    <SplitonLoader
                      size="xxs"
                      variant="light"
                      className="shrink-0"
                      label={a.portal.searchLoading}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={close}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
                    aria-label={a.portal.searchClose}
                  >
                    <X className="size-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>

                <div
                  id="admin-search-results"
                  role="listbox"
                  className={cn(
                    "min-h-[220px] flex-1 overflow-y-auto px-2 py-2 sm:px-3",
                    adminScrollbarHidden,
                  )}
                >
                  {!showResults ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      {a.portal.searchModalHint}
                    </p>
                  ) : error ? (
                    <p className="px-3 py-10 text-center text-sm text-red-400">
                      {a.portal.searchError}
                    </p>
                  ) : loading && groups.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      {a.portal.searchLoading}
                    </p>
                  ) : groups.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-zinc-500">
                      {a.portal.searchNoResults}
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.type} className="py-1">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          {group.title}
                        </p>
                        <ul>
                          {group.items.map((item) => {
                            const idx = flatItems.findIndex(
                              (f) => f.id === item.id && f.href === item.href,
                            );
                            return (
                              <li key={`${group.type}-${item.id}`}>
                                <Link
                                  href={item.href}
                                  role="option"
                                  aria-selected={idx === activeIndex}
                                  onClick={() => {
                                    close();
                                    setQuery("");
                                  }}
                                  className={cn(
                                    "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-zinc-800/80",
                                    idx === activeIndex && "bg-zinc-800/80",
                                  )}
                                >
                                  <span className="font-medium text-zinc-100">{item.title}</span>
                                  {item.subtitle ? (
                                    <span className="text-xs text-zinc-500">{item.subtitle}</span>
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
