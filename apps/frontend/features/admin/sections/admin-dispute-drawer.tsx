"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  AdminDrawerDangerButton,
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import { useAdminApi } from "@/features/admin/hooks/use-admin-api";
import { adminFieldTextarea, adminFieldInput } from "@/features/admin/lib/admin-ui";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { localizedAdminError } from "@/features/admin/lib/localized-admin-error";
import { formatAdminDate } from "@/features/admin/lib/admin-format";
import { AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLocalizedStatusBadge } from "@/features/admin/ui";
import {
  addAdminDisputeNote,
  getAdminDispute,
  patchAdminDisputePriority,
  patchAdminDisputeStatus,
  replyAdminDispute,
  type AdminDisputeDetail,
} from "@/services/admin/adminDisputes.service";

type Props = {
  disputeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  canMutate?: boolean;
  canReply?: boolean;
};

export function AdminDisputeDrawer({ disputeId, open, onOpenChange, onUpdated, canMutate, canReply = canMutate }: Props) {
  const a = useAdminI18n();
  const client = useAdminApi();
  const [tab, setTab] = React.useState<"overview" | "dialog" | "notes">("overview");
  const [dispute, setDispute] = React.useState<AdminDisputeDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!disputeId) return;
    setLoading(true);
    setError(null);
    void getAdminDispute(disputeId, client)
      .then(setDispute)
      .catch((e) => setError(localizedAdminError(e)))
      .finally(() => setLoading(false));
  }, [disputeId, client]);

  React.useEffect(() => {
    if (open && disputeId) load();
  }, [open, disputeId, load]);

  async function handleReply() {
    if (!disputeId || !reply.trim() || !canReply) return;
    try {
      await replyAdminDispute(disputeId, reply.trim(), client);
      setReply("");
      load();
      onUpdated?.();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  async function handleNote() {
    if (!disputeId || !note.trim() || !canMutate) return;
    try {
      await addAdminDisputeNote(disputeId, note.trim(), client);
      setNote("");
      load();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  async function handleStatus(status: string) {
    if (!disputeId || !canMutate) return;
    try {
      await patchAdminDisputeStatus(disputeId, status, undefined, client);
      load();
      onUpdated?.();
    } catch (e) {
      setError(localizedAdminError(e));
    }
  }

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={a.t("admin.section.disputes")}
      subtitle={disputeId ?? undefined}
      wide
      footer={
        <AdminFormFooter
          right={
            <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
              {a.t("admin.drawer.common.close")}
            </AdminDrawerGhostButton>
          }
        />
      }
    >
      {loading ? (
        <p className="text-sm text-neutral-500">{a.t("admin.loading.disputes")}</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : dispute ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["overview", "dialog", "notes"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={tab === t ? "default" : "outline"}
                onClick={() => setTab(t)}
              >
                {t === "overview" ? a.t("admin.disputes.tab.overview") : t === "dialog" ? a.t("admin.disputes.tab.dialog") : a.t("admin.disputes.tab.notes")}
              </Button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <AdminLocalizedStatusBadge status={dispute.status} />
                <span className="rounded-full bg-zinc-800/60 px-2 py-0.5 text-xs font-medium text-zinc-200">
                  {dispute.priority}
                </span>
              </div>
              <p className="font-medium text-neutral-900">{dispute.subject}</p>
              <p className="text-neutral-600">{dispute.description}</p>
              <dl className="grid gap-1 text-xs text-neutral-500">
                <div><dt className="inline">{a.table.user}: </dt><dd className="inline text-neutral-800">{dispute.userEmail}</dd></div>
                <div><dt className="inline">{a.table.type}: </dt><dd className="inline text-neutral-800">{dispute.type}</dd></div>
                <div><dt className="inline">{a.table.updated}: </dt><dd className="inline text-neutral-800">{formatAdminDate(dispute.updatedAt)}</dd></div>
                {dispute.assignedToEmail ? (
                  <div><dt className="inline">{a.t("admin.disputes.assignee")}: </dt><dd className="inline text-neutral-800">{dispute.assignedToEmail}</dd></div>
                ) : null}
              </dl>
              {canMutate ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <AdminDrawerSecondaryButton onClick={() => void handleStatus("in_review")}>
                    {a.t("admin.disputes.action.review")}
                  </AdminDrawerSecondaryButton>
                  <AdminDrawerPrimaryButton onClick={() => void handleStatus("resolved")}>
                    {a.t("admin.disputes.action.resolve")}
                  </AdminDrawerPrimaryButton>
                  <AdminDrawerDangerButton onClick={() => void handleStatus("rejected")}>
                    {a.t("admin.disputes.action.reject")}
                  </AdminDrawerDangerButton>
                  <AdminDrawerSecondaryButton onClick={() => void handleStatus("closed")}>
                    {a.t("admin.disputes.action.close")}
                  </AdminDrawerSecondaryButton>
                  <AdminDrawerSecondaryButton
                    onClick={() => void patchAdminDisputePriority(dispute.id, "high", client).then(load)}
                  >
                    {a.t("admin.disputes.action.escalatePriority")}
                  </AdminDrawerSecondaryButton>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "dialog" ? (
            <div className="space-y-3">
              <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-neutral-100 p-3">
                {(dispute.messages ?? []).filter((m) => !m.isInternal).map((m) => (
                  <li key={m.id} className={m.isStaff ? "text-right" : ""}>
                    <p className="text-[10px] text-neutral-400">{m.authorEmail} · {formatAdminDate(m.createdAt)}</p>
                    <p className={`inline-block rounded-xl px-3 py-2 text-sm ${m.isStaff ? "bg-neutral-900 text-white" : "bg-zinc-800/60 text-zinc-200"}`}>
                      {m.body}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <AdminFormField
                  label={a.t("admin.disputes.replyPlaceholder")}
                  htmlFor="dispute-reply"
                  className="min-w-0 flex-1"
                >
                  <Input
                    id="dispute-reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={a.t("admin.disputes.replyPlaceholder")}
                    className={adminFieldInput}
                  />
                </AdminFormField>
                <AdminDrawerPrimaryButton onClick={() => void handleReply()} disabled={!reply.trim() || !canReply}>
                  {a.t("admin.disputes.reply")}
                </AdminDrawerPrimaryButton>
              </div>
            </div>
          ) : null}

          {tab === "notes" ? (
            <div className="space-y-3">
              <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-neutral-100 p-3 text-sm">
                {(dispute.messages ?? []).filter((m) => m.isInternal).map((m) => (
                  <li key={m.id}>
                    <p className="text-[10px] text-neutral-400">{m.authorEmail}</p>
                    <p className="text-neutral-800">{m.body}</p>
                  </li>
                ))}
                {(dispute.messages ?? []).filter((m) => m.isInternal).length === 0 ? (
                  <li className="text-neutral-500">{a.t("admin.disputes.notesEmpty")}</li>
                ) : null}
              </ul>
              {canMutate ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <AdminFormField
                    label={a.t("admin.disputes.notePlaceholder")}
                    htmlFor="dispute-note"
                    className="min-w-0 flex-1"
                  >
                    <Input
                      id="dispute-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={a.t("admin.disputes.notePlaceholder")}
                      className={adminFieldInput}
                    />
                  </AdminFormField>
                  <AdminDrawerPrimaryButton onClick={() => void handleNote()} disabled={!note.trim()}>
                    {a.t("admin.disputes.addNote")}
                  </AdminDrawerPrimaryButton>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminDetailDrawer>
  );
}
