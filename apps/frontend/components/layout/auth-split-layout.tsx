import type * as React from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  brand: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AuthSplitLayout({
  brand,
  children,
  className,
}: AuthSplitLayoutProps) {
  return (
    <div className={cn("min-h-dvh w-full bg-white lg:bg-black", className)}>
      <DashboardHeader />

      <div className="w-full lg:grid lg:min-h-[calc(100dvh-56px)] lg:grid-cols-2">
        <div className="hidden min-h-0 lg:block lg:min-h-[calc(100dvh-56px)]">{brand}</div>

        <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center bg-white px-6 py-10 sm:min-h-[calc(100dvh-3.5rem)] sm:px-12 lg:min-h-[calc(100dvh-56px)] lg:px-16 lg:py-16">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
