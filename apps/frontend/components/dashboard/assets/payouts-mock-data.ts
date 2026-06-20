export type PayoutSummary = {
  label: string;
  value: string;
  hint: string;
};

export type PayoutHistoryRow = {
  id: string;
  /** Короткий идентификатор операции в ленте (мок). */
  ledgerRef: string;
  date: string;
  release: string;
  type: "accrual" | "payout" | "withdrawal" | "adjustment";
  unitsShare: string;
  amount: string;
  status: "accrued" | "available" | "processing" | "paid" | "completed";
};

export type PayoutScheduleRow = {
  id: string;
  release: string;
  nextAccrual: string;
  period: string;
  status: "expected" | "calculating" | "accrued";
  comment: string;
};

export const payoutSummary: PayoutSummary[] = [
  { label: "Начислено всего", value: "1 482.60 USDT", hint: "total distributions received" },
  { label: "Доступно к выводу", value: "286.40 USDT", hint: "доступный баланс" },
  { label: "В обработке", value: "120.00 USDT", hint: "1 заявка на вывод" },
  { label: "Последняя выплата", value: "12.04.2026 · 38.40 USDT", hint: "релиз Offset" },
  { label: "Ближайшее начисление", value: "22.04.2026", hint: "по графику релизов" },
];

/** Чаша «весов» на обзоре выплат: сравнение двух окон по начислениям и выводам (мок). */
export type PayoutScalePan = {
  titleKey: "previous_7d" | "current_7d" | "previous_30d" | "current_30d" | "previous_90d" | "current_90d";
  period: string;
  accrualsUSDT: number;
  withdrawalsUSDT: number;
  hintKey: "by_releases";
  /** UI uses already-resolved strings (mock). */
  title: string;
  hint: string;
};

export type PayoutBalanceScaleMock = {
  asset: string;
  left: PayoutScalePan;
  right: PayoutScalePan;
};

export const payoutBalanceScale: PayoutBalanceScaleMock = {
  asset: "USDT · TRC20",
  left: {
    titleKey: "previous_30d",
    title: "previous_30d",
    period: "17.02 — 18.03",
    accrualsUSDT: 284.5,
    withdrawalsUSDT: 196.0,
    hintKey: "by_releases",
    hint: "by_releases",
  },
  right: {
    titleKey: "current_30d",
    title: "current_30d",
    period: "19.03 — 18.04",
    accrualsUSDT: 318.2,
    withdrawalsUSDT: 158.4,
    hintKey: "by_releases",
    hint: "by_releases",
  },
};

/** Длина каждого из двух скользящих окон сравнения (мок). */
export type PayoutComparisonWindowId = "7d" | "30d" | "90d";

export const payoutComparisonWindowOptions: {
  id: PayoutComparisonWindowId;
  labelKey: string;
  label: string;
}[] = [
  { id: "7d", labelKey: "chart.range7d", label: "7d" },
  { id: "30d", labelKey: "chart.range30d", label: "30d" },
  { id: "90d", labelKey: "chart.range90d", label: "90d" },
];

const payoutBalanceScaleByWindow: Record<PayoutComparisonWindowId, PayoutBalanceScaleMock> = {
  "7d": {
    asset: "USDT · TRC20",
    left: {
      titleKey: "previous_7d",
      title: "previous_7d",
      period: "12.04 — 18.04",
      accrualsUSDT: 62.4,
      withdrawalsUSDT: 48.0,
      hintKey: "by_releases",
      hint: "by_releases",
    },
    right: {
      titleKey: "current_7d",
      title: "current_7d",
      period: "13.04 — 19.04",
      accrualsUSDT: 71.1,
      withdrawalsUSDT: 22.5,
      hintKey: "by_releases",
      hint: "by_releases",
    },
  },
  "30d": payoutBalanceScale,
  "90d": {
    asset: "USDT · TRC20",
    left: {
      titleKey: "previous_90d",
      title: "previous_90d",
      period: "20.12 — 18.03",
      accrualsUSDT: 812.3,
      withdrawalsUSDT: 540.0,
      hintKey: "by_releases",
      hint: "by_releases",
    },
    right: {
      titleKey: "current_90d",
      title: "current_90d",
      period: "19.03 — 17.06",
      accrualsUSDT: 891.6,
      withdrawalsUSDT: 412.8,
      hintKey: "by_releases",
      hint: "by_releases",
    },
  },
};

