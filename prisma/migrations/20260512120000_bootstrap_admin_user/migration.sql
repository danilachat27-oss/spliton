-- Idempotent bootstrap admin for local/dev: admin@revshare.local, ACTIVE, ADMIN role, bcrypt cost 12.

INSERT INTO "roles" ("id", "code", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), 'ADMIN'::"user_role_code", 'Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."code" = 'ADMIN'::"user_role_code"
);

INSERT INTO "users" ("id", "email", "password_hash", "auth_provider", "status", "email_verified_at", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  'admin@revshare.local',
  '$2b$12$Zy4JdEM7oKxmgHBM40kxKedtYiE0Cvl1a0A4X5NsysJrOCHv5g9n2',
  'email',
  'ACTIVE'::"user_status",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "users" u WHERE lower(trim(u."email")) = 'admin@revshare.local'
);

INSERT INTO "user_profiles" ("user_id", "display_name", "created_at", "updated_at")
SELECT u."id", 'Platform Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
WHERE lower(trim(u."email")) = 'admin@revshare.local'
  AND NOT EXISTS (
    SELECT 1 FROM "user_profiles" p WHERE p."user_id" = u."id"
  );

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", r."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "roles" r
WHERE lower(trim(u."email")) = 'admin@revshare.local'
  AND r."code" = 'ADMIN'::"user_role_code"
ON CONFLICT ("user_id", "role_id") DO NOTHING;
