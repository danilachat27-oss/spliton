import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "artist.portal.header.kicker": "Кабинет · Портал эмитента",
  "artist.portal.header.title": "Портал эмитента",
  "artist.portal.header.subtitle":
    "Ваши релизы, раунды сбора и выплаты на Spliton. Для инвесторов — {catalog}.",
  "artist.portal.header.catalogLink": "каталог",
  "artist.portal.signInPrompt": "Войдите в аккаунт, чтобы открыть портал эмитента.",
  "artist.portal.signIn": "Войти",
  "artist.portal.loading": "Загрузка портала…",

  "artist.portal.status.live": "В эфире",
  "artist.portal.status.draft": "Черновик",
  "artist.portal.status.listed": "На рынке",
  "artist.portal.status.payouts": "Выплаты",
  "artist.portal.status.archived": "Архив",
  "artist.portal.status.paused": "Пауза",

  "artist.portal.round.live": "Раунд live",
  "artist.portal.round.upcoming": "Скоро",
  "artist.portal.round.closed": "Закрыт",
  "artist.portal.round.settled": "Завершён",

  "artist.portal.kpi.releases": "Релизы",
  "artist.portal.kpi.liveRounds": "Активные раунды",
  "artist.portal.kpi.tradesLast30Days": "Сделки за 30 дней",
  "artist.portal.kpi.payoutsTotal": "Выплаты (нетто)",
  "artist.portal.kpi.openSubmissions": "Заявки в работе",

  "artist.portal.carousel.kicker": "Портал эмитента",
  "artist.portal.carousel.title": "Ваши релизы",
  "artist.portal.carousel.prevAria": "Предыдущий релиз",
  "artist.portal.carousel.nextAria": "Следующий релиз",
  "artist.portal.carousel.openRelease": "Открыть релиз",
  "artist.portal.carousel.slideAria": "Слайд {n}",

  "artist.portal.flow.release": "Релиз",
  "artist.portal.flow.round": "Раунд",
  "artist.portal.flow.trades": "Сделки",
  "artist.portal.flow.payouts": "Выплаты",
  "artist.portal.flow.caption": "Поток: релиз → раунд → вторичный рынок → выплаты эмитенту",

  "artist.portal.releases.title": "Все релизы",
  "artist.portal.releases.subtitle": "Статус, символ и быстрый переход в карточку.",
  "artist.portal.releases.refreshAria": "Обновить",
  "artist.portal.releases.empty":
    "Пока нет опубликованных релизов. Подайте заявку на выпуск через поддержку.",
  "artist.portal.releases.open": "Открыть",

  "artist.portal.pulse.title": "Пульс портала",
  "artist.portal.pulse.subtitle": "Сводка по релизам, раундам и выплатам за период.",
  "artist.portal.quickActions.title": "Быстрые действия",
  "artist.portal.quickActions.documents": "Документы эмитента",
  "artist.portal.quickActions.newRelease": "Заявка на новый релиз",
  "artist.portal.quickActions.statements": "Выписки и отчёты",

  "artist.onboarding.hero.title": "Станьте эмитентом на Spliton",
  "artist.onboarding.hero.description":
    "Портал доступен аккаунтам с ролью ARTIST и привязкой к эмитенту. Подайте заявку — команда проверит материалы и откроет доступ к аналитике, документам и управлению релизами.",
  "artist.onboarding.hero.applyCta": "Подать заявку",
  "artist.onboarding.hero.howItWorks": "Как это работает",

  "artist.onboarding.features.analytics.title": "Аналитика сбора",
  "artist.onboarding.features.analytics.description": "Статистика раундов, сделок и выплат в одном месте.",
  "artist.onboarding.features.documents.title": "Документы релиза",
  "artist.onboarding.features.documents.description": "От rights summary до выписки для партнёров.",
  "artist.onboarding.features.management.title": "Управление релизами",
  "artist.onboarding.features.management.description": "Статусы, раунды и вторичный рынок.",

  "artist.onboarding.process.kicker": "Процесс",
  "artist.onboarding.process.title": "Как получить доступ к порталу",
  "artist.onboarding.process.subtitle": "Три шага от заявки до роли эмитента на Spliton.",
  "artist.onboarding.process.step1.hint": "Подайте заявку",
  "artist.onboarding.process.step2.hint": "Проверка Spliton",
  "artist.onboarding.process.step3.hint": "Доступ к порталу",
  "artist.onboarding.process.step1.title": "Подайте заявку",
  "artist.onboarding.process.step1.description":
    "Заполните форму с типом проекта, ссылками и описанием прав на материалы.",
  "artist.onboarding.process.step2.title": "Проверка Spliton",
  "artist.onboarding.process.step2.description": "Compliance проверит материалы и свяжется при необходимости.",
  "artist.onboarding.process.step3.title": "Доступ к порталу",
  "artist.onboarding.process.step3.description":
    "После одобрения откроются релизы, раунды, аналитика и выплаты.",

  "artist.application.kicker": "Портал эмитента",
  "artist.application.title.submit": "Подать заявку",
  "artist.application.title.submitted": "Заявка отправлена",
  "artist.application.description.submit":
    "Расскажите о релизе и правах — команда Spliton рассмотрит заявку на роль эмитента.",
  "artist.application.description.submitted":
    "Compliance проверит материалы и свяжется с вами. Обычно ответ в течение нескольких рабочих дней.",
  "artist.application.closeAria": "Закрыть",
  "artist.application.signInPrompt": "Войдите в аккаунт, чтобы подать заявку на портал эмитента.",
  "artist.application.signIn": "Войти",
  "artist.application.close": "Закрыть",
  "artist.application.step.application": "Заявка",
  "artist.application.step.review": "Проверка",
  "artist.application.step.access": "Доступ",
  "artist.application.trackStatus": "Статус можно отслеживать в разделе {support}.",
  "artist.application.supportLink": "поддержки",

  "artist.application.form.projectType": "Тип проекта",
  "artist.application.form.projectType.single": "Сингл",
  "artist.application.form.projectType.ep": "EP / мини-альбом",
  "artist.application.form.projectType.album": "Альбом",
  "artist.application.form.projectType.catalog": "Каталог / несколько релизов",
  "artist.application.form.releaseName": "Название релиза / проекта",
  "artist.application.form.releaseNamePlaceholder": "Например: Midnight Code",
  "artist.application.form.catalogLink": "Ссылка на релиз или демо",
  "artist.application.form.optional": "(необязательно)",
  "artist.application.form.catalogLinkPlaceholder": "Spotify, Apple Music, SoundCloud…",
  "artist.application.form.rightsNote": "Права и материалы",
  "artist.application.form.rightsNotePlaceholder": "Доля прав, статус мастеров, ISRC/UPC, документы…",
  "artist.application.form.contact": "Контакт для связи",
  "artist.application.form.contactPlaceholder": "Telegram, email…",

  "artist.application.errors.releaseNameRequired": "Укажите название релиза или проекта.",
  "artist.application.errors.rightsNoteMin": "Опишите права и материалы (минимум 10 символов).",
  "artist.application.errors.submitFailed": "Не удалось отправить заявку",

  "artist.application.submitting": "Отправка…",
  "artist.application.submit": "Отправить заявку",
  "artist.application.cancel": "Отмена",
  "artist.application.demoHint":
    "Демо-режим: заявка будет показана как отправленная. В production она попадёт в поддержку Spliton.",

  "artist.application.ticket.header": "Заявка на доступ к порталу эмитента (роль ARTIST).",
  "artist.application.ticket.projectType": "Тип проекта: {type}",
  "artist.application.ticket.releaseName": "Название: {name}",
  "artist.application.ticket.catalogLink": "Ссылка: {link}",
  "artist.application.ticket.rightsHeader": "Права и материалы:",
  "artist.application.ticket.contact": "Контакт: {contact}",
  "artist.application.ticket.subject": "Заявка эмитента: {name}",
};

