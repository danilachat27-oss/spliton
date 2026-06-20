"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, HelpCircle } from "@/lib/lucide";

import {
  AdminDrawerDangerButton,
  AdminDrawerGhostButton,
  AdminDrawerSecondaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { Input } from "@/components/ui/input";
import type { AdminListingDetail } from "@/features/admin/mocks/admin-secondary-market.mock";
import { adminFieldInput } from "@/features/admin/lib/admin-ui";
import {
  SECONDARY_MARKET_FIELD_TOOLTIPS,
  listingStatusLabel,
  listingStatusTone,
} from "@/features/admin/lib/admin-secondary-market-i18n";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDate, formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { AdminConfirmDialog, AdminDetailDrawer, AdminFormField, AdminFormFooter, AdminLoadingState, AdminStatusBadge } from "@/features/admin/ui";
import { AdminCopyButton } from "@/features/admin/ui/admin-copy-button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type TabId = "overview" | "units" | "trades" | "ledger" | "risk" | "audit";

export type ListingPendingAction = {
  action: "freeze" | "release" | "cancel";
  title: string;
  description: string;
  variant?: "default" | "destructive";
  requireNote?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: AdminListingDetail | null;
  loading?: boolean;
  canMutate?: boolean;
  onAction?: (action: ListingPendingAction, note: string) => Promise<void>;
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

export function AdminSecondaryMarketListingDrawer({
  open,
  onOpenChange,
  listing,
  loading,
  canMutate = false,
  onAction,
}: Props) {
  const a = useAdminI18n();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: a.t("admin.drawer.common.overview") },
    { id: "units", label: a.t("admin.drawer.secondaryListing.tab.units") },
    { id: "trades", label: a.t("admin.drawer.secondaryListing.tab.trades") },
    { id: "ledger", label: a.t("admin.drawer.holding.tab.wallet") },
    { id: "risk", label: a.t("admin.drawer.wallet.risk") },
    { id: "audit", label: a.t("admin.drawer.common.audit") },
  ];
  const [tab, setTab] = React.useState<TabId>("overview");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState<ListingPendingAction | null>(null);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setNote("");
      setPending(null);
    }
  }, [open, listing?.id]);

  async function confirmAction() {
    if (!pending || !onAction) return;
    if (pending.requireNote && !note.trim()) return;
    await onAction(pending, note.trim());
    setPending(null);
    setNote("");
  }

  return (
    <>
      <AdminDetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        wide
        widthClassName="w-[min(960px,100vw)]"
        title={listing ? `Листинг ${listing.trackTitle}` : "Листинг"}
        subtitle={listing?.sellerEmail}
        footer={
          listing && canMutate && onAction ? (
            <div className="flex w-full flex-col gap-3">
              <AdminFormField
                label={a.t("admin.drawer.secondaryListing.adminNote")}
                htmlFor="lst-admin-note"
              >
                <Input
                  id="lst-admin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={adminFieldInput}
                  placeholder={a.t("admin.drawer.secondaryListing.adminNotePlaceholder")}
                />
              </AdminFormField>
              <AdminFormFooter
                left={
                  <>
                    {listing.status === "frozen" ? (
                      <AdminDrawerSecondaryButton
                        onClick={() =>
                          setPending({
                            action: "release",
                            title: "Снять заморозку?",
                            description:
                              "Листинг снова станет доступен для покупки, если его статус активен.",
                          })
                        }
                      >
                        Разморозить
                      </AdminDrawerSecondaryButton>
                    ) : listing.status === "active" ? (
                      <AdminDrawerSecondaryButton
                        onClick={() =>
                          setPending({
                            action: "freeze",
                            title: "Заморозить листинг?",
                            description:
                              "Пользователи не смогут купить этот листинг до снятия заморозки. Юниты останутся заблокированными. Действие будет записано в журнал аудита.",
                            requireNote: true,
                          })
                        }
                      >
                        Заморозить
                      </AdminDrawerSecondaryButton>
                    ) : null}
                  </>
                }
                right={
                  listing.status !== "cancelled" && listing.status !== "completed" ? (
                    <AdminDrawerDangerButton
                      onClick={() =>
                        setPending({
                          action: "cancel",
                          title: "Отменить листинг?",
                          description:
                            "Заблокированные юниты будут возвращены пользователю в доступные. Действие будет записано в журнал аудита.",
                          variant: "destructive",
                          requireNote: true,
                        })
                      }
                    >
                      Отменить
                    </AdminDrawerDangerButton>
                  ) : (
                    <AdminDrawerGhostButton onClick={() => onOpenChange(false)}>{a.t("admin.drawer.common.close")}</AdminDrawerGhostButton>
                  )
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
        {loading ? <AdminLoadingState label={a.t("admin.drawer.secondaryListing.loading")} /> : null}
        {listing && !loading ? (
          <div className="space-y-5 pb-4">
            <p className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
              {listing.id}
              <AdminCopyButton value={listing.id} />
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
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500">Продавец</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    {listing.sellerEmail}
                    <AdminStatusBadge tone="success" label={listing.sellerStatus} />
                    <AdminCopyButton value={listing.sellerId} />
                    <Link
                      href={`${ROUTES.adminUsers}/${listing.sellerId}`}
                      className="inline-flex h-7 items-center rounded-md px-2 text-zinc-500 hover:bg-zinc-100"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Релиз</dt>
                  <dd className="font-medium">{listing.trackTitle}</dd>
                  {listing.artistName ? <dd className="text-zinc-500">{listing.artistName}</dd> : null}
                </div>
                <div>
                  <dt className="text-zinc-500">Статус</dt>
                  <dd>
                    <AdminStatusBadge
                      tone={listingStatusTone(listing.status)}
                      label={listingStatusLabel(listing.status)}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Юниты</dt>
                  <dd>{listing.units} юнитов</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Цена за юнит</dt>
                  <dd>{formatUsdtAmount(listing.pricePerUnitUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Итого</dt>
                  <dd>{formatUsdtAmount(listing.totalPriceUsdt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Комиссия платформы</dt>
                  <dd>{formatUsdtAmount(listing.platformFeeEstimateUsdt)}</dd>
                  <FieldHint text={SECONDARY_MARKET_FIELD_TOOLTIPS.secondaryFee} />
                </div>
                <div>
                  <dt className="text-zinc-500">Создано</dt>
                  <dd>{formatAdminDate(listing.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Обновлено</dt>
                  <dd>{formatAdminDate(listing.updatedAt)}</dd>
                </div>
              </dl>
            ) : null}
            {tab === "units" ? (
              listing.unitsDetail ? (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Всего в листинге</dt>
                    <dd>{listing.unitsDetail.unitsTotal} юнитов</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Доступно к продаже</dt>
                    <dd>{listing.unitsDetail.unitsAvailable} юнитов</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Заблокировано</dt>
                    <dd>{listing.unitsDetail.lockedUnits} юнитов</dd>
                    <FieldHint text={SECONDARY_MARKET_FIELD_TOOLTIPS.lockedUnitsRow} />
                  </div>
                </dl>
              ) : (
                <EmptyTab message="Данные по юнитам недоступны" />
              )
            ) : null}
            {tab === "trades" ? (
              listing.trades?.length ? (
                <ul className="divide-y text-sm">
                  {listing.trades.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{t.id.slice(0, 12)}…</span>
                        <AdminStatusBadge tone="neutral" label={a.formatAdminStatus(t.status)} />
                      </div>
                      <p className="text-zinc-400">{t.buyerEmail}</p>
                      <p className="text-zinc-500">
                        {t.units} юн. · {formatUsdtAmount(t.amountUsdt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message="По этому листингу сделок пока нет" />
              )
            ) : null}
            {tab === "ledger" ? (
              listing.ledger?.length ? (
                <ul className="divide-y text-sm">
                  {listing.ledger.map((tx) => (
                    <li key={tx.id} className="flex justify-between py-3">
                      <span className="font-mono text-xs">{tx.txType}</span>
                      <span>{formatUsdtAmount(tx.amountUsdt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyTab message="Записей wallet ledger нет" />
              )
            ) : null}
            {tab === "risk" ? (
              listing.risk ? (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-zinc-500">Заморожен</dt>
                    <dd>{listing.risk.frozen ? "Да" : "Нет"}</dd>
                  </div>
                  {listing.risk.flags.length ? (
                    <ul className="divide-y rounded border">
                      {listing.risk.flags.map((f, i) => (
                        <li key={i} className="px-3 py-2 text-xs">
                          {f.code} · {f.severity}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyTab message="Флагов риска нет" />
                  )}
                </dl>
              ) : (
                <EmptyTab message="Risk-данные недоступны" />
              )
            ) : null}
            {tab === "audit" ? (
              listing.audit?.length ? (
                <ul className="divide-y text-sm">
                  {listing.audit.map((entry) => (
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
        open={Boolean(pending)}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        variant={pending?.variant === "destructive" ? "destructive" : "default"}
        onConfirm={confirmAction}
      />
    </>
  );
}
