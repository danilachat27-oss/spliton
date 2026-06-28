/**
 * Idempotent bootstrap for required legal policies on the project DB from .env.
 *
 * Usage:
 *   npx tsx apps/backend/scripts/bootstrap-legal-policies.ts --dry-run
 *   npx tsx apps/backend/scripts/bootstrap-legal-policies.ts --create-drafts
 *   npx tsx apps/backend/scripts/bootstrap-legal-policies.ts --publish-approved
 */
import 'dotenv/config';
import { LegalPolicyStatus, PrismaClient } from '@prisma/client';
import {
  BOOTSTRAP_POLICY_ENTRIES,
  BOOTSTRAP_VERSION,
} from '../src/modules/legal/legal-bootstrap-content';
import {
  createDraftPolicy,
  parseDatabaseUrl,
  planBootstrapActions,
  publishDraftPolicy,
  resolveBootstrapVersion,
  type BootstrapAction,
} from '../src/modules/legal/legal-bootstrap.util';
import { assessPolicyContentQuality } from '../src/modules/legal/legal-policy-quality.util';

type Mode = 'dry-run' | 'create-drafts' | 'publish-approved';

function parseMode(argv: string[]): Mode {
  const flags = new Set(argv.slice(2));
  if (flags.has('--dry-run')) return 'dry-run';
  if (flags.has('--create-drafts')) return 'create-drafts';
  if (flags.has('--publish-approved')) return 'publish-approved';
  throw new Error('Specify exactly one of: --dry-run, --create-drafts, --publish-approved');
}

function printAction(action: BootstrapAction): void {
  switch (action.action) {
    case 'SKIP_ACTIVE_EXISTS':
      console.log(`SKIP  ${action.type}: ACTIVE already exists`);
      break;
    case 'SKIP_VERSION_EXISTS':
      console.log(
        `SKIP  ${action.type}@${action.version}: ${action.status} already exists`,
      );
      break;
    case 'CREATE_DRAFT':
      console.log(
        `DRAFT ${action.type}@${action.version} (${action.contentLength} chars)`,
      );
      break;
    case 'PUBLISH':
      console.log(
        `PUBLISH ${action.type}@${action.version} (${action.contentLength} chars)`,
      );
      break;
    case 'BLOCKED_PUBLISH':
      console.log(
        `BLOCK ${action.type}@${action.version}: ${action.reasons.join('; ')}`,
      );
      break;
    default:
      break;
  }
}

async function main() {
  const mode = parseMode(process.argv);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const db = parseDatabaseUrl(databaseUrl);
  console.log('DB confirmation (no secrets):');
  console.log(`  host=${db.host}:${db.port}`);
  console.log(`  database=${db.database}`);
  console.log(`  schema=${db.schema}`);
  console.log(`  user=${db.user}`);
  console.log(`  mode=${mode}`);

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.legalPolicy.findMany({
      select: { type: true, version: true, status: true, content: true },
    });

    console.log('\nContent quality preview:');
    for (const entry of BOOTSTRAP_POLICY_ENTRIES) {
      const quality = assessPolicyContentQuality(entry.content, {
        minLength: entry.required ? 500 : 200,
      });
      console.log(
        `  ${entry.type}: ${entry.content.length} chars, publishable=${quality.publishable}${
          quality.reasons.length ? ` (${quality.reasons.join('; ')})` : ''
        }`,
      );
    }

    const actions = planBootstrapActions(BOOTSTRAP_POLICY_ENTRIES, existing, mode);
    console.log('\nPlanned actions:');
    for (const action of actions) printAction(action);

    if (mode === 'dry-run') {
      console.log('\nDry run complete — no writes.');
      return;
    }

    const entryByType = new Map(
      BOOTSTRAP_POLICY_ENTRIES.map((e) => [e.type, e] as const),
    );
    const draftIds = new Map<string, string>();

    for (const action of actions) {
      if (action.action === 'CREATE_DRAFT') {
        const entry = entryByType.get(action.type);
        if (!entry) continue;
        const row = await createDraftPolicy(prisma, entry, action.version);
        draftIds.set(`${action.type}:${action.version}`, row.id);
        console.log(`CREATED DRAFT ${row.type}@${row.version} id=${row.id}`);
      }
    }

    if (mode === 'publish-approved') {
      for (const action of actions) {
        if (action.action !== 'PUBLISH') continue;
        const active = await prisma.legalPolicy.findFirst({
          where: { type: action.type, status: LegalPolicyStatus.ACTIVE },
        });
        if (active) {
          console.log(`SKIP PUBLISH ${action.type}: ACTIVE already exists`);
          continue;
        }

        let draftId = draftIds.get(`${action.type}:${action.version}`);
        if (!draftId) {
          const draft = await prisma.legalPolicy.findFirst({
            where: {
              type: action.type,
              version: action.version,
              status: { in: [LegalPolicyStatus.DRAFT, LegalPolicyStatus.REVIEW] },
            },
          });
          draftId = draft?.id;
        }
        if (!draftId) {
          const entry = entryByType.get(action.type);
          if (!entry) continue;
          const version = resolveBootstrapVersion(
            (
              await prisma.legalPolicy.findMany({
                where: { type: action.type },
                select: { version: true },
              })
            ).map((r) => r.version),
            BOOTSTRAP_VERSION,
          );
          const created = await createDraftPolicy(prisma, entry, version);
          draftId = created.id;
        }

        const published = await publishDraftPolicy(prisma, draftId);
        console.log(
          `PUBLISHED ${published.type}@${published.version} id=${published.id} hash=${published.contentHash ? 'yes' : 'no'}`,
        );
      }
    }

    const summary = await prisma.legalPolicy.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    console.log('\nPost-run summary:');
    for (const row of summary) {
      console.log(`  ${row.status}: ${row._count._all}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
