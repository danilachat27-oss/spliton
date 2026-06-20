"use client";

import { useMemo, useState } from "react";
import { Search } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

const GENRE_COLLAPSED_LIMIT = 10;
const GENRE_SEARCH_THRESHOLD = 12;

const baseChip =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-[12px] font-medium tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20";

const idleChip =
  "bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100";

const activeChip = "bg-white text-black shadow-[0_6px_20px_rgba(0,0,0,0.3)]";

export function CatalogGenreFilterSection({
  genre,
  onGenre,
  genres,
  genreCounts,
}: {
  genre: string;
  onGenre: (genre: string) => void;
  genres: string[];
  genreCounts: Map<string, number>;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const uniqueGenres = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const raw of genres) {
      const g = raw.trim();
      if (!g || seen.has(g)) continue;
      seen.add(g);
      list.push(g);
    }
    list.sort((a, b) => {
      const countDiff = (genreCounts.get(b) ?? 0) - (genreCounts.get(a) ?? 0);
      if (countDiff !== 0) return countDiff;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    return list;
  }, [genres, genreCounts]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredGenres = useMemo(() => {
    if (!normalizedSearch) return uniqueGenres;
    return uniqueGenres.filter((g) => g.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch, uniqueGenres]);

  const showSearch = uniqueGenres.length >= GENRE_SEARCH_THRESHOLD;
  const needsCollapse = !normalizedSearch && uniqueGenres.length > GENRE_COLLAPSED_LIMIT;

  const visibleGenres = useMemo(() => {
    if (normalizedSearch) return filteredGenres;
    if (!needsCollapse || expanded) return uniqueGenres;

    const top = uniqueGenres.slice(0, GENRE_COLLAPSED_LIMIT);
    if (genre && !top.includes(genre) && uniqueGenres.includes(genre)) {
      return [...top, genre];
    }
    return top;
  }, [expanded, filteredGenres, genre, needsCollapse, normalizedSearch, uniqueGenres]);

  const hiddenCount = Math.max(0, uniqueGenres.length - GENRE_COLLAPSED_LIMIT);

  return (
    <section className="px-1 py-1">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {t("catalog.filters.section.genre")}
      </p>

      {showSearch ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-zinc-600"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.filters.genreSearch")}
            className="h-10 w-full rounded-xl bg-black/30 pl-9 pr-3 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-white/20"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap gap-2",
          expanded && !normalizedSearch && "max-h-56 overflow-y-auto pr-1 Spliton-scrollbar",
        )}
      >
        {!normalizedSearch ? (
          <button
            type="button"
            onClick={() => onGenre("")}
            className={cn(baseChip, genre === "" ? activeChip : idleChip)}
          >
            {t("catalog.filters.kind.all")}
          </button>
        ) : null}

        {visibleGenres.length === 0 ? (
          <p className="px-1 py-2 text-[12px] text-zinc-500">{t("catalog.filters.genreEmpty")}</p>
        ) : (
          visibleGenres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGenre(g)}
              className={cn(baseChip, genre === g ? activeChip : idleChip)}
            >
              <span className="max-w-[160px] truncate">{g}</span>
              {genreCounts.has(g) ? (
                <span className="ml-1.5 text-[10px] opacity-70">{genreCounts.get(g)}</span>
              ) : null}
            </button>
          ))
        )}
      </div>

      {needsCollapse && !normalizedSearch ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[12px] font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          {expanded
            ? t("catalog.filters.showLessGenres")
            : tf(t("catalog.filters.showMoreGenres"), { count: String(hiddenCount) })}
        </button>
      ) : null}
    </section>
  );
}
