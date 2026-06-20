"use client";

import { useEffect, useRef } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { GUIDE_IN_PAGE_NAV } from "@/constants/guide/selection";
import { useGuideScrollSpy } from "@/lib/guide/guide-scroll-spy";
import { cn } from "@/lib/utils";

export function GuideMobileNav() {
  const { t } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { active, scrollToSection } = useGuideScrollSpy(navRef);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeButton = track.querySelector<HTMLElement>(`[data-section-id="${active}"]`);
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav
      ref={navRef}
      aria-label={t("guide.nav.aria")}
      className="guide-mobile-nav xl:hidden"
    >
      <div ref={trackRef} className="guide-mobile-nav-track">
        {GUIDE_IN_PAGE_NAV.map((item, idx) => {
          const isActive = active === item.id;
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
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
