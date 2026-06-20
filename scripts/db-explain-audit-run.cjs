const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
function j(x){ return JSON.stringify(x,(k,v)=>typeof v==='bigint'?Number(v):v,null,2); }
async function ex(label, sql) {
  try {
    const rows = await p.$queryRawUnsafe("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + sql);
    const n = rows[0]["QUERY PLAN"][0].Plan;
    function fi(x) {
      if (x["Index Name"]) return x["Index Name"];
      for (const c of x.Plans || []) { const f = fi(c); if (f) return f; }
      return null;
    }
    function sm(x, d = 0) {
      const pad = "  ".repeat(d);
      const idx = x["Index Name"] ? " idx=" + x["Index Name"] : "";
      let lines = [pad + x["Node Type"] + idx + " rows=" + (x["Actual Rows"] ?? "?") + " time=" + (x["Actual Total Time"]?.toFixed(2) ?? "?") + "ms"];
      for (const c of x.Plans || []) lines = lines.concat(sm(c, d + 1).split("\n"));
      return lines.join("\n");
    }
    const pt = sm(n);
    const actualRows = n["Actual Rows"] ?? 0;
    const problem = pt.includes("Seq Scan") && actualRows > 500 && !label.includes("ilike");
    return { label, ok: true, scanType: n["Node Type"], estimatedRows: n["Plan Rows"], actualRows, actualTimeMs: Number((n["Actual Total Time"] || 0).toFixed(3)), indexName: fi(n), hasSeqScan: pt.includes("Seq Scan"), problem, planText: pt };
  } catch (e) {
    return { label, ok: false, error: String(e.message || e) };
  }
}
(async () => {
  const hot = ["user_positions","releases","deposits","withdrawals","wallet_transactions","wallets","market_listings","trades","users","artists","user_roles"];
  const arr = hot.map((t) => "'" + t + "'").join(",");
  const counts = await p.$queryRawUnsafe("SELECT relname AS table_name, n_live_tup::bigint AS est_rows FROM pg_stat_user_tables WHERE relname = ANY(ARRAY[" + arr + "]) ORDER BY n_live_tup DESC");
  const indexes = await p.$queryRawUnsafe("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename = ANY(ARRAY[" + arr + "]) ORDER BY tablename,indexname");
  const ext = await p.$queryRawUnsafe("SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','btree_gin')");
  const s = (await p.$queryRawUnsafe("SELECT (SELECT user_id FROM user_positions WHERE units_total>0 LIMIT 1) user_id,(SELECT release_id FROM user_positions WHERE units_total>0 LIMIT 1) release_id,(SELECT id FROM wallets LIMIT 1) wallet_id,(SELECT slug FROM releases WHERE deleted_at IS NULL LIMIT 1) slug,(SELECT symbol FROM releases WHERE deleted_at IS NULL LIMIT 1) symbol,(SELECT email FROM users LIMIT 1) sample_email"))[0];
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
  const explains = [];
  if (s.user_id) {
    explains.push(await ex("portfolio paginated", "SELECT id FROM user_positions WHERE user_id='" + s.user_id + "'::uuid AND units_total>0 ORDER BY units_total DESC LIMIT 20"));
    explains.push(await ex("portfolio user+release", "SELECT id FROM user_positions WHERE user_id='" + s.user_id + "'::uuid AND release_id='" + s.release_id + "'::uuid"));
    explains.push(await ex("portfolio created_at desc", "SELECT id FROM user_positions WHERE user_id='" + s.user_id + "'::uuid AND units_total>0 ORDER BY created_at DESC LIMIT 20"));
  }
  if (s.slug) explains.push(await ex("release slug", "SELECT id FROM releases WHERE slug='" + s.slug + "' AND deleted_at IS NULL LIMIT 1"));
  if (s.symbol) explains.push(await ex("release symbol", "SELECT id FROM releases WHERE symbol='" + s.symbol + "' AND deleted_at IS NULL LIMIT 1"));
  explains.push(await ex("deposits count", "SELECT COUNT(*) FROM deposits WHERE status IN ('CONFIRMED','CREDITED') AND created_at>='" + since30d + "'::timestamptz"));
  explains.push(await ex("deposits sum", "SELECT COALESCE(SUM(wt.amount),0) FROM wallet_transactions wt JOIN deposits d ON d.wallet_tx_id=wt.id WHERE d.status IN ('CONFIRMED','CREDITED') AND d.created_at>='" + since30d + "'::timestamptz"));
  explains.push(await ex("withdrawals count", "SELECT COUNT(*) FROM withdrawals WHERE status='COMPLETED' AND requested_at>='" + since30d + "'::timestamptz"));
  if (s.wallet_id) {
    explains.push(await ex("wallet activity", "SELECT id FROM wallet_transactions WHERE wallet_id='" + s.wallet_id + "'::uuid ORDER BY happened_at DESC LIMIT 20"));
    explains.push(await ex("wallet type status", "SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id='" + s.wallet_id + "''::uuid AND tx_type='DEPOSIT' AND status='COMPLETED'"));
    explains.push(await ex("wallet reference", "SELECT id FROM wallet_transactions WHERE wallet_id='" + s.wallet_id + "'::uuid AND reference_type='deposit' LIMIT 10"));
  }
  if (s.release_id) {
    explains.push(await ex("market depth", "SELECT id FROM market_listings WHERE release_id='" + s.release_id + "'::uuid AND deleted_at IS NULL AND status='ACTIVE' AND units_available>0 ORDER BY price_per_unit ASC LIMIT 100"));
    explains.push(await ex("market depth count", "SELECT COUNT(*) FROM market_listings WHERE release_id='" + s.release_id + "'::uuid AND deleted_at IS NULL AND status='ACTIVE' AND units_available>0"));
    explains.push(await ex("trades settled", "SELECT id FROM trades WHERE release_id='" + s.release_id + "'::uuid AND settlement_status='SETTLED' ORDER BY executed_at DESC LIMIT 40"));
    explains.push(await ex("trades 24h vol", "SELECT release_id,SUM(gross_amount) FROM trades WHERE release_id='" + s.release_id + "'::uuid AND executed_at>='" + since24h + "'::timestamptz AND settlement_status='SETTLED' GROUP BY release_id"));
  }
  const ep = String(s.sample_email || "test").split("@")[0].slice(0, 5);
  explains.push(await ex("users email ilike", "SELECT id FROM users WHERE email ILIKE '%" + ep + "%' ORDER BY created_at DESC LIMIT 20"));
  explains.push(await ex("users status sort", "SELECT id FROM users WHERE status='ACTIVE' ORDER BY created_at DESC LIMIT 20"));
  explains.push(await ex("users role join", "SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='USER' ORDER BY u.created_at DESC LIMIT 20"));
  explains.push(await ex("artists ilike", "SELECT id FROM artists WHERE name ILIKE '%a%' ORDER BY name LIMIT 200"));
  explains.push(await ex("releases title ilike", "SELECT id FROM releases WHERE deleted_at IS NULL AND title ILIKE '%a%' ORDER BY created_at DESC LIMIT 20"));
  console.log(j({ counts, indexes, ext, explains }));
  await p.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });