"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, HelpCircle, RefreshCw } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
  AdminDrawerPrimaryButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import type { AdminRevenueDetail } from "@/features/admin/mocks/admin-revenue.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  formatRevenuePeriod,
  REVENUE_FIELD_TOOLTIPS,
  revenueSourceLabel,
  revenueStatusLabel,
  revenueStatusTone,
} from "@/features/admin/lib/admin-revenue-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import {
  AdminConfirmDialog,
  AdminFormField,
  AdminPhraseConfirmDialog,
  AdminDataTable,
  AdminDetailDrawer,
  AdminFormFooter,
  AdminLoadingState,
  AdminStatusBadge,
  type AdminColumn,
} from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { DANGEROUS_ACTION_PHRASES } from "@/features/admin/config/admin-role-matrix";
import { cn } from "@/lib/utils";

type TabId = "overview" | "preview" | "payouts" | "ledger" | "errors" | "audit";

type AdminRevenueDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AdminRevenueDetail | null;
  loading?: boolean;
  canMutate?: boolean;
  canApprove?: boolean;
  onRun?: (note: string) => Promise<void>;
  onRetry?: () => Promise<void>;
  onRefreshPreview?: () => Promise<void>;
  onSubmitReview?: () => Promise<void>;
  onApprove?: () => Promise<void>;
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

