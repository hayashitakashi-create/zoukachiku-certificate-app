/**
 * 既存住宅売買瑕疵保険加入用PDF生成器
 *
 * 中古住宅の売買時に既存住宅売買瑕疵保険に加入するための証明書。
 * 増改築等工事の基本情報と工事概要を証明する。
 *
 * テンプレート使用ページ:
 *   ページ1  : 基本情報（申請者、物件、工事完了日）
 *   ページ3  : 費用概要（①工事費総額 ②補助金 ③控除対象額）+ 工事内容説明
 *   ページ22 : 証明者情報
 */

import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  drawCheckmark,
  drawAmount,
  drawMultilineText,
  savePdfToBytes,
  type CertificateBaseData,
} from './pdfTemplateUtils';

/**
 * 既存住宅売買瑕疵保険加入用の追加データ
 */
export interface ResaleData extends CertificateBaseData {
  /** 工事費総額 */
  totalWorkCost: number;
  /** 補助金の有無 */
  hasSubsidy: boolean;
  /** 補助金額 */
  subsidyAmount: number;
  /** 控除対象額（工事費 - 補助金） */
  deductibleAmount: number;
  /** 工事の説明 */
  workDescription?: string;
}

/**
 * ページ3 の座標（housing_loan PDF生成器と同じ座標を使用）
 */
const RESALE_COORDS = {
  page3: {
    totalCost:        { x: 420, y: 247 },
    subsidyYes:       { x: 427, y: 224 },
    subsidyNo:        { x: 473, y: 224 },
    subsidyAmount:    { x: 420, y: 205 },
    deductibleAmount: { x: 420, y: 185 },
    workDescription:  { x: 63,  y: 618 },
  },
} as const;

/**
 * 既存住宅売買瑕疵保険加入用PDF生成
 */
export async function generateResalePDF(
  data: ResaleData
): Promise<Uint8Array> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1  = pages[0];   // 基本情報
    const page3  = pages[2];   // 費用概要
    const page22 = pages[21];  // 証明者情報

    // =======================================
    // 1ページ目：基本情報（共通）
    // =======================================
    fillBasicInfo(page1, data, font);

    // =======================================
    // 3ページ目：費用概要
    // =======================================
    // ① 工事費総額
    drawAmount(page3, data.totalWorkCost, RESALE_COORDS.page3.totalCost, font);

    // ② 補助金等の交付の有無
    if (data.hasSubsidy) {
      drawCheckmark(page3, RESALE_COORDS.page3.subsidyYes, font);
      drawAmount(page3, data.subsidyAmount, RESALE_COORDS.page3.subsidyAmount, font);
    } else {
      drawCheckmark(page3, RESALE_COORDS.page3.subsidyNo, font);
    }

    // ③ 控除対象額
    drawAmount(page3, data.deductibleAmount, RESALE_COORDS.page3.deductibleAmount, font);

    // 工事内容の説明
    if (data.workDescription) {
      drawMultilineText(page3, data.workDescription, RESALE_COORDS.page3.workDescription, font, {
        size: 8,
        lineHeight: 11,
        maxCharsPerLine: 70,
        minY: RESALE_COORDS.page3.deductibleAmount.y + 30,
      });
    }

    // =======================================
    // 22ページ目：証明者情報（共通）
    // =======================================
    fillIssuerInfo(page22, data, font);

    return await savePdfToBytes(pdfDoc);
  } catch (error) {
    console.error('既存住宅売買瑕疵保険PDF生成エラー:', error);
    throw new Error('既存住宅売買瑕疵保険加入用PDF生成に失敗しました: ' + (error as Error).message);
  }
}
