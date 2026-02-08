/**
 * 固定資産税減額用PDF生成器
 * 公式テンプレートPDFのセクションIV（ページ17-21）を使用
 *
 * 固定資産税の減額対象:
 *   - 耐震改修（地方税法施行令附則第12条第28項）
 *   - バリアフリー改修（地方税法附則第15条の9第9項）
 *   - 省エネ改修（地方税法附則第15条の9第5項）
 *   - 長期優良住宅化改修
 *
 * ※ 座標は実測が必要なため、暫定値を使用
 *   本番運用前にPyMuPDF等でテンプレートの正確な座標を計測すること
 */

import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  drawText,
  drawCheckmark,
  drawAmount,
  savePdfToBuffer,
  type CertificateBaseData,
} from './pdfTemplateUtils';

/**
 * 固定資産税減額用の追加データ
 */
export interface PropertyTaxData extends CertificateBaseData {
  /** 耐震改修の情報 */
  seismic?: {
    totalAmount: number;
    subsidyAmount: number;
    deductibleAmount: number;
  };
  /** バリアフリー改修の情報 */
  barrierFree?: {
    totalAmount: number;
    subsidyAmount: number;
    deductibleAmount: number;
  };
  /** 省エネ改修の情報 */
  energySaving?: {
    totalAmount: number;
    subsidyAmount: number;
    deductibleAmount: number;
    hasSolarPower: boolean;
  };
  /** 長期優良住宅化改修の情報 */
  longTermHousing?: {
    totalAmount: number;
    subsidyAmount: number;
    deductibleAmount: number;
    isExcellentHousing: boolean;
  };
  /** 工事の説明 */
  workDescription?: string;
}

/**
 * 固定資産税減額用のページ座標（暫定値）
 * テンプレートのページ17-21に対応
 *
 * 注意: これらの座標は推定値です。
 * 本番運用前にPyMuPDFで実測して更新してください。
 */
const PROPERTY_TAX_COORDS = {
  // ===== ページ17（pages[16]）: 固定資産税 セクションIV =====
  page17: {
    // 耐震改修工事の費用
    seismicTotalAmount: { x: 420, y: 600 },
    seismicSubsidy: { x: 420, y: 580 },
    seismicDeductible: { x: 420, y: 560 },
    // バリアフリー改修工事の費用
    barrierFreeTotalAmount: { x: 420, y: 480 },
    barrierFreeSubsidy: { x: 420, y: 460 },
    barrierFreeDeductible: { x: 420, y: 440 },
  },
  // ===== ページ18（pages[17]）=====
  page18: {
    // 省エネ改修工事の費用
    energyTotalAmount: { x: 420, y: 600 },
    energySubsidy: { x: 420, y: 580 },
    energyDeductible: { x: 420, y: 560 },
    // 太陽光発電チェック
    solarPowerYes: { x: 420, y: 520 },
    solarPowerNo: { x: 470, y: 520 },
  },
  // ===== ページ19（pages[18]）=====
  page19: {
    // 長期優良住宅化改修
    longTermTotalAmount: { x: 420, y: 600 },
    longTermSubsidy: { x: 420, y: 580 },
    longTermDeductible: { x: 420, y: 560 },
    // 優良住宅認定チェック
    excellentHousingYes: { x: 420, y: 520 },
    excellentHousingNo: { x: 470, y: 520 },
  },
  // ===== ページ20-21: 固定資産税の減額詳細 =====
  page20: {
    workDescription: { x: 63, y: 700 },
  },
} as const;

/**
 * 固定資産税減額用PDF生成
 */
