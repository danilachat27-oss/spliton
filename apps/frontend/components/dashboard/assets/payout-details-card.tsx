"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function PayoutDetailsCard() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl bg-white p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">Details</p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">{t("payouts.details.title")}</h3>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
          <p className="text-xs text-neutral-500">{t("payouts.details.network")}</p>
          <p className="font-medium text-neutral-900">TRC20</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
          <p className="text-xs text-neutral-500">{t("payouts.details.walletAddress")}</p>
          <p className="font-medium text-neutral-900">TN7k...9wLX</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
          <p className="text-xs text-neutral-500">{t("payouts.details.status")}</p>
          <p className="font-medium text-neutral-900">{t("payouts.details.confirmed")}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 px-3 py-2.5">
          <p className="text-xs text-neutral-500">{t("payouts.details.lastUpdate")}</p>
          <p className="font-medium text-neutral-900">10.04.2026</p>
        </div>
      </div>

      <button className="mt-3 inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50">
        {t("payouts.details.edit")}
      </button>
    </section>
  );
}
