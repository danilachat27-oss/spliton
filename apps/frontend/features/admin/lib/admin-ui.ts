import { cn } from "@/lib/utils";

/** Тёмная рабочая область операторской панели */
export const adminPageBg = "bg-zinc-950 text-zinc-100";

/** Lime accent Spliton */
export const adminAccent = "text-[#B7F500]";
export const adminAccentBg = "bg-[#B7F500] text-zinc-950 hover:bg-[#a8e600]";
export const adminAccentRing = "focus-visible:ring-[#B7F500]/40";

/** Shell surfaces */
export const adminShellHeader = "bg-[#141416] text-zinc-100";
export const adminShellSidebar = "bg-[#0f0f11] text-zinc-100";

/** Карточка / панель — без рамок и теней */
export function adminCard(className?: string) {
  return cn("rounded-2xl bg-zinc-900/55", className);
}

/** Dashboard / section panel */
export const adminPanel =
  "rounded-2xl bg-zinc-900/45 px-4 py-6 sm:rounded-3xl sm:px-8 sm:py-8";

export const adminTile =
  "rounded-2xl bg-zinc-900/40 px-3 py-3.5 transition-colors sm:px-5 sm:py-5";

export const adminEyebrow =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500";

/** Вкладки и бейджи */
export const adminTabActive = "bg-[#B7F500] text-zinc-950";
export const adminTabInactive =
  "bg-zinc-900/60 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200";

export const adminCountBadge =
  "rounded-xl bg-zinc-800/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-300";

export const adminCountBadgeActive =
  "rounded-xl bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-100";

export const adminIconTile =
  "flex items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-400";

export const adminIconTileActive =
  "flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-100";

export function adminDrawerTab(active: boolean) {
  return cn(
    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
    active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
  );
}

export function adminAlertSurface(level: "danger" | "warning" | "info") {
  if (level === "danger") return "bg-rose-500/10 text-rose-300";
  if (level === "warning") return "bg-amber-500/10 text-amber-300";
  return "bg-sky-500/10 text-sky-300";
}

/** Поля ввода */
export const adminFieldInput =
  "h-9 min-h-9 border-0 bg-zinc-900/55 text-zinc-100 placeholder:text-zinc-500 focus-visible:bg-zinc-900/80 focus-visible:ring-[#B7F500]/25";

/** Светлые поля на тёмном экране входа */
export const adminLoginFieldInput =
  "mt-1.5 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-zinc-400/20";

export const adminFieldTextarea = cn(
  adminFieldInput,
  "min-h-[72px] w-full resize-none rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2",
  "read-only:cursor-default read-only:opacity-70",
);

/** Dropdown / popover panel */
export const adminDropdownPanel = "rounded-xl bg-zinc-900 py-2 text-zinc-100";

export const adminDropdownItem = "block px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80";

/** Dialog */
export const adminDialogPanel = "rounded-2xl bg-zinc-900 p-6";

/** Buttons */
export const adminDrawerButtonBase =
  "h-9 min-h-9 shrink-0 gap-1.5 px-4 text-sm font-medium leading-none inline-flex items-center justify-center [&_svg]:size-4";

export const adminBtnPrimary = cn(adminAccentBg, adminDrawerButtonBase, "font-semibold");
export const adminBtnSecondary = cn(
  "bg-zinc-800/90 text-zinc-100 hover:bg-zinc-800",
  adminDrawerButtonBase,
);
export const adminBtnGhost = cn(
  "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100",
  adminDrawerButtonBase,
);
export const adminBtnOutline = cn(
  "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100",
  adminDrawerButtonBase,
);

/** KPI / metric */
export const adminMetricValue = "text-2xl font-semibold tracking-tight text-zinc-100";
export const adminMetricLabel =
  "text-[11px] font-medium uppercase tracking-wide text-zinc-500";

/** Table */
export const adminTableHead =
  "text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500";

export const adminTableCell = "text-sm text-zinc-200";

export const adminTableRowHover = "hover:bg-zinc-800/40";

/** Status badge tones — dark fintech */
export const adminStatusToneClass = {
  neutral: "bg-zinc-800/90 text-zinc-300",
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
  pending: "bg-sky-500/10 text-sky-300",
  info: "bg-violet-500/10 text-violet-300",
} as const;

/** Skeleton */
export const adminSkeleton = "animate-pulse rounded-lg bg-zinc-800/70";

/** @deprecated use adminCard */
export function adminSurface(className?: string) {
  return adminCard(className);
}

export function adminInsetRow(className?: string) {
  return cn(
    "rounded-xl px-3 py-3 transition-colors hover:bg-zinc-800/50",
    className,
  );
}
