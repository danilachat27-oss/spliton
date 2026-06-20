import type { AppLocale } from "./types";

const RU: Record<string, string> = {
  "meta.systemStatus.title": "Статус системы",
  "meta.systemStatus.description":
    "Состояние сервисов Spliton: пополнения и вывод USDT (TRC20), выплаты, вторичный рынок, ордера и поддержка.",

  "systemStatus.hero.title": "Статус системы",
  "systemStatus.hero.subtitle":
    "Пополнения, выводы, выплаты и вторичный рынок — в одном статус-контуре.",

  "systemStatus.error.live":
    "Не удалось загрузить статус с API. Убедитесь, что backend запущен.",
  "systemStatus.error.demo": "Не удалось загрузить статус. Попробуйте обновить страницу.",
  "systemStatus.retry": "Повторить",

  "systemStatus.services.title": "Статус сервисов",
  "systemStatus.services.liveMeta": "{count} компонентов · данные API · обновление каждые 30 сек",
  "systemStatus.services.demoMeta": "Реальное время · пользовательский контур Spliton (демо)",
  "systemStatus.services.searchPlaceholder": "Поиск сервиса",
  "systemStatus.services.col.service": "Сервис",
  "systemStatus.services.col.status": "Статус",
  "systemStatus.services.col.uptime": "Uptime",
  "systemStatus.services.col.maintenance": "Обслуживание",
  "systemStatus.services.emptySearch": "Ничего не найдено по запросу «{query}».",
  "systemStatus.services.maintenanceScheduled": "Запланировано",

  "systemStatus.maintenance.title": "Плановые работы",
  "systemStatus.maintenance.subtitle": "Ближайшие окна и влияние на операции.",
  "systemStatus.maintenance.badge": "Техработы",
  "systemStatus.maintenance.affected": "Затронуто: {services}",
  "systemStatus.maintenance.none":
    "Запланированных работ нет. Окна профилактики появятся здесь заранее.",

  "systemStatus.incidents.title": "Недавние события",
  "systemStatus.incidents.subtitle": "Инциденты и закрытые кейсы.",
  "systemStatus.incidents.col.event": "Событие",
  "systemStatus.incidents.col.status": "Статус",
  "systemStatus.incidents.col.date": "Дата",
  "systemStatus.incidents.emptyLive":
    "Активных инцидентов нет. Закрытые события появятся здесь после публикации.",
  "systemStatus.incidents.emptyDemo": "Нет событий для отображения.",

  "systemStatus.legend.title": "Как читать статусы",
  "systemStatus.legend.operational.title": "Работает",
  "systemStatus.legend.operational.desc": "Сервис доступен в штатном режиме.",
  "systemStatus.legend.degraded.title": "Задержки",
  "systemStatus.legend.degraded.desc": "Операции выполняются, но медленнее обычного.",
  "systemStatus.legend.maintenance.title": "Техработы",
  "systemStatus.legend.maintenance.desc": "Плановое окно обслуживания или ограниченный режим.",
  "systemStatus.legend.outage.title": "Инцидент",
  "systemStatus.legend.outage.desc": "Сервис недоступен или критически ограничен.",

  "systemStatus.help.title": "Нужна помощь?",
  "systemStatus.help.body":
    "Если операция длится дольше, чем в интерфейсе, откройте центр поддержки.",
  "systemStatus.help.cta": "Центр поддержки",

  "systemStatus.serviceStatus.operational": "Работает",
  "systemStatus.serviceStatus.degraded": "Задержки",
  "systemStatus.serviceStatus.maintenance": "Техработы",
  "systemStatus.serviceStatus.outage": "Инцидент",
  "systemStatus.incidentState.investigating": "Расследование",
  "systemStatus.incidentState.monitoring": "Мониторинг",
  "systemStatus.incidentState.resolved": "Решено",
};

