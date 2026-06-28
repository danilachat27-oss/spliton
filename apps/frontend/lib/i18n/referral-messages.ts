import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.referral.title": "Реферальная программа",
  "meta.referral.description":
    "Персональная ссылка и код Spliton, статистика приглашений, награды в USDT (TRC20) и история начислений.",

  "referral.screen.title": "Реферальная программа",
  "referral.screen.navAria": "Разделы реферальной программы",
  "referral.screen.documentSuffix": "Реферальная программа · Spliton",

  "referral.tab.program": "Программа",
  "referral.tab.rewards": "Награды",

  "referral.tabMeta.program.documentTitle": "Программа",
  "referral.tabMeta.program.surfaceTitle": "Реферальная программа",
  "referral.tabMeta.program.surfaceSubtitle":
    "Персональная ссылка и код, шаги начисления и сводка приглашений. Награды в USDT (TRC20) — во вкладке «Награды».",
  "referral.tabMeta.rewards.documentTitle": "Награды",
  "referral.tabMeta.rewards.surfaceTitle": "Награды по рефералам",
  "referral.tabMeta.rewards.surfaceSubtitle":
    "Сводка и история начислений из вашего реферального профиля Spliton.",

  "referral.program.hero.title": "Приглашайте друзей и получайте награды",
  "referral.program.hero.subtitle":
    "Персональная ссылка и код. Награды в USDT после квалифицирующих действий приглашённых.",
  "referral.program.signIn": "Войдите",
  "referral.program.or": "или",
  "referral.program.register": "зарегистрируйтесь",
  "referral.program.signInForLink": "для персональной ссылки.",
  "referral.program.loading": "Загрузка…",
  "referral.program.copy.link": "Ссылка",
  "referral.program.copy.code": "Код",
  "referral.program.copy.copy": "Копировать",
  "referral.program.copy.copied": "Скопировано",
  "referral.program.share": "Поделиться",
  "referral.program.shareCopied": "Ссылка скопирована",
  "referral.program.shareText": "Присоединяйся к Spliton — revenue share по музыкальным трекам.",

  "referral.summary.title": "Сводка",
  "referral.summary.invited": "Приглашено",
  "referral.summary.active": "Активные",
  "referral.summary.activeReferrals": "Активные рефералы",
  "referral.summary.pending": "В ожидании",
  "referral.summary.pendingRewards": "Награды в ожидании",
  "referral.summary.paid": "Выплачено",
  "referral.summary.earnedTotal": "Всего заработано",
  "referral.summary.empty": "Нет данных",

  "referral.invites.summary.title": "Сводка по приглашениям",
  "referral.invites.summary.subtitle":
    "Ориентиры по мок-данным; после API подставятся реальные значения.",

  "referral.applyCode.title": "У меня есть реферальный код",
  "referral.applyCode.hint":
    "Если вы зарегистрировались без ссылки, введите код один раз (окно атрибуции — 30 дней с регистрации).",
  "referral.applyCode.placeholder": "Код приглашения",
  "referral.applyCode.submit": "Применить",
  "referral.applyCode.submitting": "…",
  "referral.applyCode.success": "Код применён.",
  "referral.applyCode.error": "Не удалось применить код",

  "referral.invites.title": "Приглашённые",
  "referral.invites.csv": "CSV",
  "referral.invites.json": "JSON",
  "referral.invites.empty.title": "Пока нет приглашённых",
  "referral.invites.empty.text":
    "Отправьте реферальную ссылку или код — после регистрации пользователь появится в списке.",
  "referral.invites.empty.share": "Поделиться ссылкой",
  "referral.invites.table.date": "Дата",
  "referral.invites.table.email": "Email",
  "referral.invites.table.status": "Статус",

  "referral.faq.title": "FAQ",
  "referral.faq.sectionTitle": "Вопросы и ответы",
  "referral.faq.subtitle":
    "Коротко о правилах и статусах — без юридической замены оферты.",

  "referral.rewards.signIn": "Войдите",
  "referral.rewards.signInPrompt": "для просмотра наград.",
  "referral.rewards.loading": "Загрузка…",
  "referral.rewards.summary.title": "Сводка по наградам",
  "referral.rewards.summary.subtitle":
    "Агрегаты по текущему списку начислений в кабинете.",
  "referral.rewards.summary.total": "Всего",
  "referral.rewards.summary.totalRows": "Всего по строкам",
  "referral.rewards.summary.pending": "Ожидание",
  "referral.rewards.summary.available": "Доступно",
  "referral.rewards.summary.paid": "Выплачено",
  "referral.rewards.history.title": "История наград",
  "referral.rewards.history.subtitle":
    "Фильтр по статусу, маскированные идентификаторы приглашённых.",
  "referral.rewards.filter.all": "Все",
  "referral.rewards.filter.aria": "Фильтр по статусу награды",
  "referral.rewards.filter.pending": "В ожидании",
  "referral.rewards.filter.available": "Доступно",
  "referral.rewards.filter.paid": "Выплачено",
  "referral.rewards.filter.rejected": "Отклонено",
  "referral.rewards.filter.cancelled": "Отменено",
  "referral.rewards.empty": "Нет записей",
  "referral.rewards.empty.title": "Пока нет наград",
  "referral.rewards.empty.text":
    "Как только приглашённые пользователи выполнят условия программы, строки появятся здесь автоматически.",
  "referral.rewards.emptyFiltered.title": "Нет записей для выбранного статуса",
  "referral.rewards.emptyFiltered.text": "Смените фильтр или сбросьте на «Все».",
  "referral.rewards.emptyFiltered.showAll": "Показать все",
  "referral.rewards.table.date": "Дата",
  "referral.rewards.table.event": "Событие",
  "referral.rewards.table.invitee": "Приглашённый",
  "referral.rewards.table.type": "Тип",
  "referral.rewards.table.status": "Статус",
  "referral.rewards.table.amount": "Сумма",
  "referral.rewards.table.comment": "Комментарий",
  "referral.rewards.inviteFriends": "Пригласить друзей",

  "referral.status.pending": "В ожидании",
  "referral.status.available": "Доступно",
  "referral.status.paid": "Выплачено",
  "referral.status.rejected": "Отклонено",
  "referral.status.cancelled": "Отменено",

  "referral.event.EMAIL_VERIFIED": "Подтверждение email",
  "referral.event.FIRST_DEPOSIT": "Первое пополнение USDT",
  "referral.event.FIRST_PRIMARY_PURCHASE": "Первая покупка на первичном рынке",
  "referral.event.SECONDARY_TRADE_FEE": "Комиссия вторичного рынка",
  "referral.event.KYC_COMPLETED": "Пройден KYC",
  "referral.event.USER_REGISTERED": "Регистрация",

  "referral.how.kicker": "Процесс",
  "referral.how.title": "Как это работает",
  "referral.how.subtitle": "Четыре шага от приглашения до начисления награды в USDT.",
  "referral.how.chrome": "Spliton · Referrals",
  "referral.how.step1.title": "Пригласите друга",
  "referral.how.step1.text":
    "Отправьте ссылку или код — регистрация по ним связывает аккаунт с вашим профилем.",
  "referral.how.step2.title": "Друг создаёт аккаунт",
  "referral.how.step2.text": "После регистрации событие фиксируется в реферальной системе Spliton.",
  "referral.how.step3.title": "Квалифицирующие действия",
  "referral.how.step3.text":
    "Пополнение USDT (TRC20), покупка units или другие сценарии из актуальных правил.",
  "referral.how.step4.title": "Вы получаете награду",
  "referral.how.step4.text": "Начисления отображаются во вкладке «Награды» и учитываются в сводке.",
  "referral.how.toast.invite.title": "Ссылка готова",
  "referral.how.toast.invite.subtitle": "Поделитесь с другом",
  "referral.how.toast.register.title": "Регистрация",
  "referral.how.toast.register.subtitle": "Приглашённый связан с профилем",
  "referral.how.toast.qualify.title": "Проверка условий",
  "referral.how.toast.qualify.subtitle": "Квалифицирующие действия",
  "referral.how.toast.reward.title": "Награда начислена",
  "referral.how.toast.reward.subtitle": "+25,00 USDT · доступно",
  "referral.how.panel.program": "Реферальная программа",
  "referral.how.panel.inviteFriends": "Пригласите друзей",
  "referral.how.panel.link": "Ссылка",
  "referral.how.panel.code": "Код",
  "referral.how.panel.copyLink": "Копировать ссылку",
  "referral.how.panel.newUser": "Новый пользователь",
  "referral.how.panel.attribution": "Атрибуция по ссылке · ref=danila",
  "referral.how.panel.registered": "Зарегистрирован · 11 июня 2026",
  "referral.how.panel.linked": "Реферал привязан к вашему аккаунту",
  "referral.how.panel.qualify.title": "Квалификация реферала",
  "referral.how.panel.qualify.subtitle": "По правилам программы Spliton",
  "referral.how.panel.qualify.deposit": "Пополнение USDT (TRC20)",
  "referral.how.panel.qualify.buyUnits": "Покупка units",
  "referral.how.panel.qualify.threshold": "Минимальный порог",
  "referral.how.panel.inProgress": "В работе",
  "referral.how.panel.rewardsTab": "Вкладка «Награды»",
  "referral.how.panel.rewardsSubtitle": "Сводка и история начислений",
  "referral.how.panel.bonus": "Бонус за реферала",
  "referral.how.panel.statusAvailable": "Статус: доступно",
  "referral.how.panel.footer": "Награды в USDT после одобрения compliance",

  "referral.faq.faq-1.question": "Как работает реферальная программа Spliton?",
  "referral.faq.faq-1.answer":
    "Вы делитесь персональной ссылкой или кодом. Когда приглашённый пользователь регистрируется и выполняет условия программы (например, проходит верификацию или совершает квалифицирующую операцию), платформа фиксирует событие и начисляет награду согласно правилам на момент действия.",
  "referral.faq.faq-2.question": "Когда начисляется награда?",
  "referral.faq.faq-2.answer":
    "Начисление привязано к событиям в продукте: регистрация, первое пополнение баланса USDT (TRC20), покупка UNT и другие сценарии, указанные в актуальных условиях. До выполнения условий статус остаётся «В ожидании».",
  "referral.faq.faq-3.question": "Какие условия должны быть выполнены?",
  "referral.faq.faq-3.answer":
    "Условия зависят от типа награды: уникальный приглашённый, отсутствие нарушений правил, лимиты по времени и объёму операций. Подробности — в разделе «Комиссии и условия» и в уведомлениях по конкретной награде.",
  "referral.faq.faq-4.question": "Как проверить статус приглашения?",
  "referral.faq.faq-4.answer":
    "Во вкладке «Награды» отображаются строки по каждому событию: статус, сумма и комментарий. Общая статистика приглашений — на вкладке «Реферальная программа» в блоке сводки.",
  "referral.faq.faq-5.question": "Как получить награду на баланс?",
  "referral.faq.faq-5.answer":
    "Когда статус становится «Доступно», средства можно зачислить на внутренний баланс USDT по кнопке в продукте (после подключения выплат). Уже выплаченные начисления отмечены как «Выплачено».",
};

