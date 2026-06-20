"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { myPositions } from "@/components/my-assets/overview/mock-data";

function PositionStatus({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-700">
      {label}
    </span>
  );
}

function PositionCover({ hint }: { hint: string }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 text-xs font-semibold text-neutral-700">
      {hint}
    </div>
  );
}

export function PositionsTable() {
  const { t } = useI18n();

  return (
    <section className="rounded-md border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-neutral-900">{t("assets.myPositions")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{t("assets.positions.subtitle")}</p>
      </header>

      <div className="hidden xl:block">
        <div className="grid grid-cols-[minmax(220px,1.4fr)_minmax(130px,0.9fr)_minmax(120px,0.7fr)_minmax(140px,0.8fr)_minmax(150px,0.9fr)_96px] gap-3 border-b border-neutral-200 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
          <span>{t("assets.positions.col.release")}</span>
          <span>UNT</span>
          <span>{t("assets.positions.col.poolShare")}</span>
          <span>{t("assets.positions.col.accrued")}</span>
          <span>{t("assets.positions.col.available")}</span>
          <span />
        </div>
      </div>

      <div className="divide-y divide-neutral-200">
        {myPositions.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 xl:grid-cols-[minmax(220px,1.4fr)_minmax(130px,0.9fr)_minmax(120px,0.7fr)_minmax(140px,0.8fr)_minmax(150px,0.9fr)_96px] xl:items-center xl:px-5"
          >
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <PositionCover hint={item.cover} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{item.release}</p>
                  <p className="text-xs text-neutral-500">{item.artist}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.statuses.map((status) => (
                      <PositionStatus key={status} label={status} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-neutral-900 xl:text-[13px]">
              <span className="text-xs text-neutral-500 xl:hidden">UNT: </span>
              <span className="tabular-nums">{item.units}</span>
            </div>

            <div className="text-sm text-neutral-900 xl:text-[13px]">
              <span className="text-xs text-neutral-500 xl:hidden">{t("assets.positions.col.poolShare")}: </span>
              <span className="tabular-nums">{item.share}</span>
            </div>

            <div className="text-sm text-neutral-900 xl:text-[13px]">
              <span className="text-xs text-neutral-500 xl:hidden">{t("assets.positions.col.accrued")}: </span>
              <span className="tabular-nums">{item.accrued}</span>
            </div>

            <div className="text-sm text-neutral-900 xl:text-[13px]">
              <span className="text-xs text-neutral-500 xl:hidden">{t("assets.positions.col.available")}: </span>
              <span className="tabular-nums">{item.available}</span>
            </div>

            <div>
              <Link
                href={item.href}
                className="inline-flex h-8 items-center rounded-sm border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                Открыть
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
