/**
 * 改修工事の控除額計算ユーティリティ
 *
 * Excel構造（001966731.xlsx）の計算ロジックを実装
 * 詳細: /docs/excel-structure-analysis.md
 */

/**
 * Decimal型の定義（Prisma Decimal互換）
 */
type Decimal = {
  toString(): string;
};

/**
 * 工事項目インターフェース
 */
export interface WorkItem {
  unitPrice: number;          // 単価
  quantity: number;           // 数量
  residentRatio?: number;     // 居住割合（0.0-1.0）
  windowAreaRatio?: number;   // 窓面積割合（省エネ改修用、0.0-1.0）
}

/**
 * 計算結果インターフェース
 */
export interface RenovationCalculation {
  totalCost: number;          // 合計工事費
  afterSubsidy: number;       // 補助金差引後
  deductibleAmount: number;   // 控除対象額（ウ）
  maxDeduction: number;       // 上限適用後の控除額（エ）
  excessAmount: number;       // 超過額（オ）
}

/**
 * 耐震改修の控除額を計算
 *
 * 参照: 耐震改修シート H26, H28
 * メイン証明書: Row 380-385
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @returns 計算結果
 */
export function calculateSeismicRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): RenovationCalculation {
  // 各工事項目の計算: 単位価格 × 数量 × 居住割合
  // Excel式: =IF(ISNUMBER(J8),C8*F8*J8,C8*F8)
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  // ア: 工事費総額
  // イ: 補助金額
  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  // 50万円超の場合のみ対象（seismic-work-types.tsと整合）
  const afterSubsidy = totalCost - subsidyAmount;
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ = MIN(ウ, 2,500,000): 250万円上限適用
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * バリアフリー改修の控除額を計算
 *
 * 参照: バリアフリー改修シート H51, H53
 * メイン証明書: Row 387-392
 *
 * **重要**: 50万円超の場合のみ控除対象
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @returns 計算結果
 */
export function calculateBarrierFreeRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): RenovationCalculation {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  // 50万円超の場合のみ対象
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ = MIN(ウ, 2,000,000): 200万円上限適用
  const maxDeduction = Math.min(deductibleAmount, 2_000_000);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * 省エネ改修の控除額を計算
 *
 * 参照: 省エネ改修シート J51, J53, F39
 * メイン証明書: Row 394-399
 *
 * **重要**:
 * - 50万円超の場合のみ控除対象
 * - 太陽光発電設備有りの場合、上限350万円（無しの場合250万円）
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @param hasSolarPanel 太陽光発電設備の有無
 * @returns 計算結果
 */
export function calculateEnergyRenovation(
  workItems: WorkItem[],
  subsidyAmount: number,
  hasSolarPanel: boolean = false
): RenovationCalculation {
  // 省エネ改修は窓面積割合も考慮
  // Excel式: =IF(AND(H9>0,L9>0),C9*F9*H9*L9,IF(ISNUMBER(H9),C9*F9*H9,IF(ISNUMBER(L9),C9*F9*L9,C9*F9)))
  const totalCost = workItems.reduce((sum, item) => {
    const residentRatio = item.residentRatio ?? 1.0;
    const windowRatio = item.windowAreaRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * residentRatio * windowRatio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  // 50万円超の場合のみ対象
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ: 太陽光有り=350万円、無し=250万円
  // Excel: =IF(ISNUMBER(省エネ改修!F39),IF(AQ397>=3500000,3500000,...),IF(AQ397>=2500000,2500000,...))
  const limit = hasSolarPanel ? 3_500_000 : 2_500_000;
  const maxDeduction = Math.min(deductibleAmount, limit);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * 同居対応改修の控除額を計算
 *
 * 参照: 同居対応シート G25, G27
 * メイン証明書: Row 401-406
 *
 * **重要**: 50万円超の場合のみ控除対象
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @returns 計算結果
 */
export function calculateCohabitationRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): RenovationCalculation {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ = MIN(ウ, 2,500,000): 250万円上限
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * 子育て対応改修の控除額を計算
 *
 * 参照: 子育て対応シート I59, I61
 * メイン証明書: Row 436-441
 *
 * **重要**: 50万円超の場合のみ控除対象
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @returns 計算結果
 */
export function calculateChildcareRenovation(
  workItems: WorkItem[],
  subsidyAmount: number
): RenovationCalculation {
  const totalCost = workItems.reduce((sum, item) => {
    const ratio = item.residentRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * ratio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ = MIN(ウ, 2,500,000): 250万円上限
  const maxDeduction = Math.min(deductibleAmount, 2_500_000);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * 長期優良住宅化改修の控除額を計算
 *
 * 参照:
 * - 長期優良住宅化（耐震又は省エネ）シート: Row 408-418
 * - 長期優良住宅化（耐震及び省エネ）シート: Row 424-434
 *
 * **重要**:
 * - 50万円超の場合のみ控除対象
 * - 「耐震又は省エネ」(OR): 太陽光無=250万円、太陽光有=350万円
 * - 「耐震及び省エネ」(AND): 太陽光無=500万円、太陽光有=600万円
 *
 * @param workItems 工事項目配列
 * @param subsidyAmount 補助金額
 * @param type 'or' = 耐震又は省エネ (⑤), 'and' = 耐震及び省エネ (⑥)
 * @param hasSolarPanel 太陽光発電設備の有無
 * @returns 計算結果
 */
export function calculateLongTermHousingRenovation(
  workItems: WorkItem[],
  subsidyAmount: number,
  type: 'or' | 'and' = 'or',
  hasSolarPanel: boolean = false
): RenovationCalculation {
  const totalCost = workItems.reduce((sum, item) => {
    const residentRatio = item.residentRatio ?? 1.0;
    const windowRatio = item.windowAreaRatio ?? 1.0;
    const amount = item.unitPrice * item.quantity * residentRatio * windowRatio;
    return sum + amount;
  }, 0);

  const afterSubsidy = totalCost - subsidyAmount;

  // ウ = (ア-イ > 500,000) ? ア-イ : 0
  // 50万円超の場合のみ対象
  const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

  // エ: 上限額はtype×太陽光の組み合わせで決定
  // OR(耐震又は省エネ): 太陽光無=250万円、太陽光有=350万円
  // AND(耐震及び省エネ): 太陽光無=500万円、太陽光有=600万円
  let limit: number;
  if (type === 'or') {
    limit = hasSolarPanel ? 3_500_000 : 2_500_000;
  } else {
    limit = hasSolarPanel ? 6_000_000 : 5_000_000;
  }
  const maxDeduction = Math.min(deductibleAmount, limit);

  // オ = ウ - エ: 超過額
  const excessAmount = Math.max(0, deductibleAmount - maxDeduction);

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * その他増改築の控除額を計算
 *
 * 参照: その他増改築シート L39, L41
 * メイン証明書: Row 455-458
 *
 * @param totalCost 工事費総額（ユーザー直接入力）
 * @param subsidyAmount 補助金額
 * @returns 計算結果
 */
export function calculateOtherRenovation(
  totalCost: number,
  subsidyAmount: number
): RenovationCalculation {
  const afterSubsidy = totalCost - subsidyAmount;

  // ⑳ウ = ⑳ア - ⑳イ
  const deductibleAmount = Math.max(0, afterSubsidy);

  // その他増改築に固有の上限はないため、maxDeduction = deductibleAmount
  const maxDeduction = deductibleAmount;
  const excessAmount = 0;

  return {
    totalCost: Math.round(totalCost),
    afterSubsidy: Math.round(afterSubsidy),
    deductibleAmount: Math.round(deductibleAmount),
    maxDeduction: Math.round(maxDeduction),
    excessAmount: Math.round(excessAmount),
  };
}

/**
 * 複数制度の最適な組み合わせを計算
 *
 * 参照: メイン証明書シート Row 442-460
 *
 * 複数の減税制度を組み合わせた場合の最大控除額を算出します。
 * Excel上では3つのパターン（⑨、⑫、⑮）を比較し、最大値を採用します。
 *
 * @param renovations 各改修工事の計算結果
 * @returns 最適な組み合わせの計算結果
 */
export interface CombinedRenovations {
  seismic?: RenovationCalculation;
  barrierFree?: RenovationCalculation;
  energy?: RenovationCalculation;
  cohabitation?: RenovationCalculation;
  childcare?: RenovationCalculation;
  other?: RenovationCalculation;
  /** ⑤ 長期優良住宅化（耐震又は省エネ） */
  longTermHousingOr?: RenovationCalculation;
  /** ⑥ 長期優良住宅化（耐震及び省エネ） */
  longTermHousingAnd?: RenovationCalculation;
}

export interface OptimalCombinationResult {
  totalDeductible: number;         // ⑱ 最大工事費
  maxControlAmount: number;        // ⑰ 最大控除額（10%控除分）
  excessAmount: number;            // ⑲ 超過額
  remaining: number;               // ㉒ 残り控除可能額（1000万円 - ⑰）
  finalDeductible: number;         // ㉑ 最終控除対象額（⑱とその他増改築の合算）
  fivePercentDeductible: number;   // ㉓ 5%控除分 = MIN(㉑, ㉒)
}

export function calculateOptimalCombination(
  renovations: CombinedRenovations
): OptimalCombinationResult {
  // ========================================
  // パターン1: 全制度の合計（⑧、⑨、⑩）
  // ========================================

  // ⑧ = ①ウ + ②ウ + ③ウ + ④ウ + ⑦ウ: 全制度の控除対象額合計
  const pattern1_total =
    (renovations.seismic?.deductibleAmount ?? 0) +
    (renovations.barrierFree?.deductibleAmount ?? 0) +
    (renovations.energy?.deductibleAmount ?? 0) +
    (renovations.cohabitation?.deductibleAmount ?? 0) +
    (renovations.childcare?.deductibleAmount ?? 0);

  // ⑨ = ①エ + ②エ + ③エ + ④エ + ⑦エ: 全制度の上限適用後控除額合計
  const pattern1_max =
    (renovations.seismic?.maxDeduction ?? 0) +
    (renovations.barrierFree?.maxDeduction ?? 0) +
    (renovations.energy?.maxDeduction ?? 0) +
    (renovations.cohabitation?.maxDeduction ?? 0) +
    (renovations.childcare?.maxDeduction ?? 0);

  // ⑩ = ①オ + ②オ + ③オ + ④オ + ⑦オ: 全制度の超過額合計
  const pattern1_excess =
    (renovations.seismic?.excessAmount ?? 0) +
    (renovations.barrierFree?.excessAmount ?? 0) +
    (renovations.energy?.excessAmount ?? 0) +
    (renovations.cohabitation?.excessAmount ?? 0) +
    (renovations.childcare?.excessAmount ?? 0);

  // ========================================
  // パターン2: 長期優良住宅化OR（⑤）との組み合わせ（⑪、⑫、⑬）
  // Excel Row 445-447
  // ⑪ = ②ウ + ④ウ + ⑤ウ + ⑦ウ（バリアフリー + 同居対応 + 長期優良OR + 子育て）
  // ========================================

  const pattern2_total =
    (renovations.barrierFree?.deductibleAmount ?? 0) +
    (renovations.cohabitation?.deductibleAmount ?? 0) +
    (renovations.longTermHousingOr?.deductibleAmount ?? 0) +
    (renovations.childcare?.deductibleAmount ?? 0);

  const pattern2_max =
    (renovations.barrierFree?.maxDeduction ?? 0) +
    (renovations.cohabitation?.maxDeduction ?? 0) +
    (renovations.longTermHousingOr?.maxDeduction ?? 0) +
    (renovations.childcare?.maxDeduction ?? 0);

  const pattern2_excess =
    (renovations.barrierFree?.excessAmount ?? 0) +
    (renovations.cohabitation?.excessAmount ?? 0) +
    (renovations.longTermHousingOr?.excessAmount ?? 0) +
    (renovations.childcare?.excessAmount ?? 0);

  // ========================================
  // パターン3: 長期優良住宅化AND（⑥）との組み合わせ（⑭、⑮、⑯）
  // Excel Row 448-450
  // ⑭ = ②ウ + ④ウ + ⑥ウ + ⑦ウ（バリアフリー + 同居対応 + 長期優良AND + 子育て）
  // ========================================

  const pattern3_total =
    (renovations.barrierFree?.deductibleAmount ?? 0) +
    (renovations.cohabitation?.deductibleAmount ?? 0) +
    (renovations.longTermHousingAnd?.deductibleAmount ?? 0) +
    (renovations.childcare?.deductibleAmount ?? 0);

  const pattern3_max =
    (renovations.barrierFree?.maxDeduction ?? 0) +
    (renovations.cohabitation?.maxDeduction ?? 0) +
    (renovations.longTermHousingAnd?.maxDeduction ?? 0) +
    (renovations.childcare?.maxDeduction ?? 0);

  const pattern3_excess =
    (renovations.barrierFree?.excessAmount ?? 0) +
    (renovations.cohabitation?.excessAmount ?? 0) +
    (renovations.longTermHousingAnd?.excessAmount ?? 0) +
    (renovations.childcare?.excessAmount ?? 0);

  // ========================================
  // 最大値の選定（⑰、⑱、⑲）
  // ========================================

  // ⑰ = MAX(⑨, ⑫, ⑮): 最大控除額（10%控除分）
  let maxControlAmount = Math.max(pattern1_max, pattern2_max, pattern3_max);

  // ⑱ = MAX(⑧, ⑪, ⑭): 最大工事費
  const totalDeductible = Math.max(pattern1_total, pattern2_total, pattern3_total);

  // ⑲: ⑱に対応する超過額（⑱の金額に係る額＝⑱と同じパターンのオ）
  let excessAmount: number;
  if (totalDeductible === pattern3_total && pattern3_total > 0) {
    excessAmount = pattern3_excess;
  } else if (totalDeductible === pattern2_total && pattern2_total > 0) {
    excessAmount = pattern2_excess;
  } else {
    excessAmount = pattern1_excess;
  }

  // ========================================
  // その他増改築との合算（Row 455-460）
  // ========================================

  // ⑳ウ: その他増改築の控除対象額
  const otherDeductible = renovations.other?.deductibleAmount ?? 0;

  // ㉑: 5%控除の基礎額
  // 国税庁: B = (1)と(2)のいずれか低い金額
  //   (1) 控除対象限度額超過額(⑲) + その他工事費(⑳ウ)
  //   (2) 標準的な費用の額(⑱)
  // ただし公式記入例より、⑲+⑳ウ=0の場合は⑱を使用（5%控除の基礎 = 全額）
  let finalDeductible: number;
  if (totalDeductible <= 0) {
    finalDeductible = 0;
  } else if (excessAmount + otherDeductible > 0) {
    finalDeductible = Math.min(totalDeductible, excessAmount + otherDeductible);
  } else {
    // 超過なし＋その他なし → 全額が5%控除の基礎（公式記入例準拠）
    finalDeductible = totalDeductible;
  }

  // ========================================
  // 1,000万円上限適用
  // ========================================

  // ⑰は1,000万円が上限
  const TOTAL_LIMIT = 10_000_000;
  if (maxControlAmount > TOTAL_LIMIT) {
    maxControlAmount = TOTAL_LIMIT;
  }

  // ㉒ = MAX(0, 10,000,000 - ⑰): 残り控除可能額
  const remaining = Math.max(0, TOTAL_LIMIT - maxControlAmount);

  // ㉓ = MIN(㉑, ㉒): 5%控除分
  const fivePercentDeductible = Math.min(finalDeductible, remaining);

  return {
    totalDeductible: Math.round(totalDeductible),
    maxControlAmount: Math.round(maxControlAmount),
    excessAmount: Math.round(excessAmount),
    remaining: Math.round(remaining),
    finalDeductible: Math.round(finalDeductible),
    fivePercentDeductible: Math.round(fivePercentDeductible),
  };
}

/**
 * Decimal型をnumberに変換するヘルパー関数
 */
export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  return parseFloat(value.toString());
}
