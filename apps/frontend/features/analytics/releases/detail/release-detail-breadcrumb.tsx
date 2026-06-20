"use client";

import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import type { ReleaseDetailPageData } from "@/types/analytics/release-detail";

export function ReleaseDetailBreadcrumb({ data }: { data: ReleaseDetailPageData }) {
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("analytics.detail.breadcrumbAria")}
      className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-zinc-500 sm:text-[12px]"
    >
      {data.breadcrumbs.map((crumb, i) => {
        const isLast = i === data.breadcrumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-zinc-700" aria-hidden /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="transition-colors hover:text-zinc-300">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-zinc-200 sm:text-zinc-300" : undefined}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
