"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle, ShieldAlert } from "@/lib/lucide";

import {
  AdminDrawerDangerButton,
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import type { AdminWithdrawalDetail } from "@/features/admin/mocks/admin-withdrawals.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import { tronTxExplorerUrl, WITHDRAWAL_FIELD_TOOLTIPS } from "@/features/admin/lib/admin-withdrawal-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminConfirmDialog, AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLoadingState, AdminPhraseConfirmDialog, AdminStatusBadge } from "@/features/admin/ui";
import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "blockchain" | "ledger" | "user" | "audit";

export type WithdrawalPendingAction = {
  action: "approve" | "reject" | "hold" | "complete";
  title: string;
  description: string;
  variant?: "default" | "destructive";
  requireNote?: boolean;
  requireTxHash?: boolean;
};

type AdminWithdrawalDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: AdminWithdrawalDetail | null;
  loading?: boolean;
  canMutate?: boolean;
  onAction?: (action: WithdrawalPendingAction, note: string, txHash: string) => Promise<void>;
};

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0" />
      {text}
    </p>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{message}</p>;
}

export function AdminWithdrawalDrawer({
  open,
  onOpenChange,
  withdrawal,
  loading,
  canMutate = false,
  onAction,
}: AdminWithdrawalDrawerProps) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "blockchain", label: a.t("admin.drawer.common.blockchain") },
    { id: "ledger", label: a.t("admin.drawer.common.ledger") },
    { id: "user", label: a.t("admin.drawer.common.user") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");
  const [adminNote, setAdminNote] = React.useState("");
  const [txHash, setTxHash] = React.useState("");
  const [pending, setPending] = React.useState<WithdrawalPendingAction | null>(null);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setAdminNote("");
      setTxHash("");
      setPending(null);
    }
  }, [open, withdrawal?.id]);

  async function confirmAction() {
    if (!pending || !onAction) return;
    if (pending.requireNote && !adminNote.trim()) return;
    if (pending.requireTxHash && !txHash.trim()) return;
    try {
      await onAction(pending, adminNote.trim(), txHash.trim());
      setPending(null);
      setAdminNote("");
      setTxHash("");
    } catch {
      /* keep drawer open */
    }
  }

  const explorerUrl = withdrawal ? tronTxExplorerUrl(withdrawal.txHash) : null;
  const canApprove = withdrawal?.status === "pending";
  const canHold = withdrawal?.status === "pending" || withdrawal?.status === "approved";
  const canReject = withdrawal?.status === "pending" || withdrawal?.status === "approved" || withdrawal?.status === "on_hold";
  const canComplete = withdrawal?.status === "approved";

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        widthClassName="w-[min(960px,100vw)]"
        title={
          withdrawal
            ? a.t("admin.drawer.withdrawal.titleWithAmount").replace(
                "{amount}",
                formatUsdtAmount(withdrawal.amountUsdt),
              )
            : a.t("admin.drawer.withdrawal.title")
        }
        subtitle={withdrawal?.userEmail}
        footer={
          withdrawal && canMutate && onAction ? (
            <div className="flex w-full flex-col gap-3">
              <AdminFormField
                label={a.t("admin.drawer.withdrawal.adminNote")}
                htmlFor="wd-admin-note"
              >
                <Input
                  id="wd-admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className={adminFieldInput}
                  placeholder={a.t("admin.drawer.withdrawal.adminNotePlaceholder")}
                />
              </AdminFormField>
              {canComplete ? (
                <AdminFormField
                  label={a.t("admin.drawer.withdrawal.txHash")}
                  htmlFor="wd-tx-hash"
                  hint={WITHDRAWAL_FIELD_TOOLTIPS.txHash}
                >
                  <Input
                    id="wd-tx-hash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className={cn("font-mono text-xs", adminFieldInput)}
                    placeholder={a.t("admin.drawer.withdrawal.txHashPlaceholder")}
                  />
                </AdminFormField>
              ) : null}
              <AdminFormFooter
                left={
                  <>
                    {canHold ? (
                      <AdminDrawerSecondaryButton
                        onClick={() =>
                          setPending({
                            action: "hold",
                            title: a.t("admin.drawer.withdrawal.confirmHoldTitle"),
                            description: WITHDRAWAL_FIELD_TOOLTIPS.hold,
                          })
                        }
                      >
                        {a.t("admin.drawer.withdrawal.hold")}
                      </AdminDrawerSecondaryButton>
                    ) : null}
                    {canReject ? (
                      <AdminDrawerDangerButton
                        onClick={() =>
                          setPending({
                            action: "reject",
                            title: a.t("admin.drawer.withdrawal.confirmRejectTitle"),
                            description: a.t("admin.drawer.withdrawal.confirmRejectDesc"),
                            variant: "destructive",
                            requireNote: true,
                          })
                        }
                      >
                        {a.t("admin.drawer.withdrawal.reject")}
                      </AdminDrawerDangerButton>
                    ) : null}
                  </>
                }
                right={
                  <>
                    {canApprove ? (
                      <AdminDrawerPrimaryButton
                        onClick={() =>
                          setPending({
                            action: "approve",
                            title: a.t("admin.drawer.withdrawal.confirmApproveTitle"),
                            description: a.t("admin.drawer.withdrawal.confirmApproveDesc"),
                          })
                        }
                      >
                        {a.t("admin.drawer.withdrawal.approve")}
                      </AdminDrawerPrimaryButton>
                    ) : null}
                    {canComplete ? (
                      <AdminDrawerPrimaryButton
                        onClick={() =>
                          setPending({
                            action: "complete",
                            title: a.t("admin.drawer.withdrawal.confirmCompleteTitle"),
                            description: a.t("admin.drawer.withdrawal.confirmCompleteDesc"),
                            requireTxHash: true,
                          })
                        }
                      >
                        {a.t("admin.drawer.withdrawal.complete")}
                      </AdminDrawerPrimaryButton>
                    ) : null}
                  </>
                }
              />
            </div>
          ) : (
            <AdminFormFooter
              right={
                <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>
                  {a.t("admin.drawer.common.close")}
                </AdminDrawerGhostButton>
              }
            />
          )
        }
      >
        {loading ? <AdminLoadingState label={a.t("admin.drawer.withdrawal.loading")} /> : null}

        {withdrawal && !loading ? (
          <div className="space-y-5 pb-4">
            <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
              {withdrawal.id}
              <AdminCopyButton value={withdrawal.id} />
            </p>

            <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/60",
                  )}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.status")}</dt>
                  <dd className="mt-1">
                    <AdminStatusBadge label={a.formatAdminStatus(withdrawal.status)} tone="info" />
                    {withdrawal.hasRiskFlag ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                        <ShieldAlert className="size-3.5" />
                        {withdrawal.riskSeverity ?? "risk"}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.amount")}</dt>
                  <dd className="font-medium tabular-nums">{formatUsdtAmount(withdrawal.amountUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.fee")}</dt>
                  <dd className="tabular-nums">{formatUsdtAmount(withdrawal.feeUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.net")}</dt>
                  <dd className="font-medium tabular-nums">{formatUsdtAmount(withdrawal.finalAmountUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.requested")}</dt>
                  <dd>{formatAdminDate(withdrawal.requestedAt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.common.updated")}</dt>
                  <dd>{formatAdminDate(withdrawal.updatedAt)}</dd>
                </div>
                {withdrawal.processedAt ? (
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.common.processed")}</dt>
                    <dd>{formatAdminDate(withdrawal.processedAt)}</dd>
                  </div>
                ) : null}
                {withdrawal.completedAt ? (
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.common.completed")}</dt>
                    <dd>{formatAdminDate(withdrawal.completedAt)}</dd>
                  </div>
                ) : null}
                {withdrawal.approvalStatus ? (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">{a.t("admin.drawer.withdrawal.treasuryApprovals")}</dt>
                    <dd className="mt-1 space-y-1 text-xs">
                      <p>
                        {a.t("admin.table.tier")}: <span className="font-medium">{withdrawal.approvalStatus.tier}</span>
                        {" · "}
                        {withdrawal.approvalStatus.satisfied ? (
                          <span className="text-emerald-700">{a.t("admin.drawer.withdrawal.allApprovalsReceived")}</span>
                        ) : (
                          <span className="text-amber-800">{a.t("admin.drawer.withdrawal.moreApprovalsNeeded")}</span>
                        )}
                      </p>
                      <p className="text-zinc-400">
                        {a.t("admin.drawer.withdrawal.required")}{" "}
                        {withdrawal.approvalStatus.required.map((r) => r.label).join(", ") || "—"}
                      </p>
                      {withdrawal.approvalStatus.approved.length > 0 ? (
                        <ul className="list-disc pl-4 text-zinc-400">
                          {withdrawal.approvalStatus.approved.map((approval) => (
                            <li key={`${approval.role}-${approval.at}`}>
                              {a.adminRoleLabel(approval.role)} · {formatAdminDate(approval.at)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-zinc-500">{a.t("admin.drawer.withdrawal.noApprovalsYet")}</p>
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {tab === "blockchain" ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-zinc-500">{a.t("admin.drawer.withdrawal.recipientAddress")}</p>
                  <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs">
                    {withdrawal.trc20Address}
                    <AdminCopyButton value={withdrawal.trc20Address} />
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Tx hash</p>
                  {withdrawal.hasTxHash && withdrawal.txHash ? (
                    <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs">
                      {withdrawal.txHash}
                      <AdminCopyButton value={withdrawal.txHash} />
                      {explorerUrl ? (
                        <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-sky-700">
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </p>
                  ) : (
                    <AdminStatusBadge label={a.t("admin.drawer.withdrawal.noTxHash")} tone="warning" />
                  )}
                  <FieldHint text={WITHDRAWAL_FIELD_TOOLTIPS.txHash} />
                </div>
              </div>
            ) : null}

            {tab === "ledger" ? (
              withdrawal.ledger ? (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.table.id")}</dt>
                    <dd className="inline-flex items-center gap-1 font-mono text-xs">
                      {withdrawal.ledger.id}
                      <AdminCopyButton value={withdrawal.ledger.id} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.common.operation")}</dt>
                    <dd>{withdrawal.ledger.operationType}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.common.net")}</dt>
                    <dd className="tabular-nums">{formatUsdtAmount(withdrawal.ledger.netAmountUsdt)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.common.status")}</dt>
                    <dd>{a.formatAdminStatus(withdrawal.ledger.status)}</dd>
                  </div>
                </dl>
              ) : (
                <EmptyTab message="Ledger transaction не загружена." />
              )
            ) : null}

            {tab === "user" ? (
              withdrawal.userContext ? (
                <div className="space-y-3 text-sm">
                  <p>
                    <Link href={ROUTES.adminUserDetail(withdrawal.userId)} className="font-medium hover:underline">
                      {withdrawal.userContext.userEmail}
                    </Link>
                  </p>
                  <p className="text-zinc-500">
                    {a.t("admin.drawer.wallet.available")}: {formatUsdtAmount(withdrawal.userContext.availableUsdt)} · {a.t("admin.drawer.wallet.locked")}:{" "}
                    {formatUsdtAmount(withdrawal.userContext.lockedUsdt)}
                  </p>
                  <p className="text-zinc-500">
                    Deposits: {withdrawal.userContext.previousDepositsCount} · Withdrawals:{" "}
                    {withdrawal.userContext.previousWithdrawalsCount}
                  </p>
                  {withdrawal.userContext.riskFlags.length ? (
                    <ul className="space-y-1">
                      {withdrawal.userContext.riskFlags.map((f) => (
                        <li key={f.id} className="text-amber-800">
                          {f.flagCode} ({f.severity})
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <EmptyTab message="Контекст пользователя не загружен." />
              )
            ) : null}

            {tab === "audit" ? (
              withdrawal.audit?.length ? (
                <ul className="space-y-3 text-sm">
                  {withdrawal.audit.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-zinc-800 p-3">
                      <p className="font-medium">{a.formatAuditAction(entry.action)}</p>
                      <p className="text-xs text-zinc-500">
                        {entry.actorEmail ?? "system"} · {formatAdminDate(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message="Записей audit пока нет." />
              )
            ) : null}
          </div>
        ) : null}
      </AdminDetailDrawer>

      {pending?.action === "complete" || pending?.action === "reject" ? (
        <AdminPhraseConfirmDialog
          open={Boolean(pending)}
          onOpenChange={(o) => !o && setPending(null)}
          title={pending?.title ?? "Подтвердить"}
          description={pending?.description ?? ""}
          confirmPhrase={
            pending?.action === "reject"
              ? DANGEROUS_ACTION_PHRASES.withdrawalReject
              : DANGEROUS_ACTION_PHRASES.withdrawalComplete
          }
          confirmLabel={pending?.action === "reject" ? "Отклонить" : "Завершить"}
          variant={pending?.action === "reject" ? "destructive" : "default"}
          onConfirm={confirmAction}
        />
      ) : (
        <AdminConfirmDialog
          open={Boolean(pending)}
          onOpenChange={(o) => !o && setPending(null)}
          title={pending?.title ?? "Подтвердить"}
          description={pending?.description ?? ""}
          variant={pending?.variant === "destructive" ? "destructive" : "default"}
          confirmLabel="Подтвердить"
          onConfirm={confirmAction}
        />
      )}
    </>
  );
}
