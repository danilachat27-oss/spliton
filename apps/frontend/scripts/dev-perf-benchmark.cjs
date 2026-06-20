const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn, execSync } = require("child_process");

const frontendDir = path.join(__dirname, "..");
const nextDir = path.join(frontendDir, ".next");
const routes = [
  { path: "/admin", label: "admin" },
  { path: "/catalog", label: "catalog" },
  { path: "/assets/overview", label: "assets_overview" },
  { path: "/dashboard/secondary-market", label: "secondary_market" },
];

function dirSizeMB(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else total += fs.statSync(p).size;
    }
  }
  return Math.round((total / 1024 / 1024) * 100) / 100;
}

function cleanNext() {
  fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}

function freePort(port) {
  try {
    execSync(`node "${path.join(__dirname, "free-dev-ports.cjs")}" ${port}`, {
      cwd: frontendDir,
      stdio: "ignore",
    });
  } catch {}
}

async function stopDevServer(child) {
  if (child && !child.killed) {
    try { child.kill("SIGTERM"); } catch {}
    await new Promise((r) => setTimeout(r, 4000));
    try { child.kill("SIGKILL"); } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  freePort(3000);
  await new Promise((r) => setTimeout(r, 1000));
}

function fetchRoute(routePath) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port: 3000, path: routePath, timeout: 120000 }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout " + routePath)); });
  });
}

function parseReadyMs(log) {
  const m = log.match(/Ready in (\d+)ms/);
  return m ? Number(m[1]) : null;
}

function parseCompileMs(log, routePath) {
  const esc = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("GET " + esc + " \\d+ in ([\\d.]+)(ms|s)", "g");
  const matches = [...log.matchAll(re)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const val = Number(last[1]);
  return last[2] === "s" ? Math.round(val * 1000) : Math.round(val);
}

function parseNextCompileMs(log, routePath) {
  const esc = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("GET " + esc + " \\d+ in [\\d.]+(?:ms|s) \\(next\\.js: ([\\d.]+)(ms|s)", "g");
  const matches = [...log.matchAll(re)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const val = Number(last[1]);
  return last[2] === "s" ? Math.round(val * 1000) : Math.round(val);
}

async function runMode(mode) {
  freePort(3000);
  cleanNext();
  const args = mode === "webpack" ? ["next", "dev", "--webpack", "-p", "3000"] : ["next", "dev", "-p", "3000"];
  let log = "";
  let ready = false;
  const child = spawn("npx", args, {
    cwd: frontendDir,
    shell: true,
    env: { ...process.env, FORCE_COLOR: "0", NEXT_TELEMETRY_DISABLED: "1" },
  });
  child.stdout.on("data", (d) => { log += d.toString(); });
  child.stderr.on("data", (d) => { log += d.toString(); });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Ready timeout " + mode)), 180000);
    const iv = setInterval(() => {
      if (/Ready in \d+ms/.test(log)) {
        ready = true;
        clearTimeout(t);
        clearInterval(iv);
        resolve();
      }
    }, 200);
    child.on("exit", (code, signal) => {
      if (!ready && signal !== "SIGTERM" && signal !== "SIGKILL") {
        clearTimeout(t);
        clearInterval(iv);
        reject(new Error("exit " + code + " before ready\n" + log.slice(-2000)));
      }
    });
  });

  const readyMs = parseReadyMs(log);
  const sizes = { after_cold_start: dirSizeMB(nextDir) };
  const compiles = {};

  for (const r of routes) {
    await fetchRoute(r.path);
    await new Promise((r) => setTimeout(r, 500));
    compiles[r.label] = {
      totalMs: parseCompileMs(log, r.path),
      nextJsMs: parseNextCompileMs(log, r.path),
    };
    sizes["after_" + r.label] = dirSizeMB(nextDir);
  }

  await new Promise((r) => setTimeout(r, 15000));
  sizes.after_15min_idle = dirSizeMB(nextDir);

  await stopDevServer(child);

  return { mode, readyMs, compiles, sizes, logTail: log.slice(-4000) };
}

(async () => {
  const results = [];
  for (const mode of ["turbopack", "webpack"]) {
    console.log("=== Running", mode, "===");
    results.push(await runMode(mode));
  }
  console.log(JSON.stringify({ results, projectSizeMB: dirSizeMB(path.join(frontendDir, "..", "..")) }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });