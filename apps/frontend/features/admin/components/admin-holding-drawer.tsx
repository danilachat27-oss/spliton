"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle, Layers, ShieldAlert } from "@/lib/lucide";

import { AdminDrawerGhostButton } from "@/features/admin/components/admin-drawer-buttons";
import type { AdminHoldingDetail } from "@/features/admin/mocks/admin-holdings.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  formatHoldingEvent,
  formatLockReason,
  formatUnitsWithLabel,
  HOLDING_FIELD_TOOLTIPS,
  releaseStatusLabel,
  userStatusLabel,
} from "@/features/admin/lib/admin-holding-i18n";
import { formatAdminDate, formatUsdtAmount, isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import { adminDrawerTab, adminMetricLabel } from "@/features/admin/lib/admin-ui";
import { AdminDetailDrawer, AdminFormFooter, AdminLoadingState, AdminStatusBadge } from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "history" | "distributions" | "market" | "wallet" | "risk";

type AdminHoldingDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: AdminHoldingDetail | null;
  loading?: boolean;
  canViewWallet?: boolean;
};

const drawerTableWrap = "overflow-x-auto rounded-2xl bg-zinc-900/35";
const drawerTableHead =
  "bg-transparent text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500";
const drawerTableCell = "px-4 py-3 text-sm text-zinc-300";
const drawerTableRow = "transition-colors hover:bg-zinc-800/35";
const drawerPanel = "rounded-2xl bg-zinc-900/40 p-4";
const drawerLink =
  "inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition-colors hover:text-[#B7F500]";

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0 text-zinc-600" />
      {text}
    </p>
  );
}

type MetricTone = "neutral" | "success" | "warning" | "info" | "muted";

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
  const resolvedTone =
    tone === "neutral" && (isAdminMetricEmpty(value) || value === "Нет блокировки")
      ? "muted"
      : tone;

  return (
    <div className="flex min-h-[7.25rem] min-w-0 flex-col rounded-2xl bg-zinc-900/40 p-3.5">
      <p className={adminMetricLabel}>{label}</p>
      <p className={metricValueClass(resolvedTone, value)} title={value}>
        {value}
      </p>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{message}</p>;
}

