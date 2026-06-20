"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle, ShieldAlert } from "@/lib/lucide";

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
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
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

function FieldHint({ text }: { text: string }) {
  return (
    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-relaxed text-zinc-500">
      <HelpCircle className="mt-0.5 size-3 shrink-0" />
      {text}
    </p>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">{value}</p>
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{message}</p>;
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
      {loading ? <AdminLoadingState label={a.t("admin.drawer.holding.loading")} /> : null}

      {holding && !loading ? (
        <div className="space-y-5 pb-4">
          <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
            {holding.id}
            <AdminCopyButton value={holding.id} />
          </p>

          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-1">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t.id ? "bg-neutral-900 text-white" : "text-zinc-400 hover:bg-zinc-100",
                )}
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
                <div className="rounded-2xl border border-zinc-800 bg-zinc-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{a.t("admin.drawer.holding.holder")}</p>
                  <p className="mt-2 font-medium text-zinc-100">{holding.userEmail}</p>
                  {holding.userDisplayName ? (
                    <p className="text-sm text-zinc-500">{holding.userDisplayName}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={userStatusLabel(holding.userStatus)} tone="neutral" />
                    <span className="font-mono text-[11px] text-zinc-400">{holding.userId.slice(0, 8)}…</span>
                    <AdminCopyButton value={holding.userId} />
                  </div>
                  <Link
                    href={ROUTES.adminUserDetail(holding.userId)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:underline"
                  >
                    {a.t("admin.drawer.holding.openUser")}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{a.t("admin.drawer.holding.release")}</p>
                  <div className="mt-2 flex gap-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                      {holding.trackCoverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={holding.trackCoverUrl} alt="" className="size-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-100">{holding.trackTitle}</p>
                      <p className="text-sm text-zinc-500">{holding.trackArtist}</p>
                      <AdminStatusBadge label={releaseStatusLabel(holding.trackStatus)} tone="neutral" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label={a.t("admin.drawer.holding.metric.totalUnits")} value={formatUnitsWithLabel(holding.totalUnits)} />
                <Metric
                  label={a.t("admin.drawer.holding.metric.available")}
                  value={formatUnitsWithLabel(holding.availableUnits)}
                  hint={HOLDING_FIELD_TOOLTIPS.available}
                />
                <Metric
                  label={a.t("admin.drawer.holding.metric.locked")}
                  value={formatUnitsWithLabel(holding.lockedUnits)}
                  hint={HOLDING_FIELD_TOOLTIPS.locked}
                />
                <Metric
                  label={a.t("admin.drawer.holding.metric.averagePrice")}
                  value={formatUsdtAmount(holding.averagePriceUsdt)}
                  hint={HOLDING_FIELD_TOOLTIPS.averagePrice}
                />
                <Metric
                  label={a.t("admin.drawer.holding.metric.currentValue")}
                  value={formatUsdtAmount(holding.currentValueUsdt)}
                  hint={HOLDING_FIELD_TOOLTIPS.currentValue}
                />
                <Metric
                  label={a.t("admin.drawer.holding.metric.earned")}
                  value={formatUsdtAmount(holding.earnedTotalUsdt)}
                  hint={HOLDING_FIELD_TOOLTIPS.earned}
                />
                <Metric label={a.t("admin.drawer.holding.metric.ownership")} value={`${holding.ownershipPct}%`} hint={HOLDING_FIELD_TOOLTIPS.ownership} />
                <Metric label={a.t("admin.drawer.holding.metric.lockReason")} value={formatLockReason(holding.lockReason)} />
                <Metric label={a.t("admin.drawer.holding.metric.lastActivity")} value={formatAdminDate(holding.lastActivityAt)} />
              </div>
            </div>
          ) : null}

          {tab === "history" ? (
            holding.history?.length ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.date")}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.operation")}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.holding.col.unitsDelta")}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.holding.col.price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holding.history.map((h) => (
                      <tr key={h.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2 tabular-nums">{formatAdminDate(h.happenedAt)}</td>
                        <td className="px-3 py-2">{formatHoldingEvent(h.eventType)}</td>
                        <td className="px-3 py-2 tabular-nums">{h.unitsDelta}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {h.pricePerUnit ? formatUsdtAmount(h.pricePerUnit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.history")} />
            )
          ) : null}

          {tab === "distributions" ? (
            holding.distributions?.length ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.date")}</th>
                      <th className="px-3 py-2">Net</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holding.distributions.map((d) => (
                      <tr key={d.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2">{formatAdminDate(d.createdAt)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatUsdtAmount(d.amountNet)}</td>
                        <td className="px-3 py-2">{a.formatAdminStatus(d.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.distributions")} />
            )
          ) : null}

          {tab === "market" ? (
            holding.market?.length ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">{a.table.type}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.holding.col.units")}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.holding.col.price")}</th>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holding.market.map((m) => (
                      <tr key={m.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2">{m.kind}</td>
                        <td className="px-3 py-2 tabular-nums">{formatUnitsWithLabel(m.units)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatUsdtAmount(m.pricePerUnit)}</td>
                        <td className="px-3 py-2">{a.formatAdminStatus(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.market")} />
            )
          ) : null}

          {tab === "wallet" && canViewWallet ? (
            holding.wallet?.length ? (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">{a.t("admin.drawer.common.date")}</th>
                      <th className="px-3 py-2">{a.table.type}</th>
                      <th className="px-3 py-2">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holding.wallet.map((w) => (
                      <tr key={w.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2">{formatAdminDate(w.happenedAt)}</td>
                        <td className="px-3 py-2">{w.txType}</td>
                        <td className="px-3 py-2 tabular-nums">{formatUsdtAmount(w.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyTab message={a.t("admin.drawer.holding.empty.wallet")} />
            )
          ) : null}

          {tab === "risk" ? (
            holding.risk?.length ? (
              <ul className="space-y-3">
                {holding.risk.map((r) => (
                  <li key={r.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
                    <AdminStatusBadge label={r.severity} tone="warning" />
                    <span className="ml-2 font-medium">{r.flagCode}</span>
                    {r.note ? <p className="mt-2 text-zinc-400">{r.note}</p> : null}
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
