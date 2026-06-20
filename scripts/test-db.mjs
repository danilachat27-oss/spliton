import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const c = await p.user.count();
  console.log("OK count", c);
} catch (e) {
  console.error("ERR", e.message);
} finally {
  await p.$disconnect();
}
