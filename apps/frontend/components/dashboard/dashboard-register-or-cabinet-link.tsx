"use client";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";

type DashboardRegisterOrCabinetLinkProps = {
  className?: string;
  guestLabel?: string;
  guestHref?: string;
  authLabel?: string;
  authHref?: string;
};

export function DashboardRegisterOrCabinetLink({
  className,
  guestLabel = "Регистрация",
  guestHref = ROUTES.register,
  authLabel = "К портфелю",
  authHref = ROUTES.dashboardOverview,
}: DashboardRegisterOrCabinetLinkProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Link href={authHref} className={className}>
        {authLabel}
      </Link>
    );
  }

  return (
    <Link href={guestHref} className={className}>
      {guestLabel}
    </Link>
  );
}
