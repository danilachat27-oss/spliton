import { HttpStatus, Injectable } from '@nestjs/common';
import {
  NotificationSeverity,
  SystemComponentStatus,
  SystemIncidentSeverity,
  SystemIncidentStatus,
} from '@prisma/client';
import { CacheInvalidationService } from '../../../common/platform/cache/cache-invalidation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';
import { NotificationEventsService } from '../../notifications/notification-events.service';

@Injectable()
export class AdminSystemStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  private assertManage(roles: string[]) {
    assertMatrixSection(roles, 'systemStatus', 'mutate');
  }

  private assertView(roles: string[]) {
    assertMatrixSection(roles, 'systemStatus', 'view');
  }

  async listComponents(roles: string[]) {
    this.assertView(roles);
    const rows = await this.prisma.systemStatusComponent.findMany({
      orderBy: { code: 'asc' },
    });
    return {
      items: rows.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        status: c.status.toLowerCase(),
        message: c.message,
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async patchComponent(
    actorId: string,
    roles: string[],
    code: string,
    status: string,
    message: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const normalized = status.toUpperCase() as SystemComponentStatus;
    if (!Object.values(SystemComponentStatus).includes(normalized)) {
      throwAdminError(
        'INVALID_STATUS',
        'Invalid status',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = await this.prisma.systemStatusComponent.update({
      where: { code },
      data: {
        status: normalized,
        message: message ?? null,
        updatedByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_status_component',
      entityId: row.id,
      action: 'status.component_update',
      after: { code, status },
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return {
      code: row.code,
      status: row.status.toLowerCase(),
      message: row.message,
    };
  }

  async listIncidents(roles: string[]) {
    this.assertView(roles);
    const rows = await this.prisma.systemStatusIncident.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { updates: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    return {
      items: rows.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        severity: i.severity.toLowerCase(),
        status: i.status.toLowerCase(),
        affectedComponentCodes: i.affectedComponentCodes,
        startedAt: i.startedAt.toISOString(),
        resolvedAt: i.resolvedAt?.toISOString() ?? null,
        visiblePublic: i.visiblePublic,
        updates: i.updates.map((u) => ({
          id: u.id,
          body: u.body,
          status: u.status?.toLowerCase() ?? null,
          createdAt: u.createdAt.toISOString(),
        })),
      })),
    };
  }

  async createIncident(
    actorId: string,
    roles: string[],
    data: {
      title: string;
      description: string;
      severity: string;
      affectedComponentCodes: string[];
      visiblePublic?: boolean;
    },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const sev = data.severity.toUpperCase() as SystemIncidentSeverity;
    const row = await this.prisma.systemStatusIncident.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        severity: Object.values(SystemIncidentSeverity).includes(sev)
          ? sev
          : SystemIncidentSeverity.MEDIUM,
        affectedComponentCodes: data.affectedComponentCodes ?? [],
        visiblePublic: data.visiblePublic ?? true,
        createdByUserId: actorId,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_status_incident',
      entityId: row.id,
      action: 'status.incident_create',
      after: { title: row.title },
      ...meta,
    });
    const severityMap: Record<SystemIncidentSeverity, NotificationSeverity> = {
      LOW: NotificationSeverity.INFO,
      MEDIUM: NotificationSeverity.WARNING,
      HIGH: NotificationSeverity.WARNING,
      CRITICAL: NotificationSeverity.CRITICAL,
    };
    void this.notificationEvents.systemIncidentCreated({
      incidentId: row.id,
      title: row.title,
      severity: severityMap[row.severity] ?? NotificationSeverity.WARNING,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return { id: row.id };
  }

  async resolveIncident(
    actorId: string,
    roles: string[],
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    await this.prisma.systemStatusIncident.update({
      where: { id },
      data: { status: SystemIncidentStatus.RESOLVED, resolvedAt: new Date() },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_status_incident',
      entityId: id,
      action: 'status.incident_resolve',
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return { id, status: 'resolved' };
  }

  async addIncidentUpdate(
    actorId: string,
    roles: string[],
    id: string,
    body: string,
    status: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertManage(roles);
    const st = status?.toUpperCase() as SystemIncidentStatus | undefined;
    await this.prisma.systemStatusUpdate.create({
      data: {
        incidentId: id,
        body: body.trim(),
        status:
          st && Object.values(SystemIncidentStatus).includes(st)
            ? st
            : undefined,
        createdByUserId: actorId,
      },
    });
    if (st) {
      await this.prisma.systemStatusIncident.update({
        where: { id },
        data: { status: st },
      });
    }
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'system_status_incident',
      entityId: id,
      action: 'status.incident_update',
      after: { bodyLength: body.length, status },
      ...meta,
    });
    this.cacheInvalidation.onSystemStatusChange();
    return { ok: true };
  }
}
