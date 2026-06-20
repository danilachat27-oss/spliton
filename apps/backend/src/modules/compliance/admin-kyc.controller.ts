import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { KycLevel, KycStatus, UserRoleCode } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { UserKycService } from './user-kyc.service';
import { AmlProfileService } from './aml-profile.service';

const KYC_MUTATE = [UserRoleCode.SUPER_ADMIN, UserRoleCode.COMPLIANCE] as const;
const KYC_VIEW = [...KYC_MUTATE, UserRoleCode.ADMIN] as const;

@Controller('api/admin/v1/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminKycController {
  constructor(
    private readonly kyc: UserKycService,
    private readonly aml: AmlProfileService,
  ) {}

  @Get('reviews')
  @Roles(...KYC_VIEW)
  list(@Query('status') status?: KycStatus) {
    return this.kyc.listReviews(status);
  }

  @Get('reviews/:id')
  @Roles(...KYC_VIEW)
  getReview(@Param('id') id: string) {
    return this.kyc.getReviewById(id);
  }

  @Post('reviews/:id/approve')
  @Roles(...KYC_MUTATE)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { level?: KycLevel },
  ) {
    return this.kyc.approve(id, user.id, body.level ?? KycLevel.VERIFIED);
  }

  @Post('reviews/:id/reject')
  @Roles(...KYC_MUTATE)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.kyc.reject(id, user.id, body.reason);
  }

  @Get('users/:userId/aml-profile')
  @Roles(...KYC_VIEW)
  amlProfile(@Param('userId') userId: string) {
    return this.aml.getForAdmin(userId);
  }

  @Post('users/:userId/aml-profile')
  @Roles(...KYC_MUTATE)
  updateAml(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body()
    body: {
      riskLevel?: string;
      restrictions?: Record<string, boolean>;
      notes?: string;
    },
  ) {
    return this.aml.updateRisk(
      userId,
      {
        riskLevel: body.riskLevel as never,
        restrictions: body.restrictions,
        notes: body.notes,
      },
      user.id,
      user.roles ?? [],
    );
  }
}
