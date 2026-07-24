/**
 * Prisma `generate` may write `.prisma/client` to the monorepo root while `@prisma/client`
 * resolves from `apps/backend/node_modules` and expects `.prisma/client` next to that package.
 * Copy the generated folder so Nest/Jest can load the real engine.
 */
const fs = require("fs");
const path = require("path");

const backendRoot = path.join(__dirname, "..");
const repoRoot = path.join(backendRoot, "..", "..");
const generatedSrc = path.join(repoRoot, "node_modules", ".prisma", "client");
const generatedDest = path.join(backendRoot, "node_modules", "@prisma", "client", ".prisma", "client");

function main() {
  if (!fs.existsSync(generatedSrc)) {
    console.warn(`[sync-prisma-generated] Skip: missing ${generatedSrc} (run prisma generate first)`);
    return;
  }
  fs.mkdirSync(path.dirname(generatedDest), { recursive: true });
  fs.rmSync(generatedDest, { recursive: true, force: true });
  fs.cpSync(generatedSrc, generatedDest, { recursive: true });
  console.log(`[sync-prisma-generated] Copied Prisma client to ${generatedDest}`);

  const strayBackendPrisma = path.join(backendRoot, "node_modules", ".prisma");
  if (fs.existsSync(strayBackendPrisma)) {
    fs.rmSync(strayBackendPrisma, { recursive: true, force: true });
    console.log(
      "[sync-prisma-generated] Removed apps/backend/node_modules/.prisma (avoids Node resolving .prisma outside @prisma/client)",
    );
  }
}

main();
