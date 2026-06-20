import { HttpStatus, Injectable } from '@nestjs/common';
import { GeneratedDocumentKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { StatementDocumentProcessorService } from './statement-document-processor.service';
import { statementKindLabel } from './statement-kind-labels';

const USER_STATEMENT_KINDS: GeneratedDocumentKind[] = [
  GeneratedDocumentKind.ANNUAL_INCOME_STATEMENT,
  GeneratedDocumentKind.MONTHLY_WALLET_STATEMENT,
  GeneratedDocumentKind.TRADING_SUMMARY,
  GeneratedDocumentKind.PAYOUTS_SUMMARY,
  GeneratedDocumentKind.FEES_PAID_SUMMARY,
  GeneratedDocumentKind.REALIZED_PNL_SUMMARY,
  GeneratedDocumentKind.DEPOSITS_WITHDRAWALS_SUMMARY,
];

@Injectable()
export class UserAccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statementProcessor: StatementDocumentProcessorService,
  ) {}

  listAvailableStatements() {
    return {
      items: USER_STATEMENT_KINDS.map((kind) => ({
        kind: kind.toLowerCase(),
        label: this.labelFor(kind),
        disclaimer:
          'Справки носят информационный характер и не являются налоговой или юридической консультацией.',
      })),
    };
  }

  async requestStatement(params: {
    userId: string;
    kind: string;
    fiscalYear?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const normalized = params.kind.toUpperCase() as GeneratedDocumentKind;
    if (!USER_STATEMENT_KINDS.includes(normalized)) {
      throwAppError(ErrorCodes.VALIDATION_ERROR, 'Unknown statement type', HttpStatus.BAD_REQUEST);
    }
    const doc = await this.prisma.generatedDocument.create({
      data: {
        ownerUserId: params.userId,
        kind: normalized,
        format: 'PDF',
        status: 'QUEUED',
        filtersJson: {
          fiscalYear: params.fiscalYear ?? null,
          dateFrom: params.dateFrom ?? null,
          dateTo: params.dateTo ?? null,
        },
      },
    });
    void this.statementProcessor.processById(doc.id).catch(() => undefined);

    return {
      id: doc.id,
      kind: normalized.toLowerCase(),
      status: 'queued',
      message: 'Statement queued for generation',
    };
  }

  async getRequestStatus(userId: string, documentId: string) {
    const doc = await this.prisma.generatedDocument.findFirst({
      where: { id: documentId, ownerUserId: userId },
    });
    if (!doc) {
      throwAppError(ErrorCodes.REPORT_FORBIDDEN, 'Statement not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: doc!.id,
      kind: doc!.kind.toLowerCase(),
      status: doc!.status.toLowerCase(),
      errorMessage: doc!.errorMessage,
      completedAt: doc!.completedAt?.toISOString() ?? null,
    };
  }

  private labelFor(kind: GeneratedDocumentKind): string {
    return statementKindLabel(kind);
  }
}
