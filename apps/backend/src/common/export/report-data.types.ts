export type ReportSummaryRow = {
  label: string;
  value: string;
};

export type ReportDataset = {
  title: string;
  reportType: string;
  periodFrom?: string;
  periodTo?: string;
  generatedAt: string;
  headers: string[];
  rows: string[][];
  summary?: ReportSummaryRow[];
  metadata?: Record<string, string>;
  dataSheetName?: string;
};

export type RenderedReportFile = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  rowCount: number;
  checksum: string;
};

export const SPLITON_BRAND = {
  name: 'Spliton',
  tagline: 'Music asset share exchange',
  supportEmail: 'support@spliton.io',
  disclaimer:
    'Документ сформирован электронно в системе Spliton и действителен без подписи. Не является налоговой или юридической консультацией.',
};