export async function generatePropertyTaxPDF(
  certificate: PropertyTaxData
): Promise<Buffer> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1 = pages[0];    // 基本情報
    const page17 = pages[16];  // 固定資産税 セクションIV
    const page18 = pages[17];  // 省エネ改修
    const page19 = pages[18];  // 長期優良住宅化
    const page20 = pages[19];  // 固定資産税の減額詳細
    const page22 = pages[21];  // 証明者情報

    // =======================================
    // 1ページ目：基本情報の記入（共通）
    // =======================================
    fillBasicInfo(page1, certificate, font);

    // =======================================
    // 17ページ目：耐震・バリアフリー改修の費用
    // =======================================
    if (certificate.seismic) {
      const s = certificate.seismic;
      drawAmount(page17, s.totalAmount, PROPERTY_TAX_COORDS.page17.seismicTotalAmount, font);
      if (s.subsidyAmount > 0) {
        drawAmount(page17, s.subsidyAmount, PROPERTY_TAX_COORDS.page17.seismicSubsidy, font);
      }
      drawAmount(page17, s.deductibleAmount, PROPERTY_TAX_COORDS.page17.seismicDeductible, font);
    }

    if (certificate.barrierFree) {
      const bf = certificate.barrierFree;
      drawAmount(page17, bf.totalAmount, PROPERTY_TAX_COORDS.page17.barrierFreeTotalAmount, font);
      if (bf.subsidyAmount > 0) {
        drawAmount(page17, bf.subsidyAmount, PROPERTY_TAX_COORDS.page17.barrierFreeSubsidy, font);
      }
      drawAmount(page17, bf.deductibleAmount, PROPERTY_TAX_COORDS.page17.barrierFreeDeductible, font);
    }

    // =======================================
    // 18ページ目：省エネ改修の費用
    // =======================================
    if (certificate.energySaving) {
      const es = certificate.energySaving;
      drawAmount(page18, es.totalAmount, PROPERTY_TAX_COORDS.page18.energyTotalAmount, font);
      if (es.subsidyAmount > 0) {
        drawAmount(page18, es.subsidyAmount, PROPERTY_TAX_COORDS.page18.energySubsidy, font);
      }
      drawAmount(page18, es.deductibleAmount, PROPERTY_TAX_COORDS.page18.energyDeductible, font);

      if (es.hasSolarPower) {
        drawCheckmark(page18, PROPERTY_TAX_COORDS.page18.solarPowerYes, font);
      } else {
        drawCheckmark(page18, PROPERTY_TAX_COORDS.page18.solarPowerNo, font);
      }
    }

    // =======================================
    // 19ページ目：長期優良住宅化改修
    // =======================================
    if (certificate.longTermHousing) {
      const lt = certificate.longTermHousing;
      drawAmount(page19, lt.totalAmount, PROPERTY_TAX_COORDS.page19.longTermTotalAmount, font);
      if (lt.subsidyAmount > 0) {
        drawAmount(page19, lt.subsidyAmount, PROPERTY_TAX_COORDS.page19.longTermSubsidy, font);
      }
      drawAmount(page19, lt.deductibleAmount, PROPERTY_TAX_COORDS.page19.longTermDeductible, font);

      if (lt.isExcellentHousing) {
        drawCheckmark(page19, PROPERTY_TAX_COORDS.page19.excellentHousingYes, font);
      } else {
        drawCheckmark(page19, PROPERTY_TAX_COORDS.page19.excellentHousingNo, font);
      }
    }

    // =======================================
    // 20ページ目：工事内容の説明
    // =======================================
    if (certificate.workDescription) {
      const { drawMultilineText } = await import('./pdfTemplateUtils');
      drawMultilineText(page20, certificate.workDescription, PROPERTY_TAX_COORDS.page20.workDescription, font, {
        size: 8,
        lineHeight: 11,
        maxCharsPerLine: 70,
        minY: 100,
      });
    }

    // =======================================
    // 22ページ目：証明者情報（共通）
    // =======================================
    fillIssuerInfo(page22, certificate, font);

    return await savePdfToBuffer(pdfDoc);
  } catch (error) {
    console.error('固定資産税PDF生成エラー:', error);
    throw new Error('固定資産税減額用PDF生成に失敗しました: ' + (error as Error).message);
  }
}
