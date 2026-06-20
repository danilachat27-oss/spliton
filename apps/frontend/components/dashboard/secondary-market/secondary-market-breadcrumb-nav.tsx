"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export type SecondaryMarketBreadcrumbItem = {
  label: string;
  href?: string;
  /** Для внутренних переходов по query во вторичке */
  scroll?: boolean;
  icon?: LucideIcon;
};

export function SecondaryMarketBreadcrumbNav({
  items,
  className,
}: {
  items: SecondaryMarketBreadcrumbItem[];
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-1.5 font-mono text-[10px] text-zinc-500",
        className,
      )}
      aria-label={t("secondaryMarket.aria.breadcrumbNav")}
    >
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 ? (
            <span className="px-0.5 text-zinc-700 select-none" aria-hidden>
              /
            </span>
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              scroll={item.scroll ?? true}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 hover:text-zinc-300"
            >
              {item.icon ? <item.icon className="size-3 shrink-0 text-[#B7F500]/80" strokeWidth={2} aria-hidden /> : null}
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
                i === items.length - 1 ? "font-medium text-zinc-200" : "text-zinc-400",
              )}
              aria-current={i === items.length - 1 ? "page" : undefined}
            >
              {item.icon ? (
                <item.icon
                  className={cn("size-3 shrink-0", i === items.length - 1 ? "text-[#B7F500]" : "text-zinc-500")}
                  strokeWidth={2}
                  aria-hidden
                />
              ) : null}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
