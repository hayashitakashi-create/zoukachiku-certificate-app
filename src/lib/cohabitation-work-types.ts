// 同居対応改修工事の標準単価マスターデータ

export type CohabitationWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category: string;
  description: string;
};

export const COHABITATION_WORK_TYPES: CohabitationWorkType[] = [
  // 調理室増設
  {
    code: 'cohab_kitchen_full',
    name: '調理室増設（ミニキッチン以外のキッチンの設置）',
    unitPrice: 1622000,
    unit: '箇所',
    category: '調理室',
    description: 'ミニキッチン以外のキッチンを設置する調理室増設工事',
  },
  {
    code: 'cohab_kitchen_mini',
    name: '調理室増設（ミニキッチンの設置）',
    unitPrice: 476100,
    unit: '箇所',
    category: '調理室',
    description: 'ミニキッチンを設置する調理室増設工事',
  },

  // 浴室増設
  {
    code: 'cohab_bath_with_heater',
    name: '浴室増設（給湯設備の設置又は取替えを伴う浴槽の設置）',
    unitPrice: 1373800,
    unit: '箇所',
    category: '浴室',
    description: '給湯設備の設置又は取替えを伴う浴槽を設置する浴室増設工事',
  },
  {
    code: 'cohab_bath_without_heater',
    name: '浴室増設（給湯設備の設置又は取替えを伴わない浴槽の設置）',
    unitPrice: 855400,
    unit: '箇所',
    category: '浴室',
    description: '給湯設備の設置又は取替えを伴わない浴槽を設置する浴室増設工事',
  },
  {
    code: 'cohab_bath_shower_only',
    name: '浴室増設（浴槽がないシャワー専用の設備の設置）',
    unitPrice: 584100,
    unit: '箇所',
    category: '浴室',
    description: '浴槽がないシャワー専用の設備を設置する浴室増設工事',
  },

  // 便所の増設
  {
    code: 'cohab_toilet',
    name: '便所の増設',
    unitPrice: 526200,
    unit: '箇所',
    category: '便所',
    description: '便所を増設する工事',
  },

  // 玄関の増設
  {
    code: 'cohab_entrance_ground',
    name: '玄関の増設（地上階にあるもの）',
    unitPrice: 658700,
    unit: '箇所',
    category: '玄関',
    description: '地上階にある玄関を増設する工事',
  },
  {
    code: 'cohab_entrance_other',
    name: '玄関の増設（地上階にあるもの以外）',
    unitPrice: 1254100,
    unit: '箇所',
    category: '玄関',
    description: '地上階にあるもの以外の玄関を増設する工事',
  },
];

/**
 * 同居対応改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量（箇所数）
 * @param residentRatio 居住用割合（0-100、必要な場合のみ）
 * @returns 計算金額
 */
export function calculateCohabitationAmount(
  unitPrice: number,
  quantity: number,
  residentRatio?: number
): number {
  let amount = unitPrice * quantity;

  // 居住用割合を適用
  if (residentRatio !== undefined && residentRatio !== null && residentRatio > 0) {
    amount = amount * (residentRatio / 100);
  }

  return Math.round(amount);
}

/**
 * 同居対応改修工事の合計金額を計算
 */
export function calculateCohabitationTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    residentRatio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateCohabitationAmount(
      work.unitPrice,
      work.quantity,
      work.residentRatio
    );
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、最大250万円）
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @returns 控除対象額
 */
export function calculateCohabitationDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0
): number {
  const afterSubsidy = totalAmount - subsidyAmount;

  // 同居対応改修の上限は250万円
  const COHABITATION_LIMIT = 2500000;

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, COHABITATION_LIMIT);
}

/**
 * カテゴリ別に工事種別を取得
 */
export function getCohabitationWorkTypesByCategory(): Map<string, CohabitationWorkType[]> {
  const categoryMap = new Map<string, CohabitationWorkType[]>();

  COHABITATION_WORK_TYPES.forEach((workType) => {
    const existing = categoryMap.get(workType.category) || [];
    existing.push(workType);
    categoryMap.set(workType.category, existing);
  });

  return categoryMap;
}
