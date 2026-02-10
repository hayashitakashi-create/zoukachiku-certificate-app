/**
 * PDF生成共通ユーティリティ（ブラウザ対応版）
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
import type { IssuerInfo } from '@/types/issuer';
import { getOfficeTypeLabel, getArchitectQualificationLabel, getOrganizationTypeLabel } from '@/types/issuer';

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
 * ブラウザ対応: fetch()でpublicディレクトリからファイルを取得
 */
export async function loadTemplateWithFont(): Promise<PdfContext> {
  // テンプレートPDF読み込み（publicディレクトリからfetch）
  const templateResponse = await fetch('/templates/housing-loan-certificate-template.pdf');
  if (!templateResponse.ok) {
    throw new Error(`Template PDF not found: ${templateResponse.status}`);
  }
  const templateBytes = await templateResponse.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);

  // fontkit登録
  pdfDoc.registerFontkit(fontkit);

  // 日本語フォント読み込み
  const fontResponse = await fetch('/fonts/NotoSansJP.ttf');
  if (!fontResponse.ok) {
    throw new Error(`Font file not found: ${fontResponse.status}`);
  }
  const fontBytes = await fontResponse.arrayBuffer();
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
  page.drawText('\u2713', {
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
  issuerInfo?: IssuerInfo | null;
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
    // 証明年月日行 (y: 711.1–731.0)
    issueDateYear: { x: 170, y: 717 },
    issueDateMonth: { x: 225, y: 717 },
    issueDateDay: { x: 271, y: 717 },
    // 氏名行 (y: 619.7–661.8, x: 222.3–505.8)
    issuerName: { x: 230, y: 640 },
    // 建築士の別 入力 (y: 539.8–619.7, x: 222.3–333.7)
    architectQualification: { x: 230, y: 580 },
    // 登録番号 上段 (y: 590.9–619.7, x: 436.7–505.8)
    registrationNumber: { x: 450, y: 605 },
    // 登録を受けた都道府県名 下段 (y: 539.8–590.9, x: 436.7–505.8)
    registrationPrefecture: { x: 450, y: 565 },
    // 名称行 (y: 519.9–539.8, x: 222.3–505.8)
    officeName: { x: 230, y: 530 },
    // 所在地行 (y: 491.1–519.9, x: 222.3–505.8)
    officeAddress: { x: 230, y: 505 },
    // 事務所の別行 (y: 455.7–491.1, x: 379.6–505.8)
    officeType: { x: 385, y: 473 },
    // 登録年月日及び登録番号行 (y: 431.4–455.7, x: 379.6–505.8) 上下2段
    officeRegistrationDate: { x: 385, y: 447 },
    officeRegistrationNumber: { x: 385, y: 436 },
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
    ? `${certificate.propertyNumber}\u3000${certificate.propertyAddress}`
    : certificate.propertyAddress;
  drawText(page, propertyText, BASE_COORDS.page1.propertyAddress, font);

  // 工事完了年月日
  const completionDate = new Date(certificate.completionDate);
  const completionStr = `${completionDate.getFullYear()}\u5E74${completionDate.getMonth() + 1}\u6708${completionDate.getDate()}\u65E5`;
  drawText(page, completionStr, BASE_COORDS.page1.completionDate, font);
}

/**
 * 証明者情報（ページ22）を記入する共通処理
 * issuerInfo（リッチデータ）がある場合はそちらを優先し、なければフラットフィールドでフォールバック
 */
export function fillIssuerInfo(
  page: PDFPage,
  certificate: CertificateBaseData,
  font: PDFFont
): void {
  const coords = BASE_COORDS.page22;

  // 証明年月日
  if (certificate.issueDate) {
    drawDate(
      page,
      certificate.issueDate,
      coords.issueDateYear,
      coords.issueDateMonth,
      coords.issueDateDay,
      font
    );
  }

  const info = certificate.issuerInfo;

  if (info && info.organizationType === 'registered_architect_office') {
    // --- リッチデータ: 登録建築士事務所に属する建築士 ---

    // 建築士 氏名
    if (info.architectName) {
      drawText(page, info.architectName, coords.issuerName, font);
    }

    // 建築士資格種別（一級/二級/木造）
    if (info.architectQualification) {
      drawText(page, getArchitectQualificationLabel(info.architectQualification), coords.architectQualification, font);
    }

    // 登録番号
    if (info.architectRegistrationNumber) {
      drawText(page, info.architectRegistrationNumber, coords.registrationNumber, font);
    }

    // 登録を受けた都道府県名（二級/木造の場合）
    if (info.architectRegistrationPrefecture) {
      drawText(page, info.architectRegistrationPrefecture, coords.registrationPrefecture, font);
    }

    // 事務所名称
    if (info.officeName) {
      drawText(page, info.officeName, coords.officeName, font);
    }

    // 事務所所在地
    if (info.officeAddress) {
      drawText(page, info.officeAddress, coords.officeAddress, font);
    }

    // 事務所の別（一級/二級/木造建築士事務所）
    if (info.officeType) {
      drawText(page, getOfficeTypeLabel(info.officeType), coords.officeType, font);
    }

    // 事務所登録年月日
    if (info.officeRegistrationDate) {
      drawText(page, info.officeRegistrationDate, coords.officeRegistrationDate, font);
    }

    // 事務所登録番号
    if (info.officeRegistrationNumber) {
      drawText(page, info.officeRegistrationNumber, coords.officeRegistrationNumber, font);
    }
  } else {
    // --- フォールバック: フラットフィールド（旧データ or 他の組織種別） ---

    // 建築士 氏名
    if (certificate.issuerName) {
      drawText(page, certificate.issuerName, coords.issuerName, font);
    }

    // 登録番号
    if (certificate.issuerQualificationNumber) {
      drawText(page, certificate.issuerQualificationNumber, coords.registrationNumber, font);
    }

    // 事務所名称
    if (certificate.issuerOfficeName) {
      drawText(page, certificate.issuerOfficeName, coords.officeName, font);
    }

    // 事務所種別（日本語ラベルに変換）
    if (certificate.issuerOrganizationType) {
      const label = getOrganizationTypeLabel(certificate.issuerOrganizationType) || certificate.issuerOrganizationType;
      drawText(page, label, coords.officeType, font);
    }
  }
}

/**
 * PDFドキュメントをUint8Arrayとして保存
 */
export async function savePdfToBytes(pdfDoc: PDFDocument): Promise<Uint8Array> {
  return await pdfDoc.save();
}
