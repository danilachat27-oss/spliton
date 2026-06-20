/**
 * Full Next.js / bundler cache reset. Run only when `next dev` / `next build` is stopped.
 */
const fs = require("node:fs");
const path = require("node:path");

const appRoot = path.join(__dirname, "..");
const targets = [
  path.join(appRoot, ".next"),
  path.join(appRoot, "node_modules", ".cache"),
];

let failed = false;

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    console.log(`[clean-next-cache] Removed ${path.relative(appRoot, target)}`);
  } catch (error) {
    console.warn(
      `[clean-next-cache] Failed to remove ${path.relative(appRoot, target)}:`,
      error?.message ?? error,
    );
    failed = true;
  }
}

if (failed) process.exitCode = 1;