export function getPayoutBalanceScaleMock(window: PayoutComparisonWindowId): PayoutBalanceScaleMock {
  return payoutBalanceScaleByWindow[window];
}

/** Точки для графика на обзоре выплат: накопительно получено и сумма за период (USDT). */
export type PayoutAccrualChartPoint = {
  label: string;
  cumulativeUSDT: number;
  periodUSDT: number;
};

export const payoutAccrualChart: PayoutAccrualChartPoint[] = [
  { label: "сен. 2025", cumulativeUSDT: 412.5, periodUSDT: 38.2 },
  { label: "окт. 2025", cumulativeUSDT: 521.0, periodUSDT: 52.4 },
  { label: "ноя. 2025", cumulativeUSDT: 638.4, periodUSDT: 61.8 },
  { label: "дек. 2025", cumulativeUSDT: 784.1, periodUSDT: 74.5 },
  { label: "янв. 2026", cumulativeUSDT: 901.3, periodUSDT: 55.0 },
  { label: "фев. 2026", cumulativeUSDT: 1048.7, periodUSDT: 82.6 },
  { label: "мар. 2026", cumulativeUSDT: 1288.2, periodUSDT: 96.4 },
  { label: "апр. 2026", cumulativeUSDT: 1482.6, periodUSDT: 88.1 },
];

export type PayoutChartRangeId = "24h" | "7d" | "30d" | "1y";

/** Детерминированный шум 0..1 (чтобы моки не «прыгали» при ререндере). */
function hash01(seed: number, i: number) {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 10000;
  return x - Math.floor(x);
}

