import { PrismaClient, UserRoleCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles: Array<{ code: UserRoleCode; name: string }> = [
    { code: UserRoleCode.INVESTOR, name: "Investor" },
    { code: UserRoleCode.ARTIST, name: "Artist" },
    { code: UserRoleCode.ADMIN, name: "Admin" },
    { code: UserRoleCode.SUPPORT, name: "Support" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    });
  }

  const existing = await prisma.role.findMany({
    where: {
      code: {
        in: [
          UserRoleCode.INVESTOR,
          UserRoleCode.ARTIST,
          UserRoleCode.ADMIN,
          UserRoleCode.SUPPORT,
        ],
      },
    },
    orderBy: { code: "asc" },
    select: { code: true, name: true },
  });

  console.log("Base roles in DB:", existing.map((r) => r.code).join(", "));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
