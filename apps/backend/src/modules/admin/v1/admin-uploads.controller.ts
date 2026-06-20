import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

type UploadFormBody = {
  releaseId?: string;
  trackId?: string;
};

function readUploadReleaseId(req: Request): string {
  const body = req.body as UploadFormBody;
  return (body.releaseId ?? body.trackId ?? '').trim();
}
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { ADMIN_PANEL_ROLE_CODES } from '../admin-panel-roles';
import { requestMeta } from '../common/admin-http.util';
import {
  RELEASE_AUDIO_LIMITS,
  RELEASE_COVER_LIMITS,
} from '../common/media-storage.constants';
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

@Controller('api/admin/v1/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_PANEL_ROLE_CODES)
export class AdminUploadsController {
  constructor(private readonly tracks: AdminTracksService) {}

  @Post('release-cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: RELEASE_COVER_LIMITS.maxBytes },
    }),
  )
  uploadReleaseCover(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const releaseId = readUploadReleaseId(req);
    return this.tracks.uploadCover(
      user.id,
      user.roles,
      releaseId,
      toUploadPayload(file)!,
      requestMeta(req),
    );
  }

  @Post('release-audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: RELEASE_AUDIO_LIMITS.maxBytes },
    }),
  )
  uploadReleaseAudio(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const releaseId = readUploadReleaseId(req);
    return this.tracks.uploadAudioPreview(
      user.id,
      user.roles,
      releaseId,
      toUploadPayload(file)!,
      requestMeta(req),
    );
  }
}
