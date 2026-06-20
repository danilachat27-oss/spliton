"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { DashboardMobileProfileDrawer } from "@/components/dashboard/dashboard-mobile-profile-drawer";
import { DashboardMobileTabBar } from "@/components/dashboard/dashboard-mobile-tab-bar";
import { useAuth } from "@/components/providers/auth-provider";

type MobileTabBarShellContextValue = {
  setTabBarHidden: (hidden: boolean) => void;
  profileOpen: boolean;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
};

const MobileTabBarShellContext = React.createContext<MobileTabBarShellContextValue>({
  setTabBarHidden: () => {},
  profileOpen: false,
  openProfileDrawer: () => {},
  closeProfileDrawer: () => {},
});

export function useMobileTabBarShell() {
  return React.useContext(MobileTabBarShellContext);
}

function shouldHideTabBarOnRoute(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/admin") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  );
}

export function MobileTabBarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [portalReady, setPortalReady] = React.useState(false);
  const [tabBarHidden, setTabBarHidden] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const openProfileDrawer = React.useCallback(() => setProfileOpen(true), []);
  const closeProfileDrawer = React.useCallback(() => setProfileOpen(false), []);

  React.useEffect(() => {
    setPortalReady(true);
  }, []);

  React.useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const routeHidden = shouldHideTabBarOnRoute(pathname);
  const hidden = routeHidden || tabBarHidden;

  const contextValue = React.useMemo(
    () => ({
      setTabBarHidden,
      profileOpen,
      openProfileDrawer,
      closeProfileDrawer,
    }),
    [profileOpen, openProfileDrawer, closeProfileDrawer],
  );

  const tabBarLayer =
    portalReady && !routeHidden
      ? createPortal(
          <DashboardMobileTabBar
            hidden={hidden}
            profileOpen={profileOpen}
            onProfileOpenChange={(open) => (open ? openProfileDrawer() : closeProfileDrawer())}
          />,
          document.body,
        )
      : null;

  const profileDrawerLayer =
    portalReady && isAuthenticated && profileOpen
      ? createPortal(
          <DashboardMobileProfileDrawer open={profileOpen} onClose={closeProfileDrawer} />,
          document.body,
        )
      : null;

  return (
    <MobileTabBarShellContext.Provider value={contextValue}>
      {children}
      {tabBarLayer}
      {profileDrawerLayer}
    </MobileTabBarShellContext.Provider>
  );
}
