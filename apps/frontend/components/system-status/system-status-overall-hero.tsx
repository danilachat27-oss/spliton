"use client";

import "./system-status-overall-hero.css";

import Image from "next/image";
import * as React from "react";

import type { OverallTone } from "@/constants/system-status-mock";
import { cn } from "@/lib/utils";

const CHIP_CYCLE_MS = 2800;

const DEFAULT_FLY_LABELS = [
  "Кабинет",
  "Вывод USDT",
  "Вторичный рынок",
  "Выплаты",
  "Пополнение",
] as const;

function toneOrbitClass(tone: OverallTone): string {
  const map: Record<OverallTone, string> = {
    success: "status-overall-hero__orbit-dot--success",
    warning: "status-overall-hero__orbit-dot--warning",
    maintenance: "status-overall-hero__orbit-dot--maintenance",
    danger: "status-overall-hero__orbit-dot--danger",
  };
  return map[tone];
}

type SystemStatusOverallHeroProps = {
  tone: OverallTone;
  headline: string;
  subline: string;
  explanation: string;
  lastUpdatedLabel: string;
  flyLabels?: readonly string[];
  className?: string;
};

export function SystemStatusOverallHero({
  tone,
  headline,
  subline,
  explanation,
  lastUpdatedLabel,
  flyLabels = DEFAULT_FLY_LABELS,
  className,
}: SystemStatusOverallHeroProps) {
  const chips = React.useMemo(
    () => flyLabels.map((label) => label.trim()).filter(Boolean),
    [flyLabels],
  );
  const [chipIndex, setChipIndex] = React.useState(0);

  React.useEffect(() => {
    if (chips.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setChipIndex((current) => (current + 1) % chips.length);
    }, CHIP_CYCLE_MS);

    return () => window.clearInterval(timer);
  }, [chips.length]);

  const activeChip = chips[chipIndex] ?? chips[0] ?? "Сервисы";

  return (
    <section
      className={cn("status-overall-hero border-b border-white/[0.06] px-0 pb-8 sm:pb-10", className)}
      aria-labelledby="health-overview"
    >
      <div className="text-center">
        <p id="health-overview" className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Общий статус
        </p>

        <div className="status-overall-hero__orb-wrap">
          <div className="status-overall-hero__sync">
            <p className="status-overall-hero__sync-label">Синхронизация сервисов</p>
            <p className="status-overall-hero__sync-name">{activeChip}</p>
          </div>

          <div className="status-overall-hero__rail">
            <span className="status-overall-hero__rail-line" />
            <span className="status-overall-hero__rail-target" />
            {activeChip ? (
              <span key={`${chipIndex}-${activeChip}`} className="status-overall-hero__fly-chip">
                <span className="status-overall-hero__fly-chip-dot" />
                <span>{activeChip}</span>
              </span>
            ) : null}
          </div>

          <div className="status-overall-hero__orb">
            <span className="status-overall-hero__ring status-overall-hero__ring--spin" aria-hidden>
              <span className={cn("status-overall-hero__orbit-dot", toneOrbitClass(tone))} />
            </span>
            <span className="status-overall-hero__logo size-12 sm:size-14">
              <Image
                src="/images/LOGO/mini-logo.png"
                alt=""
                width={36}
                height={36}
                className="size-7 object-contain sm:size-8"
                unoptimized
              />
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{headline}</h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{subline}</p>
        <p className="mx-auto mt-2 max-w-3xl text-xs leading-relaxed text-zinc-600">{explanation}</p>
        <p className="mx-auto mt-5 font-mono text-xs text-zinc-500">{lastUpdatedLabel}</p>
      </div>
    </section>
  );
}