const EN: Record<string, string> = {
  "meta.referral.title": "Referral program",
  "meta.referral.description":
    "Personal Spliton link and code, invite stats, USDT (TRC20) rewards and accrual history.",

  "referral.screen.title": "Referral program",
  "referral.screen.navAria": "Referral program sections",
  "referral.screen.documentSuffix": "Referral program · Spliton",

  "referral.tab.program": "Program",
  "referral.tab.rewards": "Rewards",

  "referral.tabMeta.program.documentTitle": "Program",
  "referral.tabMeta.program.surfaceTitle": "Referral program",
  "referral.tabMeta.program.surfaceSubtitle":
    "Personal link and code, accrual steps and invite summary. USDT (TRC20) rewards are on the Rewards tab.",
  "referral.tabMeta.rewards.documentTitle": "Rewards",
  "referral.tabMeta.rewards.surfaceTitle": "Referral rewards",
  "referral.tabMeta.rewards.surfaceSubtitle":
    "Summary and accrual history from your Spliton referral profile.",

  "referral.program.hero.title": "Invite friends and earn rewards",
  "referral.program.hero.subtitle":
    "Personal link and code. USDT rewards after invitees complete qualifying actions.",
  "referral.program.signIn": "Sign in",
  "referral.program.or": "or",
  "referral.program.register": "register",
  "referral.program.signInForLink": "for your personal link.",
  "referral.program.loading": "Loading…",
  "referral.program.copy.link": "Link",
  "referral.program.copy.code": "Code",
  "referral.program.copy.copy": "Copy",
  "referral.program.copy.copied": "Copied",
  "referral.program.share": "Share",
  "referral.program.shareCopied": "Link copied",
  "referral.program.shareText": "Join Spliton — revenue share on music tracks.",

  "referral.summary.title": "Summary",
  "referral.summary.invited": "Invited",
  "referral.summary.active": "Active",
  "referral.summary.activeReferrals": "Active referrals",
  "referral.summary.pending": "Pending",
  "referral.summary.pendingRewards": "Pending rewards",
  "referral.summary.paid": "Paid out",
  "referral.summary.earnedTotal": "Total earned",
  "referral.summary.empty": "No data",

  "referral.invites.summary.title": "Invite summary",
  "referral.invites.summary.subtitle":
    "Mock data benchmarks; real values will appear after API integration.",

  "referral.applyCode.title": "I have a referral code",
  "referral.applyCode.hint":
    "If you registered without a link, enter the code once (attribution window — 30 days from registration).",
  "referral.applyCode.placeholder": "Invite code",
  "referral.applyCode.submit": "Apply",
  "referral.applyCode.submitting": "…",
  "referral.applyCode.success": "Code applied.",
  "referral.applyCode.error": "Could not apply code",

  "referral.invites.title": "Invitees",
  "referral.invites.csv": "CSV",
  "referral.invites.json": "JSON",
  "referral.invites.empty.title": "No invitees yet",
  "referral.invites.empty.text":
    "Send your referral link or code — after registration the user will appear in the list.",
  "referral.invites.empty.share": "Share link",
  "referral.invites.table.date": "Date",
  "referral.invites.table.email": "Email",
  "referral.invites.table.status": "Status",

  "referral.faq.title": "FAQ",
  "referral.faq.sectionTitle": "Questions and answers",
  "referral.faq.subtitle":
    "Brief notes on rules and statuses — not a legal substitute for the offer.",

  "referral.rewards.signIn": "Sign in",
  "referral.rewards.signInPrompt": "to view rewards.",
  "referral.rewards.loading": "Loading…",
  "referral.rewards.summary.title": "Rewards summary",
  "referral.rewards.summary.subtitle":
    "Aggregates from the current accrual list in your dashboard.",
  "referral.rewards.summary.total": "Total",
  "referral.rewards.summary.totalRows": "Total by rows",
  "referral.rewards.summary.pending": "Pending",
  "referral.rewards.summary.available": "Available",
  "referral.rewards.summary.paid": "Paid out",
  "referral.rewards.history.title": "Rewards history",
  "referral.rewards.history.subtitle":
    "Filter by status; invitee identifiers are masked.",
  "referral.rewards.filter.all": "All",
  "referral.rewards.filter.aria": "Filter by reward status",
  "referral.rewards.filter.pending": "Pending",
  "referral.rewards.filter.available": "Available",
  "referral.rewards.filter.paid": "Paid out",
  "referral.rewards.filter.rejected": "Rejected",
  "referral.rewards.filter.cancelled": "Cancelled",
  "referral.rewards.empty": "No records",
  "referral.rewards.empty.title": "No rewards yet",
  "referral.rewards.empty.text":
    "Once invitees meet program conditions, rows will appear here automatically.",
  "referral.rewards.emptyFiltered.title": "No records for the selected status",
  "referral.rewards.emptyFiltered.text": "Change the filter or reset to All.",
  "referral.rewards.emptyFiltered.showAll": "Show all",
  "referral.rewards.table.date": "Date",
  "referral.rewards.table.event": "Event",
  "referral.rewards.table.invitee": "Invitee",
  "referral.rewards.table.type": "Type",
  "referral.rewards.table.status": "Status",
  "referral.rewards.table.amount": "Amount",
  "referral.rewards.table.comment": "Comment",
  "referral.rewards.inviteFriends": "Invite friends",

  "referral.status.pending": "Pending",
  "referral.status.available": "Available",
  "referral.status.paid": "Paid out",
  "referral.status.rejected": "Rejected",
  "referral.status.cancelled": "Cancelled",

  "referral.event.EMAIL_VERIFIED": "Email verified",
  "referral.event.FIRST_DEPOSIT": "First USDT deposit",
  "referral.event.FIRST_PRIMARY_PURCHASE": "First primary market purchase",
  "referral.event.SECONDARY_TRADE_FEE": "Secondary market fee",
  "referral.event.KYC_COMPLETED": "KYC completed",
  "referral.event.USER_REGISTERED": "Registration",

  "referral.how.kicker": "Process",
  "referral.how.title": "How it works",
  "referral.how.subtitle": "Four steps from invite to USDT reward accrual.",
  "referral.how.chrome": "Spliton · Referrals",
  "referral.how.step1.title": "Invite a friend",
  "referral.how.step1.text":
    "Send a link or code — registration links the account to your profile.",
  "referral.how.step2.title": "Friend creates an account",
  "referral.how.step2.text": "After registration the event is recorded in Spliton's referral system.",
  "referral.how.step3.title": "Qualifying actions",
  "referral.how.step3.text":
    "USDT (TRC20) deposit, unit purchase or other scenarios from current rules.",
  "referral.how.step4.title": "You receive a reward",
  "referral.how.step4.text": "Accruals appear on the Rewards tab and in the summary.",
  "referral.how.toast.invite.title": "Link ready",
  "referral.how.toast.invite.subtitle": "Share with a friend",
  "referral.how.toast.register.title": "Registration",
  "referral.how.toast.register.subtitle": "Invitee linked to your profile",
  "referral.how.toast.qualify.title": "Checking conditions",
  "referral.how.toast.qualify.subtitle": "Qualifying actions",
  "referral.how.toast.reward.title": "Reward accrued",
  "referral.how.toast.reward.subtitle": "+25.00 USDT · available",
  "referral.how.panel.program": "Referral program",
  "referral.how.panel.inviteFriends": "Invite friends",
  "referral.how.panel.link": "Link",
  "referral.how.panel.code": "Code",
  "referral.how.panel.copyLink": "Copy link",
  "referral.how.panel.newUser": "New user",
  "referral.how.panel.attribution": "Link attribution · ref=danila",
  "referral.how.panel.registered": "Registered · 11 June 2026",
  "referral.how.panel.linked": "Referral linked to your account",
  "referral.how.panel.qualify.title": "Referral qualification",
  "referral.how.panel.qualify.subtitle": "Under Spliton program rules",
  "referral.how.panel.qualify.deposit": "USDT (TRC20) deposit",
  "referral.how.panel.qualify.buyUnits": "Unit purchase",
  "referral.how.panel.qualify.threshold": "Minimum threshold",
  "referral.how.panel.inProgress": "In progress",
  "referral.how.panel.rewardsTab": "Rewards tab",
  "referral.how.panel.rewardsSubtitle": "Summary and accrual history",
  "referral.how.panel.bonus": "Referral bonus",
  "referral.how.panel.statusAvailable": "Status: available",
  "referral.how.panel.footer": "USDT rewards after compliance approval",

  "referral.faq.faq-1.question": "How does the Spliton referral program work?",
  "referral.faq.faq-1.answer":
    "You share a personal link or code. When an invitee registers and meets program conditions (e.g. verification or a qualifying operation), the platform records the event and accrues a reward under the rules in effect.",
  "referral.faq.faq-2.question": "When is a reward accrued?",
  "referral.faq.faq-2.answer":
    "Accrual is tied to product events: registration, first USDT (TRC20) balance top-up, UNT purchase and other scenarios in current terms. Until conditions are met the status stays Pending.",
  "referral.faq.faq-3.question": "What conditions must be met?",
  "referral.faq.faq-3.answer":
    "Conditions depend on reward type: unique invitee, no rule violations, time and volume limits. Details are in Fees and terms and in notifications for each reward.",
  "referral.faq.faq-4.question": "How do I check invite status?",
  "referral.faq.faq-4.answer":
    "The Rewards tab shows a row per event: status, amount and note. Overall invite stats are on the Referral program tab in the summary block.",
  "referral.faq.faq-5.question": "How do I receive a reward to my balance?",
  "referral.faq.faq-5.answer":
    "When status becomes Available, funds can be credited to your internal USDT balance via the in-product button (after payouts are enabled). Paid accruals are marked Paid out.",
};

