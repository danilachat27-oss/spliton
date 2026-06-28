import { localeMessage } from "./normalize-locale";
import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.disputes.title": "Споры",
  "meta.disputes.description":
    "Центр споров Spliton: оспорить зачисление, вывод, сделку или документ. Статусы обращений и переписка с compliance.",
  "meta.disputes.detail.title": "Тикет спора",
  "meta.disputes.detail.description": "Детали обращения в центр споров Spliton: описание, статус и переписка.",

  "disputes.breadcrumb": "Кабинет · Центр споров",
  "disputes.title": "Споры",
  "disputes.subtitle": "Оспорьте операцию с расхождением. Общие вопросы — в",
  "disputes.subtitleSupportLink": "поддержку",
  "disputes.signInPrompt": "Войдите, чтобы создавать и отслеживать споры.",

  "disputes.tab.list": "Мои споры",
  "disputes.tab.create": "Создать спор",

  "disputes.metrics.total": "Всего",
  "disputes.metrics.active": "В работе",
  "disputes.metrics.resolved": "Решено",

  "disputes.create.typeLabel": "Тип",
  "disputes.create.subjectLabel": "Тема",
  "disputes.create.subjectPlaceholder": "Расхождение по выводу USDT",
  "disputes.create.descriptionLabel": "Описание",
  "disputes.create.descriptionPlaceholder": "Дата, сумма USDT, tx hash, что пошло не так",
  "disputes.create.submit": "Создать спор",
  "disputes.create.submitting": "Отправка…",
  "disputes.create.hint": "Ответ compliance — до 5 рабочих дней.",

  "disputes.preview.title": "Предпросмотр обращения",
  "disputes.preview.draft": "Черновик",

  "disputes.list.title": "Мои споры",
  "disputes.list.subtitle": "История обращений и текущие статусы.",
  "disputes.list.refreshAria": "Обновить",
  "disputes.list.empty": "Споров пока нет.",
  "disputes.list.open": "Открыть",

  "disputes.type.deposit_not_credited": "Пополнение не зачислено",
  "disputes.type.withdrawal_not_received": "Вывод не получен",
  "disputes.type.trade_dispute": "Спор по сделке",
  "disputes.type.payout_mismatch": "Несоответствие выплаты",
  "disputes.type.receipt_document_issue": "Документ / выписка",
  "disputes.type.account_security": "Безопасность аккаунта",
  "disputes.type.other": "Другое",
  "disputes.type.default": "Спор",

  "disputes.status.open": "Принят",
  "disputes.status.in_review": "На рассмотрении",
  "disputes.status.waiting_for_user": "Ожидает ваш ответ",
  "disputes.status.waiting_for_admin": "Проверка поддержкой",
  "disputes.status.escalated": "Эскалирован",
  "disputes.status.resolved": "Решён",
  "disputes.status.rejected": "Отклонён",
  "disputes.status.closed": "Закрыт",

  "disputes.error.loadFailed": "Не удалось загрузить споры",
  "disputes.error.createFailed": "Не удалось создать спор",
  "disputes.error.validation": "Укажите тему и описание (минимум 10 символов).",
  "disputes.error.notFound": "Спор не найден",
  "disputes.error.messageFailed": "Не удалось отправить сообщение",

  "disputes.detail.back": "← Все споры",
  "disputes.detail.signInPrompt": "Войдите в аккаунт для просмотра спора.",
  "disputes.detail.ticketLabel": "Тикет спора",
  "disputes.detail.conversation": "Переписка",
  "disputes.detail.noMessages": "Сообщений пока нет",
  "disputes.detail.authorSupport": "Поддержка",
  "disputes.detail.authorYou": "Вы",
  "disputes.detail.replyPlaceholder": "Добавить сообщение",
  "disputes.detail.sending": "Отправка…",

  "disputes.doc.centerLabel": "Центр споров · Compliance",
  "disputes.doc.ticketLabel": "Тикет",
  "disputes.doc.heading": "Обращение в центр споров",
  "disputes.doc.applicant": "Заявитель",
  "disputes.doc.category": "Категория",
  "disputes.doc.submittedAt": "Дата подачи",
  "disputes.doc.responseDue": "Срок ответа",
  "disputes.doc.responseDueDefault": "до 5 раб. дней",
  "disputes.doc.contentHeading": "Содержание обращения",
  "disputes.doc.subjectLabel": "Тема",
  "disputes.doc.descriptionLabel": "Описание",
  "disputes.doc.amountLabel": "Сумма в споре",
  "disputes.doc.ticketNumberLabel": "Номер тикета",
  "disputes.doc.openConversation": "Открыть переписку",
  "disputes.doc.draftHint":
    "Заполните форму слева и нажмите «Создать спор» — обращение будет зарегистрировано с этим оформлением.",
  "disputes.doc.closedNotice":
    "Спор закрыт. Решение и переписка доступны в деталях обращения.",
  "disputes.doc.processingNotice": "Проверка treasury, ledger и материалов операции…",
  "disputes.doc.waitingUserNotice": "Требуется ваш ответ — откройте переписку по тикету.",
  "disputes.doc.footer":
    "Обращение рассматривается командой compliance Spliton. Не заменяет юридическую консультацию. Для общих вопросов используйте поддержку.",

  "disputes.doc.stamp.draft": "Черновик",
  "disputes.doc.stamp.rejected": "Отклонено",
  "disputes.doc.stamp.resolved": "Решено",
  "disputes.doc.stamp.closed": "Закрыто",
  "disputes.doc.stamp.waiting_for_user": "Ожидает ответа",
  "disputes.doc.stamp.escalated": "Эскалировано",
  "disputes.doc.stamp.waiting_for_admin": "Проверка",
  "disputes.doc.stamp.in_review": "На рассмотрении",
  "disputes.doc.stamp.open": "Принято",

  "disputes.doc.placeholder.date": "Присваивается после отправки",
  "disputes.doc.placeholder.subject": "Например: расхождение по выводу USDT",
  "disputes.doc.placeholder.description": "Опишите ситуацию: дата операции, сумма, tx hash…",
  "disputes.doc.placeholder.amount": "Не указана",
  "disputes.doc.placeholder.holder": "Данные из вашего профиля",
  "disputes.doc.placeholder.noSubject": "Тема не указана",
  "disputes.doc.placeholder.noDescription": "Описание не указано",

  "disputes.step.accepted": "Принято",
  "disputes.step.review": "Проверка",
  "disputes.step.response": "Ответ",
  "disputes.step.resolution": "Решение",
};

