import { PrismaClient } from '@prisma/client';
import { resolveE2eDatabaseUrl } from './e2e-database-url';

const EMAIL_PREFIX = 'test-2fa-regression-';
const EMAIL_SUFFIX = '@example.com';

export async function cleanupTwoFactorRegressionUsers(): Promise<void> {
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
