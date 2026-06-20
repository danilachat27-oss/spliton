import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ArtistPortalService } from './artist-portal.service';

@Controller('api/v1/artist')
@UseGuards(JwtAuthGuard)
export class ArtistPortalController {
  constructor(private readonly artist: ArtistPortalService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.artist.dashboard(user.id, user.roles);
  }

  @Get('releases')
  releases(@CurrentUser() user: AuthUser) {
    return this.artist.listReleases(user.id, user.roles);
  }

  @Get('releases/:id')
  release(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.artist.getRelease(user.id, user.roles, id);
  }

  @Get('releases/:id/analytics')
  analytics(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.artist.releaseAnalytics(user.id, user.roles, id);
  }

  @Get('documents')
  documents(@CurrentUser() user: AuthUser) {
    return this.artist.listDocuments(user.id, user.roles);
  }

  @Post('release-submissions')
  submit(
    @CurrentUser() user: AuthUser,
    @Body() body: { title: string; description?: string; payload?: Record<string, unknown> },
  ) {
    return this.artist.createSubmission(user.id, user.roles, body);
  }
}
