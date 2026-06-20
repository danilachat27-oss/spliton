"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { hasAdminAccess } from "@/features/admin/lib/admin-access";
import { cn } from "@/lib/utils";

import { AdminAccessDenied } from "./admin-access-denied";

type AdminGuardProps = {
  children: React.ReactNode;
};

/**
 * Точка расширения для вложенных маршрутов `/admin/*`: повторная проверка роли.
 * Корневой layout использует {@link AdminLayoutClient} с тем же правилом доступа.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <div
          className={cn(
            "h-9 w-9 animate-pulse rounded-xl",
            "bg-zinc-800/80",
          )}
          aria-hidden
        />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!hasAdminAccess(user.roles)) {
    return <AdminAccessDenied />;
  }

  return <>{children}</>;
}
