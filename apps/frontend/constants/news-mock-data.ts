import { estimateReadTimeMinutes } from "@/lib/news-utils";

export type NewsCategoryId = "product" | "payouts" | "market" | "legal";

export type NewsCategoryFilterId = NewsCategoryId | "all";

export type NewsArticle = {
  id: string;
  slug: string;
  isoDate: string;
  dateLabel: string;
  category: NewsCategoryId;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  readTimeMinutes: number;
  isNew?: boolean;
};

export const NEWS_PAGE_SIZE = 8;

export const NEWS_CATEGORY_FILTERS: { id: NewsCategoryFilterId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "product", label: "Продукт" },
  { id: "market", label: "Рынок" },
  { id: "payouts", label: "Выплаты" },
  { id: "legal", label: "Документы" },
];

export const NEWS_CATEGORY_META: Record<NewsCategoryId, { label: string; tagClass: string }> = {
  product: {
    label: "Продукт",
    tagClass: "text-zinc-500",
  },
  payouts: {
    label: "Выплаты",
    tagClass: "text-zinc-500",
  },
  market: {
    label: "Рынок",
    tagClass: "text-zinc-500",
  },
  legal: {
    label: "Документы",
    tagClass: "text-zinc-500",
  },
};

const COVERS = [
  "/images/новость/1.png",
  "/images/catalog/1.png",
  "/images/catalog/2.png",
  "/images/catalog/3.png",
  "/images/fees/back.png",
  "/images/partner-programtab=about/back.jpg",
  "/images/catalog/4.png",
  "/images/catalog/5.png",
  "/images/assetsunt/backgraund.png",
  "/images/catalog/6.png",
  "/images/catalog/7.png",
  "/images/catalog/8.png",
] as const;

const FALLBACK_COVER = "/images/fees/back.png";

function withReadTime(
  article: Omit<NewsArticle, "readTimeMinutes"> & { readTimeMinutes?: number },
): NewsArticle {
  const text = `${article.title} ${article.excerpt} ${article.content}`;
  return {
    ...article,
    readTimeMinutes: article.readTimeMinutes ?? estimateReadTimeMinutes(text),
  };
}

