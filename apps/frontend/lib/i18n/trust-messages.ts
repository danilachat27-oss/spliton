import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.trust.title": "Центр доверия",
  "meta.trust.description":
    "Прозрачность Spliton: как устроены операции, риски, безопасность аккаунта и ссылки на документы.",

  "trust.hero.eyebrow": "Прозрачность · USDT (TRC20)",
  "trust.hero.title": "Центр доверия Spliton",
  "trust.hero.subtitle":
    "Как устроены операции, контроли treasury и compliance, публичный статус и документы — в одном месте.",
  "trust.hero.systemStatus": "Статус системы",
  "trust.hero.support": "Поддержка",

  "trust.metrics.aria": "Ключевые показатели",
  "trust.metrics.heading.title": "На чём держится доверие",
  "trust.metrics.heading.subtitle":
    "Четыре простых ответа для обычного пользователя: деньги, история операций, вывод и честный статус сервисов.",
  "trust.metrics.m1.label": "В какой валюте считаем",
  "trust.metrics.m1.value": "USDT (TRC20)",
  "trust.metrics.m1.hint":
    "Баланс, покупки UNT и выводы — в USDT по сети TRC20. В кабинете видно сумму до подтверждения каждой операции.",
  "trust.metrics.m2.label": "Где смотреть операции",
  "trust.metrics.m2.value": "История в кабинете",
  "trust.metrics.m2.hint":
    "Пополнения, сделки и выводы не «пропадают» — каждая операция с датой, суммой и статусом в ленте и выписках.",
  "trust.metrics.m3.label": "Как устроен вывод",
  "trust.metrics.m3.value": "Заявка → проверка → отправка",
  "trust.metrics.m3.hint":
    "Вывод на внешний кошелёк проходит проверку лимитов и правил. До отправки видно, сколько USDT спишется и сколько дойдёт до адреса.",
  "trust.metrics.m4.label": "Если что-то сломалось",
  "trust.metrics.m4.value": "Публичный статус",
  "trust.metrics.m4.hint":
    "Сбои, техработы и восстановление сервисов публикуем открыто — не нужно гадать, работает ли вывод или торги.",
  "trust.metrics.m4.hrefLabel": "Открыть статус",

  "trust.pillars.title": "Как Spliton обеспечивает прозрачность",
  "trust.pillars.subtitle": "Публичные разделы, контроли операций и документы — до входа в сделку.",

  "trust.section.howItWorks.title": "Как работает Spliton",
  "trust.section.howItWorks.body":
    "Биржа долей музыкальных активов: покупка юнитов на первичном рынке и торговля на вторичном. Баланс — в USDT (TRC20).",
  "trust.section.howItWorks.detail":
    "Перед сделкой доступны параметры релиза, data room и условия участия. Вторичный рынок даёт ликвидность между держателями долей.",

  "trust.section.ledger.title": "Защита средств и ledger",
  "trust.section.ledger.body":
    "Каждое движение средств фиксируется во внутреннем ledger с двойной записью по счетам пользователя и платформы.",
  "trust.section.ledger.detail":
    "Пополнения и выводы проходят операторский контроль. Действия staff фиксируются в журнале аудита, выводы — с лимитами treasury.",

  "trust.section.systemStatus.title": "Статус системы",
  "trust.section.systemStatus.body":
    "Инциденты, деградации и плановые работы публикуются на отдельной странице — торги, выплаты и кабинет.",
  "trust.section.systemStatus.detail":
    "При сбоях видны ETA восстановления и история событий. При необходимости — переход в поддержку.",
  "trust.section.systemStatus.hrefLabel": "Открыть статус",

  "trust.section.support.title": "Поддержка и споры",
  "trust.section.support.body":
    "Финансовые и торговые кейсы — через почту, кабинет или центр споров с фиксацией обращения.",
  "trust.section.support.detail":
    "Среднее время ответа по почте — до 24 часов. Спорные операции можно передать в центр споров.",

  "trust.section.risks.title": "Риски и раскрытия",
  "trust.section.risks.body":
    "Доли музыкальных активов связаны с рыночным, операционным и правовым риском. Доходность не гарантируется.",
  "trust.section.risks.detail":
    "Перед входом в сделку изучите документы релиза. Материалы центра доверия не являются инвестиционной рекомендацией.",

  "trust.section.fees.title": "Комиссии и документы",
  "trust.section.fees.body":
    "Тарифы, квитанции, выписки и правовой центр — в кабинете и публичных разделах без скрытых удержаний.",
  "trust.section.fees.detail":
    "Комиссии с примерами расчёта, история операций по счёту и принятые согласия по политикам платформы.",

  "trust.link.support": "Поддержка",
  "trust.link.disputes": "Центр споров",
  "trust.link.fees": "Комиссии",
  "trust.link.statements": "Выписки",
  "trust.link.documents": "Документы",
  "trust.link.more": "Подробнее",

  "trust.controls.title": "Что стоит за безопасностью",
  "trust.controls.subtitle": "Не технические термины, а то, что это значит для ваших денег и выводов.",
  "trust.controls.withdrawLimits.title": "Лимиты на вывод",
  "trust.controls.withdrawLimits.text":
    "Заявки проходят очередь и проверку суммы — чтобы защитить ваш баланс и платформу.",
  "trust.controls.operationReview.title": "Проверка операций",
  "trust.controls.operationReview.text":
    "Подозрительные или нестандартные переводы могут быть приостановлены до уточнения.",
  "trust.controls.auditLog.title": "Журнал действий",
  "trust.controls.auditLog.text":
    "Важные действия сотрудников и изменения настроек фиксируются для разбора спорных случаев.",
  "trust.controls.kyc.title": "Верификация (KYC)",
  "trust.controls.kyc.text":
    "Подтверждение личности нужно для вывода и при работе с повышенными лимитами.",

  "trust.verify.title": "Что проверить в кабинете",
  "trust.verify.subtitle": "Выписки, статусы заявок и документы релиза — в одном месте.",

  "trust.cta.title": "Нужны детали по операции?",
  "trust.cta.subtitle": "Статус сервисов, тарифы и поддержка — в открытом доступе.",
  "trust.cta.systemStatus": "Статус системы",
  "trust.cta.support": "Поддержка",
  "trust.cta.fees": "Комиссии",

  "trust.disclaimer":
    "Материалы носят информационный характер и не являются инвестиционной, налоговой или юридической рекомендацией. Условия сделок — в документах релиза и политиках Spliton.",

  "trust.timeline.prev": "Предыдущий этап",
  "trust.timeline.next": "Следующий этап",

  "trust.scene.cabinetVerify.spinner.history": "Загрузка истории…",
  "trust.scene.cabinetVerify.spinner.statements": "Формирование выписки…",
  "trust.scene.cabinetVerify.spinner.withdrawals": "Проверка treasury…",
  "trust.scene.cabinetVerify.spinner.documents": "Открытие data room…",

  "trust.scene.operationFlow.toast.deposit.title": "Входящий перевод",
  "trust.scene.operationFlow.toast.deposit.subtitle": "+500 USDT · TRC20 подтверждён",
  "trust.scene.operationFlow.toast.ledger.title": "Запись в ledger",
  "trust.scene.operationFlow.toast.ledger.subtitle": "deposit · +500 USDT · tx 0x8f…c21",
  "trust.scene.operationFlow.toast.trade.title": "Сделка исполнена",
  "trust.scene.operationFlow.toast.trade.subtitle": "50 UNT · Relic Waves · 681,80 USDT",
  "trust.scene.operationFlow.toast.accrual.title": "Начисление дохода",
  "trust.scene.operationFlow.toast.accrual.subtitle": "Relic Waves · Q2 · на ваш кошелёк",
  "trust.scene.operationFlow.toast.withdraw.title": "Вывод одобрен",
  "trust.scene.operationFlow.toast.withdraw.subtitle": "200 USDT · очередь treasury",
  "trust.scene.operationFlow.creditedToBalance": "Зачислено на баланс",

  "trust.scene.updates.chrome": "Spliton · Обновления 2026",
  "trust.scene.updates.toast.ledger.title": "Ledger запущен",
  "trust.scene.updates.toast.ledger.subtitle": "Журнал операций · янв. 2026",
  "trust.scene.updates.toast.status.title": "Статус опубликован",
  "trust.scene.updates.toast.status.subtitle": "Все сервисы · operational",
  "trust.scene.updates.toast.disputes.title": "Обращение принято",
  "trust.scene.updates.toast.disputes.subtitle": "Тикет #DS-2026-041",
  "trust.scene.updates.toast.trust.title": "Центр доверия",
  "trust.scene.updates.toast.trust.subtitle": "Публичный раздел · июн. 2026",
};

