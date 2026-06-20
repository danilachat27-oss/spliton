import { Injectable, Logger } from '@nestjs/common';
import {
  SystemAlertSeverity,
  SystemAlertSource,
  SystemAlertStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizeErrorMessage } from './log-sanitizer';
import { ErrorTrackingService } from './error-tracking.service';

export type CreateSystemAlertInput = {
  code: string;
  title: string;
  message: string;
  severity: SystemAlertSeverity;
  source: SystemAlertSource;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  runbookKey?: string;
};

@Injectable()
export class SystemAlertService {
  private readonly logger = new Logger(SystemAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  async createIfNotOpen(input: CreateSystemAlertInput) {
    try {
      const existing = await this.prisma.systemAlert.findFirst({
        where: {
          code: input.code,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          status: {
            in: [SystemAlertStatus.OPEN, SystemAlertStatus.ACKNOWLEDGED],
          },
        },
      });
      if (existing) return existing;

      const safeMessage = sanitizeErrorMessage(input.message);
      const alert = await this.prisma.systemAlert.create({
        data: {
          code: input.code,
          title: input.title,
          message: safeMessage,
          severity: input.severity,
          source: input.source,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata ? (input.metadata as object) : undefined,
          runbookKey: input.runbookKey,
        },
      });

      this.logger.warn(
        JSON.stringify({
          event: 'system_alert.created',
          code: alert.code,
          severity: alert.severity,
          source: alert.source,
          alertId: alert.id,
        }),
      );

      if (input.severity === SystemAlertSeverity.CRITICAL) {
        this.errorTracking.captureMessage(
          `${input.code}: ${input.title}`,
          'error',
          { alertId: alert.id, source: input.source },
        );
      }

      return alert;
    } catch (err) {
      this.logger.warn(
        `Failed to create system alert ${input.code}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  async list(params: {
    status?: SystemAlertStatus;
    severity?: SystemAlertSeverity;
    source?: SystemAlertSource;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.source ? { source: params.source } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.systemAlert.count({ where }),
      this.prisma.systemAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { items, total, page, pageSize };
  }

  async acknowledge(id: string, actorUserId: string) {
    return this.prisma.systemAlert.update({
      where: { id },
      data: {
        status: SystemAlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedByUserId: actorUserId,
      },
    });
  }

  async resolve(id: string, actorUserId: string) {
    return this.prisma.systemAlert.update({
      where: { id },
      data: {
        status: SystemAlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedByUserId: actorUserId,
      },
    });
  }

  async countOpenCritical() {
    return this.prisma.systemAlert.count({
      where: {
        status: {
          in: [SystemAlertStatus.OPEN, SystemAlertStatus.ACKNOWLEDGED],
        },
        severity: SystemAlertSeverity.CRITICAL,
      },
    });
  }
}
