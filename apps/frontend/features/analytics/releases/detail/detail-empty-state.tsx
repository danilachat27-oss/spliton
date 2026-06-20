import type { LucideIcon } from "@/lib/lucide";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  DetailAnalyticsIllustration,
  type DetailIllustrationSurface,
} from "./detail-analytics-illustration";

type DetailEmptyStateProps = {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
  imageSrc?: string;
  icon?: LucideIcon;
  imageSize?: "sm" | "md" | "lg";
  /** Background behind illustration — must match parent card. */
  illustrationSurface?: DetailIllustrationSurface;
};

const imageSizeClass: Record<NonNullable<DetailEmptyStateProps["imageSize"]>, string> = {
  sm: "max-w-[120px] sm:max-w-[140px]",
  md: "max-w-[180px] sm:max-w-[220px]",
  lg: "max-w-[220px] sm:max-w-[280px]",
};

export function DetailEmptyState({
  imageSrc,
  icon: Icon,
  title,
  body,
  action,
  className,
  imageSize = "md",
  illustrationSurface = "card",
}: DetailEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center sm:py-12",
        className,
      )}
    >
      {imageSrc ? (
        <DetailAnalyticsIllustration
          src={imageSrc}
          surface={illustrationSurface}
          className={cn("mx-auto w-full", imageSizeClass[imageSize])}
          sizes={
            imageSize === "lg"
              ? "(max-width: 640px) 220px, 280px"
              : imageSize === "sm"
                ? "140px"
                : "(max-width: 640px) 180px, 220px"
          }
        />
      ) : Icon ? (
        <div
          className="flex size-12 items-center justify-center rounded-2xl bg-white/4 ring-1 ring-white/8"
          aria-hidden
        >
          <Icon className="size-5 text-zinc-400" strokeWidth={1.75} />
        </div>
      ) : null}
      <h3 className={cn("text-base font-semibold text-white", imageSrc ? "mt-5" : "mt-4")}>{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
