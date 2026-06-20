"use client";

import * as React from "react";
import Link from "next/link";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AlertTriangle,
  ChevronRight,
  Headphones,
  Music2,
  Shield,
  Wallet,
  type LucideIcon,
} from "@/lib/lucide";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import {
  PERMISSION_AREA_LABELS,
  PERMISSION_MATRIX,
  PERMISSION_MATRIX_COLUMNS,
  ROLE_DESCRIPTIONS,
  type PermissionArea,
  type PermissionLevel,
} from "@/features/admin/config/admin-permissions";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAuth } from "@/components/providers/auth-provider";
import { canAssignUserRoles } from "@/features/admin/config/admin-rbac";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { adminTableHead } from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { listAdminRoleUsers, listAdminRoles } from "@/services/admin/adminRoles.service";
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminRoleBadge,
  AdminSectionCard,
  AdminSectionInfoHint,
  AdminStatusBadge,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { cn } from "@/lib/utils";

const LEVEL_TONE: Record<PermissionLevel, "success" | "neutral" | "warning" | "danger"> = {
  full: "success",
  read: "neutral",
  limited: "warning",
  none: "danger",
};

const ROLE_CARD_META: Record<
  string,
  { icon: LucideIcon; accent: string; selected: string; iconBg: string }
> = {
  SUPER_ADMIN: {
    icon: Shield,
    accent: "hover:border-[#B7F500]/30",
    selected: "border-[#B7F500]/40 bg-zinc-900 ring-1 ring-[#B7F500]/20",
    iconBg: "bg-zinc-800 text-[#B7F500]",
  },
  ADMIN: {
    icon: Shield,
    accent: "hover:border-zinc-600",
    selected: "border-zinc-500/50 bg-zinc-900 ring-1 ring-zinc-500/20",
    iconBg: "bg-zinc-800 text-zinc-300",
  },
  ACCOUNTANT: {
    icon: Wallet,
    accent: "hover:border-sky-700/50",
    selected: "border-sky-500/40 bg-zinc-900 ring-1 ring-sky-500/20",
    iconBg: "bg-sky-950 text-sky-400",
  },
  CONTENT_MANAGER: {
    icon: Music2,
    accent: "hover:border-violet-700/50",
    selected: "border-violet-500/40 bg-zinc-900 ring-1 ring-violet-500/20",
    iconBg: "bg-violet-950 text-violet-400",
  },
  SUPPORT_MANAGER: {
    icon: Headphones,
    accent: "hover:border-zinc-600",
    selected: "border-zinc-400/40 bg-zinc-900 ring-1 ring-zinc-400/20",
    iconBg: "bg-zinc-800 text-zinc-400",
  },
  COMPLIANCE: {
    icon: AlertTriangle,
    accent: "hover:border-amber-700/50",
    selected: "border-amber-500/40 bg-zinc-900 ring-1 ring-amber-500/20",
    iconBg: "bg-amber-950 text-amber-400",
  },
};

const DEFAULT_CARD_META = {
  icon: Shield,
  accent: "hover:border-zinc-700",
  selected: "border-zinc-600/50 bg-zinc-900 ring-1 ring-zinc-600/20",
  iconBg: "bg-zinc-800 text-zinc-400",
};

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: Awaited<ReturnType<typeof listAdminRoles>>[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const a = useAdminI18n();
  const meta = ROLE_CARD_META[role.code] ?? DEFAULT_CARD_META;
  const Icon = meta.icon;
  const description =
    ROLE_DESCRIPTIONS[role.code as keyof typeof ROLE_DESCRIPTIONS] ??
    a.adminRoleLabel(role.code);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        ADMIN_SECTION_TILE,
        "group relative flex h-full flex-col border text-left transition-all duration-200",
        selected ? meta.selected : cn("border-zinc-800 bg-zinc-900/80", meta.accent),
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.iconBg)}>
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </div>
        <AdminRoleBadge role={role.code} />
      </div>

      <p className="min-h-[2.5rem] text-sm leading-relaxed text-zinc-400">{description}</p>

      <div className="mt-auto pt-5">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-100">
          {role.userCount}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{a.formatRoleUserCount(role.userCount)}</p>
      </div>

      <Link
        href={`${ROUTES.adminUsers}?role=${encodeURIComponent(role.code)}`}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition-colors group-hover:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        Пользователи с этой ролью
        <ChevronRight className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </button>
  );
}