const ES: Record<string, string> = {
  "meta.referral.title": "Programa de referidos",
  "meta.referral.description":
    "Enlace y código personal Spliton, estadísticas de invitaciones, recompensas USDT (TRC20) e historial de devengos.",

  "referral.screen.title": "Programa de referidos",
  "referral.screen.navAria": "Secciones del programa de referidos",
  "referral.screen.documentSuffix": "Programa de referidos · Spliton",

  "referral.tab.program": "Programa",
  "referral.tab.rewards": "Recompensas",

  "referral.tabMeta.program.documentTitle": "Programa",
  "referral.tabMeta.program.surfaceTitle": "Programa de referidos",
  "referral.tabMeta.program.surfaceSubtitle":
    "Enlace y código personal, pasos de devengo y resumen de invitaciones. Recompensas USDT (TRC20) en la pestaña Recompensas.",
  "referral.tabMeta.rewards.documentTitle": "Recompensas",
  "referral.tabMeta.rewards.surfaceTitle": "Recompensas por referidos",
  "referral.tabMeta.rewards.surfaceSubtitle":
    "Resumen e historial de devengos de su perfil de referidos Spliton.",

  "referral.program.hero.title": "Invite amigos y obtenga recompensas",
  "referral.program.hero.subtitle":
    "Enlace y código personal. Recompensas USDT tras acciones cualificadas de los invitados.",
  "referral.program.signIn": "Inicie sesión",
  "referral.program.or": "o",
  "referral.program.register": "regístrese",
  "referral.program.signInForLink": "para su enlace personal.",
  "referral.program.loading": "Cargando…",
  "referral.program.copy.link": "Enlace",
  "referral.program.copy.code": "Código",
  "referral.program.copy.copy": "Copiar",
  "referral.program.copy.copied": "Copiado",
  "referral.program.share": "Compartir",
  "referral.program.shareCopied": "Enlace copiado",
  "referral.program.shareText": "Únete a Spliton — revenue share en pistas musicales.",

  "referral.summary.title": "Resumen",
  "referral.summary.invited": "Invitados",
  "referral.summary.active": "Activos",
  "referral.summary.activeReferrals": "Referidos activos",
  "referral.summary.pending": "Pendiente",
  "referral.summary.pendingRewards": "Recompensas pendientes",
  "referral.summary.paid": "Pagado",
  "referral.summary.earnedTotal": "Total ganado",
  "referral.summary.empty": "Sin datos",

  "referral.invites.summary.title": "Resumen de invitaciones",
  "referral.invites.summary.subtitle":
    "Referencias de datos mock; tras la API se mostrarán valores reales.",

  "referral.applyCode.title": "Tengo un código de referido",
  "referral.applyCode.hint":
    "Si se registró sin enlace, introduzca el código una vez (ventana de atribución — 30 días desde el registro).",
  "referral.applyCode.placeholder": "Código de invitación",
  "referral.applyCode.submit": "Aplicar",
  "referral.applyCode.submitting": "…",
  "referral.applyCode.success": "Código aplicado.",
  "referral.applyCode.error": "No se pudo aplicar el código",

  "referral.invites.title": "Invitados",
  "referral.invites.csv": "CSV",
  "referral.invites.json": "JSON",
  "referral.invites.empty.title": "Aún no hay invitados",
  "referral.invites.empty.text":
    "Envíe su enlace o código — tras el registro el usuario aparecerá en la lista.",
  "referral.invites.empty.share": "Compartir enlace",
  "referral.invites.table.date": "Fecha",
  "referral.invites.table.email": "Email",
  "referral.invites.table.status": "Estado",

  "referral.faq.title": "FAQ",
  "referral.faq.sectionTitle": "Preguntas y respuestas",
  "referral.faq.subtitle":
    "Breve sobre reglas y estados — no sustituye legalmente la oferta.",

  "referral.rewards.signIn": "Inicie sesión",
  "referral.rewards.signInPrompt": "para ver recompensas.",
  "referral.rewards.loading": "Cargando…",
  "referral.rewards.summary.title": "Resumen de recompensas",
  "referral.rewards.summary.subtitle":
    "Agregados de la lista actual de devengos en su panel.",
  "referral.rewards.summary.total": "Total",
  "referral.rewards.summary.totalRows": "Total por filas",
  "referral.rewards.summary.pending": "Pendiente",
  "referral.rewards.summary.available": "Disponible",
  "referral.rewards.summary.paid": "Pagado",
  "referral.rewards.history.title": "Historial de recompensas",
  "referral.rewards.history.subtitle":
    "Filtro por estado; identificadores de invitados enmascarados.",
  "referral.rewards.filter.all": "Todos",
  "referral.rewards.filter.aria": "Filtro por estado de recompensa",
  "referral.rewards.filter.pending": "Pendiente",
  "referral.rewards.filter.available": "Disponible",
  "referral.rewards.filter.paid": "Pagado",
  "referral.rewards.filter.rejected": "Rechazado",
  "referral.rewards.filter.cancelled": "Cancelado",
  "referral.rewards.empty": "Sin registros",
  "referral.rewards.empty.title": "Aún no hay recompensas",
  "referral.rewards.empty.text":
    "Cuando los invitados cumplan las condiciones del programa, las filas aparecerán aquí automáticamente.",
  "referral.rewards.emptyFiltered.title": "Sin registros para el estado seleccionado",
  "referral.rewards.emptyFiltered.text": "Cambie el filtro o restablezca a Todos.",
  "referral.rewards.emptyFiltered.showAll": "Mostrar todos",
  "referral.rewards.table.date": "Fecha",
  "referral.rewards.table.event": "Evento",
  "referral.rewards.table.invitee": "Invitado",
  "referral.rewards.table.type": "Tipo",
  "referral.rewards.table.status": "Estado",
  "referral.rewards.table.amount": "Importe",
  "referral.rewards.table.comment": "Comentario",
  "referral.rewards.inviteFriends": "Invitar amigos",

  "referral.status.pending": "Pendiente",
  "referral.status.available": "Disponible",
  "referral.status.paid": "Pagado",
  "referral.status.rejected": "Rechazado",
  "referral.status.cancelled": "Cancelado",

  "referral.event.EMAIL_VERIFIED": "Email verificado",
  "referral.event.FIRST_DEPOSIT": "Primer depósito USDT",
  "referral.event.FIRST_PRIMARY_PURCHASE": "Primera compra en mercado primario",
  "referral.event.SECONDARY_TRADE_FEE": "Comisión mercado secundario",
  "referral.event.KYC_COMPLETED": "KYC completado",
  "referral.event.USER_REGISTERED": "Registro",

  "referral.how.kicker": "Proceso",
  "referral.how.title": "Cómo funciona",
  "referral.how.subtitle": "Cuatro pasos desde la invitación hasta la recompensa USDT.",
  "referral.how.chrome": "Spliton · Referrals",
  "referral.how.step1.title": "Invite a un amigo",
  "referral.how.step1.text":
    "Envíe enlace o código — el registro vincula la cuenta a su perfil.",
  "referral.how.step2.title": "El amigo crea cuenta",
  "referral.how.step2.text": "Tras el registro el evento queda en el sistema de referidos Spliton.",
  "referral.how.step3.title": "Acciones cualificadas",
  "referral.how.step3.text":
    "Depósito USDT (TRC20), compra de units u otros escenarios de las reglas vigentes.",
  "referral.how.step4.title": "Usted recibe recompensa",
  "referral.how.step4.text": "Los devengos aparecen en Recompensas y en el resumen.",
  "referral.how.toast.invite.title": "Enlace listo",
  "referral.how.toast.invite.subtitle": "Comparta con un amigo",
  "referral.how.toast.register.title": "Registro",
  "referral.how.toast.register.subtitle": "Invitado vinculado al perfil",
  "referral.how.toast.qualify.title": "Comprobando condiciones",
  "referral.how.toast.qualify.subtitle": "Acciones cualificadas",
  "referral.how.toast.reward.title": "Recompensa acreditada",
  "referral.how.toast.reward.subtitle": "+25,00 USDT · disponible",
  "referral.how.panel.program": "Programa de referidos",
  "referral.how.panel.inviteFriends": "Invite amigos",
  "referral.how.panel.link": "Enlace",
  "referral.how.panel.code": "Código",
  "referral.how.panel.copyLink": "Copiar enlace",
  "referral.how.panel.newUser": "Nuevo usuario",
  "referral.how.panel.attribution": "Atribución por enlace · ref=danila",
  "referral.how.panel.registered": "Registrado · 11 junio 2026",
  "referral.how.panel.linked": "Referido vinculado a su cuenta",
  "referral.how.panel.qualify.title": "Cualificación del referido",
  "referral.how.panel.qualify.subtitle": "Según reglas del programa Spliton",
  "referral.how.panel.qualify.deposit": "Depósito USDT (TRC20)",
  "referral.how.panel.qualify.buyUnits": "Compra de units",
  "referral.how.panel.qualify.threshold": "Umbral mínimo",
  "referral.how.panel.inProgress": "En curso",
  "referral.how.panel.rewardsTab": "Pestaña Recompensas",
  "referral.how.panel.rewardsSubtitle": "Resumen e historial de devengos",
  "referral.how.panel.bonus": "Bono por referido",
  "referral.how.panel.statusAvailable": "Estado: disponible",
  "referral.how.panel.footer": "Recompensas USDT tras aprobación compliance",

  "referral.faq.faq-1.question": "¿Cómo funciona el programa de referidos Spliton?",
  "referral.faq.faq-1.answer":
    "Comparte enlace o código personal. Cuando el invitado se registra y cumple condiciones (verificación u operación cualificada), la plataforma registra el evento y acredita la recompensa según las reglas vigentes.",
  "referral.faq.faq-2.question": "¿Cuándo se acredita la recompensa?",
  "referral.faq.faq-2.answer":
    "El devengo depende de eventos: registro, primer depósito USDT (TRC20), compra UNT y otros escenarios en condiciones actuales. Hasta cumplir condiciones el estado es Pendiente.",
  "referral.faq.faq-3.question": "¿Qué condiciones deben cumplirse?",
  "referral.faq.faq-3.answer":
    "Dependen del tipo de recompensa: invitado único, sin violaciones, límites de tiempo y volumen. Detalles en Comisiones y condiciones y en avisos por recompensa.",
  "referral.faq.faq-4.question": "¿Cómo comprobar el estado de una invitación?",
  "referral.faq.faq-4.answer":
    "En Recompensas hay una fila por evento: estado, importe y comentario. Estadísticas generales en Programa de referidos, bloque resumen.",
  "referral.faq.faq-5.question": "¿Cómo recibir la recompensa en el saldo?",
  "referral.faq.faq-5.answer":
    "Cuando el estado es Disponible, los fondos pueden acreditarse al saldo USDT interno (tras activar pagos). Los ya pagados figuran como Pagado.",
};

