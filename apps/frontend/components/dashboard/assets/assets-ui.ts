import { cn } from "@/lib/utils";

/** Белая плитка — без рамок и теней (OKX Assets). */
export const assetsCardClass = "rounded-2xl bg-white px-4 py-5 sm:px-6";

export const assetsMutedCardClass = "rounded-2xl bg-neutral-50 px-4 py-4 sm:px-5 sm:py-5";

/** Внутренние блоки графиков / KPI. */
export const assetsPanelClass = "rounded-2xl bg-neutral-50";

export const assetsFilterSelectClass =
  "inline-flex h-10 w-full min-w-[8.5rem] items-center justify-between gap-2 rounded-lg bg-neutral-100 px-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200/70 disabled:cursor-not-allowed disabled:opacity-50";

export const assetsFilterInputClass =
  "h-10 w-full rounded-lg bg-neutral-100 px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50";

export const assetsPrimaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-[#B7F500] px-5 text-sm font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98]";

export const assetsSecondaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-neutral-100 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200/80 active:scale-[0.98]";

export const assetsOutlineButtonClass =
  "inline-flex h-9 items-center justify-center rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200/80";

/** Активный pill в тулбарах графиков. */
export const assetsSegmentActiveClass = "rounded-lg bg-neutral-100 font-medium text-neutral-900";

export const assetsSegmentIdleClass = "rounded-lg text-neutral-500 hover:text-neutral-800";

export function assetsSectionTitleClass(extra?: string) {
  return cn("text-base font-semibold tracking-tight text-neutral-900", extra);
}

export const assetsTableHeadClass =
  "px-4 py-3 text-xs font-normal text-neutral-500 first:pl-0 last:pr-0";

export const assetsTableCellClass =
  "border-t border-neutral-100 px-4 py-3.5 text-sm text-neutral-800 first:pl-0 last:pr-0";
