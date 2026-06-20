"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

type AdminMobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AdminMobileNavContext = React.createContext<AdminMobileNavContextValue | null>(null);

export function AdminMobileNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = React.useMemo(() => ({ open, setOpen }), [open]);

  return <AdminMobileNavContext.Provider value={value}>{children}</AdminMobileNavContext.Provider>;
}

export function useAdminMobileNav(): AdminMobileNavContextValue {
  const ctx = React.useContext(AdminMobileNavContext);
  if (!ctx) {
    throw new Error("useAdminMobileNav must be used within AdminMobileNavProvider");
  }
  return ctx;
}
