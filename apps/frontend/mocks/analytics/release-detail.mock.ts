import { ROUTES } from "@/constants/routes";
import { applyReleaseDetailSummarySparklines } from "@/lib/analytics/release-detail-summary-sparklines";
import {
  createMockReleaseDetailPageState,
  mockLifecycleLabel,
} from "@/lib/analytics/release-detail-mock-state";
import type {
  ReleaseDetailChartPeriod,
  ReleaseDetailPageData,
  ReleaseDetailPayoutRow,
} from "@/types/analytics/release-detail";
import type { ReleaseAnalyticsRow } from "@/types/analytics/releases";

function expandSeries(base: number[], targetLen: number): number[] {
  if (base.length === 0) return Array.from({ length: targetLen }, (_, i) => 40 + i);
  const out: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    out.push(base[i % base.length] + Math.floor(i / base.length) * 0.8);
  }
  return out;
}

function buildSeriesMap(row: ReleaseAnalyticsRow): Record<ReleaseDetailChartPeriod, number[]> {
  const b = row.sparkline.length ? row.sparkline : [40, 42, 41, 44, 43];
  return {
    "7d": expandSeries(b, 10),
    "30d": expandSeries(b, 22),
    "90d": expandSeries(b, 36),
    ytd: expandSeries(b, 48),
    all: expandSeries(b, 56),
  };
}

function payoutHistoryFor(row: ReleaseAnalyticsRow): ReleaseDetailPayoutRow[] {
  const seed = Number(row.id) || 1;
  const rows: ReleaseDetailPayoutRow[] = [
    {
      period: "2026-03",
      gross: `${(420 + seed * 12).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(88 + seed * 3).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(6.2 + seed * 0.08).toFixed(2)} USDT`,
      toHolders: `${(72 + seed * 2).toLocaleString("ru-RU")} USDT`,
    },
    {
      period: "2026-02",
      gross: `${(380 + seed * 10).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(79 + seed * 2).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(5.9 + seed * 0.06).toFixed(2)} USDT`,
      toHolders: `${(65 + seed * 2).toLocaleString("ru-RU")} USDT`,
    },
    {
      period: "2026-01",
      gross: `${(340 + seed * 8).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(71 + seed * 2).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(5.4 + seed * 0.05).toFixed(2)} USDT`,
      toHolders: `${(58 + seed).toLocaleString("ru-RU")} USDT`,
    },
    {
      period: "2025-12",
      gross: `${(310 + seed * 7).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(64 + seed).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(5.1 + seed * 0.04).toFixed(2)} USDT`,
      toHolders: `${(52 + seed).toLocaleString("ru-RU")} USDT`,
    },
    {
      period: "2025-11",
      gross: `${(280 + seed * 6).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(58 + seed).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(4.8 + seed * 0.03).toFixed(2)} USDT`,
      toHolders: `${(47 + seed).toLocaleString("ru-RU")} USDT`,
    },
    {
      period: "2025-10",
      gross: `${(250 + seed * 5).toLocaleString("ru-RU")} USDT`,
      poolShare: "26%",
      distribution: `${(52 + seed).toLocaleString("ru-RU")} USDT`,
      perUnit: `${(4.5 + seed * 0.02).toFixed(2)} USDT`,
      toHolders: `${(42 + seed).toLocaleString("ru-RU")} USDT`,
    },
  ];
  return rows;
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Что получает пользователь по этому релизу?",
    a: "Право на долю распределения дохода трека в рамках investor_share: начисления пропорционально вашим units к sold units за отчётный период, в USDT (TRC20) на баланс кабинета. Это не владение мастером и не доля в компании.",
  },
  {
    q: "Как рассчитываются выплаты?",
    a: "Сначала считается доход релиза по каналам, затем применяется split (artist / platform / investor pool и т.д. по deal terms). Из пула пользователей выплата делится между держателями units. Конкретные удержания и периодичность — в карточке релиза и payout history.",
  },
  {
    q: "Что такое units?",
    a: "Нормированные единицы revenue share rights: количество купленных units задаёт ваш вес в распределении периода относительно всех sold units в рамках investor_share.",
  },
  {
    q: "Можно ли передать свою долю другому пользователю?",
    a: "Да, через внутренний secondary market: передача rights между пользователями платформы по правилам площадки, без выхода на внешний рынок ценных бумаг.",
  },
  {
    q: "Что означает ориентир gross?",
    a: "Модельный показатель доходности по текущей структуре сделки и историческим данным; не гарантия будущих выплат и не обещание дохода.",
  },
  {
    q: "Является ли это ценной бумагой?",
    a: "Нет. Spliton — технологическая платформа учёта revenue share rights и оборота units; продукт не позиционируется как ценные бумаги или брокерские услуги.",
  },
  {
    q: "Как пополнить баланс в USDT (TRC20)?",
    a: "Пополнение и on-ramp выполняются через внешнего провайдера; платформа отображает баланс и проводит начисления/вывод в рамках лимитов и KYC.",
  },
  {
    q: "Как работает вывод?",
    a: "Вывод доступного остатка USDT (TRC20) на ваш кошелёк вне платформы по заявке и регламенту безопасности; фиат напрямую платформа не обрабатывает.",
  },
];

