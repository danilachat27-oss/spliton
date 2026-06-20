import { Injectable } from '@nestjs/common';
import {
  ConsentSource,
  DisputeStatus,
  KycStatus,
  Prisma,
  SupportTicketStatus,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { EligibilityService } from '../../compliance/eligibility.service';
import { LegalConsentsService } from '../../legal/legal-consents.service';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { assertAdminArea } from '../common/admin-permissions';
import {
  assertSuperAdminRoleMutation,
  assertSuperAdminUserMutate,
} from '../common/admin-rbac';
import { throwAdminError } from '../common/admin-http.util';
import { HttpStatus } from '@nestjs/common';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import {
  apiStatusToUser,
  mapUserDetail,
  mapUserListItem,
  userStatusToApi,
} from './mappers/admin-user.mapper';
import type { AdminUserDetailDto } from './dto/admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly eligibility: EligibilityService,
    private readonly legalConsents: LegalConsentsService,
  ) {}

  private userInclude() {
    return {
      profile: true,
      userRoles: { include: { role: true } },
      wallets: { take: 1, include: { balance: true } },
      _count: { select: { positions: true } },
    } satisfies Prisma.UserInclude;
  }

  async list(roles: string[], query: AdminListQueryDto) {
    assertAdminArea(roles, 'users', 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { id: q },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (query.status) {
      where.status = apiStatusToUser(query.status);
    }
    if (query.role) {
      where.userRoles = {
        some: { role: { code: query.role as UserRoleCode } },
      };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    const sortBy = query.sortBy ?? 'createdAt';
    const dir = query.sortDir ?? 'desc';
    if (sortBy === 'email') orderBy.email = dir;
    else if (sortBy === 'status') orderBy.status = dir;
    else orderBy.createdAt = dir;

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: this.userInclude(),
      }),
    ]);

    return buildPaginated(
      rows.map((r) => mapUserListItem(r)),
      total,
      page,
      pageSize,
    );
  }

  async getListStats(roles: string[]) {
    assertAdminArea(roles, 'users', 'view');
    const staffRoleCodes = [...ADMIN_PANEL_ROLE_CODES] as UserRoleCode[];
    const [total, active, blocked, staff] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({
        where: {
          status: { in: [UserStatus.SUSPENDED, UserStatus.BANNED] },
        },
      }),
      this.prisma.user.count({
        where: {
          userRoles: {
            some: { role: { code: { in: staffRoleCodes } } },
          },
        },
      }),
    ]);
    return { total, active, blocked, staff };
  }

  async getById(roles: string[], id: string): Promise<AdminUserDetailDto> {
    assertAdminArea(roles, 'users', 'view');
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: {
        ...this.userInclude(),
        kycVerifications: { take: 1, orderBy: { updatedAt: 'desc' } },
      },
    });
    if (!row) {
      throwAdminError('USER_NOT_FOUND', 'User not found', HttpStatus.NOT_FOUND);
    }
    return mapUserDetail(row);
  }

  async patchStatus(
    actorId: string,
    actorRoles: string[],
    id: string,
    status: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertSuperAdminUserMutate(actorRoles);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throwAdminError('USER_NOT_FOUND', 'User not found', HttpStatus.NOT_FOUND);
    }
    const before = { status: userStatusToApi(user.status) };
    const next = apiStatusToUser(status);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: next },
      include: this.userInclude(),
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'user',
      entityId: id,
      action: 'user.status_change',
      before,
      after: { status, note },
      ...meta,
    });
    return mapUserDetail(updated);
  }

  async assignRole(
    actorId: string,
    actorRoles: string[],
    userId: string,
    roleCode: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
    confirmSuperAdmin?: boolean,
  ) {
    assertSuperAdminRoleMutation(actorRoles);
    if (roleCode === UserRoleCode.SUPER_ADMIN && !confirmSuperAdmin) {
      throwAdminError(
        'SUPER_ADMIN_CONFIRM_REQUIRED',
        'Assigning SUPER_ADMIN requires explicit confirmation',
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.prisma.role.findUnique({
      where: { code: roleCode as UserRoleCode },
    });
    if (!role) {
      throwAdminError('ROLE_NOT_FOUND', 'Role not found', HttpStatus.NOT_FOUND);
    }
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId: role.id },
    });
    if (!existing) {
      await this.prisma.userRole.create({
        data: { userId, roleId: role.id },
      });
    }
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'user',
      entityId: userId,
      action: 'user.role_assign',
      after: { role: roleCode, note, confirmSuperAdmin: !!confirmSuperAdmin },
      ...meta,
    });
    return this.getById(actorRoles, userId);
  }

  async removeRole(
    actorId: string,
    actorRoles: string[],
    userId: string,
    roleCode: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertSuperAdminRoleMutation(actorRoles);

    if (roleCode === UserRoleCode.SUPER_ADMIN) {
      await this.assertNotLastSuperAdmin(userId, actorId);
    }

    const role = await this.prisma.role.findUnique({
      where: { code: roleCode as UserRoleCode },
    });
    if (!role) {
      throwAdminError('ROLE_NOT_FOUND', 'Role not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'user',
      entityId: userId,
      action: 'user.role_remove',
      after: { role: roleCode },
      ...meta,
    });
    return this.getById(actorRoles, userId);
  }

  private async assertNotLastSuperAdmin(targetUserId: string, actorId: string) {
    const superRole = await this.prisma.role.findUnique({
      where: { code: UserRoleCode.SUPER_ADMIN },
    });
    if (!superRole) return;

    const superAdmins = await this.prisma.userRole.findMany({
      where: { roleId: superRole.id },
    });

    const targetIsSuper = superAdmins.some((r) => r.userId === targetUserId);
    if (targetIsSuper && superAdmins.length <= 1) {
      throwAdminError(
        'LAST_SUPER_ADMIN',
        'Cannot remove the last SUPER_ADMIN in the system',
        HttpStatus.CONFLICT,
      );
    }

    if (targetUserId === actorId && superAdmins.length <= 1) {
      throwAdminError(
        'SELF_DEMOTION_FORBIDDEN',
        'Cannot demote yourself as the last SUPER_ADMIN',
        HttpStatus.CONFLICT,
      );
    }
  }

  async block(
    actorId: string,
    actorRoles: string[],
    userId: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.patchStatus(
      actorId,
      actorRoles,
      userId,
      'suspended',
      note,
      meta,
    );
  }

  async unblock(
    actorId: string,
    actorRoles: string[],
    userId: string,
    note: string | undefined,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    return this.patchStatus(actorId, actorRoles, userId, 'active', note, meta);
  }

  async getOperatorContext(roles: string[], userId: string) {
    assertAdminArea(roles, 'users', 'view');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true, emailVerifiedAt: true },
    });
    if (!user) {
      throwAdminError('USER_NOT_FOUND', 'User not found', HttpStatus.NOT_FOUND);
    }

    const [
      kyc,
      registerMissing,
      acceptedConsents,
      activeSessionsCount,
      securityEvents,
      openSupportTickets,
      openDisputes,
      depositEligibility,
      withdrawEligibility,
      primaryEligibility,
      secondaryEligibility,
      amlProfile,
      complianceFlagsCount,
    ] = await Promise.all([
      this.prisma.kycVerification.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          level: true,
          countryCode: true,
          documentType: true,
          documentReference: true,
          submittedAt: true,
          reviewedAt: true,
          reviewedBy: true,
          rejectReason: true,
          provider: true,
        },
      }),
      this.legalConsents.getMissingConsents(userId, ConsentSource.REGISTER),
      this.prisma.userLegalConsent.count({ where: { userId } }),
      this.prisma.userSession.count({ where: { userId, revokedAt: null } }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'auth', actorUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          ip: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      this.prisma.supportTicket.findMany({
        where: { userId, status: { not: SupportTicketStatus.CLOSED } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, subject: true, status: true, priority: true, updatedAt: true },
      }),
      this.prisma.dispute.findMany({
        where: {
          userId,
          status: {
            notIn: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.CLOSED],
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, subject: true, status: true, priority: true, type: true, updatedAt: true },
      }),
      this.eligibility.canDeposit(userId),
      this.eligibility.canWithdraw(userId),
      this.eligibility.canBuyPrimary(userId),
      this.eligibility.canTradeSecondary(userId),
      this.prisma.userAmlProfile.findUnique({ where: { userId } }),
      this.prisma.riskFlag.count({ where: { userId, status: 'OPEN' } }),
    ]);

    const openDisputesCount = openDisputes.length;
    const openSupportTicketsCount = openSupportTickets.length;

    return {
      user: {
        id: user!.id,
        email: user!.email,
        status: userStatusToApi(user!.status),
        emailVerified: Boolean(user!.emailVerifiedAt),
      },
      kyc: kyc
        ? {
            id: kyc.id,
            status: kyc.status,
            level: kyc.level,
            countryCode: kyc.countryCode,
            documentType: kyc.documentType,
            documentReference: kyc.documentReference,
            submittedAt: kyc.submittedAt?.toISOString() ?? null,
            reviewedAt: kyc.reviewedAt?.toISOString() ?? null,
            reviewedByUserId: kyc.reviewedBy,
            rejectionReason: kyc.rejectReason,
            provider: kyc.provider,
            documentViewerAvailable: false,
          }
        : { status: KycStatus.NOT_STARTED, documentViewerAvailable: false },
      legal: {
        acceptedConsentsCount: acceptedConsents,
        missingRegisterConsents: registerMissing.map((m) => ({
          type: m.type,
          version: m.activeVersion,
          title: m.title,
        })),
      },
      sessions: { activeCount: activeSessionsCount },
      securityEvents: securityEvents.map((ev) => ({
        id: ev.id,
        action: ev.action,
        ip: ev.ip,
        userAgent: ev.userAgent,
        createdAt: ev.createdAt.toISOString(),
      })),
      support: {
        openCount: openSupportTicketsCount,
        recent: openSupportTickets.map((t) => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          updatedAt: t.updatedAt.toISOString(),
        })),
      },
      disputes: {
        openCount: openDisputesCount,
        recent: openDisputes.map((d) => ({
          id: d.id,
          subject: d.subject,
          status: d.status,
          type: d.type,
          priority: d.priority,
          updatedAt: d.updatedAt.toISOString(),
        })),
      },
      eligibility: {
        deposit: depositEligibility,
        withdraw: withdrawEligibility,
        primary: primaryEligibility,
        secondary: secondaryEligibility,
      },
      risk: {
        amlRiskLevel: amlProfile?.riskLevel ?? null,
        complianceOpenFlagsCount: complianceFlagsCount,
        accountFrozen: Boolean(
          (amlProfile?.restrictions as Record<string, boolean> | null)?.freezeAccount,
        ),
      },
    };
  }
}