function formatHourLabel(h: number) {
  return `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;
}

function formatDayLabel(dayIndex: number) {
  const d = 19 - dayIndex;
  return `${Math.max(1, d)} апр.`;
}

/** Плотные серии под выбранный интервал (мок для UI). */
export function getPayoutAccrualChartSeries(range: PayoutChartRangeId): PayoutAccrualChartPoint[] {
  const targetTotal = 1482.6;
  const seed = range === "24h" ? 11 : range === "7d" ? 17 : range === "30d" ? 23 : 29;

  if (range === "24h") {
    const n = 24;
    const start = targetTotal - 86.4 - hash01(seed, 0) * 12;
    const out: PayoutAccrualChartPoint[] = [];
    let cum = start;
    for (let i = 0; i < n; i++) {
      const wave = 4 + hash01(seed, i + 1) * 9 + Math.sin(i / 3.2) * 3.5;
      const spike = i === 18 || i === 9 ? 14 + hash01(seed, i + 50) * 8 : 0;
      const period = Math.max(0.4, wave + spike - (i % 5) * 0.35);
      cum += period * 0.085 + hash01(seed, i + 99) * 0.6;
      out.push({ label: formatHourLabel(i), cumulativeUSDT: cum, periodUSDT: period });
    }
    out[n - 1] = { ...out[n - 1]!, cumulativeUSDT: targetTotal };
    return out;
  }

  if (range === "7d") {
    const n = 42;
    const start = targetTotal - 210 - hash01(seed, 1) * 40;
    const out: PayoutAccrualChartPoint[] = [];
    let cum = start;
    for (let i = 0; i < n; i++) {
      const period = 12 + hash01(seed, i + 2) * 58 + Math.sin(i / 4) * 14;
      cum += period / 18 + hash01(seed, i + 200) * 1.2;
      const block = Math.floor(i / 6);
      const day = Math.floor(i / 6) + 1;
      const h = (i % 6) * 4;
      out.push({
        label: `${day}д ${String(h).padStart(2, "0")}ч`,
        cumulativeUSDT: cum,
        periodUSDT: Math.max(2, period - block * 0.8),
      });
    }
    out[n - 1] = { ...out[n - 1]!, cumulativeUSDT: targetTotal };
    return out;
  }

  if (range === "30d") {
    const n = 30;
    const start = targetTotal - 318 - hash01(seed, 3) * 22;
    const out: PayoutAccrualChartPoint[] = [];
    let cum = start;
    for (let i = 0; i < n; i++) {
      const period = 18 + hash01(seed, i + 4) * 72 + Math.sin(i / 2.8) * 16;
      cum += period / 14 + hash01(seed, i + 300);
      out.push({ label: formatDayLabel(i), cumulativeUSDT: cum, periodUSDT: Math.max(3, period) });
    }
    out[n - 1] = { ...out[n - 1]!, cumulativeUSDT: targetTotal };
    return out;
  }

  const n = 52;
  const start = targetTotal - 640 - hash01(seed, 5) * 80;
  const out: PayoutAccrualChartPoint[] = [];
  let cum = start;
  for (let i = 0; i < n; i++) {
    const period = 22 + hash01(seed, i + 6) * 70 + Math.sin(i / 5) * 20;
    cum += period / 10.5 + hash01(seed, i + 400) * 1.5;
    const week = i + 1;
    out.push({ label: `нед. ${week}`, cumulativeUSDT: cum, periodUSDT: Math.max(4, period) });
  }
  out[n - 1] = { ...out[n - 1]!, cumulativeUSDT: targetTotal };
  return out;
}

export type PayoutChartKpiSnapshot = {
  cumulativeNow: number;
  cumulativeDeltaPct: number;
  periodVolume: number;
  periodDeltaPct: number;
};

export function getPayoutChartKpiSnapshot(series: PayoutAccrualChartPoint[]): PayoutChartKpiSnapshot {
  if (series.length === 0) {
    return { cumulativeNow: 0, cumulativeDeltaPct: 0, periodVolume: 0, periodDeltaPct: 0 };
  }
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const cumulativeDeltaPct =
    first.cumulativeUSDT > 0 ? ((last.cumulativeUSDT - first.cumulativeUSDT) / first.cumulativeUSDT) * 100 : 0;
  const periodVolume = series.reduce((s, p) => s + p.periodUSDT, 0);
  const prevVol = periodVolume * (0.78 + hash01(41, series.length) * 0.12);
  const periodDeltaPct = prevVol > 0 ? ((periodVolume - prevVol) / prevVol) * 100 : 0;
  return {
    cumulativeNow: last.cumulativeUSDT,
    cumulativeDeltaPct,
    periodVolume,
    periodDeltaPct,
  };
}

export const payoutHistory: PayoutHistoryRow[] = [
  {
    id: "ph-1",
    ledgerRef: "RS-7F3A…9C2E",
    date: "12.04.2026",
    release: "Offset",
    type: "accrual",
    unitsShare: "420 units",
    amount: "38.40 USDT",
    status: "accrued",
  },
  {
    id: "ph-2",
    ledgerRef: "RS-2B91…E441",
    date: "04.04.2026",
    release: "Midnight Drive",
    type: "payout",
    unitsShare: "180 units",
    amount: "14.20 USDT",
    status: "paid",
  },
  {
    id: "ph-3",
    ledgerRef: "WD-A804…01FF",
    date: "28.03.2026",
    release: "Glass Echo",
    type: "withdrawal",
    unitsShare: "—",
    amount: "120.00 USDT",
    status: "completed",
  },
  {
    id: "ph-4",
    ledgerRef: "RS-CC10…77AB",
    date: "21.03.2026",
    release: "Low Horizon",
    type: "accrual",
    unitsShare: "260 units",
    amount: "22.30 USDT",
    status: "available",
  },
  {
    id: "ph-5",
    ledgerRef: "RS-5012…3D8F",
    date: "15.03.2026",
    release: "Neon District",
    type: "accrual",
    unitsShare: "300 units",
    amount: "29.80 USDT",
    status: "accrued",
  },
  {
    id: "ph-6",
    ledgerRef: "WD-9E22…B600",
    date: "09.03.2026",
    release: "Offset",
    type: "withdrawal",
    unitsShare: "—",
    amount: "80.00 USDT",
    status: "processing",
  },
  {
    id: "ph-7",
    ledgerRef: "ADJ-11FA…62C0",
    date: "03.03.2026",
    release: "Glass Echo",
    type: "adjustment",
    unitsShare: "по периоду",
    amount: "-3.20 USDT",
    status: "completed",
  },
];

export const payoutSchedule: PayoutScheduleRow[] = [
  {
    id: "ps-1",
    release: "Offset",
    nextAccrual: "22.04.2026",
    period: "01.04–15.04",
    status: "calculating",
    comment: "Расчёт revenue share по подтверждённым стримам.",
  },
  {
    id: "ps-2",
    release: "Midnight Drive",
    nextAccrual: "24.04.2026",
    period: "01.04–15.04",
    status: "expected",
    comment: "Ожидаем загрузку данных от дистрибутора.",
  },
  {
    id: "ps-3",
    release: "Glass Echo",
    nextAccrual: "18.04.2026",
    period: "16.03–31.03",
    status: "accrued",
    comment: "Начисление сформировано и добавлено в историю.",
  },
];
