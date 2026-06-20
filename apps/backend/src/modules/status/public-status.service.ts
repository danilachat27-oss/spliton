import { Injectable } from '@nestjs/common';
import { SystemIncidentStatus } from '@prisma/client';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async snapshot() {
    return this.cache.getOrSet(
      'system-status:snapshot',
      CACHE_TTL_MS.publicSystemStatus,
      () => this.loadSnapshot(),
    );
  }

  async listIncidents() {
    const snapshot = await this.loadSnapshot();
    return { items: snapshot.activeIncidents };
  }

  private async loadSnapshot() {
    const [components, activeIncidents, resolvedIncidents] = await Promise.all([
      this.prisma.systemStatusComponent.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.systemStatusIncident.findMany({
        where: {
          visiblePublic: true,
          status: { not: SystemIncidentStatus.RESOLVED },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: { updates: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
      this.prisma.systemStatusIncident.findMany({
        where: {
          visiblePublic: true,
          status: SystemIncidentStatus.RESOLVED,
          resolvedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { resolvedAt: 'desc' },
        take: 10,
        include: { updates: { orderBy: { createdAt: 'desc' }, take: 3 } },
      }),
    ]);

    const overall = components.some((c) => c.status === 'MAJOR_OUTAGE')
      ? 'major_outage'
      : components.some(
            (c) => c.status === 'PARTIAL_OUTAGE' || c.status === 'DEGRADED',
          )
        ? 'degraded'
        : components.some((c) => c.status === 'MAINTENANCE')
          ? 'maintenance'
          : 'operational';

    const mapIncident = (i: (typeof activeIncidents)[number]) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      severity: i.severity.toLowerCase(),
      status: i.status.toLowerCase(),
      affectedComponents: i.affectedComponentCodes,
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      updates: i.updates.map((u) => ({
        body: u.body,
        status: u.status?.toLowerCase() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    });

    const active = activeIncidents.map(mapIncident);
    const resolved = resolvedIncidents.map(mapIncident);

    return {
      overall,
      components: components.map((c) => ({
        code: c.code,
        name: c.name,
        status: c.status.toLowerCase(),
        message: c.message,
        updatedAt: c.updatedAt.toISOString(),
      })),
      activeIncidents: active,
      incidents: [...active, ...resolved],
    };
  }
}