const EN: Record<string, string> = {
  "meta.trust.title": "Trust center",
  "meta.trust.description":
    "Spliton transparency: how operations work, risks, account security, and links to documents.",

  "trust.hero.eyebrow": "Transparency · USDT (TRC20)",
  "trust.hero.title": "Spliton trust center",
  "trust.hero.subtitle":
    "How operations work, treasury and compliance controls, public status, and documents — in one place.",
  "trust.hero.systemStatus": "System status",
  "trust.hero.support": "Support",

  "trust.metrics.aria": "Key metrics",
  "trust.metrics.heading.title": "What trust is built on",
  "trust.metrics.heading.subtitle":
    "Four simple answers for everyday users: money, transaction history, withdrawal, and honest service status.",
  "trust.metrics.m1.label": "What currency we use",
  "trust.metrics.m1.value": "USDT (TRC20)",
  "trust.metrics.m1.hint":
    "Balance, UNT purchases, and withdrawals — in USDT on TRC20. Your account shows the amount before confirming each operation.",
  "trust.metrics.m2.label": "Where to view operations",
  "trust.metrics.m2.value": "History in your account",
  "trust.metrics.m2.hint":
    "Deposits, trades, and withdrawals do not «disappear» — each operation has date, amount, and status in the feed and statements.",
  "trust.metrics.m3.label": "How withdrawal works",
  "trust.metrics.m3.value": "Request → review → send",
  "trust.metrics.m3.hint":
    "Withdrawal to an external wallet goes through limit and rule checks. Before sending, you see how much USDT is debited and how much reaches the address.",
  "trust.metrics.m4.label": "If something breaks",
  "trust.metrics.m4.value": "Public status",
  "trust.metrics.m4.hint":
    "Outages, maintenance, and service recovery are published openly — no guessing whether withdrawal or trading works.",
  "trust.metrics.m4.hrefLabel": "Open status",

  "trust.pillars.title": "How Spliton ensures transparency",
  "trust.pillars.subtitle": "Public sections, operation controls, and documents — before entering a deal.",

  "trust.section.howItWorks.title": "How Spliton works",
  "trust.section.howItWorks.body":
    "Music asset share exchange: buy units on the primary market and trade on the secondary. Balance — in USDT (TRC20).",
  "trust.section.howItWorks.detail":
    "Before a deal you can review release parameters, data room, and participation terms. Secondary market provides liquidity between share holders.",

  "trust.section.ledger.title": "Fund protection and ledger",
  "trust.section.ledger.body":
    "Every fund movement is recorded in an internal double-entry ledger across user and platform accounts.",
  "trust.section.ledger.detail":
    "Deposits and withdrawals go through operator control. Staff actions are logged in audit journal; withdrawals have treasury limits.",

  "trust.section.systemStatus.title": "System status",
  "trust.section.systemStatus.body":
    "Incidents, degradations, and scheduled maintenance are published on a separate page — trading, payouts, and account.",
  "trust.section.systemStatus.detail":
    "During outages you see recovery ETA and event history. Support is available when needed.",
  "trust.section.systemStatus.hrefLabel": "Open status",

  "trust.section.support.title": "Support and disputes",
  "trust.section.support.body":
    "Financial and trading cases — via email, account, or dispute center with ticket tracking.",
  "trust.section.support.detail":
    "Average email response time — up to 24 hours. Disputed operations can be escalated to the dispute center.",

  "trust.section.risks.title": "Risks and disclosures",
  "trust.section.risks.body":
    "Music asset shares involve market, operational, and legal risk. Returns are not guaranteed.",
  "trust.section.risks.detail":
    "Review release documents before entering a deal. Trust center materials are not investment advice.",

  "trust.section.fees.title": "Fees and documents",
  "trust.section.fees.body":
    "Rates, receipts, statements, and legal center — in your account and public sections without hidden deductions.",
  "trust.section.fees.detail":
    "Fees with calculation examples, account transaction history, and accepted platform policy consents.",

  "trust.link.support": "Support",
  "trust.link.disputes": "Dispute center",
  "trust.link.fees": "Fees",
  "trust.link.statements": "Statements",
  "trust.link.documents": "Documents",
  "trust.link.more": "Learn more",

  "trust.controls.title": "What security means in practice",
  "trust.controls.subtitle": "Not technical jargon — what it means for your money and withdrawals.",
  "trust.controls.withdrawLimits.title": "Withdrawal limits",
  "trust.controls.withdrawLimits.text":
    "Requests go through queue and amount review — to protect your balance and the platform.",
  "trust.controls.operationReview.title": "Operation review",
  "trust.controls.operationReview.text":
    "Suspicious or non-standard transfers may be paused until clarified.",
  "trust.controls.auditLog.title": "Action log",
  "trust.controls.auditLog.text":
    "Important staff actions and setting changes are recorded for dispute review.",
  "trust.controls.kyc.title": "Verification (KYC)",
  "trust.controls.kyc.text":
    "Identity confirmation is required for withdrawal and higher limits.",

  "trust.verify.title": "What to check in your account",
  "trust.verify.subtitle": "Statements, request statuses, and release documents — in one place.",

  "trust.cta.title": "Need details on an operation?",
  "trust.cta.subtitle": "Service status, rates, and support — openly available.",
  "trust.cta.systemStatus": "System status",
  "trust.cta.support": "Support",
  "trust.cta.fees": "Fees",

  "trust.disclaimer":
    "Materials are informational and are not investment, tax, or legal advice. Deal terms — in release documents and Spliton policies.",

  "trust.timeline.prev": "Previous step",
  "trust.timeline.next": "Next step",

  "trust.scene.cabinetVerify.spinner.history": "Loading history…",
  "trust.scene.cabinetVerify.spinner.statements": "Generating statement…",
  "trust.scene.cabinetVerify.spinner.withdrawals": "Treasury review…",
  "trust.scene.cabinetVerify.spinner.documents": "Opening data room…",

  "trust.scene.operationFlow.toast.deposit.title": "Incoming transfer",
  "trust.scene.operationFlow.toast.deposit.subtitle": "+500 USDT · TRC20 confirmed",
  "trust.scene.operationFlow.toast.ledger.title": "Ledger entry",
  "trust.scene.operationFlow.toast.ledger.subtitle": "deposit · +500 USDT · tx 0x8f…c21",
  "trust.scene.operationFlow.toast.trade.title": "Trade executed",
  "trust.scene.operationFlow.toast.trade.subtitle": "50 UNT · Relic Waves · 681.80 USDT",
  "trust.scene.operationFlow.toast.accrual.title": "Income accrual",
  "trust.scene.operationFlow.toast.accrual.subtitle": "Relic Waves · Q2 · to your wallet",
  "trust.scene.operationFlow.toast.withdraw.title": "Withdrawal approved",
  "trust.scene.operationFlow.toast.withdraw.subtitle": "200 USDT · treasury queue",
  "trust.scene.operationFlow.creditedToBalance": "Credited to balance",

  "trust.scene.updates.chrome": "Spliton · 2026 updates",
  "trust.scene.updates.toast.ledger.title": "Ledger launched",
  "trust.scene.updates.toast.ledger.subtitle": "Operations journal · Jan 2026",
  "trust.scene.updates.toast.status.title": "Status published",
  "trust.scene.updates.toast.status.subtitle": "All services · operational",
  "trust.scene.updates.toast.disputes.title": "Case accepted",
  "trust.scene.updates.toast.disputes.subtitle": "Ticket #DS-2026-041",
  "trust.scene.updates.toast.trust.title": "Trust center",
  "trust.scene.updates.toast.trust.subtitle": "Public section · Jun 2026",
};