export function RolesSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const canManageRoles = canAssignUserRoles(user?.roles);
  const [roles, setRoles] = React.useState<Awaited<ReturnType<typeof listAdminRoles>>>([]);
  const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<Awaited<ReturnType<typeof listAdminRoleUsers>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const areas = Object.keys(PERMISSION_MATRIX) as PermissionArea[];
  const selectedRole = roles.find((r) => r.code === selectedCode);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(false);
    listAdminRoles(client)
      .then((r) => {
        setRoles(r);
        if (!selectedCode && r[0]) setSelectedCode(r[0].code);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [client, selectedCode]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!selectedCode) return;
    setUsersLoading(true);
    listAdminRoleUsers(selectedCode, client)
      .then(setUsers)
      .finally(() => setUsersLoading(false));
  }, [selectedCode, client]);

  if (loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label={a.t("admin.loading.roles")} />
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell>
        <AdminErrorState onRetry={load} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={a.adminSectionLabel("roles")}
        description={
          canManageRoles
            ? "Обзор ролей и матрицы прав Spliton. Назначение и снятие ролей — в разделе «Пользователи»."
            : "Обзор ролей и матрицы прав (только чтение). Назначение ролей доступно только главному администратору."
        }
        breadcrumbs={a.adminBreadcrumbs(a.adminSectionLabel("roles"))}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard
            key={role.code}
            role={role}
            selected={selectedCode === role.code}
            onSelect={() => setSelectedCode(role.code)}
          />
        ))}
      </div>

      <AdminSectionInfoHint className="mb-6">
        Права в Spliton статичны и привязаны к роли. Отдельного редактора прав нет — доступ
        определяется только набором ролей пользователя.
      </AdminSectionInfoHint>

      <AdminSectionCard
        title={a.t("admin.title.permissionMatrix")}
        description="Уровни доступа по разделам для каждой роли сотрудника"
        className="mb-6"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className={cn(adminTableHead, "sticky left-0 z-10 bg-zinc-900/95 px-5 py-3 text-zinc-400")}>
                  Раздел
                </th>
                {PERMISSION_MATRIX_COLUMNS.map((col) => (
                  <th key={col.key} className={cn(adminTableHead, "px-3 py-3 text-center text-zinc-400")}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((area, index) => (
                <tr
                  key={area}
                  className={cn(
                    "border-b border-zinc-800/80 transition-colors last:border-b-0 hover:bg-zinc-800/40",
                    index % 2 === 1 && "bg-zinc-900/40",
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-5 py-3 font-medium text-zinc-200">
                    {PERMISSION_AREA_LABELS[area]}
                  </td>
                  {PERMISSION_MATRIX_COLUMNS.map((col) => {
                    const level = PERMISSION_MATRIX[area][col.key];
                    return (
                      <td key={col.key} className="px-3 py-3 text-center">
                        <AdminStatusBadge
                          label={a.permissionLevelLabel(level)!}
                          tone={LEVEL_TONE[level]}
                          className="whitespace-nowrap"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title={
          selectedCode
            ? `Пользователи с ролью «${a.adminRoleLabel(selectedCode)}»`
            : "Пользователи по роли"
        }
        description={
          selectedRole
            ? a.formatRoleUserCount(selectedRole.userCount)
            : "Выберите роль в карточках выше"
        }
      >
        {usersLoading ? (
          <AdminLoadingState label={a.t("admin.loading.users")} />
        ) : users.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-6 text-center text-sm text-zinc-500">
            Нет пользователей с этой ролью
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
            {users.map((u) => (
              <li
                key={u.userId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-zinc-900/80 px-4 py-3 transition-colors hover:bg-zinc-800/60"
              >
                <span className="font-medium text-zinc-100">{u.email}</span>
                {u.displayName ? (
                  <span className="text-sm text-zinc-500">{u.displayName}</span>
                ) : null}
                <AdminCopyButton value={u.userId} label={a.t("admin.ui.copyId")} />
                <span className="ml-auto text-xs tabular-nums text-zinc-400">
                  с {u.assignedAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {selectedCode ? (
          <Link
            href={`${ROUTES.adminUsers}?role=${encodeURIComponent(selectedCode)}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-100 underline-offset-4 hover:underline"
          >
            Все пользователи с этой ролью
            <ChevronRight className="size-4" />
          </Link>
        ) : null}
        {canManageRoles ? (
          <p className="mt-4 rounded-xl border border-amber-800/40 bg-amber-950/20 px-3 py-2.5 text-xs leading-relaxed text-amber-200/90">
            Назначение роли главного администратора требует ввода фразы подтверждения и записи в
            журнал аудита.
          </p>
        ) : null}
      </AdminSectionCard>
    </AdminPageShell>
  );
}
