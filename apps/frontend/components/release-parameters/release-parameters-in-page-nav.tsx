"use client";

import { useRef } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_PARAMETERS_IN_PAGE_NAV } from "@/constants/release-parameters/page";
import { useRpScrollSpy } from "@/lib/release-parameters/rp-scroll-spy";
import { cn } from "@/lib/utils";

const NAV_LABEL_KEYS: Record<string, string> = {
  "rp-top": "catalog.releaseParameters.nav.top",
  "rp-card": "catalog.releaseParameters.nav.card",
  "rp-params": "catalog.releaseParameters.nav.params",
  "rp-first": "catalog.releaseParameters.nav.first",
  "rp-example": "catalog.releaseParameters.nav.example",
  "rp-faq": "catalog.releaseParameters.nav.faq",
};

export function ReleaseParametersInPageNav() {
  const { t } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const { active, scrollToSection } = useRpScrollSpy(navRef);

  return (
    <nav
      ref={navRef}
      aria-label={t("catalog.releaseParameters.nav.ariaLabel")}
      className="sticky top-[calc(var(--guide-header-offset,4rem)+0.5rem)]"
    >
      <div className="rounded-xl bg-[#0a0a0a]/80 p-3 backdrop-blur-sm">
        <ol className="list-none space-y-0.5 border-l border-white/10 pl-2">
          {RELEASE_PARAMETERS_IN_PAGE_NAV.map((item, idx) => {
            const isActive = active === item.id;
            const labelKey = NAV_LABEL_KEYS[item.id];
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
                  <span className="min-w-0 leading-snug">{labelKey ? t(labelKey) : item.label}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
