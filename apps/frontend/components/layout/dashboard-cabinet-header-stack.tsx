"use client";

import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardHeaderOverlayProvider,
  useDashboardHeaderOverlay,
} from "@/components/layout/dashboard-header-overlay-context";

function DashboardCabinetHeaderStackInner({ subheader }: { subheader?: ReactNode }) {
  const { overlayOpen } = useDashboardHeaderOverlay();
  const showSubheader = Boolean(subheader) && !overlayOpen;

  return (
    <div className="sticky top-0 z-[110]">
      <DashboardHeader sticky={false} flushBottom={showSubheader} />
      {showSubheader ? subheader : null}
    </div>
  );
}

/** Чёрный header + белый sub-nav в одном sticky-блоке. Sub-nav скрывается при открытом megamenu. */
export function DashboardCabinetHeaderStack({ subheader }: { subheader?: ReactNode }) {
  return (
    <DashboardHeaderOverlayProvider>
      <DashboardCabinetHeaderStackInner subheader={subheader} />
    </DashboardHeaderOverlayProvider>
  );
}
