/**
 * 住宅特定改修特別税額控除（投資型減税）用PDF生成器
 * 公式テンプレートPDFのセクションIII（ページ9-16）を使用
 *
 * テンプレート構造:
 *   ページ9-12 (pages[8]-[11]): (1)実施した工事の種別（チェックボックス）
 *   ページ13   (pages[12]):     (2)工事の内容 + (3)費用の額等 ①耐震 ②バリアフリー
 *   ページ14   (pages[13]):     (3)続き ③省エネ ④同居対応 ⑤長期優良(OR)
 *   ページ15   (pages[14]):     (3)続き ⑥長期優良(AND) ⑦子育て
 *   ページ16   (pages[15]):     ⑧-⑲パターン比較 + ⑳その他 + ㉑㉒㉓最終
 *
 * 座標: PyMuPDF実測値をpdf-lib座標系（左下原点）に変換済み
 * 変換式: pdf-lib_y = 842 - pymupdf_y_bottom
 */

import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  drawCheckmark,
  drawAmount,
  drawText,
  drawMultilineText,
  savePdfToBytes,
  type CertificateBaseData,
} from './pdfTemplateUtils';

/**
 * 工事費用の共通データ
 */
interface WorkCostData {
  totalAmount: number;      // ア: 工事費総額
  subsidyAmount: number;    // イ: 補助金額
  deductibleAmount: number; // ウ: 補助金差引後（閾値適用後）
  maxDeduction: number;     // エ: 上限適用後の控除額
  excessAmount: number;     // オ: 超過額
}

/**
 * 住宅特定改修特別税額控除用の追加データ
 */
export interface ReformTaxData extends CertificateBaseData {
  /** ① 耐震改修 */
  seismic?: WorkCostData;
  /** ② バリアフリー改修 */
  barrierFree?: WorkCostData;
  /** ③ 省エネ改修 */
  energySaving?: WorkCostData & { hasSolarPower: boolean };
  /** ④ 同居対応改修 */
  cohabitation?: WorkCostData;
  /** ⑤ 長期優良住宅化（耐震又は省エネ） */
  longTermHousingOr?: WorkCostData;
  /** ⑥ 長期優良住宅化（耐震及び省エネ） */
  longTermHousingAnd?: WorkCostData & { isExcellentHousing: boolean };
  /** ⑦ 子育て対応改修 */
  childcare?: WorkCostData;
  /** ⑳ その他増改築等 */
  otherRenovation?: WorkCostData;
  /** 工事の説明 */
  workDescription?: string;
}

/**
 * PyMuPDF実測座標（pdf-lib左下原点系に変換済み）
 *
 * 金額値の x=420 は「円」マーカー(x≈490)の左側に配置。
 * チェックボックスの座標はテンプレートの「□有」「□無」テキスト位置に合わせる。
 */
