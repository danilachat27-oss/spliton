-- Расширяем публичный справочник компонентов: русские названия + продуктовые потоки Spliton.

INSERT INTO "system_status_components" ("id", "code", "name", "status", "updated_at")
SELECT gen_random_uuid(), v.code, v.name, 'OPERATIONAL'::"system_component_status", NOW()
FROM (
  VALUES
    ('api', 'Платформа API'),
    ('frontend', 'Сайт и личный кабинет'),
    ('auth', 'Авторизация и регистрация'),
    ('supabase', 'База данных'),
    ('wallet_ledger', 'Баланс и учёт (ledger)'),
    ('deposits', 'Пополнение USDT (TRC20)'),
    ('withdrawals', 'Вывод средств'),
    ('revenue_payouts', 'Начисления и выплаты revenue share'),
    ('primary_market', 'Покупка units (каталог)'),
    ('catalog', 'Каталог релизов'),
    ('secondary_market', 'Вторичный рынок'),
    ('order_matching', 'Исполнение ордеров'),
    ('balance_sync', 'Обновление баланса'),
    ('kyc', 'Верификация аккаунта'),
    ('notifications', 'Уведомления'),
    ('support', 'Поддержка'),
    ('reports_worker', 'Отчёты и выписки'),
    ('storage', 'Хранилище файлов'),
    ('referral_program', 'Реферальная программа'),
    ('partner_program', 'Партнёрская программа')
) AS v(code, name)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED.name;
