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
import type { AdminDepositDetail } from "@/features/admin/mocks/admin-deposits.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  DEPOSIT_FIELD_TOOLTIPS,
  depositStatusLabel,
  formatConfirmations,
  isReadyToCredit,
  tronTxExplorerUrl,
} from "@/features/admin/lib/admin-deposit-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminConfirmDialog, AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLoadingState, AdminPhraseConfirmDialog, AdminStatusBadge } from "@/features/admin/ui";
import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "blockchain" | "ledger" | "user" | "audit";

export type DepositPendingAction = {
  action: "completed" | "failed" | "rejected" | "manual_review" | "reconcile";
  title: string;
  description: string;
  variant?: "default" | "destructive";
  requireNote?: boolean;
};

type AdminDepositDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: AdminDepositDetail | null;
  loading?: boolean;
  canMutate?: boolean;
  onAction?: (action: DepositPendingAction, note: string) => Promise<void>;
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

export function AdminDepositDrawer({
  open,
  onOpenChange,
  deposit,
  loading,
  canMutate = false,
  onAction,
}: AdminDepositDrawerProps) {
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
  const [pending, setPending] = React.useState<DepositPendingAction | null>(null);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setAdminNote("");
      setPending(null);
    }
  }, [open, deposit?.id]);

  async function confirmAction() {
    if (!pending || !onAction) return;
    if (pending.requireNote && !adminNote.trim()) return;
    try {
      await onAction(pending, adminNote.trim());
      setPending(null);
      setAdminNote("");
    } catch {
      /* keep drawer open */
    }
  }

  const explorerUrl = deposit ? tronTxExplorerUrl(deposit.txHash) : null;

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        widthClassName="w-[min(960px,100vw)]"
        title={
          deposit
            ? a.t("admin.drawer.deposit.titleWithAmount").replace(
                "{amount}",
                `${deposit.amountUsdt} USDT`,
              )
            : a.t("admin.drawer.deposit.title")
        }
        subtitle={deposit?.userEmail}
        footer={
          deposit && canMutate && onAction ? (
            <div className="flex w-full flex-col gap-3">
              <AdminFormField
                label={a.t("admin.drawer.withdrawal.adminNote")}
                htmlFor="dep-admin-note"
              >
                <Input
                  id="dep-admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className={adminFieldInput}
                  placeholder={a.t("admin.drawer.withdrawal.adminNotePlaceholder")}
                />
              </AdminFormField>
              <AdminFormFooter
                left={
                  <>
                    <AdminDrawerSecondaryButton
                      onClick={() =>
                        setPending({
                          action: "manual_review",
                          title: a.t("admin.drawer.deposit.confirmManualReviewTitle"),
                          description: a.t("admin.drawer.deposit.confirmManualReviewDesc"),
                        })
                      }
                    >
                      {a.actions.manualReview}
                    </AdminDrawerSecondaryButton>
                    <AdminDrawerSecondaryButton
                      onClick={() =>
                        setPending({
                          action: "failed",
                          title: a.t("admin.drawer.deposit.confirmFailedTitle"),
                          description: a.t("admin.drawer.deposit.confirmFailedDesc"),
                          variant: "destructive",
                          requireNote: true,
                        })
                      }
                    >
                      {a.actions.markFailed}
                    </AdminDrawerSecondaryButton>
                    <AdminDrawerDangerButton
                      onClick={() =>
                        setPending({
                          action: "rejected",
                          title: a.t("admin.drawer.deposit.confirmRejectTitle"),
                          description: a.t("admin.drawer.deposit.confirmRejectDesc"),
                          variant: "destructive",
                          requireNote: true,
                        })
                      }
                    >
                      {a.actions.reject}
                    </AdminDrawerDangerButton>
                  </>
                }
                right={
                  <AdminDrawerPrimaryButton
                    onClick={() =>
                      setPending({
                        action: "reconcile",
                        title: a.t("admin.drawer.deposit.confirmReconcileTitle"),
                        description: a.t("admin.drawer.deposit.confirmReconcileDesc"),
                      })
                    }
                  >
                    {a.t("admin.drawer.deposit.reconcile")}
                  </AdminDrawerPrimaryButton>
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
        {loading ? <AdminLoadingState label={a.t("admin.drawer.deposit.loading")} /> : null}

        {deposit && !loading ? (
          <div className="space-y-5 pb-4">
            <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
              {deposit.id}
              <AdminCopyButton value={deposit.id} />
            </p>

            <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Link href={ROUTES.adminUserDetail(deposit.userId)} className="inline-flex items-center gap-1 text-sm hover:underline">
                    {a.t("admin.drawer.common.user")} <ExternalLink className="size-3.5" />
                  </Link>
                  <Link href={ROUTES.adminWallets} className="text-sm text-zinc-400 hover:underline">
                    {a.adminSectionLabel("wallets")}
                  </Link>
                  <Link href={ROUTES.adminAudit} className="text-sm text-zinc-400 hover:underline">
                    {a.t("admin.drawer.common.audit")}
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800 p-3">
                    <p className="text-[11px] uppercase text-zinc-400">{a.t("admin.drawer.common.amount")}</p>
                    <p className="text-lg font-semibold tabular-nums">{formatUsdtAmount(deposit.amountUsdt)}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 p-3">
                    <p className="text-[11px] uppercase text-zinc-400">{a.t("admin.drawer.common.status")}</p>
                    <AdminStatusBadge label={depositStatusLabel(deposit.status)} tone="pending" />
                  </div>
                  <div className="rounded-xl border border-zinc-800 p-3">
                    <p className="text-[11px] uppercase text-zinc-400">{a.t("admin.drawer.deposit.confirmations")}</p>
                    <p className="font-semibold tabular-nums">
                      {formatConfirmations(deposit.confirmations, deposit.requiredConfirmations)}
                    </p>
                    <FieldHint text={DEPOSIT_FIELD_TOOLTIPS.confirmations} />
                    {isReadyToCredit(deposit.confirmations, deposit.requiredConfirmations, deposit.status) ? (
                      <AdminStatusBadge label={a.t("admin.drawer.deposit.readyToCredit")} tone="success" />
                    ) : null}
                  </div>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">Wallet ID</dt>
                    <dd className="inline-flex items-center gap-1 font-mono text-xs">
                      {deposit.walletId}
                      <AdminCopyButton value={deposit.walletId} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{a.t("admin.drawer.deposit.createdUpdated")}</dt>
                    <dd>
                      {formatAdminDate(deposit.createdAt)} · {formatAdminDate(deposit.updatedAt)}
                    </dd>
                  </div>
                  {deposit.completedAt ? (
                    <div>
                      <dt className="text-zinc-500">{a.t("admin.drawer.common.completed")}</dt>
                      <dd>{formatAdminDate(deposit.completedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
                {deposit.hasRiskFlag ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
                    <ShieldAlert className="size-4 text-amber-600" />
                    Risk flag: {deposit.riskSeverity ?? "flag"}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "blockchain" ? (
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Tx hash</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    {deposit.hasTxHash && deposit.txHash ? (
                      <>
                        <span className="font-mono text-xs">{deposit.txHash}</span>
                        <AdminCopyButton value={deposit.txHash} />
                        {explorerUrl ? (
                          <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-700 hover:underline">
                            Explorer
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <AdminStatusBadge label={a.t("admin.drawer.withdrawal.noTxHash")} tone="warning" />
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Deposit address</dt>
                  <dd className="inline-flex items-center gap-1 font-mono text-xs">
                    {deposit.depositAddress}
                    <AdminCopyButton value={deposit.depositAddress} />
                  </dd>
                </div>
                {deposit.fromAddress ? (
                  <div>
                    <dt className="text-zinc-500">{a.table.address}</dt>
                    <dd className="font-mono text-xs">{deposit.fromAddress}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-zinc-500">{a.t("admin.drawer.wallet.assetNetwork")}</dt>
                  <dd>
                    {deposit.asset} · {deposit.network}
                  </dd>
                </div>
              </dl>
            ) : null}

            {tab === "ledger" ? (
              deposit.ledger ? (
                <dl className="grid gap-2 rounded-xl border border-zinc-800 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{a.t("admin.table.id")}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      {deposit.ledger.id}
                      <AdminCopyButton value={deposit.ledger.id} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{a.table.type}</span>
                    <span>{deposit.ledger.operationType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">
                      {a.t("admin.drawer.common.amount")} / {a.t("admin.drawer.common.fee")} / {a.t("admin.drawer.common.net")}
                    </span>
                    <span className="tabular-nums">
                      {formatUsdtAmount(deposit.ledger.amountUsdt)} / {formatUsdtAmount(deposit.ledger.feeUsdt)} /{" "}
                      {formatUsdtAmount(deposit.ledger.netAmountUsdt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{a.t("admin.drawer.common.status")}</span>
                    <AdminStatusBadge label={deposit.ledger.status} tone="neutral" />
                  </div>
                  <FieldHint text={DEPOSIT_FIELD_TOOLTIPS.ledgerCredit} />
                </dl>
              ) : (
                <EmptyTab message={a.t("admin.drawer.deposit.emptyLedger")} />
              )
            ) : null}

            {tab === "user" ? (
              deposit.userContext ? (
                <div className="space-y-3 text-sm">
                  <p>
                    {deposit.userContext.userEmail} · {deposit.userContext.userStatus}
                  </p>
                  <p>
                    {a
                      .t("admin.drawer.deposit.balance")
                      .replace("{available}", formatUsdtAmount(deposit.userContext.availableUsdt))
                      .replace("{locked}", formatUsdtAmount(deposit.userContext.lockedUsdt))}
                  </p>
                  <p>
                    Deposits: {deposit.userContext.previousDepositsCount} · Withdrawals:{" "}
                    {deposit.userContext.previousWithdrawalsCount}
                  </p>
                  {deposit.userContext.riskFlags.length ? (
                    <ul className="space-y-1">
                      {deposit.userContext.riskFlags.map((f) => (
                        <li key={f.id} className="text-amber-800">
                          {f.flagCode} ({f.severity})
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <EmptyTab message={a.t("admin.drawer.deposit.emptyUser")} />
              )
            ) : null}

            {tab === "audit" ? (
              deposit.audit?.length ? (
                <ul className="space-y-2 text-sm">
                  {deposit.audit.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-zinc-800 p-3">
                      <p className="font-medium">{a.formatAuditAction(entry.action)}</p>
                      <p className="text-xs text-zinc-500">
                        {entry.actorEmail ?? "system"} · {formatAdminDate(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message={a.t("admin.drawer.withdrawal.emptyAudit")} />
              )
            ) : null}
          </div>
        ) : null}
      </AdminDetailDrawer>

      {pending?.action === "reconcile" ? (
        <AdminPhraseConfirmDialog
          open={Boolean(pending)}
          onOpenChange={(o) => !o && setPending(null)}
          title={pending?.title ?? a.t("admin.drawer.deposit.confirmTitle")}
          description={pending?.description ?? ""}
          confirmPhrase={DANGEROUS_ACTION_PHRASES.depositSettle}
          confirmLabel={a.t("admin.drawer.deposit.confirmReconcileLabel")}
          onConfirm={() => void confirmAction()}
        />
      ) : (
        <AdminConfirmDialog
          open={Boolean(pending)}
          onOpenChange={(o) => !o && setPending(null)}
          title={pending?.title ?? a.t("admin.drawer.deposit.confirmTitle")}
          description={pending?.description ?? ""}
          variant={pending?.variant ?? "default"}
          confirmLabel={a.actions.confirm}
          onConfirm={() => void confirmAction()}
        />
      )}
    </>
  );
}
