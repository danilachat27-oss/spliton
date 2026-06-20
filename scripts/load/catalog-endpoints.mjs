/**
 * Lightweight catalog endpoint smoke/load check using native fetch.
 *
 * Usage:
 *   node scripts/load/catalog-endpoints.mjs
 *   API_BASE_URL=http://localhost:4001 node scripts/load/catalog-endpoints.mjs --iterations 50 --concurrency 10
 */
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:4001").replace(/\/$/, "");
const iterations = Number.parseInt(process.argv.find((a) => a.startsWith("--iterations="))?.split("=")[1] ?? "30", 10);
const concurrency = Number.parseInt(process.argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? "5", 10);

const SCENARIOS = [
  { name: "releases-default", path: "/api/v1/catalog/releases?page=1&pageSize=24" },
  { name: "releases-search", path: "/api/v1/catalog/releases?search=test&page=1&pageSize=24" },
  { name: "stats", path: "/api/v1/catalog/stats" },
  { name: "filters", path: "/api/v1/catalog/filters" },
  { name: "suggestions", path: "/api/v1/catalog/search/suggestions?q=rel" },
];

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function runScenario(scenario) {
  const latencies = [];
  let errors = 0;
  let idx = 0;

  async function worker() {
    while (idx < iterations) {
      const current = idx;
      idx += 1;
      const started = performance.now();
      try {
        const res = await fetch(`${API_BASE_URL}${scenario.path}`, { method: "GET" });
        if (!res.ok) errors += 1;
      } catch {
        errors += 1;
      } finally {
        latencies.push(performance.now() - started);
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const elapsedMs = performance.now() - startedAt;
  const rps = (iterations / elapsedMs) * 1000;

  return {
    name: scenario.name,
    path: scenario.path,
    iterations,
    concurrency,
    errors,
    errorRatePct: Number(((errors / iterations) * 100).toFixed(2)),
    p50Ms: Number(percentile(latencies, 50).toFixed(1)),
    p95Ms: Number(percentile(latencies, 95).toFixed(1)),
    p99Ms: Number(percentile(latencies, 99).toFixed(1)),
    rps: Number(rps.toFixed(1)),
    elapsedMs: Number(elapsedMs.toFixed(1)),
  };
}

async function main() {
  console.log(`Catalog load check → ${API_BASE_URL}`);
  console.log(`iterations=${iterations}, concurrency=${concurrency}\n`);

  const results = [];
  for (const scenario of SCENARIOS) {
    results.push(await runScenario(scenario));
  }

  console.table(results);

  const releases = results.find((r) => r.name === "releases-default");
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  if (totalErrors > 0) {
    console.error(`FAIL: ${totalErrors} request errors across scenarios`);
    process.exitCode = 1;
  } else if (releases && releases.p95Ms > 500) {
    console.warn(`WARN: releases-default p95=${releases.p95Ms}ms exceeds 500ms target`);
  } else {
    console.log("PASS: no HTTP errors; releases p95 within target (or not measured).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
