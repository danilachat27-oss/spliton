import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import { requestMeta } from '../common/admin-http.util';
import {
  RELEASE_AUDIO_LIMITS,
  RELEASE_COVER_LIMITS,
} from '../common/media-storage.constants';
import { AdminTrackMutationDto } from './dto/admin-track.dto';
import { AdminTracksService } from './admin-tracks.service';

function toUploadPayload(file: Express.Multer.File | undefined) {
  if (!file?.buffer) return undefined;
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size,
    originalname: file.originalname,
  };
}

@Controller('api/admin/v1/tracks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminTracksController {
  constructor(private readonly tracks: AdminTracksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AdminListQueryDto) {
    return this.tracks.list(user.roles, query);
  }

  @Get(':id/audio-preview-url')
  getAudioPreviewUrl(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tracks.getAudioPreviewUrl(user.roles, id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tracks.getById(user.roles, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: AdminTrackMutationDto,
    @Req() req: Request,
  ) {
    return this.tracks.create(
      user.id,
      user.roles,
      body as Record<string, unknown>,
      requestMeta(req),
    );
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: RELEASE_COVER_LIMITS.maxBytes },
    }),
  )
  uploadCover(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.tracks.uploadCover(
      user.id,
      user.roles,
      id,
      toUploadPayload(file)!,
      requestMeta(req),
    );
  }

  @Post(':id/audio-preview')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: RELEASE_AUDIO_LIMITS.maxBytes },
    }),
  )
  uploadAudioPreview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.tracks.uploadAudioPreview(
      user.id,
      user.roles,
      id,
      toUploadPayload(file)!,
      requestMeta(req),
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: AdminTrackMutationDto,
    @Req() req: Request,
  ) {
    return this.tracks.update(
      user.id,
      user.roles,
      id,
      body as Record<string, unknown>,
      requestMeta(req),
    );
  }

  @Post(':id/submit-review')
  submitReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.tracks.transitionStatus(
      user.id,
      user.roles,
      id,
      'submit_review',
      requestMeta(req),
    );
  }

  @Post(':id/publish')
  publish(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.tracks.transitionStatus(
      user.id,
      user.roles,
      id,
      'publish',
      requestMeta(req),
    );
  }

  @Post(':id/pause')
  pause(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.tracks.transitionStatus(
      user.id,
      user.roles,
      id,
      'pause',
      requestMeta(req),
    );
  }

  @Post(':id/archive')
  archive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.tracks.transitionStatus(
      user.id,
      user.roles,
      id,
      'archive',
      requestMeta(req),
    );
  }
}
