"use client";

import Link from "next/link";

import {
  payoutHistoryStatusLabel,
  payoutHistoryTypeLabel,
} from "@/components/dashboard/assets/payout-history-labels";
import { payoutHistory, type PayoutHistoryRow } from "@/components/dashboard/assets/payouts-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const statusTone: Record<PayoutHistoryRow["status"], string> = {
  accrued: "bg-neutral-100 text-neutral-800",
  available: "bg-lime-100/90 text-lime-900",
  processing: "bg-amber-50 text-amber-900",
  paid: "bg-blue-50 text-blue-900",
  completed: "bg-neutral-100/90 text-neutral-700",
};

export type PayoutHistoryTableProps = {
  rows?: PayoutHistoryRow[];
  showCaption?: boolean;
};

export function PayoutHistoryTable({ rows = payoutHistory, showCaption = true }: PayoutHistoryTableProps) {
  const { t } = useI18n();

  if (rows.length === 0) {
    return (
      <section className="rounded-3xl bg-white px-5 py-12 sm:px-8 sm:py-14">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">Ledger</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">{t("history.table.emptyTitle")}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">{t("history.table.emptyBody")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex h-10 items-center rounded-xl bg-lime-400 px-4 text-xs font-semibold text-neutral-950 transition hover:bg-lime-300"
          >
            {t("history.table.openCatalog")}
          </Link>
          <Link
            href={ROUTES.dashboardPositions}
            className="inline-flex h-10 items-center rounded-xl bg-neutral-100 px-4 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-200/90"
          >
            {t("history.table.myPositions")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white px-4 py-5 sm:px-6 sm:py-6">
      {showCaption ? (
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">History</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">{t("history.table.title")}</h2>
          </div>
          <span className="font-mono text-xs text-neutral-400">{rows.length} tx</span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl bg-neutral-50/80">
        <table className="w-full min-w-[720px] table-fixed text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              <th className="w-[14%] px-3 py-3 pl-4">{t("history.table.colDateRef")}</th>
              <th className="w-[18%] px-3 py-3">{t("history.table.colRelease")}</th>
              <th className="w-[11%] px-3 py-3">{t("history.table.colType")}</th>
              <th className="w-[13%] px-3 py-3">{t("history.table.colUnits")}</th>
              <th className="w-[13%] px-3 py-3">{t("history.table.colAmount")}</th>
              <th className="w-[13%] px-3 py-3">{t("history.table.colStatus")}</th>
              <th className="w-[18%] px-3 py-3 pr-4">{t("history.table.colAction")}</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors hover:bg-neutral-50/90",
                  i !== rows.length - 1 && "border-b border-neutral-100",
                )}
              >
                <td className="px-3 py-3.5 pl-4 align-top">
                  <div className="text-neutral-800">{row.date}</div>
                  <div className="mt-0.5 font-mono text-[10px] tracking-tight text-neutral-400">{row.ledgerRef}</div>
                </td>
                <td className="px-3 py-3.5 align-top font-medium text-neutral-900">{row.release}</td>
                <td className="px-3 py-3.5 align-top">
                  <span className="text-neutral-600">{payoutHistoryTypeLabel(row.type, t)}</span>
                </td>
                <td className="px-3 py-3.5 align-top font-mono text-xs text-neutral-600">{row.unitsShare}</td>
                <td className="px-3 py-3.5 align-top font-mono text-sm font-semibold tabular-nums text-neutral-900">
                  {row.amount}
                </td>
                <td className="px-3 py-3.5 align-top">
                  <span className={cn("inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold", statusTone[row.status])}>
                    {payoutHistoryStatusLabel(row.status, t)}
                  </span>
                </td>
                <td className="px-3 py-3.5 pr-4 align-top">
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg bg-neutral-100 px-3 text-[11px] font-semibold text-neutral-800 transition hover:bg-neutral-200/90"
                  >
                    {t("history.table.details")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
