import { PrismaClient, UserRoleCode } from "@prisma/client";

import { seedHelpCenter } from "./seed-help-center";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = "danila.chat27@gmail.com";

/** Staff + platform roles (идемпотентный upsert). */
const ALL_ROLES: Array<{ code: UserRoleCode; name: string }> = [
  { code: UserRoleCode.USER, name: "User" },
  { code: UserRoleCode.INVESTOR, name: "Investor (holder)" },
  { code: UserRoleCode.ARTIST, name: "Artist" },
  { code: UserRoleCode.SUPER_ADMIN, name: "Super Admin" },
  { code: UserRoleCode.ACCOUNTANT, name: "Accountant" },
  { code: UserRoleCode.CONTENT_MANAGER, name: "Content Manager" },
  { code: UserRoleCode.SUPPORT_MANAGER, name: "Support Manager" },
  { code: UserRoleCode.COMPLIANCE, name: "Compliance" },
  { code: UserRoleCode.BUSINESS_ANALYST, name: "Business Analyst" },
  { code: UserRoleCode.NEWS_MANAGER, name: "News Manager" },
  { code: UserRoleCode.ADMIN, name: "Admin (legacy)" },
  { code: UserRoleCode.SUPPORT, name: "Support (legacy)" },
];

async function grantRole(email: string, roleCode: UserRoleCode): Promise<boolean> {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!role) {
    console.warn(`Skip ${roleCode}: role row missing. Run migrations first.`);
    return false;
  }
  if (!user) {
    console.warn(
      `Skip ${roleCode} for ${email}: user not found. Register this email, then run: npm run prisma:seed`,
    );
    return false;
  }
  await prisma.userRole.createMany({
    data: [{ userId: user.id, roleId: role.id }],
    skipDuplicates: true,
  });
  console.log(`Granted ${roleCode} to ${email} (idempotent).`);
  return true;
}

async function main() {
  for (const role of ALL_ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: { code: role.code, name: role.name },
    });
  }

  const codes = await prisma.role.findMany({
    orderBy: { code: "asc" },
    select: { code: true },
  });
  console.log("Roles in DB:", codes.map((r) => r.code).join(", "));

  const granted = await grantRole(SUPER_ADMIN_EMAIL, UserRoleCode.SUPER_ADMIN);
  if (!granted) {
    console.log("");
    console.log("--- Super Admin setup ---");
    console.log(`1. Register: ${SUPER_ADMIN_EMAIL}`);
    console.log("2. Run: npm run prisma:seed");
    console.log(`3. Sign in at: /admin/login`);
    console.log("");
  }

  await seedHelpCenter();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
