-- Observability: system alerts for production-critical events

CREATE TYPE "system_alert_severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "system_alert_status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "system_alert_source" AS ENUM ('SYSTEM', 'FINANCE', 'COMPLIANCE', 'WORKER', 'SECURITY', 'REPORT');

CREATE TABLE "system_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "severity" "system_alert_severity" NOT NULL,
  "status" "system_alert_status" NOT NULL DEFAULT 'OPEN',
  "source" "system_alert_source" NOT NULL,
  "entity_type" TEXT,
  "entity_id" UUID,
  "metadata" JSONB,
  "runbook_key" TEXT,
  "acknowledged_at" TIMESTAMP(3),
  "acknowledged_by_user_id" UUID,
  "resolved_at" TIMESTAMP(3),
  "resolved_by_user_id" UUID,
  "linked_incident_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "system_alerts"
  ADD CONSTRAINT "system_alerts_acknowledged_by_user_id_fkey"
  FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "system_alerts"
  ADD CONSTRAINT "system_alerts_resolved_by_user_id_fkey"
  FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "system_alerts_status_severity_created_at_idx"
  ON "system_alerts" ("status", "severity", "created_at" DESC);

CREATE INDEX "system_alerts_source_created_at_idx"
  ON "system_alerts" ("source", "created_at" DESC);

CREATE INDEX "system_alerts_dedup_idx"
  ON "system_alerts" ("code", "entity_type", "entity_id", "status");
