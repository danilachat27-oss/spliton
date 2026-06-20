/** Month abbreviations for chart mock series — resolve via `t()`. */
export const WIDGET_MONTH_KEYS = [
  "assets.metrics.month.jan",
  "assets.metrics.month.feb",
  "assets.metrics.month.mar",
  "assets.metrics.month.apr",
  "assets.metrics.month.may",
  "assets.metrics.month.jun",
  "assets.metrics.month.jul",
  "assets.metrics.month.aug",
  "assets.metrics.month.sep",
  "assets.metrics.month.oct",
  "assets.metrics.month.nov",
  "assets.metrics.month.dec",
] as const;

export function widgetMonthLabels(t: (key: string) => string): string[] {
  return WIDGET_MONTH_KEYS.map((key) => t(key));
}
