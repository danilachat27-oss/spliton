import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { throwAdminError } from '../common/admin-http.util';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';

const STAFF_ROLE_CODES = ADMIN_PANEL_ROLE_CODES.filter(
  (r) => r !== UserRoleCode.SUPPORT,
) as UserRoleCode[];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ACCOUNTANT: 'Бухгалтер',
  CONTENT_MANAGER: 'Контент-менеджер',
  SUPPORT_MANAGER: 'Менеджер поддержки',
  COMPLIANCE: 'Compliance',
  SUPPORT: 'Поддержка',
  BUSINESS_ANALYST: 'Бизнес-аналитик',
};

@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(roles: string[]) {
    this.assertView(roles);

    const dbRoles = await this.prisma.role.findMany({
      where: { code: { in: STAFF_ROLE_CODES } },
      orderBy: { code: 'asc' },
    });

    const counts = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      where: { role: { code: { in: STAFF_ROLE_CODES } } },
      _count: { userId: true },
    });
    const countByRole = new Map(counts.map((c) => [c.roleId, c._count.userId]));

    return {
      items: dbRoles.map((r) => ({
        code: r.code,
        label: ROLE_LABELS[r.code] ?? r.code,
        userCount: countByRole.get(r.id) ?? 0,
        mutable:
          r.code === UserRoleCode.SUPER_ADMIN
            ? roles.includes(UserRoleCode.SUPER_ADMIN)
            : true,
      })),
    };
  }

  async getByCode(roles: string[], code: string) {
    this.assertView(roles);
    const role = await this.prisma.role.findUnique({
      where: { code: code as UserRoleCode },
    });
    if (!role) {
      throwAdminError('ROLE_NOT_FOUND', 'Role not found', HttpStatus.NOT_FOUND);
    }

    const userCount = await this.prisma.userRole.count({
      where: { roleId: role.id },
    });

    return {
      code: role.code,
      label: ROLE_LABELS[role.code] ?? role.code,
      userCount,
      description: this.roleDescription(role.code),
    };
  }

  async usersByRole(roles: string[], code: string) {
    this.assertView(roles);
    const role = await this.prisma.role.findUnique({
      where: { code: code as UserRoleCode },
    });
    if (!role) {
      throwAdminError('ROLE_NOT_FOUND', 'Role not found', HttpStatus.NOT_FOUND);
    }

    const rows = await this.prisma.userRole.findMany({
      where: { roleId: role.id },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      items: rows.map((r) => ({
        userId: r.userId,
        email: r.user.email,
        displayName: r.user.profile?.displayName ?? null,
        assignedAt: r.createdAt.toISOString(),
      })),
    };
  }

  private roleDescription(code: UserRoleCode): string {
    switch (code) {
      case UserRoleCode.SUPER_ADMIN:
        return 'Полный доступ ко всем разделам и управлению ролями';
      case UserRoleCode.ACCOUNTANT:
        return 'Финансовые разделы: пополнения, выводы, кошельки, начисления';
      case UserRoleCode.CONTENT_MANAGER:
        return 'Треки и раунды без доступа к финансовым данным';
      case UserRoleCode.SUPPORT_MANAGER:
        return 'Поддержка и пользователи (read-only финансы)';
      case UserRoleCode.COMPLIANCE:
        return 'Compliance, риски, блокировки и заморозки';
      default:
        return 'Staff role';
    }
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
