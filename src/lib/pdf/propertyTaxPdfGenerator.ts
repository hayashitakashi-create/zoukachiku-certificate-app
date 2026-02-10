/**
 * 固定資産税減額用PDF生成器（ブラウザ対応版）
 * 公式テンプレートPDFのセクションIV（ページ20-21 = pages[19]-pages[20]）を使用
 *
 * テンプレート構造:
 *   P20 (pages[19]):
 *     1-1: 耐震改修 → 工事の内容 + 工事種別(増築/改築/修繕/模様替) + 費用(全体工事費, 耐震改修費)
 *     1-2: 耐震改修→認定長期優良住宅 → 認定番号等
 *     2:   熱損失防止改修(省エネ) → 工事種別チェックボックス(□1-□9) + 工事の内容
 *   P21 (pages[20]):
 *     省エネ費用詳細（全体工事費, ア断熱改修費, イ補助金有無, ウ補助金額, ①差引額,
 *                     エ設備工事費, オ設備補助金有無, カ設備補助金額, ②設備差引額）
 *     工事費用確認（③①>60万 or ④①>50万かつ①+②>60万）
 *     認定長期優良住宅 → 認定番号等
 *
 * ※ テンプレートに「バリアフリー」セクションは存在しない
 *    固定資産税の減額対象は耐震改修と熱損失防止改修(省エネ)のみ
 *
 * 座標系: pdf-lib 左下原点、A4 = 595pt x 842pt
 * 座標は PyMuPDF による実測値
 */

import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  drawText,
  drawCheckmark,
  drawAmount,
  drawMultilineText,
  savePdfToBytes,
  type CertificateBaseData,
  type Coord,
} from './pdfTemplateUtils';

/**
 * 固定資産税減額用の追加データ
 */
