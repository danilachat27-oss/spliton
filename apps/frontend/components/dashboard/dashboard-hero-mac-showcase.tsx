"use client";

import NextImage from "next/image";

import { DashboardHeroJourneyPreview } from "@/components/dashboard/dashboard-hero-journey-preview";
import { cn } from "@/lib/utils";

/**
 * Экран MacBook в координатах mak.png (1536×1024).
 * База: top 9%, height 56.6%.
 */
const MAC_SCREEN = {
  top: "calc(9% - 10px)",
  left: "calc(14.5% + 30px)",
  right: "calc(14.5% + 30px)",
  height: "calc(56.6% + 50px)",
} as const;

export function DashboardHeroMacShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full justify-center overflow-visible", className)}>
      <div className="relative w-full max-w-[1280px] origin-center scale-[1.12] sm:scale-[1.18] lg:scale-[1.24]">
        <div className="relative w-full">
          <NextImage
            src="/images/mak.png"
            alt=""
            width={1536}
            height={1024}
            priority
            className="pointer-events-none mx-auto block h-auto w-full select-none"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div
            className="absolute overflow-hidden rounded-[8px] bg-transparent"
            style={{
              top: MAC_SCREEN.top,
              left: MAC_SCREEN.left,
              right: MAC_SCREEN.right,
              height: MAC_SCREEN.height,
            }}
          >
            <div className="size-full px-[10px]">
              <DashboardHeroJourneyPreview embedded className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
