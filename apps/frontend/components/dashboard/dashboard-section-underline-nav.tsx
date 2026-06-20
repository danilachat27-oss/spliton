"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export type DashboardSectionUnderlineNavItem = {
  href: string;
  label: string;
  active?: boolean;
  scroll?: boolean;
};

const navClass =
  "flex h-12 items-stretch gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:x_mandatory] sm:gap-6 [&::-webkit-scrollbar]:hidden";

const linkClass =
  "box-border inline-flex h-full shrink-0 scroll-snap-start items-center border-b-[2.5px] px-0.5 text-[14px] leading-normal whitespace-nowrap transition-colors sm:text-[13px]";

export function DashboardSectionUnderlineNav({
  ariaLabel,
  items,
  className,
}: {
  ariaLabel: string;
  items: DashboardSectionUnderlineNavItem[];
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn(navClass, className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={item.scroll ?? true}
          className={cn(
            linkClass,
            item.active
              ? "border-neutral-900 font-semibold text-neutral-900"
              : "border-transparent font-medium text-neutral-500 hover:text-neutral-800",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
