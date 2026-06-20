"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { isAdminPortalPath } from "@/lib/auth/admin-portal-paths";
import { useAuth } from "@/components/providers/auth-provider";

const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  ROUTES.home,
  ROUTES.dashboard,
  ROUTES.login,
  ROUTES.register,
  ROUTES.verifyEmail,
  ROUTES.forgotPassword,
  ROUTES.terms,
  ROUTES.privacy,
]);

/** Paths that must stay accessible without login (including password reset deep links). */
const AUTH_PUBLIC_PREFIXES = ["/reset-password"] as const;

/** Marketing / catalog surfaces — browse without session; money actions still require login in UI. */
const MARKETING_PUBLIC_PREFIXES = [
  "/catalog",
  "/analytics",
  "/guide",
  "/news",
  "/fees",
  "/system-status",
  "/support",
  "/trust",
  "/referral-program",
  "/partner-program",
  "/legal",
] as const;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (AUTH_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (
    MARKETING_PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return true;
  }
  if (pathname.startsWith(`${ROUTES.dashboard}/`)) return true;
  /** Operator portal: собственный login и guards, не публичный `/login`. */
  if (isAdminPortalPath(pathname)) return true;
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isPublicPath(pathname)) {
      return;
    }
    if (!isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}
