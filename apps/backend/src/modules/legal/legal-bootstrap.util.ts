import {
  LegalPolicyContentFormat,
  LegalPolicyStatus,
  LegalPolicyType,
  PrismaClient,
} from '@prisma/client';
import type { BootstrapPolicyEntry } from './legal-bootstrap-content';
import { assessPolicyContentQuality } from './legal-policy-quality.util';
import { computeLegalPolicyContentHash } from './legal-content-hash.util';

export type DbConnectionInfo = {
  host: string;
  port: string;
  database: string;
  schema: string;
  user: string;
};

export type BootstrapAction =
  | { action: 'SKIP_ACTIVE_EXISTS'; type: LegalPolicyType }
  | { action: 'SKIP_VERSION_EXISTS'; type: LegalPolicyType; version: string; status: LegalPolicyStatus }
  | { action: 'CREATE_DRAFT'; type: LegalPolicyType; version: string; contentLength: number }
  | { action: 'PUBLISH'; type: LegalPolicyType; version: string; contentLength: number }
  | { action: 'BLOCKED_PUBLISH'; type: LegalPolicyType; version: string; reasons: string[] };

export function parseDatabaseUrl(databaseUrl: string): DbConnectionInfo {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema') ?? 'public';
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, '') || 'postgres',
    schema,
    user: decodeURIComponent(url.username || 'unknown'),
  };
}

export function resolveBootstrapVersion(
  existingVersions: string[],
  baseVersion: string,
): string {
  if (!existingVersions.includes(baseVersion)) return baseVersion;
  const prefix = baseVersion.replace(/\.\d+$/, '');
  let n = 2;
  while (existingVersions.includes(`${prefix}.${n}`)) n += 1;
  return `${prefix}.${n}`;
}

export function planBootstrapActions(
  entries: BootstrapPolicyEntry[],
  existing: Array<{ type: LegalPolicyType; version: string; status: LegalPolicyStatus; content: string }>,
  mode: 'dry-run' | 'create-drafts' | 'publish-approved',
): BootstrapAction[] {
  const actions: BootstrapAction[] = [];
  const byType = new Map<LegalPolicyType, typeof existing>();
  for (const row of existing) {
    const list = byType.get(row.type) ?? [];
    list.push(row);
    byType.set(row.type, list);
  }

  for (const entry of entries) {
    const rows = byType.get(entry.type) ?? [];
    const active = rows.find((r) => r.status === LegalPolicyStatus.ACTIVE);
    if (active) {
      actions.push({ action: 'SKIP_ACTIVE_EXISTS', type: entry.type });
      continue;
    }

    const versions = rows.map((r) => r.version);
    const version = resolveBootstrapVersion(versions, entry.version);
    const sameVersion = rows.find((r) => r.version === version);
    const publishableDraft = rows.find(
      (r) =>
        r.status === LegalPolicyStatus.DRAFT ||
        r.status === LegalPolicyStatus.REVIEW,
    );
    const quality = assessPolicyContentQuality(entry.content, {
      minLength: entry.required ? 500 : 200,
    });

    if (mode === 'publish-approved') {
      if (!quality.publishable) {
        if (!sameVersion && !publishableDraft) {
          actions.push({
            action: 'CREATE_DRAFT',
            type: entry.type,
            version,
            contentLength: entry.content.length,
          });
        }
        actions.push({
          action: 'BLOCKED_PUBLISH',
          type: entry.type,
          version: publishableDraft?.version ?? sameVersion?.version ?? version,
          reasons: quality.reasons,
        });
        continue;
      }

      if (publishableDraft) {
        actions.push({
          action: 'PUBLISH',
          type: entry.type,
          version: publishableDraft.version,
          contentLength: entry.content.length,
        });
        continue;
      }

      actions.push({
        action: 'CREATE_DRAFT',
        type: entry.type,
        version,
        contentLength: entry.content.length,
      });
      actions.push({
        action: 'PUBLISH',
        type: entry.type,
        version,
        contentLength: entry.content.length,
      });
      continue;
    }

    if (mode === 'create-drafts' || mode === 'dry-run') {
      const exactVersion = rows.find((r) => r.version === entry.version);
      if (exactVersion) {
        actions.push({
          action: 'SKIP_VERSION_EXISTS',
          type: entry.type,
          version: entry.version,
          status: exactVersion.status,
        });
        continue;
      }
      if (sameVersion) {
        actions.push({
          action: 'SKIP_VERSION_EXISTS',
          type: entry.type,
          version,
          status: sameVersion.status,
        });
        continue;
      }
      actions.push({
        action: 'CREATE_DRAFT',
        type: entry.type,
        version,
        contentLength: entry.content.length,
      });
      continue;
    }
  }

  return actions;
}

export async function createDraftPolicy(
  prisma: PrismaClient,
  entry: BootstrapPolicyEntry,
  version: string,
) {
  const contentFormat = LegalPolicyContentFormat.MARKDOWN;
  const contentHash = computeLegalPolicyContentHash({
    type: entry.type,
    version,
    contentFormat,
    content: entry.content,
  });
  return prisma.legalPolicy.create({
    data: {
      type: entry.type,
      version,
      title: entry.title,
      content: entry.content,
      contentFormat,
      contentHash,
      status: LegalPolicyStatus.DRAFT,
      requiresUserConsent: true,
    },
  });
}

export async function publishDraftPolicy(prisma: PrismaClient, id: string) {
  const row = await prisma.legalPolicy.findUnique({ where: { id } });
  if (!row) throw new Error(`Policy ${id} not found`);
  if (
    row.status !== LegalPolicyStatus.DRAFT &&
    row.status !== LegalPolicyStatus.REVIEW
  ) {
    throw new Error(`Policy ${id} is not publishable (${row.status})`);
  }
  const now = new Date();
  const effectiveAt = row.effectiveAt && row.effectiveAt > now ? row.effectiveAt : now;
  const contentHash = computeLegalPolicyContentHash({
    type: row.type,
    version: row.version,
    contentFormat: row.contentFormat,
    content: row.content,
  });
  return prisma.$transaction(async (tx) => {
    await tx.legalPolicy.updateMany({
      where: { type: row.type, status: LegalPolicyStatus.ACTIVE },
      data: { status: LegalPolicyStatus.ARCHIVED },
    });
    return tx.legalPolicy.update({
      where: { id },
      data: {
        status: LegalPolicyStatus.ACTIVE,
        publishedAt: now,
        effectiveAt,
        contentHash,
      },
    });
  });
}
