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
  // 台所
  {
    code: 'cohab_kitchen',
    name: '台所の設置工事',
    unitPrice: 476100,
    unit: '箇所',
    category: '台所',
    description: '調理のために使用する流し又は加熱調理器を設置する工事',
  },

  // 浴室
  {
    code: 'cohab_bathroom',
    name: '浴室の設置工事',
    unitPrice: 1283400,
    unit: '箇所',
    category: '浴室',
    description: '浴室を設置する工事',
  },

  // 便所
  {
    code: 'cohab_toilet',
    name: '便所の設置工事',
    unitPrice: 476100,
    unit: '箇所',
    category: '便所',
    description: '便所を設置する工事',
  },

  // 玄関
  {
    code: 'cohab_entrance',
    name: '玄関の設置工事',
    unitPrice: 476100,
    unit: '箇所',
    category: '玄関',
    description: '玄関を設置する工事',
  },

  // 給水設備
  {
    code: 'cohab_water_supply_general',
    name: '給水のための設備（一般的な場合）',
    unitPrice: 193300,
    unit: '箇所',
    category: '給排水設備',
    description: '給水のための設備を設置する工事（一般的な場合）',
  },
  {
    code: 'cohab_water_supply_difficult',
    name: '給水のための設備（工事が困難な場合）',
    unitPrice: 514200,
    unit: '箇所',
    category: '給排水設備',
    description: '給水のための設備を設置する工事（工事が著しく困難な場合）',
  },

  // 排水設備
  {
    code: 'cohab_drainage_general',
    name: '排水のための設備（一般的な場合）',
    unitPrice: 148900,
    unit: '箇所',
    category: '給排水設備',
    description: '排水のための設備を設置する工事（一般的な場合）',
  },
  {
    code: 'cohab_drainage_difficult',
    name: '排水のための設備（工事が困難な場合）',
    unitPrice: 1622000,
    unit: '箇所',
    category: '給排水設備',
    description: '排水のための設備を設置する工事（工事が著しく困難な場合）',
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