const EN: Record<string, string> = {
  "meta.disputes.title": "Disputes",
  "meta.disputes.description":
    "Spliton dispute center: challenge a deposit, withdrawal, trade, or document. Ticket status and compliance correspondence.",
  "meta.disputes.detail.title": "Dispute ticket",
  "meta.disputes.detail.description":
    "Spliton dispute center ticket details: description, status, and conversation.",

  "disputes.breadcrumb": "Dashboard · Dispute center",
  "disputes.title": "Disputes",
  "disputes.subtitle": "Challenge an operation that did not match expectations. General questions —",
  "disputes.subtitleSupportLink": "support",
  "disputes.signInPrompt": "Sign in to create and track disputes.",

  "disputes.tab.list": "My disputes",
  "disputes.tab.create": "Open dispute",

  "disputes.metrics.total": "Total",
  "disputes.metrics.active": "In progress",
  "disputes.metrics.resolved": "Resolved",

  "disputes.create.typeLabel": "Type",
  "disputes.create.subjectLabel": "Subject",
  "disputes.create.subjectPlaceholder": "USDT withdrawal discrepancy",
  "disputes.create.descriptionLabel": "Description",
  "disputes.create.descriptionPlaceholder": "Date, USDT amount, tx hash, what went wrong",
  "disputes.create.submit": "Create dispute",
  "disputes.create.submitting": "Submitting…",
  "disputes.create.hint": "Compliance reply within 5 business days.",

  "disputes.preview.title": "Ticket preview",
  "disputes.preview.draft": "Draft",

  "disputes.list.title": "My disputes",
  "disputes.list.subtitle": "Ticket history and current statuses.",
  "disputes.list.refreshAria": "Refresh",
  "disputes.list.empty": "No disputes yet.",
  "disputes.list.open": "Open",

  "disputes.type.deposit_not_credited": "Deposit not credited",
  "disputes.type.withdrawal_not_received": "Withdrawal not received",
  "disputes.type.trade_dispute": "Trade dispute",
  "disputes.type.payout_mismatch": "Payout mismatch",
  "disputes.type.receipt_document_issue": "Document / statement",
  "disputes.type.account_security": "Account security",
  "disputes.type.other": "Other",
  "disputes.type.default": "Dispute",

  "disputes.status.open": "Received",
  "disputes.status.in_review": "Under review",
  "disputes.status.waiting_for_user": "Awaiting your reply",
  "disputes.status.waiting_for_admin": "Support review",
  "disputes.status.escalated": "Escalated",
  "disputes.status.resolved": "Resolved",
  "disputes.status.rejected": "Rejected",
  "disputes.status.closed": "Closed",

  "disputes.error.loadFailed": "Could not load disputes",
  "disputes.error.createFailed": "Could not create dispute",
  "disputes.error.validation": "Enter a subject and description (at least 10 characters).",
  "disputes.error.notFound": "Dispute not found",
  "disputes.error.messageFailed": "Could not send message",

  "disputes.detail.back": "← All disputes",
  "disputes.detail.signInPrompt": "Sign in to view this dispute.",
  "disputes.detail.ticketLabel": "Dispute ticket",
  "disputes.detail.conversation": "Conversation",
  "disputes.detail.noMessages": "No messages yet",
  "disputes.detail.authorSupport": "Support",
  "disputes.detail.authorYou": "You",
  "disputes.detail.replyPlaceholder": "Add a message",
  "disputes.detail.sending": "Sending…",

  "disputes.doc.centerLabel": "Dispute center · Compliance",
  "disputes.doc.ticketLabel": "Ticket",
  "disputes.doc.heading": "Dispute center request",
  "disputes.doc.applicant": "Applicant",
  "disputes.doc.category": "Category",
  "disputes.doc.submittedAt": "Submitted",
  "disputes.doc.responseDue": "Response due",
  "disputes.doc.responseDueDefault": "within 5 business days",
  "disputes.doc.contentHeading": "Request details",
  "disputes.doc.subjectLabel": "Subject",
  "disputes.doc.descriptionLabel": "Description",
  "disputes.doc.amountLabel": "Amount in dispute",
  "disputes.doc.ticketNumberLabel": "Ticket number",
  "disputes.doc.openConversation": "Open conversation",
  "disputes.doc.draftHint":
    "Fill in the form on the left and click Create dispute — the ticket will be registered with this layout.",
  "disputes.doc.closedNotice":
    "Dispute closed. Resolution and conversation are available in ticket details.",
  "disputes.doc.processingNotice": "Reviewing treasury, ledger, and operation records…",
  "disputes.doc.waitingUserNotice": "Your reply is required — open the ticket conversation.",
  "disputes.doc.footer":
    "Handled by the Spliton compliance team. Not legal advice. Use support for general questions.",

  "disputes.doc.stamp.draft": "Draft",
  "disputes.doc.stamp.rejected": "Rejected",
  "disputes.doc.stamp.resolved": "Resolved",
  "disputes.doc.stamp.closed": "Closed",
  "disputes.doc.stamp.waiting_for_user": "Awaiting reply",
  "disputes.doc.stamp.escalated": "Escalated",
  "disputes.doc.stamp.waiting_for_admin": "Review",
  "disputes.doc.stamp.in_review": "Under review",
  "disputes.doc.stamp.open": "Received",

  "disputes.doc.placeholder.date": "Assigned after submission",
  "disputes.doc.placeholder.subject": "e.g. USDT withdrawal discrepancy",
  "disputes.doc.placeholder.description": "Describe the situation: operation date, amount, tx hash…",
  "disputes.doc.placeholder.amount": "Not specified",
  "disputes.doc.placeholder.holder": "From your profile",
  "disputes.doc.placeholder.noSubject": "No subject",
  "disputes.doc.placeholder.noDescription": "No description",

  "disputes.step.accepted": "Received",
  "disputes.step.review": "Review",
  "disputes.step.response": "Reply",
  "disputes.step.resolution": "Resolution",
};

