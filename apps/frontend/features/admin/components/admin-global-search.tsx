"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { searchAdmin, type AdminSearchGroup } from "@/services/admin/adminSearch.service";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type Props = {
  className?: string;
};

export function AdminGlobalSearch({ className }: Props) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [groups, setGroups] = React.useState<AdminSearchGroup[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, groupTitle: g.title }))),
    [groups],
  );

  React.useEffect(() => {
    if (query.trim().length < 2) {
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
  }, [query, client]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      navigate(flatItems[activeIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative min-w-0 flex-1", className)}>
      <label className="sr-only" htmlFor="admin-header-search">
        Глобальный поиск
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <input
        id="admin-header-search"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={a.portal.searchPlaceholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="admin-search-results"
        className={cn(
          "h-9 w-full max-w-xl rounded-xl border border-zinc-800/80 bg-zinc-900/50 py-2 pl-10 pr-10 text-sm text-zinc-100",
          "placeholder:text-zinc-500 outline-none transition-colors",
          "focus:border-zinc-700 focus-visible:ring-2 focus-visible:ring-[#B7F500]/20",
        )}
      />
      {loading ? (
        <SplitonLoader
          size="xxs"
          variant="light"
          className="absolute right-3 top-1/2 -translate-y-1/2"
          label={a.t("admin.portal.searchPlaceholder")}
        />
      ) : null}

      {showDropdown ? (
        <div
          id="admin-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-auto rounded-xl border border-zinc-800 bg-[#1a1a1d] py-2 shadow-xl"
        >
          {error ? (
            <p className="px-4 py-3 text-sm text-red-400">Не удалось выполнить поиск</p>
          ) : loading && groups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Поиск…</p>
          ) : groups.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Ничего не найдено</p>
          ) : (
            groups.map((group) => (
              <div key={group.type} className="px-2 py-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {group.title}
                </p>
                <ul>
                  {group.items.map((item) => {
                    const idx = flatItems.findIndex((f) => f.id === item.id && f.href === item.href);
                    return (
                      <li key={`${group.type}-${item.id}`}>
                        <Link
                          href={item.href}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-zinc-800",
                            idx === activeIndex && "bg-zinc-800",
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
      ) : null}
    </div>
  );
}
