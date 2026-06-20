import { HttpStatus, Injectable } from '@nestjs/common';
import { KycLevel, KycStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { AdminAuditService } from '../admin/common/admin-audit.service';

@Injectable()
export class UserKycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async getStatus(userId: string) {
    const row = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      status: row?.status ?? KycStatus.NOT_STARTED,
      level: row?.level ?? KycLevel.NONE,
      countryCode: row?.countryCode ?? null,
      submittedAt: row?.submittedAt?.toISOString() ?? null,
      reviewedAt: row?.reviewedAt?.toISOString() ?? null,
      expiresAt: row?.expiresAt?.toISOString() ?? null,
      rejectionReasonSafe: row?.rejectReason ?? null,
      provider: row?.provider ?? 'manual',
    };
  }

  async start(userId: string, countryCode?: string) {
    const existing = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing?.status === KycStatus.APPROVED) {
      return this.getStatus(userId);
    }
    const cc = countryCode?.toUpperCase();
    const row = existing
      ? await this.prisma.kycVerification.update({
          where: { id: existing.id },
          data: {
            status: KycStatus.PENDING,
            countryCode: cc ?? existing.countryCode,
            submittedAt: new Date(),
          },
        })
      : await this.prisma.kycVerification.create({
          data: {
            userId,
            status: KycStatus.PENDING,
            level: KycLevel.BASIC,
            countryCode: cc,
            provider: 'manual',
            submittedAt: new Date(),
          },
        });

    if (countryCode) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId, countryCode: countryCode.toUpperCase() },
        update: { countryCode: countryCode.toUpperCase() },
      });
    }

    return this.mapReview(row);
  }

  async submitManual(
    userId: string,
    body: { countryCode: string; documentType: string; documentReference: string },
  ) {
    let row = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!row) {
      row = await this.prisma.kycVerification.create({
        data: {
          userId,
          status: KycStatus.MANUAL_REVIEW_REQUIRED,
          level: KycLevel.BASIC,
          provider: 'manual',
        },
      });
    }
    row = await this.prisma.kycVerification.update({
      where: { id: row.id },
      data: {
        status: KycStatus.MANUAL_REVIEW_REQUIRED,
        countryCode: body.countryCode.toUpperCase(),
        documentType: body.documentType,
        documentReference: body.documentReference.slice(0, 32),
        submittedAt: new Date(),
      },
    });
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, countryCode: body.countryCode.toUpperCase() },
      update: { countryCode: body.countryCode.toUpperCase() },
    });
    return this.mapReview(row);
  }

  async getReviewById(id: string) {
    const row = await this.prisma.kycVerification.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, profile: true } },
      },
    });
    if (!row) {
      throwAdminError('KYC_NOT_FOUND', 'KYC review not found', HttpStatus.NOT_FOUND);
    }
    return {
      ...this.mapReview(row!),
      user: row!.user,
    };
  }

  async listReviews(status?: KycStatus) {
    const rows = await this.prisma.kycVerification.findMany({
      where: status
        ? { status }
        : {
            status: {
              in: [
                KycStatus.PENDING,
                KycStatus.IN_REVIEW,
                KycStatus.MANUAL_REVIEW_REQUIRED,
              ],
            },
          },
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, profile: true } },
      },
      take: 100,
    });
    return rows.map((row) => ({
      ...this.mapReview(row),
      user: row.user,
    }));
  }

  async approve(
    id: string,
    actorUserId: string,
    level: KycLevel = KycLevel.VERIFIED,
  ) {
    const row = await this.requireReviewRow(id);
    const updated = await this.prisma.kycVerification.update({
      where: { id },
      data: {
        status: KycStatus.APPROVED,
        level,
        reviewedAt: new Date(),
        reviewedBy: actorUserId,
        rejectReason: null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles: [],
      entityType: 'kyc_verification',
      entityId: id,
      action: 'kyc.approve',
      after: { status: updated.status, level: updated.level },
      ip: null,
      userAgent: null,
    });
    return this.mapReview(updated);
  }

  async reject(id: string, actorUserId: string, reason: string) {
    await this.requireReviewRow(id);
    const updated = await this.prisma.kycVerification.update({
      where: { id },
      data: {
        status: KycStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: actorUserId,
        rejectReason: reason.slice(0, 500),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles: [],
      entityType: 'kyc_verification',
      entityId: id,
      action: 'kyc.reject',
      after: { status: updated.status },
      ip: null,
      userAgent: null,
    });
    return this.mapReview(updated);
  }

  private async requireReviewRow(id: string) {
    const row = await this.prisma.kycVerification.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('KYC_NOT_FOUND', 'KYC review not found', HttpStatus.NOT_FOUND);
    }
    return row!;
  }

  private mapReview(row: {
    id: string;
    userId: string;
    status: KycStatus;
    level: KycLevel;
    countryCode: string | null;
    documentType?: string | null;
    documentReference?: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewedBy?: string | null;
    rejectReason: string | null;
    provider?: string | null;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      level: row.level,
      countryCode: row.countryCode,
      documentType: row.documentType ?? null,
      documentReference: row.documentReference ?? null,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedByUserId: row.reviewedBy ?? null,
      rejectionReasonSafe: row.rejectReason,
      provider: row.provider ?? 'manual',
      documentViewerAvailable: false,
    };
  }
}
