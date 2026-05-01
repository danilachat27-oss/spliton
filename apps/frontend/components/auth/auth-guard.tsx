"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/providers/auth-provider";

const PUBLIC_PREFIXES = [
  ROUTES.home,
  ROUTES.login,
  ROUTES.register,
  ROUTES.verifyEmail,
  ROUTES.forgotPassword,
  ROUTES.terms,
  ROUTES.privacy,
];

const PROTECTED_PREFIXES = ["/dashboard", "/assets", "/catalog"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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
    if (isProtectedPath(pathname) && !isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}
