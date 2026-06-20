import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.documents.title": "Документы",
  "meta.documents.description":
    "Квитанции по сделкам, депозитам, выплатам и выписки Spliton в личном кабинете.",
  "documents.page.title": "Документы и квитанции",
  "documents.page.subtitle":
    "Квитанции по сделкам, депозитам, выплатам и выписки — только ваши документы.",
  "documents.loading": "Загрузка…",
  "documents.loadError": "Не удалось загрузить документы",
  "documents.downloadError": "Не удалось скачать документ",
  "documents.genericError": "Ошибка загрузки",
  "documents.empty":
    "Документов пока нет. Они появятся после депозита, покупки или выплаты.",
  "documents.download": "Скачать",
  "documents.downloading": "Скачивание…",
  "documents.signInRequired": "Войдите в аккаунт, чтобы увидеть документы.",
  "documents.liveRequired": "Документы доступны в live-режиме аккаунта.",

  "documents.kind.TRADE_RECEIPT": "Сделка",
  "documents.kind.PRIMARY_ORDER_RECEIPT": "Покупка UNT",
  "documents.kind.DEPOSIT_RECEIPT": "Депозит",
  "documents.kind.WALLET_STATEMENT": "Выписка",
  "documents.kind.PAYOUT_RECEIPT": "Выплата",
};

const EN: Record<string, string> = {
  "meta.documents.title": "Documents",
  "meta.documents.description":
    "Trade, deposit, payout receipts and Spliton statements in your account.",
  "documents.page.title": "Documents & receipts",
  "documents.page.subtitle":
    "Trade, deposit, payout receipts and statements — your documents only.",
  "documents.loading": "Loading…",
  "documents.loadError": "Could not load documents",
  "documents.downloadError": "Could not download document",
  "documents.genericError": "Loading error",
  "documents.empty":
    "No documents yet. They appear after a deposit, purchase, or payout.",
  "documents.download": "Download",
  "documents.downloading": "Downloading…",
  "documents.signInRequired": "Sign in to view your documents.",
  "documents.liveRequired": "Documents are available in live account mode.",

  "documents.kind.TRADE_RECEIPT": "Trade",
  "documents.kind.PRIMARY_ORDER_RECEIPT": "UNT purchase",
  "documents.kind.DEPOSIT_RECEIPT": "Deposit",
  "documents.kind.WALLET_STATEMENT": "Statement",
  "documents.kind.PAYOUT_RECEIPT": "Payout",
};

const ES: Record<string, string> = {
  "meta.documents.title": "Documentos",
  "meta.documents.description":
    "Recibos de operaciones, depósitos, pagos y extractos Spliton en su cuenta.",
  "documents.page.title": "Documentos y recibos",
  "documents.page.subtitle":
    "Recibos de operaciones, depósitos, pagos y extractos — solo sus documentos.",
  "documents.loading": "Cargando…",
  "documents.loadError": "No se pudieron cargar los documentos",
  "documents.downloadError": "No se pudo descargar el documento",
  "documents.genericError": "Error de carga",
  "documents.empty":
    "Aún no hay documentos. Aparecerán tras un depósito, compra o pago.",
  "documents.download": "Descargar",
  "documents.downloading": "Descargando…",
  "documents.signInRequired": "Inicie sesión para ver sus documentos.",
  "documents.liveRequired": "Los documentos están disponibles en modo live de la cuenta.",

  "documents.kind.TRADE_RECEIPT": "Operación",
  "documents.kind.PRIMARY_ORDER_RECEIPT": "Compra UNT",
  "documents.kind.DEPOSIT_RECEIPT": "Depósito",
  "documents.kind.WALLET_STATEMENT": "Extracto",
  "documents.kind.PAYOUT_RECEIPT": "Pago",
};

const PT: Record<string, string> = {
  "meta.documents.title": "Documentos",
  "meta.documents.description":
    "Recibos de negócios, depósitos, pagamentos e extratos Spliton na sua conta.",
  "documents.page.title": "Documentos e recibos",
  "documents.page.subtitle":
    "Recibos de negócios, depósitos, pagamentos e extratos — apenas os seus documentos.",
  "documents.loading": "A carregar…",
  "documents.loadError": "Não foi possível carregar os documentos",
  "documents.downloadError": "Não foi possível transferir o documento",
  "documents.genericError": "Erro de carregamento",
  "documents.empty":
    "Ainda não há documentos. Aparecerão após um depósito, compra ou pagamento.",
  "documents.download": "Transferir",
  "documents.downloading": "A transferir…",
  "documents.signInRequired": "Inicie sessão para ver os seus documentos.",
  "documents.liveRequired": "Os documentos estão disponíveis no modo live da conta.",

  "documents.kind.TRADE_RECEIPT": "Negócio",
  "documents.kind.PRIMARY_ORDER_RECEIPT": "Compra UNT",
  "documents.kind.DEPOSIT_RECEIPT": "Depósito",
  "documents.kind.WALLET_STATEMENT": "Extrato",
  "documents.kind.PAYOUT_RECEIPT": "Pagamento",
};

export const DOCUMENTS_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};
