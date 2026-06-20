import type { ReactNode } from "react";

import { DashboardCabinetHeaderStack } from "@/components/layout/dashboard-cabinet-header-stack";
import { cn } from "@/lib/utils";

const defaultContentClass =
  "mx-auto w-full max-w-[1200px] px-4 pb-5 pt-3 sm:px-6 sm:pt-4 lg:px-8";

/** Кабинет: sticky header stack + контент на #f6f7f9. */
export function DashboardAppShell({
  children,
  subheader,
  contentClassName,
  mainClassName,
}: {
  children: ReactNode;
  subheader?: ReactNode;
  contentClassName?: string;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <DashboardCabinetHeaderStack subheader={subheader} />
      <main className={cn("scheme-light flex-1 text-neutral-900", mainClassName)}>
        <div className={cn(defaultContentClass, contentClassName)}>{children}</div>
      </main>
    </div>
  );
}