const EN: Record<string, string> = {
  "artist.portal.header.kicker": "Dashboard · Issuer portal",
  "artist.portal.header.title": "Issuer portal",
  "artist.portal.header.subtitle":
    "Your releases, fundraising rounds and payouts on Spliton. For investors — see the {catalog}.",
  "artist.portal.header.catalogLink": "catalog",
  "artist.portal.signInPrompt": "Sign in to open the issuer portal.",
  "artist.portal.signIn": "Sign in",
  "artist.portal.loading": "Loading portal…",

  "artist.portal.status.live": "Live",
  "artist.portal.status.draft": "Draft",
  "artist.portal.status.listed": "On market",
  "artist.portal.status.payouts": "Payouts",
  "artist.portal.status.archived": "Archived",
  "artist.portal.status.paused": "Paused",

  "artist.portal.round.live": "Live round",
  "artist.portal.round.upcoming": "Upcoming",
  "artist.portal.round.closed": "Closed",
  "artist.portal.round.settled": "Settled",

  "artist.portal.kpi.releases": "Releases",
  "artist.portal.kpi.liveRounds": "Active rounds",
  "artist.portal.kpi.tradesLast30Days": "Trades in 30 days",
  "artist.portal.kpi.payoutsTotal": "Payouts (net)",
  "artist.portal.kpi.openSubmissions": "Open requests",

  "artist.portal.carousel.kicker": "Issuer portal",
  "artist.portal.carousel.title": "Your releases",
  "artist.portal.carousel.prevAria": "Previous release",
  "artist.portal.carousel.nextAria": "Next release",
  "artist.portal.carousel.openRelease": "Open release",
  "artist.portal.carousel.slideAria": "Slide {n}",

  "artist.portal.flow.release": "Release",
  "artist.portal.flow.round": "Round",
  "artist.portal.flow.trades": "Trades",
  "artist.portal.flow.payouts": "Payouts",
  "artist.portal.flow.caption": "Flow: release → round → secondary market → issuer payouts",

  "artist.portal.releases.title": "All releases",
  "artist.portal.releases.subtitle": "Status, symbol and quick jump to the release page.",
  "artist.portal.releases.refreshAria": "Refresh",
  "artist.portal.releases.empty":
    "No published releases yet. Submit an issuance request via support.",
  "artist.portal.releases.open": "Open",

  "artist.portal.pulse.title": "Portal pulse",
  "artist.portal.pulse.subtitle": "Summary of releases, rounds and payouts for the period.",
  "artist.portal.quickActions.title": "Quick actions",
  "artist.portal.quickActions.documents": "Issuer documents",
  "artist.portal.quickActions.newRelease": "Request a new release",
  "artist.portal.quickActions.statements": "Statements & reports",

  "artist.onboarding.hero.title": "Become an issuer on Spliton",
  "artist.onboarding.hero.description":
    "The portal is available to accounts with the ARTIST role linked to an issuer. Submit an application — the team will review materials and grant access to analytics, documents and release management.",
  "artist.onboarding.hero.applyCta": "Apply",
  "artist.onboarding.hero.howItWorks": "How it works",

  "artist.onboarding.features.analytics.title": "Fundraising analytics",
  "artist.onboarding.features.analytics.description": "Round, trade and payout stats in one place.",
  "artist.onboarding.features.documents.title": "Release documents",
  "artist.onboarding.features.documents.description": "From rights summary to partner statements.",
  "artist.onboarding.features.management.title": "Release management",
  "artist.onboarding.features.management.description": "Statuses, rounds and secondary market.",

  "artist.onboarding.process.kicker": "Process",
  "artist.onboarding.process.title": "How to get portal access",
  "artist.onboarding.process.subtitle": "Three steps from application to issuer role on Spliton.",
  "artist.onboarding.process.step1.hint": "Submit application",
  "artist.onboarding.process.step2.hint": "Spliton review",
  "artist.onboarding.process.step3.hint": "Portal access",
  "artist.onboarding.process.step1.title": "Submit application",
  "artist.onboarding.process.step1.description":
    "Fill in the form with project type, links and a description of rights to materials.",
  "artist.onboarding.process.step2.title": "Spliton review",
  "artist.onboarding.process.step2.description": "Compliance will review materials and reach out if needed.",
  "artist.onboarding.process.step3.title": "Portal access",
  "artist.onboarding.process.step3.description":
    "After approval you get releases, rounds, analytics and payouts.",

  "artist.application.kicker": "Issuer portal",
  "artist.application.title.submit": "Apply",
  "artist.application.title.submitted": "Application sent",
  "artist.application.description.submit":
    "Tell us about the release and rights — the Spliton team will review your issuer application.",
  "artist.application.description.submitted":
    "Compliance will review materials and contact you. Response usually within a few business days.",
  "artist.application.closeAria": "Close",
  "artist.application.signInPrompt": "Sign in to apply for the issuer portal.",
  "artist.application.signIn": "Sign in",
  "artist.application.close": "Close",
  "artist.application.step.application": "Application",
  "artist.application.step.review": "Review",
  "artist.application.step.access": "Access",
  "artist.application.trackStatus": "Track status in {support}.",
  "artist.application.supportLink": "support",

  "artist.application.form.projectType": "Project type",
  "artist.application.form.projectType.single": "Single",
  "artist.application.form.projectType.ep": "EP / mini-album",
  "artist.application.form.projectType.album": "Album",
  "artist.application.form.projectType.catalog": "Catalog / multiple releases",
  "artist.application.form.releaseName": "Release / project name",
  "artist.application.form.releaseNamePlaceholder": "e.g. Midnight Code",
  "artist.application.form.catalogLink": "Release or demo link",
  "artist.application.form.optional": "(optional)",
  "artist.application.form.catalogLinkPlaceholder": "Spotify, Apple Music, SoundCloud…",
  "artist.application.form.rightsNote": "Rights and materials",
  "artist.application.form.rightsNotePlaceholder": "Rights share, master status, ISRC/UPC, documents…",
  "artist.application.form.contact": "Contact",
  "artist.application.form.contactPlaceholder": "Telegram, email…",

  "artist.application.errors.releaseNameRequired": "Enter a release or project name.",
  "artist.application.errors.rightsNoteMin": "Describe rights and materials (at least 10 characters).",
  "artist.application.errors.submitFailed": "Could not submit application",

  "artist.application.submitting": "Sending…",
  "artist.application.submit": "Submit application",
  "artist.application.cancel": "Cancel",
  "artist.application.demoHint":
    "Demo mode: the application will appear as sent. In production it goes to Spliton support.",

  "artist.application.ticket.header": "Issuer portal access request (ARTIST role).",
  "artist.application.ticket.projectType": "Project type: {type}",
  "artist.application.ticket.releaseName": "Name: {name}",
  "artist.application.ticket.catalogLink": "Link: {link}",
  "artist.application.ticket.rightsHeader": "Rights and materials:",
  "artist.application.ticket.contact": "Contact: {contact}",
  "artist.application.ticket.subject": "Issuer application: {name}",
};

