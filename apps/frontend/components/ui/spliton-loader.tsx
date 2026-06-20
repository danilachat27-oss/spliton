"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/LOGO/mini-logo.png";

export type SplitonLoaderVariant = "dark" | "light";
export type SplitonSurfaceVariant = "light" | "dark";
export type SplitonLoaderSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<SplitonLoaderSize, { box: number; logo: number; stroke: number }> = {
  xxs: { box: 16, logo: 9, stroke: 2 },
  xs: { box: 20, logo: 11, stroke: 2 },
  sm: { box: 32, logo: 18, stroke: 2.5 },
  md: { box: 48, logo: 26, stroke: 3 },
  lg: { box: 64, logo: 34, stroke: 3.5 },
  xl: { box: 80, logo: 42, stroke: 4 },
};

function ringColors(variant: SplitonLoaderVariant) {
  if (variant === "light") {
    return { track: "rgba(255,255,255,0.22)", arc: "#ffffff" };
  }
  return { track: "rgba(0,0,0,0.1)", arc: "#171717" };
}

export function spinnerVariantForSurface(surface: SplitonSurfaceVariant): SplitonLoaderVariant {
  return surface === "dark" ? "light" : "dark";
}

type SplitonLoaderProps = {
  size?: SplitonLoaderSize;
  /** `dark` — чёрное кольцо (светлый фон). `light` — белое кольцо (тёмный фон). */
  variant?: SplitonLoaderVariant;
  className?: string;
  label?: string;
  labelKey?: string;
};

export function SplitonLoader({
  size = "md",
  variant = "dark",
  className,
  label,
  labelKey,
}: SplitonLoaderProps) {
  const { t } = useI18n();
  const displayLabel = label ?? (labelKey ? t(labelKey) : t("common.loading"));
  const dims = SIZE_MAP[size];
  const { track, arc } = ringColors(variant);
  const logoRadius = Math.max(4, Math.round(dims.logo * 0.22));

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: dims.box, height: dims.box }}
      role="status"
      aria-label={displayLabel}
    >
      <div className="absolute inset-0 animate-spin motion-reduce:animate-none" aria-hidden>
        <svg viewBox="0 0 100 100" className="size-full">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={track}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={arc}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="70 194"
          />
        </svg>
      </div>

      <div
        className="relative z-10 flex items-center justify-center overflow-hidden bg-white shadow-sm"
        style={{
          width: dims.logo,
          height: dims.logo,
          borderRadius: logoRadius,
        }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          width={dims.logo}
          height={dims.logo}
          className="size-full object-contain"
          decoding="async"
        />
      </div>
    </div>
  );
}

type SplitonLoadingViewProps = {
  /** Фон блока: `light` — белый, `dark` — тёмный. Цвет кольца подбирается автоматически. */
  variant?: SplitonSurfaceVariant;
  size?: SplitonLoaderSize;
  label?: string;
  labelKey?: string;
  className?: string;
  minHeight?: string;
  fullScreen?: boolean;
};

export function SplitonLoadingView({
  variant = "light",
  size = "lg",
  label,
  labelKey,
  className,
  minHeight = "min-h-[40vh]",
  fullScreen = false,
}: SplitonLoadingViewProps) {
  const { t } = useI18n();
  const displayLabel = label ?? (labelKey ? t(labelKey) : undefined);
  const spinnerVariant = spinnerVariantForSurface(variant);
  const labelClass =
    variant === "dark" ? "text-sm text-zinc-400" : "text-sm font-medium text-neutral-600";

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 px-6",
        variant === "dark" ? "bg-[#141416]" : "bg-white",
        fullScreen ? "min-h-dvh" : minHeight,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SplitonLoader size={size} variant={spinnerVariant} label={displayLabel} />
      {displayLabel ? <p className={labelClass}>{displayLabel}</p> : null}
    </div>
  );
}
