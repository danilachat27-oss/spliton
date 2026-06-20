"use client";

import * as React from "react";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
  AdminDrawerDangerButton,
} from "@/features/admin/components/admin-drawer-buttons";
import {
  canApprovePartnerApplication,
  canSuspendPartnerApplication,
} from "@/features/admin/config/admin-rbac";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import {
  AdminConfirmDialog,
  AdminDetailDrawer,
  AdminFormFooter,
  AdminRejectReasonDialog,
} from "@/features/admin/ui";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import {
  approveAdminPartner,
  rejectAdminPartner,
  suspendAdminPartner,
  type AdminPartnerRow,
} from "@/services/admin/adminReferrals.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: AdminPartnerRow | null;
  client: AdminApiClient;
  roles: string[] | undefined;
  onUpdated: () => void | Promise<void>;
};

export function AdminPartnerDrawer({
  open,
  onOpenChange,
  partner,
  client,
  roles,
  onUpdated,
}: Props) {
  const a = useAdminI18n();
  const canApprove = canApprovePartnerApplication(roles);
  const canSuspend = canSuspendPartnerApplication(roles);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) setError(null);
  }, [open, partner?.id]);

  const pendingReview = partner?.status === "APPLIED" || partner?.status === "IN_REVIEW";

  async function runAction(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      setApproveOpen(false);
      setRejectOpen(false);
      setSuspendOpen(false);
      await onUpdated();
      onOpenChange(false);
    } catch (e) {
      setError(localizedAdminError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={
          partner
            ? a.t("admin.partner.titleWithType").replace("{type}", partner.partnerType)
            : a.t("admin.partner.title")
        }
        subtitle={partner?.userEmail ?? partner?.userId}
        wide
        footer={
          partner ? (
            <AdminFormFooter
              left={
                <>
                  {partner.status === "APPROVED" && canSuspend ? (
                    <AdminDrawerSecondaryButton disabled={submitting} onClick={() => setSuspendOpen(true)}>
                      {a.t("admin.partner.suspend")}
                    </AdminDrawerSecondaryButton>
                  ) : null}
                  {pendingReview && canApprove ? (
                    <AdminDrawerDangerButton disabled={submitting} onClick={() => setRejectOpen(true)}>
                      {a.actions.reject}
                    </AdminDrawerDangerButton>
                  ) : null}
                </>
              }
              right={
                <>
                  <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
                    {a.t("admin.drawer.common.close")}
                  </AdminDrawerGhostButton>
                  {pendingReview && canApprove ? (
                    <AdminDrawerPrimaryButton disabled={submitting} onClick={() => setApproveOpen(true)}>
                      {a.actions.approve}
                    </AdminDrawerPrimaryButton>
                  ) : null}
                </>
              }
            />
          ) : null
        }
      >
        {partner ? (
          <dl className="space-y-3 text-sm">
            <Row label={a.table.status} value={partner.statusLabel ?? a.formatAdminStatus(partner.status)} />
            <Row label={a.table.type} value={partner.partnerType} />
            <Row label="Email" value={partner.userEmail ?? "—"} />
            <Row label="User ID" value={partner.userId} />
            <Row label="Tier" value={partner.tier ?? "—"} />
            <Row
              label={a.t("admin.partner.commission")}
              value={partner.commissionPercent != null ? `${String(partner.commissionPercent)}%` : "—"}
            />
            <Row label={a.t("admin.partner.payoutMethod")} value={partner.payoutMethod ?? "—"} />
            <Row label={a.t("admin.partner.application")} value={partner.applicationNote ?? "—"} multiline />
            <Row label={a.t("admin.partner.rejectedReason")} value={partner.rejectedReason ?? "—"} multiline />
            <Row label={a.table.created} value={formatAdminDate(partner.createdAt)} />
            <Row label={a.table.updated} value={formatAdminDate(partner.updatedAt)} />
            {partner.approvedAt ? (
              <Row label={a.t("admin.partner.approved")} value={formatAdminDate(partner.approvedAt)} />
            ) : null}
          </dl>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={approveOpen}
        onOpenChange={(o) => !submitting && setApproveOpen(o)}
        title={a.t("admin.partner.confirm.approveTitle")}
        description={a.t("admin.partner.confirm.approveDesc")}
        confirmLabel={submitting ? a.t("admin.partner.sending") : a.actions.approve}
        closeOnConfirm={false}
        confirming={submitting}
        onConfirm={() =>
          partner ? runAction(() => approveAdminPartner(client, partner.id)) : Promise.resolve()
        }
      />

      <AdminRejectReasonDialog
        open={rejectOpen}
        onOpenChange={(o) => !submitting && setRejectOpen(o)}
        title={a.t("admin.partner.confirm.rejectTitle")}
        description={a.t("admin.partner.confirm.rejectDesc")}
        submitting={submitting}
        onConfirm={(reason) =>
          partner ? runAction(() => rejectAdminPartner(client, partner.id, reason)) : Promise.resolve()
        }
      />

      <AdminRejectReasonDialog
        open={suspendOpen}
        onOpenChange={(o) => !submitting && setSuspendOpen(o)}
        title={a.t("admin.partner.confirm.suspendTitle")}
        description={a.t("admin.partner.confirm.suspendDesc")}
        confirmLabel={a.t("admin.partner.suspend")}
        submitting={submitting}
        onConfirm={(reason) =>
          partner ? runAction(() => suspendAdminPartner(client, partner.id, reason)) : Promise.resolve()
        }
      />
    </>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={multiline ? "mt-1 whitespace-pre-wrap text-zinc-200" : "mt-0.5 text-zinc-200"}>{value}</dd>
    </div>
  );
}
