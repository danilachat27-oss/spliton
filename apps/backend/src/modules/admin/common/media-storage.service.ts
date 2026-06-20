import { HttpStatus, Injectable } from '@nestjs/common';
import {
  isAudioStorageKey,
  newsCoverPath,
  releaseAudioPath,
  releaseCoverPath,
  NEWS_IMAGE_LIMITS,
  RELEASE_AUDIO_LIMITS,
  RELEASE_COVER_LIMITS,
} from './media-storage.constants';
import { SupabaseStorageService } from './supabase-storage.service';
import { throwAdminError } from './admin-http.util';

export type UploadedFilePayload = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

export type UploadedReleaseCover = {
  coverUrl: string;
  storagePath: string;
};

export type UploadedReleaseAudio = {
  /** Private storage key persisted in DB (not a public URL). */
  audioPreviewStorageKey: string;
  /** Short-lived signed URL for admin preview. */
  audioPreviewSignedUrl: string;
};

function extFromMime(mime: string, allowed: Set<string>): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
  };
  const ext = map[mime.toLowerCase()];
  if (!ext || !allowed.has(ext)) {
    throwAdminError(
      'INVALID_MEDIA_TYPE',
      `Unsupported file type: ${mime}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return ext;
}

export type UploadedNewsCover = {
  coverUrl: string;
  storagePath: string;
};

@Injectable()
export class MediaStorageService {
  constructor(private readonly supabase: SupabaseStorageService) {}

  isConfigured(): boolean {
    return this.supabase.isReady();
  }

  async uploadReleaseCover(
    releaseId: string,
    file: UploadedFilePayload,
  ): Promise<UploadedReleaseCover> {
    this.assertFile(
      file,
      RELEASE_COVER_LIMITS.maxBytes,
      RELEASE_COVER_LIMITS.mimeTypes,
    );
    const ext = extFromMime(file.mimetype, RELEASE_COVER_LIMITS.extensions);
    const path = releaseCoverPath(releaseId, ext);

    const uploaded = await this.supabase.upload({
      bucket: this.supabase.buckets.releaseCovers,
      path,
      body: file.buffer,
      contentType: file.mimetype,
      upsert: true,
    });

    const coverUrl = uploaded.publicUrl;
    if (!coverUrl) {
      throwAdminError(
        'COVER_UPLOAD_FAILED',
        'Cover uploaded but public URL is unavailable — check release-covers bucket is public',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { coverUrl, storagePath: path };
  }

  async uploadReleaseAudioPreview(
    releaseId: string,
    file: UploadedFilePayload,
  ): Promise<UploadedReleaseAudio> {
    this.assertFile(
      file,
      RELEASE_AUDIO_LIMITS.maxBytes,
      RELEASE_AUDIO_LIMITS.mimeTypes,
    );
    const ext = extFromMime(file.mimetype, RELEASE_AUDIO_LIMITS.extensions);
    const path = releaseAudioPath(releaseId, ext);

    await this.supabase.upload({
      bucket: this.supabase.buckets.releaseAudio,
      path,
      body: file.buffer,
      contentType: file.mimetype,
      upsert: true,
    });

    const audioPreviewSignedUrl = await this.supabase.createSignedUrl(
      this.supabase.buckets.releaseAudio,
      path,
      3600,
    );

    return { audioPreviewStorageKey: path, audioPreviewSignedUrl };
  }

  async uploadNewsCover(
    newsId: string,
    file: UploadedFilePayload,
  ): Promise<UploadedNewsCover> {
    this.assertFile(
      file,
      NEWS_IMAGE_LIMITS.maxBytes,
      NEWS_IMAGE_LIMITS.mimeTypes,
    );
    const ext = extFromMime(file.mimetype, NEWS_IMAGE_LIMITS.extensions);
    const path = newsCoverPath(newsId, ext);

    const uploaded = await this.supabase.upload({
      bucket: this.supabase.buckets.newsImages,
      path,
      body: file.buffer,
      contentType: file.mimetype,
      upsert: true,
    });

    const coverUrl = uploaded.publicUrl;
    if (!coverUrl) {
      throwAdminError(
        'COVER_UPLOAD_FAILED',
        'News cover uploaded but public URL is unavailable — check news-images bucket is public',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { coverUrl, storagePath: path };
  }

  getReleaseCoverPublicUrl(path: string): string | null {
    return this.supabase.getPublicUrl(
      this.supabase.buckets.releaseCovers,
      path,
    );
  }

  async createReleaseAudioSignedUrl(
    storageKey: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (!isAudioStorageKey(storageKey)) {
      throwAdminError(
        'INVALID_AUDIO_KEY',
        'Invalid audio storage key',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.supabase.createSignedUrl(
      this.supabase.buckets.releaseAudio,
      storageKey,
      expiresInSeconds,
    );
  }

  async deleteReleaseMedia(params: {
    coverPath?: string;
    audioPath?: string;
  }): Promise<void> {
    if (params.coverPath) {
      await this.supabase.remove(
        this.supabase.buckets.releaseCovers,
        params.coverPath,
      );
    }
    if (params.audioPath && isAudioStorageKey(params.audioPath)) {
      await this.supabase.remove(
        this.supabase.buckets.releaseAudio,
        params.audioPath,
      );
    }
  }

  private assertFile(
    file: UploadedFilePayload | undefined,
    maxBytes: number,
    mimeTypes: Set<string>,
  ) {
    if (!this.supabase.isReady()) {
      throwAdminError(
        'STORAGE_NOT_CONFIGURED',
        'Supabase Storage is not configured on the server',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!file?.buffer?.length) {
      throwAdminError(
        'FILE_REQUIRED',
        'File is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (file.size > maxBytes) {
      throwAdminError(
        'FILE_TOO_LARGE',
        `File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!mimeTypes.has(mime)) {
      throwAdminError(
        'INVALID_MEDIA_TYPE',
        `Unsupported file type: ${mime || 'unknown'}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
