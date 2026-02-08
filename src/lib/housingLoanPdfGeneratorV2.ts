/**
 * 住宅借入金等特別控除用PDF生成器（pdf-lib版・ブラウザ対応）
 * 公式の増改築等工事証明書テンプレート（23ページ）を使用
 *
 * テンプレートPDF構造（23ページ）:
 *   ページ1  : 基本情報 + 工事種別（第1号～第6号） + セクションI
 *   ページ2  : 第6号工事詳細（省エネ・断熱等性能等級）
 *   ページ3  : 費用の額等（①費用額 ②補助金 ③控除対象額）+ 工事内容
 *   ページ4-6: セクションII（5年以上の住宅借入金等）
 *   ページ7-16: セクションIII（住宅耐震改修等）
 *   ページ17-19: セクションIV（固定資産税関連）
 *   ページ20-21: 固定資産税の減額
 *   ページ22 : 証明者情報（建築士事務所に属する建築士 / 指定確認検査機関）
 *   ページ23 : 証明者情報（登録住宅性能評価機関 / 住宅瑕疵担保責任保険法人）
 *
 * 座標系: pdf-lib は左下原点（x右方向, y上方向）、単位はpt（1pt ≈ 0.353mm）
 * テンプレートサイズ: A4 = 595pt x 842pt
 */

import { rgb } from 'pdf-lib';
import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  savePdfToBytes,
  type CertificateBaseData,
} from './pdf/pdfTemplateUtils';

interface CertificateData extends CertificateBaseData {
  housingLoanDetail?: {
    id: string;
    workTypes: any;
    workDescription: string | null;
    totalCost: number;
    hasSubsidy: boolean;
    subsidyAmount: number;
    deductibleAmount: number;
  } | null;
}

/**
 * テンプレートPDFの実測座標定義
 * PyMuPDF (fitz) で実測した値を pdf-lib座標系（左下原点）に変換済み
 *
 * 変換式: pdf-lib_y = 842 - pymupdf_y
 */
const COORDS = {
  // ===== ページ1（pages[0]）: 基本情報 =====
  page1: {
    // チェックボックス座標（テンプレートの「□」記号の位置に合わせる）
    // 第1号工事
    work1: {
      extension:       { x: 142, y: 592 },
      renovation:      { x: 205, y: 592 },
      majorRepair:     { x: 279, y: 592 },
      majorRemodeling: { x: 370, y: 592 },
    },
    // 第2号工事
    work2: {
      floorOverHalf:     { x: 142, y: 530 },
      stairOverHalf:     { x: 301, y: 530 },
      partitionOverHalf: { x: 142, y: 517 },
      wallOverHalf:      { x: 324, y: 517 },
    },
    // 第3号工事
    work3: {
      livingRoom: { x: 142, y: 484 },
      kitchen:    { x: 194, y: 484 },
      bathroom:   { x: 267, y: 484 },
      toilet:     { x: 324, y: 484 },
      washroom:   { x: 382, y: 484 },
      storage:    { x: 450, y: 484 },
      entrance:   { x: 142, y: 472 },
      corridor:   { x: 194, y: 472 },
    },
    // 第4号工事（耐震改修）
    work4: {
      buildingStandard:  { x: 142, y: 430 },
      earthquakeSafety:  { x: 142, y: 416 },
    },
    // 第5号工事（バリアフリー）
    work5: {
      pathwayExpansion:    { x: 142, y: 363 },
      stairSlope:          { x: 279, y: 363 },
      bathroomImprovement: { x: 393, y: 363 },
      toiletImprovement:   { x: 142, y: 351 },
      handrails:           { x: 279, y: 351 },
      stepElimination:     { x: 393, y: 351 },
      doorImprovement:     { x: 142, y: 339 },
      floorSlipPrevention: { x: 279, y: 339 },
    },
    // 第6号工事（省エネ）
    work6: {
      allWindowsInsulation:      { x: 205, y: 286 },
      allRoomsWindowsInsulation: { x: 205, y: 275 },
      highInsulation:            { x: 205, y: 265 },
      ceilingInsulation:         { x: 205, y: 210 },
      wallInsulation:            { x: 370, y: 210 },
      floorInsulation:           { x: 205, y: 197 },
      // 地域区分
      region1: { x: 267, y: 175 },
      region2: { x: 324, y: 175 },
      region3: { x: 382, y: 175 },
      region4: { x: 439, y: 175 },
      region5: { x: 267, y: 165 },
      region6: { x: 324, y: 165 },
      region7: { x: 382, y: 165 },
      region8: { x: 439, y: 165 },
      // 等級
      grade1: { x: 267, y: 127 },
      grade2: { x: 336, y: 127 },
      grade3: { x: 404, y: 127 },
    },
  },

  // ===== ページ3（pages[2]）: 費用の額等 =====
  page3: {
    totalCost: { x: 420, y: 247 },
    subsidyYes: { x: 427, y: 224 },
    subsidyNo:  { x: 473, y: 224 },
    subsidyAmount: { x: 420, y: 205 },
    deductibleAmount: { x: 420, y: 185 },
    workDescription: { x: 63, y: 618 },
  },
} as const;

