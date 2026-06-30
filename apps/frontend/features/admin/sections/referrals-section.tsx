"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { adminBtnOutline } from "@/features/admin/lib/admin-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPartnerDrawer } from "@/features/admin/components/admin-partner-drawer";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  AdminSectionDataArea,
  AdminSectionPanel,
  AdminSectionRefreshButton,
  AdminSectionShell,
} from "@/features/admin/components/admin-section-layout";
import { canApprovePartnerApplication } from "@/features/admin/config/admin-rbac";
import { canMatrixAction } from "@/features/admin/config/admin-role-matrix";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_KPI_GRID, ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import type { AppLocale } from "@/lib/i18n/types";
import { partnerStatusLabel, partnerTypeLabel } from "@/lib/i18n/partner-messages";
import { referralEventLabelI18n, referralStatusLabel } from "@/lib/i18n/referral-messages";
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
  AdminDataTable,
  AdminErrorState,
  AdminReadOnlyBanner,
  AdminRejectReasonDialog,
  AdminStatusBadge,
  type AdminColumn,
  type AdminStatusTone,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";

const referralsTableClass = "[&_table]:min-w-[880px]";

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "danger"
          ? "text-rose-400"
          : tone === "info"
            ? "text-sky-400"
            : "text-zinc-100";

  return (
    <div className={cn(ADMIN_SECTION_TILE, "flex min-h-[5.5rem] flex-col justify-between gap-2")}>
      <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</p>
    </div>
  );
}

function adminReferralRewardStatusLabel(status: string, locale: AppLocale): string {
  const upper = status.toUpperCase();
  const labels: Record<string, string> = {
    PENDING: referralStatusLabel("pending", locale),
    HELD_FOR_REVIEW: "На проверке",
    QUALIFIED: "К выплате",
    APPROVED: "Одобрено",
    PAID: referralStatusLabel("paid", locale),
    REJECTED: referralStatusLabel("rejected", locale),
    CANCELLED: referralStatusLabel("cancelled", locale),
  };
  return labels[upper] ?? status;
}

function referralRewardStatusTone(status: string): AdminStatusTone {
  const upper = status.toUpperCase();
  if (upper === "PAID" || upper === "APPROVED") return "success";
  if (upper === "REJECTED" || upper === "CANCELLED") return "danger";
  if (upper === "HELD_FOR_REVIEW" || upper === "PENDING") return "warning";
  if (upper === "QUALIFIED") return "info";
  return "neutral";
}

