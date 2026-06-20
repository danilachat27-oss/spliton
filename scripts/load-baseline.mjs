#!/usr/bin/env node
/**
 * Spliton load baseline — measures API/DB under realistic think time.
 * Does NOT prove 20k capacity.
 *
 * Modes:
 *   smoke    — 2 VU, 10s, think 800–1200ms (throttle on)
 *   baseline — 15 VU, 20s, think 300–1500ms (use LOAD_TEST_MODE + raised THROTTLE_LIMIT)
 *   stress   — 50 VU, 30s, think 50–100ms (opt-in only)
 *
 * Env:
 *   API_BASE_URL, LOAD_TEST_MODE, THROTTLE_LIMIT, THROTTLE_ENABLED
 *   LOAD_TEST_TOKEN or LOAD_TEST_EMAIL + LOAD_TEST_PASSWORD (with --auth)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Keys from repo .env always win over stale shell exports (e.g. old API_BASE_URL=:4000). */
const FILE_ENV_PRIORITY_KEYS = new Set([
  'API_BASE_URL',
  'PORT',
  'LOAD_TEST_MODE',
  'THROTTLE_LIMIT',
  'THROTTLE_ENABLED',
  'LOAD_TEST_EMAIL',
  'LOAD_TEST_PASSWORD',
  'LOAD_TEST_TOKEN',
]);