export interface PropertyTaxData extends CertificateBaseData {
  /** 耐震改修の情報 */
  seismic?: {
    totalAmount: number;       // 全体工事費（耐震含む全工事）
    subsidyAmount: number;     // 補助金
    deductibleAmount: number;  // 耐震改修費（= totalAmount - subsidyAmount）
  };
  /** バリアフリー改修の情報（テンプレートに該当セクションなし、データ受取のみ） */
  barrierFree?: {
    totalAmount: number;
    subsidyAmount: number;
    deductibleAmount: number;
  };
  /** 省エネ改修の情報 */
  energySaving?: {
    totalAmount: number;       // 全体工事費
    subsidyAmount: number;     // 補助金
    deductibleAmount: number;  // 控除対象額
    hasSolarPower: boolean;    // 太陽光発電設備
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
 * 固定資産税減額用のページ座標（PyMuPDF実測値）
 *
 * P20 = pages[19], P21 = pages[20]
 */
const PROPERTY_TAX_COORDS = {
  // ===== P20 (pages[19]): 耐震改修 + 省エネ工事種別 =====
  page20: {
    // --- 1-1: 耐震改修 ---
    // 工事の内容（自由記述エリア y: 694.3-754.2, x: 97.0-505.8）
    seismicWorkDescription: { x: 100, y: 740 },
    // 工事種別チェック（□増築/改築/修繕/模様替  y: 627.3-656.6）
    seismicWorkType1: { x: 93, y: 631 },    // □１ 増築
    seismicWorkType2: { x: 156, y: 631 },   // □２ 改築
    seismicWorkType3: { x: 218, y: 631 },   // □３ 修繕
    seismicWorkType4: { x: 280, y: 631 },   // □４ 模様替
    // 費用（入力列: x=379.6-505.8）
    seismicTotalCost: { x: 420, y: 544 },   // 全体工事費（cell: 534.2-554.1）
    seismicCost: { x: 420, y: 527 },        // 耐震改修費（cell: 514.3-534.2）

    // --- 1-2: 認定長期優良住宅（耐震改修path） ---
    seismicLtCertAuthority: { x: 358, y: 504 }, // 認定主体（cell: 494.4-514.3）
    seismicLtCertNumber: { x: 400, y: 484 },    // 認定番号（cell: 474.4-494.4）
    seismicLtCertDate: { x: 400, y: 464 },      // 認定年月日（cell: 454.5-474.4）

    // --- 2: 熱損失防止改修（省エネ）工事種別チェック ---
    // 必須: 窓の断熱性を高める改修工事（テキストのみ、チェック不要）
    // 任意チェック（x=231.3, □の位置）
    energyType1: { x: 231, y: 359 },   // □１ 天井等の断熱性
    energyType2: { x: 231, y: 330 },   // □２ 壁の断熱性
    energyType3: { x: 231, y: 301 },   // □３ 床等の断熱性
    energyType4: { x: 231, y: 278 },   // □４ 太陽熱利用冷温熱装置
    energyType5: { x: 231, y: 260 },   // □５ 潜熱回収型給湯器
    energyType6: { x: 231, y: 242 },   // □６ ヒートポンプ式電気給湯器
    energyType7: { x: 231, y: 228 },   // □７ 燃料電池コージェネレーション
    energyType8: { x: 231, y: 204 },   // □８ エアコンディショナー
    energyType9: { x: 231, y: 186 },   // □９ 太陽光発電設備

    // 省エネ工事の内容（自由記述エリア y: 110.5-181.5, x: 131.8-505.8）
    energyWorkDescription: { x: 135, y: 170 },
  },

  // ===== P21 (pages[20]): 省エネ費用詳細 =====
  page21: {
    // 全体工事費（cell: 763.7-784.2）
    totalCost: { x: 420, y: 774 },
    // ア 断熱改修工事費（cell: 722.6-743.2）
    insulationCost: { x: 420, y: 733 },
    // イ 補助金有無（cell: 702.1-722.6）
    insulationSubsidyYes: { x: 404, y: 712 },
    insulationSubsidyNo: { x: 461, y: 712 },
    // ウ 補助金額（cell: 681.6-702.1）
    insulationSubsidy: { x: 420, y: 692 },
    // ① 差引額（cell: 661.1-681.6）
    deductible1: { x: 420, y: 671 },
    // エ 設備工事費（cell: 630.1-661.1）
    equipmentCost: { x: 420, y: 645 },
    // オ 設備補助金有無（cell: 609.6-630.1）
    equipmentSubsidyYes: { x: 404, y: 620 },
    equipmentSubsidyNo: { x: 461, y: 620 },
    // カ 設備補助金額（cell: 589.1-609.6）
    equipmentSubsidy: { x: 420, y: 599 },
    // ② 設備差引額（cell: 568.5-589.1）
    deductible2: { x: 420, y: 579 },
    // ③ ①が60万超（cell: 527.5-548.0）
    costCheck3: { x: 404, y: 538 },
    // ④ ①>50万かつ①+②>60万（cell: 493.1-527.5）
    costCheck4: { x: 404, y: 510 },
    // 認定長期優良住宅（省エネpath）
    energyLtCertAuthority: { x: 381, y: 462 },  // 認定主体（cell: 452.1-472.6）
    energyLtCertNumber: { x: 418, y: 442 },     // 認定番号（cell: 431.6-452.1）
    energyLtCertDate: { x: 418, y: 421 },       // 認定年月日（cell: 411.1-431.6）
  },
} as const;

/**
 * 固定資産税減額用PDF生成（ブラウザ対応版）
 */
export async function generatePropertyTaxPDF(
  certificate: PropertyTaxData
): Promise<Uint8Array> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1 = pages[0];     // 基本情報
    const page20 = pages[19];   // 固定資産税 セクションIV（耐震 + 省エネ工事種別）
    const page21 = pages[20];   // 省エネ費用詳細 + 認定長期優良
    const page22 = pages[21];   // 証明者情報

    // =======================================
    // 1ページ目：基本情報の記入（共通）
    // =======================================
    fillBasicInfo(page1, certificate, font);

    // =======================================
    // P20（pages[19]）：耐震改修の費用
    // =======================================
    const p20 = PROPERTY_TAX_COORDS.page20;

    if (certificate.seismic) {
      const s = certificate.seismic;
      // 全体工事費（耐震を含む全工事の費用）
      drawAmount(page20, s.totalAmount, p20.seismicTotalCost, font);
      // 耐震改修の費用（補助金差引後）
      drawAmount(page20, s.deductibleAmount, p20.seismicCost, font);
    }

    // バリアフリーはテンプレートに該当セクションが存在しないため出力不可
    if (certificate.barrierFree) {
      console.warn('固定資産税テンプレートにバリアフリー改修セクションはありません。データは出力されません。');
    }

    // =======================================
    // P20（pages[19]）：省エネ工事種別チェック
    // =======================================
    if (certificate.energySaving) {
      // 太陽光発電設備がある場合、□9にチェック
      if (certificate.energySaving.hasSolarPower) {
        drawCheckmark(page20, p20.energyType9, font);
      }
    }

    // =======================================
    // P21（pages[20]）：省エネ改修の費用詳細
    // =======================================
    if (certificate.energySaving) {
      const es = certificate.energySaving;
      const p21 = PROPERTY_TAX_COORDS.page21;

      // 全体工事費
      drawAmount(page21, es.totalAmount, p21.totalCost, font);

      // ア 断熱改修工事費（＝総額を断熱改修費として記入）
      drawAmount(page21, es.totalAmount, p21.insulationCost, font);

      // イ 補助金有無
      if (es.subsidyAmount > 0) {
        drawCheckmark(page21, p21.insulationSubsidyYes, font);
        // ウ 補助金額
        drawAmount(page21, es.subsidyAmount, p21.insulationSubsidy, font);
      } else {
        drawCheckmark(page21, p21.insulationSubsidyNo, font);
      }

      // ① 差引額（＝ア - ウ）
      drawAmount(page21, es.deductibleAmount, p21.deductible1, font);

      // エ～② 設備工事費（現データモデルでは分離できないため、無に設定）
      drawCheckmark(page21, p21.equipmentSubsidyNo, font);

      // ③④ 工事費用確認
      if (es.deductibleAmount > 600000) {
        // ①が60万円を超える → ③にチェック
        drawCheckmark(page21, p21.costCheck3, font);
      } else if (es.deductibleAmount > 500000) {
        // ①が50万超かつ合計60万超 → ④にチェック
        drawCheckmark(page21, p21.costCheck4, font);
      }
    }

    // =======================================
    // 長期優良住宅化の認定情報
    // =======================================
    if (certificate.longTermHousing?.isExcellentHousing) {
      // 省エネpathの認定情報欄に記入
      // （実際の認定番号等はデータモデルに含まれないため、認定済みのマークのみ）
    }

    // =======================================
    // 工事内容の説明
    // =======================================
    if (certificate.workDescription) {
      drawMultilineText(page20, certificate.workDescription, p20.seismicWorkDescription, font, {
        size: 7,
        lineHeight: 10,
        maxCharsPerLine: 55,
        minY: 700,
      });
    }

    // =======================================
    // 22ページ目：証明者情報（共通）
    // =======================================
    fillIssuerInfo(page22, certificate, font);

    return await savePdfToBytes(pdfDoc);
  } catch (error) {
    console.error('固定資産税PDF生成エラー:', error);
    throw new Error('固定資産税減額用PDF生成に失敗しました: ' + (error as Error).message);
  }
}
