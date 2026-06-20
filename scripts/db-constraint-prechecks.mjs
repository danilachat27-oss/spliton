/**
 * Run SQL constraint prechecks against Postgres (uses DATABASE_URL from .env).
 * Usage: npm run db:constraint-prechecks
 *
 * Exit code 1 if any data check fails (blocks CHECK / UNIQUE migrations).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** @type {Array<{ name: string; sql: string; optional?: boolean }>} */
const checks = [
  {
    name: 'wallet_balances_negative',
    sql: `
      SELECT wallet_id, available, locked, pending
      FROM wallet_balances
      WHERE available < 0 OR locked < 0 OR pending < 0
      LIMIT 50`,
  },
  {
    name: 'user_positions_invalid',
    sql: `
      SELECT id, user_id, release_id, units_total, units_available, units_locked
      FROM user_positions
      WHERE units_total < 0
         OR units_available < 0
         OR units_locked < 0
         OR units_available + units_locked > units_total
         OR avg_entry_price < 0
      LIMIT 50`,
  },
  {
    name: 'releases_units_invalid',
    sql: `
      SELECT id, title, total_units, units_available_primary, primary_unit_price
      FROM releases
      WHERE deleted_at IS NULL
        AND (
          total_units < 0
          OR units_available_primary < 0
          OR units_available_primary > total_units
          OR primary_unit_price < 0
        )
      LIMIT 50`,
  },
  {
    name: 'releases_share_pct_not_100',
    sql: `
      SELECT id, title,
        platform_share_pct, artist_share_pct, holder_share_pct
      FROM releases
      WHERE deleted_at IS NULL
        AND platform_share_pct IS NOT NULL
        AND artist_share_pct IS NOT NULL
        AND holder_share_pct IS NOT NULL
        AND ABS(
          platform_share_pct + artist_share_pct + holder_share_pct - 100
        ) > 0.0001
      LIMIT 50`,
  },
  {
    name: 'primary_raise_rounds_invalid',
    sql: `
      SELECT id, release_id, total_units, sold_units, raise_target_usdt, hard_cap_usdt
      FROM primary_raise_rounds
      WHERE total_units < 0
         OR sold_units < 0
         OR sold_units > total_units
         OR raise_target_usdt < 0
         OR hard_cap_usdt < 0
      LIMIT 50`,
  },
  {
    name: 'wallet_tx_deposit_amount_invalid',
    sql: `
      SELECT wt.id, wt.amount, wt.fee_amount, wt.net_amount, d.id AS deposit_id
      FROM wallet_transactions wt
      INNER JOIN deposits d ON d.wallet_tx_id = wt.id
      WHERE wt.amount <= 0 OR wt.fee_amount < 0 OR wt.net_amount < 0
      LIMIT 50`,
  },
  {
    name: 'wallet_tx_withdrawal_amount_invalid',
    sql: `
      SELECT wt.id, wt.amount, wt.fee_amount, wt.net_amount, w.id AS withdrawal_id
      FROM wallet_transactions wt
      INNER JOIN withdrawals w ON w.wallet_tx_id = wt.id
      WHERE wt.amount <= 0 OR wt.fee_amount < 0 OR wt.net_amount < 0
      LIMIT 50`,
  },
  {
    name: 'earning_distributions_duplicate_period',
    sql: `
      SELECT earning_period_id, COUNT(*)::int AS cnt
      FROM earning_distributions
      GROUP BY earning_period_id
      HAVING COUNT(*) > 1
      LIMIT 50`,
  },
  {
    name: 'market_listings_invalid',
    sql: `
      SELECT id, price_per_unit, units_total, units_available
      FROM market_listings
      WHERE deleted_at IS NULL
        AND (
          price_per_unit <= 0
          OR units_total <= 0
          OR units_available < 0
          OR units_available > units_total
        )
      LIMIT 50`,
  },
  {
    name: 'orders_units_invalid',
    sql: `
      SELECT id, units_total, units_filled, price_limit
      FROM orders
      WHERE units_total <= 0
         OR units_filled < 0
         OR units_filled > units_total
         OR (price_limit IS NOT NULL AND price_limit < 0)
      LIMIT 50`,
  },
  {
    name: 'trades_amounts_invalid',
    sql: `
      SELECT id, price, units, gross_amount, fee_total
      FROM trades
      WHERE price <= 0
         OR units <= 0
         OR gross_amount < 0
         OR fee_total < 0
         OR fee_total > gross_amount
      LIMIT 50`,
  },
  {
    name: 'order_fills_invalid',
    sql: `
      SELECT id, units, price, gross_amount, fee_amount, net_amount
      FROM order_fills
      WHERE units <= 0
         OR price <= 0
         OR gross_amount < 0
         OR fee_amount < 0
         OR net_amount < 0
         OR fee_amount > gross_amount
      LIMIT 50`,
  },
  {
    name: 'payouts_amounts_invalid',
    sql: `
      SELECT id, units_eligible, amount_gross, amount_net
      FROM payouts
      WHERE units_eligible < 0
         OR amount_gross < 0
         OR amount_net < 0
         OR amount_net > amount_gross
      LIMIT 50`,
  },
  {
    name: 'payouts_duplicate_user_distribution',
    sql: `
      SELECT user_id, earning_distribution_id, COUNT(*)::int AS cnt
      FROM payouts
      GROUP BY user_id, earning_distribution_id
      HAVING COUNT(*) > 1
      LIMIT 50`,
  },
  {
    name: 'fees_amount_invalid',
    sql: `
      SELECT id, amount_charged, rate, fixed_amount
      FROM fees
      WHERE amount_charged < 0
         OR (rate IS NOT NULL AND rate < 0)
         OR (fixed_amount IS NOT NULL AND fixed_amount < 0)
      LIMIT 50`,
  },
  {
    name: 'earning_distributions_amounts_invalid',
    sql: `
      SELECT id, total_distributable, per_unit_amount, snapshot_eligible_units
      FROM earning_distributions
      WHERE total_distributable < 0
         OR per_unit_amount < 0
         OR snapshot_eligible_units < 0
      LIMIT 50`,
  },
  {
    name: 'release_share_lots_invalid',
    sql: `
      SELECT id, units_total, units_remaining
      FROM release_share_lots
      WHERE units_total < 0
         OR units_remaining < 0
         OR units_remaining > units_total
      LIMIT 50`,
  },
  {
    name: 'pg_trgm_extension',
    optional: true,
    sql: `SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm'`,
  },
];

async function main() {
  const results = {};
  let failed = 0;

  for (const { name, sql, optional } of checks) {
    try {
      const rows = await prisma.$queryRawUnsafe(sql);
      const count = Array.isArray(rows) ? rows.length : 0;
      const ok = optional ? true : count === 0;
      if (!ok) failed += 1;
      results[name] = { ok, count, optional: Boolean(optional), sample: rows };
    } catch (err) {
      failed += 1;
      results[name] = { ok: false, error: String(err.message ?? err) };
    }
  }

  console.log(JSON.stringify(results, null, 2));

  if (failed > 0) {
    console.error(
      `\n[db-constraint-prechecks] ${failed} check(s) failed. Fix data before applying migrations 20260602120000 / 20260602120100.`,
    );
    process.exitCode = 1;
  } else {
    console.log('\n[db-constraint-prechecks] All required checks passed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
