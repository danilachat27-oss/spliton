import Image from "next/image";

import { cn } from "@/lib/utils";

/** Matches parent surfaces so PNG black (#000) blends away instead of a visible box. */
export const DETAIL_ILLUSTRATION_SURFACE = {
  /** Inner empty-state cards (#111111). */
  card: "#111111",
  /** Pulse / nested panels (#090909). */
  elevated: "#090909",
  /** Section shells (#0d0d0d). */
  deep: "#0d0d0d",
  /** Cover placeholder inner (#090909 on #111 block). */
  cover: "#090909",
} as const;

export type DetailIllustrationSurface = keyof typeof DETAIL_ILLUSTRATION_SURFACE;

type DetailAnalyticsIllustrationProps = {
  src: string;
  className?: string;
  surface?: DetailIllustrationSurface;
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * Renders Spliton analytics PNGs exported on black: `mix-blend-screen` removes
 * the black plate; wrapper stays transparent so the parent surface shows through.
 */
export function DetailAnalyticsIllustration({
  src,
  className,
  surface: _surface = "card",
  sizes = "(max-width: 640px) 180px, 280px",
  width = 560,
  height = 560,
}: DetailAnalyticsIllustrationProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className="h-auto w-full object-contain mix-blend-screen"
        sizes={sizes}
        priority={false}
      />
    </div>
  );
}
