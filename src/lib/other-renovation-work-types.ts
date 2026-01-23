// その他増改築等工事のカテゴリマスターデータ
// ※この工事種別は標準単価方式ではなく、直接金額を入力する方式

export type OtherRenovationCategory = {
  code: string;
  name: string;
  description: string;
};

export const OTHER_RENOVATION_CATEGORIES: OtherRenovationCategory[] = [
  {
    code: 'other_large_repair',
    name: '大規模な修繕',
    description: '家屋の主要構造部の一つ以上について行う大規模な修繕',
  },
  {
    code: 'other_large_remodel',
    name: '大規模な模様替え',
    description: '家屋の主要構造部の一つ以上について行う大規模な模様替え',
  },
  {
    code: 'other_extension',
    name: '増築',
    description: '家屋の床面積を増加させる増築工事',
  },
  {
    code: 'other_renovation',
    name: 'その他の増改築',
    description: 'その他の増改築等の工事',
  },
  {
    code: 'other_durability',
    name: '耐久性向上改修',
    description: '家屋の耐久性を向上させる改修工事',
  },
  {
    code: 'other_energy_custom',
    name: '省エネ性能向上改修（標準単価以外）',
    description: '標準単価法以外による省エネルギー性能向上のための改修工事',
  },
];

/**
 * その他増改築工事の金額を計算
 * @param amount 工事金額（直接入力）
 * @param residentRatio 居住用割合（0-100、必要な場合のみ）
 * @returns 計算金額
 */
export function calculateOtherRenovationAmount(
  amount: number,
  residentRatio?: number
): number {
  let calculatedAmount = amount;

  // 居住用割合を適用
  if (residentRatio !== undefined && residentRatio !== null && residentRatio > 0) {
    calculatedAmount = calculatedAmount * (residentRatio / 100);
  }

  return Math.round(calculatedAmount);
}

/**
 * その他増改築工事の合計金額を計算
 */
export function calculateOtherRenovationTotal(
  works: Array<{
    amount: number;
    residentRatio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateOtherRenovationAmount(
      work.amount,
      work.residentRatio
    );
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、上限なし）
 * ※その他増改築は住宅借入金等特別控除の対象であり、控除対象額の上限は設定されていない
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @returns 控除対象額
 */
export function calculateOtherRenovationDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0
): number {
  const afterSubsidy = totalAmount - subsidyAmount;

  // その他増改築は最低金額要件がないため、そのまま返す
  return Math.max(afterSubsidy, 0);
}

/**
 * カテゴリ別の工事一覧を取得（参照用）
 */
export function getOtherRenovationCategories(): OtherRenovationCategory[] {
  return OTHER_RENOVATION_CATEGORIES;
}
