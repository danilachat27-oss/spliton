INSERT INTO "roles" ("id", "code", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), 'BUSINESS_ANALYST'::"user_role_code", 'Business Analyst', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."code" = 'BUSINESS_ANALYST'::"user_role_code"
);