const EN: Record<string, string> = {
  "meta.systemStatus.title": "System status",
  "meta.systemStatus.description":
    "Spliton service health: USDT (TRC20) deposits and withdrawals, payouts, secondary market, orders, and support.",

  "systemStatus.hero.title": "System status",
  "systemStatus.hero.subtitle":
    "Deposits, withdrawals, payouts, and secondary market — in one status view.",

  "systemStatus.error.live": "Could not load status from the API. Make sure the backend is running.",
  "systemStatus.error.demo": "Could not load status. Try refreshing the page.",
  "systemStatus.retry": "Retry",

  "systemStatus.services.title": "Service status",
  "systemStatus.services.liveMeta": "{count} components · API data · refresh every 30 sec",
  "systemStatus.services.demoMeta": "Real-time · Spliton user surface (demo)",
  "systemStatus.services.searchPlaceholder": "Search services",
  "systemStatus.services.col.service": "Service",
  "systemStatus.services.col.status": "Status",
  "systemStatus.services.col.uptime": "Uptime",
  "systemStatus.services.col.maintenance": "Maintenance",
  "systemStatus.services.emptySearch": "No results for “{query}”.",
  "systemStatus.services.maintenanceScheduled": "Scheduled",

  "systemStatus.maintenance.title": "Scheduled maintenance",
  "systemStatus.maintenance.subtitle": "Upcoming windows and impact on operations.",
  "systemStatus.maintenance.badge": "Maintenance",
  "systemStatus.maintenance.affected": "Affected: {services}",
  "systemStatus.maintenance.none":
    "No scheduled maintenance. Maintenance windows will appear here in advance.",

  "systemStatus.incidents.title": "Recent events",
  "systemStatus.incidents.subtitle": "Incidents and closed cases.",
  "systemStatus.incidents.col.event": "Event",
  "systemStatus.incidents.col.status": "Status",
  "systemStatus.incidents.col.date": "Date",
  "systemStatus.incidents.emptyLive":
    "No active incidents. Closed events will appear here once published.",
  "systemStatus.incidents.emptyDemo": "No events to display.",

  "systemStatus.legend.title": "How to read statuses",
  "systemStatus.legend.operational.title": "Operational",
  "systemStatus.legend.operational.desc": "Service is available under normal conditions.",
  "systemStatus.legend.degraded.title": "Degraded",
  "systemStatus.legend.degraded.desc": "Operations complete but slower than usual.",
  "systemStatus.legend.maintenance.title": "Maintenance",
  "systemStatus.legend.maintenance.desc": "Planned maintenance or limited mode.",
  "systemStatus.legend.outage.title": "Outage",
  "systemStatus.legend.outage.desc": "Service unavailable or critically limited.",

  "systemStatus.help.title": "Need help?",
  "systemStatus.help.body":
    "If an operation takes longer than shown in the UI, open the support center.",
  "systemStatus.help.cta": "Support center",

  "systemStatus.serviceStatus.operational": "Operational",
  "systemStatus.serviceStatus.degraded": "Degraded",
  "systemStatus.serviceStatus.maintenance": "Maintenance",
  "systemStatus.serviceStatus.outage": "Outage",
  "systemStatus.incidentState.investigating": "Investigating",
  "systemStatus.incidentState.monitoring": "Monitoring",
  "systemStatus.incidentState.resolved": "Resolved",
};

