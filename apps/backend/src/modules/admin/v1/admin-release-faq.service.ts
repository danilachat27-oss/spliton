import { HttpStatus, Injectable } from '@nestjs/common';
import { AppLocale } from '@prisma/client';
import { normalizeAppLocale } from '../../../common/i18n/app-locale';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';

@Injectable()
export class AdminReleaseFaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(releaseId: string, roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'view');
    const items = await this.prisma.releaseFaqItem.findMany({
      where: { releaseId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { items };
  }

  async create(
    actorId: string,
    roles: string[],
    releaseId: string,
    body: {
      question: string;
      answer: string;
      locale?: AppLocale;
      category?: string;
      sortOrder?: number;
      isPublished?: boolean;
    },
  ) {
    assertMatrixSection(roles, 'tracks', 'mutate');
    await this.assertRelease(releaseId);
    const row = await this.prisma.releaseFaqItem.create({
      data: {
        releaseId,
        question: body.question.trim(),
        answer: body.answer.trim(),
        locale: body.locale ? normalizeAppLocale(body.locale) : AppLocale.ru,
        category: body.category?.trim() || null,
        sortOrder: body.sortOrder ?? 0,
        isPublished: body.isPublished ?? false,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release_faq',
      entityId: row.id,
      action: 'release.faq_created',
    });
    return row;
  }

  async update(
    actorId: string,
    roles: string[],
    releaseId: string,
    faqId: string,
    body: Partial<{
      question: string;
      answer: string;
      locale: AppLocale;
      category: string;
      sortOrder: number;
      isPublished: boolean;
    }>,
  ) {
    assertMatrixSection(roles, 'tracks', 'mutate');
    const existing = await this.prisma.releaseFaqItem.findFirst({
      where: { id: faqId, releaseId },
    });
    if (!existing) {
      throwAdminError('NOT_FOUND', 'FAQ item not found', HttpStatus.NOT_FOUND);
    }
    const row = await this.prisma.releaseFaqItem.update({
      where: { id: faqId },
      data: {
        question: body.question?.trim(),
        answer: body.answer?.trim(),
        locale: body.locale ? normalizeAppLocale(body.locale) : undefined,
        category: body.category?.trim(),
        sortOrder: body.sortOrder,
        isPublished: body.isPublished,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release_faq',
      entityId: row.id,
      action: 'release.faq_updated',
    });
    return row;
  }

  async remove(actorId: string, roles: string[], releaseId: string, faqId: string) {
    assertMatrixSection(roles, 'tracks', 'mutate');
    const existing = await this.prisma.releaseFaqItem.findFirst({
      where: { id: faqId, releaseId },
    });
    if (!existing) {
      throwAdminError('NOT_FOUND', 'FAQ item not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.releaseFaqItem.delete({ where: { id: faqId } });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release_faq',
      entityId: faqId,
      action: 'release.faq_deleted',
    });
    return { ok: true };
  }

  private async assertRelease(releaseId: string) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      select: { id: true },
    });
    if (!release) {
      throwAdminError('NOT_FOUND', 'Release not found', HttpStatus.NOT_FOUND);
    }
  }
}
