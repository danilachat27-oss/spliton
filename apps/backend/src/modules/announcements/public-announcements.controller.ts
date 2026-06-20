import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PublicAnnouncementsService } from './public-announcements.service';
import type { AnnouncementSurface } from './system-announcements.util';

@Controller('api/v1/system-announcements')
export class PublicAnnouncementsController {
  constructor(private readonly announcements: PublicAnnouncementsService) {}

  @Get('active')
  @UseGuards(OptionalJwtAuthGuard)
  listActive(
    @Query('locale') locale?: string,
    @Query('surface') surface?: AnnouncementSurface,
    @CurrentUser() user?: AuthUser | null,
  ) {
    return this.announcements.listActive({
      locale,
      surface,
      userId: user?.id ?? null,
      userRoles: user?.roles ?? [],
    });
  }

  @Post(':id/dismiss')
  @UseGuards(JwtAuthGuard)
  dismiss(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.announcements.dismiss(user.id, id);
  }
}
