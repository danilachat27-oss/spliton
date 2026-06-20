"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export type AdminTabLink = {
  id: string;
  label: string;
  href: string;
};

type AdminTabsProps = {
  tabs: AdminTabLink[];
  activeId: string;
  className?: string;
};

export function AdminTabs({ tabs, activeId, className }: AdminTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={active}
            scroll={false}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900 text-zinc-100"
                : "bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
