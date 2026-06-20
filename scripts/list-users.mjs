import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: {
    email: true,
    status: true,
    emailVerifiedAt: true,
    deletedAt: true,
  },
  orderBy: { email: "asc" },
});
console.table(
  users.map((u) => ({
    email: u.email,
    status: u.status,
    verified: u.emailVerifiedAt ? "yes" : "no",
    deleted: u.deletedAt ? "yes" : "no",
  })),
);
console.log(`Total: ${users.length}`);
await prisma.$disconnect();