const REFORM_TAX_COORDS = {
  // ===== ページ13 (pages[12]): (2)工事の内容 + (3)費用 ①耐震 ②バリアフリー =====
  page13: {
    // (2) 実施した工事の内容（テキスト記入欄）
    workDescription: { x: 63, y: 750 },
    // ① 住宅耐震改修
    seismicTotal:      { x: 420, y: 373.0 },  // ア
    seismicSubsidyYes: { x: 427, y: 352.6 },  // イ 有
    seismicSubsidyNo:  { x: 462, y: 352.6 },  // イ 無
    seismicSubsidy:    { x: 420, y: 333.1 },  // イ 補助金額
    seismicDeductible: { x: 420, y: 313.2 },  // ウ
    seismicMax:        { x: 420, y: 293.3 },  // エ
    seismicExcess:     { x: 420, y: 273.4 },  // オ
    // ② 高齢者等居住改修工事等（バリアフリー）
    bfTotal:      { x: 420, y: 233.5 },  // ア
    bfSubsidyYes: { x: 427, y: 213.1 },  // イ 有
    bfSubsidyNo:  { x: 462, y: 213.1 },  // イ 無
    bfSubsidy:    { x: 420, y: 193.7 },  // イ 補助金額
    bfDeductible: { x: 420, y: 173.7 },  // ウ
    bfMax:        { x: 420, y: 153.8 },  // エ
    bfExcess:     { x: 420, y: 133.9 },  // オ
  },
  // ===== ページ14 (pages[13]): ③省エネ ④同居対応 ⑤長期優良(OR) =====
  page14: {
    // ③ 一般断熱改修工事等（省エネ）
    energyTotal:      { x: 420, y: 750.7 },  // ア
    energySubsidyYes: { x: 427, y: 730.3 },  // イ 有
    energySubsidyNo:  { x: 462, y: 730.3 },  // イ 無
    energySubsidy:    { x: 420, y: 710.8 },  // イ 補助金額
    energyDeductible: { x: 420, y: 690.9 },  // ウ
    energyMax:        { x: 420, y: 664.4 },  // エ
    energyExcess:     { x: 420, y: 637.7 },  // オ
    // ④ 多世帯同居改修工事等
    coTotal:      { x: 420, y: 597.9 },  // ア
    coSubsidyYes: { x: 427, y: 577.5 },  // イ 有
    coSubsidyNo:  { x: 462, y: 577.5 },  // イ 無
    coSubsidy:    { x: 420, y: 558.1 },  // イ 補助金額
    coDeductible: { x: 420, y: 538.1 },  // ウ
    coMax:        { x: 420, y: 518.2 },  // エ
    coExcess:     { x: 420, y: 498.3 },  // オ
    // ⑤ 耐久性向上改修工事等（耐震又は省エネと併せて行う場合）
    // サブ構造: ア→イ→ウ(耐震/省エネ部分) + エ→オ→カ(耐久性部分) → キ(合計) → ク(上限) → ケ(超過)
    ltOrTotal:         { x: 420, y: 438.9 },  // ア (base cost)
    ltOrSubsidyYes:    { x: 427, y: 405.0 },  // イ 有
    ltOrSubsidyNo:     { x: 462, y: 405.0 },  // イ 無
    ltOrSubsidy:       { x: 420, y: 379.0 },  // イ 補助金額
    ltOrBaseDeductible:{ x: 420, y: 359.1 },  // ウ (base deductible)
    ltOrCombined:      { x: 420, y: 259.5 },  // キ (combined deductible)
    ltOrMax:           { x: 420, y: 232.9 },  // ク (max deduction)
    ltOrExcess:        { x: 420, y: 206.3 },  // ケ (excess)
  },
  // ===== ページ15 (pages[14]): ⑥長期優良(AND) ⑦子育て =====
  page15: {
    // ⑥ 耐久性向上改修工事等（耐震及び省エネの両方と併せて行う場合）
    // サブ構造: ア→イ→ウ(耐震) + エ→オ→カ(省エネ) + キ→ク→ケ(耐久性) → コ(合計) → サ(上限) → シ(超過)
    ltAndTotal:         { x: 420, y: 750.7 },  // ア (seismic cost)
    ltAndSubsidyYes:    { x: 427, y: 730.3 },  // イ 有
    ltAndSubsidyNo:     { x: 462, y: 730.3 },  // イ 無
    ltAndSubsidy:       { x: 420, y: 710.8 },  // イ 補助金額
    ltAndBaseDeductible:{ x: 420, y: 690.9 },  // ウ (seismic deductible)
    ltAndCombined:      { x: 420, y: 511.6 },  // コ (combined deductible)
    ltAndMax:           { x: 420, y: 488.3 },  // サ (max deduction)
    ltAndExcess:        { x: 420, y: 465.0 },  // シ (excess)
    // ⑦ 子育て対応改修工事等
    ccTotal:      { x: 420, y: 425.2 },  // ア
    ccSubsidyYes: { x: 427, y: 404.8 },  // イ 有
    ccSubsidyNo:  { x: 462, y: 404.8 },  // イ 無
    ccSubsidy:    { x: 420, y: 385.3 },  // イ 補助金額
    ccDeductible: { x: 420, y: 365.4 },  // ウ
    ccMax:        { x: 420, y: 345.5 },  // エ
    ccExcess:     { x: 420, y: 325.6 },  // オ
  },
  // ===== ページ16 (pages[15]): ⑧-⑲パターン比較 + ⑳その他 + ㉑㉒㉓最終 =====
  page16: {
    // パターン1: ⑧⑨⑩
    p1Total:  { x: 420, y: 770.6 },  // ⑧
    p1Max:    { x: 420, y: 750.7 },  // ⑨
    p1Excess: { x: 420, y: 730.8 },  // ⑩
    // パターン2: ⑪⑫⑬
    p2Total:  { x: 420, y: 710.8 },  // ⑪
    p2Max:    { x: 420, y: 690.9 },  // ⑫
    p2Excess: { x: 420, y: 671.0 },  // ⑬
    // パターン3: ⑭⑮⑯
    p3Total:  { x: 420, y: 651.1 },  // ⑭
    p3Max:    { x: 420, y: 631.1 },  // ⑮
    p3Excess: { x: 420, y: 611.2 },  // ⑯
    // 最大値: ⑰⑱⑲
    maxControl:  { x: 420, y: 591.3 },  // ⑰
    maxWorkCost: { x: 420, y: 571.4 },  // ⑱
    maxExcess:   { x: 420, y: 551.4 },  // ⑲
    // ⑳ その他増改築等
    otherTotal:      { x: 420, y: 508.2 },  // ⑳ア
    otherSubsidyYes: { x: 427, y: 484.5 },  // ⑳イ 有
    otherSubsidyNo:  { x: 462, y: 484.5 },  // ⑳イ 無
    otherSubsidy:    { x: 420, y: 465.0 },  // ⑳イ 補助金額
    otherDeductible: { x: 420, y: 445.1 },  // ⑳ウ
    // 最終計算
    finalDeductible: { x: 420, y: 425.2 },  // ㉑
    remaining:       { x: 420, y: 405.5 },  // ㉒
    fivePercent:     { x: 420, y: 385.9 },  // ㉓
  },
} as const;

