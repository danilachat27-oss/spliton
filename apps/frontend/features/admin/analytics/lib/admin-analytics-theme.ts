/** Spliton admin analytics — chart & severity palette (dark fintech, lime accent) */

export const ANALYTICS_CHART = {
  lime: "#B7F500",
  limeMuted: "#8BC34A",
  positive: "#B7F500",
  negative: "#f87171",
  neutral: "#a1a1aa",
  secondary: "#c4f542",
  volume: "#9AE600",
  trades: "#7CB518",
  users: "#B7F500",
  revenue: "#D4FF4D",
  deposits: "#B7F500",
  withdrawals: "#f87171",
  netFlow: "#e4e4e7",
  market: "#9AE600",
} as const;

export const ANALYTICS_SEVERITY_COLORS: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#71717a",
};

export const ANALYTICS_SUPPORT_STATUS_COLORS: Record<string, string> = {
  open: "#B7F500",
  in_progress: "#9AE600",
  waiting_user: "#a1a1aa",
  escalated: "#f87171",
  resolved: "#86efac",
  closed: "#52525b",
};

export const adminPeriodSelectorShell =
  "inline-flex flex-wrap gap-0.5 rounded-xl bg-zinc-900/60 p-1";

export const adminPeriodSelectorActive =
  "bg-[#B7F500]/15 text-[#B7F500]";

export const adminPeriodSelectorIdle =
  "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200";

export const adminAnalyticsFilterBar =
  "relative z-30 flex flex-col gap-4 overflow-visible rounded-2xl bg-zinc-900/40 p-4 md:flex-row md:flex-wrap md:items-end md:gap-3";

export const adminAnalyticsFilterField =
  "w-full overflow-visible md:min-w-[148px] md:max-w-[240px] md:flex-1";

export const adminChartEmptyShell =
  "flex min-h-[200px] flex-col items-center justify-center rounded-2xl bg-zinc-900/30 px-6 py-10 text-center";

export type AdminAnalyticsHealthTone = "neutral" | "positive" | "warning";

/** Тёмная палитра админки — контрастный executive / health баннер */
export function adminAnalyticsHealthBannerSurface(tone: AdminAnalyticsHealthTone): string {
  switch (tone) {
    case "warning":
      return "border-amber-500/35 bg-gradient-to-br from-amber-950/50 via-zinc-900/95 to-zinc-950";
    case "positive":
      return "border-emerald-500/35 bg-gradient-to-br from-emerald-950/45 via-zinc-900/95 to-zinc-950";
    default:
      return "border-zinc-700/80 bg-gradient-to-br from-zinc-900/95 to-zinc-950";
  }
}

export function adminAnalyticsHealthBannerTitleClass(tone: AdminAnalyticsHealthTone): string {
  switch (tone) {
    case "warning":
      return "text-amber-300";
    case "positive":
      return "text-emerald-300";
    default:
      return "text-zinc-400";
  }
}

export function adminAnalyticsHealthBannerBodyClass(tone: AdminAnalyticsHealthTone): string {
  return tone === "neutral" ? "text-zinc-400" : "text-zinc-300";
}
