const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    const roles = await p.role.findMany({ select: { code: true }, orderBy: { code: 'asc' } });
    const superAdmin = await p.userRole.findMany({
      where: { role: { code: 'SUPER_ADMIN' } },
      include: { user: { select: { email: true, status: true } }, role: { select: { code: true } } },
    });
    console.log('roles:', roles.map((r) => r.code).join(', '));
    console.log(
      'SUPER_ADMIN users:',
      superAdmin.map((u) => `${u.user.email} (${u.user.status})`).join(', ') || 'none',
    );
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
