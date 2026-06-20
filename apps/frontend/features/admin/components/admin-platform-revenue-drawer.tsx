"use client";

import * as React from "react";
import Link from "next/link";

import type { AdminPlatformRevenueTransactionDetail } from "@/features/admin/mocks/admin-platform-revenue.mock";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import {
  platformRevenueSourceLabel,
  platformRevenueSubjectLabel,
} from "@/features/admin/lib/admin-platform-revenue-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminDetailDrawer, AdminLoadingState, AdminStatusBadge } from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";

type TabId = "overview" | "related" | "audit";

type AdminPlatformRevenueDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: AdminPlatformRevenueTransactionDetail | null;
  loading?: boolean;
};

export function AdminPlatformRevenueDrawer({
  open,
  onOpenChange,
  tx,
  loading,
}: AdminPlatformRevenueDrawerProps) {
  const a = useAdminI18n();
  const [tab, setTab] = React.useState<TabId>("overview");
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "related", label: a.t("admin.drawer.platformRevenue.tab.related") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];

  React.useEffect(() => {
    if (open) setTab("overview");
  }, [open, tx?.id]);

  return (
    <AdminDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      wide
      widthClassName="w-[min(720px,100vw)]"
      title={tx ? formatUsdtAmount(tx.amountUsdt) : a.t("admin.drawer.platformRevenue.title")}
      subtitle={tx ? platformRevenueSourceLabel(tx.source) : undefined}
    >
      {loading ? <AdminLoadingState /> : null}
      {!loading && tx ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100"
                }`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="Fee ID" value={<CopyId value={tx.id} />} />
              <Field label={a.t("admin.drawer.platformRevenue.field.source")} value={platformRevenueSourceLabel(tx.source)} />
              <Field label={a.t("admin.drawer.platformRevenue.field.amount")} value={formatUsdtAmount(tx.amountUsdt)} />
              <Field label="Asset" value={tx.asset} />
              <Field
                label={a.table.status}
                value={<AdminStatusBadge label={a.formatAdminStatus(tx.status)} tone="success" />}
              />
              <Field label={a.table.created} value={formatAdminDate(tx.createdAt)} />
              {tx.userEmail ? (
                <Field
                  label={a.t("admin.drawer.platformRevenue.field.user")}
                  value={
                    tx.userId ? (
                      <Link href={ROUTES.adminUserDetail(tx.userId)} className="hover:underline">
                        {tx.userEmail}
                      </Link>
                    ) : (
                      tx.userEmail
                    )
                  }
                />
              ) : null}
              {tx.walletTxId ? (
                <Field label="Wallet tx" value={<CopyId value={tx.walletTxId} />} />
              ) : null}
              {tx.rate ? <Field label="Rate" value={`${tx.rate}%`} /> : null}
            </div>
          ) : null}

          {tab === "related" ? (
            <div className="space-y-3 text-sm">
              <Field label={a.t("admin.drawer.platformRevenue.field.subjectType")} value={platformRevenueSubjectLabel(tx.subjectType)} />
              {tx.subjectId ? <Field label="Subject ID" value={<CopyId value={tx.subjectId} />} /> : null}
              {tx.releaseTitle ? (
                <Field
                  label={a.t("admin.drawer.platformRevenue.field.release")}
                  value={
                    <Link href={ROUTES.adminTracks} className="hover:underline">
                      {tx.releaseTitle}
                    </Link>
                  }
                />
              ) : null}
              {tx.source === "withdrawal_fee" && tx.subjectId ? (
                <Link href={ROUTES.adminWithdrawals} className="text-sky-700 hover:underline">
                  Открыть выводы →
                </Link>
              ) : null}
              {tx.source === "secondary_market_fee" ? (
                <Link href={ROUTES.adminSecondaryMarket} className="text-sky-700 hover:underline">
                  Открыть вторичный рынок →
                </Link>
              ) : null}
              {tx.source === "primary_purchase_fee" ? (
                <Link href={ROUTES.adminRounds} className="text-sky-700 hover:underline">
                  Открыть раунды →
                </Link>
              ) : null}
            </div>
          ) : null}

          {tab === "audit" ? (
            tx.audit?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-zinc-500">
                    <th className="pb-2">Действие</th>
                    <th className="pb-2">Кто</th>
                    <th className="pb-2">{a.table.created}</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.audit.map((entry) => (
                    <tr key={entry.id} className="border-b border-zinc-50">
                      <td className="py-2">{a.formatAuditAction(entry.action)}</td>
                      <td className="py-2">{entry.actorEmail ?? "system"}</td>
                      <td className="py-2 tabular-nums">{formatAdminDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">Audit записи не найдены.</p>
            )
          ) : null}
        </div>
      ) : null}
    </AdminDetailDrawer>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function CopyId({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs">
      {value.slice(0, 12)}…
      <AdminCopyButton value={value} />
    </span>
  );
}
