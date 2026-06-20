-- One distribution per earning period (precheck: no duplicate earning_period_id rows)

CREATE UNIQUE INDEX IF NOT EXISTS "earning_distributions_earning_period_id_key"
  ON "earning_distributions" ("earning_period_id");