function ReleaseCover({ coverUrl }: { coverUrl: string | null }) {
  const [failed, setFailed] = React.useState(false);
  const showPlaceholder = !coverUrl?.trim() || failed;

  if (showPlaceholder) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500">
        <Layers className="size-5" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl!.trim()}
        alt=""
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function DrawerTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className={drawerTableWrap}>
      <table className="w-full border-collapse">
        <thead className={drawerTableHead}>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminHoldingDrawer({
  open,
  onOpenChange,
  holding,
  loading,
  canViewWallet = true,
}: AdminHoldingDrawerProps) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "history", label: a.t("admin.drawer.holding.tab.history") },
    { id: "distributions", label: a.t("admin.drawer.holding.tab.distributions") },
    { id: "market", label: a.t("admin.drawer.holding.tab.market") },
    { id: "wallet", label: a.t("admin.drawer.holding.tab.wallet") },
    { id: "risk", label: a.t("admin.drawer.holding.tab.risk") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");

  React.useEffect(() => {
    if (open) setTab("overview");
  }, [open, holding?.id]);

  const visibleTabs = tabs.filter((t) => (t.id === "wallet" ? canViewWallet : true));

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      wide
      borderless
      widthClassName="w-[min(960px,100vw)]"
      title={holding ? `${holding.trackTitle} · ${holding.userEmail}` : a.t("admin.drawer.holding.title")}
      subtitle={
        holding
          ? a.t("admin.drawer.holding.subtitle").replace("{id}", `${holding.id.slice(0, 8)}…`)
          : undefined
      }
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
        <AdminLoadingState label={a.t("admin.drawer.holding.loading")} />
      ) : holding ? (
        <div className="space-y-5 pb-4">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
            {holding.id}
            <AdminCopyButton value={holding.id} />
          </p>

          <div className="flex flex-wrap gap-1 pb-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={adminDrawerTab(tab === t.id)}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === "risk" && holding.hasRiskFlag ? (
                  <ShieldAlert className="ml-1 inline size-3 text-amber-400" />
                ) : null}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={drawerPanel}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.holding.holder")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-100">{holding.userEmail}</p>
                  {holding.userDisplayName ? (
                    <p className="mt-0.5 text-sm text-zinc-500">{holding.userDisplayName}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge
                      label={userStatusLabel(holding.userStatus)}
                      tone={holding.userStatus === "active" ? "success" : "neutral"}
                    />
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                      {holding.userId.slice(0, 8)}…
                      <AdminCopyButton value={holding.userId} />
                    </span>
                  </div>
                  <Link href={ROUTES.adminUserDetail(holding.userId)} className={cn(drawerLink, "mt-3")}>
                    {a.t("admin.drawer.holding.openUser")}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className={drawerPanel}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {a.t("admin.drawer.holding.release")}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <ReleaseCover coverUrl={holding.trackCoverUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">{holding.trackTitle}</p>
                      <p className="truncate text-sm text-zinc-500">{holding.trackArtist}</p>
                      <div className="mt-2">
                        <AdminStatusBadge
                          label={releaseStatusLabel(holding.trackStatus)}
                          tone={holding.trackStatus === "active" ? "success" : "neutral"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Юниты</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label={a.t("admin.drawer.holding.metric.totalUnits")}
                    value={formatUnitsWithLabel(holding.totalUnits)}
                    tone="neutral"
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.available")}
                    value={formatUnitsWithLabel(holding.availableUnits)}
                    hint={HOLDING_FIELD_TOOLTIPS.available}
                    tone="success"
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.locked")}
                    value={formatUnitsWithLabel(holding.lockedUnits)}
                    hint={HOLDING_FIELD_TOOLTIPS.locked}
                    tone={Number(holding.lockedUnits) > 0 ? "warning" : "muted"}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Финансы</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label={a.t("admin.drawer.holding.metric.averagePrice")}
                    value={formatUsdtAmount(holding.averagePriceUsdt)}
                    hint={HOLDING_FIELD_TOOLTIPS.averagePrice}
                    tone="info"
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.currentValue")}
                    value={formatUsdtAmount(holding.currentValueUsdt)}
                    hint={HOLDING_FIELD_TOOLTIPS.currentValue}
                    tone="neutral"
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.earned")}
                    value={formatUsdtAmount(holding.earnedTotalUsdt)}
                    hint={HOLDING_FIELD_TOOLTIPS.earned}
                    tone={Number(String(holding.earnedTotalUsdt).replace(/[^\d.-]/g, "")) > 0 ? "success" : "muted"}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Статус</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric
                    label={a.t("admin.drawer.holding.metric.ownership")}
                    value={`${holding.ownershipPct}%`}
                    hint={HOLDING_FIELD_TOOLTIPS.ownership}
                    tone="info"
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.lockReason")}
                    value={formatLockReason(holding.lockReason)}
                    tone={holding.lockReason ? "warning" : "muted"}
                  />
                  <Metric
                    label={a.t("admin.drawer.holding.metric.lastActivity")}
                    value={formatAdminDate(holding.lastActivityAt)}
                    tone="neutral"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "history" ? (
            holding.history?.length ? (
              <DrawerTable
                headers={[
                  a.t("admin.drawer.common.date"),
                  a.t("admin.drawer.common.operation"),
                  a.t("admin.drawer.holding.col.unitsDelta"),
                  a.t("admin.drawer.holding.col.price"),
                ]}
              >
                {holding.history.map((h) => (
                  <tr key={h.id} className={drawerTableRow}>
                    <td className={cn(drawerTableCell, "tabular-nums text-zinc-400")}>{formatAdminDate(h.happenedAt)}</td>
                    <td className={drawerTableCell}>{formatHoldingEvent(h.eventType)}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>{h.unitsDelta}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>
                      {h.pricePerUnit ? formatUsdtAmount(h.pricePerUnit) : formatUsdtAmount("0")}
                    </td>
                  </tr>
                ))}
              </DrawerTable>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.history")} />
            )
          ) : null}

          {tab === "distributions" ? (
            holding.distributions?.length ? (
              <DrawerTable headers={[a.t("admin.drawer.common.date"), "Net", a.t("admin.drawer.common.status")]}>
                {holding.distributions.map((d) => (
                  <tr key={d.id} className={drawerTableRow}>
                    <td className={cn(drawerTableCell, "text-zinc-400")}>{formatAdminDate(d.createdAt)}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>{formatUsdtAmount(d.amountNet)}</td>
                    <td className={drawerTableCell}>{a.formatAdminStatus(d.status)}</td>
                  </tr>
                ))}
              </DrawerTable>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.distributions")} />
            )
          ) : null}

          {tab === "market" ? (
            holding.market?.length ? (
              <DrawerTable
                headers={[
                  a.table.type,
                  a.t("admin.drawer.holding.col.units"),
                  a.t("admin.drawer.holding.col.price"),
                  a.t("admin.drawer.common.status"),
                ]}
              >
                {holding.market.map((m) => (
                  <tr key={m.id} className={drawerTableRow}>
                    <td className={drawerTableCell}>{m.kind}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>{formatUnitsWithLabel(m.units)}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>{formatUsdtAmount(m.pricePerUnit)}</td>
                    <td className={drawerTableCell}>{a.formatAdminStatus(m.status)}</td>
                  </tr>
                ))}
              </DrawerTable>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.market")} />
            )
          ) : null}

          {tab === "wallet" && canViewWallet ? (
            holding.wallet?.length ? (
              <DrawerTable headers={[a.t("admin.drawer.common.date"), a.table.type, "Net"]}>
                {holding.wallet.map((w) => (
                  <tr key={w.id} className={drawerTableRow}>
                    <td className={cn(drawerTableCell, "text-zinc-400")}>{formatAdminDate(w.happenedAt)}</td>
                    <td className={drawerTableCell}>{w.txType}</td>
                    <td className={cn(drawerTableCell, "tabular-nums")}>{formatUsdtAmount(w.netAmount)}</td>
                  </tr>
                ))}
              </DrawerTable>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.wallet")} />
            )
          ) : null}

          {tab === "risk" ? (
            holding.risk?.length ? (
              <ul className="space-y-3">
                {holding.risk.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl bg-amber-500/10 p-3 text-sm text-zinc-300"
                  >
                    <AdminStatusBadge label={r.severity} tone="warning" />
                    <span className="ml-2 font-medium text-zinc-100">{r.flagCode}</span>
                    {r.note ? <p className="mt-2 text-xs leading-relaxed text-zinc-400">{r.note}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyTab
                message={
                  holding.hasRiskFlag
                    ? a.t("admin.drawer.holding.empty.riskActive")
                    : a.t("admin.drawer.holding.empty.riskNone")
                }
              />
            )
          ) : null}
        </div>
      ) : null}
    </AdminDetailDrawer>
  );
}
