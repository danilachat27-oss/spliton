"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  isAdminAccessVerified,
  markAdminAccessVerified,
} from "@/features/admin/lib/admin-access-cache";
import { hasAdminAccess } from "@/features/admin/lib/admin-access";
import { verifyAdminAccess } from "@/services/admin.service";

import { AdminAccessDenied } from "./admin-access-denied";
import { AdminHeader } from "./admin-header";
import { AdminMobileNavProvider } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";
import { adminPageBg } from "@/features/admin/lib/admin-ui";
import { SplitonLoadingView } from "@/components/ui/spliton-loader";
import { SystemAnnouncementBanners } from "@/components/system-announcements/system-announcement-banners";
import { cn } from "@/lib/utils";

function LayoutSpinner() {
  return <SplitonLoadingView variant="dark" size="lg" fullScreen />;
}

function useAdminServerAccess(
  user: ReturnType<typeof useAuth>["user"],
  accessToken: string | null,
): boolean | null {
  const [serverAccess, setServerAccess] = React.useState<boolean | null>(() => {
    if (!accessToken || !user || !hasAdminAccess(user.roles)) return null;
    if (isAdminAccessVerified(accessToken)) return true;
    if (hasAdminAccess(user.roles)) return true;
    return null;
  });

  React.useEffect(() => {
    if (!user || !hasAdminAccess(user.roles) || !accessToken) {
      setServerAccess(null);
      return;
    }

    if (isAdminAccessVerified(accessToken)) {
      setServerAccess(true);
      return;
    }

    let cancelled = false;

    verifyAdminAccess(accessToken)
      .then(() => {
        markAdminAccessVerified(accessToken);
        if (!cancelled) setServerAccess(true);
      })
      .catch(() => {
        if (!cancelled) setServerAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, accessToken]);

  return serverAccess;
}

type AdminLayoutClientProps = {
  children: React.ReactNode;
};

/**
 * Operator portal: JWT session + staff role + `GET /admin/access`.
 * Неавторизованных отправляет на `/admin/login` (не на публичный `/login`).
 */
export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const a = useAdminI18n();
  const router = useRouter();
  const { user, accessToken, isLoading, isAuthenticated } = useAuth();
  const serverAccess = useAdminServerAccess(user, accessToken);

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(ROUTES.adminLogin);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <LayoutSpinner />;
  if (!isAuthenticated || !user) return <LayoutSpinner />;

  if (!hasAdminAccess(user.roles)) {
    return (
      <AdminAccessDenied
        reason="staff_role"
        onSignOutRedirect={ROUTES.adminLogin}
      />
    );
  }

  if (serverAccess === false) {
    return (
      <AdminAccessDenied
        reason="server"
        onSignOutRedirect={ROUTES.adminLogin}
      />
    );
  }

    return (
    <AdminMobileNavProvider>
    <div className="admin-portal flex h-dvh min-h-0 flex-col antialiased">
      <AdminHeader />
      <SystemAnnouncementBanners surface="admin" />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar />
        <main className={cn("relative z-0 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden", adminPageBg)}>
          {serverAccess === null ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-zinc-950/95 px-4 py-2 text-center text-xs text-zinc-500 backdrop-blur-sm"
              role="status"
            >
              {a.verifyingAccess}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
    </AdminMobileNavProvider>
  );
}
