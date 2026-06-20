"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

function resolveScrollRoot(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  return node.closest<HTMLElement>("[data-mobile-scroll-root]");
}

export function useGuideScrollReveal(threshold = 0.22) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const scrollRoot = resolveScrollRoot(target);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        root: scrollRoot,
        threshold,
        rootMargin: "0px 0px -6% 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function GuidePurposeHint({ text }: { text: string }) {
  const { t } = useI18n();

  return (
    <div className="guide-reveal-purpose mb-3.5" role="note">
      <span className="guide-reveal-purpose-dot" aria-hidden />
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {t("guide.reveal.purposeLabel")}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-zinc-200">{text}</p>
      </div>
    </div>
  );
}

export function GuideScrollReveal({
  children,
  className,
  purpose,
  rowCount,
}: {
  children: ReactNode;
  className?: string;
  purpose?: string;
  /** For footer stagger timing on registry panels. */
  rowCount?: number;
}) {
  const { ref, visible } = useGuideScrollReveal();

  return (
    <div
      ref={ref}
      className={cn("guide-reveal-root", visible && "is-visible", className)}
      style={
        rowCount != null
          ? ({ "--guide-row-count": rowCount } as CSSProperties)
          : undefined
      }
    >
      {purpose ? <GuidePurposeHint text={purpose} /> : null}
      {children}
    </div>
  );
}

export function guideRevealRowStyle(index: number): CSSProperties {
  return { "--guide-row-i": index } as CSSProperties;
}

export function guideRevealBlockStyle(index: number): CSSProperties {
  return { "--guide-block-i": index } as CSSProperties;
}
