import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../../.env') });

const email = (process.argv[2] ?? 'danila.titovets@gmail.com').trim().toLowerCase();
const roleCode = process.argv[3] ?? UserRoleCode.SUPER_ADMIN;
const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: UserStatus.ACTIVE,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    console.error(`Role not found: ${roleCode}`);
    process.exit(1);
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    include: { userRoles: { include: { role: true } } },
  });

  console.log(
    JSON.stringify(
      {
        email: updated?.email,
        status: updated?.status,
        emailVerified: Boolean(updated?.emailVerifiedAt),
        roles: updated?.userRoles.map((r) => r.role.code),
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
