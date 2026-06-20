import * as React from "react";

import { cn } from "@/lib/utils";

export function BreakdownRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 py-1.5 font-mono text-[12px]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={cn("tabular-nums text-right", highlight ? "font-semibold text-[#B7F500]" : "text-zinc-100")}>
        {value}
      </dd>
    </div>
  );
}
