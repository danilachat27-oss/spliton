"use client";

import { useRef } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { GUIDE_IN_PAGE_NAV } from "@/constants/guide/selection";
import { useGuideScrollSpy } from "@/lib/guide/guide-scroll-spy";
import { cn } from "@/lib/utils";

export function GuideInPageNav() {
  const { t } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const { active, scrollToSection } = useGuideScrollSpy(navRef);

  return (
    <nav ref={navRef} aria-label={t("guide.nav.aria")} className="sticky top-[calc(var(--guide-header-offset,4rem)+0.5rem)]">
      <div className="rounded-xl bg-[#0a0a0a]/80 p-3 backdrop-blur-sm">
        <ol className="list-none space-y-0.5 border-l border-white/10 pl-2">
          {GUIDE_IN_PAGE_NAV.map((item, idx) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className={cn(
                    "guide-desktop-nav-item flex w-full gap-1.5 rounded-r-md border-l-2 border-transparent py-1.5 pl-2 pr-1.5 text-left text-[11px] leading-snug transition-[background-color,color,border-color] duration-200 md:text-[12px]",
                    isActive
                      ? "is-active font-medium text-white"
                      : "text-zinc-500 hover:bg-white/4 hover:text-zinc-200",
                  )}
                >
                  <span
                    className={cn(
                      "guide-desktop-nav-index w-5 shrink-0 pt-px font-mono text-[10px] tabular-nums",
                      isActive ? "text-[#c4f570]" : "text-zinc-600",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span className="min-w-0 leading-snug">{t(item.labelKey)}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
