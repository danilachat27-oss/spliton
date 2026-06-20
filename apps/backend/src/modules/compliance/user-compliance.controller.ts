import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConsentSource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { EligibilityService } from './eligibility.service';

@Controller('api/v1/compliance')
@UseGuards(JwtAuthGuard)
export class UserComplianceController {
  constructor(private readonly eligibility: EligibilityService) {}

  @Get('eligibility/primary')
  canBuyPrimary(@CurrentUser() user: AuthUser) {
    return this.eligibility.canBuyPrimary(user.id);
  }

  @Get('eligibility/secondary')
  canTradeSecondary(@CurrentUser() user: AuthUser) {
    return this.eligibility.canTradeSecondary(user.id);
  }

  @Get('eligibility/withdrawal')
  canWithdraw(@CurrentUser() user: AuthUser) {
    return this.eligibility.canWithdraw(user.id);
  }

  @Get('eligibility/deposit')
  canDeposit(@CurrentUser() user: AuthUser) {
    return this.eligibility.canDeposit(user.id);
  }
}