const PT: Record<string, string> = {
  "meta.referral.title": "Programa de referência",
  "meta.referral.description":
    "Ligação e código Spliton pessoais, estatísticas de convites, recompensas USDT (TRC20) e histórico de accruals.",

  "referral.screen.title": "Programa de referência",
  "referral.screen.navAria": "Secções do programa de referência",
  "referral.screen.documentSuffix": "Programa de referência · Spliton",

  "referral.tab.program": "Programa",
  "referral.tab.rewards": "Recompensas",

  "referral.tabMeta.program.documentTitle": "Programa",
  "referral.tabMeta.program.surfaceTitle": "Programa de referência",
  "referral.tabMeta.program.surfaceSubtitle":
    "Ligação e código pessoais, passos de accrual e resumo de convites. Recompensas USDT (TRC20) no separador Recompensas.",
  "referral.tabMeta.rewards.documentTitle": "Recompensas",
  "referral.tabMeta.rewards.surfaceTitle": "Recompensas por referência",
  "referral.tabMeta.rewards.surfaceSubtitle":
    "Resumo e histórico de accruals do seu perfil de referência Spliton.",

  "referral.program.hero.title": "Convide amigos e ganhe recompensas",
  "referral.program.hero.subtitle":
    "Ligação e código pessoais. Recompensas USDT após ações qualificadas dos convidados.",
  "referral.program.signIn": "Inicie sessão",
  "referral.program.or": "ou",
  "referral.program.register": "registe-se",
  "referral.program.signInForLink": "para a sua ligação pessoal.",
  "referral.program.loading": "A carregar…",
  "referral.program.copy.link": "Ligação",
  "referral.program.copy.code": "Código",
  "referral.program.copy.copy": "Copiar",
  "referral.program.copy.copied": "Copiado",
  "referral.program.share": "Partilhar",
  "referral.program.shareCopied": "Ligação copiada",
  "referral.program.shareText": "Junta-te ao Spliton — revenue share em faixas musicais.",

  "referral.summary.title": "Resumo",
  "referral.summary.invited": "Convidados",
  "referral.summary.active": "Ativos",
  "referral.summary.activeReferrals": "Referências activas",
  "referral.summary.pending": "Pendente",
  "referral.summary.pendingRewards": "Recompensas pendentes",
  "referral.summary.paid": "Pago",
  "referral.summary.earnedTotal": "Total ganho",
  "referral.summary.empty": "Sem dados",

  "referral.invites.summary.title": "Resumo de convites",
  "referral.invites.summary.subtitle":
    "Referências de dados mock; após a API aparecerão valores reais.",

  "referral.applyCode.title": "Tenho um código de referência",
  "referral.applyCode.hint":
    "Se se registou sem ligação, introduza o código uma vez (janela de atribuição — 30 dias desde o registo).",
  "referral.applyCode.placeholder": "Código de convite",
  "referral.applyCode.submit": "Aplicar",
  "referral.applyCode.submitting": "…",
  "referral.applyCode.success": "Código aplicado.",
  "referral.applyCode.error": "Não foi possível aplicar o código",

  "referral.invites.title": "Convidados",
  "referral.invites.csv": "CSV",
  "referral.invites.json": "JSON",
  "referral.invites.empty.title": "Ainda não há convidados",
  "referral.invites.empty.text":
    "Envie a ligação ou código — após o registo o utilizador aparece na lista.",
  "referral.invites.empty.share": "Partilhar ligação",
  "referral.invites.table.date": "Data",
  "referral.invites.table.email": "Email",
  "referral.invites.table.status": "Estado",

  "referral.faq.title": "FAQ",
  "referral.faq.sectionTitle": "Perguntas e respostas",
  "referral.faq.subtitle":
    "Breve sobre regras e estados — não substitui legalmente a oferta.",

  "referral.rewards.signIn": "Inicie sessão",
  "referral.rewards.signInPrompt": "para ver recompensas.",
  "referral.rewards.loading": "A carregar…",
  "referral.rewards.summary.title": "Resumo de recompensas",
  "referral.rewards.summary.subtitle":
    "Agregados da lista actual de accruals no seu painel.",
  "referral.rewards.summary.total": "Total",
  "referral.rewards.summary.totalRows": "Total por linhas",
  "referral.rewards.summary.pending": "Pendente",
  "referral.rewards.summary.available": "Disponível",
  "referral.rewards.summary.paid": "Pago",
  "referral.rewards.history.title": "Histórico de recompensas",
  "referral.rewards.history.subtitle":
    "Filtro por estado; identificadores de convidados mascarados.",
  "referral.rewards.filter.all": "Todos",
  "referral.rewards.filter.aria": "Filtro por estado de recompensa",
  "referral.rewards.filter.pending": "Pendente",
  "referral.rewards.filter.available": "Disponível",
  "referral.rewards.filter.paid": "Pago",
  "referral.rewards.filter.rejected": "Rejeitado",
  "referral.rewards.filter.cancelled": "Cancelado",
  "referral.rewards.empty": "Sem registos",
  "referral.rewards.empty.title": "Ainda não há recompensas",
  "referral.rewards.empty.text":
    "Quando os convidados cumprirem as condições do programa, as linhas aparecerão aqui automaticamente.",
  "referral.rewards.emptyFiltered.title": "Sem registos para o estado seleccionado",
  "referral.rewards.emptyFiltered.text": "Altere o filtro ou repor para Todos.",
  "referral.rewards.emptyFiltered.showAll": "Mostrar todos",
  "referral.rewards.table.date": "Data",
  "referral.rewards.table.event": "Evento",
  "referral.rewards.table.invitee": "Convidado",
  "referral.rewards.table.type": "Tipo",
  "referral.rewards.table.status": "Estado",
  "referral.rewards.table.amount": "Montante",
  "referral.rewards.table.comment": "Comentário",
  "referral.rewards.inviteFriends": "Convidar amigos",

  "referral.status.pending": "Pendente",
  "referral.status.available": "Disponível",
  "referral.status.paid": "Pago",
  "referral.status.rejected": "Rejeitado",
  "referral.status.cancelled": "Cancelado",

  "referral.event.EMAIL_VERIFIED": "Email confirmado",
  "referral.event.FIRST_DEPOSIT": "Primeiro depósito USDT",
  "referral.event.FIRST_PRIMARY_PURCHASE": "Primeira compra no mercado primário",
  "referral.event.SECONDARY_TRADE_FEE": "Comissão mercado secundário",
  "referral.event.KYC_COMPLETED": "KYC concluído",
  "referral.event.USER_REGISTERED": "Registo",

  "referral.how.kicker": "Processo",
  "referral.how.title": "Como funciona",
  "referral.how.subtitle": "Quatro passos do convite ao accrual de recompensa USDT.",
  "referral.how.chrome": "Spliton · Referrals",
  "referral.how.step1.title": "Convide um amigo",
  "referral.how.step1.text":
    "Envie ligação ou código — o registo associa a conta ao seu perfil.",
  "referral.how.step2.title": "O amigo cria conta",
  "referral.how.step2.text": "Após o registo o evento fica no sistema de referência Spliton.",
  "referral.how.step3.title": "Ações qualificadas",
  "referral.how.step3.text":
    "Depósito USDT (TRC20), compra de units ou outros cenários das regras atuais.",
  "referral.how.step4.title": "Recebe recompensa",
  "referral.how.step4.text": "Os accruals aparecem em Recompensas e no resumo.",
  "referral.how.toast.invite.title": "Ligação pronta",
  "referral.how.toast.invite.subtitle": "Partilhe com um amigo",
  "referral.how.toast.register.title": "Registo",
  "referral.how.toast.register.subtitle": "Convidado ligado ao perfil",
  "referral.how.toast.qualify.title": "A verificar condições",
  "referral.how.toast.qualify.subtitle": "Ações qualificadas",
  "referral.how.toast.reward.title": "Recompensa creditada",
  "referral.how.toast.reward.subtitle": "+25,00 USDT · disponível",
  "referral.how.panel.program": "Programa de referência",
  "referral.how.panel.inviteFriends": "Convide amigos",
  "referral.how.panel.link": "Ligação",
  "referral.how.panel.code": "Código",
  "referral.how.panel.copyLink": "Copiar ligação",
  "referral.how.panel.newUser": "Novo utilizador",
  "referral.how.panel.attribution": "Atribuição por ligação · ref=danila",
  "referral.how.panel.registered": "Registado · 11 junho 2026",
  "referral.how.panel.linked": "Referência ligada à sua conta",
  "referral.how.panel.qualify.title": "Qualificação do referido",
  "referral.how.panel.qualify.subtitle": "Pelas regras do programa Spliton",
  "referral.how.panel.qualify.deposit": "Depósito USDT (TRC20)",
  "referral.how.panel.qualify.buyUnits": "Compra de units",
  "referral.how.panel.qualify.threshold": "Limiar mínimo",
  "referral.how.panel.inProgress": "Em curso",
  "referral.how.panel.rewardsTab": "Separador Recompensas",
  "referral.how.panel.rewardsSubtitle": "Resumo e histórico de accruals",
  "referral.how.panel.bonus": "Bónus por referido",
  "referral.how.panel.statusAvailable": "Estado: disponível",
  "referral.how.panel.footer": "Recompensas USDT após aprovação compliance",

  "referral.faq.faq-1.question": "Como funciona o programa de referência Spliton?",
  "referral.faq.faq-1.answer":
    "Partilha ligação ou código pessoal. Quando o convidado se regista e cumpre condições (verificação ou operação qualificada), a plataforma regista o evento e credita a recompensa pelas regras em vigor.",
  "referral.faq.faq-2.question": "Quando é creditada a recompensa?",
  "referral.faq.faq-2.answer":
    "O accrual depende de eventos: registo, primeiro depósito USDT (TRC20), compra UNT e outros cenários nas condições atuais. Até cumprir condições o estado é Pendente.",
  "referral.faq.faq-3.question": "Que condições devem ser cumpridas?",
  "referral.faq.faq-3.answer":
    "Dependem do tipo de recompensa: convidado único, sem violações, limites de tempo e volume. Detalhes em Comissões e condições e em avisos por recompensa.",
  "referral.faq.faq-4.question": "Como verificar o estado do convite?",
  "referral.faq.faq-4.answer":
    "Em Recompensas há uma linha por evento: estado, montante e comentário. Estatísticas gerais no Programa de referência, bloco resumo.",
  "referral.faq.faq-5.question": "Como receber a recompensa no saldo?",
  "referral.faq.faq-5.answer":
    "Quando o estado é Disponível, os fundos podem creditar-se ao saldo USDT interno (após ativar pagamentos). Os já pagos figuram como Pago.",
};

export const REFERRAL_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};

import { localeMessage } from "./normalize-locale";

export function referralStatusLabel(status: string, locale: AppLocale): string {
  const key = `referral.status.${status}`;
  return localeMessage(REFERRAL_MESSAGES, locale, key, status);
}

export function referralEventLabelI18n(eventType: string, locale: AppLocale): string {
  const key = `referral.event.${eventType}`;
  return localeMessage(REFERRAL_MESSAGES, locale, key, eventType);
}
