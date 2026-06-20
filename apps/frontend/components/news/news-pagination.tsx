"use client";

import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

type NewsPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function NewsPagination({ page, totalPages, onPageChange, className }: NewsPaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const pages = pageNumbers(page, totalPages);

  return (
    <nav
      className={cn("flex items-center justify-center gap-2", className)}
      aria-label={tf(t("news.pagination.page"), { page: String(page), total: String(totalPages) })}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        aria-label={t("news.pagination.prev")}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-zinc-600" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              p === page
                ? "bg-white text-black"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
            )}
            aria-current={p === page ? "page" : undefined}
            aria-label={tf(t("news.pagination.page"), { page: String(p), total: String(totalPages) })}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        aria-label={t("news.pagination.next")}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
