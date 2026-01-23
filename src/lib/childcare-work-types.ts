// 子育て対応改修工事の標準単価マスターデータ

export type ChildcareWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category: string;
  description: string;
};

export const CHILDCARE_WORK_TYPES: ChildcareWorkType[] = [
  // 家事負担軽減設備
  {
    code: 'childcare_dishwasher',
    name: 'ビルトイン食器洗機',
    unitPrice: 85800,
    unit: '台',
    category: '家事負担軽減',
    description: '家事の負担を軽減するためのビルトイン食器洗機',
  },
  {
    code: 'childcare_garbage_disposal',
    name: 'ディスポーザー',
    unitPrice: 104500,
    unit: '台',
    category: '家事負担軽減',
    description: '家事の負担を軽減するためのディスポーザー',
  },
  {
    code: 'childcare_bathroom_dryer',
    name: '浴室乾燥機',
    unitPrice: 142900,
    unit: '台',
    category: '家事負担軽減',
    description: '家事の負担を軽減するための浴室乾燥機',
  },
  {
    code: 'childcare_built_in_cooktop',
    name: 'ビルトインコンロ',
    unitPrice: 85800,
    unit: '台',
    category: '家事負担軽減',
    description: '家事の負担を軽減するためのビルトインコンロ',
  },
  {
    code: 'childcare_range_hood',
    name: 'レンジフード',
    unitPrice: 75900,
    unit: '台',
    category: '家事負担軽減',
    description: '家事の負担を軽減するためのレンジフード',
  },
  {
    code: 'childcare_system_cabinet',
    name: 'システムキャビネット',
    unitPrice: 275000,
    unit: '㎡',
    category: '家事負担軽減',
    description: '家事の負担を軽減するためのシステムキャビネット',
  },

  // 事故防止設備
  {
    code: 'childcare_intercom',
    name: 'インターホン',
    unitPrice: 60500,
    unit: '箇所',
    category: '事故防止',
    description: '事故の防止に資するインターホン',
  },
  {
    code: 'childcare_door_guard',
    name: 'ドアガード等',
    unitPrice: 18700,
    unit: '箇所',
    category: '事故防止',
    description: '事故の防止に資するドアガード等',
  },
  {
    code: 'childcare_auto_lock_door',
    name: '自動施錠装置付きドア',
    unitPrice: 112200,
    unit: '箇所',
    category: '事故防止',
    description: '事故の防止に資する自動施錠装置付きドア',
  },
  {
    code: 'childcare_floor_heating',
    name: '床暖房',
    unitPrice: 49500,
    unit: '㎡',
    category: '事故防止',
    description: '事故の防止に資する床暖房',
  },
  {
    code: 'childcare_fall_prevention_fence',
    name: '転落防止柵',
    unitPrice: 35200,
    unit: 'm',
    category: '事故防止',
    description: '事故の防止に資する転落防止柵',
  },
  {
    code: 'childcare_fall_prevention_window',
    name: '転落防止手すり付き窓',
    unitPrice: 66000,
    unit: '㎡',
    category: '事故防止',
    description: '事故の防止に資する転落防止手すり付き窓',
  },
  {
    code: 'childcare_emergency_call',
    name: '緊急呼出設備',
    unitPrice: 93500,
    unit: '箇所',
    category: '事故防止',
    description: '事故の防止に資する緊急呼出設備',
  },

  // 収納設備
  {
    code: 'childcare_wall_closet',
    name: '壁面等に設けたクロゼット',
    unitPrice: 62700,
    unit: '㎡',
    category: '収納',
    description: '壁面等に設けたクロゼット',
  },
  {
    code: 'childcare_loft_storage',
    name: '小屋裏収納',
    unitPrice: 83600,
    unit: '㎡',
    category: '収納',
    description: '小屋裏収納',
  },
  {
    code: 'childcare_underfloor_storage',
    name: '床下収納',
    unitPrice: 49500,
    unit: '㎡',
    category: '収納',
    description: '床下収納',
  },

  // 居室等
  {
    code: 'childcare_children_room',
    name: '子供部屋',
    unitPrice: 275000,
    unit: '㎡',
    category: '居室',
    description: '子供部屋（子供1人につき1室、6畳まで）',
  },
  {
    code: 'childcare_playroom',
    name: 'プレイルーム',
    unitPrice: 275000,
    unit: '㎡',
    category: '居室',
    description: 'プレイルーム',
  },
  {
    code: 'childcare_study_space',
    name: '勉強スペース',
    unitPrice: 275000,
    unit: '㎡',
    category: '居室',
    description: '勉強スペース',
  },
  {
    code: 'childcare_family_room',
    name: '家族が団らんできるスペース',
    unitPrice: 275000,
    unit: '㎡',
    category: '居室',
    description: '家族が団らんできるスペース',
  },

  // その他
  {
    code: 'childcare_pet_door',
    name: 'ペットドア',
    unitPrice: 22000,
    unit: '箇所',
    category: 'その他',
    description: 'ペットドア',
  },
  {
    code: 'childcare_soundproof_indoor',
    name: '防音室内ドア',
    unitPrice: 132000,
    unit: '箇所',
    category: 'その他',
    description: '防音室内ドア',
  },
  {
    code: 'childcare_soundproof_floor',
    name: '防音床',
    unitPrice: 74800,
    unit: '㎡',
    category: 'その他',
    description: '防音床',
  },
  {
    code: 'childcare_soundproof_wall',
    name: '防音壁',
    unitPrice: 165000,
    unit: '㎡',
    category: 'その他',
    description: '防音壁',
  },
  {
    code: 'childcare_lighting',
    name: '調光・調色機能付き照明設備',
    unitPrice: 11000,
    unit: '箇所',
    category: 'その他',
    description: '調光・調色機能付き照明設備',
  },
];

/**
 * 子育て対応改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量
 * @param residentRatio 居住用割合（0-100、必要な場合のみ）
 * @returns 計算金額
 */
export function calculateChildcareAmount(
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
 * 子育て対応改修工事の合計金額を計算
 */
export function calculateChildcareTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    residentRatio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateChildcareAmount(
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
export function calculateChildcareDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0
): number {
  const afterSubsidy = totalAmount - subsidyAmount;

  // 子育て対応改修の上限は250万円
  const CHILDCARE_LIMIT = 2500000;

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, CHILDCARE_LIMIT);
}

/**
 * カテゴリ別に工事種別を取得
 */
export function getChildcareWorkTypesByCategory(): Map<string, ChildcareWorkType[]> {
  const categoryMap = new Map<string, ChildcareWorkType[]>();

  CHILDCARE_WORK_TYPES.forEach((workType) => {
    const existing = categoryMap.get(workType.category) || [];
    existing.push(workType);
    categoryMap.set(workType.category, existing);
  });

  return categoryMap;
}
