import Link from "next/link";
import { ChevronRight } from "@/lib/lucide";

import { ROUTES } from "@/constants/routes";
import { supportFocusRing } from "@/components/support/support-page-states";
import { cn } from "@/lib/utils";

export type SupportBreadcrumbItem = {
  slug: string;
  title: string;
};

type SupportBreadcrumbsProps = {
  items: SupportBreadcrumbItem[];
  homeLabel: string;
  ariaLabel: string;
  className?: string;
};

export function SupportBreadcrumbs({ items, homeLabel, ariaLabel, className }: SupportBreadcrumbsProps) {
  if (items.length === 0) return null;

  const linkClass = cn(
    "truncate rounded-sm text-zinc-500 transition hover:text-zinc-200",
    supportFocusRing,
  );

  return (
    <nav aria-label={ariaLabel} className={cn("mb-4", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        <li className="flex min-w-0 items-center">
          <Link href={ROUTES.support} className={linkClass}>
            {homeLabel}
          </Link>
        </li>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={crumb.slug} className="flex min-w-0 max-w-full items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0 text-zinc-600" aria-hidden />
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-zinc-300">
                  {crumb.title}
                </span>
              ) : (
                <Link href={ROUTES.supportCategory(crumb.slug)} className={linkClass}>
                  {crumb.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
