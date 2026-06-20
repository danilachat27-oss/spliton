import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import { AdminSystemStatusService } from './admin-system-status.service';

class PatchComponentDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  message?: string;
}

class CreateIncidentDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  severity!: string;

  @IsArray()
  @IsString({ each: true })
  affectedComponentCodes!: string[];

  @IsOptional()
  @IsBoolean()
  visiblePublic?: boolean;
}

class IncidentUpdateDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

@Controller('api/admin/v1/system-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminSystemStatusController {
  constructor(private readonly status: AdminSystemStatusService) {}

  @Get('components')
  components(@CurrentUser() user: AuthUser) {
    return this.status.listComponents(user.roles);
  }

  @Patch('components/:code')
  patchComponent(
    @CurrentUser() user: AuthUser,
    @Param('code') code: string,
    @Body() body: PatchComponentDto,
    @Req() req: Request,
  ) {
    return this.status.patchComponent(
      user.id,
      user.roles,
      code,
      body.status,
      body.message,
      requestMeta(req),
    );
  }

  @Get('incidents')
  incidents(@CurrentUser() user: AuthUser) {
    return this.status.listIncidents(user.roles);
  }

  @Post('incidents')
  createIncident(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateIncidentDto,
    @Req() req: Request,
  ) {
    return this.status.createIncident(
      user.id,
      user.roles,
      body,
      requestMeta(req),
    );
  }

  @Post('incidents/:id/resolve')
  resolve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.status.resolveIncident(
      user.id,
      user.roles,
      id,
      requestMeta(req),
    );
  }

  @Post('incidents/:id/updates')
  addUpdate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: IncidentUpdateDto,
    @Req() req: Request,
  ) {
    return this.status.addIncidentUpdate(
      user.id,
      user.roles,
      id,
      body.body,
      body.status,
      requestMeta(req),
    );
  }
}
