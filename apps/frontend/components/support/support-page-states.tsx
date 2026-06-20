"use client";

import Link from "next/link";
import { ArrowLeft } from "@/lib/lucide";

import { SplitonLoader } from "@/components/ui/spliton-loader";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type SupportBackLinkProps = {
  label: string;
  href?: string;
  className?: string;
};

export function SupportBackLink({ label, href = ROUTES.support, className }: SupportBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm text-sm text-zinc-500 transition hover:text-white",
        focusRing,
        className,
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

type SupportPageSkeletonProps = {
  variant: "hub" | "category" | "article";
  loadingLabel: string;
};

export function SupportPageSkeleton({ variant, loadingLabel }: SupportPageSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite" role="status" className="flex flex-col items-center gap-10 pt-10">
      <SplitonLoader size="lg" variant="light" label={loadingLabel} />
      <p className="sr-only">{loadingLabel}</p>
      {variant === "article" ? (
        <div className="mt-8 space-y-4">
          <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-[#111111]" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-[#111111]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#111111]" />
        </div>
      ) : variant === "category" ? (
        <div className="mt-8 space-y-4">
          <div className="h-10 w-1/2 max-w-sm animate-pulse rounded-lg bg-[#111111]" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-[#111111]" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#111111]" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#111111]" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type SupportPageStatePanelProps = {
  message: string;
  tone: "error" | "notFound" | "demo";
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
};

export function SupportPageStatePanel({
  message,
  tone,
  actionLabel,
  onAction,
  actionHref,
}: SupportPageStatePanelProps) {
  const toneClass =
    tone === "notFound"
      ? "border-zinc-700/40 bg-zinc-500/[0.06] text-zinc-200"
      : tone === "demo"
        ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-100"
        : "border-red-500/20 bg-red-500/[0.06] text-red-200";

  return (
    <div
      className={cn("mt-8 rounded-2xl border px-6 py-10 text-center", toneClass)}
      role={tone === "error" ? "alert" : "status"}
    >
      <p className="text-sm leading-relaxed">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn("mt-4 text-sm font-medium underline-offset-2 hover:underline", focusRing)}
        >
          {actionLabel}
        </button>
      ) : null}
      {actionLabel && actionHref && !onAction ? (
        <Link
          href={actionHref}
          className={cn("mt-4 inline-block text-sm font-medium underline-offset-2 hover:underline", focusRing)}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export { focusRing as supportFocusRing };
