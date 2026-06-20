import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { SPLITON_BRAND } from './report-data.types';
import {
  resolveSplitonLogoFullPath,
  resolveSplitonLogoMiniPath,
} from './spliton-brand-assets';
import { registerSplitonPdfFonts, ensureSplitonPdfFont } from './spliton-pdf-fonts';

export type StatementPdfParams = {
  kindLabel: string;
  periodLabel: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  holderName: string;
  reference: string;
  issuedAt: string;
  balance: string;
  opsCount: number;
  inflow: string;
  outflow: string;
  asset: string;
  network: string;
  transactionHeaders?: string[];
  transactionRows?: string[][];
};

const ACCENT = '#B7F500';
const INK = '#18181b';
const MUTED = '#52525b';
const PAPER = '#fafafa';
const LINE = '#e4e4e7';
const CONFIRMED_BG = '#ecfdf5';
const CONFIRMED_INK = '#065f46';

function formatDocDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatRangeDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function paintWatermark(doc: PDFKit.PDFDocument, pageWidth: number, pageHeight: number): void {
  const logo = resolveSplitonLogoMiniPath();
  if (!logo) return;
  const size = 140;
  doc.save();
  doc.opacity(0.04);
  doc.image(logo, (pageWidth - size) / 2, (pageHeight - size) / 2 - 20, {
    width: size,
    height: size,
  });
  doc.opacity(1);
  doc.restore();
  ensureSplitonPdfFont(doc);
}

function paintMetaCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): void {
  ensureSplitonPdfFont(doc);
  doc.fontSize(8).fillColor(MUTED).text(label.toUpperCase(), x, y, { width });
  doc.fontSize(10).fillColor(INK).text(value, x, y + 12, { width });
}

function paintSummaryRow(
  doc: PDFKit.PDFDocument,
  margin: number,
  pageWidth: number,
  y: number,
  label: string,
  value: string,
  shaded: boolean,
): number {
  ensureSplitonPdfFont(doc);
  const rowH = 22;
  const tableW = pageWidth - margin * 2;
  if (shaded) {
    doc.rect(margin, y, tableW, rowH).fill('#ffffff');
  }
  doc.fontSize(9).fillColor(MUTED).text(label, margin + 12, y + 6, {
    width: tableW * 0.62,
  });
  doc.fontSize(9).fillColor(INK).text(value, margin + 12, y + 6, {
    width: tableW - 24,
    align: 'right',
  });
  return y + rowH;
}

function paintTransactionsTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  margin: number,
  pageWidth: number,
  startY: number,
): number {
  ensureSplitonPdfFont(doc);
  const tableW = pageWidth - margin * 2;
  const colCount = Math.max(1, headers.length);
  const colW = tableW / colCount;
  const rowH = 16;
  let y = startY;

  doc.fontSize(8).fillColor('#ffffff');
  doc.rect(margin, y, tableW, rowH).fill(INK);
  headers.forEach((header, index) => {
    doc.text(header, margin + index * colW + 4, y + 4, {
      width: colW - 8,
      lineBreak: false,
    });
  });
  y += rowH;

  const slice = rows.slice(0, 18);
  slice.forEach((row, rowIndex) => {
    const bg = rowIndex % 2 === 0 ? '#ffffff' : PAPER;
    doc.rect(margin, y, tableW, rowH).fill(bg);
    doc.fillColor(INK).fontSize(7);
    row.forEach((cell, cellIndex) => {
      doc.text(String(cell), margin + cellIndex * colW + 4, y + 4, {
        width: colW - 8,
        lineBreak: false,
      });
    });
    y += rowH;
  });

  if (rows.length > slice.length) {
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text(`… ещё ${rows.length - slice.length} операций`, margin, y + 4);
    y += 16;
  }

  return y + 8;
}

