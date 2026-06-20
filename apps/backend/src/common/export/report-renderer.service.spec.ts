import { ReportFormat } from '@prisma/client';
import { ReportRendererService } from './report-renderer.service';

describe('ReportRendererService', () => {
  const renderer = new ReportRendererService();

  const sampleDataset = {
    title: 'Finance summary',
    reportType: 'FINANCE_SUMMARY',
    generatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
    headers: ['ID', 'Amount'],
    rows: [['op-1', '100.00 USDT']],
    summary: [{ label: 'Total', value: '100.00 USDT' }],
    metadata: { generatedBy: 'admin@test.local' },
  };

  it('renders valid PDF report with checksum', async () => {
    const file = await renderer.render(
      {
        ...sampleDataset,
        title: 'Сводка по счёту',
        headers: ['Дата', 'Сумма'],
        rows: [['01.06.2026', '100,00 USDT']],
      },
      ReportFormat.PDF,
    );
    expect(file.buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(file.ext).toBe('pdf');
    expect(file.mimeType).toBe('application/pdf');
    expect(file.rowCount).toBe(1);
    expect(file.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(file.buffer.length).toBeGreaterThan(800);
  });

  it('renders receipt PDF with expected shape', async () => {
    const file = await renderer.renderReceiptPdf({
      title: 'Квитанция пополнения',
      reference: 'dep-test-001',
      status: 'CREDITED',
      generatedAt: '2026-06-01T12:00:00.000Z',
      fields: [
        { label: 'Сумма', value: '50.00 USDT' },
        { label: 'Сеть', value: 'TRON' },
      ],
    });
    expect(file.buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(file.rowCount).toBe(2);
    expect(file.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('renders statement PDF with Spliton branding', async () => {
    const file = await renderer.renderStatementPdf({
      kindLabel: 'Годовая справка о доходах',
      periodLabel: '2026 год',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      holderName: 'Danila',
      reference: 'ST-ABCD1234',
      issuedAt: '2026-06-01T12:00:00.000Z',
      balance: '0,00',
      opsCount: 0,
      inflow: '0,00',
      outflow: '0,00',
      asset: 'USDT',
      network: 'TRC20',
    });
    expect(file.buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(file.mimeType).toBe('application/pdf');
    expect(file.ext).toBe('pdf');
    expect(file.buffer.length).toBeGreaterThan(1500);
  });

  it('renders XLSX with Summary, Data and Metadata sheets', async () => {
    const file = await renderer.render(sampleDataset, ReportFormat.XLSX);
    expect(file.buffer.length).toBeGreaterThan(500);
    expect(file.ext).toBe('xlsx');
    const zipSig = file.buffer.subarray(0, 2).toString('hex');
    expect(zipSig).toBe('504b');
  });
});
