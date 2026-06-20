import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_BUCKETS } from './media-storage.constants';

export type SupabaseUploadResult = {
  bucket: string;
  path: string;
  publicUrl: string | null;
};

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient | null;
  readonly configured: boolean;

  readonly buckets = {
    releaseCovers:
      process.env.SUPABASE_STORAGE_RELEASE_COVERS_BUCKET?.trim() ||
      SUPABASE_BUCKETS.releaseCovers,
    releaseAudio:
      process.env.SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET?.trim() ||
      SUPABASE_BUCKETS.releaseAudio,
    reports:
      process.env.SUPABASE_STORAGE_REPORTS_BUCKET?.trim() ||
      SUPABASE_BUCKETS.reports,
    userDocuments:
      process.env.SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET?.trim() ||
      SUPABASE_BUCKETS.userDocuments,
    newsImages:
      process.env.SUPABASE_STORAGE_NEWS_IMAGES_BUCKET?.trim() ||
      SUPABASE_BUCKETS.newsImages,
  };

  constructor() {
    const url = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    this.configured = Boolean(url && serviceKey);
    this.client =
      url && serviceKey
        ? createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;

    if (!this.configured) {
      this.logger.warn(
        'Supabase Storage not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)',
      );
    }
  }

  isReady(): boolean {
    return this.configured && this.client !== null;
  }

  assertReady(): void {
    if (!this.isReady()) {
      throw new Error('Supabase Storage is not configured');
    }
  }

  getPublicUrl(bucket: string, path: string): string | null {
    if (!this.client) return null;
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl || null;
  }

  async upload(params: {
    bucket: string;
    path: string;
    body: Buffer;
    contentType: string;
    upsert?: boolean;
  }): Promise<SupabaseUploadResult> {
    this.assertReady();
    const { error } = await this.client!.storage.from(params.bucket).upload(
      params.path,
      params.body,
      {
        contentType: params.contentType,
        upsert: params.upsert ?? true,
      },
    );
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    return {
      bucket: params.bucket,
      path: params.path,
      publicUrl: this.getPublicUrl(params.bucket, params.path),
    };
  }

  async download(bucket: string, path: string): Promise<Buffer> {
    this.assertReady();
    const { data, error } =
      await this.client!.storage.from(bucket).download(path);
    if (error || !data) {
      throw new Error(
        `Supabase download failed: ${error?.message ?? 'empty response'}`,
      );
    }
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    this.assertReady();
    const { data, error } = await this.client!.storage.from(
      bucket,
    ).createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(
        `Supabase signed URL failed: ${error?.message ?? 'no url'}`,
      );
    }
    return data.signedUrl;
  }

  async remove(bucket: string, path: string): Promise<void> {
    this.assertReady();
    const { error } = await this.client!.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }
}
