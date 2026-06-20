"use client";

import { Search } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { supportFocusRing } from "@/components/support/support-page-states";
import { cn } from "@/lib/utils";

type SupportPageHeroProps = {
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function SupportPageHero({ search, onSearchChange, className }: SupportPageHeroProps) {
  const { t } = useI18n();

  return (
    <header className={cn("mb-8 text-center sm:mb-10 lg:mb-12", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:text-[11px]">
        {t("support.hero.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:mt-3 sm:text-4xl lg:text-[3.25rem]">
        {t("support.hero.title")}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl px-1 text-sm leading-relaxed text-zinc-500 sm:mt-3 sm:text-base">
        {t("support.hero.subtitle")}
      </p>

      <div className="relative mx-auto mt-6 max-w-2xl sm:mt-8">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500 sm:left-4"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("support.hero.searchPlaceholder")}
          aria-label={t("support.hero.searchAria")}
          autoComplete="off"
          className={cn(
            "h-12 w-full rounded-2xl border border-white/10 bg-[#111111] pl-11 pr-4 text-base text-white placeholder:text-zinc-600 outline-none transition sm:h-14 sm:pl-12",
            "focus:border-white/20 focus:bg-[#141414]",
            supportFocusRing,
          )}
        />
      </div>
    </header>
  );
}
