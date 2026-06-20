"use client";

import { useEffect, useRef } from "react";

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

export function ReleaseParametersMobileNav() {
  const { t } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { active, scrollToSection } = useRpScrollSpy(navRef);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeButton = track.querySelector<HTMLElement>(`[data-section-id="${active}"]`);
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav ref={navRef} aria-label={t("catalog.releaseParameters.nav.ariaLabel")} className="guide-mobile-nav xl:hidden">
      <div ref={trackRef} className="guide-mobile-nav-track">
        {RELEASE_PARAMETERS_IN_PAGE_NAV.map((item, idx) => {
          const isActive = active === item.id;
          const labelKey = NAV_LABEL_KEYS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              data-section-id={item.id}
              aria-current={isActive ? "location" : undefined}
              onClick={() => scrollToSection(item.id)}
              className={cn("guide-mobile-nav-item", isActive && "is-active")}
            >
              <span className="guide-mobile-nav-index">{String(idx + 1).padStart(2, "0")}</span>
              <span>{labelKey ? t(labelKey) : item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
