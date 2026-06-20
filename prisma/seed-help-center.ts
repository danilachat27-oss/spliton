/**
 * Idempotent Help Center seed — migrates legacy static FAQ into CMS tables.
 *
 * Usage:
 *   npx tsx prisma/seed-help-center.ts
 *   npm run prisma:seed   (also invoked from prisma/seed.ts)
 */
import {
  HelpArticleStatus,
  PrismaClient,
  UserRoleCode,
  type Prisma,
} from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

type LinkRef = { href: string; label: string };

type CategorySeed = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  icon?: string;
};

type ArticleSeed = {
  slug: string;
  categorySlug: string;
  title: string;
  excerpt: string;
  content: string;
  sortOrder: number;
  isPopular?: boolean;
  isGettingStarted?: boolean;
  isFeatured?: boolean;
};

function ru(text: string): Prisma.InputJsonValue {
  return { ru: text };
}

function faqBody(answer: string, link?: LinkRef): string {
  if (!link) return answer;
  return `${answer}\n\nПодробнее: ${link.label} — ${link.href}`;
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'getting-started',
    title: 'Начало работы',
    description: 'Первые шаги на Spliton: баланс, доли, выплаты и навигация по кабинету.',
    sortOrder: 1,
    icon: 'rocket',
  },
  {
    slug: 'popular-questions',
    title: 'Популярные вопросы',
    description: 'Самые частые вопросы пользователей Spliton.',
    sortOrder: 2,
    icon: 'help-circle',
  },
  {
    slug: 'account-security',
    title: 'Аккаунт и безопасность',
    description: 'Верификация, 2FA, сессии и защита аккаунта.',
    sortOrder: 3,
    icon: 'shield',
  },
  {
    slug: 'deposits-withdrawals',
    title: 'Депозиты и вывод',
    description: 'Пополнение USDT (TRC20), вывод средств, лимиты и статусы операций.',
    sortOrder: 4,
    icon: 'arrow-down-up',
  },
  {
    slug: 'buy-sell-shares',
    title: 'Покупка и продажа долей',
    description: 'Каталог релизов, участие в раундах и структура сделки.',
    sortOrder: 5,
    icon: 'pie-chart',
  },
  {
    slug: 'secondary-market',
    title: 'Вторичный рынок',
    description: 'Стакан, ордера, исполнение сделок и история торгов.',
    sortOrder: 6,
    icon: 'store',
  },
  {
    slug: 'payouts',
    title: 'Выплаты',
    description: 'Revenue share, начисления по долям и сверка с балансом.',
    sortOrder: 7,
    icon: 'wallet',
  },
  {
    slug: 'docs',
    title: 'Документы и правила',
    description: 'Юридические документы, гиды и справочные материалы.',
    sortOrder: 8,
    icon: 'file-text',
  },
];

