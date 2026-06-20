"use client";

import * as React from "react";

type PartnerApplyContextValue = {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const PartnerApplyContext = React.createContext<PartnerApplyContextValue | null>(null);

export function PartnerApplyProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const openModal = React.useCallback(() => setOpen(true), []);
  const closeModal = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      if (window.location.hash === "#partner-apply") {
        setOpen(true);
      }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const value = React.useMemo(
    () => ({ open, openModal, closeModal }),
    [open, closeModal, openModal],
  );

  return <PartnerApplyContext.Provider value={value}>{children}</PartnerApplyContext.Provider>;
}

export function usePartnerApplyModal() {
  const ctx = React.useContext(PartnerApplyContext);
  if (!ctx) {
    throw new Error("usePartnerApplyModal must be used within PartnerApplyProvider");
  }
  return ctx;
}
