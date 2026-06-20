const EMPTY_DISPLAY_VALUES = new Set(["—", "–", "-", ""]);

/** Значение считается пустым для UI — строку с прочерком не показываем. */
export function isEmptyDisplayValue(value: string | null | undefined): boolean {
  if (value == null) return true;
  return EMPTY_DISPLAY_VALUES.has(value.trim());
}

export function filterMetricRows<T extends { value: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isEmptyDisplayValue(row.value));
}

export function filterTermRows<T extends { val: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isEmptyDisplayValue(row.val));
}
