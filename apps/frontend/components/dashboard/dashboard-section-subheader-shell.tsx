import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** @deprecated Sticky перенесён в DashboardCabinetHeaderStack. */
export const DASHBOARD_SUBHEADER_STICKY_CLASS = "";

type DashboardSectionSubheaderVariant = "white" | "muted";

const variantSurfaceClass: Record<DashboardSectionSubheaderVariant, string> = {
  white: "border-b border-neutral-100 bg-white",
  muted:
    "border-b border-neutral-200/90 bg-[#f6f7f9]/92 backdrop-blur-md supports-backdrop-filter:bg-[#f6f7f9]/88",
};

type DashboardSectionSubheaderShellProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: DashboardSectionSubheaderVariant;
};

/** Белая полоса sub-nav под основным хедером (без отдельного sticky). */
export function DashboardSectionSubheaderShell({
  children,
  className,
  innerClassName,
  variant = "white",
}: DashboardSectionSubheaderShellProps) {
  return (
    <div className={cn("w-full", variantSurfaceClass[variant], className)}>
      <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
