"use client";

import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { cn } from "@/lib/utils";

type SecondaryMarketDetailShellProps = {
  children: ReactNode;
  /** Vertically center content in the area below the header. */
  center?: boolean;
  className?: string;
};

export function SecondaryMarketDetailShell({
  children,
  center = false,
  className,
}: SecondaryMarketDetailShellProps) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black text-white">
      <div className="shrink-0">
        <DashboardHeader sticky={false} />
      </div>
      {center ? (
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 text-center",
            className,
          )}
        >
          {children}
        </main>
      ) : (
        <div
          className={cn(
            "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain",
            className,
          )}
          data-mobile-scroll-root
        >
          {children}
        </div>
      )}
    </div>
  );
}