const ARTICLES: ArticleSeed[] = [
  // Featured / getting started
  {
    slug: 'first-steps-balance-shares-payouts',
    categorySlug: 'getting-started',
    title: 'Первые шаги: баланс, доли и выплаты',
    excerpt: 'Как читать обзор активов, где смотреть начисления и что такое rights / units.',
    content:
      'В кабинете Spliton обзор активов показывает баланс USDT, позиции по релизам и историю начислений. Доли (units / rights) привязаны к конкретным релизам — откройте карточку релиза, чтобы увидеть параметры сделки и ожидаемые выплаты.\n\nРаздел выплат содержит графики и сверку с балансом. Перед первой операцией рекомендуем пройти верификацию и включить 2FA.\n\nПодробнее: Гид по выбору релиза — /guide/selection',
    sortOrder: 1,
    isGettingStarted: true,
    isPopular: true,
    isFeatured: true,
  },
  {
    slug: 'withdraw-usdt-trc20-checklist',
    categorySlug: 'getting-started',
    title: 'Вывод USDT на TRC20: чек-лист',
    excerpt: 'Проверка адреса, лимиты, время обработки и что делать при задержке.',
    content:
      'Перед выводом USDT проверьте: адрес получателя в сети TRC20, лимиты аккаунта, включённую 2FA и подтверждение по почте. Заявка попадает в очередь — статус отображается в истории выплат.\n\nПри задержке не отправляйте повторный перевод на тот же адрес. Сверьте хеш транзакции и обратитесь в поддержку с ID аккаунта.\n\nПодробнее: Вывод — /assets/payouts/withdraw',
    sortOrder: 2,
    isGettingStarted: true,
    isPopular: true,
  },
  {
    slug: 'secondary-market-without-noise',
    categorySlug: 'getting-started',
    title: 'Вторичный рынок без лишнего шума',
    excerpt: 'Заявки, спред и как не перепутать сторону сделки.',
    content:
      'На вторичном рынке Spliton вы размещаете лимитные или рыночные заявки по инструментам, связанным с релизами. Спред — разница между лучшими ценами покупки и продажи.\n\nПеред первой сделкой убедитесь, что выбран верный инструмент и сторона (buy/sell). История ордеров и сделок доступна в том же разделе.\n\nПодробнее: Вторичный рынок — /dashboard/secondary-market',
    sortOrder: 3,
    isGettingStarted: true,
    isPopular: true,
  },
  {
    slug: 'release-deal-structure',
    categorySlug: 'buy-sell-shares',
    title: 'Структура сделки по релизу',
    excerpt: 'Параметры revenue share и что смотреть перед покупкой доли.',
    content:
      'Каждый релиз на Spliton описывает модель revenue share: долю инвестора, целевой объём раунда, сроки и источники дохода. Перед покупкой доли изучите карточку релиза, параметры сделки и образовательные материалы.\n\nПодробнее: Гид по структуре сделки — /guide/deal-structure',
    sortOrder: 1,
    isGettingStarted: true,
    isFeatured: true,
  },

  // Topic cards
  {
    slug: 'deposit-usdt-trc20-overview',
    categorySlug: 'deposits-withdrawals',
    title: 'Пополнение USDT (TRC20)',
    excerpt: 'Сеть, комиссия сети, время зачисления и типичные ошибки адреса.',
    content:
      'Для пополнения откройте раздел депозита, скопируйте адрес платформы и отправьте USDT только в сети TRC20. Комиссия сети оплачивается отправителем. Зачисление зависит от подтверждений в блокчейне.\n\nПодробнее: Пополнение — /assets/payouts/deposit',
    sortOrder: 1,
    isGettingStarted: true,
    isPopular: true,
  },
  {
    slug: 'withdraw-funds-overview',
    categorySlug: 'deposits-withdrawals',
    title: 'Вывод средств',
    excerpt: 'Заявки, лимиты, подтверждение по почте и статусы в ленте.',
    content:
      'Создайте заявку на вывод, укажите адрес TRC20 и подтвердите операцию. Лимиты и дополнительные проверки зависят от уровня верификации. Статус заявки — в истории выплат.\n\nПодробнее: Вывод — /assets/payouts/withdraw',
    sortOrder: 2,
    isPopular: true,
  },
  {
    slug: 'revenue-share-payouts-overview',
    categorySlug: 'payouts',
    title: 'Revenue share и начисления',
    excerpt: 'Как формируются выплаты по долям, графики и сверка с балансом.',
    content:
      'Начисления привязаны к долям по релизам и правилам сделки. В разделе выплат доступны графики, история и сравнение периодов для сверки с балансом.\n\nПодробнее: Выплаты — /assets/payouts',
    sortOrder: 1,
    isGettingStarted: true,
  },
  {
    slug: 'secondary-market-overview',
    categorySlug: 'secondary-market',
    title: 'Вторичный рынок',
    excerpt: 'Ордера, стакан, история сделок и избранное.',
    content:
      'Вторичный рынок Spliton позволяет торговать долями между держателями. Используйте стакан для оценки ликвидности, размещайте ордера и отслеживайте исполнение в истории.\n\nПодробнее: Вторичный рынок — /dashboard/secondary-market',
    sortOrder: 0,
    isPopular: true,
  },
  {
    slug: 'verification-overview',
    categorySlug: 'account-security',
    title: 'Верификация',
    excerpt: 'Статус аккаунта, документы и доступ к операциям.',
    content:
      'Верификация подтверждает личность и может быть обязательной для вывода и повышенных лимитов. Статус и запрошенные документы — в профиле.\n\nПодробнее: Верификация — /dashboard/profile?tab=verification',
    sortOrder: 1,
    isGettingStarted: true,
  },
  {
    slug: 'account-security-overview',
    categorySlug: 'account-security',
    title: 'Безопасность',
    excerpt: 'Пароль, 2FA, вывод и уведомления о входе.',
    content:
      'В разделе безопасности настройте надёжный пароль, двухфакторную аутентификацию и проверьте активные сессии. Для вывода могут требоваться дополнительные подтверждения.\n\nПодробнее: Безопасность — /dashboard/profile?tab=security',
    sortOrder: 2,
  },

  // FAQ — deposits (balance group)
  {
    slug: 'how-to-deposit-usdt-trc20',
    categorySlug: 'deposits-withdrawals',
    title: 'Как пополнить баланс в USDT (TRC20)?',
    excerpt: 'Пошаговая инструкция по пополнению через сеть TRC20.',
    content: faqBody(
      'Откройте раздел пополнения, скопируйте адрес кошелька платформы и отправьте USDT только в сети TRC20. Сумма и комиссия сети отображаются в кабинете до подтверждения.',
      { href: '/assets/payouts/deposit', label: 'Перейти к пополнению' },
    ),
    sortOrder: 10,
    isPopular: true,
  },
  {
    slug: 'funds-not-received',
    categorySlug: 'deposits-withdrawals',
    title: 'Что если средства не пришли?',
    excerpt: 'Проверка сети, адреса и подтверждений в блокчейне.',
    content: faqBody(
      'Проверьте сеть (должна быть TRC20), корректность адреса и количество подтверждений в блокчейне. Транзакции в другой сети или на неверный адрес могут быть безвозвратны — при сомнениях не повторяйте перевод, напишите в поддержку с хешем tx.',
      { href: '/assets/payouts/history', label: 'История операций' },
    ),
    sortOrder: 11,
    isPopular: true,
  },
  {
    slug: 'deposit-withdrawal-limits-fees',
    categorySlug: 'deposits-withdrawals',
    title: 'Есть ли лимиты и комиссии?',
    excerpt: 'Лимиты на ввод/вывод и внутренние комиссии.',
    content: faqBody(
      'Лимиты на ввод/вывод и внутренние комиссии задаются продуктом и могут зависеть от уровня верификации. Актуальные значения смотрите в формах пополнения и вывода и в гайдах по сделке.',
      { href: '/guide/selection', label: 'Гиды' },
    ),
    sortOrder: 12,
  },
  {
    slug: 'buy-usdt-via-provider',
    categorySlug: 'deposits-withdrawals',
    title: 'Можно ли купить USDT через провайдера?',
    excerpt: 'Покупка USDT через платёжного провайдера в кабинете.',
    content: faqBody(
      'Если в кабинете доступен провайдер, выберите сумму и следуйте шагам оплаты. После успешной оплаты баланс обновится по статусу провайдера и правилам зачисления.',
      { href: '/assets/payouts/deposit', label: 'Купить / пополнить' },
    ),
    sortOrder: 13,
  },

  // FAQ — secondary market
  {
    slug: 'how-to-place-order',
    categorySlug: 'secondary-market',
    title: 'Как выставить заявку в стакане?',
    excerpt: 'Размещение лимитной заявки на вторичном рынке.',
    content: faqBody(
      'Во вторичном рынке выберите инструмент, тип заявки (покупка/продажа), цену и объём. После размещения заявка попадает в стакан; исполнение зависит от встречного объёма и цены.',
      { href: '/dashboard/secondary-market', label: 'Открыть рынок' },
    ),
    sortOrder: 10,
    isPopular: true,
  },
  {
    slug: 'limit-vs-market-order',
    categorySlug: 'secondary-market',
    title: 'Чем лимит отличается от рыночной?',
    excerpt: 'Лимитная и рыночная заявки на вторичке.',
    content:
      'Лимит исполняется по вашей цене или лучше, когда есть контрагент. Рыночная заявка стремится исполниться сразу по доступной ликвидности — проскальзывание возможно.',
    sortOrder: 11,
  },
  {
    slug: 'secondary-market-trade-history',
    categorySlug: 'secondary-market',
    title: 'Где посмотреть историю сделок?',
    excerpt: 'История ордеров и сделок на вторичном рынке.',
    content: faqBody(
      'История сделок и статусы ордеров доступны в том же разделе вторичного рынка. Используйте её для сверки с выплатами и позициями.',
      { href: '/dashboard/secondary-market', label: 'История и ордера' },
    ),
    sortOrder: 12,
  },
  {
    slug: 'order-partial-fill-cancel',
    categorySlug: 'secondary-market',
    title: 'Почему заявка отменена или частично исполнена?',
    excerpt: 'Частичное исполнение и причины отмены ордеров.',
    content:
      'Частичное исполнение возможно при нехватке объёма на уровне цены. Отмена может быть по таймауту, ручной отмене или изменению параметров инструмента — детали в ленте по конкретному ордеру.',
    sortOrder: 13,
  },

  // FAQ — payouts
  {
    slug: 'revenue-share-payouts-explained',
    categorySlug: 'payouts',
    title: 'Как устроены revenue share выплаты?',
    excerpt: 'Механика начислений по долям и релизам.',
    content: faqBody(
      'Выплаты привязаны к долям (units / rights) по релизам и правилам сделки. Начисления отображаются в разделе выплат и на графиках; сроки зависят от отчётного периода и условий релиза.',
      { href: '/assets/payouts', label: 'Обзор выплат' },
    ),
    sortOrder: 10,
    isPopular: true,
  },
  {
    slug: 'how-to-withdraw-usdt-trc20',
    categorySlug: 'payouts',
    title: 'Как вывести USDT на свой кошелёк?',
    excerpt: 'Создание заявки на вывод USDT (TRC20).',
    content: faqBody(
      'Укажите адрес TRC20, пройдите проверки безопасности и подтвердите заявку. Вывод обрабатывается в очереди; статус смотрите в истории выплат и уведомлениях.',
      { href: '/assets/payouts/withdraw', label: 'Вывод' },
    ),
    sortOrder: 11,
    isPopular: true,
  },
  {
    slug: 'payout-amount-difference',
    categorySlug: 'payouts',
    title: 'Почему начисление отличается от ожидаемого?',
    excerpt: 'Факторы, влияющие на сумму выплаты.',
    content: faqBody(
      'Сумма может зависеть от доли, удержаний, налоговой документации (если применимо) и фактических поступлений по релизу. Сверяйте карточку релиза и период отчёта.',
      { href: '/assets/payouts/comparison', label: 'Сравнение периодов' },
    ),
    sortOrder: 12,
  },

  // FAQ — account
  {
    slug: 'why-verification-required',
    categorySlug: 'account-security',
    title: 'Зачем нужна верификация?',
    excerpt: 'Цели верификации личности на Spliton.',
    content: faqBody(
      'Верификация снижает риск мошенничества и может быть обязательной для операций с выводом и лимитами. Статус и запрошенные документы — в профиле.',
      { href: '/dashboard/profile?tab=verification', label: 'Верификация' },
    ),
    sortOrder: 10,
  },
  {
    slug: 'enable-2fa-protect-withdrawal',
    categorySlug: 'account-security',
    title: 'Как включить 2FA и защитить вывод?',
    excerpt: 'Двухфакторная аутентификация и защита вывода.',
    content: faqBody(
      'В разделе безопасности подключите двухфакторную аутентификацию, проверьте почту и список сессий. Для вывода могут требоваться дополнительные подтверждения.',
      { href: '/dashboard/profile?tab=security', label: 'Безопасность' },
    ),
    sortOrder: 11,
  },
  {
    slug: 'support-never-asks-seed',
    categorySlug: 'popular-questions',
    title: 'Поддержка просит seed-фразу или пароль?',
    excerpt: 'Spliton никогда не запрашивает конфиденциальные данные.',
    content: faqBody(
      'Нет. Spliton не запрашивает seed-фразу, пароль от почты в переписке или «проверочные» переводы. Сообщайте только ID аккаунта и публичные детали операции.',
      { href: 'mailto:support@spliton.io', label: 'Написать в поддержку' },
    ),
    sortOrder: 1,
    isPopular: true,
  },
  {
    slug: 'account-login-activity',
    categorySlug: 'account-security',
    title: 'Где посмотреть активность входов?',
    excerpt: 'Лента действий по аккаунту.',
    content: faqBody(
      'Лента действий по аккаунту доступна в разделе активности. При подозрении на взлом смените пароль, завершите сессии и обратитесь в поддержку.',
      { href: '/assets/activity', label: 'Активность' },
    ),
    sortOrder: 12,
  },

  // KB — buy/sell & catalog
  {
    slug: 'catalog-buy-units',
    categorySlug: 'buy-sell-shares',
    title: 'Покупка долей в каталоге',
    excerpt: 'Как участвовать в первичном раунде релиза.',
    content:
      'Откройте каталог релизов, выберите интересующий актив и перейдите к оформлению участия. Сумма, доступные юниты и параметры сделки отображаются до подтверждения.\n\nПодробнее: Каталог — /catalog',
    sortOrder: 2,
  },
  {
    slug: 'sell-units-from-portfolio',
    categorySlug: 'buy-sell-shares',
    title: 'Продажа долей из кабинета',
    excerpt: 'Выставление долей на вторичный рынок.',
    content:
      'Из раздела активов можно перейти к продаже юнитов по конкретному релизу. Укажите цену и объём — заявка будет размещена на вторичном рынке.\n\nПодробнее: Позиции — /assets/positions',
    sortOrder: 3,
  },

  // KB — docs
  {
    slug: 'terms-of-service',
    categorySlug: 'docs',
    title: 'Пользовательское соглашение',
    excerpt: 'Условия использования платформы Spliton.',
    content: 'Полный текст пользовательского соглашения доступен на странице /terms',
    sortOrder: 1,
  },
  {
    slug: 'privacy-policy',
    categorySlug: 'docs',
    title: 'Политика конфиденциальности',
    excerpt: 'Обработка персональных данных на Spliton.',
    content: 'Полный текст политики конфиденциальности доступен на странице /privacy',
    sortOrder: 2,
  },
  {
    slug: 'guide-release-selection',
    categorySlug: 'docs',
    title: 'Гид: выбор релиза',
    excerpt: 'Как оценивать музыкальные активы.',
    content: 'Образовательный материал о выборе релиза для участия — /guide/selection',
    sortOrder: 3,
  },
  {
    slug: 'guide-deal-structure',
    categorySlug: 'docs',
    title: 'Гид: структура сделки',
    excerpt: 'Модель revenue share на Spliton.',
    content: 'Образовательный материал о структуре сделки — /guide/deal-structure',
    sortOrder: 4,
  },
  {
    slug: 'manual-deposit-help',
    categorySlug: 'docs',
    title: 'Ручное пополнение (deposit)',
    excerpt: 'Справка по пополнению баланса.',
    content: 'Инструкция по ручному пополнению — /assets/payouts/deposit',
    sortOrder: 5,
  },
  {
    slug: 'fees-and-limits-guide',
    categorySlug: 'docs',
    title: 'Комиссии и лимиты',
    excerpt: 'Справочник по комиссиям платформы.',
    content: 'Актуальные комиссии и лимиты — /guide/selection и /fees',
    sortOrder: 6,
  },
];

