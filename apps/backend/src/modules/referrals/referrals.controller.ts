import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PaginatedQueryDto } from '../../common/pagination/paginated-query.dto';
import { ReferralsService } from './referrals.service';
import { ApplyReferralCodeDto } from './dto/apply-referral-code.dto';

@Controller('api/v1/referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.referrals.getMe(user.id);
  }

  @Post('apply-code')
  applyCode(@CurrentUser() user: AuthUser, @Body() dto: ApplyReferralCodeDto) {
    return this.referrals.applyCodeForExistingUser(user.id, dto.code, {
      utmSource: dto.utmSource,
      utmCampaign: dto.utmCampaign,
    });
  }

  @Get('invites')
  invites(@CurrentUser() user: AuthUser, @Query() query: PaginatedQueryDto) {
    return this.referrals.listInvites(user.id, query.page, query.pageSize);
  }

  @Get('rewards')
  rewards(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginatedQueryDto,
    @Query('status') status?: string,
  ) {
    return this.referrals.listRewards(
      user.id,
      status,
      query.page,
      query.pageSize,
    );
  }

  @Get('statement')
  statement(@CurrentUser() user: AuthUser) {
    return this.referrals.getStatement(user.id);
  }
}
