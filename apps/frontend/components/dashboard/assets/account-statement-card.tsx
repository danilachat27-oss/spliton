"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function AccountStatementCard() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">{t("payouts.statement.title")}</h2>

      <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-neutral-300 text-neutral-500">
          !
        </div>
        <p className="text-lg font-semibold text-neutral-900">{t("payouts.statement.emptyTitle")}</p>
        <p className="mt-1 text-sm text-neutral-500">{t("payouts.statement.emptyBody")}</p>
      </div>
    </section>
  );
}
