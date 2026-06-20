import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const scenarios = [
  { name: "market_overview_stats 24h", sql: "SELECT market_overview_stats('24h')" },
  { name: "market_overview_stats 7d", sql: "SELECT market_overview_stats('7d')" },
  { name: "market_overview_charts 30d", sql: "SELECT market_overview_charts('30d')" },
  { name: "analytics_releases_overview 30d", sql: "SELECT analytics_releases_overview('30d')" },
  {
    name: "analytics_releases_search default",
    sql: "SELECT * FROM analytics_releases_search('30d', NULL, NULL, NULL, 'all', 'yield_desc', 1, 24, NULL)",
  },
  {
    name: "analytics_releases_search neon",
    sql: "SELECT * FROM analytics_releases_search('30d', 'neon', NULL, NULL, 'all', 'yield_desc', 1, 24, NULL)",
  },
];

async function main() {
  for (const { name, sql } of scenarios) {
    console.log(`\n=== EXPLAIN ANALYZE: ${name} ===`);
    const rows = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`);
    for (const row of rows) {
      console.log(row["QUERY PLAN"]);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
