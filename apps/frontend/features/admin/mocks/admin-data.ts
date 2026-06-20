/**
 * Mock-данные админ-панели. Заменить вызовами API, когда появятся эндпоинты.
 */

export type AdminOverviewKpis = {
  /** Всего в управлении (TVL) */
  tvlUsdt: string;
  /** Выплачено дохода */
  incomePaidUsdt: string;
  /** Объём депозитов за период */
  depositsPeriodUsdt: string;
  /** Комиссии платформы */
  platformFeesUsdt: string;
  /** Ожидает вывода */
  pendingWithdrawUsdt: string;
  kpiPeriodLabel: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  status: "ACTIVE" | "PENDING_EMAIL_VERIFICATION" | "SUSPENDED";
  joinedAt: string;
  displayName: string | null;
  balanceUsdt: string;
};

/** Жизненный цикл продукта (как в каталоге: раунд → торговля UNT → выплаты). */
export type AdminReleasePhase =
  | "draft_review"
  | "fundraising"
  | "post_funded"
  | "secondary"
  | "payouts";

/**
 * Карточка релиза в CRM. Согласуйте с каталогом: funding vs market, доля пула, UNT.
 * Поля в строках с пробелами/тонким пробелом — только для отображения (как в макетах).
 */
export type AdminReleaseRow = {
  id: string;
  /** Стабильный slug для ссылок (`/catalog/...` при появлении API). */
  slug: string;
  title: string;
  /** Имя артиста / проекта в UI (как в каталоге). */
  artistLabel: string;
  /** Тикер инструмента на вторичке (MNR, SGN…). */
  ticker: string;
  genre: string;
  status: "draft" | "listed" | "paused" | "settled";
  phase: AdminReleasePhase;
  goalUsdt: string;
  raisedUsdt: string;
  totalUnitsUnt: string;
  /** Остаток UNT в обращении / доступный объём (отображение). */
  unitsOutstanding: string;
  /** Ориентир цены 1 UNT в USDT на первичке (строка). */
  unitPriceUsdt: string;
  /** Доля потока инвесторам, %. */
  investorSharePct: string;
  /** Прогнозная доходность в карточке, %. */
  forecastYieldPct: string;
  /** Доля пула, ещё доступная на первичке (как «12%» в каталоге). */
  investorPoolRemainingPct: string;
  promoUsdt: string;
  artistAdvanceUsdt: string;
  platformAdvanceUsdt: string;
  updatedAt: string;
  isrc?: string;
  territory?: string;
  /**
   * Обложка релиза (data URL). Только mock в браузере; в проде заменить на URL из хранилища.
   */
  coverDataUrl?: string;
  /** Доп. изображения (промо, арт и т.д.), до нескольких штук — тоже data URL в mock. */
  galleryDataUrls?: string[];
};

