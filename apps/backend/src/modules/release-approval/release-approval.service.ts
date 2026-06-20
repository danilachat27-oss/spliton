import { HttpStatus, Injectable } from '@nestjs/common';
import { ReleaseApprovalDecision, ReleaseApprovalStage, ReleaseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { assertMatrixSection } from '../admin/common/admin-role-matrix';

const REQUIRED_STAGES: ReleaseApprovalStage[] = [
  ReleaseApprovalStage.CONTENT_REVIEW,
  ReleaseApprovalStage.LEGAL_REVIEW,
  ReleaseApprovalStage.FINANCE_REVIEW,
  ReleaseApprovalStage.COMPLIANCE_REVIEW,
];

@Injectable()
export class ReleaseApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async readiness(releaseId: string, roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'view');
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        releaseDocuments: true,
        primaryRaiseRounds: true,
        releaseArtists: { take: 1 },
      },
    });
    if (!release) {
      throwAdminError('NOT_FOUND', 'Release not found', HttpStatus.NOT_FOUND);
    }

    const checks = [
      { code: 'title', label: 'Название', passed: Boolean(release!.title?.trim()) },
      { code: 'artist', label: 'Артист', passed: release!.releaseArtists?.length > 0 },
      { code: 'cover', label: 'Обложка', passed: Boolean(release!.coverUrl) },
      { code: 'genre', label: 'Жанр', passed: Boolean(release!.genre?.trim()) },
      { code: 'description', label: 'Описание', passed: Boolean(release!.description?.trim()) },
      { code: 'deal_terms', label: 'Deal terms', passed: Boolean(release!.holderSharePct && release!.artistSharePct) },
      { code: 'risk_disclosure', label: 'Risk disclosure', passed: Boolean(release!.riskDisclosureText?.trim()) },
      { code: 'primary_price', label: 'Цена юнита', passed: release!.primaryUnitPrice.gt(0) },
      { code: 'total_units', label: 'Объём юнитов', passed: release!.totalUnits.gt(0) },
      { code: 'round', label: 'Primary round', passed: release!.primaryRaiseRounds.length > 0 },
      {
        code: 'faq',
        label: 'FAQ',
        passed: await this.prisma.releaseFaqItem.count({
          where: { releaseId, isPublished: true },
        }) > 0,
      },
      {
        code: 'data_room',
        label: 'Data room docs',
        passed: release!.releaseDocuments.some((d) => d.status === 'PUBLISHED'),
      },
    ];

    const steps = await this.prisma.releaseApprovalStep.findMany({
      where: { releaseId },
    });
    const approvalsPending = REQUIRED_STAGES.filter(
      (stage) =>
        !steps.some((s) => s.stage === stage && s.decision === ReleaseApprovalDecision.APPROVED),
    );

    const score = Math.round(
      (checks.filter((c) => c.passed).length / checks.length) * 100,
    );

    return {
      releaseId,
      readinessScore: score,
      checks,
      approvalsPending: approvalsPending.map((s) => s.toLowerCase()),
      canPublish: score >= 80 && approvalsPending.length === 0,
    };
  }

  async decide(params: {
    actorId: string;
    roles: string[];
    releaseId: string;
    stage: ReleaseApprovalStage;
    decision: ReleaseApprovalDecision;
    note?: string;
    blockerFields?: string[];
  }) {
    assertMatrixSection(params.roles, 'tracks', 'mutate');
    const row = await this.prisma.releaseApprovalStep.upsert({
      where: { releaseId_stage: { releaseId: params.releaseId, stage: params.stage } },
      create: {
        releaseId: params.releaseId,
        stage: params.stage,
        decision: params.decision,
        note: params.note,
        blockerFields: params.blockerFields ?? [],
        decidedByUserId: params.actorId,
        decidedAt: new Date(),
      },
      update: {
        decision: params.decision,
        note: params.note,
        blockerFields: params.blockerFields ?? [],
        decidedByUserId: params.actorId,
        decidedAt: new Date(),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: params.actorId,
      actorRoles: params.roles,
      entityType: 'release_approval',
      entityId: row.id,
      action: 'release.approval_decision',
      after: { stage: params.stage, decision: params.decision },
    });
    return row;
  }

  async assertCanPublish(releaseId: string) {
    const readiness = await this.readiness(releaseId, ['SUPER_ADMIN']);
    if (!readiness.canPublish) {
      throwAdminError(
        'RELEASE_NOT_READY',
        'Release publish blocked by readiness/approvals',
        HttpStatus.BAD_REQUEST,
        readiness,
      );
    }
  }

  async publish(releaseId: string, actorId: string, roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'mutate');
    await this.assertCanPublish(releaseId);
    const row = await this.prisma.release.update({
      where: { id: releaseId },
      data: { status: ReleaseStatus.ACTIVE },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release',
      entityId: releaseId,
      action: 'release.published',
    });
    return { id: row.id, status: 'active' };
  }
}
