/**
 * 証明書の工事費用計算サービス
 *
 * 各工事種別の費用を集計し、補助金控除後の金額を計算する
 */

import { HOUSING_LOAN_MINIMUM_COST } from './workTypeMapping';

export interface WorkData {
  seismic?: Array<{ calculatedAmount: number }>;
  barrierFree?: Array<{ calculatedAmount: number }>;
  energySaving?: Array<{ calculatedAmount: number }>;
  cohabitation?: Array<{ calculatedAmount: number }>;
  childcare?: Array<{ calculatedAmount: number }>;
  otherRenovation?: Array<{ calculatedAmount: number }>;
  longTermHousing?: Array<{ calculatedAmount: number }>;
}

export interface CostCalculationResult {
  /** 第1号工事（耐震改修）合計 */
  seismicTotal: number;
  /** 第2号工事（バリアフリー改修）合計 */
  barrierFreeTotal: number;
  /** 第3号工事（省エネ改修）合計 */
  energySavingTotal: number;
  /** 第4号工事（同居対応改修）合計 */
  cohabitationTotal: number;
  /** 第5号工事（長期優良住宅化改修）合計 */
  longTermHousingTotal: number;
  /** 第6号工事（その他増改築等）合計 */
  otherRenovationTotal: number;
  /** 第6号工事（子育て対応改修）合計 */
  childcareTotal: number;
  /** 全工事の合計金額（補助金控除前） */
  totalWorkCost: number;
  /** 補助金額 */
  subsidyAmount: number;
  /** 控除対象額（補助金控除後） */
  deductibleAmount: number;
  /** 住宅借入金等特別控除の要件を満たすか（100万円以上） */
  meetsHousingLoanRequirement: boolean;
}

/**
 * 工事配列の合計金額を計算
 */
function calculateWorkArrayTotal(works?: Array<{ calculatedAmount: number }>): number {
  if (!works || works.length === 0) {
    return 0;
  }
  return works.reduce((sum, work) => sum + work.calculatedAmount, 0);
}

/**
 * 証明書の工事費用を計算
 *
 * @param works - 各工事種別のデータ
 * @param subsidyAmount - 補助金額
 * @returns 計算結果
 */
export function calculateCertificateCost(
  works: WorkData,
  subsidyAmount: number = 0
): CostCalculationResult {
  // 各工事種別の合計を計算
  const seismicTotal = calculateWorkArrayTotal(works.seismic);
  const barrierFreeTotal = calculateWorkArrayTotal(works.barrierFree);
  const energySavingTotal = calculateWorkArrayTotal(works.energySaving);
  const cohabitationTotal = calculateWorkArrayTotal(works.cohabitation);
  const childcareTotal = calculateWorkArrayTotal(works.childcare);
  const otherRenovationTotal = calculateWorkArrayTotal(works.otherRenovation);
  const longTermHousingTotal = calculateWorkArrayTotal(works.longTermHousing);

  // 全工事の合計
  const totalWorkCost =
    seismicTotal +
    barrierFreeTotal +
    energySavingTotal +
    cohabitationTotal +
    childcareTotal +
    otherRenovationTotal +
    longTermHousingTotal;

  // 控除対象額（補助金控除後）
  const deductibleAmount = Math.max(0, totalWorkCost - subsidyAmount);

  // 住宅借入金等特別控除の要件チェック（100万円以上）
  const meetsHousingLoanRequirement = deductibleAmount >= HOUSING_LOAN_MINIMUM_COST;

  return {
    seismicTotal,
    barrierFreeTotal,
    energySavingTotal,
    cohabitationTotal,
    longTermHousingTotal,
    otherRenovationTotal,
    childcareTotal,
    totalWorkCost,
    subsidyAmount,
    deductibleAmount,
    meetsHousingLoanRequirement,
  };
}

/**
 * 工事種別ごとの詳細を取得（第1号〜第6号分類）
 *
 * @param calculation - 計算結果
 * @returns 工事種別ごとの詳細情報
 */
export function getWorkTypeBreakdown(calculation: CostCalculationResult) {
  return [
    {
      classification: '第1号工事',
      classificationNumber: 1,
      label: '耐震改修工事',
      amount: calculation.seismicTotal,
      hasWork: calculation.seismicTotal > 0,
    },
    {
      classification: '第2号工事',
      classificationNumber: 2,
      label: 'バリアフリー改修工事',
      amount: calculation.barrierFreeTotal,
      hasWork: calculation.barrierFreeTotal > 0,
    },
    {
      classification: '第3号工事',
      classificationNumber: 3,
      label: '省エネ改修工事',
      amount: calculation.energySavingTotal,
      hasWork: calculation.energySavingTotal > 0,
    },
    {
      classification: '第4号工事',
      classificationNumber: 4,
      label: '同居対応改修工事',
      amount: calculation.cohabitationTotal,
      hasWork: calculation.cohabitationTotal > 0,
    },
    {
      classification: '第5号工事',
      classificationNumber: 5,
      label: '長期優良住宅化改修工事',
      amount: calculation.longTermHousingTotal,
      hasWork: calculation.longTermHousingTotal > 0,
    },
    {
      classification: '第6号工事',
      classificationNumber: 6,
      label: 'その他の増改築等工事',
      amount: calculation.otherRenovationTotal + calculation.childcareTotal,
      hasWork: calculation.otherRenovationTotal > 0 || calculation.childcareTotal > 0,
      subItems: [
        {
          label: 'その他増改築等',
          amount: calculation.otherRenovationTotal,
        },
        {
          label: '子育て対応改修',
          amount: calculation.childcareTotal,
        },
      ],
    },
  ];
}

/**
 * 住宅借入金等特別控除の適用チェック
 *
 * @param calculation - 計算結果
 * @returns エラーメッセージ（適用可能な場合はnull）
 */
export function validateHousingLoanEligibility(
  calculation: CostCalculationResult
): string | null {
  if (calculation.totalWorkCost === 0) {
    return '工事費用が入力されていません。';
  }

  if (!calculation.meetsHousingLoanRequirement) {
    return `住宅借入金等特別控除を適用するには、補助金控除後の工事費用が${(
      HOUSING_LOAN_MINIMUM_COST / 10000
    ).toLocaleString()}万円以上である必要があります。現在の控除対象額: ${(
      calculation.deductibleAmount / 10000
    ).toLocaleString()}万円`;
  }

  return null;
}

/**
 * 金額を万円単位で表示
 *
 * @param amount - 金額（円）
 * @returns 万円単位の文字列（例: "120万円"）
 */
export function formatAmountInManYen(amount: number): string {
  const manYen = amount / 10000;
  return `${manYen.toLocaleString()}万円`;
}

/**
 * 金額を円単位で表示
 *
 * @param amount - 金額（円）
 * @returns 円単位の文字列（例: "1,200,000円"）
 */
export function formatAmountInYen(amount: number): string {
  return `${amount.toLocaleString()}円`;
}
