import { Injectable } from '@nestjs/common';

import { ReportFormat } from '@prisma/client';

import ExcelJS from 'exceljs';

import PDFDocument from 'pdfkit';

import {

  Document,

  HeadingLevel,

  Packer,

  Paragraph,

  Table,

  TableCell,

  TableRow,

  TextRun,

  WidthType,

} from 'docx';

import { createHash } from 'node:crypto';

import { buildCsvFromTable } from './csv.util';

import {

  SPLITON_BRAND,

  type RenderedReportFile,

  type ReportDataset,

} from './report-data.types';

import { formatToExt, formatToMime } from './report-format.util';

import {

  paintSplitonKeyValueBlock,

  paintSplitonMetaRow,

  paintSplitonPdfFooter,

  paintSplitonPdfHeader,

  paintSplitonPdfTable,

  SPLITON_PDF_THEME,

} from './spliton-document-theme';

import {
  renderSplitonStatementPdf,
  type StatementPdfParams,
} from './spliton-statement-pdf';
import { registerSplitonPdfFonts } from './spliton-pdf-fonts';



function sha256Hex(buffer: Buffer): string {

  return createHash('sha256').update(buffer).digest('hex');

}



function autoSizeXlsxColumns(sheet: ExcelJS.Worksheet, maxCol = 20): void {

  sheet.columns.forEach((col, idx) => {

    if (idx >= maxCol) return;

    let max = 10;

    col.eachCell?.({ includeEmpty: false }, (cell) => {

      const len = String(cell.value ?? '').length;

      if (len > max) max = Math.min(len + 2, 48);

    });

    col.width = max;

  });

}



@Injectable()

export class ReportRendererService {

  async render(

    dataset: ReportDataset,

    format: ReportFormat,

  ): Promise<RenderedReportFile> {

    switch (format) {

      case ReportFormat.XLSX:

        return this.renderXlsx(dataset);

      case ReportFormat.PDF:

        return this.renderPdf(dataset);

      case ReportFormat.DOCX:

        return this.renderDocx(dataset);

      default:

        return this.renderCsv(dataset);

    }

  }



  renderCsv(dataset: ReportDataset): RenderedReportFile {

    const csv = buildCsvFromTable(dataset.headers, dataset.rows);

    const buffer = Buffer.from(csv, 'utf8');

    return this.pack(buffer, ReportFormat.CSV, dataset.rows.length);

  }



  async renderXlsx(dataset: ReportDataset): Promise<RenderedReportFile> {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = SPLITON_BRAND.name;

    workbook.created = new Date(dataset.generatedAt);



    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.addRow([`${SPLITON_BRAND.name} — сводка отчёта`]);

    summarySheet.addRow(['Название', dataset.title]);

    summarySheet.addRow(['Тип', dataset.reportType]);

    if (dataset.periodFrom)

      summarySheet.addRow(['Период с', dataset.periodFrom]);

    if (dataset.periodTo) summarySheet.addRow(['Период по', dataset.periodTo]);

    summarySheet.addRow(['Сформирован', dataset.generatedAt]);

    summarySheet.addRow(['Строк данных', String(dataset.rows.length)]);

    for (const row of dataset.summary ?? []) {

      summarySheet.addRow([row.label, row.value]);

    }

    summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF65A30D' } };



    const dataSheet = workbook.addWorksheet(dataset.dataSheetName ?? 'Data');

    dataSheet.addRow(dataset.headers);

    for (const row of dataset.rows) {

      dataSheet.addRow(row);

    }

    dataSheet.views = [{ state: 'frozen', ySplit: 1 }];

    if (dataset.headers.length > 0) {

      dataSheet.autoFilter = {

        from: { row: 1, column: 1 },

        to: { row: Math.max(1, dataset.rows.length + 1), column: dataset.headers.length },

      };

    }

    dataSheet.getRow(1).font = { bold: true };

    dataSheet.getRow(1).fill = {

      type: 'pattern',

      pattern: 'solid',

      fgColor: { argb: 'FFE4E4E7' },

    };

    autoSizeXlsxColumns(dataSheet);



    const metaSheet = workbook.addWorksheet('Metadata');

    metaSheet.addRow(['Ключ', 'Значение']);

    metaSheet.addRow(['brand', SPLITON_BRAND.name]);

    metaSheet.addRow(['generatedAt', dataset.generatedAt]);

    for (const [key, value] of Object.entries(dataset.metadata ?? {})) {

      metaSheet.addRow([key, value]);

    }

    autoSizeXlsxColumns(metaSheet);



    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return this.pack(buffer, ReportFormat.XLSX, dataset.rows.length);

  }



