"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { adminBtnPrimary } from "@/features/admin/lib/admin-ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAdminPaginatedList } from "@/features/admin/hooks/use-admin-paginated-list";
import { useAuth } from "@/components/providers/auth-provider";
import { canAssignUserRoles } from "@/features/admin/config/admin-rbac";
import type { AdminListQuery } from "@/features/admin/api/types";
import type { AdminUserListItem } from "@/features/admin/mocks/admin-users.mock";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ROUTES } from "@/constants/routes";
import {
  AdminDataTable,
  AdminDetailDrawer,
  AdminFormFooter,
  AdminFilterBar,
  AdminPagination,
  AdminReadOnlyBanner,
  AdminRoleBadge,
  AdminSectionKpiCard,
  AdminSectionKpiCardSkeleton,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  getAdminUsersListStats,
  listAdminUsersPaginated,
  type AdminUsersListStats,
} from "@/services/admin/adminUsers.service";
import { STAFF_ROLE_CODES } from "@/features/admin/types/admin-roles";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "pending"> = {
  ACTIVE: "success",
  PENDING_EMAIL_VERIFICATION: "pending",
  SUSPENDED: "warning",
  BANNED: "danger",
};

export function UsersSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const actorRoles = user?.roles;
  const readOnly = !canAssignUserRoles(actorRoles);

  const loader = React.useCallback(
    (q: AdminListQuery) => listAdminUsersPaginated(q, client),
    [client],
  );
  const { data: page, loading, error, query, setQuery, reload } = useAdminPaginatedList(loader);
  const rows = page.items;

  const [stats, setStats] = React.useState<AdminUsersListStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState(() => searchParams.get("role") ?? "all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [registeredFrom, setRegisteredFrom] = React.useState("");
  const [preview, setPreview] = React.useState<AdminUserListItem | null>(null);

  React.useEffect(() => {
    setStatsLoading(true);
    getAdminUsersListStats(client)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [client, page.total]);

  React.useEffect(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      search: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      dateFrom: registeredFrom || undefined,
    }));
  }, [search, roleFilter, statusFilter, registeredFrom, setQuery]);

  const columns: AdminColumn<AdminUserListItem>[] = [
    {
      key: "user",
      header: "Пользователь",
      render: (r) => (
        <div>
          <p className="font-medium text-zinc-100">{r.email}</p>
          <p className="text-xs text-zinc-500">{r.name ?? r.id}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: a.table.roles,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.slice(0, 3).map((role) => (
            <AdminRoleBadge key={role} role={role} />
          ))}
          {r.roles.length > 3 ? (
            <span className="text-xs text-zinc-500">+{r.roles.length - 3}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminStatusBadge label={a.formatAdminStatus(r.status)} tone={STATUS_TONE[r.status] ?? "neutral"} />
      ),
    },
    {
      key: "bal",
      header: a.table.available,
      render: (r) => formatUsdtAmount(r.availableBalanceUsdt),
    },
    {
      key: "created",
      header: a.table.created,
      render: (r) => formatAdminDate(r.createdAt),
    },
    {
      key: "open",
      header: "",
      render: (r) => (
        <Link
          href={ROUTES.adminUserDetail(r.id)}
          className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium hover:bg-zinc-800/60"
          onClick={(e) => e.stopPropagation()}
        >
          Открыть профиль
        </Link>
      ),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="users"
      title={a.adminSectionLabel("users")}
      actions={<AdminSectionRefreshButton onClick={reload} />}
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("users")} /> : null}

      <div className="mb-4 grid min-w-0 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <AdminSectionKpiCardSkeleton />
            <AdminSectionKpiCardSkeleton />
            <AdminSectionKpiCardSkeleton />
            <AdminSectionKpiCardSkeleton />
          </>
        ) : stats ? (
          <>
            <AdminSectionKpiCard label={a.t("admin.kpi.users.total")} value={stats.total} />
            <AdminSectionKpiCard
              label={a.t("admin.kpi.users.active")}
              value={stats.active}
              activeTone="success"
            />
            <AdminSectionKpiCard
              label={a.t("admin.kpi.users.blocked")}
              value={stats.blocked}
              activeTone="danger"
              hint={a.t("admin.kpi.users.blockedHint")}
            />
            <AdminSectionKpiCard label={a.t("admin.kpi.users.staff")} value={stats.staff} activeTone="neutral" />
          </>
        ) : null}
      </div>

      <AdminSectionPanel>
        <AdminFilterBar
          className="!rounded-2xl !border-0 !bg-zinc-900/40 !p-4 !shadow-none"
          fields={[
            {
              id: "search",
              label: "Поиск",
              type: "search",
              value: search,
              onChange: setSearch,
              placeholder: "Email, имя, ID…",
            },
            {
              id: "role",
              label: a.table.roles,
              type: "select",
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: "all", label: a.actions.allRoles },
                ...STAFF_ROLE_CODES.map((value) => ({
                  value,
                  label: a.adminRoleLabel(value),
                })),
              ],
            },
            {
              id: "status",
              label: a.table.status,
              type: "select",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: a.actions.allStatuses },
                { value: "ACTIVE", label: a.formatAdminStatus("active") },
                { value: "SUSPENDED", label: a.formatAdminStatus("suspended") },
                { value: "BANNED", label: a.formatAdminStatus("blocked") },
              ],
            },
            {
              id: "reg",
              label: "Регистрация с",
              type: "date",
              value: registeredFrom,
              onChange: setRegisteredFrom,
            },
          ]}
        />

        <AdminSectionDataArea
          loading={loading}
          error={error}
          onRetry={reload}
          loadingLabel="Загрузка пользователей…"
        >
          <AdminDataTable
            flat
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(ROUTES.adminUserDetail(r.id))}
            emptyMessage={a.empty.noData}
          />
          <AdminPagination
            page={query.page ?? 1}
            pageSize={query.pageSize ?? 20}
            total={page.total}
            onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </AdminSectionDataArea>
      </AdminSectionPanel>

      <AdminDetailDrawer
        open={Boolean(preview)}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.email ?? ""}
        subtitle={preview?.id}
        footer={
          preview ? (
            <AdminFormFooter
              right={
                <Link
                  href={ROUTES.adminUserDetail(preview.id)}
                  className={cn(adminBtnPrimary, "inline-flex items-center justify-center")}
                >
                  Открыть полный профиль
                </Link>
              }
            />
          ) : null
        }
      >
        {preview ? (
          <p className="text-sm text-zinc-400">
            Быстрый просмотр. Управление ролями и блокировкой — в карточке пользователя.
          </p>
        ) : null}
      </AdminDetailDrawer>
    </AdminSectionShell>
  );
}