function OverviewField({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5 text-sm text-zinc-100">{value}</div>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

export function AdminRevenueDrawer({
  open,
  onOpenChange,
  event,
  loading,
  canMutate = false,
  canApprove = false,
  onRun,
  onRetry,
  onRefreshPreview,
  onSubmitReview,
  onApprove,
}: AdminRevenueDrawerProps) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "preview", label: a.t("admin.drawer.revenue.tab.preview") },
    { id: "payouts", label: a.t("admin.drawer.revenue.tab.payouts") },
    { id: "ledger", label: a.t("admin.drawer.common.ledger") },
    { id: "errors", label: a.t("admin.drawer.revenue.tab.errors") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");
  const [runNote, setRunNote] = React.useState("");
  const [runConfirm, setRunConfirm] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setRunNote("");
      setRunConfirm(false);
    }
  }, [open, event?.id]);

  const canRun =
    canMutate && event?.status === "approved" && Boolean(event.preview?.holdersCount ?? event.holdersCount);
  const canSubmitReview =
    canMutate && (event?.status === "calculated" || event?.status === "preview") && onSubmitReview;
  const canApproveEvent = canApprove && event?.status === "review" && onApprove;
  const isFailed = event?.status === "failed";
  const isPaid = event?.status === "paid" || event?.status === "completed";

  async function handleRun() {
    if (!onRun) return;
    setActionLoading(true);
    try {
      await onRun(runNote.trim());
      setRunConfirm(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRetry() {
    if (!onRetry) return;
    setActionLoading(true);
    try {
      await onRetry();
    } finally {
      setActionLoading(false);
    }
  }

  const visibleTabs = tabs.filter((t) => {
    if (t.id === "errors") return isFailed;
    return true;
  });

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        widthClassName="w-[min(960px,100vw)]"
        title={event ? `Доход · ${event.trackTitle}` : "Доход релиза"}
        subtitle={event ? formatRevenuePeriod(event.periodFrom, event.periodTo) : undefined}
        footer={
          event && canMutate && !isPaid ? (
            <div className="flex w-full flex-col gap-3">
              {canRun ? (
                <AdminFormField
                  label={a.t("admin.drawer.revenue.runNote")}
                  htmlFor="rev-run-note"
                  hint={REVENUE_FIELD_TOOLTIPS.distribution}
                >
                  <Input
                    id="rev-run-note"
                    value={runNote}
                    onChange={(e) => setRunNote(e.target.value)}
                    className={adminFieldInput}
                    placeholder={a.t("admin.drawer.revenue.runNotePlaceholder")}
                  />
                </AdminFormField>
              ) : null}
              <AdminFormFooter
                left={
                  <>
                    {canSubmitReview ? (
                      <AdminDrawerSecondaryButton
                        disabled={actionLoading}
                        onClick={() => {
                          setActionLoading(true);
                          void onSubmitReview!().finally(() => setActionLoading(false));
                        }}
                      >
                        Отправить на проверку
                      </AdminDrawerSecondaryButton>
                    ) : null}
                    {canApproveEvent ? (
                      <AdminDrawerSecondaryButton
                        disabled={actionLoading}
                        onClick={() => {
                          setActionLoading(true);
                          void onApprove!().finally(() => setActionLoading(false));
                        }}
                      >
                        Одобрить распределение
                      </AdminDrawerSecondaryButton>
                    ) : null}
                    {isFailed && onRetry ? (
                      <AdminDrawerSecondaryButton onClick={() => void handleRetry()} disabled={actionLoading}>
                        <RefreshCw className="mr-1.5 size-3.5" />
                        Вернуть в одобрено и запустить снова
                      </AdminDrawerSecondaryButton>
                    ) : null}
                  </>
                }
                right={
                  canRun ? (
                    <AdminDrawerPrimaryButton onClick={() => setRunConfirm(true)} disabled={actionLoading}>
                      Запустить начисление
                    </AdminDrawerPrimaryButton>
                  ) : (
                    <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>{a.t("admin.drawer.common.close")}</AdminDrawerGhostButton>
                  )
                }
              />
            </div>
          ) : event ? (
            <AdminFormFooter
              right={
                <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>{a.t("admin.drawer.common.close")}</AdminDrawerGhostButton>
              }
            />
          ) : null
        }
      >
        {loading ? <AdminLoadingState /> : null}
        {!loading && event ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100",
                  )}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-50/50 p-4">
                  {event.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.coverUrl} alt="" className="size-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-500">
                      cover
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.adminTracks}
                      className="text-base font-semibold hover:underline"
                    >
                      {event.trackTitle}
                    </Link>
                    {event.artistName ? (
                      <p className="text-sm text-zinc-400">{event.artistName}</p>
                    ) : null}
                    <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                      {event.trackId.slice(0, 12)}…
                      <AdminCopyButton value={event.trackId} />
                    </p>
                  </div>
                  <AdminStatusBadge
                    label={revenueStatusLabel(event.status)}
                    tone={revenueStatusTone(event.status)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <OverviewField
                    label="Revenue event ID"
                    value={
                      <span className="inline-flex items-center gap-1 font-mono text-xs">
                        {event.id}
                        <AdminCopyButton value={event.id} />
                      </span>
                    }
                  />
                  <OverviewField label={a.t("admin.drawer.revenue.field.source")} value={revenueSourceLabel(event.source)} />
                  <OverviewField
                    label={a.t("admin.drawer.revenue.field.period")}
                    value={formatRevenuePeriod(event.periodFrom, event.periodTo)}
                  />
                  <OverviewField
                    label={a.t("admin.drawer.revenue.field.gross")}
                    value={formatUsdtAmount(event.grossRevenueUsdt)}
                    hint={REVENUE_FIELD_TOOLTIPS.grossRevenue}
                  />
                  <OverviewField
                    label={a.t("admin.drawer.revenue.field.holders")}
                    value={formatUsdtAmount(event.holdersShareUsdt)}
                    hint={REVENUE_FIELD_TOOLTIPS.holdersShare}
                  />
                  <OverviewField
                    label={a.t("admin.drawer.revenue.field.artist")}
                    value={formatUsdtAmount(event.artistShareUsdt)}
                    hint={REVENUE_FIELD_TOOLTIPS.artistShare}
                  />
                  <OverviewField
                    label={a.t("admin.drawer.revenue.field.platform")}
                    value={formatUsdtAmount(event.platformShareUsdt)}
                    hint={REVENUE_FIELD_TOOLTIPS.platformShare}
                  />
                  <OverviewField label={a.t("admin.drawer.revenue.field.holdersCount")} value={String(event.holdersCount)} />
                  <OverviewField label={a.t("admin.drawer.revenue.field.createdBy")} value={event.createdBy ?? "system"} />
                  <OverviewField label={a.table.created} value={formatAdminDate(event.createdAt)} />
                  {event.completedAt ? (
                    <OverviewField label={a.t("admin.drawer.revenue.field.completed")} value={formatAdminDate(event.completedAt)} />
                  ) : null}
                  {event.distributionId ? (
                    <OverviewField
                      label="Distribution ID"
                      value={
                        <span className="inline-flex items-center gap-1 font-mono text-xs">
                          {event.distributionId}
                          <AdminCopyButton value={event.distributionId} />
                        </span>
                      }
                    />
                  ) : null}
                </div>

                {event.errorMessage ? (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-950/30 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {event.errorMessage}
                  </div>
                ) : null}

                {event.note ? (
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium">Note:</span> {event.note}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab === "preview" ? (
              <div className="space-y-4">
                {onRefreshPreview ? (
                  <AdminDrawerSecondaryButton onClick={() => void onRefreshPreview()}>
                    Пересчитать начисления
                  </AdminDrawerSecondaryButton>
                ) : null}
                {event.preview ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 text-xs">
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Gross</p>
                        <p className="font-medium tabular-nums">{formatUsdtAmount(event.preview.grossRevenue)}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Держателям</p>
                        <p className="font-medium tabular-nums">{formatUsdtAmount(event.preview.holdersAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Артисту</p>
                        <p className="font-medium tabular-nums">{formatUsdtAmount(event.preview.artistAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Платформе</p>
                        <p className="font-medium tabular-nums">{formatUsdtAmount(event.preview.platformAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Юнитов</p>
                        <p className="font-medium">{event.preview.totalUnits}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 p-2">
                        <p className="text-zinc-400">Держателей</p>
                        <p className="font-medium">{event.preview.holdersCount}</p>
                      </div>
                      {event.preview.roundingDelta != null ? (
                        <div
                          className={cn(
                            "rounded-lg border p-2 sm:col-span-2",
                            event.preview.reconciliationOk === false
                              ? "border-red-200 bg-red-950/30"
                              : "border-zinc-800",
                          )}
                        >
                          <p className="text-zinc-400">Округление (delta)</p>
                          <p className="font-medium tabular-nums">
                            {formatUsdtAmount(event.preview.roundingDelta)}
                            {event.preview.reconciliationOk === false ? " · не сходится" : " · OK"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <FieldHint text={REVENUE_FIELD_TOOLTIPS.preview} />
                    <AdminDataTable
                      className="border-0 shadow-none"
                      rowKey={(h) => h.userId}
                      columns={[
                        {
                          key: "user",
                          header: a.table.holder,
                          render: (h) => (
                            <div>
                              <p className="text-sm">{h.userEmail}</p>
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                                {h.userId.slice(0, 8)}…
                                <AdminCopyButton value={h.userId} />
                              </span>
                            </div>
                          ),
                        },
                        { key: "units", header: a.table.units, render: (h) => h.units },
                        { key: "pct", header: "%", render: (h) => `${h.percentage}%` },
                        {
                          key: "payout",
                          header: "Начисление",
                          render: (h) => formatUsdtAmount(h.payoutAmount),
                        },
                        {
                          key: "wallet",
                          header: a.t("admin.table.wallet"),
                          render: (h) =>
                            h.walletId ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                                {h.walletId.slice(0, 8)}…
                                <AdminCopyButton value={h.walletId} />
                              </span>
                            ) : (
                              "—"
                            ),
                        },
                        {
                          key: "bal",
                          header: "Баланс",
                          render: (h) => formatUsdtAmount(h.availableBalance),
                        },
                      ]}
                      rows={event.preview.holders}
                    />
                  </>
                ) : (
                  <EmptyTab message="Предпросмотр ещё не рассчитан. Нажмите «Пересчитать начисления»." />
                )}
              </div>
            ) : null}

            {tab === "payouts" ? (
              event.payouts?.length ? (
                <AdminDataTable
                  className="border-0 shadow-none"
                  rowKey={(p) => p.id}
                  columns={[
                    { key: "email", header: a.table.holder, render: (p) => p.userEmail },
                    { key: "units", header: a.table.units, render: (p) => p.units },
                    { key: "pct", header: "%", render: (p) => `${p.percentage}%` },
                    { key: "amt", header: "Сумма", render: (p) => formatUsdtAmount(p.amountUsdt) },
                    {
                      key: "tx",
                      header: a.t("admin.table.walletTx"),
                      render: (p) =>
                        p.walletTxId ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                            {p.walletTxId.slice(0, 10)}…
                            <AdminCopyButton value={p.walletTxId} />
                          </span>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      key: "status",
                      header: a.table.status,
                      render: (p) => (
                        <AdminStatusBadge label={revenueStatusLabel(p.status)} tone={revenueStatusTone(p.status)} />
                      ),
                    },
                    {
                      key: "at",
                      header: a.table.created,
                      render: (p) => formatAdminDate(p.createdAt),
                    },
                  ]}
                  rows={event.payouts}
                />
              ) : (
                <EmptyTab
                  message={
                    event.status === "completed"
                      ? "Начисления не найдены."
                      : "Начисления появятся после запуска distribution."
                  }
                />
              )
            ) : null}

            {tab === "ledger" ? (
              event.ledger?.length ? (
                <>
                  <FieldHint text={REVENUE_FIELD_TOOLTIPS.walletLedger} />
                  <AdminDataTable
                    className="border-0 shadow-none"
                    rowKey={(l) => l.id}
                    columns={[
                      {
                        key: "id",
                        header: a.table.id,
                        render: (l) => (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                            {l.id.slice(0, 10)}…
                            <AdminCopyButton value={l.id} />
                          </span>
                        ),
                      },
                      { key: "op", header: "Тип", render: (l) => l.operationType },
                      { key: "amt", header: a.table.amount, render: (l) => formatUsdtAmount(l.amountUsdt) },
                      { key: "status", header: a.table.status, render: (l) => l.status },
                      { key: "user", header: a.table.user, render: (l) => l.userEmail ?? "—" },
                      { key: "at", header: a.table.created, render: (l) => formatAdminDate(l.createdAt) },
                    ]}
                    rows={event.ledger}
                  />
                </>
              ) : (
                <EmptyTab message="Связанные wallet transactions появятся после run distribution." />
              )
            ) : null}

            {tab === "errors" && isFailed ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-950/30 p-4">
                  <p className="text-sm font-medium text-red-900">Причина ошибки</p>
                  <p className="mt-1 text-sm text-red-800">{event.errorMessage ?? "Неизвестная ошибка"}</p>
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-zinc-400">
                  <li>{a.t("admin.drawer.revenue.errorHint1")}</li>
                  <li>{a.t("admin.drawer.revenue.errorHint2")}</li>
                  <li>{a.t("admin.drawer.revenue.errorHint3")}</li>
                  <li>
                    <Link href={ROUTES.adminAudit} className="text-sky-700 hover:underline">
                      Открыть audit log
                    </Link>
                  </li>
                </ul>
              </div>
            ) : null}

            {tab === "audit" ? (
              event.audit?.length ? (
                <AdminDataTable
                  className="border-0 shadow-none"
                  rowKey={(a) => a.id}
                  columns={[
                    { key: "action", header: "Действие", render: (a) => a.action },
                    { key: "actor", header: "Кто", render: (a) => a.actorEmail ?? "system" },
                    { key: "at", header: a.table.created, render: (a) => formatAdminDate(a.createdAt) },
                  ]}
                  rows={event.audit}
                />
              ) : (
                <EmptyTab message="Записи audit по этому событию пока отсутствуют." />
              )
            ) : null}
          </div>
        ) : null}
      </AdminDetailDrawer>

      <AdminPhraseConfirmDialog
        open={runConfirm}
        onOpenChange={setRunConfirm}
        title={a.t("admin.drawer.revenue.confirmRunTitle")}
        description={a.t("admin.drawer.revenue.confirmRunDesc")}
        confirmPhrase={DANGEROUS_ACTION_PHRASES.revenueRun}
        confirmLabel={a.t("admin.drawer.revenue.confirmRunLabel")}
        onConfirm={() => void handleRun()}
      />
    </>
  );
}
