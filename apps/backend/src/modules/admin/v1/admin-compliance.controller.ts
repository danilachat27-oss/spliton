import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { IsOptional, IsString } from 'class-validator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../../auth/guards/roles.guard';

import { Roles } from '../../auth/decorators/roles.decorator';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import type { AuthUser } from '../../auth/types/auth-user.type';

import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';

import { requestMeta } from '../common/admin-http.util';

import { AdminNoteDto } from './dto/admin-user.dto';

import { AdminComplianceQueryDto } from './dto/admin-compliance-query.dto';

import { AdminComplianceService } from './admin-compliance.service';

class PatchRiskFlagDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class CreateRiskFlagDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  flagCode?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  riskScore?: number;
}

class FreezeOperationDto extends AdminNoteDto {
  @IsString()
  operationType!: string;
}

class AssignFlagDto {
  @IsString()
  assigneeEmail!: string;
}

class EscalateFlagDto extends AdminNoteDto {
  @IsOptional()
  @IsString()
  target?: string;
}

@Controller('api/admin/v1/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminComplianceController {
  constructor(private readonly compliance: AdminComplianceService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.compliance.getSummary(user.roles);
  }

  @Get('risk-rules')
  riskRules(@CurrentUser() user: AuthUser) {
    return this.compliance.getRiskRules(user.roles);
  }

  @Get('history')
  history(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminComplianceQueryDto,
  ) {
    return this.compliance.getHistory(user.roles, query);
  }

  @Get('risk-flags')
  listRiskFlags(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminComplianceQueryDto,
  ) {
    return this.compliance.listRiskFlags(user.roles, query);
  }

  @Get('risk-flags/:id')
  getRiskFlag(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Query('include') include?: string,
  ) {
    return this.compliance.getRiskFlag(user.roles, id, include);
  }

  @Post('risk-flags')
  createRiskFlag(
    @CurrentUser() user: AuthUser,

    @Body() body: CreateRiskFlagDto,

    @Req() req: Request,
  ) {
    return this.compliance.createRiskFlag(
      user.id,

      user.roles,

      body as unknown as Record<string, unknown>,

      requestMeta(req),
    );
  }

  @Patch('risk-flags/:id/status')
  patchRiskFlagStatus(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: PatchRiskFlagDto,

    @Req() req: Request,
  ) {
    return this.compliance.patchRiskFlagStatus(
      user.id,

      user.roles,

      id,

      body.status,

      body.note,

      requestMeta(req),
    );
  }

  @Post('risk-flags/:id/notes')
  addNote(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AdminNoteDto,

    @Req() req: Request,
  ) {
    return this.compliance.addNote(
      user.id,
      user.roles,
      id,
      body.note ?? '',
      requestMeta(req),
    );
  }

  @Patch('risk-flags/:id/assign')
  assignFlag(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AssignFlagDto,

    @Req() req: Request,
  ) {
    return this.compliance.assignFlag(
      user.id,

      user.roles,

      id,

      body.assigneeEmail,

      requestMeta(req),
    );
  }

  @Post('risk-flags/:id/escalate')
  escalateFlag(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: EscalateFlagDto,

    @Req() req: Request,
  ) {
    return this.compliance.escalateFlag(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post('risk-flags/:id/resolve')
  resolveFlag(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AdminNoteDto,

    @Req() req: Request,
  ) {
    return this.compliance.resolveFlag(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post('risk-flags/:id/dismiss')
  dismissFlag(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AdminNoteDto,

    @Req() req: Request,
  ) {
    return this.compliance.dismissFlag(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post('users/:id/block')
  blockUser(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AdminNoteDto,

    @Req() req: Request,
  ) {
    return this.compliance.blockUser(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post('users/:id/unblock')
  unblockUser(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: AdminNoteDto,

    @Req() req: Request,
  ) {
    return this.compliance.unblockUser(
      user.id,
      user.roles,
      id,
      body.note,
      requestMeta(req),
    );
  }

  @Post('operations/:id/freeze')
  freezeOperation(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: FreezeOperationDto,

    @Req() req: Request,
  ) {
    return this.compliance.freezeOperation(
      user.id,

      user.roles,

      id,

      body.operationType,

      body.note,

      requestMeta(req),
    );
  }

  @Post('operations/:id/release')
  releaseOperation(
    @CurrentUser() user: AuthUser,

    @Param('id') id: string,

    @Body() body: FreezeOperationDto,

    @Req() req: Request,
  ) {
    return this.compliance.releaseOperation(
      user.id,

      user.roles,

      id,

      body.operationType,

      body.note,

      requestMeta(req),
    );
  }
}