/**
 * チェックボックスにチェックマークを描画
 */
function drawCheckmark(
  page: any,
  pos: { x: number; y: number },
  font: any
) {
  page.drawText('\u2713', {
    x: pos.x + 1,
    y: pos.y - 2,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
}

/**
 * 公式テンプレートPDFに情報を記入して生成（ブラウザ対応版）
 */
export async function generateHousingLoanPDF(
  certificate: CertificateData
): Promise<Uint8Array> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1 = pages[0];   // 1ページ目: 基本情報 + 工事種別
    const page3 = pages[2];   // 3ページ目: 費用の額等
    const page22 = pages[21]; // 22ページ目: 証明者情報

    // =======================================
    // 1ページ目：基本情報の記入（共通処理）
    // =======================================
    fillBasicInfo(page1, certificate, font);

    // =======================================
    // 1ページ目：チェックボックスのマーク（工事種別）
    // =======================================
    if (certificate.housingLoanDetail?.workTypes) {
      const workTypes = certificate.housingLoanDetail.workTypes;

      // 第1号工事のチェック
      if (workTypes.work1) {
        if (workTypes.work1.extension) drawCheckmark(page1, COORDS.page1.work1.extension, font);
        if (workTypes.work1.renovation) drawCheckmark(page1, COORDS.page1.work1.renovation, font);
        if (workTypes.work1.majorRepair) drawCheckmark(page1, COORDS.page1.work1.majorRepair, font);
        if (workTypes.work1.majorRemodeling) drawCheckmark(page1, COORDS.page1.work1.majorRemodeling, font);
      }

      // 第2号工事のチェック
      if (workTypes.work2) {
        if (workTypes.work2.floorOverHalf) drawCheckmark(page1, COORDS.page1.work2.floorOverHalf, font);
        if (workTypes.work2.stairOverHalf) drawCheckmark(page1, COORDS.page1.work2.stairOverHalf, font);
        if (workTypes.work2.partitionOverHalf) drawCheckmark(page1, COORDS.page1.work2.partitionOverHalf, font);
        if (workTypes.work2.wallOverHalf) drawCheckmark(page1, COORDS.page1.work2.wallOverHalf, font);
      }

      // 第3号工事のチェック
      if (workTypes.work3) {
        if (workTypes.work3.livingRoom) drawCheckmark(page1, COORDS.page1.work3.livingRoom, font);
        if (workTypes.work3.kitchen) drawCheckmark(page1, COORDS.page1.work3.kitchen, font);
        if (workTypes.work3.bathroom) drawCheckmark(page1, COORDS.page1.work3.bathroom, font);
        if (workTypes.work3.toilet) drawCheckmark(page1, COORDS.page1.work3.toilet, font);
        if (workTypes.work3.washroom) drawCheckmark(page1, COORDS.page1.work3.washroom, font);
        if (workTypes.work3.storage) drawCheckmark(page1, COORDS.page1.work3.storage, font);
        if (workTypes.work3.entrance) drawCheckmark(page1, COORDS.page1.work3.entrance, font);
        if (workTypes.work3.corridor) drawCheckmark(page1, COORDS.page1.work3.corridor, font);
      }

      // 第4号工事のチェック（耐震改修）
      if (workTypes.work4) {
        if (workTypes.work4.buildingStandard) drawCheckmark(page1, COORDS.page1.work4.buildingStandard, font);
        if (workTypes.work4.earthquakeSafety) drawCheckmark(page1, COORDS.page1.work4.earthquakeSafety, font);
      }

      // 第5号工事のチェック（バリアフリー）
      if (workTypes.work5) {
        if (workTypes.work5.pathwayExpansion) drawCheckmark(page1, COORDS.page1.work5.pathwayExpansion, font);
        if (workTypes.work5.stairSlope) drawCheckmark(page1, COORDS.page1.work5.stairSlope, font);
        if (workTypes.work5.bathroomImprovement) drawCheckmark(page1, COORDS.page1.work5.bathroomImprovement, font);
        if (workTypes.work5.toiletImprovement) drawCheckmark(page1, COORDS.page1.work5.toiletImprovement, font);
        if (workTypes.work5.handrails) drawCheckmark(page1, COORDS.page1.work5.handrails, font);
        if (workTypes.work5.stepElimination) drawCheckmark(page1, COORDS.page1.work5.stepElimination, font);
        if (workTypes.work5.doorImprovement) drawCheckmark(page1, COORDS.page1.work5.doorImprovement, font);
        if (workTypes.work5.floorSlipPrevention) drawCheckmark(page1, COORDS.page1.work5.floorSlipPrevention, font);
      }

      // 第6号工事のチェック（省エネ）
      if (workTypes.work6?.energyEfficiency) {
        const ee = workTypes.work6.energyEfficiency;

        if (ee.allWindowsInsulation) drawCheckmark(page1, COORDS.page1.work6.allWindowsInsulation, font);
        if (ee.allRoomsWindowsInsulation) drawCheckmark(page1, COORDS.page1.work6.allRoomsWindowsInsulation, font);
        if (ee.highInsulation) drawCheckmark(page1, COORDS.page1.work6.highInsulation, font);
        if (ee.ceilingInsulation) drawCheckmark(page1, COORDS.page1.work6.ceilingInsulation, font);
        if (ee.wallInsulation) drawCheckmark(page1, COORDS.page1.work6.wallInsulation, font);
        if (ee.floorInsulation) drawCheckmark(page1, COORDS.page1.work6.floorInsulation, font);

        // 地域区分
        if (ee.region1) drawCheckmark(page1, COORDS.page1.work6.region1, font);
        if (ee.region2) drawCheckmark(page1, COORDS.page1.work6.region2, font);
        if (ee.region3) drawCheckmark(page1, COORDS.page1.work6.region3, font);
        if (ee.region4) drawCheckmark(page1, COORDS.page1.work6.region4, font);
        if (ee.region5) drawCheckmark(page1, COORDS.page1.work6.region5, font);
        if (ee.region6) drawCheckmark(page1, COORDS.page1.work6.region6, font);
        if (ee.region7) drawCheckmark(page1, COORDS.page1.work6.region7, font);
        if (ee.region8) drawCheckmark(page1, COORDS.page1.work6.region8, font);

        // 等級
        if (ee.grade1) drawCheckmark(page1, COORDS.page1.work6.grade1, font);
        if (ee.grade2) drawCheckmark(page1, COORDS.page1.work6.grade2, font);
        if (ee.grade3) drawCheckmark(page1, COORDS.page1.work6.grade3, font);
      }
    }

    // =======================================
    // 3ページ目：費用概要の記入
    // =======================================
    if (certificate.housingLoanDetail) {
      const detail = certificate.housingLoanDetail;

      // ① 第1号工事～第6号工事に要した費用の額
      page3.drawText(`${detail.totalCost.toLocaleString()}`, {
        x: COORDS.page3.totalCost.x,
        y: COORDS.page3.totalCost.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      // ② 補助金等の交付の有無
      if (detail.hasSubsidy) {
        drawCheckmark(page3, COORDS.page3.subsidyYes, font);

        // 交付される補助金等の額
        page3.drawText(`${detail.subsidyAmount.toLocaleString()}`, {
          x: COORDS.page3.subsidyAmount.x,
          y: COORDS.page3.subsidyAmount.y,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
      } else {
        drawCheckmark(page3, COORDS.page3.subsidyNo, font);
      }

      // ③ ①から②を差し引いた額（控除対象額）
      page3.drawText(`${detail.deductibleAmount.toLocaleString()}`, {
        x: COORDS.page3.deductibleAmount.x,
        y: COORDS.page3.deductibleAmount.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // =======================================
    // 3ページ目：工事内容の記入
    // =======================================
    if (certificate.housingLoanDetail?.workDescription) {
      const description = certificate.housingLoanDetail.workDescription;

      const lines = description.split('\n');
      let yPos = COORDS.page3.workDescription.y;

      for (const line of lines) {
        if (yPos < COORDS.page3.deductibleAmount.y + 30) break;

        if (line.trim() === '') {
          yPos -= 10;
          continue;
        }

        const maxCharsPerLine = 70;
        let remaining = line;
        while (remaining.length > 0) {
          const chunk = remaining.substring(0, maxCharsPerLine);
          remaining = remaining.substring(maxCharsPerLine);

          if (yPos < COORDS.page3.deductibleAmount.y + 30) break;

          page3.drawText(chunk, {
            x: COORDS.page3.workDescription.x,
            y: yPos,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPos -= 11;
        }
      }
    }

    // =======================================
    // 22ページ目：証明者情報の記入（共通処理）
    // =======================================
    fillIssuerInfo(page22, certificate, font);

    // PDFをUint8Arrayとして保存
    return await savePdfToBytes(pdfDoc);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ' + (error as Error).message);
  }
}
