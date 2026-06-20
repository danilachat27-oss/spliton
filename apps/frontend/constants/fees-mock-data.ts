import { CALCULATOR_MOCK } from "@/constants/calculator-mock";

export type FeesMainSection = "trading" | "depositWithdrawal" | "other";
export type FeesTradingTab = "overview" | "primary" | "secondary";

export const FEES_MAIN_SECTIONS: { id: FeesMainSection; label: string }[] = [
  { id: "trading", label: "Торговые комиссии" },
  { id: "depositWithdrawal", label: "Комиссии за ввод/вывод" },
  { id: "other", label: "Другие комиссии" },
];

export const FEES_TRADING_TABS: { id: FeesTradingTab; label: string }[] = [
  { id: "overview", label: "Все операции" },
  { id: "primary", label: "Первичный рынок" },
  { id: "secondary", label: "Secondary market" },
];

/** Справочные суточные лимиты вывода по уровню верификации (политика платформы). */
export const FEES_WITHDRAWAL_LIMITS_BY_KYC = [
  { id: "unverified", limitUsdt: 0 },
  { id: "basic", limitUsdt: 10_000 },
  { id: "full", limitUsdt: 50_000 },
] as const;

/** @deprecated Используйте FEES_WITHDRAWAL_LIMITS_BY_KYC */
export const FEES_WITHDRAWAL_LIMIT_24H_USDT = FEES_WITHDRAWAL_LIMITS_BY_KYC[2].limitUsdt;

/** Единый источник иллюстративных тарифов (см. калькулятор). */
export const FEES_RATES = {
  platformBuy: CALCULATOR_MOCK.buyPlatformFeeRate,
  secondary: CALCULATOR_MOCK.secondaryMarketFeeRate,
  withdrawMin: CALCULATOR_MOCK.withdrawFeeMinUsdt,
  withdrawRate: CALCULATOR_MOCK.withdrawFeeRate,
  deposit: 0,
  payoutRetention: 0,
} as const;

export type MainFeeRow = {
  operation: string;
  feeType: string;
  rateLabel: string;
  calculation: string;
  note: string;
};

export const mainFeeRows: MainFeeRow[] = [
  {
    operation: "Покупка rights / UNT (первичный рынок)",
    feeType: "Platform fee",
    rateLabel: `${(FEES_RATES.platformBuy * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %`,
    calculation: "Процент от суммы платежа в USDT до подтверждения сделки.",
    note: "Отображается в превью ордера и в итоговой строке перед оплатой.",
  },
  {
    operation: "Продажа UNT на secondary market",
    feeType: "Secondary market fee",
    rateLabel: `${(FEES_RATES.secondary * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %`,
    calculation: "Процент от суммы исполненной сделки (gross) в USDT.",
    note: "Удерживается при исполнении; итог «к получению» уже за вычетом комиссии.",
  },
  {
    operation: "Вывод USDT на внешний адрес (TRC20)",
    feeType: "Withdrawal fee",
    rateLabel: `max(${FEES_RATES.withdrawMin} USDT; ${(FEES_RATES.withdrawRate * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %)`,
    calculation: "Берётся большая из двух величин: минимум или процент от запрошенной суммы вывода.",
    note: "Комиссия сети TRC20 оплачивается отдельно на стороне кошелька / сети и не входит в таблицу платформы.",
  },
  {
    operation: "Пополнение баланса USDT (TRC20)",
    feeType: "Deposit fee",
    rateLabel: `${(FEES_RATES.deposit * 100).toLocaleString("ru-RU")} %`,
    calculation: "Платформа не удерживает комиссию с входящего депозита.",
    note: "Перевод в блокчейне может иметь стороннюю комиссию сети — зависит от вашего кошелька.",
  },
  {
    operation: "Зачисление выплат по доле дохода на баланс",
    feeType: "Payout settlement",
    rateLabel: "0 % (удержание платформы в примере)",
    calculation: "Начисление на внутренний баланс; иллюстративная строка для прозрачности.",
    note: "Условия конкретного релиза и налоговая отчётность — в карточке сделки и документах.",
  },
];