const ES: Record<string, string> = {
  "meta.disputes.title": "Disputas",
  "meta.disputes.description":
    "Centro de disputas Spliton: impugnar un depósito, retiro, operación o documento. Estado del ticket y correspondencia con compliance.",
  "meta.disputes.detail.title": "Ticket de disputa",
  "meta.disputes.detail.description":
    "Detalles del ticket en el centro de disputas Spliton: descripción, estado y conversación.",

  "disputes.breadcrumb": "Panel · Centro de disputas",
  "disputes.title": "Disputas",
  "disputes.subtitle": "Impugne una operación con discrepancia. Preguntas generales —",
  "disputes.subtitleSupportLink": "soporte",
  "disputes.signInPrompt": "Inicie sesión para crear y seguir disputas.",

  "disputes.tab.list": "Mis disputas",
  "disputes.tab.create": "Crear disputa",

  "disputes.metrics.total": "Total",
  "disputes.metrics.active": "En curso",
  "disputes.metrics.resolved": "Resueltas",

  "disputes.create.typeLabel": "Tipo",
  "disputes.create.subjectLabel": "Asunto",
  "disputes.create.subjectPlaceholder": "Discrepancia en retiro USDT",
  "disputes.create.descriptionLabel": "Descripción",
  "disputes.create.descriptionPlaceholder": "Fecha, importe USDT, tx hash, qué salió mal",
  "disputes.create.submit": "Crear disputa",
  "disputes.create.submitting": "Enviando…",
  "disputes.create.hint": "Respuesta de compliance en hasta 5 días hábiles.",

  "disputes.preview.title": "Vista previa del ticket",
  "disputes.preview.draft": "Borrador",

  "disputes.list.title": "Mis disputas",
  "disputes.list.subtitle": "Historial de tickets y estados actuales.",
  "disputes.list.refreshAria": "Actualizar",
  "disputes.list.empty": "Aún no hay disputas.",
  "disputes.list.open": "Abrir",

  "disputes.type.deposit_not_credited": "Depósito no acreditado",
  "disputes.type.withdrawal_not_received": "Retiro no recibido",
  "disputes.type.trade_dispute": "Disputa por operación",
  "disputes.type.payout_mismatch": "Discrepancia de pago",
  "disputes.type.receipt_document_issue": "Documento / extracto",
  "disputes.type.account_security": "Seguridad de la cuenta",
  "disputes.type.other": "Otro",
  "disputes.type.default": "Disputa",

  "disputes.status.open": "Recibido",
  "disputes.status.in_review": "En revisión",
  "disputes.status.waiting_for_user": "Espera su respuesta",
  "disputes.status.waiting_for_admin": "Revisión de soporte",
  "disputes.status.escalated": "Escalado",
  "disputes.status.resolved": "Resuelto",
  "disputes.status.rejected": "Rechazado",
  "disputes.status.closed": "Cerrado",

  "disputes.error.loadFailed": "No se pudieron cargar las disputas",
  "disputes.error.createFailed": "No se pudo crear la disputa",
  "disputes.error.validation": "Indique asunto y descripción (mínimo 10 caracteres).",
  "disputes.error.notFound": "Disputa no encontrada",
  "disputes.error.messageFailed": "No se pudo enviar el mensaje",

  "disputes.detail.back": "← Todas las disputas",
  "disputes.detail.signInPrompt": "Inicie sesión para ver esta disputa.",
  "disputes.detail.ticketLabel": "Ticket de disputa",
  "disputes.detail.conversation": "Conversación",
  "disputes.detail.noMessages": "Aún no hay mensajes",
  "disputes.detail.authorSupport": "Soporte",
  "disputes.detail.authorYou": "Usted",
  "disputes.detail.replyPlaceholder": "Añadir mensaje",
  "disputes.detail.sending": "Enviando…",

  "disputes.doc.centerLabel": "Centro de disputas · Compliance",
  "disputes.doc.ticketLabel": "Ticket",
  "disputes.doc.heading": "Solicitud al centro de disputas",
  "disputes.doc.applicant": "Solicitante",
  "disputes.doc.category": "Categoría",
  "disputes.doc.submittedAt": "Fecha de envío",
  "disputes.doc.responseDue": "Plazo de respuesta",
  "disputes.doc.responseDueDefault": "hasta 5 días laborables",
  "disputes.doc.contentHeading": "Contenido de la solicitud",
  "disputes.doc.subjectLabel": "Asunto",
  "disputes.doc.descriptionLabel": "Descripción",
  "disputes.doc.amountLabel": "Importe en disputa",
  "disputes.doc.ticketNumberLabel": "Número de ticket",
  "disputes.doc.openConversation": "Abrir conversación",
  "disputes.doc.draftHint":
    "Complete el formulario a la izquierda y pulse Crear disputa — el ticket se registrará con este formato.",
  "disputes.doc.closedNotice":
    "Disputa cerrada. La resolución y la conversación están en los detalles del ticket.",
  "disputes.doc.processingNotice": "Revisando treasury, ledger y registros de la operación…",
  "disputes.doc.waitingUserNotice": "Se requiere su respuesta — abra la conversación del ticket.",
  "disputes.doc.footer":
    "Revisado por el equipo de compliance de Spliton. No es asesoramiento legal. Use soporte para preguntas generales.",

  "disputes.doc.stamp.draft": "Borrador",
  "disputes.doc.stamp.rejected": "Rechazado",
  "disputes.doc.stamp.resolved": "Resuelto",
  "disputes.doc.stamp.closed": "Cerrado",
  "disputes.doc.stamp.waiting_for_user": "Espera respuesta",
  "disputes.doc.stamp.escalated": "Escalado",
  "disputes.doc.stamp.waiting_for_admin": "Revisión",
  "disputes.doc.stamp.in_review": "En revisión",
  "disputes.doc.stamp.open": "Recibido",

  "disputes.doc.placeholder.date": "Se asigna tras el envío",
  "disputes.doc.placeholder.subject": "p. ej.: discrepancia en retiro USDT",
  "disputes.doc.placeholder.description": "Describa la situación: fecha, importe, tx hash…",
  "disputes.doc.placeholder.amount": "No indicado",
  "disputes.doc.placeholder.holder": "Datos de su perfil",
  "disputes.doc.placeholder.noSubject": "Sin asunto",
  "disputes.doc.placeholder.noDescription": "Sin descripción",

  "disputes.step.accepted": "Recibido",
  "disputes.step.review": "Revisión",
  "disputes.step.response": "Respuesta",
  "disputes.step.resolution": "Resolución",
};

