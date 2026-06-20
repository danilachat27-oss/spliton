-- Step 1: extend enum only (must commit before values are usable in DML).
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'ACCOUNTANT';
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGER';
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'SUPPORT_MANAGER';
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'COMPLIANCE';
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'USER';
