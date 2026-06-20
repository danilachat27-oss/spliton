"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const PARTNER_PAGE_BG = "/images/partner-programtab=about/back.jpg";

type PartnerSurfaceProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  accentTop?: boolean;
  imageOpacity?: string;
  overlayClassName?: string;
};

export function PartnerSurface({
  children,
  className,
  innerClassName,
  accentTop = true,
  imageOpacity = "opacity-55",
  overlayClassName = "bg-black/55",
}: PartnerSurfaceProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      <Image
        src={PARTNER_PAGE_BG}
        alt=""
        fill
        className={cn("object-cover object-center", imageOpacity)}
        sizes="(max-width: 1200px) 100vw, 1200px"
      />
      <div className={cn("pointer-events-none absolute inset-0", overlayClassName)} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_14%_12%,rgba(255,255,255,0.14),transparent_58%)]"
        aria-hidden
      />
      {accentTop ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-[#B7F500]/85" aria-hidden />
      ) : null}
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  );
}

export function PartnerLogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-9" : "size-10";
  const img = size === "sm" ? "size-5" : "size-6";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
        box,
      )}
    >
      <Image
        src="/images/LOGO/mini-logo.png"
        alt=""
        width={24}
        height={24}
        className={cn("object-contain", img)}
        unoptimized
      />
    </span>
  );
}
