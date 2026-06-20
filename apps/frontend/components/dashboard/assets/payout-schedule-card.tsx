"use client";

import { payoutScheduleStatusLabel } from "@/components/dashboard/assets/payout-history-labels";
import { payoutSchedule, type PayoutScheduleRow } from "@/components/dashboard/assets/payouts-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";

const scheduleStatus: Record<PayoutScheduleRow["status"], string> = {
  expected: "border-neutral-300 bg-white text-neutral-700",
  calculating: "border-neutral-200 bg-neutral-100 text-neutral-800",
  accrued: "border-lime-200 bg-lime-50 text-lime-800",
};

export function PayoutScheduleCard() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl bg-white p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">Schedule</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">{t("payouts.schedule.title")}</h3>

      <div className="mt-4 space-y-2.5">
        {payoutSchedule.map((row) => (
          <article key={row.id} className="rounded-xl bg-neutral-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{row.release}</p>
                <p className="text-xs text-neutral-500">{row.period}</p>
              </div>
              <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${scheduleStatus[row.status]}`}>
                {payoutScheduleStatusLabel(row.status, t)}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <p className="text-neutral-700">
                {t("payouts.schedule.nextAccrual")} <span className="font-medium">{row.nextAccrual}</span>
              </p>
              <p className="text-neutral-500 sm:text-right">{row.comment}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
