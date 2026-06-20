/**
 * Lists listeners on common dev ports (Windows netstat / Unix lsof).
 * Usage: node scripts/ports-check.mjs [ports...]
 */
import { execSync } from "node:child_process";

const DEFAULT_PORTS = [3000, 4001, 5432];
const ports = process.argv
  .slice(2)
  .map((p) => Number.parseInt(p, 10))
  .filter((n) => !Number.isNaN(n) && n > 0);

const targets = ports.length > 0 ? ports : DEFAULT_PORTS;

function listenersForPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return out
        .trim()
        .split(/\r?\n/)
        .filter((line) => /LISTENING/i.test(line))
        .map((line) => line.trim());
    }
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

console.log("Dev port check\n");
for (const port of targets) {
  const lines = listenersForPort(port);
  if (lines.length === 0) {
    console.log(`:${port} — free`);
    continue;
  }
  console.log(`:${port} — in use (${lines.length} listener(s))`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  if (process.platform === "win32") {
    const pidMatch = lines[0]?.match(/\s(\d+)\s*$/);
    if (pidMatch) {
      console.log(`  Stop: taskkill /PID ${pidMatch[1]} /F`);
    }
  }
}
console.log("\nAvoid: taskkill /F /IM node.exe (kills Cursor and all Node apps).");
