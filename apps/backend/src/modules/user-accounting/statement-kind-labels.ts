import { GeneratedDocumentKind } from '@prisma/client';

const STATEMENT_KIND_LABELS: Partial<Record<GeneratedDocumentKind, string>> = {
  ANNUAL_INCOME_STATEMENT: 'Годовая справка о доходах',
  MONTHLY_WALLET_STATEMENT: 'Ежемесячная выписка кошелька',
  TRADING_SUMMARY: 'Сводка сделок',
  PAYOUTS_SUMMARY: 'Сводка выплат',
  FEES_PAID_SUMMARY: 'Сводка уплаченных комиссий',
  REALIZED_PNL_SUMMARY: 'Сводка реализованного PnL',
  DEPOSITS_WITHDRAWALS_SUMMARY: 'Сводка пополнений и выводов',
};

export function statementKindLabel(kind: GeneratedDocumentKind): string {
  return STATEMENT_KIND_LABELS[kind] ?? kind;
}