export function buildReleaseDetailPageData(row: ReleaseAnalyticsRow): ReleaseDetailPageData {
  const statusRu = row.status === "Active" ? "Раунд активен" : row.status === "Paused" ? "Пауза выплат" : "Раунд закрыт";
  const genre =
    row.genre === "electronic" ? "Electronic" : row.genre === "hiphop" ? "Hip-Hop" : "Pop";

  const soldUnits = row.units.replace(/\s/g, "");
  const availableExample = `${Math.max(120, 2400 - Number(soldUnits.replace(/\D/g, "")) || 400)}`;

  return applyReleaseDetailSummarySparklines({
    row,
    pageState: createMockReleaseDetailPageState(row),
    lifecycleLabel: mockLifecycleLabel(row),
    breadcrumbs: [
      { label: "Каталог", href: ROUTES.dashboardCatalog },
      { label: "Аналитика релизов", href: ROUTES.analyticsReleases },
      { label: row.release },
    ],
    heroBlurb:
      "Revenue share release внутри Spliton: учёт units, распределения и выплат в USDT (TRC20). Ниже — агрегированный обзор, история начислений и условия модели (mock-данные для макета).",
    cover: {
      caption:
        "Видео-обложка релиза: короткий ролик о сделке, payout-модели и участниках (подключите MP4/HLS в данных страницы).",
    },
    summaryPanel: [
      { label: "Ориентир gross", value: row.yieldPct, hint: "Модельная метрика, не гарантия" },
      { label: "Статус раунда", value: statusRu, hint: "Первичка / выплаты / secondary" },
      { label: "Выплаты (окно)", value: row.payouts, hint: "Агрегат по отчётным периодам" },
      { label: "Units в обороте", value: row.units, hint: "Sold / в обращении" },
      { label: "Доступно к входу", value: `${availableExample} u.`, hint: "Остаток в первичке (mock)" },
      { label: "Secondary (30D)", value: `${(1.2 + Number(row.id) * 0.15).toFixed(2)}M USDT`, hint: "Оборот передач units" },
      { label: "Мин. вход (mock)", value: "10 USDT", hint: "Порог лота в демо" },
      {
        label: "Кошелёк",
        value: "Пополнить USDT",
        hint: "Через провайдера · TRC20",
        href: `${ROUTES.dashboard}#deposit`,
      },
    ],
    performance: {
      title: "Динамика начислений и распределений",
      subtitle:
        "Нормализованный индекс выплат по релизу (mock): ось времени — отчётные окна, ось Y — относительный уровень distribution, не спекулятивная «цена актива».",
      seriesByPeriod: buildSeriesMap(row),
      miniStats: [
        { label: "Δ к пред. окну", value: row.changePct },
        { label: "Коридор выплат", value: `${row.payoutBand.lo} — ${row.payoutBand.hi}` },
        { label: "Жанр", value: genre },
      ],
    },
    quickStats: [
      {
        label: "Выплаты 30D",
        value: row.payouts,
        sub: "за последние 30 дней",
        info: "Сумма выплат держателям units по релизу за скользящие 30 календарных дней; по данным отчётных периодов.",
      },
      {
        label: "Выплаты all-time",
        value: `${(2.4 + Number(row.id) * 0.3).toFixed(1)}M USDT`,
        sub: "с момента запуска",
        info: "Накопленная сумма выплат по релизу с даты подключения к модели revenue share до текущего момента.",
      },
      {
        label: "Units sold",
        value: row.units,
        sub: "в обращении",
        info: "Количество units, переданных инвесторам: первичные размещения и вторичные сделки внутри платформы.",
      },
      {
        label: "Available units",
        value: `${availableExample}`,
        sub: "остаток первички",
        info: "Units, доступные к покупке в рамках текущего или заявленного первичного раунда, пока лимит не исчерпан.",
      },
      {
        label: "Raise target",
        value: "420 000 USDT",
        sub: "цель раунда",
        info: "Плановый объём привлечения (cap) для объявленного раунда — ориентир для прогресса сбора.",
      },
      {
        label: "Fill progress",
        value: `${Math.min(94, 48 + Number(row.id) * 5)}%`,
        sub: "от цели сбора",
        info: "Доля выполнения raise target: отношение фактически привлечённого объёма к целевому значению раунда.",
      },
      {
        label: "Secondary volume",
        value: `${(0.8 + Number(row.id) * 0.09).toFixed(2)}M USDT`,
        sub: "перепродажи units",
        info: "Совокупный оборот сделок на вторичном рынке по этому релизу, в пересчёте в USDT за выбранную методику.",
      },
      {
        label: "Средняя цена / unit",
        value: "18,4 USDT / u.",
        sub: "внутренний рынок",
        info: "Средневзвешенная цена передачи одного unit на вторичке Spliton; отражает фактические исполнения, не «цену трека».",
      },
    ],
    about: {
      title: "О релизе",
      paragraphs: [
        `${row.release} — релиз в каталоге Spliton с моделью revenue share: пользователи приобретают units, которые фиксируют долю в пуле распределения дохода трека (investor_share), а не право собственности на фонограмму.`,
        `Платформа ведёт учёт rounds, начислений и выплат в USDT (TRC20), а также передачу rights на secondary внутри экосистемы. Показатели на странице — демонстрационные, для проверки UI и сценариев.`,
        `Вы не «владеете треком» и не получаете гарантированный доход: размер выплат зависит от фактического дохода релиза, deal terms и вашего количества units.`,
      ],
    },
    howItWorks: {
      title: "Как устроен этот релиз",
      blocks: [
        {
          heading: "Раунд и лимиты",
          body: "Первичный раунд задаёт raise_target и доступный объём units. После заполнения или закрытия раунда новые входы могут идти через вторичный рынок — по правилам ликвидности и стакана заявок.",
        },
        {
          heading: "Пул пользователей и investor_share",
          body: "Investor_share определяет долю дохода трека, относимую к держателям units. Внутри пула распределение идёт пропорционально вашим units к sold units за период.",
        },
        {
          heading: "Начисления и payout model",
          body: "Периодичность (например, ежемесячно), валюта USDT (TRC20) и вычеты platform fee отражаются в deal terms. История фактических выплат — в таблице payout history ниже.",
        },
        {
          heading: "Promo / upfront (если есть в сделке)",
          body: "Часть бюджета может уходить на promo, artist upfront или platform upfront — это снижает чистый пул пользователей в конкретных периодах; сверяйте с карточкой релиза.",
        },
        {
          heading: "Распределение дохода",
          body: "Доход трека делится по distribution_share между артистом, платформой и пулом пользователей согласно контрактной модели релиза; отображаемые проценты — учебный пример.",
        },
        {
          heading: "Передача rights",
          body: "Secondary — внутренний рынок передачи units между пользователями; цена в заявках не является «котировкой ценной бумаги», а отражает спрос на перераспределение rights.",
        },
      ],
    },
    terms: {
      title: "Параметры сделки и релиза",
      rows: [
        { key: "distribution_share (пример)", val: "100%", note: "База распределения дохода периода" },
        { key: "artist_share", val: "42%", note: "Доля артиста в модели (mock)" },
        { key: "investor_share / user pool", val: "26%", note: "Пул держателей units" },
        { key: "platform_fee", val: "8%", note: "Сервис и операции" },
        { key: "raise_target", val: "420 000 USDT", note: "Цель первичного раунда" },
        { key: "hard_cap", val: "480 000 USDT", note: "Верхняя граница (mock)" },
        { key: "promo_budget", val: "24 000 USDT", note: "Маркетинг релиза" },
        { key: "artist_upfront", val: "18 000 USDT", note: "Аванс артисту" },
        { key: "platform_upfront", val: "6 000 USDT", note: "Аванс платформе" },
        { key: "total_units", val: "2 400", note: "Выпуск units (mock)" },
        { key: "Текущий статус", val: statusRu, note: row.symbol },
      ],
    },
    payoutHistory: payoutHistoryFor(row),
    secondary: {
      title: "Вторичный рынок и передача rights",
      rows: [
        { label: "Активные лоты", value: `${842 + Number(row.id) * 12}` },
        { label: "Сделок за 7D", value: `${128 + Number(row.id) * 4}` },
        { label: "Средний спред заявок", value: "2,8%" },
        { label: "Медиана времени fill", value: `${14 + Number(row.id)} ч` },
        { label: "Средняя цена / unit", value: "18,4 USDT / u." },
        { label: "Ликвидность", value: row.genre === "electronic" ? "Deep" : "Mid" },
      ],
    },
    faq: FAQ,
    related: [
      {
        title: "Гид по выбору",
        description: "Фильтры, payout history и сравнение релизов без инвестиционных обещаний.",
        href: ROUTES.guideSelection,
      },
      {
        title: "Аналитика релизов",
        description: "Сводная таблица и графики по каталогу.",
        href: ROUTES.analyticsReleases,
      },
      {
        title: "Параметры релиза",
        description: "Как читать карточку: units, investor_share, раунд.",
        href: ROUTES.catalogReleaseParameters,
      },
      {
        title: "Обзор рынка",
        description: "Ликвидность, размещения и сегменты площадки.",
        href: ROUTES.catalogMarketOverview,
      },
      {
        title: "Каталог",
        description: "Все релизы и статусы раундов.",
        href: ROUTES.dashboardCatalog,
      },
      {
        title: "Кабинет · выплаты",
        description: "История начислений на кошелёк USDT.",
        href: `${ROUTES.dashboard}#payouts`,
      },
    ],
  }, {
    soldUnits: Number(soldUnits.replace(/\D/g, "")) || 1000,
    totalUnits: 2400,
    availableUnits: Number(availableExample.replace(/\D/g, "")) || 400,
    volumeUsdt: [0, 12_000, 18_000, 22_000, 28_000, 31_000],
    volumeUnits: [12, 28, 45, 90, 140, 210, 320, 410, 480, 500],
    liquidityVolume24h: [80, 140, 120, 200, 260, 310, 380, 420, 460, 500],
    liquidityScore: [2.8, 3.1, 3.4, 3.9, 4.2, 4.0, 4.6, 4.9, 5.1, 5.3],
  });
}
