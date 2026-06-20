"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "@/lib/lucide";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminStyledSelect } from "@/features/admin/ui/admin-styled-select";
import { ROUTES } from "@/constants/routes";
import { AdminRoleAssignDialog } from "@/features/admin/components/admin-role-assign-dialog";
import { AdminRoleRemoveDialog } from "@/features/admin/components/admin-role-remove-dialog";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionShell,
  AdminSectionTabBar,
} from "@/features/admin/components/admin-section-layout";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canAssignUserRoles,
  canBlockUsers,
  canRemoveUserRoles,
} from "@/features/admin/config/admin-rbac";
import {
  canAccessUserDetailTab,
  isReadOnlyAdminArea,
  visibleUserDetailTabs,
  type UserDetailTab,
} from "@/features/admin/lib/admin-action-permissions";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import type { StaffRoleCode } from "@/features/admin/types/admin-roles";
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminErrorState,
  AdminLoadingState,
  AdminLocalizedStatusBadge,
  AdminReadOnlyBanner,
  AdminRoleBadge,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import {
  assignAdminUserRole,
  blockAdminUser,
  getAdminUser,
  removeAdminUserRole,
  unblockAdminUser,
  type AdminUserDetail,
} from "@/services/admin/adminUsers.service";
import {
  getAdminUserOperatorContext,
  getAdminUserWallet,
  listAdminUserAuditLogs,
  listAdminUserComplianceFlags,
  listAdminUserSupportTickets,
  listAdminUserWalletTransactions,
  type AdminUserOperatorContext,
} from "@/services/admin/adminUserContext.service";
import { useAdminSectionTab } from "@/features/admin/hooks/use-admin-section-tab";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "pending"> = {
  ACTIVE: "success",
  PENDING_EMAIL_VERIFICATION: "pending",
  SUSPENDED: "warning",
  BANNED: "danger",
};

type WalletTxRow = {
  id: string;
  txType: string;
  amountUsdt: string;
};

const TAB_LABELS: Record<UserDetailTab, string> = {
  overview: "Обзор",
  account: "Аккаунт и доступ",
  security: "Безопасность",
  roles: "Роли и доступ",
  wallet: "Кошелёк",
  audit: "Активность / аудит",
  risk: "Риск / Compliance",
  support: "Поддержка",
};

