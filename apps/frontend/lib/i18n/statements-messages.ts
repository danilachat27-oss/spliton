import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "statements.page.header.title": "Выписки и справки",
  "statements.page.subtitle": "Справки по операциям в USDT. Готовые файлы — в {documents}.",
  "statements.page.header.documentsLink": "документах",

  "statements.tab.request": "Заказать",
  "statements.tab.history": "Готовые",

  "statements.page.request.loadingKinds": "Загрузка…",
  "statements.page.request.retry": "Повторить",
  "statements.page.request.noKinds": "Типы выписок пока недоступны.",
  "statements.page.request.demoHint": "Демо: PDF доступен после входа в аккаунт.",
  "statements.page.request.kindLabel": "Тип",
  "statements.page.request.kindPlaceholder": "Выберите тип",
  "statements.page.request.periodLabel": "Период",
  "statements.page.request.submitting": "Отправка…",
  "statements.page.request.submit": "Сформировать PDF",
  "statements.page.request.hint": "Документ формируется в фоне, обычно 1–3 минуты.",

  "statements.page.preview.title": "Предпросмотр выписки",
  "statements.page.preview.generating": "Формирование",
  "statements.page.preview.ready": "Готово",
  "statements.page.preview.fallbackKind": "Выписка по счёту",
  "statements.page.preview.selectKind": "Выберите тип",

  "statements.page.history.refreshAria": "Обновить",
  "statements.page.history.empty": "Выписок пока нет.",
  "statements.page.history.count": "{count} документов",
  "statements.page.history.pdf": "Скачать",

  "statements.period.q-current": "Текущий квартал",
  "statements.period.month-current": "Текущий месяц",
  "statements.period.year-2026": "2026 год",
  "statements.period.year-2025": "2025 год",
  "statements.period.yearLabel": "{year} год",

  "statements.kind.monthly_wallet_statement": "Ежемесячная выписка кошелька",
  "statements.kind.annual_income_statement": "Годовая справка о доходах",
  "statements.kind.trading_summary": "Сводка сделок",
  "statements.kind.payouts_summary": "Сводка выплат",
  "statements.kind.fees_paid_summary": "Сводка комиссий",
  "statements.kind.realized_pnl_summary": "Сводка реализованного PnL",
  "statements.kind.deposits_withdrawals_summary": "Пополнения и выводы",
  "statements.kind.wallet_statement": "Выписка кошелька",

  "statements.kind.monthly_wallet_statement.disclaimer":
    "Сводка пополнений, списаний и баланса USDT за выбранный месяц.",
  "statements.kind.annual_income_statement.disclaimer":
    "Начисления по релизам и итоги за календарный год — для личного учёта.",
  "statements.kind.trading_summary.disclaimer":
    "Покупки UNT и операции на вторичном рынке за период.",
  "statements.kind.payouts_summary.disclaimer":
    "Зачисления по долям дохода и выводы USDT (TRC20).",
  "statements.kind.fees_paid_summary.disclaimer":
    "Комиссии платформы и вторичного рынка за выбранный период.",
  "statements.kind.realized_pnl_summary.disclaimer":
    "Реализованная прибыль и убытки по позициям за период.",
  "statements.kind.deposits_withdrawals_summary.disclaimer":
    "Пополнения и выводы USDT (TRC20) за выбранный период.",
  "statements.kind.wallet_statement.disclaimer":
    "Полная выписка по кошельку: баланс, операции и статусы за период.",

  "statements.status.queued": "В очереди",
  "statements.status.running": "Формирование",
  "statements.status.completed": "Готово",
  "statements.status.failed": "Ошибка",
  "statements.status.expired": "Истекло",
  "statements.status.ready": "Готово",

  "statements.step.accepted": "Принят",
  "statements.step.collecting": "Сбор данных",
  "statements.step.pdf": "PDF",
  "statements.step.downloadReady": "Готово",

  "statements.preview.platformTagline": "Платформа долей музыкальных активов",
  "statements.preview.referenceLabel": "Справка",
  "statements.preview.reportingPeriod": "Отчётный период: {period}",
  "statements.preview.stamp.confirmed": "Подтверждено",
  "statements.preview.stamp.generating": "Формирование",
  "statements.preview.stamp.error": "Ошибка",
  "statements.preview.stamp.preview": "Предпросмотр",
  "statements.preview.holder": "Получатель",
  "statements.preview.period": "Период",
  "statements.preview.currency": "Валюта",
  "statements.preview.currencyValue": "USDT · TRC20",
  "statements.preview.opsInPeriod": "Операций в периоде",
  "statements.preview.summaryTitle": "Сводка по счёту",
  "statements.preview.availableBalance": "Доступный баланс на дату",
  "statements.preview.inflow": "Пополнения за период",
  "statements.preview.outflow": "Списания за период",
  "statements.preview.idleHint":
    "Нажмите «Сформировать выписку» — документ будет сформирован в PDF с тем же оформлением и подписью платформы.",
  "statements.preview.generatingHint": "Формирование PDF…",
  "statements.preview.downloadPdf": "Скачать PDF",
  "statements.preview.footerDisclaimer":
    "Документ сформирован автоматически на основании записей внутреннего ledger Spliton. Не является налоговой или юридической консультацией.",
  "statements.preview.footerContact": "spliton.io · treasury@spliton.io",
  "statements.preview.spliton": "Spliton",
  "statements.preview.logoAlt": "Spliton",

  "statements.errors.loadKindsFailed": "Не удалось загрузить типы выписок",
  "statements.errors.loadDataFailed": "Не удалось загрузить данные",
  "statements.errors.loadHistoryFailed": "Не удалось загрузить историю",
  "statements.errors.requestFailed": "Не удалось запросить выписку",
  "statements.errors.requestGeneric": "Ошибка запроса",
  "statements.errors.getStatusFailed": "Не удалось получить статус",
  "statements.errors.demoPdfHint": "В демо-режиме PDF формируется на сервере после входа в аккаунт.",
  "statements.errors.downloadFailed": "Не удалось скачать документ",
};

