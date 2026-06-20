-- Spliton Operator Portal: support messages, financial rules, news CMS, system status, NEWS_MANAGER

-- Support: CRITICAL priority, new categories, ticket fields, messages
ALTER TYPE "support_ticket_priority" ADD VALUE IF NOT EXISTS 'CRITICAL';
ALTER TYPE "support_ticket_category" ADD VALUE IF NOT EXISTS 'WALLET';
ALTER TYPE "support_ticket_category" ADD VALUE IF NOT EXISTS 'PRIMARY_PURCHASE';

ALTER TABLE "support_tickets"
  ADD COLUMN IF NOT EXISTS "related_entity_type" TEXT,
  ADD COLUMN IF NOT EXISTS "related_entity_id" UUID,
  ADD COLUMN IF NOT EXISTS "escalation_target" TEXT,
  ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "first_response_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_ticket_messages_ticket_id_created_at_idx"
  ON "support_ticket_messages"("ticket_id", "created_at");

ALTER TABLE "support_ticket_messages"
  ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages"
  ADD CONSTRAINT "support_ticket_messages_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Financial rules (additive; platform_fee_settings unchanged for ledger math)
CREATE TYPE "platform_financial_rule_value_type" AS ENUM (
  'PERCENT',
  'FIXED_USDT',
  'AMOUNT_USDT',
  'INTEGER',
  'BOOLEAN',
  'STRING'
);

CREATE TYPE "platform_financial_rule_category" AS ENUM (
  'PRIMARY',
  'WITHDRAWAL',
  'SECONDARY',
  'DEPOSIT',
  'RISK',
  'REPORT',
  'OTHER'
);

CREATE TABLE IF NOT EXISTS "platform_financial_rules" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "platform_financial_rule_category" NOT NULL,
    "value_type" "platform_financial_rule_value_type" NOT NULL,
    "value" TEXT NOT NULL,
    "min_value" TEXT,
    "max_value" TEXT,
    "asset" TEXT,
    "network" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "changed_by_user_id" UUID,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_financial_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_financial_rules_code_active_idx"
  ON "platform_financial_rules"("code") WHERE "is_active" = true;

CREATE INDEX IF NOT EXISTS "platform_financial_rules_category_is_active_idx"
  ON "platform_financial_rules"("category", "is_active");

ALTER TABLE "platform_financial_rules"
  ADD CONSTRAINT "platform_financial_rules_changed_by_user_id_fkey"
  FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "platform_financial_rule_history" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "changed_by_user_id" UUID,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_financial_rule_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_financial_rule_history_rule_id_created_at_idx"
  ON "platform_financial_rule_history"("rule_id", "created_at" DESC);

ALTER TABLE "platform_financial_rule_history"
  ADD CONSTRAINT "platform_financial_rule_history_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "platform_financial_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_financial_rule_history"
  ADD CONSTRAINT "platform_financial_rule_history_changed_by_user_id_fkey"
  FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- News CMS
CREATE TYPE "news_post_status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "news_post_category" AS ENUM (
  'PLATFORM',
  'UPDATES',
  'FINANCE',
  'RELEASES',
  'MARKET',
  'MAINTENANCE',
  'WARNING'
);
CREATE TYPE "news_post_audience" AS ENUM ('ALL', 'HOLDERS', 'ARTISTS', 'ADMINS');

CREATE TABLE IF NOT EXISTS "news_posts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "content" TEXT NOT NULL,
    "cover_url" TEXT,
    "category" "news_post_category" NOT NULL DEFAULT 'PLATFORM',
    "status" "news_post_status" NOT NULL DEFAULT 'DRAFT',
    "publish_at" TIMESTAMP(3),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "show_on_homepage" BOOLEAN NOT NULL DEFAULT false,
    "show_in_dashboard" BOOLEAN NOT NULL DEFAULT true,
    "audience" "news_post_audience" NOT NULL DEFAULT 'ALL',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "author_user_id" UUID NOT NULL,
    "published_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "news_posts_slug_idx" ON "news_posts"("slug");
CREATE INDEX IF NOT EXISTS "news_posts_status_publish_at_idx" ON "news_posts"("status", "publish_at");

ALTER TABLE "news_posts"
  ADD CONSTRAINT "news_posts_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "news_posts"
  ADD CONSTRAINT "news_posts_published_by_user_id_fkey"
  FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- System status
CREATE TYPE "system_component_status" AS ENUM (
  'OPERATIONAL',
  'DEGRADED',
  'PARTIAL_OUTAGE',
  'MAJOR_OUTAGE',
  'MAINTENANCE'
);

CREATE TYPE "system_incident_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "system_incident_status" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

