import { Injectable, Logger } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { reportStoragePath } from './media-storage.constants';
import { SupabaseStorageService } from './supabase-storage.service';
import { formatUnknownError } from './admin-http.util';
import type { RenderedReportFile } from '../../../common/export/report-data.types';
import { sha256Hex } from '../../../common/export/csv.util';

export type ReportStorageMode = 'db' | 'local' | 'object' | 'supabase';

export type PersistedReportFile = {
  storageKey: string | null;
  fileUrl: string | null;
  fileSizeBytes: number;
  mimeType: string;
  fileChecksum: string;
  /** Text CSV or base64 payload for db mode */
  fileContent: string | null;
};

@Injectable()
export class ReportStorageService {
  private readonly logger = new Logger(ReportStorageService.name);
  private readonly mode: ReportStorageMode;
  private s3: S3Client | null = null;

  constructor(private readonly supabase: SupabaseStorageService) {
    const raw = (process.env.REPORT_STORAGE_MODE ?? 'db').toLowerCase();
    this.mode =
      raw === 'local' || raw === 'object' || raw === 'supabase' ? raw : 'db';

    if (this.mode === 'object' && process.env.REPORT_STORAGE_BUCKET?.trim()) {
      this.s3 = new S3Client({
        region: process.env.REPORT_STORAGE_REGION?.trim() || 'auto',
        endpoint: process.env.REPORT_STORAGE_ENDPOINT?.trim() || undefined,
        credentials:
          process.env.REPORT_STORAGE_ACCESS_KEY?.trim() &&
          process.env.REPORT_STORAGE_SECRET_KEY?.trim()
            ? {
                accessKeyId: process.env.REPORT_STORAGE_ACCESS_KEY.trim(),
                secretAccessKey: process.env.REPORT_STORAGE_SECRET_KEY.trim(),
              }
            : undefined,
        forcePathStyle: process.env.REPORT_STORAGE_FORCE_PATH_STYLE === 'true',
      });
    }
  }

  getMode(): ReportStorageMode {
    return this.mode;
  }

  async persistReport(
    jobId: string,
    type: string,
    csv: string,
  ): Promise<PersistedReportFile> {
    return this.persistReportFile(jobId, type, {
      buffer: Buffer.from(csv, 'utf8'),
      mimeType: 'text/csv; charset=utf-8',
      ext: 'csv',
      rowCount: csv.split('\n').length - 1,
      checksum: sha256Hex(Buffer.from(csv, 'utf8')),
    });
  }

