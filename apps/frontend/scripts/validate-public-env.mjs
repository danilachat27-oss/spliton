/**
 * Standalone build guard (same rules as next.config.ts import).
 * Usage: node scripts/validate-public-env.mjs
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(appDir, "..");

const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "-e",
    `import { validatePublicEnvForBuild } from ${JSON.stringify(path.join(frontendRoot, "lib/validate-public-env.ts"))};
validatePublicEnvForBuild();
console.log("[Spliton] public env OK");`,
  ],
  { cwd: frontendRoot, stdio: "inherit", env: process.env },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
