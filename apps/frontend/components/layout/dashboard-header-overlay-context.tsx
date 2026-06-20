"use client";

import * as React from "react";

type DashboardHeaderOverlayContextValue = {
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
};

const DashboardHeaderOverlayContext = React.createContext<DashboardHeaderOverlayContextValue>({
  overlayOpen: false,
  setOverlayOpen: () => {},
});

export function DashboardHeaderOverlayProvider({ children }: { children: React.ReactNode }) {
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const value = React.useMemo(() => ({ overlayOpen, setOverlayOpen }), [overlayOpen]);
  return (
    <DashboardHeaderOverlayContext.Provider value={value}>{children}</DashboardHeaderOverlayContext.Provider>
  );
}

export function useDashboardHeaderOverlay() {
  return React.useContext(DashboardHeaderOverlayContext);
}
