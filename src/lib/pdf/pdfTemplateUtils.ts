/**
 * PDF生成共通ユーティリティ
 * 公式テンプレートPDFの読み込み、フォント埋め込み、描画ヘルパーを提供
 *
 * テンプレートPDF構造（23ページ）:
 *   ページ1    : 基本情報 + 工事種別（第1号～第6号）
 *   ページ2    : 第6号工事詳細（省エネ・断熱等性能等級）
 *   ページ3    : 費用の額等（①費用額 ②補助金 ③控除対象額）+ 工事内容
 *   ページ4-6  : セクションII（5年以上の住宅借入金等）
 *   ページ7-16 : セクションIII（住宅耐震改修等）
 *   ページ17-19: セクションIV（固定資産税関連）
 *   ページ20-21: 固定資産税の減額
 *   ページ22   : 証明者情報（建築士事務所 / 指定確認検査機関）
 *   ページ23   : 証明者情報（登録住宅性能評価機関 / 住宅瑕疵担保責任保険法人）
 *
 * 座標系: pdf-lib は左下原点（x右方向, y上方向）、単位はpt（1pt ≈ 0.353mm）
 * テンプレートサイズ: A4 = 595pt x 842pt
 */

import { PDFDocument, PDFPage, PDFFont, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export interface Coord {
  x: number;
  y: number;
}

export interface PdfContext {
  pdfDoc: PDFDocument;
  pages: PDFPage[];
  font: PDFFont;
}

/**
 * テンプレートPDFを読み込み、日本語フォントを埋め込んだコンテキストを返す
 */
export async function loadTemplateWithFont(): Promise<PdfContext> {
  const publicDir = path.join(process.cwd(), 'public');

  // テンプレートPDF読み込み
  const templatePath = path.join(publicDir, 'templates', 'housing-loan-certificate-template.pdf');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template PDF not found at: ${templatePath}`);
  }
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // fontkit登録
  pdfDoc.registerFontkit(fontkit);

  // 日本語フォント読み込み
  const fontPath = path.join(publicDir, 'fonts', 'NotoSansJP.ttf');
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found at: ${fontPath}`);
  }
  const fontBytes = fs.readFileSync(fontPath);
  const font = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();

  return { pdfDoc, pages, font };
}

/**
 * テキストを描画
 */