const EN: Record<string, string> = {
  "statements.page.header.title": "Statements & certificates",
  "statements.page.subtitle": "USDT operation certificates. Ready files are in {documents}.",
  "statements.page.header.documentsLink": "documents",

  "statements.tab.request": "Request",
  "statements.tab.history": "Ready",

  "statements.page.request.loadingKinds": "Loading…",
  "statements.page.request.retry": "Retry",
  "statements.page.request.noKinds": "Statement types are not available yet.",
  "statements.page.request.demoHint": "Demo: PDF is available after sign-in.",
  "statements.page.request.kindLabel": "Type",
  "statements.page.request.kindPlaceholder": "Select type",
  "statements.page.request.periodLabel": "Period",
  "statements.page.request.submitting": "Sending…",
  "statements.page.request.submit": "Generate PDF",
  "statements.page.request.hint": "Document generates in the background, usually 1–3 minutes.",

  "statements.page.preview.title": "Statement preview",
  "statements.page.preview.generating": "Generating",
  "statements.page.preview.ready": "Ready",
  "statements.page.preview.fallbackKind": "Account statement",
  "statements.page.preview.selectKind": "Select type",

  "statements.page.history.refreshAria": "Refresh",
  "statements.page.history.empty": "No statements yet.",
  "statements.page.history.count": "{count} documents",
  "statements.page.history.pdf": "Download",

  "statements.period.q-current": "Current quarter",
  "statements.period.month-current": "Current month",
  "statements.period.year-2026": "Year 2026",
  "statements.period.year-2025": "Year 2025",
  "statements.period.yearLabel": "Year {year}",

  "statements.kind.monthly_wallet_statement": "Monthly wallet statement",
  "statements.kind.annual_income_statement": "Annual income certificate",
  "statements.kind.trading_summary": "Trading summary",
  "statements.kind.payouts_summary": "Payouts summary",
  "statements.kind.fees_paid_summary": "Fees paid summary",
  "statements.kind.realized_pnl_summary": "Realized PnL summary",
  "statements.kind.deposits_withdrawals_summary": "Deposits and withdrawals",
  "statements.kind.wallet_statement": "Wallet statement",

  "statements.kind.monthly_wallet_statement.disclaimer":
    "Summary of deposits, debits and USDT balance for the selected month.",
  "statements.kind.annual_income_statement.disclaimer":
    "Accruals by release and calendar-year totals — for personal records.",
  "statements.kind.trading_summary.disclaimer":
    "UNT purchases and secondary market operations for the period.",
  "statements.kind.payouts_summary.disclaimer":
    "Revenue share credits and USDT (TRC20) withdrawals.",
  "statements.kind.fees_paid_summary.disclaimer":
    "Platform and secondary market fees for the selected period.",
  "statements.kind.realized_pnl_summary.disclaimer":
    "Realized profit and loss on positions for the period.",
  "statements.kind.deposits_withdrawals_summary.disclaimer":
    "USDT (TRC20) deposits and withdrawals for the selected period.",
  "statements.kind.wallet_statement.disclaimer":
    "Full wallet statement: balance, operations and statuses for the period.",

  "statements.status.queued": "Queued",
  "statements.status.running": "Generating",
  "statements.status.completed": "Ready",
  "statements.status.failed": "Failed",
  "statements.status.expired": "Expired",
  "statements.status.ready": "Ready",

  "statements.step.accepted": "Request received",
  "statements.step.collecting": "Collecting operations",
  "statements.step.pdf": "Generating PDF",
  "statements.step.downloadReady": "Ready to download",

  "statements.preview.platformTagline": "Music asset share platform",
  "statements.preview.referenceLabel": "Certificate",
  "statements.preview.reportingPeriod": "Reporting period: {period}",
  "statements.preview.stamp.confirmed": "Confirmed",
  "statements.preview.stamp.generating": "Generating",
  "statements.preview.stamp.error": "Error",
  "statements.preview.stamp.preview": "Preview",
  "statements.preview.holder": "Holder",
  "statements.preview.period": "Period",
  "statements.preview.currency": "Currency",
  "statements.preview.currencyValue": "USDT · TRC20",
  "statements.preview.opsInPeriod": "Operations in period",
  "statements.preview.summaryTitle": "Account summary",
  "statements.preview.availableBalance": "Available balance as of date",
  "statements.preview.inflow": "Deposits in period",
  "statements.preview.outflow": "Debits in period",
  "statements.preview.idleHint":
    "Click «Generate statement» — the document will be produced as PDF with the same layout and platform signature.",
  "statements.preview.generatingHint": "Collecting ledger operations and preparing PDF…",
  "statements.preview.downloadPdf": "Download PDF",
  "statements.preview.footerDisclaimer":
    "Document generated automatically from Spliton internal ledger records. Not tax or legal advice.",
  "statements.preview.footerContact": "spliton.io · treasury@spliton.io",
  "statements.preview.spliton": "Spliton",
  "statements.preview.logoAlt": "Spliton",

  "statements.errors.loadKindsFailed": "Could not load statement types",
  "statements.errors.loadDataFailed": "Could not load data",
  "statements.errors.loadHistoryFailed": "Could not load history",
  "statements.errors.requestFailed": "Could not request statement",
  "statements.errors.requestGeneric": "Request error",
  "statements.errors.getStatusFailed": "Could not get status",
  "statements.errors.demoPdfHint": "In demo mode PDF is generated on the server after sign-in.",
  "statements.errors.downloadFailed": "Could not download document",
};

