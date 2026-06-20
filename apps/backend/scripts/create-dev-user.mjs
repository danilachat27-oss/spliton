import { config } from 'dotenv';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, UserStatus } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../../.env') });

const require = createRequire(join(__dirname, '../package.json'));
const bcrypt = require('bcrypt');

const emailArg = process.argv[2]?.trim().toLowerCase();
const passArg = process.argv[3]?.trim();

const email = emailArg ?? `dev-${Date.now()}@spliton.local`;
const password = passArg ?? `SplitonDev${String(Date.now()).slice(-6)}!`;
const displayName = process.argv[4]?.trim() ?? 'Spliton Dev User';

const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User already exists: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      authProvider: 'email',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName,
        },
      },
    },
    select: { id: true, email: true, status: true },
  });

  console.log(JSON.stringify({ ok: true, user, login: { email, password, displayName } }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
