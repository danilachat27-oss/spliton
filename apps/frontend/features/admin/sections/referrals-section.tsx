"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPartnerDrawer } from "@/features/admin/components/admin-partner-drawer";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import {
  canApprovePartnerApplication,
} from "@/features/admin/config/admin-rbac";
import { canMatrixAction } from "@/features/admin/config/admin-role-matrix";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import {
  approveAdminReferralReward,
  getAdminReferralsSummary,
  listAdminPartners,
  listAdminReferralRewards,
  rejectAdminReferralReward,
  type AdminPartnerRow,
  type AdminReferralRewardRow,
  type AdminReferralsSummary,
} from "@/services/admin/adminReferrals.service";
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminErrorState,
  AdminLoadingState,
  AdminReadOnlyBanner,
  AdminRejectReasonDialog,
  type AdminColumn,
} from "@/features/admin/ui";

export function ReferralsSection() {
  const a = useAdminI18n();
  const client = useAdminApi();
  const { user } = useAuth();
  const roles = user?.roles;
  const canApproveReward = canMatrixAction(roles, "referrals", "approve");
  const canRejectReward =
    canMatrixAction(roles, "referrals", "approve") ||
    canMatrixAction(roles, "compliance", "approve");
  const canReviewPartner = canApprovePartnerApplication(roles);
  const readOnly = !canApproveReward && !canReviewPartner;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<AdminReferralsSummary | null>(null);
  const [rewards, setRewards] = React.useState<AdminReferralRewardRow[]>([]);
  const [partners, setPartners] = React.useState<AdminPartnerRow[]>([]);
  const [selectedPartner, setSelectedPartner] = React.useState<AdminPartnerRow | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [rejectReward, setRejectReward] = React.useState<AdminReferralRewardRow | null>(null);
  const [actionSubmitting, setActionSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r, p] = await Promise.all([
        getAdminReferralsSummary(client),
        listAdminReferralRewards(client),
        listAdminPartners(client),
      ]);
      setSummary(s);
      setRewards(r.items);
      setPartners(p.items);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function rejectRewardWithReason(reason: string) {
    if (!rejectReward) return;
    setActionSubmitting(true);
    setError(null);
    try {
      await rejectAdminReferralReward(client, rejectReward.id, reason);
      setRejectReward(null);
      await load();
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setActionSubmitting(false);
    }
  }

  const rewardColumns: AdminColumn<AdminReferralRewardRow>[] = [
    { key: "createdAt", header: "Дата", render: (r) => new Date(r.createdAt).toLocaleString("ru-RU") },
    { key: "eventType", header: "Событие", render: (r) => r.eventType },
    { key: "amount", header: "Сумма", render: (r) => `${String(r.amount)} ${r.currency}` },
    { key: "status", header: "Статус", render: (r) => r.status },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "PENDING" || r.status === "HELD_FOR_REVIEW" || r.status === "QUALIFIED" ? (
          <div className="flex gap-2">
            {canApproveReward ? (
              <Button
                size="sm"
                variant="ghost" className={adminBtnOutline}
                disabled={actionSubmitting}
                onClick={() => void approveAdminReferralReward(client, r.id).then(load).catch((e) => setError(localizedAdminError(e)))}
              >
                Одобрить
              </Button>
            ) : null}
            {canRejectReward ? (
              <Button size="sm" variant="ghost" disabled={actionSubmitting} onClick={() => setRejectReward(r)}>
                Отклонить
              </Button>
            ) : null}
          </div>
        ) : null,
    },
  ];

  const partnerColumns: AdminColumn<AdminPartnerRow>[] = [
    { key: "partnerType", header: "Тип", render: (r) => r.partnerType },
    { key: "status", header: "Статус", render: (r) => r.statusLabel ?? r.status },
    { key: "userEmail", header: a.table.email, render: (r) => r.userEmail ?? "—" },
    { key: "tier", header: a.t("admin.table.tier"), render: (r) => r.tier ?? "—" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost" className={adminBtnOutline}
          onClick={() => {
            setSelectedPartner(r);
            setDrawerOpen(true);
          }}
        >
          Открыть
        </Button>
      ),
    },
  ];

  return (
    <AdminSectionShell
      sectionId="referrals"
      title={a.adminSectionLabel("referrals")}
      actions={<AdminSectionRefreshButton onClick={() => void load()} />}
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("referrals")} /> : null}
      {loading ? <AdminLoadingState /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Приглашений</p>
            <p className="text-2xl font-semibold">{summary.totalInvites}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Награды в очереди</p>
            <p className="text-2xl font-semibold">{summary.pendingRewards}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Заявки партнёров</p>
            <p className="text-2xl font-semibold">{summary.pendingPartnerApplications}</p>
          </div>
        </div>
      ) : null}
      <h3 className="mb-2 text-sm font-medium">Награды</h3>
      <AdminDataTable columns={rewardColumns} rows={rewards} rowKey={(r) => r.id} />
      <h3 className="mb-2 mt-8 text-sm font-medium">Партнёры</h3>
      <AdminDataTable columns={partnerColumns} rows={partners} rowKey={(r) => r.id} />

      <AdminPartnerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        partner={selectedPartner}
        client={client}
        roles={roles}
        onUpdated={async () => {
          await load();
          if (selectedPartner) {
            const refreshed = (await listAdminPartners(client)).items.find(
              (row) => row.id === selectedPartner.id,
            );
            setSelectedPartner(refreshed ?? null);
          }
        }}
      />

      <AdminRejectReasonDialog
        open={Boolean(rejectReward)}
        onOpenChange={(o) => {
          if (!actionSubmitting && !o) setRejectReward(null);
        }}
        title={a.t("admin.title.rejectReferralReward")}
        submitting={actionSubmitting}
        onConfirm={rejectRewardWithReason}
      />
    </AdminSectionShell>
  );
}