const ES: Record<string, string> = {
  "meta.trust.title": "Centro de confianza",
  "meta.trust.description":
    "Transparencia Spliton: cómo funcionan las operaciones, riesgos, seguridad de la cuenta y enlaces a documentos.",

  "trust.hero.eyebrow": "Transparencia · USDT (TRC20)",
  "trust.hero.title": "Centro de confianza Spliton",
  "trust.hero.subtitle":
    "Cómo funcionan las operaciones, controles de treasury y compliance, estado público y documentos — en un solo lugar.",
  "trust.hero.systemStatus": "Estado del sistema",
  "trust.hero.support": "Soporte",

  "trust.metrics.aria": "Indicadores clave",
  "trust.metrics.heading.title": "En qué se basa la confianza",
  "trust.metrics.heading.subtitle":
    "Cuatro respuestas simples para el usuario: dinero, historial de operaciones, retiro y estado honesto de servicios.",
  "trust.metrics.m1.label": "En qué moneda operamos",
  "trust.metrics.m1.value": "USDT (TRC20)",
  "trust.metrics.m1.hint":
    "Balance, compras de UNT y retiros — en USDT por red TRC20. En la cuenta se ve el importe antes de confirmar cada operación.",
  "trust.metrics.m2.label": "Dónde ver operaciones",
  "trust.metrics.m2.value": "Historial en la cuenta",
  "trust.metrics.m2.hint":
    "Depósitos, operaciones y retiros no «desaparecen» — cada operación con fecha, importe y estado en el feed y extractos.",
  "trust.metrics.m3.label": "Cómo funciona el retiro",
  "trust.metrics.m3.value": "Solicitud → revisión → envío",
  "trust.metrics.m3.hint":
    "El retiro a monedero externo pasa revisión de límites y reglas. Antes del envío se ve cuánto USDT se debita y cuánto llega a la dirección.",
  "trust.metrics.m4.label": "Si algo falla",
  "trust.metrics.m4.value": "Estado público",
  "trust.metrics.m4.hint":
    "Caídas, mantenimiento y recuperación de servicios se publican abiertamente — sin adivinar si funciona retiro o trading.",
  "trust.metrics.m4.hrefLabel": "Abrir estado",

  "trust.pillars.title": "Cómo Spliton garantiza transparencia",
  "trust.pillars.subtitle": "Secciones públicas, controles de operaciones y documentos — antes de entrar en una operación.",

  "trust.section.howItWorks.title": "Cómo funciona Spliton",
  "trust.section.howItWorks.body":
    "Bolsa de participaciones en activos musicales: compra de unidades en mercado primario y trading en secundario. Balance — en USDT (TRC20).",
  "trust.section.howItWorks.detail":
    "Antes de la operación hay parámetros del release, data room y condiciones de participación. El mercado secundario da liquidez entre titulares.",

  "trust.section.ledger.title": "Protección de fondos y ledger",
  "trust.section.ledger.body":
    "Cada movimiento de fondos se registra en ledger interno con doble entrada en cuentas de usuario y plataforma.",
  "trust.section.ledger.detail":
    "Depósitos y retiros pasan control operativo. Acciones del staff se registran en auditoría; retiros — con límites de treasury.",

  "trust.section.systemStatus.title": "Estado del sistema",
  "trust.section.systemStatus.body":
    "Incidentes, degradaciones y mantenimiento planificado se publican en página aparte — trading, pagos y cuenta.",
  "trust.section.systemStatus.detail":
    "En fallos se ven ETA de recuperación e historial de eventos. Soporte disponible cuando haga falta.",
  "trust.section.systemStatus.hrefLabel": "Abrir estado",

  "trust.section.support.title": "Soporte y disputas",
  "trust.section.support.body":
    "Casos financieros y de trading — por correo, cuenta o centro de disputas con registro del ticket.",
  "trust.section.support.detail":
    "Tiempo medio de respuesta por correo — hasta 24 horas. Operaciones disputadas pueden ir al centro de disputas.",

  "trust.section.risks.title": "Riesgos y divulgaciones",
  "trust.section.risks.body":
    "Participaciones en activos musicales implican riesgo de mercado, operativo y legal. La rentabilidad no está garantizada.",
  "trust.section.risks.detail":
    "Revise documentos del release antes de entrar. Los materiales del centro de confianza no son recomendación de inversión.",

  "trust.section.fees.title": "Comisiones y documentos",
  "trust.section.fees.body":
    "Tarifas, recibos, extractos y centro legal — en la cuenta y secciones públicas sin retenciones ocultas.",
  "trust.section.fees.detail":
    "Comisiones con ejemplos de cálculo, historial de operaciones de la cuenta y consentimientos de políticas aceptados.",

  "trust.link.support": "Soporte",
  "trust.link.disputes": "Centro de disputas",
  "trust.link.fees": "Comisiones",
  "trust.link.statements": "Extractos",
  "trust.link.documents": "Documentos",
  "trust.link.more": "Más información",

  "trust.controls.title": "Qué hay detrás de la seguridad",
  "trust.controls.subtitle": "No jerga técnica — qué significa para su dinero y retiros.",
  "trust.controls.withdrawLimits.title": "Límites de retiro",
  "trust.controls.withdrawLimits.text":
    "Las solicitudes pasan cola y revisión de importe — para proteger su balance y la plataforma.",
  "trust.controls.operationReview.title": "Revisión de operaciones",
  "trust.controls.operationReview.text":
    "Transferencias sospechosas o no estándar pueden pausarse hasta aclarar.",
  "trust.controls.auditLog.title": "Registro de acciones",
  "trust.controls.auditLog.text":
    "Acciones importantes del personal y cambios de ajustes se registran para revisar disputas.",
  "trust.controls.kyc.title": "Verificación (KYC)",
  "trust.controls.kyc.text":
    "La confirmación de identidad es necesaria para retiro y límites elevados.",

  "trust.verify.title": "Qué revisar en la cuenta",
  "trust.verify.subtitle": "Extractos, estados de solicitudes y documentos del release — en un solo lugar.",

  "trust.cta.title": "¿Necesita detalles de una operación?",
  "trust.cta.subtitle": "Estado de servicios, tarifas y soporte — acceso abierto.",
  "trust.cta.systemStatus": "Estado del sistema",
  "trust.cta.support": "Soporte",
  "trust.cta.fees": "Comisiones",

  "trust.disclaimer":
    "Los materiales son informativos y no constituyen asesoramiento de inversión, fiscal o legal. Condiciones de operaciones — en documentos del release y políticas Spliton.",

  "trust.timeline.prev": "Etapa anterior",
  "trust.timeline.next": "Etapa siguiente",

  "trust.scene.cabinetVerify.spinner.history": "Cargando historial…",
  "trust.scene.cabinetVerify.spinner.statements": "Generando extracto…",
  "trust.scene.cabinetVerify.spinner.withdrawals": "Revisión treasury…",
  "trust.scene.cabinetVerify.spinner.documents": "Abriendo data room…",

  "trust.scene.operationFlow.toast.deposit.title": "Transferencia entrante",
  "trust.scene.operationFlow.toast.deposit.subtitle": "+500 USDT · TRC20 confirmado",
  "trust.scene.operationFlow.toast.ledger.title": "Entrada en ledger",
  "trust.scene.operationFlow.toast.ledger.subtitle": "deposit · +500 USDT · tx 0x8f…c21",
  "trust.scene.operationFlow.toast.trade.title": "Operación ejecutada",
  "trust.scene.operationFlow.toast.trade.subtitle": "50 UNT · Relic Waves · 681,80 USDT",
  "trust.scene.operationFlow.toast.accrual.title": "Devengo de ingresos",
  "trust.scene.operationFlow.toast.accrual.subtitle": "Relic Waves · Q2 · a su monedero",
  "trust.scene.operationFlow.toast.withdraw.title": "Retiro aprobado",
  "trust.scene.operationFlow.toast.withdraw.subtitle": "200 USDT · cola treasury",
  "trust.scene.operationFlow.creditedToBalance": "Acreditado al saldo",

  "trust.scene.updates.chrome": "Spliton · Actualizaciones 2026",
  "trust.scene.updates.toast.ledger.title": "Ledger lanzado",
  "trust.scene.updates.toast.ledger.subtitle": "Diario de operaciones · ene. 2026",
  "trust.scene.updates.toast.status.title": "Estado publicado",
  "trust.scene.updates.toast.status.subtitle": "Todos los servicios · operational",
  "trust.scene.updates.toast.disputes.title": "Caso aceptado",
  "trust.scene.updates.toast.disputes.subtitle": "Ticket #DS-2026-041",
  "trust.scene.updates.toast.trust.title": "Centro de confianza",
  "trust.scene.updates.toast.trust.subtitle": "Sección pública · jun. 2026",
};

