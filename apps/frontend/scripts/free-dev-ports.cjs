/* eslint-disable @typescript-eslint/no-require-imports */
let killPort;
try {
  killPort = require("kill-port");
} catch {
  console.warn(
    "[free-dev-ports] kill-port is not installed; run `pnpm install` in apps/frontend. Skipping port cleanup.",
  );
  process.exit(0);
}

const ports = process.argv
  .slice(2)
  .map((p) => Number.parseInt(p, 10))
  .filter((n) => !Number.isNaN(n) && n > 0);

async function main() {
  for (const port of ports) {
    try {
      await killPort(port);
    } catch {
      // Порт свободен или процесс уже завершён — не считаем ошибкой.
    }
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
