import { config } from 'dotenv';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, UserStatus } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../../.env') });

const require = createRequire(join(__dirname, '../package.json'));
const bcrypt = require('bcrypt');

const email = (process.argv[2] ?? '').trim().toLowerCase();
const password = process.argv[3] ?? 'SplitonDev2026!';

if (!email) {
  console.error('Usage: node scripts/reset-user-password.mjs <email> [newPassword]');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      twoFactorMethods: true,
      profile: true,
    },
  });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  const verify = await bcrypt.compare(password, passwordHash);
  const totp = user.twoFactorMethods.filter((m) => m.status === 'ENABLED');

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: user.email,
        status: 'ACTIVE',
        passwordReset: true,
        bcryptVerify: verify,
        totpEnabled: totp.length > 0,
        totpMethods: totp.map((m) => m.method),
        login: { email, password },
        hint:
          totp.length > 0
            ? 'Включена 2FA — после пароля нужен код TOTP или backup code.'
            : 'Вход: email + пароль на /login',
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
