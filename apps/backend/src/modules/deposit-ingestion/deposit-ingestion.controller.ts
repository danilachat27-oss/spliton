import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRoleCode } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { assertAdminArea } from '../admin/common/admin-permissions';
import { DepositIngestionService } from './deposit-ingestion.service';

@Controller('api/admin/v1/deposit-ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositIngestionController {
  constructor(private readonly ingestion: DepositIngestionService) {}

  @Get('health')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  health(@CurrentUser() user: AuthUser) {
    assertAdminArea(user.roles ?? [], 'deposits', 'view');
    return this.ingestion.providerHealth();
  }

  @Post('run')
  @Roles(
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COMPLIANCE,
  )
  run(@CurrentUser() user: AuthUser) {
    assertAdminArea(user.roles ?? [], 'deposits', 'mutate');
    return this.ingestion.tick();
  }
}
