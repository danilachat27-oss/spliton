"use client";

import { Info } from "@/lib/lucide";

type AdminKpiTooltipProps = {
  text: string;
};

export function AdminKpiTooltip({ text }: AdminKpiTooltipProps) {
  return (
    <span className="inline-flex align-middle text-zinc-400" title={text}>
      <Info className="size-3.5" strokeWidth={2} aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}