/**
 * 複合計算を行い結果を返す
 */
function calculateCombined(data: ReformTaxData) {
  // パターン1: ①+②+③+④+⑦
  const p1Total =
    (data.seismic?.deductibleAmount ?? 0) +
    (data.barrierFree?.deductibleAmount ?? 0) +
    (data.energySaving?.deductibleAmount ?? 0) +
    (data.cohabitation?.deductibleAmount ?? 0) +
    (data.childcare?.deductibleAmount ?? 0);
  const p1Max =
    (data.seismic?.maxDeduction ?? 0) +
    (data.barrierFree?.maxDeduction ?? 0) +
    (data.energySaving?.maxDeduction ?? 0) +
    (data.cohabitation?.maxDeduction ?? 0) +
    (data.childcare?.maxDeduction ?? 0);
  const p1Excess =
    (data.seismic?.excessAmount ?? 0) +
    (data.barrierFree?.excessAmount ?? 0) +
    (data.energySaving?.excessAmount ?? 0) +
    (data.cohabitation?.excessAmount ?? 0) +
    (data.childcare?.excessAmount ?? 0);

  // パターン2: ②+④+⑤+⑦
  const p2Total =
    (data.barrierFree?.deductibleAmount ?? 0) +
    (data.cohabitation?.deductibleAmount ?? 0) +
    (data.longTermHousingOr?.deductibleAmount ?? 0) +
    (data.childcare?.deductibleAmount ?? 0);
  const p2Max =
    (data.barrierFree?.maxDeduction ?? 0) +
    (data.cohabitation?.maxDeduction ?? 0) +
    (data.longTermHousingOr?.maxDeduction ?? 0) +
    (data.childcare?.maxDeduction ?? 0);
  const p2Excess =
    (data.barrierFree?.excessAmount ?? 0) +
    (data.cohabitation?.excessAmount ?? 0) +
    (data.longTermHousingOr?.excessAmount ?? 0) +
    (data.childcare?.excessAmount ?? 0);

  // パターン3: ②+④+⑥+⑦
  const p3Total =
    (data.barrierFree?.deductibleAmount ?? 0) +
    (data.cohabitation?.deductibleAmount ?? 0) +
    (data.longTermHousingAnd?.deductibleAmount ?? 0) +
    (data.childcare?.deductibleAmount ?? 0);
  const p3Max =
    (data.barrierFree?.maxDeduction ?? 0) +
    (data.cohabitation?.maxDeduction ?? 0) +
    (data.longTermHousingAnd?.maxDeduction ?? 0) +
    (data.childcare?.maxDeduction ?? 0);
  const p3Excess =
    (data.barrierFree?.excessAmount ?? 0) +
    (data.cohabitation?.excessAmount ?? 0) +
    (data.longTermHousingAnd?.excessAmount ?? 0) +
    (data.childcare?.excessAmount ?? 0);

  // 最大値選定
  let maxControl = Math.max(p1Max, p2Max, p3Max);
  const maxWorkCost = Math.max(p1Total, p2Total, p3Total);

  // ⑲: ⑱に対応するパターンの超過額（⑱の金額に係る額）
  let maxExcess: number;
  if (maxWorkCost === p3Total && p3Total > 0) {
    maxExcess = p3Excess;
  } else if (maxWorkCost === p2Total && p2Total > 0) {
    maxExcess = p2Excess;
  } else {
    maxExcess = p1Excess;
  }

  // 1000万円上限
  const TOTAL_LIMIT = 10_000_000;
  if (maxControl > TOTAL_LIMIT) maxControl = TOTAL_LIMIT;
  const remaining = Math.max(0, TOTAL_LIMIT - maxControl);

  // その他増改築との合算
  const otherDeductible = data.otherRenovation?.deductibleAmount ?? 0;

  // ㉑: 5%控除の基礎額（公式記入例準拠）
  let finalDeductible: number;
  if (maxWorkCost <= 0) {
    finalDeductible = 0;
  } else if (maxExcess + otherDeductible > 0) {
    finalDeductible = Math.min(maxWorkCost, maxExcess + otherDeductible);
  } else {
    finalDeductible = maxWorkCost;
  }

  // ㉓ = MIN(㉑, ㉒): 5%控除分
  const fivePercentDeductible = Math.min(finalDeductible, remaining);

  return {
    p1Total, p1Max, p1Excess,
    p2Total, p2Max, p2Excess,
    p3Total, p3Max, p3Excess,
    maxControl, maxWorkCost, maxExcess,
    finalDeductible, remaining, fivePercentDeductible,
  };
}

