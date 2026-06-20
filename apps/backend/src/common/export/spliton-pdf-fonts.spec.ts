import { registerSplitonPdfFonts } from './spliton-pdf-fonts';
import { renderSplitonStatementPdf } from './spliton-statement-pdf';
import PDFDocument from 'pdfkit';

describe('spliton PDF fonts', () => {
  it('embeds Cyrillic via Noto Sans buffers', async () => {
    const pdf = await renderSplitonStatementPdf({
      kindLabel: 'Годовая справка о доходах',
      periodLabel: '2026 год',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      holderName: 'Danila',
      reference: 'ST-TEST1234',
      issuedAt: '2026-06-01T12:00:00.000Z',
      balance: '0,00',
      opsCount: 0,
      inflow: '0,00',
      outflow: '0,00',
      asset: 'USDT',
      network: 'TRC20',
    });

    const raw = pdf.toString('latin1');
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(raw).toContain('ToUnicode');
    expect(raw).not.toMatch(/\/Helvetica\b/);
  });

  it('registers fonts on a blank document', () => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    registerSplitonPdfFonts(doc);
    doc.fontSize(12).text('Проверка кириллицы и español: ñáéí');
    doc.end();
  });
});
