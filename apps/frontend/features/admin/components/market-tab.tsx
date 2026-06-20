"use client";

import { AdminTabIntro } from "@/features/admin/components/admin-tab-intro";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { MOCK_ADMIN_MARKET } from "@/features/admin/mocks/admin-data";
import { adminInsetRow, adminSurface } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";

export function MarketTab() {
  const a = useAdminI18n();
  const rows = MOCK_ADMIN_MARKET;

  return (
    <div>
      <AdminTabIntro
        kicker="CRM"
        title={a.t("admin.tab.market")}
        description="Заявки вторичной торговли UNT. Мониторинг до подключения live-стакана."
      />
      <div className={adminSurface("overflow-hidden p-1")}>
        <div
          className={cn(
            "grid grid-cols-[auto_1.2fr_1fr_1fr_1.2fr] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wide",
            "text-muted-foreground",
          )}
        >
          <span>{a.t("admin.table.side")}</span>
          <span>{a.table.track}</span>
          <span>{a.table.units}</span>
          <span>{a.t("admin.table.price")}</span>
          <span>{a.t("admin.table.participantTime")}</span>
        </div>
        <ul className="flex flex-col gap-1 px-2 pb-2" aria-label={a.t("admin.tab.market")}>
          {rows.map((m) => (
            <li
              key={m.id}
              className={cn(
                "grid grid-cols-[auto_1.2fr_1fr_1fr_1.2fr] items-center gap-3 text-sm",
                adminInsetRow(),
              )}
            >
              <span
                className={cn(
                  "rounded-xl px-2 py-1 text-xs font-semibold",
                  m.side === "buy"
                    ? "bg-emerald-500/15 text-emerald-200/95"
                    : "bg-rose-500/12 text-rose-200/95",
                )}
              >
                {m.side === "buy" ? "Покупка" : "Продажа"}
              </span>
              <span className="truncate font-medium text-foreground">{m.releaseTitle}</span>
              <span className="tabular-nums text-muted-foreground">{m.units}</span>
              <span className="tabular-nums text-muted-foreground">{m.priceUsdt} USDT</span>
              <span className="truncate text-xs text-muted-foreground">
                {m.userEmail} · {m.createdAt}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
