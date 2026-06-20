/**
 * Предупреждение перед prisma generate на Windows:
 * запущенный Nest/backend держит query_engine-windows.dll.node → EPERM.
 */
import { execSync } from "node:child_process";

const PORT = process.env.BACKEND_PORT?.trim() || process.env.PORT?.trim() || "4001";

function portInUse(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return out.trim().length > 0;
    }
    const out = execSync(`lsof -i :${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

if (portInUse(PORT)) {
  console.warn("");
  console.warn("⚠️  Backend, похоже, слушает порт", PORT);
  console.warn("   Остановите Nest (`npm run backend:dev`) перед `prisma generate`, иначе на Windows возможна ошибка EPERM.");
  console.warn("");
  console.warn("   Windows:");
  console.warn(`     netstat -ano | findstr :${PORT}`);
  console.warn("     taskkill /PID <PID> /F");
  console.warn("");
  console.warn("   Не используйте `taskkill /F /IM node.exe` — это остановит и frontend.");
  console.warn("");
  console.warn("   Подробнее: docs/operations/PRISMA_WINDOWS_EPERM.md");
  console.warn("");
  if (process.env.PRISMA_STRICT_PORT_CHECK === "1") {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