function partnerStatusTone(status: string): AdminStatusTone {
  const upper = status.toUpperCase();
  if (upper === "APPROVED") return "success";
  if (upper === "REJECTED" || upper === "SUSPENDED") return "danger";
  if (upper === "APPLIED" || upper === "IN_REVIEW") return "warning";
  return "neutral";
}

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
    {
      key: "createdAt",
      header: a.table.created,
      render: (r) => <span className="text-xs tabular-nums text-zinc-500">{formatAdminDate(r.createdAt)}</span>,
    },
    {
      key: "eventType",
      header: "Событие",
      render: (r) => referralEventLabelI18n(r.eventType, a.locale),
    },
    {
      key: "amount",
      header: a.table.amount,
      render: (r) => (
        <span className="font-medium tabular-nums text-emerald-400">
          {formatUsdtAmount(String(r.amount))} {r.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminStatusBadge
          label={adminReferralRewardStatusLabel(r.status, a.locale)}
          tone={referralRewardStatusTone(r.status)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "PENDING" || r.status === "HELD_FOR_REVIEW" || r.status === "QUALIFIED" ? (
          <div className="flex flex-wrap gap-2">
            {canApproveReward ? (
              <Button
                size="sm"
                className="bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]"
                disabled={actionSubmitting}
                onClick={() =>
                  void approveAdminReferralReward(client, r.id)
                    .then(load)
                    .catch((e) => setError(localizedAdminError(e)))
                }
              >
                Одобрить
              </Button>
            ) : null}
            {canRejectReward ? (
              <Button
                size="sm"
                variant="ghost"
                className={adminBtnOutline}
                disabled={actionSubmitting}
                onClick={() => setRejectReward(r)}
              >
                Отклонить
              </Button>
            ) : null}
          </div>
        ) : null,
    },
  ];

  const partnerColumns: AdminColumn<AdminPartnerRow>[] = [
    {
      key: "partnerType",
      header: a.table.type,
      render: (r) => partnerTypeLabel(r.partnerType, a.locale),
    },
    {
      key: "status",
      header: a.table.status,
      render: (r) => (
        <AdminStatusBadge
          label={r.statusLabel ?? partnerStatusLabel(r.status, a.locale)}
          tone={partnerStatusTone(r.status)}
        />
      ),
    },
    {
      key: "userEmail",
      header: a.table.email,
      render: (r) => <span className="text-sm text-zinc-200">{r.userEmail ?? "—"}</span>,
    },
    {
      key: "tier",
      header: a.t("admin.table.tier"),
      render: (r) => <span className="text-sm text-zinc-400">{r.tier ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          className={adminBtnOutline}
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
      infoHint="Реферальные награды и заявки партнёров: одобрение выплат, проверка compliance и управление партнёрской программой."
      actions={<AdminSectionRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {readOnly ? <AdminReadOnlyBanner area={a.adminSectionLabel("referrals")} /> : null}

      <AdminSectionPanel className="min-w-0">
        {summary && !loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            <StatTile label={a.t("admin.referrals.stats.invites")} value={summary.totalInvites} tone="info" />
            <StatTile
              label={a.t("admin.referrals.stats.pendingRewards")}
              value={summary.pendingRewards}
              tone={summary.pendingRewards > 0 ? "warning" : "neutral"}
            />
            <StatTile
              label={a.t("admin.referrals.stats.partnerApplications")}
              value={summary.pendingPartnerApplications}
              tone={summary.pendingPartnerApplications > 0 ? "warning" : "neutral"}
            />
          </div>
        ) : loading ? (
          <div className={ADMIN_SECTION_KPI_GRID}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(ADMIN_SECTION_TILE, "h-24 animate-pulse bg-zinc-800/50")} />
            ))}
          </div>
        ) : null}

        <AdminSectionDataArea loading={loading} loadingLabel="Загрузка рефералов…">
          {error ? (
            <AdminErrorState message={error} onRetry={() => void load()} />
          ) : (
            <div className="space-y-6">
              <section className={cn(ADMIN_SECTION_TILE, "min-w-0 space-y-4 p-0 sm:p-0")}>
                <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                  <h3 className="text-sm font-semibold text-zinc-100">Награды</h3>
                  <p className="mt-1 text-xs text-zinc-500">Реферальные выплаты: события, суммы и статусы одобрения.</p>
                </div>
                <AdminDataTable
                  flat
                  borderless
                  className={referralsTableClass}
                  columns={rewardColumns}
                  rows={rewards}
                  rowKey={(r) => r.id}
                  emptyMessage="Реферальных наград пока нет"
                />
              </section>

              <section className={cn(ADMIN_SECTION_TILE, "min-w-0 space-y-4 p-0 sm:p-0")}>
                <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                  <h3 className="text-sm font-semibold text-zinc-100">Партнёры</h3>
                  <p className="mt-1 text-xs text-zinc-500">Заявки и профили партнёров программы Spliton.</p>
                </div>
                <AdminDataTable
                  flat
                  borderless
                  className={referralsTableClass}
                  columns={partnerColumns}
                  rows={partners}
                  rowKey={(r) => r.id}
                  emptyMessage="Партнёров пока нет"
                />
              </section>
            </div>
          )}
        </AdminSectionDataArea>
      </AdminSectionPanel>

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
