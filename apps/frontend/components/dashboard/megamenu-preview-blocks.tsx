"use client";

import Image from "next/image";

import "./megamenu-preview-shared.css";

import { cn } from "@/lib/utils";

export function BlockCursor({
  step,
  hint,
  className,
  tipAbove = true,
}: {
  step: string;
  hint: string;
  className?: string;
  tipAbove?: boolean;
}) {
  return (
    <div
      className={cn(
        "service-preview-cursor-local pointer-events-none absolute z-[80]",
        `service-preview-cursor-local--${step}`,
        className,
      )}
      aria-hidden
    >
      <svg width="14" height="16" viewBox="0 0 14 16" className="relative z-[81] drop-shadow-md">
        <path
          d="M1 1L1 13.5L4.2 10.3L6.5 15.5L8.2 14.7L5.9 9.5L10.5 9.5L1 1Z"
          fill="white"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "service-preview-local-ring absolute left-1.5 top-1.5 z-[81] size-3 rounded-full border-2 border-[#B7F500]/90",
          `service-preview-local-ring--${step}`,
        )}
      />
      <span
        className={cn(
          "service-preview-local-tip absolute left-3 z-[82] max-w-[72px] rounded-md bg-zinc-900 px-1.5 py-0.5 text-[6px] font-medium leading-tight text-white shadow-lg",
          tipAbove ? "bottom-[calc(100%+1px)] top-auto" : "top-3",
          `service-preview-local-tip--${step}`,
        )}
      >
        {hint}
      </span>
    </div>
  );
}

export function PreviewCover({
  src,
  className,
  imageClassName,
  overlayClassName,
  fadeClassName,
}: {
  src: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  fadeClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt="" fill sizes="360px" className={cn("object-cover object-center", imageClassName)} unoptimized />
      {overlayClassName ? <div className={cn("absolute inset-0", overlayClassName)} aria-hidden /> : null}
      {fadeClassName ? <div className={cn("absolute inset-x-0 bottom-0 h-6", fadeClassName)} aria-hidden /> : null}
    </div>
  );
}

export function PageHero({
  title,
  src,
  eyebrow,
  subtitle,
  titleClassName = "text-[10px] font-semibold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.55)]",
  overlay = "bg-black/10",
  fadeClassName = "bg-linear-to-b from-transparent to-[#f6f7f9]",
  imageClassName,
  heightClass = "h-[40%] min-h-[54px]",
}: {
  title: string;
  src: string;
  eyebrow?: string;
  subtitle?: string;
  titleClassName?: string;
  overlay?: string;
  fadeClassName?: string;
  imageClassName?: string;
  heightClass?: string;
}) {
  return (
    <div className={cn("relative -mx-2 -mt-2 shrink-0 overflow-hidden", heightClass)}>
      <PreviewCover
        src={src}
        className="absolute inset-0"
        imageClassName={imageClassName}
        overlayClassName={overlay}
        fadeClassName={fadeClassName}
      />
      <div className="relative flex h-full flex-col items-center justify-center px-3 text-center">
        {eyebrow ? (
          <p className="text-[5px] font-semibold uppercase tracking-[0.16em] text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
            {eyebrow}
          </p>
        ) : null}
        <p className={titleClassName}>{title}</p>
        {subtitle ? (
          <p className="mt-1 line-clamp-2 max-w-[95%] text-[5px] leading-snug text-white/88 [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