  async renderPdf(dataset: ReportDataset): Promise<RenderedReportFile> {

    const buffer = await new Promise<Buffer>((resolve, reject) => {

      const margin = 48;

      const doc = new PDFDocument({ margin, size: 'A4' });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.on('error', reject);



      registerSplitonPdfFonts(doc);

      const pageWidth = doc.page.width;

      paintSplitonPdfHeader(

        { doc, pageWidth, margin },

        { documentLabel: dataset.title, subtitle: dataset.reportType },

      );



      if (dataset.periodFrom || dataset.periodTo) {

        paintSplitonMetaRow(

          doc,

          'Период:',

          `${dataset.periodFrom ?? '—'} — ${dataset.periodTo ?? '—'}`,

        );

      }

      paintSplitonMetaRow(doc, 'Сформирован:', dataset.generatedAt);

      paintSplitonMetaRow(doc, 'Строк:', String(dataset.rows.length));

      doc.moveDown(0.4);



      if (dataset.summary?.length) {

        doc.fontSize(11).fillColor(SPLITON_PDF_THEME.ink).text('Сводка', { underline: true });

        doc.moveDown(0.3);

        for (const row of dataset.summary) {

          paintSplitonMetaRow(doc, `${row.label}:`, row.value);

        }

        doc.moveDown(0.5);

      }



      doc.fontSize(11).fillColor(SPLITON_PDF_THEME.ink).text('Данные', { underline: true });

      doc.moveDown(0.3);

      paintSplitonPdfTable(doc, dataset.headers, dataset.rows, margin, pageWidth, 30);



      paintSplitonPdfFooter(doc, margin, pageWidth, 1);

      doc.end();

    });



    return this.pack(buffer, ReportFormat.PDF, dataset.rows.length);

  }



  async renderDocx(dataset: ReportDataset): Promise<RenderedReportFile> {

    const tableRows = [

      new TableRow({

        children: dataset.headers.map(

          (h) =>

            new TableCell({

              children: [

                new Paragraph({

                  children: [new TextRun({ text: h, bold: true })],

                }),

              ],

            }),

        ),

      }),

      ...dataset.rows.slice(0, 200).map(

        (row) =>

          new TableRow({

            children: row.map(

              (cell) =>

                new TableCell({

                  children: [new Paragraph(String(cell))],

                }),

            ),

          }),

      ),

    ];



    const doc = new Document({

      creator: SPLITON_BRAND.name,

      title: dataset.title,

      sections: [

        {

          children: [

            new Paragraph({

              text: SPLITON_BRAND.name,

              heading: HeadingLevel.HEADING_1,

            }),

            new Paragraph({

              text: dataset.title,

              heading: HeadingLevel.HEADING_2,

            }),

            new Paragraph(`Тип отчёта: ${dataset.reportType}`),

            new Paragraph(`Сформирован: ${dataset.generatedAt}`),

            ...(dataset.summary ?? []).map(

              (s) => new Paragraph(`${s.label}: ${s.value}`),

            ),

            new Paragraph({ text: 'Данные', heading: HeadingLevel.HEADING_3 }),

            new Table({

              width: { size: 100, type: WidthType.PERCENTAGE },

              rows: tableRows,

            }),

            new Paragraph({ text: SPLITON_BRAND.disclaimer }),

            new Paragraph(`Поддержка: ${SPLITON_BRAND.supportEmail}`),

          ],

        },

      ],

    });



    const buffer = Buffer.from(await Packer.toBuffer(doc));

    return this.pack(buffer, ReportFormat.DOCX, dataset.rows.length);

  }



  async renderReceiptPdf(params: {

    title: string;

    reference: string;

    status: string;

    generatedAt: string;

    fields: Array<{ label: string; value: string }>;

  }): Promise<RenderedReportFile> {

    const buffer = await new Promise<Buffer>((resolve, reject) => {

      const margin = 48;

      const doc = new PDFDocument({ margin, size: 'A4' });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.on('error', reject);



      registerSplitonPdfFonts(doc);

      const pageWidth = doc.page.width;

      paintSplitonPdfHeader(

        { doc, pageWidth, margin },

        { documentLabel: params.title, subtitle: 'Квитанция операции' },

      );



      paintSplitonMetaRow(doc, 'Номер:', params.reference);

      paintSplitonMetaRow(doc, 'Статус:', params.status);

      paintSplitonMetaRow(doc, 'Дата:', params.generatedAt);

      doc.moveDown(0.5);



      doc.fontSize(11).fillColor(SPLITON_PDF_THEME.ink).text('Детали', { underline: true });

      doc.moveDown(0.4);

      paintSplitonKeyValueBlock(doc, params.fields, margin, pageWidth);



      paintSplitonPdfFooter(doc, margin, pageWidth, 1);

      doc.end();

    });

    return this.pack(buffer, ReportFormat.PDF, params.fields.length);

  }



  async renderStatementPdf(params: StatementPdfParams): Promise<RenderedReportFile> {

    const buffer = await renderSplitonStatementPdf(params);

    const rowCount = params.transactionRows?.length ?? 0;

    return this.pack(buffer, ReportFormat.PDF, rowCount);

  }



  private pack(

    buffer: Buffer,

    format: ReportFormat,

    rowCount: number,

  ): RenderedReportFile {

    return {

      buffer,

      mimeType: formatToMime(format),

      ext: formatToExt(format),

      rowCount,

      checksum: sha256Hex(buffer),

    };

  }

}


