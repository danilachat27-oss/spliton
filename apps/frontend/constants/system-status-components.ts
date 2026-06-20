import type { ServiceStatusRow } from "@/constants/system-status-mock";

/** Публичный справочник компонентов — совпадает с seed/migration system_status_components. */
export const PUBLIC_STATUS_COMPONENTS: {
  code: string;
  name: string;
  note: string;
}[] = [
  { code: "api", name: "Платформа API", note: "REST API и фоновые задачи доступны." },
  { code: "frontend", name: "Сайт и личный кабинет", note: "Веб-интерфейс открывается без ошибок." },
  { code: "auth", name: "Авторизация и регистрация", note: "Вход, регистрация и восстановление доступа работают." },
  { code: "supabase", name: "База данных", note: "Хранилище данных отвечает на health-check." },
  { code: "wallet_ledger", name: "Баланс и учёт (ledger)", note: "Ledger и проводки доступны для операций." },
  { code: "deposits", name: "Пополнение USDT (TRC20)", note: "Входящие переводы обрабатываются в обычном режиме." },
  { code: "withdrawals", name: "Вывод средств", note: "Заявки на вывод проходят стандартную проверку и очередь." },
  { code: "revenue_payouts", name: "Начисления и выплаты revenue share", note: "Зачисления revenue share без задержек сверх SLA." },
  { code: "primary_market", name: "Покупка units (каталог)", note: "Покупка units в каталоге доступна." },
  { code: "catalog", name: "Каталог релизов", note: "Карточки релизов и раунды отображаются корректно." },
  { code: "secondary_market", name: "Вторичный рынок", note: "Стакан, ордера и сделки доступны." },
  { code: "order_matching", name: "Исполнение ордеров", note: "Сопоставление заявок и проведение сделок в норме." },
  { code: "balance_sync", name: "Обновление баланса", note: "Доступный баланс синхронизируется без очереди." },
  { code: "kyc", name: "Верификация аккаунта", note: "Приём документов и проверки выполняются штатно." },
  { code: "notifications", name: "Уведомления", note: "In-app и email-уведомления доставляются." },
  { code: "support", name: "Поддержка", note: "Центр поддержки и тикеты доступны." },
  { code: "reports_worker", name: "Отчёты и выписки", note: "Генерация выписок и отчётов в штатном режиме." },
  { code: "storage", name: "Хранилище файлов", note: "Загрузка и выдача файлов работает." },
  { code: "referral_program", name: "Реферальная программа", note: "Ссылки, коды и начисления рефералов активны." },
  { code: "partner_program", name: "Партнёрская программа", note: "Кабинет партнёра и заявки доступны." },
];

export function buildMockOperationalServices(lastUpdatedLabel: string): ServiceStatusRow[] {
  return PUBLIC_STATUS_COMPONENTS.map((component) => ({
    id: component.code,
    name: component.name,
    status: "operational",
    statusLabel: "Работает штатно",
    note: component.note,
    lastUpdatedLabel,
  }));
}
