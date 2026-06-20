import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  UserRoleCode,
  WithdrawalApprovalDecision,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { OperationalLimitsService } from './operational-limits.service';

export type ApprovalRequirement = {
  role: UserRoleCode;
  label: string;
};

export type WithdrawalApprovalStatus = {
  required: ApprovalRequirement[];
  approved: Array<{ role: string; approverUserId: string; at: string }>;
  satisfied: boolean;
  tier: 'small' | 'medium' | 'large';
};

const ROLE_PRIORITY: UserRoleCode[] = [
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
];

@Injectable()
export class WithdrawalApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limits: OperationalLimitsService,
  ) {}

  async getRequiredRoles(
    amount: Prisma.Decimal,
    hasRiskFlag: boolean,
  ): Promise<ApprovalRequirement[]> {
    const cfg = await this.limits.getLimits();
    const medium = new Prisma.Decimal(cfg.mediumWithdrawalUsdt);
    const large = new Prisma.Decimal(cfg.largeWithdrawalUsdt);

    const required: ApprovalRequirement[] = [
      { role: UserRoleCode.ACCOUNTANT, label: 'Бухгалтерия' },
    ];

    if (amount.greaterThanOrEqualTo(medium) || hasRiskFlag) {
      if (!required.some((r) => r.role === UserRoleCode.COMPLIANCE)) {
        required.push({
          role: UserRoleCode.COMPLIANCE,
          label: 'Compliance',
        });
      }
    }
    if (amount.greaterThanOrEqualTo(large)) {
      required.push({
        role: UserRoleCode.SUPER_ADMIN,
        label: 'Super Admin',
      });
    }
    return required;
  }

  async getApprovalStatus(
    withdrawalId: string,
    amount: Prisma.Decimal,
    hasRiskFlag: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<WithdrawalApprovalStatus> {
    const required = await this.getRequiredRoles(amount, hasRiskFlag);
    const db = tx ?? this.prisma;
    const rows = await db.withdrawalApproval.findMany({
      where: {
        withdrawalId,
        decision: WithdrawalApprovalDecision.APPROVED,
      },
      orderBy: { createdAt: 'asc' },
    });
    const approved = rows.map((r) => ({
      role: r.approverRole,
      approverUserId: r.approverUserId,
      at: r.createdAt.toISOString(),
    }));
    const approvedRoles = new Set(rows.map((r) => r.approverRole));
    const satisfied = required.every((req) => approvedRoles.has(req.role));

    const cfg = await this.limits.getLimits();
    const large = new Prisma.Decimal(cfg.largeWithdrawalUsdt);
    const medium = new Prisma.Decimal(cfg.mediumWithdrawalUsdt);
    let tier: WithdrawalApprovalStatus['tier'] = 'small';
    if (amount.greaterThanOrEqualTo(large)) tier = 'large';
    else if (amount.greaterThanOrEqualTo(medium)) tier = 'medium';

    return { required, approved, satisfied, tier };
  }

  resolveActorApprovalRole(
    actorRoles: string[],
    required: ApprovalRequirement[],
  ): string | null {
    for (const role of ROLE_PRIORITY) {
      if (
        actorRoles.includes(role) &&
        required.some((r) => r.role === role)
      ) {
        return role;
      }
    }
    if (
      actorRoles.includes(UserRoleCode.SUPER_ADMIN) &&
      required.some((r) => r.role === UserRoleCode.SUPER_ADMIN)
    ) {
      return UserRoleCode.SUPER_ADMIN;
    }
    if (
      actorRoles.includes(UserRoleCode.ADMIN) &&
      required.some((r) => r.role === UserRoleCode.ACCOUNTANT) &&
      !actorRoles.includes(UserRoleCode.ACCOUNTANT)
    ) {
      return UserRoleCode.ADMIN;
    }
    return null;
  }

  async recordApproval(
    withdrawalId: string,
    approverUserId: string,
    approverRole: string,
    reason?: string,
  ) {
    const existing = await this.prisma.withdrawalApproval.findFirst({
      where: {
        withdrawalId,
        approverRole,
        decision: WithdrawalApprovalDecision.APPROVED,
      },
    });
    if (existing) {
      throwAdminError(
        'APPROVAL_DUPLICATE',
        'Эта роль уже подтвердила вывод',
        HttpStatus.CONFLICT,
      );
    }

    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        walletTx: { include: { wallet: true } },
      },
    });
    if (!withdrawal) {
      throwAdminError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (withdrawal.walletTx.wallet.userId === approverUserId) {
      throwAdminError(
        'SELF_APPROVAL_FORBIDDEN',
        'Нельзя подтверждать собственный вывод',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.withdrawalApproval.create({
      data: {
        withdrawalId,
        approverUserId,
        approverRole,
        decision: WithdrawalApprovalDecision.APPROVED,
        reason: reason?.trim() || null,
      },
    });
  }

  async assertApprovalsSatisfied(
    withdrawalId: string,
    amount: Prisma.Decimal,
    hasRiskFlag: boolean,
  ): Promise<void> {
    const status = await this.getApprovalStatus(
      withdrawalId,
      amount,
      hasRiskFlag,
    );
    if (!status.satisfied) {
      const missing = status.required
        .filter((r) => !status.approved.some((a) => a.role === r.role))
        .map((r) => r.label)
        .join(', ');
      throwAdminError(
        'APPROVALS_INCOMPLETE',
        `Требуются подтверждения: ${missing}`,
        HttpStatus.CONFLICT,
        { approvalStatus: status },
      );
    }
  }

  async recordRejectOrHold(
    withdrawalId: string,
    approverUserId: string,
    approverRole: string,
    decision: 'REJECTED' | 'HOLD',
    reason: string,
  ) {
    if (!reason?.trim()) {
      throwAdminError(
        'REASON_REQUIRED',
        'Укажите причину',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.prisma.withdrawalApproval.create({
      data: {
        withdrawalId,
        approverUserId,
        approverRole,
        decision:
          decision === 'REJECTED'
            ? WithdrawalApprovalDecision.REJECTED
            : WithdrawalApprovalDecision.HOLD,
        reason: reason.trim(),
      },
    });
  }

  shouldMoveToApproved(status: WithdrawalApprovalStatus): boolean {
    return status.satisfied;
  }

  isTerminalForApproval(status: WithdrawalStatus): boolean {
    return (
      status === WithdrawalStatus.COMPLETED ||
      status === WithdrawalStatus.CANCELLED ||
      status === WithdrawalStatus.REJECTED ||
      status === WithdrawalStatus.FAILED
    );
  }
}