const ES: Record<string, string> = {
  "artist.portal.header.kicker": "Panel · Portal del emisor",
  "artist.portal.header.title": "Portal del emisor",
  "artist.portal.header.subtitle":
    "Sus lanzamientos, rondas de recaudación y pagos en Spliton. Para inversores — {catalog}.",
  "artist.portal.header.catalogLink": "catálogo",
  "artist.portal.signInPrompt": "Inicie sesión para abrir el portal del emisor.",
  "artist.portal.signIn": "Iniciar sesión",
  "artist.portal.loading": "Cargando portal…",

  "artist.portal.status.live": "En vivo",
  "artist.portal.status.draft": "Borrador",
  "artist.portal.status.listed": "En mercado",
  "artist.portal.status.payouts": "Pagos",
  "artist.portal.status.archived": "Archivado",
  "artist.portal.status.paused": "Pausado",

  "artist.portal.round.live": "Ronda live",
  "artist.portal.round.upcoming": "Próximamente",
  "artist.portal.round.closed": "Cerrada",
  "artist.portal.round.settled": "Finalizada",

  "artist.portal.kpi.releases": "Lanzamientos",
  "artist.portal.kpi.liveRounds": "Rondas activas",
  "artist.portal.kpi.tradesLast30Days": "Operaciones en 30 días",
  "artist.portal.kpi.payoutsTotal": "Pagos (neto)",
  "artist.portal.kpi.openSubmissions": "Solicitudes abiertas",

  "artist.portal.carousel.kicker": "Portal del emisor",
  "artist.portal.carousel.title": "Sus lanzamientos",
  "artist.portal.carousel.prevAria": "Lanzamiento anterior",
  "artist.portal.carousel.nextAria": "Siguiente lanzamiento",
  "artist.portal.carousel.openRelease": "Abrir lanzamiento",
  "artist.portal.carousel.slideAria": "Diapositiva {n}",

  "artist.portal.flow.release": "Lanzamiento",
  "artist.portal.flow.round": "Ronda",
  "artist.portal.flow.trades": "Operaciones",
  "artist.portal.flow.payouts": "Pagos",
  "artist.portal.flow.caption": "Flujo: lanzamiento → ronda → mercado secundario → pagos al emisor",

  "artist.portal.releases.title": "Todos los lanzamientos",
  "artist.portal.releases.subtitle": "Estado, símbolo y acceso rápido a la ficha.",
  "artist.portal.releases.refreshAria": "Actualizar",
  "artist.portal.releases.empty":
    "Aún no hay lanzamientos publicados. Envíe una solicitud de emisión a través de soporte.",
  "artist.portal.releases.open": "Abrir",

  "artist.portal.pulse.title": "Pulso del portal",
  "artist.portal.pulse.subtitle": "Resumen de lanzamientos, rondas y pagos del periodo.",
  "artist.portal.quickActions.title": "Acciones rápidas",
  "artist.portal.quickActions.documents": "Documentos del emisor",
  "artist.portal.quickActions.newRelease": "Solicitar nuevo lanzamiento",
  "artist.portal.quickActions.statements": "Extractos e informes",

  "artist.onboarding.hero.title": "Conviértase en emisor en Spliton",
  "artist.onboarding.hero.description":
    "El portal está disponible para cuentas con rol ARTIST vinculadas a un emisor. Envíe una solicitud — el equipo revisará los materiales y abrirá acceso a analítica, documentos y gestión de lanzamientos.",
  "artist.onboarding.hero.applyCta": "Enviar solicitud",
  "artist.onboarding.hero.howItWorks": "Cómo funciona",

  "artist.onboarding.features.analytics.title": "Analítica de recaudación",
  "artist.onboarding.features.analytics.description": "Estadísticas de rondas, operaciones y pagos en un solo lugar.",
  "artist.onboarding.features.documents.title": "Documentos del lanzamiento",
  "artist.onboarding.features.documents.description": "Desde rights summary hasta extractos para socios.",
  "artist.onboarding.features.management.title": "Gestión de lanzamientos",
  "artist.onboarding.features.management.description": "Estados, rondas y mercado secundario.",

  "artist.onboarding.process.kicker": "Proceso",
  "artist.onboarding.process.title": "Cómo obtener acceso al portal",
  "artist.onboarding.process.subtitle": "Tres pasos desde la solicitud hasta el rol de emisor en Spliton.",
  "artist.onboarding.process.step1.hint": "Enviar solicitud",
  "artist.onboarding.process.step2.hint": "Revisión Spliton",
  "artist.onboarding.process.step3.hint": "Acceso al portal",
  "artist.onboarding.process.step1.title": "Enviar solicitud",
  "artist.onboarding.process.step1.description":
    "Complete el formulario con tipo de proyecto, enlaces y descripción de derechos sobre los materiales.",
  "artist.onboarding.process.step2.title": "Revisión Spliton",
  "artist.onboarding.process.step2.description": "Compliance revisará los materiales y contactará si es necesario.",
  "artist.onboarding.process.step3.title": "Acceso al portal",
  "artist.onboarding.process.step3.description":
    "Tras la aprobación se abrirán lanzamientos, rondas, analítica y pagos.",

  "artist.application.kicker": "Portal del emisor",
  "artist.application.title.submit": "Enviar solicitud",
  "artist.application.title.submitted": "Solicitud enviada",
  "artist.application.description.submit":
    "Cuéntenos sobre el lanzamiento y los derechos — el equipo Spliton revisará su solicitud de emisor.",
  "artist.application.description.submitted":
    "Compliance revisará los materiales y se pondrá en contacto. Suele responder en unos días laborables.",
  "artist.application.closeAria": "Cerrar",
  "artist.application.signInPrompt": "Inicie sesión para solicitar el portal del emisor.",
  "artist.application.signIn": "Iniciar sesión",
  "artist.application.close": "Cerrar",
  "artist.application.step.application": "Solicitud",
  "artist.application.step.review": "Revisión",
  "artist.application.step.access": "Acceso",
  "artist.application.trackStatus": "Puede seguir el estado en {support}.",
  "artist.application.supportLink": "soporte",

  "artist.application.form.projectType": "Tipo de proyecto",
  "artist.application.form.projectType.single": "Sencillo",
  "artist.application.form.projectType.ep": "EP / mini-álbum",
  "artist.application.form.projectType.album": "Álbum",
  "artist.application.form.projectType.catalog": "Catálogo / varios lanzamientos",
  "artist.application.form.releaseName": "Nombre del lanzamiento / proyecto",
  "artist.application.form.releaseNamePlaceholder": "Ej.: Midnight Code",
  "artist.application.form.catalogLink": "Enlace al lanzamiento o demo",
  "artist.application.form.optional": "(opcional)",
  "artist.application.form.catalogLinkPlaceholder": "Spotify, Apple Music, SoundCloud…",
  "artist.application.form.rightsNote": "Derechos y materiales",
  "artist.application.form.rightsNotePlaceholder": "Participación en derechos, estado de masters, ISRC/UPC, documentos…",
  "artist.application.form.contact": "Contacto",
  "artist.application.form.contactPlaceholder": "Telegram, email…",

  "artist.application.errors.releaseNameRequired": "Indique el nombre del lanzamiento o proyecto.",
  "artist.application.errors.rightsNoteMin": "Describa derechos y materiales (mínimo 10 caracteres).",
  "artist.application.errors.submitFailed": "No se pudo enviar la solicitud",

  "artist.application.submitting": "Enviando…",
  "artist.application.submit": "Enviar solicitud",
  "artist.application.cancel": "Cancelar",
  "artist.application.demoHint":
    "Modo demo: la solicitud aparecerá como enviada. En producción irá al soporte de Spliton.",

  "artist.application.ticket.header": "Solicitud de acceso al portal del emisor (rol ARTIST).",
  "artist.application.ticket.projectType": "Tipo de proyecto: {type}",
  "artist.application.ticket.releaseName": "Nombre: {name}",
  "artist.application.ticket.catalogLink": "Enlace: {link}",
  "artist.application.ticket.rightsHeader": "Derechos y materiales:",
  "artist.application.ticket.contact": "Contacto: {contact}",
  "artist.application.ticket.subject": "Solicitud de emisor: {name}",
};