const ES: Record<string, string> = {
  "statements.page.header.title": "Extractos y certificados",
  "statements.page.subtitle": "Certificados de operaciones en USDT. Archivos listos en {documents}.",
  "statements.page.header.documentsLink": "documentos",

  "statements.tab.request": "Solicitar",
  "statements.tab.history": "Listos",

  "statements.page.request.loadingKinds": "Cargando…",
  "statements.page.request.retry": "Reintentar",
  "statements.page.request.noKinds": "Los tipos de extracto aún no están disponibles.",
  "statements.page.request.demoHint": "Demo: PDF disponible tras iniciar sesión.",
  "statements.page.request.kindLabel": "Tipo",
  "statements.page.request.kindPlaceholder": "Seleccione tipo",
  "statements.page.request.periodLabel": "Periodo",
  "statements.page.request.submitting": "Enviando…",
  "statements.page.request.submit": "Generar PDF",
  "statements.page.request.hint": "El documento se genera en segundo plano, normalmente 1–3 minutos.",

  "statements.page.preview.title": "Vista previa del extracto",
  "statements.page.preview.generating": "Generando",
  "statements.page.preview.ready": "Listo",
  "statements.page.preview.fallbackKind": "Extracto de cuenta",
  "statements.page.preview.selectKind": "Seleccione tipo",

  "statements.page.history.refreshAria": "Actualizar",
  "statements.page.history.empty": "Aún no hay extractos.",
  "statements.page.history.count": "{count} documentos",
  "statements.page.history.pdf": "Descargar",

  "statements.period.q-current": "Trimestre actual",
  "statements.period.month-current": "Mes actual",
  "statements.period.year-2026": "Año 2026",
  "statements.period.year-2025": "Año 2025",
  "statements.period.yearLabel": "Año {year}",

  "statements.kind.monthly_wallet_statement": "Extracto mensual de cartera",
  "statements.kind.annual_income_statement": "Certificado anual de ingresos",
  "statements.kind.trading_summary": "Resumen de operaciones",
  "statements.kind.payouts_summary": "Resumen de pagos",
  "statements.kind.fees_paid_summary": "Resumen de comisiones",
  "statements.kind.realized_pnl_summary": "Resumen de PnL realizado",
  "statements.kind.deposits_withdrawals_summary": "Depósitos y retiros",
  "statements.kind.wallet_statement": "Extracto de cartera",

  "statements.kind.monthly_wallet_statement.disclaimer":
    "Resumen de depósitos, cargos y saldo USDT del mes seleccionado.",
  "statements.kind.annual_income_statement.disclaimer":
    "Devengos por lanzamiento y totales del año natural — para registro personal.",
  "statements.kind.trading_summary.disclaimer":
    "Compras UNT y operaciones en mercado secundario del periodo.",
  "statements.kind.payouts_summary.disclaimer":
    "Abonos por participación en ingresos y retiros USDT (TRC20).",
  "statements.kind.fees_paid_summary.disclaimer":
    "Comisiones de plataforma y mercado secundario del periodo seleccionado.",
  "statements.kind.realized_pnl_summary.disclaimer":
    "Beneficio y pérdida realizados en posiciones del periodo.",
  "statements.kind.deposits_withdrawals_summary.disclaimer":
    "Depósitos y retiros USDT (TRC20) del periodo seleccionado.",
  "statements.kind.wallet_statement.disclaimer":
    "Extracto completo de cartera: saldo, operaciones y estados del periodo.",

  "statements.status.queued": "En cola",
  "statements.status.running": "Generando",
  "statements.status.completed": "Listo",
  "statements.status.failed": "Error",
  "statements.status.expired": "Expirado",
  "statements.status.ready": "Listo",

  "statements.step.accepted": "Solicitud recibida",
  "statements.step.collecting": "Recopilando operaciones",
  "statements.step.pdf": "Generando PDF",
  "statements.step.downloadReady": "Listo para descargar",

  "statements.preview.platformTagline": "Plataforma de participaciones en activos musicales",
  "statements.preview.referenceLabel": "Certificado",
  "statements.preview.reportingPeriod": "Periodo de informe: {period}",
  "statements.preview.stamp.confirmed": "Confirmado",
  "statements.preview.stamp.generating": "Generando",
  "statements.preview.stamp.error": "Error",
  "statements.preview.stamp.preview": "Vista previa",
  "statements.preview.holder": "Titular",
  "statements.preview.period": "Periodo",
  "statements.preview.currency": "Moneda",
  "statements.preview.currencyValue": "USDT · TRC20",
  "statements.preview.opsInPeriod": "Operaciones en el periodo",
  "statements.preview.summaryTitle": "Resumen de cuenta",
  "statements.preview.availableBalance": "Saldo disponible a la fecha",
  "statements.preview.inflow": "Depósitos en el periodo",
  "statements.preview.outflow": "Cargos en el periodo",
  "statements.preview.idleHint":
    "Pulse «Generar extracto» — el documento se creará en PDF con el mismo diseño y firma de la plataforma.",
  "statements.preview.generatingHint": "Recopilando operaciones del ledger y preparando PDF…",
  "statements.preview.downloadPdf": "Descargar PDF",
  "statements.preview.footerDisclaimer":
    "Documento generado automáticamente a partir del ledger interno de Spliton. No es asesoramiento fiscal ni legal.",
  "statements.preview.footerContact": "spliton.io · treasury@spliton.io",
  "statements.preview.spliton": "Spliton",
  "statements.preview.logoAlt": "Spliton",

  "statements.errors.loadKindsFailed": "No se pudieron cargar los tipos de extracto",
  "statements.errors.loadDataFailed": "No se pudieron cargar los datos",
  "statements.errors.loadHistoryFailed": "No se pudo cargar el historial",
  "statements.errors.requestFailed": "No se pudo solicitar el extracto",
  "statements.errors.requestGeneric": "Error de solicitud",
  "statements.errors.getStatusFailed": "No se pudo obtener el estado",
  "statements.errors.demoPdfHint": "En modo demo el PDF se genera en el servidor tras iniciar sesión.",
  "statements.errors.downloadFailed": "No se pudo descargar el documento",
};

