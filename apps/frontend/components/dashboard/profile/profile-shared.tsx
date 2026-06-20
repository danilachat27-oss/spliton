"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { profileCardClass } from "./profile-ui";

export function ProfileScoreRing({
  score,
  maxScore,
  label,
  size = "md",
  className,
}: {
  score: number;
  maxScore: number;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const pct = maxScore > 0 ? Math.min(1, score / maxScore) : 0;
  const deg = pct * 360;
  const outer = size === "sm" ? "h-[72px] w-[72px]" : "h-[88px] w-[88px]";
  const inner = size === "sm" ? "h-[58px] w-[58px]" : "h-[72px] w-[72px]";
  const scoreText = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center rounded-full", outer, className)}
      style={{
        background: `conic-gradient(#B7F500 0deg ${deg}deg, #e5e7eb ${deg}deg 360deg)`,
      }}
      aria-hidden
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-full bg-white text-center",
          inner,
        )}
      >
        <span className={cn("font-bold tabular-nums leading-none text-neutral-900", scoreText)}>
          {score}
        </span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </span>
      </div>
    </div>
  );
}

export function ProfileSectionCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(profileCardClass, className)}>
      {title ? (
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

export function ProfileRowLink({
  href,
  label,
  actionLabel,
  onClick,
}: {
  href?: string;
  label: string;
  actionLabel: string;
  onClick?: () => void;
}) {
  const actionClass =
    "shrink-0 text-sm font-medium text-neutral-900 transition hover:text-neutral-600";

  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="min-w-0 text-sm text-neutral-700">{label}</span>
      {href ? (
        <Link href={href} className={actionClass}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={actionClass}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export const profileRowDividerClass = "divide-y divide-neutral-100";
