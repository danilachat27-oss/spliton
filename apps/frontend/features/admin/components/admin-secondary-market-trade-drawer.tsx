"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle } from "@/lib/lucide";

import {
  AdminDrawerGhostButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import type { AdminTradeDetail } from "@/features/admin/mocks/admin-secondary-market.mock";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  SECONDARY_MARKET_FIELD_TOOLTIPS,
  tradeStatusLabel,
  tradeStatusTone,
} from "@/features/admin/lib/admin-secondary-market-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminConfirmDialog, AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLoadingState, AdminStatusBadge } from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "settlement" | "risk" | "audit";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: AdminTradeDetail | null;
  loading?: boolean;
  canMutate?: boolean;
  onMarkSuspicious?: (note: string) => Promise<void>;
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

export function AdminSecondaryMarketTradeDrawer({
  open,
  onOpenChange,
  trade,
  loading,
  canMutate = false,
  onMarkSuspicious,
}: Props) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "settlement", label: a.t("admin.drawer.common.settlement") },
    { id: "risk", label: a.t("admin.drawer.secondaryTrade.tab.risk") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");
  const [note, setNote] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setNote("");
      setConfirmOpen(false);
    }
  }, [open, trade?.id]);

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        widthClassName="w-[min(960px,100vw)]"
        title={trade ? `Сделка ${formatUsdtAmount(trade.priceUsdt)}` : "Сделка"}
        subtitle={trade?.trackTitle}
        footer={
          trade && canMutate && onMarkSuspicious && !trade.suspicious ? (
            <div className="flex w-full flex-col gap-3">
              <AdminFormField
                label={a.t("admin.drawer.secondaryTrade.adminNote")}
                htmlFor="trd-admin-note"
              >
                <Input
                  id="trd-admin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={adminFieldInput}
                  placeholder={a.t("admin.drawer.secondaryTrade.adminNotePlaceholder")}
                />
              </AdminFormField>
              <AdminFormFooter
                right={
                  <AdminDrawerSecondaryButton onClick={() => setConfirmOpen(true)} disabled={!note.trim()}>
                    Пометить подозрительной
                  </AdminDrawerSecondaryButton>
                }
              />
            </div>
          ) : (
            <AdminFormFooter
              right={
                <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>{a.t("admin.drawer.common.close")}</AdminDrawerGhostButton>
              }
            />
          )
        }
      >
        {loading ? <AdminLoadingState label={a.t("admin.drawer.secondaryTrade.loading")} /> : null}
        {trade && !loading ? (
          <div className="space-y-5 pb-4">
            <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
              {trade.id}
              <AdminCopyButton value={trade.id} />
            </p>
            <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1">
              {tabs.map((t) => (
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
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Продавец</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {trade.sellerEmail}
                    <Link
                      href={`${ROUTES.adminUsers}/${trade.sellerId}`}
                      className="inline-flex h-7 items-center rounded-md px-2 text-zinc-500 hover:bg-zinc-100"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Покупатель</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {trade.buyerEmail}
                    <Link
                      href={`${ROUTES.adminUsers}/${trade.buyerId}`}
                      className="inline-flex h-7 items-center rounded-md px-2 text-zinc-500 hover:bg-zinc-100"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Юниты</dt>
                  <dd>{trade.units}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Комиссия</dt>
                  <dd>{formatUsdtAmount(trade.feeUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Settlement</dt>
                  <dd>
                    <AdminStatusBadge tone={tradeStatusTone(trade.status)} label={tradeStatusLabel(trade.status)} />
                    <FieldHint text={SECONDARY_MARKET_FIELD_TOOLTIPS.settlement} />
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Завершено</dt>
                  <dd>{formatAdminDate(trade.completedAt)}</dd>
                </div>
              </dl>
            ) : null}
            {tab === "settlement" ? (
              trade.ledger?.length ? (
                <ul className="divide-y text-sm">
                  {trade.ledger.map((tx) => (
                    <li key={tx.id} className="flex justify-between py-3">
                      <span>
                        {tx.txType} {tx.direction}
                      </span>
                      <span>{formatUsdtAmount(tx.amountUsdt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message="Settlement ledger пуст" />
              )
            ) : null}
            {tab === "risk" ? (
              trade.risk ? (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Подозрительная</dt>
                    <dd>{trade.risk.suspicious ? "Да" : "Нет"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">High value</dt>
                    <dd>{trade.risk.highValue ? "Да" : "Нет"}</dd>
                  </div>
                </dl>
              ) : (
                <EmptyTab message="Risk-данные недоступны" />
              )
            ) : null}
            {tab === "audit" ? (
              trade.audit?.length ? (
                <ul className="divide-y text-sm">
                  {trade.audit.map((entry) => (
                    <li key={entry.id} className="py-3">
                      <p className="font-medium">{a.formatAuditAction(entry.action)}</p>
                      <p className="text-xs text-zinc-500">{formatAdminDate(entry.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message="Записей аудита нет" />
              )
            ) : null}
          </div>
        ) : null}
      </AdminDetailDrawer>

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={a.t("admin.drawer.secondaryTrade.confirmSuspiciousTitle")}
        description="Сделка попадёт в risk queue для compliance. Укажите причину."
        confirmLabel="Пометить"
        onConfirm={async () => {
          if (onMarkSuspicious && note.trim()) {
            await onMarkSuspicious(note.trim());
            setConfirmOpen(false);
          }
        }}
      />
    </>
  );
}
