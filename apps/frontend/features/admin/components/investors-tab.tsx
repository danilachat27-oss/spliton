"use client";

import { AdminTabIntro } from "@/features/admin/components/admin-tab-intro";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { adminSurface } from "@/features/admin/lib/admin-ui";
import { MOCK_ADMIN_USERS } from "@/features/admin/mocks/admin-data";
import { cn } from "@/lib/utils";

const statusPill: Record<string, string> = {
  ACTIVE: "bg-emerald-500/12 text-emerald-200/95",
  PENDING_EMAIL_VERIFICATION: "bg-amber-500/15 text-amber-200/95",
  SUSPENDED: "bg-rose-500/12 text-rose-200/95",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Активен",
  PENDING_EMAIL_VERIFICATION: "В очереди",
  SUSPENDED: "Приостановлен",
};

export function InvestorsTab() {
  const a = useAdminI18n();
  const rows = MOCK_ADMIN_USERS;

  return (
    <div>
      <AdminTabIntro
        kicker="CRM"
        title={a.t("admin.tab.investors")}
        description="Учётные записи клиентов: статус, баланс в USDT, дата регистрации. Таблица на mock-данных; фильтры слева — заготовка под API."
      />
      <div className={cn(adminSurface("overflow-hidden p-0"))}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <caption className="sr-only">Список инвесторов и статусы учётных записей</caption>
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 font-medium">
                  ID
                </th>
                <th scope="col" className="min-w-44 whitespace-nowrap px-3 py-3.5 font-medium">
                  Email
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3.5 font-medium">
                  Статус
                </th>
                <th scope="col" className="min-w-32 px-3 py-3.5 font-medium">
                  Имя в профиле
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-right font-medium tabular-nums">
                  Баланс, USDT
                </th>
                <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums">
                  Регистрация
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-border/35 transition-colors last:border-b-0 hover:bg-secondary/25",
                    i % 2 === 1 && "bg-secondary/10",
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-muted-foreground">
                    {u.id}
                  </td>
                  <td className="max-w-56 px-3 py-3 align-middle">
                    <span className="block truncate font-medium text-foreground" title={u.email}>
                      {u.email}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 align-middle">
                    <span
                      className={cn(
                        "inline-flex rounded-2xl px-2.5 py-1 text-xs font-medium",
                        statusPill[u.status] ?? "bg-secondary/60 text-muted-foreground",
                      )}
                    >
                      {statusLabel[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="max-w-40 px-3 py-3 align-middle text-muted-foreground">
                    <span className="block truncate" title={u.displayName ?? undefined}>
                      {u.displayName ?? "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right align-middle tabular-nums text-foreground">
                    {u.balanceUsdt}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-middle tabular-nums text-muted-foreground">
                    {u.joinedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
