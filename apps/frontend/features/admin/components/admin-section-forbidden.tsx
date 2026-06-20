"use client";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { ROUTES } from "@/constants/routes";
import { getVisibleAdminNavGroups } from "@/features/admin/config/admin-sections";
import { resolvePrimaryStaffRole } from "@/features/admin/types/admin-roles";
import { AdminRoleBadge } from "@/features/admin/ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

type AdminSectionForbiddenProps = {
  sectionTitle?: string;
};

export function AdminSectionForbidden({ sectionTitle }: AdminSectionForbiddenProps) {
  const a = useAdminI18n();
  const { user } = useAuth();
  const primary = resolvePrimaryStaffRole(user?.roles);
  const roleLabel = primary ? (a.adminRoleLabel(primary) ?? primary) : "—";
  const navGroups = getVisibleAdminNavGroups(user?.roles);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
        <h2 className="text-lg font-semibold text-zinc-100">У вашей роли нет доступа к этому разделу</h2>
        {sectionTitle ? (
          <p className="mt-2 text-sm text-zinc-400">
            Раздел «{sectionTitle}» недоступен для вашей учётной записи.
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">
            Обратитесь к администратору Spliton, если считаете, что это ошибка.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">Текущая роль:</span>
          {primary ? <AdminRoleBadge role={primary} /> : <span className="text-sm text-zinc-300">{roleLabel}</span>}
        </div>
        <Link
          href={ROUTES.admin}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Вернуться в обзор
        </Link>
        {navGroups.length > 0 ? (
          <div className="mt-6 border-t border-zinc-800 pt-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Доступные разделы</p>
            <ul className="mt-2 space-y-1">
              {navGroups.flatMap((g) => g.items).slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="text-sm text-zinc-300 hover:text-zinc-100 hover:underline">
                    {a.adminSectionLabel(item.id)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