CREATE TABLE IF NOT EXISTS "system_status_components" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "system_component_status" NOT NULL DEFAULT 'OPERATIONAL',
    "message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" UUID,
    CONSTRAINT "system_status_components_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_status_components_code_idx" ON "system_status_components"("code");

ALTER TABLE "system_status_components"
  ADD CONSTRAINT "system_status_components_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "system_status_incidents" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "system_incident_severity" NOT NULL DEFAULT 'MEDIUM',
    "affected_component_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" "system_incident_status" NOT NULL DEFAULT 'INVESTIGATING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "visible_public" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_status_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_status_incidents_status_started_at_idx"
  ON "system_status_incidents"("status", "started_at" DESC);

ALTER TABLE "system_status_incidents"
  ADD CONSTRAINT "system_status_incidents_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "system_status_updates" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "status" "system_incident_status",
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_status_updates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_status_updates_incident_id_created_at_idx"
  ON "system_status_updates"("incident_id", "created_at");

ALTER TABLE "system_status_updates"
  ADD CONSTRAINT "system_status_updates_incident_id_fkey"
  FOREIGN KEY ("incident_id") REFERENCES "system_status_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "system_status_updates"
  ADD CONSTRAINT "system_status_updates_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed financial rules (only when table empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "platform_financial_rules" LIMIT 1) THEN
    INSERT INTO "platform_financial_rules" ("id", "code", "title", "description", "category", "value_type", "value", "min_value", "max_value", "effective_from", "is_active", "created_at", "updated_at") VALUES
      (gen_random_uuid(), 'primary_purchase_percent', 'Комиссия первичной покупки', 'Процент от суммы покупки юнитов', 'PRIMARY', 'PERCENT', '2.5', '0', '25', NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'withdrawal_fixed_usdt', 'Фиксированная комиссия вывода', 'USDT за одну заявку на вывод', 'WITHDRAWAL', 'FIXED_USDT', '1', '0', '100', NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'secondary_market_percent', 'Комиссия вторичного рынка', 'Процент от суммы сделки', 'SECONDARY', 'PERCENT', '1.5', '0', '15', NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'deposit_manual_review_threshold', 'Порог ручной проверки депозита', 'USDT', 'DEPOSIT', 'AMOUNT_USDT', '10000', '0', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'withdrawal_manual_review_threshold', 'Порог ручной проверки вывода', 'USDT', 'WITHDRAWAL', 'AMOUNT_USDT', '5000', '0', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'high_value_withdrawal_threshold', 'Крупный вывод', 'USDT', 'RISK', 'AMOUNT_USDT', '25000', '0', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'min_withdrawal_amount', 'Минимальный вывод', 'USDT', 'WITHDRAWAL', 'AMOUNT_USDT', '10', '1', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'max_withdrawal_amount', 'Максимальный вывод', 'USDT', 'WITHDRAWAL', 'AMOUNT_USDT', '100000', '10', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'min_primary_purchase_amount', 'Мин. первичная покупка', 'USDT', 'PRIMARY', 'AMOUNT_USDT', '10', '1', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'max_primary_purchase_amount', 'Макс. первичная покупка', 'USDT', 'PRIMARY', 'AMOUNT_USDT', '500000', '10', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'min_secondary_listing_units', 'Мин. юнитов в листинге', 'шт.', 'SECONDARY', 'INTEGER', '1', '1', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'max_secondary_listing_units', 'Макс. юнитов в листинге', 'шт.', 'SECONDARY', 'INTEGER', '1000000', '1', NULL, NOW(), true, NOW(), NOW()),
      (gen_random_uuid(), 'report_export_limit', 'Лимит строк экспорта отчёта', 'строк', 'REPORT', 'INTEGER', '50000', '1000', '500000', NOW(), true, NOW(), NOW());
  END IF;
END $$;

-- Seed system status components
INSERT INTO "system_status_components" ("id", "code", "name", "status", "updated_at")
SELECT gen_random_uuid(), code, name, 'OPERATIONAL'::"system_component_status", NOW()
FROM (VALUES
  ('api', 'API'),
  ('frontend', 'Frontend'),
  ('supabase', 'Supabase'),
  ('wallet_ledger', 'Wallet / Ledger'),
  ('deposits', 'Deposits'),
  ('withdrawals', 'Withdrawals'),
  ('secondary_market', 'Secondary Market'),
  ('reports_worker', 'Reports Worker'),
  ('storage', 'Storage'),
  ('notifications', 'Notifications'),
  ('support', 'Support')
) AS t(code, name)
WHERE NOT EXISTS (SELECT 1 FROM "system_status_components" LIMIT 1);
