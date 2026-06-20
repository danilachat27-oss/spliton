import type { Prisma } from '@prisma/client';

export function resolveAdminTracksListOrderBy(
  sortBy?: string,
  sortDir: 'asc' | 'desc' = 'desc',
): Prisma.ReleaseOrderByWithRelationInput | Prisma.ReleaseOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'title':
      return { title: sortDir };
    case 'raiseTargetUsdt':
      return { raiseTargetUsdt: sortDir };
    case 'hardCapUsdt':
      return { hardCapUsdt: sortDir };
    case 'primaryUnitPrice':
      return { primaryUnitPrice: sortDir };
    case 'holderSharePct':
      return { holderSharePct: sortDir };
    case 'totalUnits':
      return { totalUnits: sortDir };
    case 'soldUnits':
      return sortDir === 'asc'
        ? [{ totalUnits: 'asc' }, { unitsAvailablePrimary: 'desc' }]
        : [{ totalUnits: 'desc' }, { unitsAvailablePrimary: 'asc' }];
    case 'promoBudgetUsdt':
      return { promoBudgetUsdt: sortDir };
    case 'updatedAt':
      return { updatedAt: sortDir };
    case 'createdAt':
      return { createdAt: sortDir };
    default:
      return { createdAt: 'desc' };
  }
}
