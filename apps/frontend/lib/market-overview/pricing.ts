import type { MarketOverviewRow } from "@/types/market-overview";

export {
  amountFromUnits,
  clampUnits,
  computeOwnershipPercent,
  computePrimaryPurchase,
  computeSecondaryTrade,
  effectiveMaxUnits,
  effectiveMinUnits,
  parseUnitPrice,
  roundUsdt2,
  unitsFromAmount,
  unitsFromUsdtBudget,
  validateUnitPrice,
} from "@/lib/market/pricing-calculator";

import {
  amountFromUnits,
  parseUnitPrice,
  roundUsdt2,
  unitsFromAmount,
  validateUnitPrice,
} from "@/lib/market/pricing-calculator";

/** Цена 1 unit в первичном раунде из данных релиза (mock каталога). */
export function getPrimaryUnitPriceUsdt(row: MarketOverviewRow): number {
  return parseUnitPrice(row.primaryUnitPriceUsdt) ?? 0;
}

/** Итого USDT за `units` по прайсу первичного раунда. */
export function primaryOrderTotalUsdt(row: MarketOverviewRow, units: number): number {
  const price = parseUnitPrice(row.primaryUnitPriceUsdt);
  if (price == null) return 0;
  return amountFromUnits(price, units);
}

/** Парсинг ввода суммы (запятая или точка как десятичный разделитель, пробелы как разделитель тысяч). */
export function parseRuMoneyInput(raw: string): number | null {
  const s = raw.replace(/\s/g, "").replace(/'/g, "").trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s.replace(/,/g, "");
  }
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

/** @internal re-export for tests */
export { validateUnitPrice as isValidUnitPriceForPurchase };
