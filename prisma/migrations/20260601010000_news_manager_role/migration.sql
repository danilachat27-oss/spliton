-- Enum only: role row is seeded in prisma/seed.ts (PG cannot use new enum value in same transaction as ALTER TYPE)
ALTER TYPE "user_role_code" ADD VALUE IF NOT EXISTS 'NEWS_MANAGER';
