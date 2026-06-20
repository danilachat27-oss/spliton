-- Grant staff access for Spliton operator portal.
-- Run in Supabase SQL Editor after the user has registered.

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", r."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "roles" r
WHERE lower(trim(u."email")) = lower(trim('danila.titovets@gmail.com'))
  AND r."code" = 'SUPER_ADMIN'::"user_role_code"
ON CONFLICT ("user_id", "role_id") DO NOTHING;

-- Ensure email is verified and account active (local dev convenience).
UPDATE "users"
SET status = 'ACTIVE'::"user_status",
    email_verified_at = COALESCE(email_verified_at, NOW()),
    updated_at = NOW()
WHERE lower(trim("email")) = lower(trim('danila.titovets@gmail.com'))
  AND deleted_at IS NULL;
