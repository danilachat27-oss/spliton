"use client";

import { genreStructure, statusStructure } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const toneByIndex = [
  "bg-neutral-900",
  "bg-blue-600",
  "bg-neutral-500",
  "bg-neutral-300",
  "bg-neutral-200",
];

function StructureCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: { label: string; value: string; percent: number }[];
}) {
  return (
    <section
      className="space-y-5 rounded-3xl bg-white px-5 py-6 sm:space-y-6 sm:px-7 sm:py-8"
      aria-label={title}
    >
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{eyebrow}</p>
        <h3 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{title}</h3>
      </div>

      <div className="rounded-2xl bg-neutral-50/90 p-4 ring-1 ring-neutral-100 sm:p-5">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-100/80">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={toneByIndex[index % toneByIndex.length]}
              style={{ width: `${item.percent}%` }}
              aria-hidden
            />
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {items.map((item, index) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/90 px-3.5 py-2.5 ring-1 ring-neutral-100 transition-colors hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn("inline-block size-2.5 shrink-0 rounded-full", toneByIndex[index % toneByIndex.length])}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-semibold leading-none text-neutral-900">{item.label}</span>
                  </div>
                  <p className="mt-1 pl-4 text-xs leading-none text-neutral-500">{item.value}</p>
                </div>
                <span className="shrink-0 font-mono text-lg font-semibold tabular-nums tracking-tight text-neutral-800 sm:text-xl">
                  {item.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PositionsStructureCards({
  genreStructure: genreItems = genreStructure,
  statusStructure: statusItems = statusStructure,
}: {
  genreStructure?: typeof genreStructure;
  statusStructure?: typeof statusStructure;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <StructureCard eyebrow="Structure · Status" title={t("positions.structure.byStatus")} items={statusItems} />
      <StructureCard eyebrow="Structure · Genre" title={t("positions.structure.byGenre")} items={genreItems} />
    </div>
  );
}
