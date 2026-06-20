import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const scenarios = [
  {
    name: "newest empty catalog",
    sql: `SELECT * FROM catalog_search_releases(NULL, 'all', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, 'newest', 1, 24)`,
  },
  {
    name: "search by title/artist",
    sql: `SELECT * FROM catalog_search_releases('Catalog', 'all', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, 'relevance', 1, 24)`,
  },
  {
    name: "genre Electronic + minYield 5",
    sql: `SELECT * FROM catalog_search_releases(NULL, 'all', ARRAY['Electronic']::text[], NULL, NULL, NULL, NULL, 5, NULL, NULL, false, false, NULL, 'yield_desc', 1, 24)`,
  },
  {
    name: "secondary only",
    sql: `SELECT * FROM catalog_search_releases(NULL, 'secondary', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false, NULL, 'newest', 1, 24)`,
  },
  {
    name: "sort volume24h desc",
    sql: `SELECT * FROM catalog_search_releases(NULL, 'all', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, 'volume24h_desc', 1, 24)`,
  },
];

async function main() {
  for (const { name, sql } of scenarios) {
    console.log(`\n=== EXPLAIN ANALYZE: ${name} ===`);
    const rows = await prisma.$queryRawUnsafe(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`,
    );
    for (const row of rows) {
      console.log(row["QUERY PLAN"]);
    }
  }

  const stats = await prisma.$queryRaw`SELECT catalog_get_stats() AS stats`;
  console.log("\n=== catalog_get_stats sample ===");
  console.log(JSON.stringify(stats[0]?.stats, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