/**
 * 住宅特定改修特別税額控除（投資型減税）用PDF生成
 */
export async function generateReformTaxPDF(
  data: ReformTaxData
): Promise<Uint8Array> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1  = pages[0];   // 基本情報
    const page13 = pages[12];  // (2)工事の内容 + (3)①耐震 ②バリアフリー
    const page14 = pages[13];  // (3)③省エネ ④同居対応 ⑤長期優良(OR)
    const page15 = pages[14];  // (3)⑥長期優良(AND) ⑦子育て
    const page16 = pages[15];  // ⑧-⑲パターン比較 + ⑳その他 + ㉑㉒㉓最終
    const page22 = pages[21];  // 証明者情報

    // =======================================
    // 1ページ目：基本情報（共通）
    // =======================================
    fillBasicInfo(page1, data, font);

    // =======================================
    // 13ページ目：(2)工事の内容 + (3)費用 ①耐震 ②バリアフリー
    // =======================================

    // (2) 工事の内容
    if (data.workDescription) {
      drawMultilineText(page13, data.workDescription, REFORM_TAX_COORDS.page13.workDescription, font, {
        size: 8,
        lineHeight: 11,
        maxCharsPerLine: 70,
        minY: 420,  // (3)セクション開始位置の上で止める
      });
    }

    // ① 住宅耐震改修
    if (data.seismic) {
      const s = data.seismic;
      drawAmount(page13, s.totalAmount, REFORM_TAX_COORDS.page13.seismicTotal, font);
      if (s.subsidyAmount > 0) {
        drawCheckmark(page13, REFORM_TAX_COORDS.page13.seismicSubsidyYes, font);
        drawAmount(page13, s.subsidyAmount, REFORM_TAX_COORDS.page13.seismicSubsidy, font);
      } else {
        drawCheckmark(page13, REFORM_TAX_COORDS.page13.seismicSubsidyNo, font);
      }
      drawAmount(page13, s.deductibleAmount, REFORM_TAX_COORDS.page13.seismicDeductible, font);
      drawAmount(page13, s.maxDeduction, REFORM_TAX_COORDS.page13.seismicMax, font);
      if (s.excessAmount > 0) drawAmount(page13, s.excessAmount, REFORM_TAX_COORDS.page13.seismicExcess, font);
    }

    // ② バリアフリー改修
    if (data.barrierFree) {
      const bf = data.barrierFree;
      drawAmount(page13, bf.totalAmount, REFORM_TAX_COORDS.page13.bfTotal, font);
      if (bf.subsidyAmount > 0) {
        drawCheckmark(page13, REFORM_TAX_COORDS.page13.bfSubsidyYes, font);
        drawAmount(page13, bf.subsidyAmount, REFORM_TAX_COORDS.page13.bfSubsidy, font);
      } else {
        drawCheckmark(page13, REFORM_TAX_COORDS.page13.bfSubsidyNo, font);
      }
      drawAmount(page13, bf.deductibleAmount, REFORM_TAX_COORDS.page13.bfDeductible, font);
      drawAmount(page13, bf.maxDeduction, REFORM_TAX_COORDS.page13.bfMax, font);
      if (bf.excessAmount > 0) drawAmount(page13, bf.excessAmount, REFORM_TAX_COORDS.page13.bfExcess, font);
    }

    // =======================================
    // 14ページ目：③省エネ ④同居対応 ⑤長期優良(OR)
    // =======================================

    // ③ 省エネ改修
    if (data.energySaving) {
      const es = data.energySaving;
      drawAmount(page14, es.totalAmount, REFORM_TAX_COORDS.page14.energyTotal, font);
      if (es.subsidyAmount > 0) {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.energySubsidyYes, font);
        drawAmount(page14, es.subsidyAmount, REFORM_TAX_COORDS.page14.energySubsidy, font);
      } else {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.energySubsidyNo, font);
      }
      drawAmount(page14, es.deductibleAmount, REFORM_TAX_COORDS.page14.energyDeductible, font);
      drawAmount(page14, es.maxDeduction, REFORM_TAX_COORDS.page14.energyMax, font);
      if (es.excessAmount > 0) drawAmount(page14, es.excessAmount, REFORM_TAX_COORDS.page14.energyExcess, font);
    }

    // ④ 同居対応改修
    if (data.cohabitation) {
      const co = data.cohabitation;
      drawAmount(page14, co.totalAmount, REFORM_TAX_COORDS.page14.coTotal, font);
      if (co.subsidyAmount > 0) {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.coSubsidyYes, font);
        drawAmount(page14, co.subsidyAmount, REFORM_TAX_COORDS.page14.coSubsidy, font);
      } else {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.coSubsidyNo, font);
      }
      drawAmount(page14, co.deductibleAmount, REFORM_TAX_COORDS.page14.coDeductible, font);
      drawAmount(page14, co.maxDeduction, REFORM_TAX_COORDS.page14.coMax, font);
      if (co.excessAmount > 0) drawAmount(page14, co.excessAmount, REFORM_TAX_COORDS.page14.coExcess, font);
    }

    // ⑤ 長期優良(OR): 簡略化マッピング（totalAmount→ア, deductible→キ, max→ク, excess→ケ）
    if (data.longTermHousingOr) {
      const lt = data.longTermHousingOr;
      drawAmount(page14, lt.totalAmount, REFORM_TAX_COORDS.page14.ltOrTotal, font);
      if (lt.subsidyAmount > 0) {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.ltOrSubsidyYes, font);
        drawAmount(page14, lt.subsidyAmount, REFORM_TAX_COORDS.page14.ltOrSubsidy, font);
      } else {
        drawCheckmark(page14, REFORM_TAX_COORDS.page14.ltOrSubsidyNo, font);
      }
      // ウ: base deductible（サブ分離なしの場合はdeductibleAmountをウに記入）
      drawAmount(page14, lt.deductibleAmount, REFORM_TAX_COORDS.page14.ltOrBaseDeductible, font);
      // キ: 合計控除対象額（サブ分離なしの場合はウ=キ）
      drawAmount(page14, lt.deductibleAmount, REFORM_TAX_COORDS.page14.ltOrCombined, font);
      // ク: 上限適用後
      drawAmount(page14, lt.maxDeduction, REFORM_TAX_COORDS.page14.ltOrMax, font);
      // ケ: 超過額
      if (lt.excessAmount > 0) drawAmount(page14, lt.excessAmount, REFORM_TAX_COORDS.page14.ltOrExcess, font);
    }

    // =======================================
    // 15ページ目：⑥長期優良(AND) ⑦子育て
    // =======================================

    // ⑥ 長期優良(AND): 簡略化マッピング（totalAmount→ア, deductible→コ, max→サ, excess→シ）
    if (data.longTermHousingAnd) {
      const lt = data.longTermHousingAnd;
      drawAmount(page15, lt.totalAmount, REFORM_TAX_COORDS.page15.ltAndTotal, font);
      if (lt.subsidyAmount > 0) {
        drawCheckmark(page15, REFORM_TAX_COORDS.page15.ltAndSubsidyYes, font);
        drawAmount(page15, lt.subsidyAmount, REFORM_TAX_COORDS.page15.ltAndSubsidy, font);
      } else {
        drawCheckmark(page15, REFORM_TAX_COORDS.page15.ltAndSubsidyNo, font);
      }
      // ウ: base deductible
      drawAmount(page15, lt.deductibleAmount, REFORM_TAX_COORDS.page15.ltAndBaseDeductible, font);
      // コ: 合計控除対象額（サブ分離なしの場合はウ=コ）
      drawAmount(page15, lt.deductibleAmount, REFORM_TAX_COORDS.page15.ltAndCombined, font);
      // サ: 上限適用後
      drawAmount(page15, lt.maxDeduction, REFORM_TAX_COORDS.page15.ltAndMax, font);
      // シ: 超過額
      if (lt.excessAmount > 0) drawAmount(page15, lt.excessAmount, REFORM_TAX_COORDS.page15.ltAndExcess, font);
    }

    // ⑦ 子育て対応改修
    if (data.childcare) {
      const cc = data.childcare;
      drawAmount(page15, cc.totalAmount, REFORM_TAX_COORDS.page15.ccTotal, font);
      if (cc.subsidyAmount > 0) {
        drawCheckmark(page15, REFORM_TAX_COORDS.page15.ccSubsidyYes, font);
        drawAmount(page15, cc.subsidyAmount, REFORM_TAX_COORDS.page15.ccSubsidy, font);
      } else {
        drawCheckmark(page15, REFORM_TAX_COORDS.page15.ccSubsidyNo, font);
      }
      drawAmount(page15, cc.deductibleAmount, REFORM_TAX_COORDS.page15.ccDeductible, font);
      drawAmount(page15, cc.maxDeduction, REFORM_TAX_COORDS.page15.ccMax, font);
      if (cc.excessAmount > 0) drawAmount(page15, cc.excessAmount, REFORM_TAX_COORDS.page15.ccExcess, font);
    }

    // =======================================
    // 16ページ目：⑧-⑲パターン比較 + ⑳その他 + ㉑㉒㉓最終
    // =======================================
    const combined = calculateCombined(data);

    // パターン1: ⑧⑨⑩
    if (combined.p1Total > 0 || combined.p1Max > 0) {
      drawAmount(page16, combined.p1Total, REFORM_TAX_COORDS.page16.p1Total, font);
      drawAmount(page16, combined.p1Max, REFORM_TAX_COORDS.page16.p1Max, font);
      if (combined.p1Excess > 0) drawAmount(page16, combined.p1Excess, REFORM_TAX_COORDS.page16.p1Excess, font);
    }

    // パターン2: ⑪⑫⑬
    if (combined.p2Total > 0 || combined.p2Max > 0) {
      drawAmount(page16, combined.p2Total, REFORM_TAX_COORDS.page16.p2Total, font);
      drawAmount(page16, combined.p2Max, REFORM_TAX_COORDS.page16.p2Max, font);
      if (combined.p2Excess > 0) drawAmount(page16, combined.p2Excess, REFORM_TAX_COORDS.page16.p2Excess, font);
    }

    // パターン3: ⑭⑮⑯
    if (combined.p3Total > 0 || combined.p3Max > 0) {
      drawAmount(page16, combined.p3Total, REFORM_TAX_COORDS.page16.p3Total, font);
      drawAmount(page16, combined.p3Max, REFORM_TAX_COORDS.page16.p3Max, font);
      if (combined.p3Excess > 0) drawAmount(page16, combined.p3Excess, REFORM_TAX_COORDS.page16.p3Excess, font);
    }

    // 最大値: ⑰⑱⑲
    if (combined.maxControl > 0 || combined.maxWorkCost > 0) {
      drawAmount(page16, combined.maxControl, REFORM_TAX_COORDS.page16.maxControl, font);
      drawAmount(page16, combined.maxWorkCost, REFORM_TAX_COORDS.page16.maxWorkCost, font);
      if (combined.maxExcess > 0) drawAmount(page16, combined.maxExcess, REFORM_TAX_COORDS.page16.maxExcess, font);
    }

    // ⑳ その他増改築等
    if (data.otherRenovation) {
      const ot = data.otherRenovation;
      drawAmount(page16, ot.totalAmount, REFORM_TAX_COORDS.page16.otherTotal, font);
      if (ot.subsidyAmount > 0) {
        drawCheckmark(page16, REFORM_TAX_COORDS.page16.otherSubsidyYes, font);
        drawAmount(page16, ot.subsidyAmount, REFORM_TAX_COORDS.page16.otherSubsidy, font);
      } else {
        drawCheckmark(page16, REFORM_TAX_COORDS.page16.otherSubsidyNo, font);
      }
      drawAmount(page16, ot.deductibleAmount, REFORM_TAX_COORDS.page16.otherDeductible, font);
    }

    // ㉑ 最終控除対象額
    if (combined.finalDeductible > 0) {
      drawAmount(page16, combined.finalDeductible, REFORM_TAX_COORDS.page16.finalDeductible, font);
    }

    // ㉒ 残り控除可能枠
    drawAmount(page16, combined.remaining, REFORM_TAX_COORDS.page16.remaining, font);

    // ㉓ 5%控除分
    if (combined.fivePercentDeductible > 0) {
      drawAmount(page16, combined.fivePercentDeductible, REFORM_TAX_COORDS.page16.fivePercent, font);
    }

    // =======================================
    // 22ページ目：証明者情報（共通）
    // =======================================
    fillIssuerInfo(page22, data, font);

    return await savePdfToBytes(pdfDoc);
  } catch (error) {
    console.error('投資型減税PDF生成エラー:', error);
    throw new Error('住宅特定改修特別税額控除用PDF生成に失敗しました: ' + (error as Error).message);
  }
}
