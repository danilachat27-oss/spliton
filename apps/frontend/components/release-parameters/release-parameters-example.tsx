"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_PARAMETERS_EXAMPLE } from "@/constants/release-parameters/page";

import { ReleaseSectionShell } from "./ui/release-section-shell";

export function ReleaseParametersExample() {
  const { t } = useI18n();
  const ex = RELEASE_PARAMETERS_EXAMPLE;

  const metricGroups = useMemo(
    () =>
      [
        {
          label: t("catalog.releaseParameters.example.group.statusYield"),
          rows: [
            { k: t("catalog.releaseParameters.example.row.status"), v: t("catalog.releaseParameters.example.status") },
            {
              k: t("catalog.releaseParameters.example.row.expectedYield"),
              v: `${ex.expectedYield} · ${t("catalog.releaseParameters.example.row.yieldGuide")}`,
            },
          ],
        },
        {
          label: t("catalog.releaseParameters.example.group.unitsRaise"),
          rows: [
            { k: t("catalog.releaseParameters.example.row.totalUnits"), v: ex.totalUnits },
            { k: t("catalog.releaseParameters.example.row.soldUnits"), v: ex.soldUnits },
            { k: t("catalog.releaseParameters.example.row.availableUnits"), v: ex.availableUnits },
            { k: t("catalog.releaseParameters.example.row.raiseTarget"), v: ex.raiseTarget },
            { k: t("catalog.releaseParameters.example.row.hardCap"), v: ex.hardCap },
          ],
        },
        {
          label: t("catalog.releaseParameters.example.group.tradeMarket"),
          rows: [
            { k: t("catalog.releaseParameters.example.row.investorShare"), v: ex.investorShare },
            { k: t("catalog.releaseParameters.example.row.payout"), v: ex.payout },
            { k: t("catalog.releaseParameters.example.row.secondary"), v: ex.secondary },
          ],
        },
      ] as const,
    [ex, t],
  );

  const analystPoints = useMemo(
    () => [
      t("catalog.releaseParameters.example.analyst1"),
      t("catalog.releaseParameters.example.analyst2"),
      t("catalog.releaseParameters.example.analyst3"),
      t("catalog.releaseParameters.example.analyst4"),
    ],
    [t],
  );

  return (
    <ReleaseSectionShell
      id="rp-example"
      title={t("catalog.releaseParameters.example.title")}
      subtitle={t("catalog.releaseParameters.example.subtitle")}
    >
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
        <div className="overflow-hidden rounded-2xl bg-[#0c0c0e]">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {t("catalog.releaseParameters.example.cardKicker")}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-white">{t("catalog.releaseParameters.example.headline")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("catalog.releaseParameters.example.deck")}</p>
          </div>

          {metricGroups.map((group) => (
            <div key={group.label} className="border-t border-white/5">
              <p className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 sm:px-5">
                {group.label}
              </p>
              {group.rows.map((row) => (
                <div
                  key={row.k}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-white/4 px-4 py-3 sm:px-5"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{row.k}</span>
                  <span className="text-right text-sm font-medium tabular-nums text-zinc-100">{row.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col rounded-2xl bg-[#0c0c0e] p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {t("catalog.releaseParameters.example.readAsLabel")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{t("catalog.releaseParameters.example.readAs")}</p>

          <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {t("catalog.releaseParameters.example.fieldsLabel")}
          </p>
          <ol className="mt-3 space-y-4">
            {analystPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold text-[#c4f570]">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-zinc-400">{point}</p>
              </li>
            ))}
          </ol>

          <p className="mt-auto pt-6 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
            {t("catalog.releaseParameters.example.closing")}
          </p>
        </div>
      </div>
    </ReleaseSectionShell>
  );
}
