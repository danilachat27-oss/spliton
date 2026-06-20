/**
 * Frees frontend/backend dev ports before a clean start.
 * Default: 3000 (Next), 4001 (Nest PORT default).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const freePortsScript = path.join(repoRoot, "apps", "frontend", "scripts", "free-dev-ports.cjs");

const DEFAULT_PORTS = ["3000", "4001"];
const extra = process.argv.slice(2).filter(Boolean);
const ports = extra.length > 0 ? extra : DEFAULT_PORTS;

const result = spawnSync(process.execPath, [freePortsScript, ...ports], {
  cwd: repoRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 0);