const PT: Record<string, string> = {
  "meta.trust.title": "Centro de confiança",
  "meta.trust.description":
    "Transparência Spliton: como funcionam as operações, riscos, segurança da conta e ligações a documentos.",

  "trust.hero.eyebrow": "Transparência · USDT (TRC20)",
  "trust.hero.title": "Centro de confiança Spliton",
  "trust.hero.subtitle":
    "Como funcionam as operações, controlos de treasury e compliance, estado público e documentos — num só lugar.",
  "trust.hero.systemStatus": "Estado do sistema",
  "trust.hero.support": "Suporte",

  "trust.metrics.aria": "Indicadores-chave",
  "trust.metrics.heading.title": "Em que se baseia a confiança",
  "trust.metrics.heading.subtitle":
    "Quatro respostas simples para o utilizador: dinheiro, histórico de operações, levantamento e estado honesto dos serviços.",
  "trust.metrics.m1.label": "Em que moeda operamos",
  "trust.metrics.m1.value": "USDT (TRC20)",
  "trust.metrics.m1.hint":
    "Saldo, compras de UNT e levantamentos — em USDT na rede TRC20. Na conta vê-se o montante antes de confirmar cada operação.",
  "trust.metrics.m2.label": "Onde ver operações",
  "trust.metrics.m2.value": "Histórico na conta",
  "trust.metrics.m2.hint":
    "Depósitos, operações e levantamentos não «desaparecem» — cada operação com data, montante e estado no feed e extractos.",
  "trust.metrics.m3.label": "Como funciona o levantamento",
  "trust.metrics.m3.value": "Pedido → revisão → envio",
  "trust.metrics.m3.hint":
    "Levantamento para carteira externa passa revisão de limites e regras. Antes do envio vê-se quanto USDT é debitado e quanto chega ao endereço.",
  "trust.metrics.m4.label": "Se algo falhar",
  "trust.metrics.m4.value": "Estado público",
  "trust.metrics.m4.hint":
    "Falhas, manutenção e recuperação de serviços são publicadas abertamente — sem adivinhar se levantamento ou trading funciona.",
  "trust.metrics.m4.hrefLabel": "Abrir estado",

  "trust.pillars.title": "Como a Spliton garante transparência",
  "trust.pillars.subtitle": "Secções públicas, controlos de operações e documentos — antes de entrar numa operação.",

  "trust.section.howItWorks.title": "Como funciona a Spliton",
  "trust.section.howItWorks.body":
    "Bolsa de participações em activos musicais: compra de unidades no mercado primário e trading no secundário. Saldo — em USDT (TRC20).",
  "trust.section.howItWorks.detail":
    "Antes da operação há parâmetros do release, data room e condições de participação. O mercado secundário dá liquidez entre titulares.",

  "trust.section.ledger.title": "Protecção de fundos e ledger",
  "trust.section.ledger.body":
    "Cada movimento de fundos é registado em ledger interno com dupla entrada nas contas de utilizador e plataforma.",
  "trust.section.ledger.detail":
    "Depósitos e levantamentos passam controlo operacional. Acções do staff ficam no registo de auditoria; levantamentos — com limites de treasury.",

  "trust.section.systemStatus.title": "Estado do sistema",
  "trust.section.systemStatus.body":
    "Incidentes, degradações e manutenção planificada são publicados numa página separada — trading, pagamentos e conta.",
  "trust.section.systemStatus.detail":
    "Em falhas vê-se ETA de recuperação e histórico de eventos. Suporte disponível quando necessário.",
  "trust.section.systemStatus.hrefLabel": "Abrir estado",

  "trust.section.support.title": "Suporte e disputas",
  "trust.section.support.body":
    "Casos financeiros e de trading — por email, conta ou centro de disputas com registo do ticket.",
  "trust.section.support.detail":
    "Tempo médio de resposta por email — até 24 horas. Operações disputadas podem ir ao centro de disputas.",

  "trust.section.risks.title": "Riscos e divulgações",
  "trust.section.risks.body":
    "Participações em activos musicais envolvem risco de mercado, operacional e legal. A rentabilidade não é garantida.",
  "trust.section.risks.detail":
    "Revise documentos do release antes de entrar. Os materiais do centro de confiança não são recomendação de investimento.",

  "trust.section.fees.title": "Taxas e documentos",
  "trust.section.fees.body":
    "Tarifas, recibos, extractos e centro legal — na conta e secções públicas sem retenções ocultas.",
  "trust.section.fees.detail":
    "Taxas com exemplos de cálculo, histórico de operações da conta e consentimentos de políticas aceites.",

  "trust.link.support": "Suporte",
  "trust.link.disputes": "Centro de disputas",
  "trust.link.fees": "Taxas",
  "trust.link.statements": "Extractos",
  "trust.link.documents": "Documentos",
  "trust.link.more": "Saber mais",

  "trust.controls.title": "O que está por trás da segurança",
  "trust.controls.subtitle": "Não jargão técnico — o que significa para o seu dinheiro e levantamentos.",
  "trust.controls.withdrawLimits.title": "Limites de levantamento",
  "trust.controls.withdrawLimits.text":
    "Os pedidos passam fila e revisão de montante — para proteger o seu saldo e a plataforma.",
  "trust.controls.operationReview.title": "Revisão de operações",
  "trust.controls.operationReview.text":
    "Transferências suspeitas ou não standard podem ser pausadas até esclarecer.",
  "trust.controls.auditLog.title": "Registo de acções",
  "trust.controls.auditLog.text":
    "Acções importantes do pessoal e alterações de definições são registadas para analisar disputas.",
  "trust.controls.kyc.title": "Verificação (KYC)",
  "trust.controls.kyc.text":
    "A confirmação de identidade é necessária para levantamento e limites elevados.",

  "trust.verify.title": "O que verificar na conta",
  "trust.verify.subtitle": "Extractos, estados de pedidos e documentos do release — num só lugar.",

  "trust.cta.title": "Precisa de detalhes sobre uma operação?",
  "trust.cta.subtitle": "Estado dos serviços, tarifas e suporte — acesso aberto.",
  "trust.cta.systemStatus": "Estado do sistema",
  "trust.cta.support": "Suporte",
  "trust.cta.fees": "Taxas",

  "trust.disclaimer":
    "Os materiais são informativos e não constituem aconselhamento de investimento, fiscal ou jurídico. Condições das operações — nos documentos do release e políticas Spliton.",

  "trust.timeline.prev": "Etapa anterior",
  "trust.timeline.next": "Etapa seguinte",

  "trust.scene.cabinetVerify.spinner.history": "A carregar histórico…",
  "trust.scene.cabinetVerify.spinner.statements": "A gerar extracto…",
  "trust.scene.cabinetVerify.spinner.withdrawals": "Revisão treasury…",
  "trust.scene.cabinetVerify.spinner.documents": "A abrir data room…",

  "trust.scene.operationFlow.toast.deposit.title": "Transferência recebida",
  "trust.scene.operationFlow.toast.deposit.subtitle": "+500 USDT · TRC20 confirmado",
  "trust.scene.operationFlow.toast.ledger.title": "Registo no ledger",
  "trust.scene.operationFlow.toast.ledger.subtitle": "deposit · +500 USDT · tx 0x8f…c21",
  "trust.scene.operationFlow.toast.trade.title": "Operação executada",
  "trust.scene.operationFlow.toast.trade.subtitle": "50 UNT · Relic Waves · 681,80 USDT",
  "trust.scene.operationFlow.toast.accrual.title": "Devengo de rendimento",
  "trust.scene.operationFlow.toast.accrual.subtitle": "Relic Waves · Q2 · para a sua carteira",
  "trust.scene.operationFlow.toast.withdraw.title": "Levantamento aprovado",
  "trust.scene.operationFlow.toast.withdraw.subtitle": "200 USDT · fila treasury",
  "trust.scene.operationFlow.creditedToBalance": "Creditado no saldo",

  "trust.scene.updates.chrome": "Spliton · Actualizações 2026",
  "trust.scene.updates.toast.ledger.title": "Ledger lançado",
  "trust.scene.updates.toast.ledger.subtitle": "Diário de operações · jan. 2026",
  "trust.scene.updates.toast.status.title": "Estado publicado",
  "trust.scene.updates.toast.status.subtitle": "Todos os serviços · operational",
  "trust.scene.updates.toast.disputes.title": "Caso aceite",
  "trust.scene.updates.toast.disputes.subtitle": "Ticket #DS-2026-041",
  "trust.scene.updates.toast.trust.title": "Centro de confiança",
  "trust.scene.updates.toast.trust.subtitle": "Secção pública · jun. 2026",
};

export const TRUST_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