const PT: Record<string, string> = {
  "statements.page.header.title": "Extratos e certificados",
  "statements.page.subtitle": "Certificados de operações em USDT. Ficheiros prontos em {documents}.",
  "statements.page.header.documentsLink": "documentos",

  "statements.tab.request": "Pedir",
  "statements.tab.history": "Prontos",

  "statements.page.request.loadingKinds": "A carregar…",
  "statements.page.request.retry": "Repetir",
  "statements.page.request.noKinds": "Os tipos de extrato ainda não estão disponíveis.",
  "statements.page.request.demoHint": "Demo: PDF disponível após iniciar sessão.",
  "statements.page.request.kindLabel": "Tipo",
  "statements.page.request.kindPlaceholder": "Selecione tipo",
  "statements.page.request.periodLabel": "Período",
  "statements.page.request.submitting": "A enviar…",
  "statements.page.request.submit": "Gerar PDF",
  "statements.page.request.hint": "O documento é gerado em segundo plano, normalmente 1–3 minutos.",

  "statements.page.preview.title": "Pré-visualização do extrato",
  "statements.page.preview.generating": "A gerar",
  "statements.page.preview.ready": "Pronto",
  "statements.page.preview.fallbackKind": "Extrato de conta",
  "statements.page.preview.selectKind": "Selecione tipo",

  "statements.page.history.refreshAria": "Atualizar",
  "statements.page.history.empty": "Ainda não há extratos.",
  "statements.page.history.count": "{count} documentos",
  "statements.page.history.pdf": "Descarregar",

  "statements.period.q-current": "Trimestre atual",
  "statements.period.month-current": "Mês atual",
  "statements.period.year-2026": "Ano 2026",
  "statements.period.year-2025": "Ano 2025",
  "statements.period.yearLabel": "Ano {year}",

  "statements.kind.monthly_wallet_statement": "Extrato mensal da carteira",
  "statements.kind.annual_income_statement": "Certificado anual de rendimentos",
  "statements.kind.trading_summary": "Resumo de operações",
  "statements.kind.payouts_summary": "Resumo de pagamentos",
  "statements.kind.fees_paid_summary": "Resumo de taxas",
  "statements.kind.realized_pnl_summary": "Resumo de PnL realizado",
  "statements.kind.deposits_withdrawals_summary": "Depósitos e levantamentos",
  "statements.kind.wallet_statement": "Extrato da carteira",

  "statements.kind.monthly_wallet_statement.disclaimer":
    "Resumo de depósitos, débitos e saldo USDT do mês selecionado.",
  "statements.kind.annual_income_statement.disclaimer":
    "Accruals por lançamento e totais do ano civil — para registo pessoal.",
  "statements.kind.trading_summary.disclaimer":
    "Compras UNT e operações no mercado secundário do período.",
  "statements.kind.payouts_summary.disclaimer":
    "Créditos por participação nos rendimentos e levantamentos USDT (TRC20).",
  "statements.kind.fees_paid_summary.disclaimer":
    "Taxas da plataforma e mercado secundário do período selecionado.",
  "statements.kind.realized_pnl_summary.disclaimer":
    "Lucro e perda realizados nas posições do período.",
  "statements.kind.deposits_withdrawals_summary.disclaimer":
    "Depósitos e levantamentos USDT (TRC20) do período selecionado.",
  "statements.kind.wallet_statement.disclaimer":
    "Extrato completo da carteira: saldo, operações e estados do período.",

  "statements.status.queued": "Em fila",
  "statements.status.running": "A gerar",
  "statements.status.completed": "Pronto",
  "statements.status.failed": "Erro",
  "statements.status.expired": "Expirado",
  "statements.status.ready": "Pronto",

  "statements.step.accepted": "Pedido recebido",
  "statements.step.collecting": "A recolher operações",
  "statements.step.pdf": "A gerar PDF",
  "statements.step.downloadReady": "Pronto para descarregar",

  "statements.preview.platformTagline": "Plataforma de participações em ativos musicais",
  "statements.preview.referenceLabel": "Certificado",
  "statements.preview.reportingPeriod": "Período de referência: {period}",
  "statements.preview.stamp.confirmed": "Confirmado",
  "statements.preview.stamp.generating": "A gerar",
  "statements.preview.stamp.error": "Erro",
  "statements.preview.stamp.preview": "Pré-visualização",
  "statements.preview.holder": "Titular",
  "statements.preview.period": "Período",
  "statements.preview.currency": "Moeda",
  "statements.preview.currencyValue": "USDT · TRC20",
  "statements.preview.opsInPeriod": "Operações no período",
  "statements.preview.summaryTitle": "Resumo da conta",
  "statements.preview.availableBalance": "Saldo disponível na data",
  "statements.preview.inflow": "Depósitos no período",
  "statements.preview.outflow": "Débitos no período",
  "statements.preview.idleHint":
    "Clique «Gerar extrato» — o documento será produzido em PDF com o mesmo layout e assinatura da plataforma.",
  "statements.preview.generatingHint": "A recolher operações do ledger e a preparar PDF…",
  "statements.preview.downloadPdf": "Descarregar PDF",
  "statements.preview.footerDisclaimer":
    "Documento gerado automaticamente a partir do ledger interno Spliton. Não é aconselhamento fiscal ou jurídico.",
  "statements.preview.footerContact": "spliton.io · treasury@spliton.io",
  "statements.preview.spliton": "Spliton",
  "statements.preview.logoAlt": "Spliton",

  "statements.errors.loadKindsFailed": "Não foi possível carregar os tipos de extrato",
  "statements.errors.loadDataFailed": "Não foi possível carregar os dados",
  "statements.errors.loadHistoryFailed": "Não foi possível carregar o histórico",
  "statements.errors.requestFailed": "Não foi possível pedir o extrato",
  "statements.errors.requestGeneric": "Erro no pedido",
  "statements.errors.getStatusFailed": "Não foi possível obter o estado",
  "statements.errors.demoPdfHint": "Em modo demo o PDF é gerado no servidor após iniciar sessão.",
  "statements.errors.downloadFailed": "Não foi possível descarregar o documento",
};

export const STATEMENTS_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
