import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type PDFKit from 'pdfkit';

export const SPLITON_PDF_FONTS = {
  regular: 'SplitonNotoRegular',
  bold: 'SplitonNotoBold',
} as const;

type FontBuffers = {
  regular: Buffer;
  bold: Buffer;
};

let cachedFonts: FontBuffers | null = null;

function fontRootCandidates(): string[] {
  const cwd = process.cwd();
  return [
    join(__dirname, '../../assets/fonts'),
    join(__dirname, '../../../assets/fonts'),
    join(cwd, 'src/assets/fonts'),
    join(cwd, 'assets/fonts'),
    join(cwd, 'apps/backend/src/assets/fonts'),
    join(cwd, 'apps/backend/assets/fonts'),
  ];
}

function resolveFontPath(fileName: string): string | null {
  for (const root of fontRootCandidates()) {
    const path = join(root, fileName);
    if (existsSync(path)) return path;
  }
  return null;
}

function loadFontBuffers(): FontBuffers {
  if (cachedFonts) return cachedFonts;

  const regularPath = resolveFontPath('NotoSans-Regular.ttf');
  if (!regularPath) {
    throw new Error(
      `Spliton PDF fonts not found (NotoSans-Regular.ttf). Checked: ${fontRootCandidates().join(', ')}`,
    );
  }

  const boldPath = resolveFontPath('NotoSans-Bold.ttf') ?? regularPath;
  cachedFonts = {
    regular: readFileSync(regularPath),
    bold: readFileSync(boldPath),
  };
  return cachedFonts;
}

export function registerSplitonPdfFonts(doc: PDFKit.PDFDocument): void {
  const { regular, bold } = loadFontBuffers();
  doc.registerFont(SPLITON_PDF_FONTS.regular, regular);
  doc.registerFont(SPLITON_PDF_FONTS.bold, bold);
  doc.font(SPLITON_PDF_FONTS.regular);
}

export function ensureSplitonPdfFont(
  doc: PDFKit.PDFDocument,
  weight: keyof typeof SPLITON_PDF_FONTS = 'regular',
): void {
  doc.font(SPLITON_PDF_FONTS[weight]);
}

/** Test helper — resets module cache in unit tests if needed. */
export function __resetSplitonPdfFontCacheForTests(): void {
  cachedFonts = null;
}
