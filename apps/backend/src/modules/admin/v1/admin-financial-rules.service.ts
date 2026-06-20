import { HttpStatus, Injectable } from '@nestjs/common';
import {
  PlatformFinancialRuleCategory,
  PlatformFinancialRuleValueType,
  Prisma,
  UserRoleCode,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';

const CATEGORY_API: Record<PlatformFinancialRuleCategory, string> = {
  PRIMARY: 'primary',
  WITHDRAWAL: 'withdrawal',
  SECONDARY: 'secondary',
  DEPOSIT: 'deposit',
  RISK: 'risk',
  REPORT: 'report',
  OTHER: 'other',
};

const VALUE_TYPE_API: Record<PlatformFinancialRuleValueType, string> = {
  PERCENT: 'percent',
  FIXED_USDT: 'fixed_usdt',
  AMOUNT_USDT: 'amount_usdt',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  STRING: 'string',
};

@Injectable()
export class AdminFinancialRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  private map(row: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    category: PlatformFinancialRuleCategory;
    valueType: PlatformFinancialRuleValueType;
    value: string;
    minValue: string | null;
    maxValue: string | null;
    asset: string | null;
    network: string | null;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    isActive: boolean;
    changeReason: string | null;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      category: CATEGORY_API[row.category],
      valueType: VALUE_TYPE_API[row.valueType],
      value: row.value,
      minValue: row.minValue,
      maxValue: row.maxValue,
      asset: row.asset,
      network: row.network,
      effectiveFrom: row.effectiveFrom.toISOString(),
      effectiveTo: row.effectiveTo?.toISOString() ?? null,
      isActive: row.isActive,
      changeReason: row.changeReason,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  assertView(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'ACCOUNTANT',
        'BUSINESS_ANALYST',
        'COMPLIANCE',
      ].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  assertMutate(roles: string[]) {
    if (!roles.includes(UserRoleCode.SUPER_ADMIN)) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Only Super Admin can change financial rules',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async list(roles: string[], category?: string) {
    this.assertView(roles);
    const where: Prisma.PlatformFinancialRuleWhereInput = { isActive: true };
    if (category) {
      const cat = category.toUpperCase() as PlatformFinancialRuleCategory;
      if (Object.values(PlatformFinancialRuleCategory).includes(cat)) {
        where.category = cat;
      }
    }
    const rows = await this.prisma.platformFinancialRule.findMany({
      where,
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
    return { items: rows.map((r) => this.map(r)) };
  }

  async getHistory(roles: string[], ruleId: string) {
    this.assertView(roles);
    const rows = await this.prisma.platformFinancialRuleHistory.findMany({
      where: { ruleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: rows.map((h) => ({
        id: h.id,
        code: h.code,
        previousValue: h.previousValue,
        newValue: h.newValue,
        effectiveFrom: h.effectiveFrom.toISOString(),
        changeReason: h.changeReason,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  previewImpact(value: string, valueType: string, code: string) {
    const amount = 1000;
    const num = Number(value) || 0;
    const userLines: string[] = [];
    const platformLines: string[] = [];
    if (code.includes('percent') || valueType === 'percent') {
      const fee = (amount * num) / 100;
      userLines.push(
        `При операции ${amount} USDT комиссия ≈ ${fee.toFixed(2)} USDT`,
      );
      platformLines.push(`Доход платформы ≈ ${fee.toFixed(2)} USDT`);
    } else if (valueType === 'fixed_usdt') {
      userLines.push(`Фиксированная комиссия ${num} USDT за операцию`);
      platformLines.push(`Доход платформы ${num} USDT с операции`);
    }
    return {
      sampleAmountUsdt: amount,
      userImpact: userLines,
      platformImpact: platformLines,
      affectedFlows: [code],
    };
  }

  async patch(
    actorId: string,
    roles: string[],
    id: string,
    input: { value: string; effectiveFrom?: string; reason: string },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const rule = await this.prisma.platformFinancialRule.findUnique({
      where: { id },
    });
    if (!rule) {
      throwAdminError('RULE_NOT_FOUND', 'Rule not found', HttpStatus.NOT_FOUND);
    }

    const effectiveFrom = input.effectiveFrom
      ? new Date(input.effectiveFrom)
      : new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.platformFinancialRuleHistory.create({
        data: {
          ruleId: rule.id,
          code: rule.code,
          previousValue: rule.value,
          newValue: input.value,
          effectiveFrom,
          changedByUserId: actorId,
          changeReason: input.reason,
        },
      });
      return tx.platformFinancialRule.update({
        where: { id },
        data: {
          value: input.value,
          effectiveFrom,
          changedByUserId: actorId,
          changeReason: input.reason,
        },
      });
    });

    await this.syncPlatformFeeSetting(updated.code, updated.value);
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'platform_financial_rule',
      entityId: id,
      action: 'settings.fee.update',
      before: { value: rule.value },
      after: { value: input.value, reason: input.reason },
      ...meta,
    });

    return {
      rule: this.map(updated),
      preview: this.previewImpact(
        input.value,
        VALUE_TYPE_API[updated.valueType],
        updated.code,
      ),
    };
  }

  private async syncPlatformFeeSetting(code: string, value: string) {
    const active = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!active) return;
    const num = Number(value);
    if (Number.isNaN(num)) return;
    const patch: Prisma.PlatformFeeSettingUpdateInput = {};
    if (code === 'primary_purchase_percent') patch.primaryPurchaseFeePct = num;
    if (code === 'withdrawal_fixed_usdt') patch.withdrawalFeeFixed = num;
    if (code === 'secondary_market_percent') patch.secondaryMarketFeePct = num;
    if (Object.keys(patch).length === 0) return;
    await this.prisma.platformFeeSetting.update({
      where: { id: active.id },
      data: patch,
    });
  }
}
