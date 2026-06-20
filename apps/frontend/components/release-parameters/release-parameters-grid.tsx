"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_PARAMETERS_GRID } from "@/constants/release-parameters/page";

import { ReleaseSectionShell } from "./ui/release-section-shell";

const GRID_SLUG: Record<string, string> = {
  Units: "units",
  "Investor share": "investorShare",
  "Raise target": "raiseTarget",
  "Hard cap": "hardCap",
  "Available units": "availableUnits",
  "Payout model": "payoutModel",
  "Статус релиза": "status",
  "Secondary market": "secondaryMarket",
};

export function ReleaseParametersGrid() {
  const { t } = useI18n();

  return (
    <ReleaseSectionShell
      id="rp-params"
      title={t("catalog.releaseParameters.grid.title")}
      subtitle={t("catalog.releaseParameters.grid.subtitle")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {RELEASE_PARAMETERS_GRID.map((p, i) => {
          const slug = GRID_SLUG[p.title] ?? "units";
          return (
            <article key={p.title} className="guide-panel px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#B7F500]/35 bg-[#B7F500]/8 font-mono text-[10px] font-semibold text-[#c4f570]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    {t(`catalog.releaseParameters.grid.${slug}.titleRu`)}
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-600">{p.title}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {t("catalog.releaseParameters.grid.whatIs")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                  {t(`catalog.releaseParameters.grid.${slug}.definition`)}
                </p>
              </div>

              <div className="mt-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {t("catalog.releaseParameters.grid.whenComparing")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {t(`catalog.releaseParameters.grid.${slug}.why`)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </ReleaseSectionShell>
  );
}
