import type { ReactNode } from "react";

import { DashboardCabinetHeaderStack } from "@/components/layout/dashboard-cabinet-header-stack";
import { cn } from "@/lib/utils";

const assetsContentClass =
  "mx-auto w-full max-w-[1200px] px-4 pb-5 pt-3 sm:px-6 sm:pt-4 lg:px-8 [--assets-sticky-offset:7rem]";

/** Контент assets: sticky header stack + отступ только у body. */
export function AssetsPageShell({
  subheader,
  children,
  className,
  contentClassName,
}: {
  subheader?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={className}>
      <DashboardCabinetHeaderStack subheader={subheader} />
      <div className={cn(assetsContentClass, contentClassName)}>{children}</div>
    </div>
  );
}
