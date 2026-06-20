import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PartnerStatus, PartnerTier, UserRoleCode } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { requestMeta } from '../admin/common/admin-http.util';
import { PartnersService } from './partners.service';
import { ReferralRewardsService } from './referral-rewards.service';
import { PrismaService } from '../../prisma/prisma.service';

const VIEW = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
  UserRoleCode.COMPLIANCE,
  UserRoleCode.BUSINESS_ANALYST,
  UserRoleCode.SUPPORT_MANAGER,
] as const;

const FINANCE = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.ACCOUNTANT,
] as const;

const COMPLIANCE = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.COMPLIANCE,
] as const;

@Controller('api/admin/v1/referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminReferralsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partners: PartnersService,
    private readonly rewards: ReferralRewardsService,
  ) {}

  @Get('summary')
  @Roles(...VIEW)
  async summary() {
    const [invites, rewardsPending, partnersPending, topReferrers] =
      await Promise.all([
        this.prisma.referralAttribution.count(),
        this.prisma.referralReward.count({
          where: { status: { in: ['PENDING', 'HELD_FOR_REVIEW', 'QUALIFIED'] } },
        }),
        this.prisma.partnerProfile.count({
          where: { status: { in: ['APPLIED', 'IN_REVIEW'] } },
        }),
        this.prisma.referralReward.groupBy({
          by: ['referrerUserId'],
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: 'desc' } },
          take: 10,
        }),
      ]);
    return {
      totalInvites: invites,
      pendingRewards: rewardsPending,
      pendingPartnerApplications: partnersPending,
      topReferrers: topReferrers.map((r) => ({
        referrerUserId: r.referrerUserId,
        rewardCount: r._count,
        totalAmount: r._sum.amount?.toString() ?? '0',
      })),
    };
  }

  @Get('rewards')
  @Roles(...VIEW)
  async listRewards(@Query('status') status?: string) {
    const rows = await this.prisma.referralReward.findMany({
      where: status ? { status: status.toUpperCase() as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { items: rows };
  }

  @Post('rewards/:id/approve')
  @Roles(...FINANCE)
  approveReward(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.rewards.approveReward(id, user.id, user.roles ?? []);
  }

  @Post('rewards/:id/reject')
  @Roles(...COMPLIANCE, ...FINANCE)
  rejectReward(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.rewards.rejectReward(
      id,
      body.reason,
      user.id,
      user.roles ?? [],
    );
  }

  @Get('partners')
  @Roles(...VIEW)
  listPartners(@Query('status') status?: string) {
    return this.partners.adminList(
      status ? (status.toUpperCase() as PartnerStatus) : undefined,
    );
  }

  @Post('partners/:id/approve')
  @Roles(...FINANCE)
  approvePartner(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { tier?: PartnerTier; commissionPercent?: string },
  ) {
    return this.partners.adminReview(id, 'approve', user.id, user.roles ?? [], body);
  }

  @Post('partners/:id/reject')
  @Roles(...FINANCE)
  rejectPartner(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.partners.adminReview(id, 'reject', user.id, user.roles ?? [], body);
  }

  @Post('partners/:id/suspend')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.COMPLIANCE)
  suspendPartner(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.partners.adminReview(id, 'suspend', user.id, user.roles ?? [], body);
  }
}
