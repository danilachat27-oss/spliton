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
import { AdminSectionPanel } from "@/features/admin/components/admin-section-layout";
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
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_NOTICE } from "@/features/admin/lib/admin-section-styles";
import {
  adminAlertSurface,
  adminBtnOutline,
  adminListRow,
  adminTableHead,
  adminTile,
} from "@/features/admin/lib/admin-ui";
import { ROUTES } from "@/constants/routes";
import { listAdminRoleUsers, listAdminRoles } from "@/services/admin/adminRoles.service";
import {
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminRoleBadge,
  AdminSectionCard,
  AdminInfoHint,
  AdminStatusBadge,
  AdminTableSkeleton,
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
  { icon: LucideIcon; iconBg: string; selectedBg: string }
> = {
  SUPER_ADMIN: {
    icon: Shield,
    iconBg: "bg-[#B7F500]/10 text-[#B7F500]",
    selectedBg: "bg-[#B7F500]/[0.06]",
  },
  ADMIN: {
    icon: Shield,
    iconBg: "bg-zinc-800 text-zinc-300",
    selectedBg: "bg-zinc-800/80",
  },
  ACCOUNTANT: {
    icon: Wallet,
    iconBg: "bg-sky-500/10 text-sky-400",
    selectedBg: "bg-sky-500/[0.06]",
  },
  CONTENT_MANAGER: {
    icon: Music2,
    iconBg: "bg-violet-500/10 text-violet-400",
    selectedBg: "bg-violet-500/[0.06]",
  },
  SUPPORT_MANAGER: {
    icon: Headphones,
    iconBg: "bg-zinc-800 text-zinc-400",
    selectedBg: "bg-zinc-800/80",
  },
  COMPLIANCE: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10 text-amber-400",
    selectedBg: "bg-amber-500/[0.06]",
  },
};

const DEFAULT_CARD_META = {
  icon: Shield,
  iconBg: "bg-zinc-800 text-zinc-400",
  selectedBg: "bg-zinc-800/80",
};

type RoleUser = Awaited<ReturnType<typeof listAdminRoleUsers>>[number];

function RoleUserRow({ user }: { user: RoleUser }) {
  const a = useAdminI18n();
  const assignedLabel = a
    .t("admin.roles.assignedSince")
    .replace("{date}", formatAdminDate(user.assignedAt));

  return (
    <li>
      <Link
        href={ROUTES.adminUserDetail(user.userId)}
        className={cn(adminListRow(), "group flex items-center gap-3 px-4 py-3")}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100 group-hover:text-white">{user.email}</p>
          {user.displayName ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{user.displayName}</p>
          ) : null}
        </div>
        <AdminCopyButton value={user.userId} label={a.t("admin.ui.copyId")} />
        <span className="hidden shrink-0 text-xs tabular-nums text-zinc-500 sm:inline">{assignedLabel}</span>
        <ChevronRight
          className="size-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-300"
          aria-hidden
        />
      </Link>
    </li>
  );
}

function RoleUsersLink({
  roleCode,
  className,
  label,
  onClick,
}: {
  roleCode: string;
  className?: string;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={`${ROUTES.adminUsers}?role=${encodeURIComponent(roleCode)}`}
      className={cn(
        adminBtnOutline,
        "inline-flex h-9 w-full items-center justify-between gap-2 px-3.5 text-xs font-semibold",
        className,
      )}
      onClick={onClick}
    >
      <span>{label}</span>
      <ChevronRight className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
    </Link>
  );
}

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
        adminTile,
        "group relative flex h-full flex-col px-4 py-4 text-left transition-colors sm:px-5 sm:py-5",
        selected ? meta.selectedBg : "hover:bg-zinc-800/50",
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

      <RoleUsersLink
        roleCode={role.code}
        label={a.t("admin.roles.viewUsers")}
        className="mt-4"
        onClick={(e) => e.stopPropagation()}
      />
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
        actions={
          <AdminInfoHint
            size="md"
            placement="bottom-end"
            iconClassName="size-9 rounded-xl"
            panelClassName="max-w-sm"
            text={
              <>
                Права в Spliton статичны и привязаны к роли. Отдельного редактора прав нет — доступ
                определяется только набором ролей пользователя.
              </>
            }
          />
        }
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

      <AdminSectionPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              {selectedCode
                ? a.t("admin.roles.usersWithRole").replace("{role}", a.adminRoleLabel(selectedCode))
                : a.t("admin.roles.usersByRole")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedRole
                ? a.formatRoleUserCount(selectedRole.userCount)
                : a.t("admin.roles.selectRoleHint")}
            </p>
          </div>
          {selectedCode ? (
            <RoleUsersLink
              roleCode={selectedCode}
              label={a.t("admin.roles.viewAllUsers")}
              className="h-8 w-auto shrink-0 px-3 text-xs"
            />
          ) : null}
        </div>

        {usersLoading ? (
          <AdminTableSkeleton rows={Math.min(selectedRole?.userCount ?? 3, 5) || 3} />
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-500">{a.t("admin.roles.noUsers")}</p>
        ) : (
          <ul className="space-y-1.5">
            {users.map((u) => (
              <RoleUserRow key={u.userId} user={u} />
            ))}
          </ul>
        )}

        {canManageRoles ? (
          <div className={cn(ADMIN_SECTION_NOTICE, adminAlertSurface("warning"))}>
            <AlertTriangle className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
            <p className="text-xs leading-relaxed">{a.t("admin.roles.superAdminNotice")}</p>
          </div>
        ) : null}
      </AdminSectionPanel>
    </AdminPageShell>
  );
}