async function resolveAuthorUserId(): Promise<string | null> {
  const superAdminRole = await prisma.role.findUnique({
    where: { code: UserRoleCode.SUPER_ADMIN },
  });
  if (superAdminRole) {
    const link = await prisma.userRole.findFirst({
      where: { roleId: superAdminRole.id },
      select: { userId: true },
    });
    if (link) return link.userId;
  }

  const contentManagerRole = await prisma.role.findUnique({
    where: { code: UserRoleCode.CONTENT_MANAGER },
  });
  if (contentManagerRole) {
    const link = await prisma.userRole.findFirst({
      where: { roleId: contentManagerRole.id },
      select: { userId: true },
    });
    if (link) return link.userId;
  }

  const anyUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return anyUser?.id ?? null;
}

function parseTitleRu(titleTranslations: unknown): string {
  if (!titleTranslations || typeof titleTranslations !== 'object' || Array.isArray(titleTranslations)) {
    return '';
  }
  const ru = (titleTranslations as Record<string, unknown>).ru;
  return typeof ru === 'string' ? ru.trim() : '';
}

function isJunkHelpCategoryRow(slug: string, titleRu: string, knownSlugs: Set<string>): boolean {
  if (knownSlugs.has(slug)) return false;
  if (/^(live-cat|draft-cat|cat-articles|cat)-\d{6,}/i.test(slug)) return true;
  if (/^(live-cat|draft-cat|cat-articles)-/i.test(slug)) return true;
  const normalized = titleRu.toLowerCase();
  return normalized === 'cat' || normalized === 'draft cat' || normalized === 'live cat';
}

