import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../../.env') });

const email = (process.argv[2] ?? 'danila.titovets@gmail.com').trim().toLowerCase();
const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) {
    console.log(JSON.stringify({ found: false, email }, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          found: true,
          email: user.email,
          status: user.status,
          emailVerified: Boolean(user.emailVerifiedAt),
          hasPassword: Boolean(user.passwordHash),
          roles: user.userRoles.map((r) => r.role.code),
        },
        null,
        2,
      ),
    );
  }
} finally {
  await prisma.$disconnect();
}
