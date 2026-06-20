import { ROUTES } from "@/constants/routes";

export type DashboardNavBadge = "new" | "free" | "hot";

export type DashboardNavSubItem = {
  label: string;
  description: string;
  href: string;
  /** Плашка справа от заголовка (как NEW / FREE на референсе) */
  badge?: DashboardNavBadge;
  /** Путь к svg/png в `public` (например `/icons/partner.svg`) */
  iconSrc?: string;
  /** Пока нет картинки — короткий маркер в плейсхолдере (1–2 символа) */
  iconHint?: string;
  /** Деструктивное действие (например «Выйти») */
  danger?: boolean;
};

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  /** Текст в левой колонке mega-menu */
  megaTeaser?: string;
  children?: DashboardNavSubItem[];
};

export const dashboardNavItems: DashboardNavItem[] = [
  { id: "home", label: "Главная", href: ROUTES.dashboard },
  {
    id: "catalog",
    label: "Каталог",
    href: ROUTES.dashboardCatalog,
    megaTeaser:
      "Spliton: доли дохода по трекам — юниты, USDT (TRC20), раунды, выплаты и вторичный рынок для передачи прав без брокерской модели.",
    children: [
      {
        label: "Каталог релизов",
        description: "Поиск релизов, фильтры, покупка UNT и вход в активные раунды.",
        href: ROUTES.dashboardCatalog,
        iconSrc: "/images/catalog/1.png",
      },
      {
        label: "Аналитика релизов",
        description: "Доходность, выплаты и сравнение по строкам каталога — ориентиры, не гарантии дохода.",
        href: ROUTES.analyticsReleases,
        iconSrc: "/images/catalog/2.png",
      },
      {
        label: "Гид по выбору",
        description: "Пошаговые рекомендации по отбору релизов под стратегию",
        href: ROUTES.guideSelection,
        badge: "new",
        iconSrc: "/images/catalog/3.png",
      },
      {
        label: "Параметры релиза",
        description: "Карточка трека: юниты, доля инвестора, раунд, выплаты USDT (TRC20) и вторичный рынок.",
        href: ROUTES.catalogReleaseParameters,
        iconSrc: "/images/catalog/4.png",
      },
      {
        label: "Обзор рынка",
        description: "Ликвидность, поток размещений и вторичный рынок — без дублирования построчной доходности из аналитики.",
        href: ROUTES.catalogMarketOverview,
        iconSrc: "/images/catalog/5.png",
      },
    ],
  },
  {
    id: "holdings",
    label: "Мои активы",
    href: ROUTES.myAssetsOverview,
    megaTeaser: "Сводка активов: позиции, юниты, структура и операции по релизам.",
    children: [
      {
        label: "Сводка",
        description: "Краткий обзор текущих позиций, юнитов и статуса портфеля.",
        href: ROUTES.myAssetsOverview,
        iconSrc: "/images/myactiv/svodka.png",
      },
      {
        label: "Метрики",
        description: "Структура позиций, распределение юнитов и ключевые показатели.",
        href: ROUTES.myAssetsMetrics,
        iconSrc: "/images/myactiv/metrik.png",
      },
      {
        label: "Активность",
        description: "Операции по активам: покупки юнитов, переводы и вторичный рынок.",
        href: ROUTES.myAssetsOperations,
        iconSrc: "/images/myactiv/aktive.png",
      },
      {
        label: "Позиции",
        description: "Список всех активов по релизам с юнитами и статусами.",
        href: ROUTES.myAssetsPositionsStructure,
        iconSrc: "/images/myactiv/position.png",
      },
    ],
  },
  {
    id: "payouts",
    label: "Выплаты",
    href: ROUTES.dashboardPayouts,
    megaTeaser: "Обзор, сравнение периодов, график начислений и операции USDT без лишних шагов.",
    children: [
      {
        label: "Обзор",
        description: "График динамики начислений",
        href: ROUTES.dashboardPayouts,
        iconSrc: "/images/payouts-menu/1.png",
        iconHint: "RS",
      },
      {
        label: "Сравнение",
        description: "Два периода: начисления и выводы",
        href: ROUTES.dashboardPayoutsComparison,
        iconSrc: "/images/payouts-menu/2.png",
        iconHint: "ОБ",
      },
      {
        label: "История выплат",
        description: "Все начисления на кошелёк",
        href: ROUTES.dashboardPayoutsHistory,
        iconSrc: "/images/payouts-menu/3.png",
        iconHint: "СР",
      },
      {
        label: "Пополнить",
        description: "Пополнение баланса USDT",
        href: `${ROUTES.dashboardPayouts}/deposit`,
        iconSrc: "/images/payouts-menu/4.png",
        iconHint: "ИС",
      },
      {
        label: "Вывод",
        description: "Вывод USDT и реквизиты",
        href: `${ROUTES.dashboardPayouts}/withdraw`,
        iconSrc: "/images/payouts-menu/5.png",
        iconHint: "ПО",
      },
    ],
  },
  {
    id: "secondary",
    label: "Вторичный рынок",
    href: ROUTES.dashboardSecondaryMarket,
  },
  {
    id: "misc",
    label: "Сервисы",
    href: ROUTES.support,
    megaTeaser: "Сервисные разделы: калькулятор, статус и программы — без лишнего шума.",
    children: [
      {
        label: "Калькулятор",
        description: "Покупка и продажа юнитов, вывод USDT и пример начислений по введённым данным.",
        href: ROUTES.calculator,
        iconHint: "Σ",
      },
      {
        label: "Комиссии",
        description: "Таблица тарифов, примеры расчёта и пояснения по USDT и рынкам.",
        href: ROUTES.fees,
        iconHint: "%",
      },
      {
        label: "Статус системы",
        description: "Сервисы, техработы, инциденты и ссылки в поддержку.",
        href: ROUTES.systemStatus,
        iconHint: "●",
      },
      {
        label: "Новости",
        description: "Релизы продукта и объявления для инвесторов.",
        href: ROUTES.news,
        iconHint: "N",
      },
      {
        label: "Реферальная программа",
        description: "Ссылка, код, статистика приглашений и награды в USDT.",
        href: ROUTES.referralProgram,
        iconHint: "RF",
      },
      {
        label: "Партнёрская программа",
        description: "Медиа, сообщества, лейблы: форматы, заявка и отличие от рефералки.",
        href: ROUTES.partnerProgram,
        iconHint: "PR",
      },
      {
        label: "Портал эмитента",
        description: "Релизы, раунды, выплаты и заявки для роли эмитента.",
        href: ROUTES.dashboardArtist,
        iconHint: "AR",
      },
      {
        label: "Споры",
        description: "Оспорить депозит, вывод, сделку или документ.",
        href: ROUTES.dashboardDisputes,
        iconHint: "DS",
      },
      {
        label: "Выписки и справки",
        description: "Налоговые и бухгалтерские выписки по операциям Spliton.",
        href: ROUTES.dashboardStatements,
        iconHint: "ST",
      },
      {
        label: "Центр доверия",
        description: "Как устроена платформа, риски и защита средств.",
        href: ROUTES.trust,
        iconHint: "TR",
      },
    ],
  },
];


