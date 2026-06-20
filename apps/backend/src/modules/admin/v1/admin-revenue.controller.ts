import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { UserRoleCode } from '@prisma/client';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import { AdminRevenueQueryDto } from './dto/admin-revenue-query.dto';
import { AdminRevenueService } from './admin-revenue.service';

class CreateRevenueEventDto {
  @IsUUID()
  trackId!: string;

  @IsNumberString()
  grossRevenue!: string;

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsString()
  periodFrom!: string;

  @IsString()
  periodTo!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class PreviewDistributionDto {
  @IsUUID()
  revenueEventId!: string;
}

class RunDistributionDto {
  @IsUUID()
  revenueEventId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

@Controller('api/admin/v1/revenue-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminRevenueEventsController {
  constructor(private readonly revenue: AdminRevenueService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: AdminRevenueQueryDto) {
    return this.revenue.summary(user.roles, query);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminRevenueQueryDto) {
    return this.revenue.listEvents(user.roles, query);
  }

  @Post()
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateRevenueEventDto,
    @Req() req: Request,
  ) {
    return this.revenue.createEvent(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    return this.revenue.getEventById(user.roles, id, include);
  }

  @Post(':id/submit-review')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  submitReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.revenue.submitForReview(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Post(':id/approve')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.revenue.approveDistribution(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Post(':id/cancel')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Req() req: Request,
  ) {
    return this.revenue.cancelEvent(
      user.id,
      user.roles,
      id,
      requestMeta(req),
      body.note,
    );
  }

  @Post(':id/retry')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  retry(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.revenue.retryFailed(user.id, user.roles, id, requestMeta(req));
  }
}

@Controller('api/admin/v1/distributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminDistributionsController {
  constructor(private readonly revenue: AdminRevenueService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminRevenueQueryDto) {
    return this.revenue.listEvents(user.roles, query);
  }

  @Post('preview')
  preview(@CurrentUser() user: AuthUser, @Body() body: PreviewDistributionDto) {
    return this.revenue.previewDistribution(user.roles, body);
  }

  @Post('preview/save')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  savePreview(
    @CurrentUser() user: AuthUser,
    @Body() body: PreviewDistributionDto,
    @Req() req: Request,
  ) {
    return this.revenue.savePreview(
      user.roles,
      body,
      requestMeta(req),
      user.id,
      user.roles,
    );
  }

  @Post('run')
  @Roles(UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.ACCOUNTANT)
  run(
    @CurrentUser() user: AuthUser,
    @Body() body: RunDistributionDto,
    @Headers('idempotency-key') idempotencyHeader: string | undefined,
    @Req() req: Request,
  ) {
    return this.revenue.runDistribution(
      user.id,
      user.roles,
      {
        ...body,
        idempotencyKey: body.idempotencyKey ?? idempotencyHeader,
      },
      requestMeta(req),
    );
  }
}
