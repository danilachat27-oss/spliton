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
import { adminAlertSurface, adminDrawerTab, adminFieldInput, adminMetricLabel } from "@/features/admin/lib/admin-ui";
import {
  formatRevenuePeriod,
  revenueFieldTooltip,
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

const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4 sm:p-5";
const drawerLink =
  "text-sm font-semibold text-zinc-100 transition-colors hover:text-[#B7F500]";

type MetricTone = "neutral" | "success" | "warning" | "info" | "muted";

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
    <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0 text-zinc-600" />
      {text}
    </p>
  );
}

function metricValueClass(tone: MetricTone, value: string): string {
  const compact = value.replace(/\s/g, "").length > 14;
  const medium = value.replace(/\s/g, "").length > 10;
  const size = compact ? "text-base leading-snug" : medium ? "text-lg" : "text-xl sm:text-2xl";
  const toneClass: Record<MetricTone, string> = {
    neutral: "text-zinc-100",
    success: "text-emerald-400",
    warning: "text-amber-400",
    info: "text-sky-400",
    muted: "text-zinc-500",
  };
  return cn(
    "mt-1 font-semibold tabular-nums tracking-tight break-words",
    tone === "muted" ? "text-sm font-medium" : size,
    toneClass[tone],
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: MetricTone;
}) {
  return (
    <div className="flex min-h-[7.25rem] min-w-0 flex-col rounded-2xl bg-zinc-900/40 p-3.5 sm:p-4">
      <p className={adminMetricLabel}>{label}</p>
      <p className={metricValueClass(tone, value)} title={value}>
        {value}
      </p>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className={adminMetricLabel}>{label}</p>
      <div className="text-sm text-zinc-200">{value}</div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className={cn(drawerPanel, "py-10 text-center text-sm text-zinc-500")}>{message}</div>
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
  const { locale } = a;
  const statusLabel = (status: string) => revenueStatusLabel(status, locale);
  const sourceLabel = (source: string) => revenueSourceLabel(source, locale);
  const tooltip = (field: Parameters<typeof revenueFieldTooltip>[0]) => revenueFieldTooltip(field, locale);
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

  const visibleTabs = tabs.filter((item) => {
    if (item.id === "errors") return isFailed;
    return true;
  });

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        borderless
        widthClassName="w-[min(960px,100vw)]"
        title={
          event
            ? a.t("admin.drawer.revenue.titleWithTrack").replace("{track}", event.trackTitle)
            : a.t("admin.drawer.revenue.title")
        }
        subtitle={event ? formatRevenuePeriod(event.periodFrom, event.periodTo, locale) : undefined}
        footer={
          event && canMutate && !isPaid ? (
            <div className="flex w-full flex-col gap-3">
              {canRun ? (
                <AdminFormField
                  label={a.t("admin.drawer.revenue.runNote")}
                  htmlFor="rev-run-note"
                  hint={tooltip("distribution")}
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
                        {a.t("admin.drawer.revenue.action.submitReview")}
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
                        {a.t("admin.drawer.revenue.action.approve")}
                      </AdminDrawerSecondaryButton>
                    ) : null}
                    {isFailed && onRetry ? (
                      <AdminDrawerSecondaryButton onClick={() => void handleRetry()} disabled={actionLoading}>
                        <RefreshCw className="mr-1.5 size-3.5" />
                        {a.t("admin.drawer.revenue.action.retry")}
                      </AdminDrawerSecondaryButton>
                    ) : null}
                  </>
                }
                right={
                  canRun ? (
                    <AdminDrawerPrimaryButton onClick={() => setRunConfirm(true)} disabled={actionLoading}>
                      {a.t("admin.drawer.revenue.action.run")}
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
          <div className="space-y-6 pb-4">
            <div className="flex flex-wrap gap-1">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={adminDrawerTab(tab === item.id)}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="space-y-5">
                <div className={cn(drawerPanel, "flex items-start gap-4 sm:gap-5")}>
                  {event.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.coverUrl} alt="" className="size-16 shrink-0 rounded-xl object-cover sm:size-20" />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-[11px] text-zinc-500 sm:size-20">
                      {a.t("admin.drawer.common.noCover")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link href={ROUTES.adminTracks} className={cn(drawerLink, "text-base sm:text-lg")}>
                          {event.trackTitle}
                        </Link>
                        {event.artistName ? (
                          <p className="text-sm text-zinc-500">{event.artistName}</p>
                        ) : null}
                      </div>
                      <AdminStatusBadge
                        label={statusLabel(event.status)}
                        tone={revenueStatusTone(event.status)}
                      />
                    </div>
                    <p className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                      {event.trackId.slice(0, 12)}…
                      <AdminCopyButton value={event.trackId} />
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    label={a.t("admin.drawer.revenue.field.gross")}
                    value={formatUsdtAmount(event.grossRevenueUsdt)}
                    hint={tooltip("grossRevenue")}
                    tone="info"
                  />
                  <Metric
                    label={a.t("admin.drawer.revenue.field.holders")}
                    value={formatUsdtAmount(event.holdersShareUsdt)}
                    hint={tooltip("holdersShare")}
                    tone="success"
                  />
                  <Metric
                    label={a.t("admin.drawer.revenue.field.artist")}
                    value={formatUsdtAmount(event.artistShareUsdt)}
                    hint={tooltip("artistShare")}
                  />
                  <Metric
                    label={a.t("admin.drawer.revenue.field.platform")}
                    value={formatUsdtAmount(event.platformShareUsdt)}
                    hint={tooltip("platformShare")}
                  />
                </div>

                <div className={cn(drawerPanel, "grid gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
                  <MetaField
                    label={a.t("admin.drawer.revenue.field.eventId")}
                    value={
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-300">
                        {event.id.slice(0, 18)}…
                        <AdminCopyButton value={event.id} />
                      </span>
                    }
                  />
                  <MetaField label={a.t("admin.drawer.revenue.field.source")} value={sourceLabel(event.source)} />
                  <MetaField
                    label={a.t("admin.drawer.revenue.field.period")}
                    value={formatRevenuePeriod(event.periodFrom, event.periodTo, locale)}
                  />
                  <MetaField
                    label={a.t("admin.drawer.revenue.field.holdersCount")}
                    value={
                      <span className={event.holdersCount > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {String(event.holdersCount)}
                      </span>
                    }
                  />
                  <MetaField
                    label={a.t("admin.drawer.revenue.field.createdBy")}
                    value={
                      event.createdBy && event.createdBy !== "system"
                        ? event.createdBy
                        : a.t("admin.drawer.common.systemActor")
                    }
                  />
                  <MetaField label={a.table.created} value={formatAdminDate(event.createdAt)} />
                  {event.completedAt ? (
                    <MetaField
                      label={a.t("admin.drawer.revenue.field.completed")}
                      value={formatAdminDate(event.completedAt)}
                    />
                  ) : null}
                  {event.distributionId ? (
                    <MetaField
                      label={a.t("admin.drawer.revenue.field.distributionId")}
                      value={
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-300">
                          {event.distributionId.slice(0, 18)}…
                          <AdminCopyButton value={event.distributionId} />
                        </span>
                      }
                    />
                  ) : null}
                </div>

                {event.errorMessage ? (
                  <div className={cn(drawerPanel, adminAlertSurface("danger"), "flex items-start gap-2")}>
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p className="text-sm leading-relaxed">{event.errorMessage}</p>
                  </div>
                ) : null}

                {event.note ? (
                  <div className={drawerPanel}>
                    <p className={adminMetricLabel}>{a.t("admin.drawer.revenue.field.note")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{event.note}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "preview" ? (
              <div className="space-y-5">
                {onRefreshPreview ? (
                  <AdminDrawerSecondaryButton onClick={() => void onRefreshPreview()}>
                    {a.t("admin.drawer.revenue.action.recalculate")}
                  </AdminDrawerSecondaryButton>
                ) : null}
                {event.preview ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      <Metric
                        label={a.t("admin.drawer.revenue.preview.gross")}
                        value={formatUsdtAmount(event.preview.grossRevenue)}
                        tone="info"
                      />
                      <Metric
                        label={a.t("admin.drawer.revenue.field.holders")}
                        value={formatUsdtAmount(event.preview.holdersAmount)}
                        tone="success"
                      />
                      <Metric
                        label={a.t("admin.drawer.revenue.field.artist")}
                        value={formatUsdtAmount(event.preview.artistAmount)}
                      />
                      <Metric
                        label={a.t("admin.drawer.revenue.field.platform")}
                        value={formatUsdtAmount(event.preview.platformAmount)}
                      />
                      <Metric label={a.table.units} value={String(event.preview.totalUnits)} />
                      <Metric
                        label={a.t("admin.drawer.revenue.field.holdersCount")}
                        value={String(event.preview.holdersCount)}
                        tone={event.preview.holdersCount > 0 ? "success" : "warning"}
                      />
                      {event.preview.roundingDelta != null ? (
                        <div
                          className={cn(
                            "flex min-h-[7.25rem] flex-col rounded-2xl p-3.5 sm:col-span-2 sm:p-4",
                            event.preview.reconciliationOk === false
                              ? "bg-rose-500/10"
                              : "bg-zinc-900/40",
                          )}
                        >
                          <p className={adminMetricLabel}>{a.t("admin.drawer.revenue.preview.rounding")}</p>
                          <p
                            className={metricValueClass(
                              event.preview.reconciliationOk === false ? "warning" : "success",
                              formatUsdtAmount(event.preview.roundingDelta),
                            )}
                          >
                            {formatUsdtAmount(event.preview.roundingDelta)}
                            {event.preview.reconciliationOk === false
                              ? a.t("admin.drawer.revenue.preview.reconciliationFail")
                              : a.t("admin.drawer.revenue.preview.reconciliationOk")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className={drawerPanel}>
                      <FieldHint text={tooltip("preview")} />
                    </div>
                    <AdminDataTable
                      borderless
                      className="shadow-none"
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
                          header: a.t("admin.drawer.revenue.column.payout"),
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
                          header: a.t("admin.drawer.revenue.column.balance"),
                          render: (h) => formatUsdtAmount(h.availableBalance),
                        },
                      ]}
                      rows={event.preview.holders}
                    />
                  </>
                ) : (
                  <EmptyTab message={a.t("admin.drawer.revenue.empty.preview")} />
                )}
              </div>
            ) : null}

            {tab === "payouts" ? (
              event.payouts?.length ? (
                <AdminDataTable
                  borderless
                  className="shadow-none"
                  rowKey={(p) => p.id}
                  columns={[
                    { key: "email", header: a.table.holder, render: (p) => p.userEmail },
                    { key: "units", header: a.table.units, render: (p) => p.units },
                    { key: "pct", header: "%", render: (p) => `${p.percentage}%` },
                    { key: "amt", header: a.table.amount, render: (p) => formatUsdtAmount(p.amountUsdt) },
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
                        <AdminStatusBadge label={statusLabel(p.status)} tone={revenueStatusTone(p.status)} />
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
                      ? a.t("admin.drawer.revenue.empty.payoutsNotFound")
                      : a.t("admin.drawer.revenue.empty.payoutsPending")
                  }
                />
              )
            ) : null}

            {tab === "ledger" ? (
              event.ledger?.length ? (
                <div className="space-y-4">
                  <div className={drawerPanel}>
                    <FieldHint text={tooltip("walletLedger")} />
                  </div>
                  <AdminDataTable
                    borderless
                    className="shadow-none"
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
                      { key: "op", header: a.t("admin.drawer.revenue.column.type"), render: (l) => l.operationType },
                      { key: "amt", header: a.table.amount, render: (l) => formatUsdtAmount(l.amountUsdt) },
                      { key: "status", header: a.table.status, render: (l) => l.status },
                      { key: "user", header: a.table.user, render: (l) => l.userEmail ?? "—" },
                      { key: "at", header: a.table.created, render: (l) => formatAdminDate(l.createdAt) },
                    ]}
                    rows={event.ledger}
                  />
                </div>
              ) : (
                <EmptyTab message={a.t("admin.drawer.revenue.empty.ledger")} />
              )
            ) : null}

            {tab === "errors" && isFailed ? (
              <div className="space-y-5">
                <div className={cn(drawerPanel, adminAlertSurface("danger"))}>
                  <p className="text-sm font-medium">{a.t("admin.drawer.revenue.errors.reason")}</p>
                  <p className="mt-2 text-sm leading-relaxed opacity-90">
                    {event.errorMessage ?? a.t("admin.drawer.revenue.errors.unknown")}
                  </p>
                </div>
                <div className={cn(drawerPanel, "space-y-2 text-sm text-zinc-400")}>
                  <p>{a.t("admin.drawer.revenue.errorHint1")}</p>
                  <p>{a.t("admin.drawer.revenue.errorHint2")}</p>
                  <p>{a.t("admin.drawer.revenue.errorHint3")}</p>
                  <p>
                    <Link href={ROUTES.adminAudit} className={drawerLink}>
                      {a.t("admin.drawer.revenue.errors.openAudit")}
                    </Link>
                  </p>
                </div>
              </div>
            ) : null}

            {tab === "audit" ? (
              event.audit?.length ? (
                <AdminDataTable
                  borderless
                  className="shadow-none"
                  rowKey={(a) => a.id}
                  columns={[
                    { key: "action", header: a.t("admin.drawer.revenue.column.action"), render: (row) => row.action },
                    { key: "actor", header: a.t("admin.drawer.revenue.column.actor"), render: (row) => row.actorEmail ?? "—" },
                    { key: "at", header: a.table.created, render: (a) => formatAdminDate(a.createdAt) },
                  ]}
                  rows={event.audit}
                />
              ) : (
                <EmptyTab message={a.t("admin.drawer.revenue.empty.audit")} />
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