const RAW_ARTICLES: Omit<NewsArticle, "readTimeMinutes">[] = [
  {
    id: "n-2026-04-12-secondary",
    slug: "secondary-market-order-book",
    isoDate: "2026-04-12",
    dateLabel: "12 апр. 2026 г.",
    category: "market",
    title: "Вторичный рынок: подсказки в стакане и история сделок",
    excerpt:
      "В кабинете обновлены подписи к глубине стакана и фильтрам истории — меньше сомнений при размещении лимитных заявок в USDT (TRC20).",
    content: `<p>Мы обновили интерфейс вторичного рынка: подсказки к глубине стакана и фильтры истории сделок стали понятнее при работе с лимитными заявками.</p><p>Изменения касаются только отображения — логика исполнения и расчёта комиссий не менялась. Все суммы по-прежнему в USDT (TRC20).</p><p>Если вы заметите расхождение между подсказкой и фактическим исполнением, напишите в поддержку с номером заявки.</p>`,
    coverUrl: COVERS[0],
    isNew: true,
  },
  {
    id: "n-2026-04-08-payouts",
    slug: "payouts-unified-format",
    isoDate: "2026-04-08",
    dateLabel: "8 апр. 2026 г.",
    category: "payouts",
    title: "Выплаты: единый формат сумм и комиссий в подтверждении",
    excerpt:
      "Перед подтверждением вывода теперь явно показываются сумма к списанию, комиссия сети и итог к получению — в том же стиле, что и пополнение.",
    content: `<p>Экран подтверждения вывода приведён к единому формату с пополнением: сумма к списанию, комиссия сети TRC20 и итог к получению отображаются отдельными строками.</p><p>Это снижает риск ошибки при быстром подтверждении операции. Базовые лимиты и тарифы не изменились.</p>`,
    coverUrl: COVERS[1],
    isNew: true,
  },
  {
    id: "n-2026-03-28-product",
    slug: "catalog-yield-preview",
    isoDate: "2026-03-28",
    dateLabel: "28 мар. 2026 г.",
    category: "product",
    title: "Каталог релизов: быстрый просмотр доходности",
    excerpt:
      "В карточке релиза добавлены ориентиры по последним выплатам и ликвидности units — данные по-прежнему ориентировочные до подключения live API.",
    content: `<p>В карточках каталога появились ориентиры по последним выплатам и ликвидности units. Показатели носят справочный характер и могут отличаться от фактических начислений.</p><p>После подключения live API значения будут обновляться из операционных данных платформы.</p>`,
    coverUrl: COVERS[2],
  },
  {
    id: "n-2026-03-15-legal",
    slug: "fees-limits-clarification",
    isoDate: "2026-03-15",
    dateLabel: "15 мар. 2026 г.",
    category: "legal",
    title: "Уточнения в разделе комиссий и лимитов",
    excerpt:
      "Страница «Комиссии» дополнена примерами расчёта для первичной покупки units и сделок на вторичном рынке — без изменения базовых тарифов.",
    content: `<p>На странице комиссий добавлены примеры расчёта для первичной покупки units и сделок на вторичном рынке. Тарифы и лимиты остались прежними — изменилась только подача материала.</p>`,
    coverUrl: COVERS[3],
  },
  {
    id: "n-2026-03-02-metrics",
    slug: "portfolio-metrics-light",
    isoDate: "2026-03-02",
    dateLabel: "2 мар. 2026 г.",
    category: "product",
    title: "Метрики портфеля: светлый режим и экспорт в работе",
    excerpt:
      "Экран метрик активов переведён в тот же светлый каркас, что профиль и выплаты; выгрузка в CSV запланирована в следующем релизе.",
    content: `<p>Экран метрик портфеля приведён к единому каркасу с профилем и выплатами. Экспорт в CSV находится в разработке и появится в одном из ближайших релизов.</p>`,
    coverUrl: COVERS[4],
  },
  {
    id: "n-2026-02-18-support",
    slug: "support-templates",
    isoDate: "2026-02-18",
    dateLabel: "18 февр. 2026 г.",
    category: "product",
    title: "Поддержка: шаблоны обращений по выплатам и верификации",
    excerpt:
      "В форме обращения добавлены быстрые темы — меньше уточняющих вопросов со стороны поддержки и быстрее маршрутизация тикета.",
    content: `<p>В форме обращения появились быстрые темы по выплатам и верификации. Это ускоряет маршрутизацию тикета и сокращает число уточняющих вопросов.</p>`,
    coverUrl: COVERS[5],
  },
  {
    id: "n-2026-02-05-kyc",
    slug: "kyc-document-hints",
    isoDate: "2026-02-05",
    dateLabel: "5 февр. 2026 г.",
    category: "legal",
    title: "Верификация: подсказки к загрузке документов",
    excerpt:
      "Перед отправкой KYC показываем требования к качеству снимка и список частых причин отклонения — без изменения правил проверки.",
    content: `<p>На шаге загрузки документов добавлены подсказки по качеству снимка и перечень частых причин отклонения. Правила KYC/AML не менялись.</p>`,
    coverUrl: COVERS[6],
  },
  {
    id: "n-2026-01-22-trust",
    slug: "trust-center-updates",
    isoDate: "2026-01-22",
    dateLabel: "22 янв. 2026 г.",
    category: "product",
    title: "Центр доверия: статусы сервисов и журнал операций",
    excerpt:
      "Страница Trust Center получила обновлённые сцены статусов и пояснения к этапам операций — для прозрачности без маркетинговых обещаний.",
    content: `<p>Центр доверия обновлён: статусы сервисов и пояснения к этапам операций стали нагляднее. Материалы описывают фактическую работу платформы без маркетинговых формулировок.</p>`,
    coverUrl: COVERS[7],
  },
  {
    id: "n-2026-01-10-partner",
    slug: "partner-program-launch",
    isoDate: "2026-01-10",
    dateLabel: "10 янв. 2026 г.",
    category: "product",
    title: "Партнёрская программа: заявка и онбординг в кабинете",
    excerpt:
      "Открыт приём заявок на партнёрство — affiliate, медиа и стратегические форматы. Условия согласуются индивидуально после рассмотрения.",
    content: `<p>Запущен раздел партнёрской программы с формой заявки и описанием форматов сотрудничества. Финальные условия согласуются после рассмотрения заявки командой Spliton.</p>`,
    coverUrl: COVERS[8],
  },
  {
    id: "n-2025-12-18-maintenance",
    slug: "scheduled-maintenance-dec",
    isoDate: "2025-12-18",
    dateLabel: "18 дек. 2025 г.",
    category: "product",
    title: "Плановое обслуживание: окно 45 минут",
    excerpt:
      "Краткое техническое окно для обновления инфраструктуры выплат. Торги и кабинет могут быть недоступны частично — уведомление за сутки.",
    content: `<p>Запланировано техническое окно длительностью около 45 минут для обновления инфраструктуры выплат. Пользователи получат уведомление за сутки до начала работ.</p>`,
    coverUrl: COVERS[9],
  },
  {
    id: "n-2025-12-01-market",
    slug: "primary-market-limits",
    isoDate: "2025-12-01",
    dateLabel: "1 дек. 2025 г.",
    category: "market",
    title: "Первичный рынок: лимиты на заявку в карточке релиза",
    excerpt:
      "Минимальный и максимальный объём покупки units теперь виден до перехода к оплате — меньше отменённых заявок из-за лимитов.",
    content: `<p>В карточке релиза на первичном рынке отображаются минимальный и максимальный объём покупки units до этапа оплаты.</p>`,
    coverUrl: COVERS[10],
  },
  {
    id: "n-2025-11-14-payouts",
    slug: "payouts-status-tracking",
    isoDate: "2025-11-14",
    dateLabel: "14 нояб. 2025 г.",
    category: "payouts",
    title: "Выплаты: статусы перевода в истории операций",
    excerpt:
      "Каждый вывод USDT (TRC20) получил пошаговый статус в истории — от создания до подтверждения в сети.",
    content: `<p>История операций показывает пошаговый статус вывода USDT (TRC20): создание, обработка, отправка в сеть и подтверждение.</p>`,
    coverUrl: COVERS[11],
  },
];

export const newsArticlesMock: NewsArticle[] = RAW_ARTICLES.map(withReadTime);

export function getNewsCoverUrl(index: number): string {
  return COVERS[index % COVERS.length] ?? FALLBACK_COVER;
}

export function findNewsArticleBySlug(slug: string): NewsArticle | undefined {
  const normalized = slug.toLowerCase();
  return newsArticlesMock.find((a) => a.slug.toLowerCase() === normalized);
}
