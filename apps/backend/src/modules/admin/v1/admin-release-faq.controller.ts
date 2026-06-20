import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppLocale } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminReleaseFaqService } from './admin-release-faq.service';

@Controller('api/admin/v1/releases/:releaseId/faq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminReleaseFaqController {
  constructor(private readonly faq: AdminReleaseFaqService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('releaseId') releaseId: string) {
    return this.faq.list(releaseId, user.roles);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('releaseId') releaseId: string,
    @Body()
    body: {
      question: string;
      answer: string;
      locale?: AppLocale;
      category?: string;
      sortOrder?: number;
      isPublished?: boolean;
    },
  ) {
    return this.faq.create(user.id, user.roles, releaseId, body);
  }

  @Patch(':faqId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('releaseId') releaseId: string,
    @Param('faqId') faqId: string,
    @Body()
    body: Partial<{
      question: string;
      answer: string;
      locale: AppLocale;
      category: string;
      sortOrder: number;
      isPublished: boolean;
    }>,
  ) {
    return this.faq.update(user.id, user.roles, releaseId, faqId, body);
  }

  @Delete(':faqId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('releaseId') releaseId: string,
    @Param('faqId') faqId: string,
  ) {
    return this.faq.remove(user.id, user.roles, releaseId, faqId);
  }
}