const PT: Record<string, string> = {
  "meta.disputes.title": "Disputas",
  "meta.disputes.description":
    "Centro de disputas Spliton: contestar um depósito, saque, operação ou documento. Estado do ticket e correspondência com compliance.",
  "meta.disputes.detail.title": "Ticket de disputa",
  "meta.disputes.detail.description":
    "Detalhes do ticket no centro de disputas Spliton: descrição, estado e conversa.",

  "disputes.breadcrumb": "Painel · Centro de disputas",
  "disputes.title": "Disputas",
  "disputes.subtitle": "Conteste uma operação com discrepância. Questões gerais —",
  "disputes.subtitleSupportLink": "suporte",
  "disputes.signInPrompt": "Inicie sessão para criar e acompanhar disputas.",

  "disputes.tab.list": "As minhas disputas",
  "disputes.tab.create": "Criar disputa",

  "disputes.metrics.total": "Total",
  "disputes.metrics.active": "Em curso",
  "disputes.metrics.resolved": "Resolvidas",

  "disputes.create.typeLabel": "Tipo",
  "disputes.create.subjectLabel": "Assunto",
  "disputes.create.subjectPlaceholder": "Discrepância no saque USDT",
  "disputes.create.descriptionLabel": "Descrição",
  "disputes.create.descriptionPlaceholder": "Data, montante USDT, tx hash, o que correu mal",
  "disputes.create.submit": "Criar disputa",
  "disputes.create.submitting": "A enviar…",
  "disputes.create.hint": "Resposta de compliance em até 5 dias úteis.",

  "disputes.preview.title": "Pré-visualização do ticket",
  "disputes.preview.draft": "Rascunho",

  "disputes.list.title": "As minhas disputas",
  "disputes.list.subtitle": "Histórico de tickets e estados atuais.",
  "disputes.list.refreshAria": "Atualizar",
  "disputes.list.empty": "Ainda não há disputas.",
  "disputes.list.open": "Abrir",

  "disputes.type.deposit_not_credited": "Depósito não creditado",
  "disputes.type.withdrawal_not_received": "Saque não recebido",
  "disputes.type.trade_dispute": "Disputa de operação",
  "disputes.type.payout_mismatch": "Discrepância de pagamento",
  "disputes.type.receipt_document_issue": "Documento / extrato",
  "disputes.type.account_security": "Segurança da conta",
  "disputes.type.other": "Outro",
  "disputes.type.default": "Disputa",

  "disputes.status.open": "Recebido",
  "disputes.status.in_review": "Em análise",
  "disputes.status.waiting_for_user": "Aguarda a sua resposta",
  "disputes.status.waiting_for_admin": "Análise do suporte",
  "disputes.status.escalated": "Escalado",
  "disputes.status.resolved": "Resolvido",
  "disputes.status.rejected": "Rejeitado",
  "disputes.status.closed": "Fechado",

  "disputes.error.loadFailed": "Não foi possível carregar as disputas",
  "disputes.error.createFailed": "Não foi possível criar a disputa",
  "disputes.error.validation": "Indique assunto e descrição (mínimo 10 caracteres).",
  "disputes.error.notFound": "Disputa não encontrada",
  "disputes.error.messageFailed": "Não foi possível enviar a mensagem",

  "disputes.detail.back": "← Todas as disputas",
  "disputes.detail.signInPrompt": "Inicie sessão para ver esta disputa.",
  "disputes.detail.ticketLabel": "Ticket de disputa",
  "disputes.detail.conversation": "Conversa",
  "disputes.detail.noMessages": "Ainda não há mensagens",
  "disputes.detail.authorSupport": "Suporte",
  "disputes.detail.authorYou": "Você",
  "disputes.detail.replyPlaceholder": "Adicionar mensagem",
  "disputes.detail.sending": "A enviar…",

  "disputes.doc.centerLabel": "Centro de disputas · Compliance",
  "disputes.doc.ticketLabel": "Ticket",
  "disputes.doc.heading": "Pedido ao centro de disputas",
  "disputes.doc.applicant": "Requerente",
  "disputes.doc.category": "Categoria",
  "disputes.doc.submittedAt": "Data de submissão",
  "disputes.doc.responseDue": "Prazo de resposta",
  "disputes.doc.responseDueDefault": "até 5 dias úteis",
  "disputes.doc.contentHeading": "Conteúdo do pedido",
  "disputes.doc.subjectLabel": "Assunto",
  "disputes.doc.descriptionLabel": "Descrição",
  "disputes.doc.amountLabel": "Montante em disputa",
  "disputes.doc.ticketNumberLabel": "Número do ticket",
  "disputes.doc.openConversation": "Abrir conversa",
  "disputes.doc.draftHint":
    "Preencha o formulário à esquerda e clique em Criar disputa — o ticket será registado com este layout.",
  "disputes.doc.closedNotice":
    "Disputa fechada. A resolução e a conversa estão nos detalhes do ticket.",
  "disputes.doc.processingNotice": "A analisar treasury, ledger e registos da operação…",
  "disputes.doc.waitingUserNotice": "É necessária a sua resposta — abra a conversa do ticket.",
  "disputes.doc.footer":
    "Analisado pela equipa de compliance Spliton. Não é aconselhamento jurídico. Use suporte para questões gerais.",

  "disputes.doc.stamp.draft": "Rascunho",
  "disputes.doc.stamp.rejected": "Rejeitado",
  "disputes.doc.stamp.resolved": "Resolvido",
  "disputes.doc.stamp.closed": "Fechado",
  "disputes.doc.stamp.waiting_for_user": "Aguarda resposta",
  "disputes.doc.stamp.escalated": "Escalado",
  "disputes.doc.stamp.waiting_for_admin": "Análise",
  "disputes.doc.stamp.in_review": "Em análise",
  "disputes.doc.stamp.open": "Recebido",

  "disputes.doc.placeholder.date": "Atribuído após envio",
  "disputes.doc.placeholder.subject": "ex.: discrepância no saque USDT",
  "disputes.doc.placeholder.description": "Descreva a situação: data, montante, tx hash…",
  "disputes.doc.placeholder.amount": "Não indicado",
  "disputes.doc.placeholder.holder": "Dados do seu perfil",
  "disputes.doc.placeholder.noSubject": "Sem assunto",
  "disputes.doc.placeholder.noDescription": "Sem descrição",

  "disputes.step.accepted": "Recebido",
  "disputes.step.review": "Análise",
  "disputes.step.response": "Resposta",
  "disputes.step.resolution": "Resolução",
};

export const DISPUTE_TYPE_VALUES = [
  "deposit_not_credited",
  "withdrawal_not_received",
  "trade_dispute",
  "payout_mismatch",
  "receipt_document_issue",
  "account_security",
  "other",
] as const;

export type DisputeTypeValue = (typeof DISPUTE_TYPE_VALUES)[number];

export const DISPUTES_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};

export function disputeTypeLabel(type: string, locale: AppLocale): string {
  const key = `disputes.type.${type}`;
  return localeMessage(
    DISPUTES_MESSAGES,
    locale,
    key,
    localeMessage(DISPUTES_MESSAGES, locale, "disputes.type.default"),
  );
}

export function disputeStatusLabel(status: string, locale: AppLocale): string {
  const key = `disputes.status.${status}`;
  return localeMessage(DISPUTES_MESSAGES, locale, key, status.replace(/_/g, " "));
}

export function disputeStampLabel(status: string | undefined, draft: boolean | undefined, locale: AppLocale): string {
  if (draft || !status) return localeMessage(DISPUTES_MESSAGES, locale, "disputes.doc.stamp.draft");
  const key = `disputes.doc.stamp.${status}`;
  return localeMessage(DISPUTES_MESSAGES, locale, key) || disputeStatusLabel(status, locale);
}
