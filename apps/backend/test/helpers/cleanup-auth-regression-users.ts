import { PrismaClient } from '@prisma/client';
import { resolveE2eDatabaseUrl } from './e2e-database-url';

const EMAIL_PREFIX = 'test-auth-regression-';
const EMAIL_SUFFIX = '@example.com';

/**
 * Deletes users created by auth regression e2e (email prefix + example.com domain only).
 */
export async function cleanupAuthRegressionUsers(): Promise<void> {
  resolveE2eDatabaseUrl();
  const prisma = new PrismaClient();
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: EMAIL_PREFIX,
          endsWith: EMAIL_SUFFIX,
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
