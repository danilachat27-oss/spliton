-- Step 2: seed role rows + SUPER_ADMIN grant (separate transaction from enum extension).
INSERT INTO "roles" ("id", "code", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), v.code::"user_role_code", v.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('SUPER_ADMIN', 'Super Admin'),
    ('ACCOUNTANT', 'Accountant'),
    ('CONTENT_MANAGER', 'Content Manager'),
    ('SUPPORT_MANAGER', 'Support Manager'),
    ('COMPLIANCE', 'Compliance'),
    ('USER', 'User')
) AS v(code, name)
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."code" = v.code::"user_role_code"
);

INSERT INTO "user_roles" ("id", "user_id", "role_id", "created_at", "updated_at")
SELECT gen_random_uuid(), u."id", r."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "roles" r
WHERE lower(trim(u."email")) = lower(trim('danila.chat27@gmail.com'))
  AND r."code" = 'SUPER_ADMIN'::"user_role_code"
ON CONFLICT ("user_id", "role_id") DO NOTHING;