const ES: Record<string, string> = {
  "meta.systemStatus.title": "Estado del sistema",
  "meta.systemStatus.description":
    "Estado de los servicios Spliton: depósitos y retiros USDT (TRC20), pagos, mercado secundario, órdenes y soporte.",

  "systemStatus.hero.title": "Estado del sistema",
  "systemStatus.hero.subtitle":
    "Depósitos, retiros, pagos y mercado secundario — en una sola vista de estado.",

  "systemStatus.error.live":
    "No se pudo cargar el estado desde la API. Asegúrese de que el backend esté en ejecución.",
  "systemStatus.error.demo": "No se pudo cargar el estado. Intente actualizar la página.",
  "systemStatus.retry": "Reintentar",

  "systemStatus.services.title": "Estado de servicios",
  "systemStatus.services.liveMeta": "{count} componentes · datos API · actualización cada 30 s",
  "systemStatus.services.demoMeta": "Tiempo real · superficie de usuario Spliton (demo)",
  "systemStatus.services.searchPlaceholder": "Buscar servicio",
  "systemStatus.services.col.service": "Servicio",
  "systemStatus.services.col.status": "Estado",
  "systemStatus.services.col.uptime": "Uptime",
  "systemStatus.services.col.maintenance": "Mantenimiento",
  "systemStatus.services.emptySearch": "Sin resultados para «{query}».",
  "systemStatus.services.maintenanceScheduled": "Programado",

  "systemStatus.maintenance.title": "Mantenimiento programado",
  "systemStatus.maintenance.subtitle": "Próximas ventanas e impacto en operaciones.",
  "systemStatus.maintenance.badge": "Mantenimiento",
  "systemStatus.maintenance.affected": "Afectados: {services}",
  "systemStatus.maintenance.none":
    "No hay mantenimiento programado. Las ventanas aparecerán aquí con antelación.",

  "systemStatus.incidents.title": "Eventos recientes",
  "systemStatus.incidents.subtitle": "Incidentes y casos cerrados.",
  "systemStatus.incidents.col.event": "Evento",
  "systemStatus.incidents.col.status": "Estado",
  "systemStatus.incidents.col.date": "Fecha",
  "systemStatus.incidents.emptyLive":
    "No hay incidentes activos. Los eventos cerrados aparecerán aquí tras su publicación.",
  "systemStatus.incidents.emptyDemo": "No hay eventos para mostrar.",

  "systemStatus.legend.title": "Cómo leer los estados",
  "systemStatus.legend.operational.title": "Operativo",
  "systemStatus.legend.operational.desc": "El servicio está disponible con normalidad.",
  "systemStatus.legend.degraded.title": "Degradado",
  "systemStatus.legend.degraded.desc": "Las operaciones se completan, pero más lento de lo habitual.",
  "systemStatus.legend.maintenance.title": "Mantenimiento",
  "systemStatus.legend.maintenance.desc": "Ventana planificada o modo limitado.",
  "systemStatus.legend.outage.title": "Interrupción",
  "systemStatus.legend.outage.desc": "Servicio no disponible o críticamente limitado.",

  "systemStatus.help.title": "¿Necesita ayuda?",
  "systemStatus.help.body":
    "Si una operación tarda más de lo indicado en la interfaz, abra el centro de soporte.",
  "systemStatus.help.cta": "Centro de soporte",

  "systemStatus.serviceStatus.operational": "Operativo",
  "systemStatus.serviceStatus.degraded": "Degradado",
  "systemStatus.serviceStatus.maintenance": "Mantenimiento",
  "systemStatus.serviceStatus.outage": "Interrupción",
  "systemStatus.incidentState.investigating": "Investigando",
  "systemStatus.incidentState.monitoring": "Monitoreo",
  "systemStatus.incidentState.resolved": "Resuelto",
};