export type FeeSectionBlock = {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

export function buildFeeSectionBlocks(
  rates: Pick<typeof FEES_RATES, "platformBuy" | "secondary" | "withdrawMin" | "withdrawRate"> = FEES_RATES,
): FeeSectionBlock[] {
  const pct = (n: number) =>
    `${(n * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} %`;

  return [
    {
      id: "wallet",
      title: "Wallet & Balance",
      subtitle: "Пополнение, баланс и зачисления",
      bullets: [
        "Пополнение: комиссия платформы 0 % — см. строку «Deposit fee».",
        "Входящие выплаты по rights: зачисление на баланс без отдельной строки «trading fee».",
        "Итоговые суммы по депозиту и балансу всегда видны до подтверждения входящего перевода (где применимо).",
      ],
    },
    {
      id: "market",
      title: "Market & Trading",
      subtitle: "Первичный и вторичный рынок UNT",
      bullets: [
        `Первичная покупка: platform fee ${pct(rates.platformBuy)} от платежа.`,
        `Secondary: secondary fee ${pct(rates.secondary)} от суммы сделки при исполнении.`,
        "Категории комиссий разделены: рыночные удержания не смешиваются с комиссией вывода.",
      ],
    },
    {
      id: "payouts",
      title: "Payouts & Withdrawals",
      subtitle: "Вывод на кошелёк",
      bullets: [
        `Вывод: max(${rates.withdrawMin} USDT; ${pct(rates.withdrawRate)}) от заявленной суммы.`,
        "Перед отправкой заявки показывается итог «к получению на адрес» за вычетом комиссии платформы.",
        "Сетевая комиссия TRC20 не устанавливается Spliton и может меняться в сети.",
      ],
    },
  ];
}

/** @deprecated Используйте buildFeeSectionBlocks() для актуальных ставок */
export const feeSectionBlocks = buildFeeSectionBlocks();

export type FeesFaqItem = { id: string; question: string; answer: string };

export type ProgramFeeRow = {
  program: string;
  rewardModel: string;
  platformShare: string;
  note: string;
};

export const programFeeRows: ProgramFeeRow[] = [
  {
    program: "Реферальная программа",
    rewardModel: "Бонус за действия приглашённого пользователя",
    platformShare: "Фиксированные события (регистрация, пополнение, покупка UNT)",
    note: "Размер награды зависит от типа события; подробности — в разделе реферальной программы.",
  },
  {
    program: "Партнёрская программа",
    rewardModel: "Revenue share / affiliate по согласованным условиям",
    platformShare: "Индивидуально после рассмотрения заявки",
    note: "Комиссия платформы с операций рефералов не дублируется в публичной таблице торговых тарифов.",
  },
];

export type FeesRuleSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const feesRuleSections: FeesRuleSection[] = [
  {
    id: "definitions",
    title: "Основные определения",
    paragraphs: [
      "Platform fee — удержание платформы при покупке rights / UNT на первичном рынке. Считается от суммы платежа в USDT до подтверждения сделки.",
      "Secondary market fee — удержание при исполнении сделки на внутреннем вторичном рынке. Считается от суммы сделки (gross) в USDT.",
      "Withdrawal fee — комиссия платформы за вывод USDT на внешний адрес TRC20. Не включает комиссию сети Tron.",
    ],
  },
  {
    id: "primary-calc",
    title: "Расчёт platform fee (первичный рынок)",
    paragraphs: [
      "Комиссия = сумма платежа × ставка platform fee. Итог к зачёту в UNT рассчитывается после удержания.",
      "Ставка отображается в превью ордера и в итоговой строке перед оплатой. Фактическое значение может отличаться при промо-акциях или индивидуальных условиях релиза.",
    ],
  },
  {
    id: "secondary-calc",
    title: "Расчёт secondary fee",
    paragraphs: [
      "При исполнении лимитной или рыночной заявки комиссия удерживается из суммы сделки. В истории ордера видны gross, fee и net (к получению).",
      "Комиссия не смешивается с platform fee первичного рынка — это отдельная категория удержаний.",
    ],
  },
  {
    id: "withdraw-calc",
    title: "Расчёт withdrawal fee и лимиты",
    paragraphs: [
      "Комиссия вывода = max(минимальная фиксированная сумма USDT; процент от запрошенной суммы). Итог «к получению на адрес» показывается до подтверждения заявки.",
      "Суточный лимит вывода в таблице носит справочный характер и может зависеть от уровня верификации, истории операций и настроек безопасности аккаунта.",
      "Комиссия сети TRC20 оплачивается отдельно и не устанавливается Spliton.",
    ],
  },
  {
    id: "updates",
    title: "Обновление тарифов",
    paragraphs: [
      "Публичные ставки могут обновляться администратором платформы. Дата вступления в силу указывается в блоке «Актуальные тарифы» при подключении live API.",
      "Перед каждой операцией в кабинете показывается превью с итоговой комиссией — ориентируйтесь на него при подтверждении.",
    ],
  },
  {
    id: "volume-calc",
    title: "Как считается объём торгов за 30 дней",
    paragraphs: [
      "В расчёт входят исполненные операции на первичном и вторичном рынке в USDT за скользящие 30 календарных дней. Неисполненные заявки не учитываются.",
      "На текущем этапе для всех верифицированных пользователей действует единая ставка platform fee и secondary fee независимо от объёма. Таблица уровней подготовлена для прозрачности и будущих программ лояльности.",
    ],
  },
  {
    id: "buyer-seller",
    title: "Покупатель и продавец на рынке",
    paragraphs: [
      "На первичном рынке platform fee удерживается с покупателя при оплате ордера. Продавец (эмитент релиза) не платит отдельную торговую комиссию платформе в этой категории.",
      "На secondary market secondary fee удерживается с продавца при исполнении сделки. Покупатель видит полную сумму сделки; комиссия отражается в деталях ордера продавца.",
    ],
  },
  {
    id: "accounts",
    title: "Основной и связанные аккаунты",
    paragraphs: [
      "Объём торгов и лимиты вывода рассчитываются по основному аккаунту пользователя. Операции в кабинете Spliton выполняются под вашей учётной записью после авторизации.",
      "При изменении уровня верификации или настроек безопасности лимиты вывода могут пересчитываться — актуальное значение показывается в форме вывода перед подтверждением.",
    ],
  },
];

export const feesFaqItems: FeesFaqItem[] = [
  {
    id: "f1",
    question: "Есть ли комиссия за пополнение?",
    answer:
      "В текущей модели UI комиссия платформы на входящий депозит USDT (TRC20) равна 0 %. Отдельно может взиматься сеть при отправке с вашего внешнего кошелька.",
  },
  {
    id: "f2",
    question: "Когда удерживается secondary fee?",
    answer:
      "При исполнении сделки на внутреннем secondary market: комиссия считается от суммы сделки и отражается в деталях ордера до и после исполнения.",
  },
  {
    id: "f3",
    question: "Почему сумма к получению меньше суммы сделки?",
    answer:
      "На secondary отображается gross (полная сумма сделки) и отдельной строкой — комиссия. К получению (net) — это gross минус secondary fee и прочие удержания по конкретному сценарию.",
  },
  {
    id: "f4",
    question: "Есть ли комиссия за вывод?",
    answer:
      "Да: применяется withdrawal fee по правилам max(минимум USDT, процент от суммы). Точное значение показывается в форме вывода перед подтверждением.",
  },
  {
    id: "f5",
    question: "Где посмотреть итоговую сумму до подтверждения?",
    answer:
      "В превью операции: покупка units, продажа на secondary и вывод USDT — перед финальным подтверждением отображаются строки amount, fee и итог (total / net).",
  },
];
