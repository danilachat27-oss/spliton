import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReleaseApprovalDecision, ReleaseApprovalStage } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin/admin-panel-roles';
import { requestMeta } from '../admin/common/admin-http.util';
import { ReleaseApprovalService } from './release-approval.service';

@Controller('api/admin/v1/releases/:releaseId/approval')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminReleaseApprovalController {
  constructor(private readonly approval: ReleaseApprovalService) {}

  @Get('readiness')
  readiness(@CurrentUser() user: AuthUser, @Param('releaseId') releaseId: string) {
    return this.approval.readiness(releaseId, user.roles);
  }

  @Post('decide')
  decide(
    @CurrentUser() user: AuthUser,
    @Param('releaseId') releaseId: string,
    @Body()
    body: { stage: string; decision: string; note?: string; blockerFields?: string[] },
    @Req() req: Request,
  ) {
    const stage = body.stage.toUpperCase() as ReleaseApprovalStage;
    const decision = body.decision.toUpperCase() as ReleaseApprovalDecision;
    return this.approval.decide({
      actorId: user.id,
      roles: user.roles,
      releaseId,
      stage,
      decision,
      note: body.note,
      blockerFields: body.blockerFields,
    });
  }

  @Post('publish')
  publish(@CurrentUser() user: AuthUser, @Param('releaseId') releaseId: string, @Req() req: Request) {
    void requestMeta(req);
    return this.approval.publish(releaseId, user.id, user.roles);
  }
}
