"use client";

import type { NewsCategoryFilterId } from "@/constants/news-mock-data";
import { NEWS_CATEGORY_FILTERS } from "@/constants/news-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type NewsCategoryFiltersProps = {
  active: NewsCategoryFilterId;
  onChange: (id: NewsCategoryFilterId) => void;
  className?: string;
};

export function NewsCategoryFilters({ active, onChange, className }: NewsCategoryFiltersProps) {
  const { t } = useI18n();

  return (
    <nav className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)} aria-label={t("news.blogTitle")}>
      {NEWS_CATEGORY_FILTERS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "text-sm font-semibold transition-colors",
            active === item.id ? "text-white" : "text-zinc-500 hover:text-zinc-300",
          )}
          aria-current={active === item.id ? "page" : undefined}
        >
          {t(`news.category.${item.id}`)}
        </button>
      ))}
    </nav>
  );
}
