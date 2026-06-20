"use client";

import Link from "next/link";
import { ShieldOff } from "@/lib/lucide";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import { adminCard } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

type AdminAccessDeniedProps = {
  reason?: "staff_role" | "server";
  onSignOutRedirect?: string;
};

export function AdminAccessDenied({
  reason = "staff_role",
  onSignOutRedirect = ROUTES.adminLogin,
}: AdminAccessDeniedProps) {
  const { logout } = useAuth();

  const description =
    reason === "server"
      ? "Сервер отклонил доступ к операторской панели. Роль должна быть назначена в базе и подтверждена через API."
      : "У аккаунта нет staff-роли (Super Admin, Accountant, Content Manager, Support Manager, Compliance). Обычные пользователи (USER / Holder) не имеют доступа.";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-20">
      <div className={adminCard("max-w-md px-8 py-10 text-center")}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100">
          <ShieldOff className="size-6 text-zinc-500" aria-hidden />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-zinc-100">Доступ запрещён</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={async () => {
              await logout();
              window.location.href = onSignOutRedirect;
            }}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium",
              "bg-zinc-900 text-white hover:bg-zinc-800",
            )}
          >
            Выйти
          </button>
          <Link
            href={ROUTES.home}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60"
          >
            На сайт
          </Link>
        </div>
      </div>
    </div>
  );
}