export function drawText(
  page: PDFPage,
  text: string,
  coord: Coord,
  font: PDFFont,
  size: number = 9
): void {
  page.drawText(text, {
    x: coord.x,
    y: coord.y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * チェックマークを描画
 */
export function drawCheckmark(
  page: PDFPage,
  coord: Coord,
  font: PDFFont
): void {
  page.drawText('✓', {
    x: coord.x + 1,
    y: coord.y - 2,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });
}

/**
 * 金額をカンマ区切りで描画
 */
export function drawAmount(
  page: PDFPage,
  amount: number,
  coord: Coord,
  font: PDFFont,
  size: number = 9
): void {
  drawText(page, amount.toLocaleString(), coord, font, size);
}

/**
 * 日付を年/月/日に分解して描画
 */
export function drawDate(
  page: PDFPage,
  dateStr: string,
  yearCoord: Coord,
  monthCoord: Coord,
  dayCoord: Coord,
  font: PDFFont,
  size: number = 9
): void {
  const date = new Date(dateStr);
  drawText(page, `${date.getFullYear()}`, yearCoord, font, size);
  drawText(page, `${date.getMonth() + 1}`, monthCoord, font, size);
  drawText(page, `${date.getDate()}`, dayCoord, font, size);
}

/**
 * 複数行テキストを描画（折り返し対応）
 */
export function drawMultilineText(
  page: PDFPage,
  text: string,
  startCoord: Coord,
  font: PDFFont,
  options: {
    size?: number;
    lineHeight?: number;
    maxCharsPerLine?: number;
    minY?: number;
  } = {}
): void {
  const {
    size = 8,
    lineHeight = 11,
    maxCharsPerLine = 70,
    minY = 100,
  } = options;

  const lines = text.split('\n');
  let yPos = startCoord.y;

  for (const line of lines) {
    if (yPos < minY) break;

    if (line.trim() === '') {
      yPos -= lineHeight - 1;
      continue;
    }

    let remaining = line;
    while (remaining.length > 0) {
      const chunk = remaining.substring(0, maxCharsPerLine);
      remaining = remaining.substring(maxCharsPerLine);

      if (yPos < minY) break;

      drawText(page, chunk, { x: startCoord.x, y: yPos }, font, size);
      yPos -= lineHeight;
    }
  }
}

/**
 * 証明書の共通データ型
 */
export interface CertificateBaseData {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  status: string;
}

/**
 * ページ1 基本情報の共通座標
 */
export const BASE_COORDS = {
  page1: {
    applicantAddress: { x: 163, y: 743 },
    applicantName: { x: 163, y: 723 },
    propertyAddress: { x: 163, y: 703 },
    completionDate: { x: 163, y: 683 },
  },
  page22: {
    issueDateYear: { x: 170, y: 717 },
    issueDateMonth: { x: 225, y: 717 },
    issueDateDay: { x: 271, y: 717 },
    issuerName: { x: 230, y: 640 },
    registrationNumber: { x: 450, y: 605 },
    officeName: { x: 230, y: 530 },
    officeType: { x: 385, y: 470 },
  },
} as const;

/**
 * 基本情報（ページ1）を記入する共通処理
 */
export function fillBasicInfo(
  page: PDFPage,
  certificate: CertificateBaseData,
  font: PDFFont
): void {
  // 住所
  drawText(page, certificate.applicantAddress, BASE_COORDS.page1.applicantAddress, font);

  // 氏名
  drawText(page, certificate.applicantName, BASE_COORDS.page1.applicantName, font);

  // 所在地
  const propertyText = certificate.propertyNumber
    ? `${certificate.propertyNumber}　${certificate.propertyAddress}`
    : certificate.propertyAddress;
  drawText(page, propertyText, BASE_COORDS.page1.propertyAddress, font);

  // 工事完了年月日
  const completionDate = new Date(certificate.completionDate);
  const completionStr = `${completionDate.getFullYear()}年${completionDate.getMonth() + 1}月${completionDate.getDate()}日`;
  drawText(page, completionStr, BASE_COORDS.page1.completionDate, font);
}

/**
 * 証明者情報（ページ22）を記入する共通処理
 */
export function fillIssuerInfo(
  page: PDFPage,
  certificate: CertificateBaseData,
  font: PDFFont
): void {
  // 証明年月日
  if (certificate.issueDate) {
    drawDate(
      page,
      certificate.issueDate,
      BASE_COORDS.page22.issueDateYear,
      BASE_COORDS.page22.issueDateMonth,
      BASE_COORDS.page22.issueDateDay,
      font
    );
  }

  // 建築士 氏名
  if (certificate.issuerName) {
    drawText(page, certificate.issuerName, BASE_COORDS.page22.issuerName, font);
  }

  // 登録番号
  if (certificate.issuerQualificationNumber) {
    drawText(page, certificate.issuerQualificationNumber, BASE_COORDS.page22.registrationNumber, font);
  }

  // 事務所名称
  if (certificate.issuerOfficeName) {
    drawText(page, certificate.issuerOfficeName, BASE_COORDS.page22.officeName, font);
  }

  // 事務所種別
  if (certificate.issuerOrganizationType) {
    drawText(page, certificate.issuerOrganizationType, BASE_COORDS.page22.officeType, font);
  }
}

/**
 * PDFドキュメントをBufferとして保存
 */
export async function savePdfToBuffer(pdfDoc: PDFDocument): Promise<Buffer> {
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
