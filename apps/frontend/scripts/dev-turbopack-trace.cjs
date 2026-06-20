/**
 * Next.js dev with Turbopack tracing enabled.
 * Reproduce a slow route, stop the server, then inspect:
 *   npx next internal trace .next/dev/trace-turbopack
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const frontendDir = path.join(__dirname, "..");
const tracePath = ".next/dev/trace-turbopack";

console.log("[dev:trace] NEXT_TURBOPACK_TRACING=1 — Turbopack trace will be written on compile.");
console.log(`[dev:trace] Trace file: ${tracePath}`);
console.log("[dev:trace] After reproducing a slow route, stop dev and run:");
console.log(`  npx next internal trace ${tracePath}`);

const child = spawn("npx", ["next", "dev", "-p", "3000"], {
  cwd: frontendDir,
  shell: true,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TURBOPACK_TRACING: "1",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