const PT: Record<string, string> = {
  "meta.systemStatus.title": "Estado do sistema",
  "meta.systemStatus.description":
    "Estado dos serviços Spliton: depósitos e levantamentos USDT (TRC20), pagamentos, mercado secundário, ordens e suporte.",

  "systemStatus.hero.title": "Estado do sistema",
  "systemStatus.hero.subtitle":
    "Depósitos, levantamentos, pagamentos e mercado secundário — numa única vista de estado.",

  "systemStatus.error.live":
    "Não foi possível carregar o estado da API. Verifique se o backend está em execução.",
  "systemStatus.error.demo": "Não foi possível carregar o estado. Tente atualizar a página.",
  "systemStatus.retry": "Tentar novamente",

  "systemStatus.services.title": "Estado dos serviços",
  "systemStatus.services.liveMeta": "{count} componentes · dados API · atualização a cada 30 s",
  "systemStatus.services.demoMeta": "Tempo real · superfície de utilizador Spliton (demo)",
  "systemStatus.services.searchPlaceholder": "Pesquisar serviço",
  "systemStatus.services.col.service": "Serviço",
  "systemStatus.services.col.status": "Estado",
  "systemStatus.services.col.uptime": "Uptime",
  "systemStatus.services.col.maintenance": "Manutenção",
  "systemStatus.services.emptySearch": "Sem resultados para «{query}».",
  "systemStatus.services.maintenanceScheduled": "Agendado",

  "systemStatus.maintenance.title": "Manutenção programada",
  "systemStatus.maintenance.subtitle": "Próximas janelas e impacto nas operações.",
  "systemStatus.maintenance.badge": "Manutenção",
  "systemStatus.maintenance.affected": "Afetados: {services}",
  "systemStatus.maintenance.none":
    "Sem manutenção programada. As janelas aparecerão aqui com antecedência.",

  "systemStatus.incidents.title": "Eventos recentes",
  "systemStatus.incidents.subtitle": "Incidentes e casos encerrados.",
  "systemStatus.incidents.col.event": "Evento",
  "systemStatus.incidents.col.status": "Estado",
  "systemStatus.incidents.col.date": "Data",
  "systemStatus.incidents.emptyLive":
    "Sem incidentes ativos. Eventos encerrados aparecerão aqui após publicação.",
  "systemStatus.incidents.emptyDemo": "Sem eventos para exibir.",

  "systemStatus.legend.title": "Como ler os estados",
  "systemStatus.legend.operational.title": "Operacional",
  "systemStatus.legend.operational.desc": "O serviço está disponível em condições normais.",
  "systemStatus.legend.degraded.title": "Degradado",
  "systemStatus.legend.degraded.desc": "As operações concluem, mas mais lentamente que o habitual.",
  "systemStatus.legend.maintenance.title": "Manutenção",
  "systemStatus.legend.maintenance.desc": "Janela planificada ou modo limitado.",
  "systemStatus.legend.outage.title": "Interrupção",
  "systemStatus.legend.outage.desc": "Serviço indisponível ou criticamente limitado.",

  "systemStatus.help.title": "Precisa de ajuda?",
  "systemStatus.help.body":
    "Se uma operação demorar mais do que indicado na interface, abra o centro de suporte.",
  "systemStatus.help.cta": "Centro de suporte",

  "systemStatus.serviceStatus.operational": "Operacional",
  "systemStatus.serviceStatus.degraded": "Degradado",
  "systemStatus.serviceStatus.maintenance": "Manutenção",
  "systemStatus.serviceStatus.outage": "Interrupção",
  "systemStatus.incidentState.investigating": "Investigando",
  "systemStatus.incidentState.monitoring": "Monitorização",
  "systemStatus.incidentState.resolved": "Resolvido",
};

export const SYSTEM_STATUS_MESSAGES: Record<AppLocale, Record<string, string>> = {
  ru: RU,
  en: EN,
  es: ES,
  pt: PT,
};

const LEGEND_STATUS_KEYS = [
  { status: "operational", key: "operational" },
  { status: "degraded", key: "degraded" },
  { status: "maintenance", key: "maintenance" },
  { status: "incident", key: "outage" },
] as const;

export function getLegendItems(locale: AppLocale): {
  status: (typeof LEGEND_STATUS_KEYS)[number]["status"];
  title: string;
  description: string;
}[] {
  const m = SYSTEM_STATUS_MESSAGES[locale];
  const fallback = SYSTEM_STATUS_MESSAGES.ru;
  return LEGEND_STATUS_KEYS.map(({ status, key }) => ({
    status,
    title: m[`systemStatus.legend.${key}.title`] ?? fallback[`systemStatus.legend.${key}.title`] ?? key,
    description:
      m[`systemStatus.legend.${key}.desc`] ?? fallback[`systemStatus.legend.${key}.desc`] ?? "",
  }));
}

export function systemStatusLabel(
  kind: "service" | "incident",
  value: string,
  locale: AppLocale,
): string {
  const serviceKey =
    value === "incident" ? "outage" : value === "delayed" ? "degraded" : value;
  const key =
    kind === "service"
      ? `systemStatus.serviceStatus.${serviceKey}`
      : `systemStatus.incidentState.${value}`;
  return SYSTEM_STATUS_MESSAGES[locale][key] ?? SYSTEM_STATUS_MESSAGES.ru[key] ?? value;
}
