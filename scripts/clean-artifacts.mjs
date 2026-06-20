import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { removeEmptyE2eLogs, removePathRel, repoRoot } from "./clean-utils.mjs";

const FRONTEND_PATHS = ["apps/frontend/.next"];
const BACKEND_PATHS = ["apps/backend/dist"];
const E2E_PATHS = [
  "apps/frontend/test-results",
  "apps/frontend/playwright-report",
  "apps/frontend/blob-report",
];

function freeDevPorts() {
  const script = path.join(repoRoot, "scripts", "dev-clean-ports.mjs");
  console.log("Stopping dev servers (ports 3000, 4001)...");
  const result = spawnSync(process.execPath, [script], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("  dev-clean-ports exited with non-zero status (ports may already be free)");
  }
}

function cleanPaths(label, paths) {
  console.log(`\n${label}:`);
  for (const rel of paths) {
    removePathRel(rel);
  }
}

const target = (process.argv[2] ?? "all").toLowerCase();

console.log(`Spliton clean - target: ${target}`);

if (target === "all" || target === "frontend" || target === "backend") {
  freeDevPorts();
}

switch (target) {
  case "frontend":
    cleanPaths("Frontend cache", FRONTEND_PATHS);
    break;
  case "backend":
    cleanPaths("Backend build output", BACKEND_PATHS);
    break;
  case "e2e":
    cleanPaths("E2E artifacts", E2E_PATHS);
    break;
  case "logs":
    console.log("\nEmpty e2e logs:");
    removeEmptyE2eLogs();
    break;
  case "all":
    cleanPaths("Frontend cache", FRONTEND_PATHS);
    cleanPaths("Backend build output", BACKEND_PATHS);
    cleanPaths("E2E artifacts", E2E_PATHS);
    console.log("\nEmpty e2e logs:");
    removeEmptyE2eLogs();
    break;
  default:
    console.error(`Unknown target: ${target}. Use frontend|backend|e2e|logs|all`);
    process.exit(1);
}

console.log("\nDone.");