export async function renderSplitonStatementPdf(params: StatementPdfParams): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const margin = 48;
    const doc = new PDFDocument({ margin, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    registerSplitonPdfFonts(doc);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    paintWatermark(doc, pageWidth, pageHeight);

    doc.rect(0, 0, pageWidth, 4).fill(ACCENT);

    const headerTop = 4;
    const headerH = 78;
    doc.rect(0, headerTop, pageWidth, headerH).fill(PAPER);

    const logoFull = resolveSplitonLogoFullPath();
    const headerLeftX = margin;
    const headerRightX = pageWidth - margin - 130;
    if (logoFull) {
      doc.image(logoFull, headerLeftX, headerTop + 16, { height: 26 });
      ensureSplitonPdfFont(doc);
    } else {
      doc
        .fontSize(18)
        .fillColor(INK)
        .text(SPLITON_BRAND.name, headerLeftX, headerTop + 18);
    }
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text('Платформа долей музыкальных активов', headerLeftX, headerTop + 46, {
        width: pageWidth - margin * 2 - 140,
      });

    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text('СПРАВКА', headerRightX, headerTop + 18, { width: 130, align: 'right' });
    doc
      .fontSize(10)
      .fillColor(INK)
      .text(params.reference, headerRightX, headerTop + 30, { width: 130, align: 'right' });
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text(formatDocDate(params.issuedAt), headerRightX, headerTop + 46, {
        width: 130,
        align: 'right',
      });

    let y = headerTop + headerH + 24;

    doc.fontSize(15).fillColor(INK).text(params.kindLabel, margin, y, {
      width: pageWidth - margin * 2 - 120,
    });
    doc
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Отчётный период: ${params.periodLabel}`, margin, y + 20);

    const badgeText = 'ПОДТВЕРЖДЕНО';
    const badgeW = 92;
    const badgeH = 18;
    const badgeX = pageWidth - margin - badgeW;
    doc.roundedRect(badgeX, y, badgeW, badgeH, 4).fill(CONFIRMED_BG);
    doc
      .fontSize(7)
      .fillColor(CONFIRMED_INK)
      .text(badgeText, badgeX, y + 5, { width: badgeW, align: 'center' });

    y += 52;

    const metaW = (pageWidth - margin * 2 - 12) / 2;
    doc.roundedRect(margin, y, pageWidth - margin * 2, 74, 10).fill(PAPER);
    const metaInnerY = y + 14;
    paintMetaCell(doc, margin + 14, metaInnerY, metaW, 'Получатель', params.holderName);
    paintMetaCell(
      doc,
      margin + 14 + metaW + 12,
      metaInnerY,
      metaW,
      'Период',
      params.dateFrom && params.dateTo
        ? `${formatRangeDate(params.dateFrom)} — ${formatRangeDate(params.dateTo)}`
        : params.periodLabel,
    );
    paintMetaCell(
      doc,
      margin + 14,
      metaInnerY + 34,
      metaW,
      'Валюта',
      `${params.asset} · ${params.network}`,
    );
    paintMetaCell(
      doc,
      margin + 14 + metaW + 12,
      metaInnerY + 34,
      metaW,
      'Операций в периоде',
      String(params.opsCount),
    );

    y += 90;

    const summaryW = pageWidth - margin * 2;
    doc.roundedRect(margin, y, summaryW, 92, 10).fill(PAPER);
    doc.rect(margin, y, summaryW, 22).fill(INK);
    doc
      .fontSize(8)
      .fillColor('#ffffff')
      .text('СВОДКА ПО СЧЁТУ', margin + 12, y + 7);

    let rowY = y + 22;
    rowY = paintSummaryRow(
      doc,
      margin,
      pageWidth,
      rowY,
      'Доступный баланс на дату',
      `${params.balance} ${params.asset}`,
      false,
    );
    rowY = paintSummaryRow(
      doc,
      margin,
      pageWidth,
      rowY,
      'Пополнения за период',
      `+${params.inflow} ${params.asset}`,
      true,
    );
    paintSummaryRow(
      doc,
      margin,
      pageWidth,
      rowY,
      'Списания за период',
      `−${params.outflow} ${params.asset}`,
      false,
    );

    y += 108;

    if (params.transactionHeaders?.length && params.transactionRows?.length) {
      doc.fontSize(11).fillColor(INK).text('Операции за период', margin, y);
      y += 18;
      y = paintTransactionsTable(
        doc,
        params.transactionHeaders,
        params.transactionRows,
        margin,
        pageWidth,
        y,
      );
    }

    const footerY = pageHeight - 72;
    doc
      .moveTo(margin, footerY - 10)
      .lineTo(pageWidth - margin, footerY - 10)
      .strokeColor(LINE)
      .stroke();
    doc
      .fontSize(7)
      .fillColor(MUTED)
      .text(
        'Документ сформирован автоматически на основании записей внутреннего ledger Spliton. Не является налоговой или юридической консультацией.',
        margin,
        footerY,
        { width: pageWidth - margin * 2 - 70 },
      );
    doc
      .fontSize(7)
      .fillColor(MUTED)
      .text('spliton.io · treasury@spliton.io', margin, footerY + 28, {
        width: pageWidth - margin * 2 - 70,
      });

    const logoMini = resolveSplitonLogoMiniPath();
    if (logoMini) {
      doc.roundedRect(pageWidth - margin - 62, footerY + 4, 62, 24, 6).fill('#ffffff');
      doc.image(logoMini, pageWidth - margin - 56, footerY + 8, { width: 14, height: 14 });
      ensureSplitonPdfFont(doc);
      doc
        .fontSize(8)
        .fillColor(INK)
        .text('Spliton', pageWidth - margin - 38, footerY + 10, { width: 30 });
    }

    doc.end();
  });
}
