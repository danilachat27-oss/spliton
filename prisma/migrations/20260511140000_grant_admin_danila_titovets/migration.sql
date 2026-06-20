-- Ensure ADMIN role row exists (idempotent; seed may have created it already).
INSERT INTO "roles" ("id", "code", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), 'ADMIN'::"user_role_code", 'Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."code" = 'ADMIN'::"user_role_code"
);

-- Grant ADMIN to danila.titovets@gmail.com if the user exists (no-op until registered).
INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", r."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "roles" r
WHERE lower(trim(u."email")) = lower(trim('danila.titovets@gmail.com'))
  AND r."code" = 'ADMIN'::"user_role_code"
ON CONFLICT ("user_id", "role_id") DO NOTHING;
