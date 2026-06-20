import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { assertAdminArea } from '../common/admin-permissions';
import { WalletReconciliationService } from '../common/wallet-reconciliation.service';

class RunReconciliationDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === false || value === 'false') return false;
    if (value === true || value === 'true') return true;
    return undefined;
  })
  dryRun?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  walletIds?: string[];
}

@Controller('api/admin/v1/ledger/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminLedgerReconciliationController {
  constructor(private readonly reconciliation: WalletReconciliationService) {}

  @Post('runs')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  run(
    @CurrentUser() user: AuthUser,
    @Body() body: RunReconciliationDto,
    @Req() req: Request,
  ) {
    const roles = user.roles ?? [];
    assertAdminArea(
      roles,
      'wallets',
      body.dryRun === false ? 'mutate' : 'view',
    );
    return this.reconciliation.run({
      dryRun: body.dryRun !== false,
      walletIds: body.walletIds,
      actorUserId: user.id,
      actorRoles: roles,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('runs/latest')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  latest(@CurrentUser() user: AuthUser) {
    assertAdminArea(user.roles ?? [], 'wallets', 'view');
    return this.reconciliation.getLatestRun();
  }

  @Get('runs/:id')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  getRun(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    assertAdminArea(user.roles ?? [], 'wallets', 'view');
    return this.reconciliation.getRun(id);
  }

  @Get('runs/:id/report')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="reconciliation-report.csv"',
  )
  async report(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    assertAdminArea(user.roles ?? [], 'wallets', 'view');
    const csv = await this.reconciliation.buildReportCsv(id);
    return csv;
  }
}
