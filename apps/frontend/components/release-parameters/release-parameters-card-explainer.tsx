"use client";

import Image from "next/image";
import { useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_PARAMETERS_CARD_ZONES, RELEASE_PARAMETERS_MOCK_CARD } from "@/constants/release-parameters/page";
import { cn } from "@/lib/utils";

import { ReleaseSectionShell } from "./ui/release-section-shell";

const COVER_SRC = "/images/hero-journey/1.webp";

export function ReleaseParametersCardExplainer() {
  const { t } = useI18n();
  const [activeZone, setActiveZone] = useState(RELEASE_PARAMETERS_CARD_ZONES[0]!.id);
  const mock = RELEASE_PARAMETERS_MOCK_CARD;

  return (
    <ReleaseSectionShell
      id="rp-card"
      title={t("catalog.releaseParameters.card.title")}
      subtitle={t("catalog.releaseParameters.card.subtitle")}
    >
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
        <article className="overflow-hidden rounded-2xl bg-[#0c0c0e] font-mono text-[13px] tabular-nums tracking-tight">
          <div className="relative aspect-[16/10] w-full min-h-[140px] bg-[#070707]">
            <Image src={COVER_SRC} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" />
          </div>
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-2.5">
              <span className="truncate font-sans text-[11px] font-medium text-zinc-200">
                {t("catalog.releaseParameters.card.mockStrip")}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-100">{mock.statusBadge}</span>
            </div>
            <div>
              <h3 className="truncate font-sans text-lg font-semibold text-white">{mock.title}</h3>
              <p className="truncate text-sm text-zinc-500">{mock.artist}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className={cn("rounded-lg p-2.5 transition-colors", activeZone === "yield" && "bg-[#B7F500]/8")}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{t("catalog.releaseParameters.zone.yield.title")}</p>
                <p className="mt-1 text-xl font-bold text-zinc-100">{mock.yield}</p>
              </div>
              <div className={cn("rounded-lg p-2.5 transition-colors", activeZone === "available" && "bg-[#B7F500]/8")}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{t("catalog.releaseParameters.zone.available.title")}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{mock.availableUnits}</p>
              </div>
              <div className={cn("rounded-lg p-2.5 transition-colors", activeZone === "filled" && "bg-[#B7F500]/8")}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{t("catalog.releaseParameters.zone.filled.title")}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{mock.filledPct}%</p>
              </div>
              <div className={cn("rounded-lg p-2.5 transition-colors", activeZone === "raise" && "bg-[#B7F500]/8")}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{t("catalog.releaseParameters.zone.raise.title")}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{mock.raiseTarget}</p>
              </div>
            </div>
          </div>
        </article>

        <div className="flex flex-col justify-center gap-1 rounded-2xl bg-[#0c0c0e] p-3 sm:p-4">
          {RELEASE_PARAMETERS_CARD_ZONES.map((zone, index) => {
            const isActive = activeZone === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveZone(zone.id)}
                className={cn(
                  "grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-3 text-left transition-colors",
                  isActive ? "bg-[#B7F500]/5" : "opacity-55 hover:opacity-80 hover:bg-white/3",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full font-mono text-[10px] font-bold",
                    isActive
                      ? "border border-[#B7F500]/55 bg-[#B7F500]/12 text-[#c4f570]"
                      : "bg-[#18181b] text-zinc-500",
                  )}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="text-sm font-semibold text-white">{t(`catalog.releaseParameters.zone.${zone.id}.title`)}</span>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{t(`catalog.releaseParameters.zone.${zone.id}.body`)}</p>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ReleaseSectionShell>
  );
}