const PT: Record<string, string> = {
  "artist.portal.header.kicker": "Painel · Portal do emissor",
  "artist.portal.header.title": "Portal do emissor",
  "artist.portal.header.subtitle":
    "Os seus lançamentos, rondas de angariação e pagamentos no Spliton. Para investidores — {catalog}.",
  "artist.portal.header.catalogLink": "catálogo",
  "artist.portal.signInPrompt": "Inicie sessão para abrir o portal do emissor.",
  "artist.portal.signIn": "Iniciar sessão",
  "artist.portal.loading": "A carregar portal…",

  "artist.portal.status.live": "Em direto",
  "artist.portal.status.draft": "Rascunho",
  "artist.portal.status.listed": "No mercado",
  "artist.portal.status.payouts": "Pagamentos",
  "artist.portal.status.archived": "Arquivado",
  "artist.portal.status.paused": "Em pausa",

  "artist.portal.round.live": "Ronda live",
  "artist.portal.round.upcoming": "Em breve",
  "artist.portal.round.closed": "Fechada",
  "artist.portal.round.settled": "Concluída",

  "artist.portal.kpi.releases": "Lançamentos",
  "artist.portal.kpi.liveRounds": "Rondas ativas",
  "artist.portal.kpi.tradesLast30Days": "Operações em 30 dias",
  "artist.portal.kpi.payoutsTotal": "Pagamentos (líquido)",
  "artist.portal.kpi.openSubmissions": "Pedidos em aberto",

  "artist.portal.carousel.kicker": "Portal do emissor",
  "artist.portal.carousel.title": "Os seus lançamentos",
  "artist.portal.carousel.prevAria": "Lançamento anterior",
  "artist.portal.carousel.nextAria": "Próximo lançamento",
  "artist.portal.carousel.openRelease": "Abrir lançamento",
  "artist.portal.carousel.slideAria": "Diapositiva {n}",

  "artist.portal.flow.release": "Lançamento",
  "artist.portal.flow.round": "Ronda",
  "artist.portal.flow.trades": "Operações",
  "artist.portal.flow.payouts": "Pagamentos",
  "artist.portal.flow.caption": "Fluxo: lançamento → ronda → mercado secundário → pagamentos ao emissor",

  "artist.portal.releases.title": "Todos os lançamentos",
  "artist.portal.releases.subtitle": "Estado, símbolo e acesso rápido à ficha.",
  "artist.portal.releases.refreshAria": "Atualizar",
  "artist.portal.releases.empty":
    "Ainda não há lançamentos publicados. Envie um pedido de emissão através do suporte.",
  "artist.portal.releases.open": "Abrir",

  "artist.portal.pulse.title": "Pulso do portal",
  "artist.portal.pulse.subtitle": "Resumo de lançamentos, rondas e pagamentos do período.",
  "artist.portal.quickActions.title": "Ações rápidas",
  "artist.portal.quickActions.documents": "Documentos do emissor",
  "artist.portal.quickActions.newRelease": "Pedir novo lançamento",
  "artist.portal.quickActions.statements": "Extratos e relatórios",

  "artist.onboarding.hero.title": "Torne-se emissor no Spliton",
  "artist.onboarding.hero.description":
    "O portal está disponível para contas com papel ARTIST ligadas a um emissor. Envie um pedido — a equipa reverá os materiais e abrirá acesso a analítica, documentos e gestão de lançamentos.",
  "artist.onboarding.hero.applyCta": "Enviar pedido",
  "artist.onboarding.hero.howItWorks": "Como funciona",

  "artist.onboarding.features.analytics.title": "Analítica de angariação",
  "artist.onboarding.features.analytics.description": "Estatísticas de rondas, operações e pagamentos num só lugar.",
  "artist.onboarding.features.documents.title": "Documentos do lançamento",
  "artist.onboarding.features.documents.description": "De rights summary a extratos para parceiros.",
  "artist.onboarding.features.management.title": "Gestão de lançamentos",
  "artist.onboarding.features.management.description": "Estados, rondas e mercado secundário.",

  "artist.onboarding.process.kicker": "Processo",
  "artist.onboarding.process.title": "Como obter acesso ao portal",
  "artist.onboarding.process.subtitle": "Três passos do pedido ao papel de emissor no Spliton.",
  "artist.onboarding.process.step1.hint": "Enviar pedido",
  "artist.onboarding.process.step2.hint": "Revisão Spliton",
  "artist.onboarding.process.step3.hint": "Acesso ao portal",
  "artist.onboarding.process.step1.title": "Enviar pedido",
  "artist.onboarding.process.step1.description":
    "Preencha o formulário com tipo de projeto, ligações e descrição dos direitos sobre os materiais.",
  "artist.onboarding.process.step2.title": "Revisão Spliton",
  "artist.onboarding.process.step2.description": "A compliance reverá os materiais e contactará se necessário.",
  "artist.onboarding.process.step3.title": "Acesso ao portal",
  "artist.onboarding.process.step3.description":
    "Após aprovação abrem-se lançamentos, rondas, analítica e pagamentos.",

  "artist.application.kicker": "Portal do emissor",
  "artist.application.title.submit": "Enviar pedido",
  "artist.application.title.submitted": "Pedido enviado",
  "artist.application.description.submit":
    "Fale-nos do lançamento e dos direitos — a equipa Spliton reverá o seu pedido de emissor.",
  "artist.application.description.submitted":
    "A compliance reverá os materiais e contactará. Resposta habitualmente em alguns dias úteis.",
  "artist.application.closeAria": "Fechar",
  "artist.application.signInPrompt": "Inicie sessão para pedir o portal do emissor.",
  "artist.application.signIn": "Iniciar sessão",
  "artist.application.close": "Fechar",
  "artist.application.step.application": "Pedido",
  "artist.application.step.review": "Revisão",
  "artist.application.step.access": "Acesso",
  "artist.application.trackStatus": "Pode acompanhar o estado em {support}.",
  "artist.application.supportLink": "suporte",

  "artist.application.form.projectType": "Tipo de projeto",
  "artist.application.form.projectType.single": "Single",
  "artist.application.form.projectType.ep": "EP / mini-álbum",
  "artist.application.form.projectType.album": "Álbum",
  "artist.application.form.projectType.catalog": "Catálogo / vários lançamentos",
  "artist.application.form.releaseName": "Nome do lançamento / projeto",
  "artist.application.form.releaseNamePlaceholder": "Ex.: Midnight Code",
  "artist.application.form.catalogLink": "Ligação ao lançamento ou demo",
  "artist.application.form.optional": "(opcional)",
  "artist.application.form.catalogLinkPlaceholder": "Spotify, Apple Music, SoundCloud…",
  "artist.application.form.rightsNote": "Direitos e materiais",
  "artist.application.form.rightsNotePlaceholder": "Quota de direitos, estado dos masters, ISRC/UPC, documentos…",
  "artist.application.form.contact": "Contacto",
  "artist.application.form.contactPlaceholder": "Telegram, email…",

  "artist.application.errors.releaseNameRequired": "Indique o nome do lançamento ou projeto.",
  "artist.application.errors.rightsNoteMin": "Descreva direitos e materiais (mínimo 10 caracteres).",
  "artist.application.errors.submitFailed": "Não foi possível enviar o pedido",

  "artist.application.submitting": "A enviar…",
  "artist.application.submit": "Enviar pedido",
  "artist.application.cancel": "Cancelar",
  "artist.application.demoHint":
    "Modo demo: o pedido aparecerá como enviado. Em produção vai para o suporte Spliton.",

  "artist.application.ticket.header": "Pedido de acesso ao portal do emissor (papel ARTIST).",
  "artist.application.ticket.projectType": "Tipo de projeto: {type}",
  "artist.application.ticket.releaseName": "Nome: {name}",
  "artist.application.ticket.catalogLink": "Ligação: {link}",
  "artist.application.ticket.rightsHeader": "Direitos e materiais:",
  "artist.application.ticket.contact": "Contacto: {contact}",
  "artist.application.ticket.subject": "Pedido de emissor: {name}",
};

export const ARTIST_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
