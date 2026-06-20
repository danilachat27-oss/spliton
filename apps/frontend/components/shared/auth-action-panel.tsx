"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthActionPanelProps = {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  className?: string;
  testId?: string;
  ctaTestId?: string;
  variant?: "light" | "dark";
  children?: ReactNode;
};

const variantStyles = {
  light: {
    box: "border-neutral-200 bg-neutral-50 text-neutral-800",
    title: "text-neutral-900",
    description: "text-neutral-600",
    cta: "bg-neutral-900 text-white hover:bg-neutral-800",
  },
  dark: {
    box: "border-white/10 bg-white/5 text-zinc-300",
    title: "text-white",
    description: "text-zinc-500",
    cta: "bg-[#B7F500] text-black hover:bg-[#a8e600]",
  },
} as const;

/** Consistent auth / action gate card for financial and catalog flows. */
export function AuthActionPanel({
  title,
  description,
  ctaHref,
  ctaLabel,
  className,
  testId,
  ctaTestId,
  variant = "light",
  children,
}: AuthActionPanelProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn("rounded-2xl border px-5 py-6 text-sm", styles.box, className)}
      data-testid={testId}
    >
      <p className={cn("text-[15px] font-semibold", styles.title)}>{title}</p>
      <p className={cn("mt-2 leading-relaxed", styles.description)}>{description}</p>
      <Link
        href={ctaHref}
        data-testid={ctaTestId}
        className={cn(
          "mt-4 inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-semibold transition",
          styles.cta,
        )}
      >
        {ctaLabel}
      </Link>
      {children}
    </div>
  );
}
