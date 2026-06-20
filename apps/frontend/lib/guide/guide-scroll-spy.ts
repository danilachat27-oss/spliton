import { useCallback, useEffect, useState, type RefObject } from "react";

import { GUIDE_IN_PAGE_NAV } from "@/constants/guide/selection";

export const GUIDE_SCROLL_OFFSET_PX = 112;
const BOTTOM_THRESHOLD_PX = 64;

export function resolveGuideScrollRoot(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  return node.closest<HTMLElement>("[data-mobile-scroll-root]");
}

function sectionTopInRoot(section: HTMLElement, scrollRoot: HTMLElement): number {
  const sectionRect = section.getBoundingClientRect();
  const rootRect = scrollRoot.getBoundingClientRect();
  return sectionRect.top - rootRect.top + scrollRoot.scrollTop;
}

export function resolveGuideActiveSection(scrollRoot: HTMLElement): string {
  const sectionIds = GUIDE_IN_PAGE_NAV.map((item) => item.id);
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((node): node is HTMLElement => node != null);

  if (sections.length === 0) return sectionIds[0] ?? "guide-top";

  const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
  const nearBottom = scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD_PX;
  if (nearBottom) {
    return sectionIds[sectionIds.length - 1] ?? sections[sections.length - 1]!.id;
  }

  const marker = scrollTop + GUIDE_SCROLL_OFFSET_PX;
  let active = sections[0]!.id;

  for (const section of sections) {
    if (sectionTopInRoot(section, scrollRoot) <= marker) {
      active = section.id;
    } else {
      break;
    }
  }

  return active;
}

export function useGuideScrollSpy(anchorRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<string>(GUIDE_IN_PAGE_NAV[0]?.id ?? "guide-top");

  const syncActive = useCallback(() => {
    const scrollRoot = resolveGuideScrollRoot(anchorRef.current);
    if (!scrollRoot) return;
    setActive((prev) => {
      const next = resolveGuideActiveSection(scrollRoot);
      return prev === next ? prev : next;
    });
  }, [anchorRef]);

  useEffect(() => {
    const scrollRoot = resolveGuideScrollRoot(anchorRef.current);
    if (!scrollRoot) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncActive);
    };

    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [anchorRef, syncActive]);

  const scrollToSection = useCallback(
    (id: string) => {
      const scrollRoot = resolveGuideScrollRoot(anchorRef.current);
      const section = document.getElementById(id);
      if (!scrollRoot || !section) return;
      const top = Math.max(0, sectionTopInRoot(section, scrollRoot) - GUIDE_SCROLL_OFFSET_PX + 8);
      scrollRoot.scrollTo({ top, behavior: "smooth" });
      setActive(id);
    },
    [anchorRef],
  );

  return { active, scrollToSection };
}
