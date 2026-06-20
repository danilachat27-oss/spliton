import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AdminFinancialRulesService } from './admin-financial-rules.service';

class PatchFinancialRuleDto {
  @IsString()
  value!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

@Controller('api/admin/v1/settings/financial-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminFinancialRulesController {
  constructor(private readonly rules: AdminFinancialRulesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('category') category?: string) {
    return this.rules.list(user.roles, category);
  }

  @Get(':id/history')
  history(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.rules.getHistory(user.roles, id);
  }

  @Patch(':id')
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchFinancialRuleDto,
    @Req() req: Request,
  ) {
    return this.rules.patch(user.id, user.roles, id, body, requestMeta(req));
  }
}
