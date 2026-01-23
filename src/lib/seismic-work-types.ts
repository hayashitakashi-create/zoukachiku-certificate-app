// 耐震改修工事の標準単価マスターデータ

export type SeismicWorkType = {
  code: string;
  name: string;
  unitPrice: number; // 円
  unit: string; // 単位（㎡、箇所など）
  housingType: 'wood' | 'non-wood'; // 木造 or 木造以外
  description: string;
};

export const SEISMIC_WORK_TYPES: SeismicWorkType[] = [
  // 木造住宅
  {
    code: 'seismic_wood_foundation',
    name: '木造住宅：基礎に係る耐震改修',
    unitPrice: 15400,
    unit: '㎡',
    housingType: 'wood',
    description: '当該家屋の建築面積（㎡）',
  },
  {
    code: 'seismic_wood_wall',
    name: '木造住宅：壁に係る耐震改修',
    unitPrice: 22500,
    unit: '㎡',
    housingType: 'wood',
    description: '当該家屋の床面積（㎡）',
  },
  {
    code: 'seismic_wood_roof',
    name: '木造住宅：屋根に係る耐震改修',
    unitPrice: 19300,
    unit: '㎡',
    housingType: 'wood',
    description: '当該耐震改修の施工面積（㎡）',
  },
  {
    code: 'seismic_wood_other',
    name: '木造住宅：基礎、壁又は屋根に係るもの以外の耐震改修',
    unitPrice: 33000,
    unit: '㎡',
    housingType: 'wood',
    description: '当該家屋の床面積（㎡）',
  },

  // 木造住宅以外
  {
    code: 'seismic_nonwood_wall',
    name: '木造住宅以外：壁に係る耐震改修',
    unitPrice: 75500,
    unit: '㎡',
    housingType: 'non-wood',
    description: '当該家屋の床面積（㎡）',
  },
  {
    code: 'seismic_nonwood_column_wrap',
    name: '木造住宅以外：柱に係る耐震改修（柱巻補強工事）',
    unitPrice: 1434500,
    unit: '箇所',
    housingType: 'non-wood',
    description: '鉄板その他の補強材を柱に巻きつける工事の箇所数',
  },
  {
    code: 'seismic_nonwood_column_other',
    name: '木造住宅以外：柱に係る耐震改修（柱巻補強工事以外）',
    unitPrice: 33100,
    unit: '箇所',
    housingType: 'non-wood',
    description: '当該耐震改修の箇所数',
  },
  {
    code: 'seismic_nonwood_seismic_isolation',
    name: '木造住宅以外：免震工事',
    unitPrice: 591500,
    unit: '箇所',
    housingType: 'non-wood',
    description: '当該耐震改修の箇所数',
  },
  {
    code: 'seismic_nonwood_other',
    name: '木造住宅以外：壁若しくは柱に係るもの又は免震工事以外の耐震改修',
    unitPrice: 20700,
    unit: '㎡',
    housingType: 'non-wood',
    description: '当該家屋の床面積（㎡）',
  },
];

/**
 * 耐震改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量
 * @param ratio 割合（0-100、マンションの場合のみ使用）
 * @returns 計算金額
 */
export function calculateSeismicAmount(
  unitPrice: number,
  quantity: number,
  ratio?: number
): number {
  if (ratio !== undefined && ratio !== null && ratio > 0) {
    // 割合が指定されている場合（マンション等）
    return Math.round(unitPrice * quantity * (ratio / 100));
  }
  // 通常の計算
  return Math.round(unitPrice * quantity);
}

/**
 * 耐震改修工事の合計金額を計算
 * @param works 工事データの配列
 * @returns 合計金額
 */
export function calculateSeismicTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    ratio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateSeismicAmount(work.unitPrice, work.quantity, work.ratio);
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、最大250万円）
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @returns 控除対象額
 */
export function calculateDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0
): number {
  const afterSubsidy = totalAmount - subsidyAmount;
  const SEISMIC_LIMIT = 2500000; // 耐震改修の上限：250万円

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, SEISMIC_LIMIT);
}