async function cleanupJunkHelpCategories(knownSlugs: Set<string>): Promise<number> {
  const rows = await prisma.helpCategory.findMany({
    select: { id: true, slug: true, titleTranslations: true },
  });

  let removed = 0;
  for (const row of rows) {
    const titleRu = parseTitleRu(row.titleTranslations);
    if (!isJunkHelpCategoryRow(row.slug, titleRu, knownSlugs)) continue;

    await prisma.helpArticle.deleteMany({ where: { categoryId: row.id } });
    await prisma.helpCategory.delete({ where: { id: row.id } });
    removed += 1;
  }

  return removed;
}

export async function seedHelpCenter(): Promise<void> {
  const authorUserId = await resolveAuthorUserId();
  if (!authorUserId) {
    console.warn(
      'Skip Help Center seed: no user in DB for authorUserId. Register a user and re-run seed.',
    );
    return;
  }

  const knownSlugs = new Set(CATEGORIES.map((c) => c.slug));
  const removed = await cleanupJunkHelpCategories(knownSlugs);
  if (removed > 0) {
    console.log(`Help Center cleanup: removed ${removed} junk categor${removed === 1 ? 'y' : 'ies'}.`);
  }

  const categoryIdBySlug = new Map<string, string>();
  const publishedAt = new Date('2026-01-01T00:00:00.000Z');

  for (const category of CATEGORIES) {
    const row = await prisma.helpCategory.upsert({
      where: { slug: category.slug },
      update: {
        titleTranslations: ru(category.title),
        descriptionTranslations: ru(category.description),
        icon: category.icon ?? null,
        sortOrder: category.sortOrder,
        isPublished: true,
      },
      create: {
        slug: category.slug,
        titleTranslations: ru(category.title),
        descriptionTranslations: ru(category.description),
        icon: category.icon ?? null,
        sortOrder: category.sortOrder,
        isPublished: true,
      },
    });
    categoryIdBySlug.set(category.slug, row.id);
  }

  let articleCount = 0;
  for (const article of ARTICLES) {
    const categoryId = categoryIdBySlug.get(article.categorySlug);
    if (!categoryId) {
      console.warn(`Skip article ${article.slug}: unknown category ${article.categorySlug}`);
      continue;
    }

    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {
        categoryId,
        titleTranslations: ru(article.title),
        excerptTranslations: ru(article.excerpt),
        contentTranslations: ru(article.content),
        status: HelpArticleStatus.PUBLISHED,
        sortOrder: article.sortOrder,
        isFeatured: article.isFeatured ?? false,
        isPopular: article.isPopular ?? false,
        isGettingStarted: article.isGettingStarted ?? false,
        publishedAt,
        authorUserId,
      },
      create: {
        slug: article.slug,
        categoryId,
        titleTranslations: ru(article.title),
        excerptTranslations: ru(article.excerpt),
        contentTranslations: ru(article.content),
        status: HelpArticleStatus.PUBLISHED,
        sortOrder: article.sortOrder,
        isFeatured: article.isFeatured ?? false,
        isPopular: article.isPopular ?? false,
        isGettingStarted: article.isGettingStarted ?? false,
        publishedAt,
        authorUserId,
      },
    });
    articleCount += 1;
  }

  console.log(
    `Help Center seed OK: ${CATEGORIES.length} categories, ${articleCount} articles (idempotent by slug).`,
  );
}

async function main() {
  await seedHelpCenter();
}

main()
  .catch((error) => {
    console.error('Help Center seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
