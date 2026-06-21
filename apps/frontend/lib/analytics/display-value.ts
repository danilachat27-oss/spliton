import { CRITICAL_MESSAGES } from "../i18n/critical-messages";
import type { AppLocale } from "../i18n/types";

const PLACEHOLDER_MARKERS = new Set(["\u2014", "\u2013", "-", ""]);

function msg(locale: AppLocale, key: string): string {
  return CRITICAL_MESSAGES[locale][key] ?? CRITICAL_MESSAGES.ru[key] ?? key;
}

/** Универсальная подпись вместо «—» / «-» для пустых значений. */
export function emptyValueLabel(locale: AppLocale): string {
  return msg(locale, "common.empty");
}

export function emptyDateLabel(locale: AppLocale): string {
  return msg(locale, "common.emptyDate");
}

export function emptyAmountLabel(locale: AppLocale): string {
  return msg(locale, "common.emptyAmount");
}

export function emptyBalanceLabel(locale: AppLocale): string {
  return msg(locale, "common.emptyBalance");
}

/** @deprecated Используйте emptyValueLabel(locale) — прочерк больше не показываем в UI. */
export const EMPTY_DISPLAY = emptyValueLabel("ru");

/** Значение считается пустым для UI — строку с прочерком не показываем. */
export function isEmptyDisplayValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  return PLACEHOLDER_MARKERS.has(value.trim());
}

export function filterMetricRows<T extends { value: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isEmptyDisplayValue(row.value));
}

export function filterTermRows<T extends { val: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isEmptyDisplayValue(row.val));
}
