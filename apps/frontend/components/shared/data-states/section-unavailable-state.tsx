"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

import { RetryButton } from "./retry-button";

type SectionUnavailableVariant = "light" | "dark" | "admin";

type SectionUnavailableStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: SectionUnavailableVariant;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

const variantClasses: Record<SectionUnavailableVariant, { box: string; title: string; description: string }> = {
  light: {
    box: "border-amber-200 bg-amber-50/95 text-amber-900",
    title: "text-amber-950",
    description: "text-amber-800",
  },
  dark: {
    box: "border-white/10 bg-white/[0.04] text-zinc-400",
    title: "text-zinc-200",
    description: "text-zinc-500",
  },
  admin: {
    box: "border-zinc-700/80 bg-zinc-900/60 text-zinc-400",
    title: "text-zinc-100",
    description: "text-zinc-500",
  },
};

export function SectionUnavailableState({
  title,
  description,
  onRetry,
  retryLabel,
  variant = "light",
  compact = false,
  className,
  children,
}: SectionUnavailableStateProps) {
  const { t } = useI18n();
  const styles = variantClasses[variant];
  const displayTitle = title ?? t("errors.section.unavailable.title");
  const displayDescription = description ?? t("errors.section.unavailable.description");

  return (
    <div
      role="status"
      className={cn(
        compact
          ? "rounded-xl border px-3 py-4 text-center text-xs"
          : "rounded-2xl border px-4 py-8 text-center text-sm",
        styles.box,
        className,
      )}
    >
      <p className={cn("font-medium", styles.title)}>{displayTitle}</p>
      <p className={cn("mt-1.5 leading-relaxed", styles.description)}>{displayDescription}</p>
      {onRetry ? (
        <div className="mt-4">
          <RetryButton
            onClick={onRetry}
            label={retryLabel}
            className={variant === "light" ? "text-amber-900 hover:text-amber-950" : "text-zinc-200"}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
