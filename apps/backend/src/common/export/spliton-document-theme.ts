import type PDFKit from 'pdfkit';
import { SPLITON_BRAND } from './report-data.types';
import { ensureSplitonPdfFont } from './spliton-pdf-fonts';

/** Spliton document palette (PDF). */
export const SPLITON_PDF_THEME = {
  accent: '#84cc16',
  accentDark: '#65a30d',
  ink: '#18181b',
  muted: '#52525b',
  line: '#e4e4e7',
  paper: '#fafafa',
} as const;

export type PdfPaintContext = {
  doc: PDFKit.PDFDocument;
  pageWidth: number;
  margin: number;
};

export function paintSplitonPdfHeader(
  ctx: PdfPaintContext,
  opts: { documentLabel: string; subtitle?: string },
): number {
  const { doc, pageWidth, margin } = ctx;
  ensureSplitonPdfFont(doc);
  const headerH = 52;
  doc.save();
  doc.rect(0, 0, pageWidth, headerH).fill(SPLITON_PDF_THEME.accent);
  doc.fillColor('#ffffff').fontSize(16).text(SPLITON_BRAND.name, margin, 14, {
    width: pageWidth - margin * 2,
  });
  doc.fontSize(9).text(SPLITON_BRAND.tagline, margin, 34, {
    width: pageWidth - margin * 2,
  });
  doc.restore();
  doc.y = headerH + 20;
  doc.fillColor(SPLITON_PDF_THEME.ink).fontSize(15).text(opts.documentLabel);
  if (opts.subtitle) {
    doc.moveDown(0.15);
    doc.fontSize(10).fillColor(SPLITON_PDF_THEME.muted).text(opts.subtitle);
  }
  doc.moveDown(0.6);
  return doc.y;
}

export function paintSplitonMetaRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
): void {
  ensureSplitonPdfFont(doc);
  doc.fontSize(9).fillColor(SPLITON_PDF_THEME.muted).text(label, { continued: true });
  doc.fillColor(SPLITON_PDF_THEME.ink).text(` ${value}`);
}

export function paintSplitonKeyValueBlock(
  doc: PDFKit.PDFDocument,
  fields: Array<{ label: string; value: string }>,
  margin: number,
  pageWidth: number,
): void {
  ensureSplitonPdfFont(doc);
  const colW = (pageWidth - margin * 2) / 2 - 8;
  let y = doc.y;
  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];
    doc.fontSize(8).fillColor(SPLITON_PDF_THEME.muted).text(left.label, margin, y, {
      width: colW,
    });
    doc.fontSize(10).fillColor(SPLITON_PDF_THEME.ink).text(left.value, margin, y + 11, {
      width: colW,
    });
    if (right) {
      doc.fontSize(8).fillColor(SPLITON_PDF_THEME.muted).text(right.label, margin + colW + 16, y, {
        width: colW,
      });
      doc
        .fontSize(10)
        .fillColor(SPLITON_PDF_THEME.ink)
        .text(right.value, margin + colW + 16, y + 11, { width: colW });
    }
    y += 36;
  }
  doc.y = y + 4;
}

export function paintSplitonPdfTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  margin: number,
  pageWidth: number,
  maxRows = 25,
): void {
  ensureSplitonPdfFont(doc);
  const tableW = pageWidth - margin * 2;
  const colCount = Math.max(1, headers.length);
  const colW = tableW / colCount;
  const rowH = 18;
  let y = doc.y;

  doc.fontSize(8).fillColor('#ffffff');
  doc.rect(margin, y, tableW, rowH).fill(SPLITON_PDF_THEME.accentDark);
  headers.forEach((h, i) => {
    doc.text(h, margin + i * colW + 4, y + 5, { width: colW - 8, lineBreak: false });
  });
  y += rowH;

  const slice = rows.slice(0, maxRows);
  slice.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? '#ffffff' : SPLITON_PDF_THEME.paper;
    doc.rect(margin, y, tableW, rowH).fill(bg);
    doc.fillColor(SPLITON_PDF_THEME.ink).fontSize(7);
    row.forEach((cell, ci) => {
      doc.text(String(cell), margin + ci * colW + 4, y + 5, {
        width: colW - 8,
        lineBreak: false,
      });
    });
    y += rowH;
  });
  doc.y = y + 8;
  if (rows.length > maxRows) {
    doc.fontSize(8).fillColor(SPLITON_PDF_THEME.muted).text(
      `… ещё ${rows.length - maxRows} строк (полный набор — в XLSX/CSV экспорте)`,
      margin,
    );
    doc.moveDown(0.5);
  }
}

export function paintSplitonPdfFooter(
  doc: PDFKit.PDFDocument,
  margin: number,
  pageWidth: number,
  pageNumber?: number,
): void {
  ensureSplitonPdfFont(doc);
  const footerY = doc.page.height - 56;
  doc
    .moveTo(margin, footerY - 8)
    .lineTo(pageWidth - margin, footerY - 8)
    .strokeColor(SPLITON_PDF_THEME.line)
    .stroke();
  doc.fontSize(7).fillColor(SPLITON_PDF_THEME.muted);
  doc.text(SPLITON_BRAND.disclaimer, margin, footerY, {
    width: pageWidth - margin * 2,
    align: 'left',
  });
  const support = `Поддержка: ${SPLITON_BRAND.supportEmail}`;
  doc.text(support, margin, footerY + 22, { width: pageWidth - margin * 2 });
  if (pageNumber !== undefined) {
    doc.text(`Стр. ${pageNumber}`, margin, footerY + 22, {
      width: pageWidth - margin * 2,
      align: 'right',
    });
  }
}