export function UserDetailSection() {
  const a = useAdminI18n();
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.id === "string" ? params.id : "";
  const client = useAdminApi();
  const { user: actor } = useAuth();
  const actorRoles = actor?.roles;

  const tabs = visibleUserDetailTabs(actorRoles);
  const [tab, setTab] = useAdminSectionTab<UserDetailTab>(
    tabs.length ? tabs : ["overview"],
    tabs[0] ?? "overview",
  );

  const canAssign = canAssignUserRoles(actorRoles);
  const canRemove = canRemoveUserRoles(actorRoles);
  const canBlock = canBlockUsers(actorRoles);
  const walletReadOnly = isReadOnlyAdminArea(actorRoles, "Wallets");

  const [profile, setProfile] = React.useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [roleDialog, setRoleDialog] = React.useState(false);
  const [removeDialog, setRemoveDialog] = React.useState(false);
  const [confirmBlock, setConfirmBlock] = React.useState(false);
  const [confirmUnblock, setConfirmUnblock] = React.useState(false);
  const [adminNote, setAdminNote] = React.useState("");

  const [wallet, setWallet] = React.useState<Awaited<ReturnType<typeof getAdminUserWallet>>>(null);
  const [walletTx, setWalletTx] = React.useState<WalletTxRow[]>([]);
  const [auditRows, setAuditRows] = React.useState<
    Awaited<ReturnType<typeof listAdminUserAuditLogs>>["items"]
  >([]);
  const [complianceRows, setComplianceRows] = React.useState<
    Awaited<ReturnType<typeof listAdminUserComplianceFlags>>["items"]
  >([]);
  const [ticketRows, setTicketRows] = React.useState<
    Awaited<ReturnType<typeof listAdminUserSupportTickets>>["items"]
  >([]);
  const [operatorContext, setOperatorContext] = React.useState<AdminUserOperatorContext | null>(null);
  const [tabLoading, setTabLoading] = React.useState(false);
  const [auditFilter, setAuditFilter] = React.useState("all");

  const loadProfile = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const row = await getAdminUser(userId, client);
      if (!row) {
        setError(true);
        setProfile(null);
      } else {
        setProfile(row);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, client]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    if (!userId || !profile) return;
    if (!canAccessUserDetailTab(actorRoles, tab)) return;

    setTabLoading(true);
    const run = async () => {
      try {
        if (tab === "wallet") {
          const w = await getAdminUserWallet(userId, client);
          setWallet(w);
          const tx = await listAdminUserWalletTransactions(userId, { pageSize: 10 }, client);
          setWalletTx(tx.items as WalletTxRow[]);
        } else if (tab === "audit") {
          const res = await listAdminUserAuditLogs(userId, { pageSize: 50 }, client);
          let items = res.items as typeof auditRows;
          if (auditFilter !== "all") {
            items = items.filter((r) => (r.action ?? "").includes(auditFilter));
          }
          setAuditRows(items.slice(0, 20));
        } else if (tab === "risk") {
          const res = await listAdminUserComplianceFlags(userId, { pageSize: 20 }, client);
          setComplianceRows(res.items as typeof complianceRows);
        } else if (tab === "support") {
          const res = await listAdminUserSupportTickets(userId, { pageSize: 20 }, client);
          setTicketRows(res.items as typeof ticketRows);
        } else if (tab === "account" || tab === "security") {
          const ctx = await getAdminUserOperatorContext(userId, client);
          setOperatorContext(ctx);
        }
      } finally {
        setTabLoading(false);
      }
    };
    void run();
  }, [tab, userId, profile, client, actorRoles, auditFilter]);

  if (!userId) {
    return <AdminErrorState message="Некорректный ID пользователя" onRetry={() => router.push(ROUTES.adminUsers)} />;
  }

  if (loading) {
    return <AdminLoadingState label={a.t("admin.loading.profile")} />;
  }

  if (error || !profile) {
    return (
      <AdminErrorState
        message="Пользователь не найден или недоступен"
        onRetry={() => void loadProfile()}
      />
    );
  }

  const auditColumns: AdminColumn<{ id: string; action?: string; createdAt: string; actorEmail?: string }>[] = [
    { key: "at", header: a.table.created, render: (r) => formatAdminDate(r.createdAt) },
    { key: "action", header: "Событие", render: (r) => r.action ?? "—" },
    { key: "actor", header: "Инициатор", render: (r) => r.actorEmail ?? "—" },
  ];

  const isBlocked = profile.status === "SUSPENDED" || profile.status === "BANNED";

  return (
    <AdminSectionShell
      sectionId="users"
      title={profile.name ?? profile.email}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ROUTES.adminUsers}
            className="inline-flex h-8 items-center rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm font-medium text-zinc-100 hover:bg-zinc-800/60"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            К списку
          </Link>
          {canBlock && !isBlocked ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => setConfirmBlock(true)}>
              {a.actions.block}
            </Button>
          ) : null}
          {canBlock && isBlocked ? (
            <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => setConfirmUnblock(true)}>
              {a.actions.unblock}
            </Button>
          ) : null}
        </div>
      }
    >
      <header className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-zinc-500">{profile.id}</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-100">{profile.name ?? "—"}</h1>
            <p className="text-sm text-zinc-400">{profile.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <AdminStatusBadge
              label={a.formatAdminStatus(profile.status)}
              tone={STATUS_TONE[profile.status] ?? "neutral"}
            />
            <p className="text-xs text-zinc-500">Регистрация: {formatAdminDate(profile.createdAt)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {profile.roles.map((role) => (
            <AdminRoleBadge key={role} role={role} />
          ))}
        </div>
      </header>

      {tabs.length > 1 ? (
        <AdminSectionTabBar
          tabs={tabs.map((id) => ({ id, label: TAB_LABELS[id] }))}
          activeId={tab}
          onChange={(id) => setTab(id as UserDetailTab)}
          className="mb-4"
        />
      ) : null}

      <AdminSectionPanel>
        {tab === "overview" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Базовая информация</h3>
              <dl className="grid gap-2">
                <div>
                  <dt className="text-zinc-500">{a.table.status}</dt>
                  <dd>{a.formatAdminStatus(profile.status)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.table.available}</dt>
                  <dd className="font-medium">{formatUsdtAmount(profile.availableBalanceUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.table.locked}</dt>
                  <dd>{formatUsdtAmount(profile.lockedBalanceUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.table.units}</dt>
                  <dd>{profile.totalHoldingsUnits}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">KYC</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <span>{profile.kycStatus ?? "—"}</span>
                    {profile.kycStatus?.toUpperCase() === "PENDING" ? (
                      <Link
                        href={ROUTES.adminKyc}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Очередь KYC →
                      </Link>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Последняя активность</dt>
                  <dd>{formatAdminDate(profile.lastActivityAt)}</dd>
                </div>
              </dl>
            </section>
            <section className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ключевые метрики</h3>
              <p className="text-zinc-400">
                Детальная аналитика по пользователю будет расширена на следующем этапе. Сейчас отображаются
                данные из карточки пользователя Spliton.
              </p>
              {canAccessUserDetailTab(actorRoles, "audit") ? (
                <Button type="button" variant="ghost" className={adminBtnOutline} size="sm" onClick={() => setTab("audit")}>
                  Открыть журнал активности
                </Button>
              ) : null}
            </section>
          </div>
        ) : null}

        {tab === "account" ? (
          <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel={a.t("admin.loading.profile")}>
            {!operatorContext ? (
              <p className="text-sm text-zinc-500">{a.empty.noData}</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 text-sm">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">KYC</h3>
                  <dl className="grid gap-2">
                    <div>
                      <dt className="text-zinc-500">{a.table.status}</dt>
                      <dd>{String((operatorContext.kyc as { status?: string }).status ?? "—")}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Document ref</dt>
                      <dd className="font-mono text-xs">
                        {String((operatorContext.kyc as { documentReference?: string }).documentReference ?? "—")}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-amber-800">{a.t("admin.userDetail.kycPlaceholder")}</p>
                  <Link href={ROUTES.adminKyc} className="text-xs font-medium text-blue-700 hover:underline">
                    {a.adminSectionLabel("kyc")} →
                  </Link>
                </section>
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Legal</h3>
                  <p>
                    Принято согласий: {operatorContext.legal.acceptedConsentsCount}
                  </p>
                  {operatorContext.legal.missingRegisterConsents.length > 0 ? (
                    <ul className="list-disc pl-4 text-amber-900">
                      {operatorContext.legal.missingRegisterConsents.map((m) => (
                        <li key={`${m.type}-${m.version}`}>{m.title} v{m.version}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-800">REGISTER consents OK</p>
                  )}
                  <Link href={ROUTES.adminLegal} className="text-xs font-medium text-blue-700 hover:underline">
                    {a.adminSectionLabel("legal")} →
                  </Link>
                </section>
                <section className="space-y-3 md:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.userDetail.eligibility")}
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(operatorContext.eligibility).map(([key, val]) => (
                      <li key={key} className="rounded-lg border border-zinc-800 px-3 py-2">
                        <span className="font-medium">{key}</span>
                        <span className={val.allowed ? " text-emerald-700" : " text-amber-800"}>
                          {" "}
                          — {val.allowed ? "allowed" : val.blockingCode ?? val.userMessage}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Споры</h3>
                  <p>
                    Открыто: {operatorContext.disputes.openCount}{" "}
                    <Link href={ROUTES.adminDisputes} className="text-xs font-medium text-blue-700 hover:underline">
                      Очередь →
                    </Link>
                  </p>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Support</h3>
                  <p>
                    Открыто тикетов: {operatorContext.support.openCount}{" "}
                    <Link href={ROUTES.adminSupport} className="text-xs font-medium text-blue-700 hover:underline">
                      Очередь →
                    </Link>
                  </p>
                </section>
              </div>
            )}
          </AdminSectionDataArea>
        ) : null}

        {tab === "security" ? (
          <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel={a.t("admin.loading.profile")}>
            {!operatorContext ? (
              <p className="text-sm text-zinc-500">{a.empty.noData}</p>
            ) : (
              <div className="space-y-4 text-sm">
                <dl className="grid gap-3 md:grid-cols-3">
                  <div>
                    <dt className="text-zinc-500">Активные сессии</dt>
                    <dd className="font-semibold">{operatorContext.sessions.activeCount}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">AML risk</dt>
                    <dd>{operatorContext.risk.amlRiskLevel ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Compliance flags</dt>
                    <dd>{operatorContext.risk.complianceOpenFlagsCount}</dd>
                  </div>
                </dl>
                {operatorContext.risk.accountFrozen ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    Аккаунт заморожен (AML restrictions)
                  </p>
                ) : null}
                <h4 className="text-xs font-semibold uppercase text-zinc-500">Security events</h4>
                {operatorContext.securityEvents.length === 0 ? (
                  <p className="text-zinc-500">{a.empty.noData}</p>
                ) : (
                  <ul className="space-y-2">
                    {operatorContext.securityEvents.map((ev) => (
                      <li key={ev.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                        <span className="font-medium">{ev.action}</span>
                        <span className="text-xs text-zinc-500"> · {formatAdminDate(ev.createdAt)}</span>
                        {ev.ip ? <span className="block text-xs text-zinc-500">{ev.ip}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={ROUTES.adminCompliance} className="inline-block text-sm font-medium text-zinc-100 underline-offset-4 hover:underline">
                  Compliance →
                </Link>
              </div>
            )}
          </AdminSectionDataArea>
        ) : null}

        {tab === "roles" ? (
          <div className="space-y-4 text-sm">
            <p className="text-xs text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              Все изменения ролей записываются в журнал аудита Spliton.
            </p>
            <div className="flex flex-wrap gap-1">
              {profile.roles.map((role) => (
                <AdminRoleBadge key={role} role={role} />
              ))}
            </div>
            {canAssign || canRemove ? (
              <div className="flex flex-wrap gap-2">
                {canAssign ? (
                  <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => setRoleDialog(true)}>
                    {a.actions.assignRole}
                  </Button>
                ) : null}
                {canRemove && profile.roles.length > 0 ? (
                  <Button type="button" size="sm" variant="ghost" className={adminBtnOutline} onClick={() => setRemoveDialog(true)}>
                    Снять роль
                  </Button>
                ) : null}
              </div>
            ) : (
              <AdminReadOnlyBanner area="Роли и доступ" />
            )}
          </div>
        ) : null}

        {tab === "wallet" ? (
          <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel="Загрузка кошелька…">
            {walletReadOnly ? <AdminReadOnlyBanner area="Кошелёк" /> : null}
            {wallet ? (
              <dl className="mb-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Доступно</dt>
                  <dd className="font-semibold">{formatUsdtAmount(wallet.availableBalanceUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Заблокировано</dt>
                  <dd>{formatUsdtAmount(wallet.lockedBalanceUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Сеть</dt>
                  <dd>
                    {wallet.currency} / {wallet.network}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">{a.empty.noData}</p>
            )}
            <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Последние операции</h4>
            {walletTx.length === 0 ? (
              <p className="text-sm text-zinc-500">Данные пока не подключены или операций нет.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {walletTx.map((tx) => (
                  <li key={tx.id} className="flex justify-between rounded-lg border border-zinc-800 px-3 py-2">
                    <span>{tx.txType}</span>
                    <span className="tabular-nums">{formatUsdtAmount(tx.amountUsdt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionDataArea>
        ) : null}

        {tab === "audit" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <Label className="text-xs text-zinc-500">Тип события</Label>
              <AdminStyledSelect
                value={auditFilter}
                options={[
                  { value: "all", label: "Все" },
                  { value: "user.role", label: "Роли" },
                  { value: "user.block", label: "Блокировки" },
                  { value: "wallet", label: "Кошелёк" },
                ]}
                onChange={setAuditFilter}
                aria-label={a.t("admin.ui.eventTypeAria")}
              />
            </div>
            <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel="Загрузка аудита…">
              <AdminReadOnlyBanner area="Журнал аудита" />
              <AdminDataTable
                flat
                columns={auditColumns}
                rows={auditRows}
                rowKey={(r) => r.id}
                emptyMessage={a.empty.noData}
              />
            </AdminSectionDataArea>
          </div>
        ) : null}

        {tab === "risk" ? (
          <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel="Загрузка рисков…">
            {isReadOnlyAdminArea(actorRoles, "Compliance") ? (
              <AdminReadOnlyBanner area={a.adminSectionLabel("compliance")} />
            ) : null}
            {complianceRows.length === 0 ? (
              <p className="text-sm text-zinc-500">Флаги риска для пользователя не найдены.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {complianceRows.map((row) => {
                  const item = row as { id: string; title?: string; status?: string };
                  const { status: complianceStatus } = item;
                  return (
                    <li key={item.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                      <span className="font-medium">{item.title ?? item.id}</span>
                      {complianceStatus ? (
                        <AdminLocalizedStatusBadge status={complianceStatus} />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href={ROUTES.adminCompliance}
              className="mt-4 inline-block text-sm font-medium text-zinc-100 underline-offset-4 hover:underline"
            >
              Открыть раздел Compliance →
            </Link>
          </AdminSectionDataArea>
        ) : null}

        {tab === "support" ? (
          <AdminSectionDataArea loading={tabLoading} error={false} loadingLabel="Загрузка тикетов…">
            {ticketRows.length === 0 ? (
              <p className="text-sm text-zinc-500">Обращений по пользователю не найдено.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {ticketRows.map((row) => {
                  const t = row as { id: string; subject?: string; status?: string; createdAt?: string };
                  const { status: ticketStatus } = t;
                  return (
                    <li key={t.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                      <p className="font-medium">{t.subject ?? t.id}</p>
                      {ticketStatus ? <AdminLocalizedStatusBadge status={ticketStatus} /> : null}
                      {t.createdAt ? (
                        <p className="mt-1 text-xs text-zinc-500">{formatAdminDate(t.createdAt)}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href={ROUTES.adminSupport}
              className="mt-4 inline-block text-sm font-medium text-zinc-100 underline-offset-4 hover:underline"
            >
              Все тикеты поддержки →
            </Link>
          </AdminSectionDataArea>
        ) : null}
      </AdminSectionPanel>

      {canAssign ? (
        <AdminRoleAssignDialog
          open={roleDialog}
          onOpenChange={setRoleDialog}
          userEmail={profile.email}
          currentRoles={profile.roles}
          onAssign={async (role: StaffRoleCode) => {
            await assignAdminUserRole(
              profile.id,
              role,
              adminNote || undefined,
              client,
              actorRoles,
              role === "SUPER_ADMIN",
            );
            setRoleDialog(false);
            await loadProfile();
          }}
        />
      ) : null}

      {canRemove ? (
        <AdminRoleRemoveDialog
          open={removeDialog}
          onOpenChange={setRemoveDialog}
          userEmail={profile.email}
          currentRoles={profile.roles}
          onRemove={async (role) => {
            await removeAdminUserRole(profile.id, role, client, actorRoles);
            setRemoveDialog(false);
            await loadProfile();
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={confirmBlock}
        onOpenChange={setConfirmBlock}
        title={a.confirm.blockUserTitle}
        description={a.confirm.blockUserDesc}
        variant="destructive"
        confirmLabel={a.confirm.blockUserConfirm}
        onConfirm={async () => {
          await blockAdminUser(profile.id, adminNote || undefined, client, actorRoles);
          setConfirmBlock(false);
          await loadProfile();
        }}
      />
      <AdminConfirmDialog
        open={confirmUnblock}
        onOpenChange={setConfirmUnblock}
        title={a.confirm.unblockUserTitle}
        description={a.confirm.unblockUserDesc}
        confirmLabel={a.confirm.unblockUserConfirm}
        onConfirm={async () => {
          await unblockAdminUser(profile.id, adminNote || undefined, client, actorRoles);
          setConfirmUnblock(false);
          await loadProfile();
        }}
      />
    </AdminSectionShell>
  );
}