export function generateAdminReleaseId(): string {
  return `rel-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyAdminRelease(): AdminReleaseRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    slug: "",
    title: "",
    artistLabel: "",
    ticker: "",
    genre: "Electronic",
    status: "draft",
    phase: "draft_review",
    goalUsdt: "",
    raisedUsdt: "0",
    totalUnitsUnt: "",
    unitsOutstanding: "",
    unitPriceUsdt: "",
    investorSharePct: "70",
    forecastYieldPct: "8,5",
    investorPoolRemainingPct: "15",
    promoUsdt: "",
    artistAdvanceUsdt: "",
    platformAdvanceUsdt: "",
    updatedAt: today,
    isrc: "",
    territory: "Worldwide",
  };
}

export type AdminWithdrawRow = {
  id: string;
  amountUsdt: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type AdminDepositRow = {
  id: string;
  amountUsdt: string;
  userEmail: string;
  txRef: string;
  createdAt: string;
};

export type AdminPayoutRow = {
  id: string;
  releaseTitle: string;
  period: string;
  amountUsdt: string;
  status: "scheduled" | "completed" | "failed";
};

export type AdminMarketRow = {
  id: string;
  side: "buy" | "sell";
  releaseTitle: string;
  units: string;
  priceUsdt: string;
  userEmail: string;
  createdAt: string;
};

export type AdminAuditRow = {
  id: string;
  kind: "auth" | "finance" | "admin" | "system";
  message: string;
  actor: string;
  createdAt: string;
};

export const MOCK_ADMIN_KPIS: AdminOverviewKpis = {
  tvlUsdt: "2 420 500",
  incomePaidUsdt: "186 320",
  depositsPeriodUsdt: "412 800",
  platformFeesUsdt: "24 180",
  pendingWithdrawUsdt: "63 400",
  kpiPeriodLabel: "За 30 дней, USDT · макет",
};

/** Числовая база TVL для синтетического ряда графика — держите в согласовании с {@link MOCK_ADMIN_KPIS}.tvlUsdt. */
export const MOCK_ADMIN_TVL_CHART_BASE = 2_420_500;

export const MOCK_ADMIN_USERS: AdminUserRow[] = [
  {
    id: "u-1",
    email: "investor@example.com",
    status: "ACTIVE",
    joinedAt: "2026-04-12",
    displayName: "Alex M.",
    balanceUsdt: "12 400",
  },
  {
    id: "u-2",
    email: "pending@example.com",
    status: "PENDING_EMAIL_VERIFICATION",
    joinedAt: "2026-05-09",
    displayName: null,
    balanceUsdt: "0",
  },
  {
    id: "u-3",
    email: "risk@example.com",
    status: "SUSPENDED",
    joinedAt: "2025-11-02",
    displayName: "Risk Case",
    balanceUsdt: "850",
  },
  {
    id: "u-4",
    email: "portfolio@example.com",
    status: "ACTIVE",
    joinedAt: "2026-03-28",
    displayName: "Elena V.",
    balanceUsdt: "48 200",
  },
  {
    id: "u-5",
    email: "new.signup@example.com",
    status: "PENDING_EMAIL_VERIFICATION",
    joinedAt: "2026-05-10",
    displayName: null,
    balanceUsdt: "0",
  },
];

export const MOCK_ADMIN_RELEASES: AdminReleaseRow[] = [
  {
    id: "rel-101",
    slug: "midnight-run",
    title: "Midnight Run",
    artistLabel: "Luna Pulse",
    ticker: "MNR",
    genre: "Electronic",
    status: "listed",
    phase: "secondary",
    goalUsdt: "250 000",
    raisedUsdt: "250 000",
    totalUnitsUnt: "1 000 000",
    unitsOutstanding: "842 000",
    unitPriceUsdt: "0,25",
    investorSharePct: "72",
    forecastYieldPct: "8,7",
    investorPoolRemainingPct: "0",
    promoUsdt: "18 000",
    artistAdvanceUsdt: "45 000",
    platformAdvanceUsdt: "12 000",
    updatedAt: "2026-05-09",
    isrc: "QZ-6M2-24-00001",
    territory: "Worldwide",
  },
  {
    id: "rel-102",
    slug: "signal-noise",
    title: "Signal Noise",
    artistLabel: "North Tide",
    ticker: "SGN",
    genre: "Indie",
    status: "paused",
    phase: "fundraising",
    goalUsdt: "180 000",
    raisedUsdt: "96 400",
    totalUnitsUnt: "900 000",
    unitsOutstanding: "120 400",
    unitPriceUsdt: "0,20",
    investorSharePct: "68",
    forecastYieldPct: "8,1",
    investorPoolRemainingPct: "9,2",
    promoUsdt: "10 000",
    artistAdvanceUsdt: "28 000",
    platformAdvanceUsdt: "8 000",
    updatedAt: "2026-05-08",
    territory: "EU · US",
  },
  {
    id: "rel-103",
    slug: "vault-line",
    title: "Vault Line",
    artistLabel: "Studio Vault",
    ticker: "VLT",
    genre: "Hip-hop",
    status: "draft",
    phase: "draft_review",
    goalUsdt: "320 000",
    raisedUsdt: "0",
    totalUnitsUnt: "1 200 000",
    unitsOutstanding: "—",
    unitPriceUsdt: "0,27",
    investorSharePct: "70",
    forecastYieldPct: "9,0",
    investorPoolRemainingPct: "18",
    promoUsdt: "20 000",
    artistAdvanceUsdt: "50 000",
    platformAdvanceUsdt: "15 000",
    updatedAt: "2026-05-07",
  },
  {
    id: "rel-104",
    slug: "closed-deal",
    title: "Closed Deal",
    artistLabel: "Archive One",
    ticker: "CLD",
    genre: "Pop",
    status: "settled",
    phase: "payouts",
    goalUsdt: "140 000",
    raisedUsdt: "140 000",
    totalUnitsUnt: "700 000",
    unitsOutstanding: "0",
    unitPriceUsdt: "0,20",
    investorSharePct: "65",
    forecastYieldPct: "6,2",
    investorPoolRemainingPct: "0",
    promoUsdt: "5 000",
    artistAdvanceUsdt: "20 000",
    platformAdvanceUsdt: "6 000",
    updatedAt: "2025-12-01",
    territory: "Worldwide",
  },
];

export const MOCK_ADMIN_WITHDRAWALS: AdminWithdrawRow[] = [
  {
    id: "wd-9001",
    amountUsdt: "4 200",
    userEmail: "investor@example.com",
    status: "pending",
    createdAt: "2026-05-10 14:22",
  },
  {
    id: "wd-9003",
    amountUsdt: "850",
    userEmail: "risk@example.com",
    status: "rejected",
    createdAt: "2026-05-08 18:40",
  },
  {
    id: "wd-9004",
    amountUsdt: "21 000",
    userEmail: "investor@example.com",
    status: "approved",
    createdAt: "2026-05-07 11:05",
  },
];

export const MOCK_ADMIN_DEPOSITS: AdminDepositRow[] = [
  {
    id: "dep-2201",
    amountUsdt: "10 000",
    userEmail: "investor@example.com",
    txRef: "TR7…9a2f",
    createdAt: "2026-05-09 09:05",
  },
  {
    id: "dep-2202",
    amountUsdt: "5 500",
    userEmail: "pending@example.com",
    txRef: "TR7…b81c",
    createdAt: "2026-05-08 16:40",
  },
  {
    id: "dep-2203",
    amountUsdt: "50 000",
    userEmail: "investor@example.com",
    txRef: "TR7…c003",
    createdAt: "2026-05-05 08:12",
  },
];

export const MOCK_ADMIN_PAYOUTS: AdminPayoutRow[] = [
  {
    id: "pay-501",
    releaseTitle: "Midnight Run",
    period: "2026-Q1",
    amountUsdt: "48 200",
    status: "completed",
  },
  {
    id: "pay-502",
    releaseTitle: "Signal Noise",
    period: "2026-Q1",
    amountUsdt: "12 900",
    status: "scheduled",
  },
  {
    id: "pay-503",
    releaseTitle: "Vault Line",
    period: "2026-Q1",
    amountUsdt: "3 100",
    status: "failed",
  },
];

export const MOCK_ADMIN_MARKET: AdminMarketRow[] = [
  {
    id: "mkt-1",
    side: "buy",
    releaseTitle: "Midnight Run",
    units: "1 200",
    priceUsdt: "0.042",
    userEmail: "investor@example.com",
    createdAt: "2026-05-10 12:01",
  },
  {
    id: "mkt-2",
    side: "sell",
    releaseTitle: "Signal Noise",
    units: "800",
    priceUsdt: "0.038",
    userEmail: "risk@example.com",
    createdAt: "2026-05-10 11:44",
  },
  {
    id: "mkt-3",
    side: "buy",
    releaseTitle: "Vault Line",
    units: "2 400",
    priceUsdt: "0.051",
    userEmail: "investor@example.com",
    createdAt: "2026-05-10 10:18",
  },
];

export const MOCK_ADMIN_AUDIT: AdminAuditRow[] = [
  {
    id: "aud-1",
    kind: "auth",
    message: "Успешный вход (2FA)",
    actor: "investor@example.com",
    createdAt: "2026-05-10 14:30",
  },
  {
    id: "aud-2",
    kind: "finance",
    message: "Заявка на вывод создана",
    actor: "investor@example.com",
    createdAt: "2026-05-10 14:22",
  },
  {
    id: "aud-3",
    kind: "admin",
    message: "Просмотр раздела «Финансы»",
    actor: "admin@example.com",
    createdAt: "2026-05-10 13:58",
  },
  {
    id: "aud-4",
    kind: "system",
    message: "Плановый пересчёт агрегатов TVL",
    actor: "system",
    createdAt: "2026-05-10 03:00",
  },
];
