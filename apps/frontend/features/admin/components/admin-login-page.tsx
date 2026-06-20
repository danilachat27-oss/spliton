"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import { hasAdminAccess } from "@/features/admin/lib/admin-access";
import { markAdminAccessVerified } from "@/features/admin/lib/admin-access-cache";
import { verifyAdminAccess } from "@/services/admin.service";


import { SplitonLoadingView } from "@/components/ui/spliton-loader";

import { adminCard, adminPageBg } from "@/features/admin/lib/admin-ui";
import { AdminLoginForm } from "./admin-login-form";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";

export function AdminLoginPage() {
  const a = useAdminI18n();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, accessToken } = useAuth();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user || !accessToken) {
      setChecking(false);
      return;
    }

    if (!hasAdminAccess(user.roles)) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    verifyAdminAccess(accessToken)
      .then(() => {
        markAdminAccessVerified(accessToken);
        if (!cancelled) router.replace(ROUTES.admin);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user, accessToken, router]);

  if (isLoading || checking) {
    return (
      <SplitonLoadingView
        variant="light"
        size="lg"
        fullScreen
        label={a.t("admin.login.checkingSession")}
        className={adminPageBg}
      />
    );
  }

  return (
    <div className={cn("flex min-h-dvh flex-col", adminPageBg)}>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{a.t("admin.login.title")}</h1>
            <p className="mt-2 text-sm text-zinc-500">{a.t("admin.login.subtitle")}</p>
          </div>
          <div className={adminCard("p-8")}>
            <AdminLoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-zinc-500">
            {a.t("admin.login.holderAccessPrefix")}{" "}
            <Link href={ROUTES.login} className="font-medium text-[#B7F500] underline-offset-2 hover:underline">
              {a.t("admin.login.userLoginLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