function loadDotEnv() {
  const fromFiles = {};
  for (const rel of ['.env', 'apps/backend/.env']) {
    const path = resolve(process.cwd(), rel);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      fromFiles[key] = value;
      if (FILE_ENV_PRIORITY_KEYS.has(key)) {
        process.env[key] = value;
      } else if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
  return fromFiles;
}

const fileEnv = loadDotEnv();

function resolveApiBaseUrl() {
  const explicit =
    fileEnv.API_BASE_URL?.trim() || process.env.API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const port = fileEnv.PORT?.trim() || process.env.PORT?.trim() || '4001';
  return `http://localhost:${port}`;
}

const base = resolveApiBaseUrl();
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const MODE_PRESETS = {
  smoke: { vus: 2, duration: 10, thinkMin: 800, thinkMax: 1200 },
  baseline: { vus: 15, duration: 20, thinkMin: 300, thinkMax: 1500 },
  read10: { vus: 10, duration: 120, thinkMin: 300, thinkMax: 1500 },
  read30: { vus: 30, duration: 180, thinkMin: 300, thinkMax: 1500 },
  read50: { vus: 50, duration: 300, thinkMin: 300, thinkMax: 1500 },
  stress: { vus: 50, duration: 30, thinkMin: 50, thinkMax: 100 },
};

const mode = args.mode ?? 'baseline';
const preset = MODE_PRESETS[mode] ?? MODE_PRESETS.baseline;
const durationSec = Number(args.duration ?? preset.duration);
const vus = Number(args.vus ?? preset.vus);
const thinkMin = Number(args['think-min'] ?? preset.thinkMin);
const thinkMax = Number(args['think-max'] ?? preset.thinkMax);
const includeAuth = args.auth === 'true' || process.env.LOAD_BASELINE_AUTH === '1';

const PREFLIGHT_PATHS = [
  '/api/v1/system-status',
  '/api/v1/platform/fees',
  '/api/v1/catalog/releases?page=1&pageSize=5',
];

const PUBLIC_SCENARIOS = [
  { name: 'health', path: '/health' },
  { name: 'catalog_releases', path: '/api/v1/catalog/releases?page=1&pageSize=20' },
  { name: 'catalog_filters', path: '/api/v1/catalog/filters' },
  { name: 'market_overview', path: '/api/v1/market/overview/summary' },
  { name: 'secondary_listings', path: '/api/v1/market/listings?page=1&pageSize=20' },
  { name: 'platform_fees', path: '/api/v1/platform/fees' },
  { name: 'calculator_config', path: '/api/v1/services/calculator/config' },
  { name: 'system_status', path: '/api/v1/system-status' },
  { name: 'public_news', path: '/api/v1/news?page=1&pageSize=10' },
];

const AUTH_SCENARIOS = [
  { name: 'me', path: '/api/v1/me' },
  { name: 'wallet_summary', path: '/api/v1/wallet' },
  { name: 'wallet_activity', path: '/api/v1/wallet/activity?page=1&pageSize=20' },
  { name: 'portfolio_overview', path: '/api/v1/portfolio/overview' },
  { name: 'portfolio_positions', path: '/api/v1/portfolio/positions' },
  { name: 'portfolio_activity', path: '/api/v1/portfolio/activity' },
  { name: 'payouts_history', path: '/api/v1/portfolio/payouts/history' },
  { name: 'wallet_withdrawals', path: '/api/v1/wallet/withdrawals' },
  { name: 'accounting_statements', path: '/api/v1/accounting/statements' },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomThink() {
  return thinkMin + Math.random() * (thinkMax - thinkMin);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function is5xx(status) {
  return status >= 500 && status < 600;
}

async function probe(path, headers = {}) {
  const url = `${base}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', ...headers } });
    const ms = performance.now() - start;
    let bodySnippet = '';
    try {
      bodySnippet = (await res.text()).slice(0, 120);
    } catch {
      bodySnippet = '';
    }
    return { url, ok: res.ok, status: res.status, ms, bodySnippet };
  } catch (err) {
    return {
      url,
      ok: false,
      status: 0,
      ms: performance.now() - start,
      bodySnippet: String(err),
    };
  }
}

function isRoutingFailure(r) {
  return r.status === 404 || r.bodySnippet.includes('NOT_FOUND');
}

async function probeWithRetry(path, headers) {
  let last = await probe(path, headers);
  for (let i = 0; i < 3 && !last.ok && last.status === 429; i++) {
    console.log(`  [preflight retry] ${path} got 429 — waiting 3s`);
    await sleep(3000);
    last = await probe(path, headers);
  }
  return last;
}

async function resolveAuthToken() {
  const token = process.env.LOAD_TEST_TOKEN?.trim();
  if (token) return token;

  const email = process.env.LOAD_TEST_EMAIL?.trim();
  const password = process.env.LOAD_TEST_PASSWORD?.trim();
  if (!email || !password) return null;

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LOAD_TEST login failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const access = json?.tokens?.accessToken;
  if (!access) throw new Error('LOAD_TEST login: missing tokens.accessToken');
  return access;
}

async function runPreflight(authHeaders) {
  console.log('=== Spliton load baseline ===');
  console.log(`API_BASE_URL: ${base}`);
  console.log(`mode: ${mode} | VU: ${vus} | duration: ${durationSec}s | think: ${thinkMin}–${thinkMax}ms`);
  console.log(
    `backend throttle hint: LOAD_TEST_MODE=${process.env.LOAD_TEST_MODE ?? 'false'} THROTTLE_LIMIT=${process.env.THROTTLE_LIMIT ?? '(default)'} THROTTLE_ENABLED=${process.env.THROTTLE_ENABLED ?? '(default)'}`,
  );
  console.log('Preflight endpoints:');
  for (const path of PREFLIGHT_PATHS) {
    console.log(`  - ${base}${path}`);
  }
  console.log('');

  const results = [];
  for (const path of PREFLIGHT_PATHS) {
    results.push(await probeWithRetry(path));
  }

  for (const r of results) {
    const tag = r.ok ? 'OK' : r.status === 429 ? 'RATE_LIMITED' : 'FAIL';
    console.log(`[preflight ${tag}] ${r.status} ${r.url} (${r.ms.toFixed(1)}ms)`);
    if (!r.ok) console.log(`  body: ${r.bodySnippet}`);
  }

  const critical = results.filter(
    (r) =>
      r.url.includes('/api/v1/system-status') || r.url.includes('/api/v1/platform/fees'),
  );
  if (critical.some(isRoutingFailure) || critical.some((r) => r.status === 0)) {
    console.error('\nENV/ROUTING FAILURE: API_BASE_URL does not point to Spliton backend.');
    process.exit(1);
  }

  if (includeAuth) {
    if (!authHeaders.Authorization) {
      console.error('\nAuth requested but LOAD_TEST_TOKEN / LOAD_TEST_EMAIL+PASSWORD not set.');
      process.exit(1);
    }
    const me = await probeWithRetry('/api/v1/me', authHeaders);
    console.log(`[preflight auth] ${me.status} ${me.url}`);
    if (me.status === 401 || me.status === 403 || isRoutingFailure(me)) {
      console.error('\nENV/AUTH FAILURE: token invalid or me endpoint unreachable.');
      process.exit(1);
    }
  }

  console.log('\nPreflight passed.\n');
}

async function hit(path, headers = {}) {
  const start = performance.now();
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json', ...headers },
    });
    const ms = performance.now() - start;
    return { ms, status: res.status, routingFailure: res.status === 404 };
  } catch {
    return { ms: performance.now() - start, status: 0, routingFailure: false };
  }
}

function recordHit(bucket, r) {
  bucket.total += 1;
  bucket.latenciesAll.push(r.ms);
  const key = String(r.status);
  bucket.statusCounts[key] = (bucket.statusCounts[key] ?? 0) + 1;

  if (r.routingFailure) {
    bucket.routingFailures += 1;
    return;
  }
  if (r.status >= 200 && r.status < 300) {
    bucket.ok2xx += 1;
    bucket.latencies2xx.push(r.ms);
  } else if (r.status === 429) {
    bucket.count429 += 1;
  } else if (is5xx(r.status)) {
    bucket.count5xx += 1;
  }
}

async function worker(scenario, endAt, bucket, headers) {
  while (Date.now() < endAt) {
    const r = await hit(scenario.path, headers);
    recordHit(bucket, r);
    await sleep(randomThink());
  }
}

function summarize(bucket, scenarioName, sec) {
  const total = bucket.total;
  const pct = (n) => (total ? ((n / total) * 100).toFixed(2) : '0.00');
  bucket.latencies2xx.sort((a, b) => a - b);
  bucket.latenciesAll.sort((a, b) => a - b);

  return {
    endpoint: scenarioName,
    requests: total,
    pct2xx: pct(bucket.ok2xx),
    pct429: pct(bucket.count429),
    pct5xx: pct(bucket.count5xx),
    rps: total ? (total / sec).toFixed(2) : '0.00',
    p50_2xx: percentile(bucket.latencies2xx, 50).toFixed(1),
    p95_2xx: percentile(bucket.latencies2xx, 95).toFixed(1),
    p99_2xx: percentile(bucket.latencies2xx, 99).toFixed(1),
    p95_overall: percentile(bucket.latenciesAll, 95).toFixed(1),
    routingFailures: bucket.routingFailures,
    statusCounts: bucket.statusCounts,
  };
}

function printTable(title, rows) {
  console.log(`\n## ${title}`);
  console.log(
    '| Endpoint | 2xx % | 429 % | 5xx % | RPS | p50 2xx | p95 2xx | p99 2xx |',
  );
  console.log('|----------|------:|------:|------:|----:|--------:|--------:|--------:|');
  for (const r of rows) {
    console.log(
      `| ${r.endpoint} | ${r.pct2xx} | ${r.pct429} | ${r.pct5xx} | ${r.rps} | ${r.p50_2xx} | ${r.p95_2xx} | ${r.p99_2xx} |`,
    );
  }
}

async function runScenarioGroup(scenarios, headers, label) {
  const rows = [];
  for (const scenario of scenarios) {
    const endAt = Date.now() + durationSec * 1000;
    const bucket = {
      total: 0,
      ok2xx: 0,
      count429: 0,
      count5xx: 0,
      routingFailures: 0,
      latencies2xx: [],
      latenciesAll: [],
      statusCounts: {},
    };
    const workers = Array.from({ length: vus }, () =>
      worker(scenario, endAt, bucket, headers),
    );
    await Promise.all(workers);

    if (bucket.routingFailures > 0) {
      console.error(
        `\nENV/ROUTING FAILURE during ${scenario.name}: ${bucket.routingFailures} NOT_FOUND.`,
      );
      process.exit(1);
    }

    const row = summarize(bucket, scenario.name, durationSec);
    rows.push(row);
    const mix = Object.entries(bucket.statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    console.log(`[${label}] ${scenario.name} — 2xx ${row.pct2xx}% | 429 ${row.pct429}% | RPS ${row.rps}`);
    if (mix) console.log(`  status mix: ${mix}`);
  }
  return rows;
}

function printVerdict(publicRows, authRows) {
  const all = [...publicRows, ...authRows];
  let throttleLimited = false;
  let serverErrors = false;

  for (const r of all) {
    if (Number(r.pct429) > 5) throttleLimited = true;
    if (Number(r.pct5xx) > 0.5) serverErrors = true;
  }

  console.log('\n=== Verdict ===');
  if (throttleLimited) {
    console.log('THROTTLE LIMITED — capacity result invalid (429 > 5% on one or more endpoints).');
  }
  if (serverErrors) {
    console.log('SERVER ERRORS — investigate (5xx > 0.5%).');
  }
  const valid =
    !throttleLimited && !serverErrors && all.some((r) => Number(r.pct2xx) > 0);
  console.log(valid ? 'VALID — meaningful performance signal.' : 'INVALID — fix throttle/env or errors first.');
  console.log('\nNote: baseline only — not a capacity proof for 20k users.');
}

async function main() {
  let authToken = null;
  if (includeAuth) {
    authToken = await resolveAuthToken();
  }
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  await runPreflight(authHeaders);

  const publicRows = await runScenarioGroup(PUBLIC_SCENARIOS, {}, 'public');
  printTable('Public endpoints', publicRows);

  let authRows = [];
  if (includeAuth) {
    authRows = await runScenarioGroup(AUTH_SCENARIOS, authHeaders, 'auth');
    printTable('Auth endpoints', authRows);
  }

  printVerdict(publicRows, authRows);

  const reportPath = process.env.LOAD_BASELINE_REPORT_PATH;
  if (reportPath) {
    const fs = await import('node:fs');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          at: new Date().toISOString(),
          base,
          mode,
          vus,
          durationSec,
          thinkMin,
          thinkMax,
          includeAuth,
          public: publicRows,
          auth: authRows,
        },
        null,
        2,
      ),
    );
    console.log(`\nReport written: ${reportPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