  async persistReportFile(
    jobId: string,
    type: string,
    rendered: RenderedReportFile,
  ): Promise<PersistedReportFile> {
    const fileSizeBytes = rendered.buffer.length;
    const storageKey = reportStoragePath(type, jobId, rendered.ext);
    const fileChecksum = rendered.checksum;
    const mimeType = rendered.mimeType;
    const isTextCsv = rendered.ext === 'csv';

    if (this.mode === 'local') {
      const absolute = join(process.cwd(), 'storage', storageKey);
      await mkdir(join(process.cwd(), 'storage', 'reports', type), {
        recursive: true,
      });
      await writeFile(absolute, rendered.buffer);
      return {
        storageKey,
        fileUrl: null,
        fileSizeBytes,
        mimeType,
        fileChecksum,
        fileContent: null,
      };
    }

    if (this.mode === 'supabase') {
      if (!this.supabase.isReady()) {
        this.logger.warn(
          'Supabase Storage not configured — storing report in DB',
        );
        return {
          storageKey: null,
          fileUrl: null,
          fileSizeBytes,
          mimeType,
          fileChecksum,
          fileContent: isTextCsv
            ? rendered.buffer.toString('utf8')
            : rendered.buffer.toString('base64'),
        };
      }
      try {
        await this.supabase.upload({
          bucket: this.supabase.buckets.reports,
          path: storageKey,
          body: rendered.buffer,
          contentType: mimeType,
          upsert: true,
        });
        return {
          storageKey,
          fileUrl: null,
          fileSizeBytes,
          mimeType,
          fileChecksum,
          fileContent: null,
        };
      } catch (err) {
        this.logger.warn(
          `Supabase report upload failed — DB fallback: ${formatUnknownError(err)}`,
        );
        return {
          storageKey: null,
          fileUrl: null,
          fileSizeBytes,
          mimeType,
          fileChecksum,
          fileContent: isTextCsv
            ? rendered.buffer.toString('utf8')
            : rendered.buffer.toString('base64'),
        };
      }
    }

    if (this.mode === 'object') {
      const bucket = process.env.REPORT_STORAGE_BUCKET?.trim();
      if (!bucket || !this.s3) {
        this.logger.warn(
          'Object storage not configured — storing in DB for this job',
        );
        return {
          storageKey: null,
          fileUrl: null,
          fileSizeBytes,
          mimeType,
          fileChecksum,
          fileContent: isTextCsv
            ? rendered.buffer.toString('utf8')
            : rendered.buffer.toString('base64'),
        };
      }

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: rendered.buffer,
          ContentType: mimeType,
        }),
      );

      const publicBase = process.env.REPORT_STORAGE_PUBLIC_URL?.trim();
      const fileUrl = publicBase
        ? `${publicBase.replace(/\/$/, '')}/${storageKey}`
        : null;

      return {
        storageKey,
        fileUrl,
        fileSizeBytes,
        mimeType,
        fileChecksum,
        fileContent: null,
      };
    }

    return {
      storageKey: null,
      fileUrl: null,
      fileSizeBytes,
      mimeType,
      fileChecksum,
      fileContent: isTextCsv
        ? rendered.buffer.toString('utf8')
        : rendered.buffer.toString('base64'),
    };
  }

  /** @deprecated use readReportFile */
  async readReportContent(params: {
    fileContent: string | null;
    storageKey: string | null;
  }): Promise<string> {
    const data = await this.readReportFile({
      ...params,
      mimeType: 'text/csv; charset=utf-8',
    });
    return Buffer.isBuffer(data) ? data.toString('utf8') : data;
  }

  async readReportFile(params: {
    fileContent: string | null;
    storageKey: string | null;
    mimeType?: string | null;
  }): Promise<Buffer | string> {
    const isText =
      params.mimeType?.includes('csv') || params.mimeType?.startsWith('text/');

    if (params.fileContent) {
      if (isText) return params.fileContent;
      return Buffer.from(params.fileContent, 'base64');
    }

    if (params.storageKey?.startsWith('reports/')) {
      let buffer: Buffer | null = null;
      if (this.mode === 'supabase' && this.supabase.isReady()) {
        buffer = await this.supabase.download(
          this.supabase.buckets.reports,
          params.storageKey,
        );
      } else if (
        this.mode === 'object' &&
        this.s3 &&
        process.env.REPORT_STORAGE_BUCKET
      ) {
        const res = await this.s3.send(
          new GetObjectCommand({
            Bucket: process.env.REPORT_STORAGE_BUCKET,
            Key: params.storageKey,
          }),
        );
        const body = await res.Body?.transformToByteArray();
        if (body) buffer = Buffer.from(body);
      } else {
        const absolute = join(process.cwd(), 'storage', params.storageKey);
        buffer = await readFile(absolute);
      }
      if (buffer) {
        return isText ? buffer.toString('utf8') : buffer;
      }
    }

    throw new Error('Report file not available');
  }

  async getSignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = 900,
  ): Promise<string | null> {
    if (this.mode === 'supabase' && this.supabase.isReady() && storageKey) {
      try {
        return await this.supabase.createSignedUrl(
          this.supabase.buckets.reports,
          storageKey,
          expiresInSeconds,
        );
      } catch (err) {
        this.logger.warn(
          `Signed report URL failed: ${formatUnknownError(err)}`,
        );
        return null;
      }
    }

    const publicBase = process.env.REPORT_STORAGE_PUBLIC_URL?.trim();
    if (publicBase && storageKey) {
      return `${publicBase.replace(/\/$/, '')}/${storageKey}`;
    }
    return null;
  }

  async deleteExpiredReport(storageKey: string): Promise<void> {
    if (!storageKey?.startsWith('reports/')) return;

    if (this.mode === 'supabase' && this.supabase.isReady()) {
      try {
        await this.supabase.remove(this.supabase.buckets.reports, storageKey);
      } catch (err) {
        this.logger.warn(
          `Supabase report delete failed: ${formatUnknownError(err)}`,
        );
      }
      return;
    }

    if (this.mode === 'local') {
      try {
        const { unlink } = await import('fs/promises');
        const absolute = join(process.cwd(), 'storage', storageKey);
        await unlink(absolute);
      } catch {
        // file may already be gone
      }
    }
  }
}
