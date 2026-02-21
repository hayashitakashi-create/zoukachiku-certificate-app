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
  // カテゴリ1: 子どもの事故を防止するための工事
  {
    code: 'childcare_round_corner',
    name: '壁又は柱の出隅を丸みのあるものに改良する工事',
    unitPrice: 11000,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: '壁又は柱の出隅を丸みのあるものに改良する工事',
  },
  {
    code: 'childcare_cushion_floor',
    name: '床をクッションフロアに取り替える工事',
    unitPrice: 7000,
    unit: '㎡',
    category: '子どもの事故を防止するための工事',
    description: '床をクッションフロアに取り替える工事',
  },
  {
    code: 'childcare_shock_absorbing_tatami',
    name: '衝撃緩和型畳床に取り替える工事',
    unitPrice: 8300,
    unit: '㎡',
    category: '子どもの事故を防止するための工事',
    description: '衝撃緩和型畳床に取り替える工事',
  },
  {
    code: 'childcare_balcony_railing',
    name: 'バルコニーの手すり子の取付工事',
    unitPrice: 13500,
    unit: 'm',
    category: '子どもの事故を防止するための工事',
    description: 'バルコニーの手すり子の取付工事',
  },
  {
    code: 'childcare_window_railing',
    name: '二階以上の窓の手すりの取付工事',
    unitPrice: 20300,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: '二階以上の窓の手すりの取付工事',
  },
  {
    code: 'childcare_corridor_stair_handrail',
    name: '廊下又は階段の手すりの取付工事',
    unitPrice: 36300,
    unit: 'm',
    category: '子どもの事故を防止するための工事',
    description: '廊下又は階段の手すりの取付工事',
  },
  {
    code: 'childcare_door_finger_guard',
    name: '室内ドアの指の挟み込み防止措置工事',
    unitPrice: 104500,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: '室内ドアの指の挟み込み防止措置工事',
  },
  {
    code: 'childcare_child_fence_prefab',
    name: 'チャイルドフェンスの設置工事（既製品の取付け）',
    unitPrice: 15000,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: 'チャイルドフェンスの設置工事（既製品の取付け）',
  },
  {
    code: 'childcare_child_fence_custom',
    name: 'チャイルドフェンスの設置工事（造作工事）',
    unitPrice: 115000,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: 'チャイルドフェンスの設置工事（造作工事）',
  },
  {
    code: 'childcare_shutter_outlet',
    name: 'シャッター付きコンセントへの取替工事',
    unitPrice: 4000,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: 'シャッター付きコンセントへの取替工事',
  },
  {
    code: 'childcare_outlet_height_change',
    name: 'コンセントの高さの変更工事',
    unitPrice: 7100,
    unit: '箇所',
    category: '子どもの事故を防止するための工事',
    description: 'コンセントの高さの変更工事',
  },

  // カテゴリ2: 対面式キッチンへの交換工事
  {
    code: 'childcare_open_kitchen',
    name: '対面式キッチンへの交換工事',
    unitPrice: 1477200,
    unit: '箇所',
    category: '対面式キッチンへの交換工事',
    description: '対面式キッチンへの交換工事',
  },

  // カテゴリ3: 開口部の防犯性を高める工事
  {
    code: 'childcare_security_door',
    name: '防犯性のある玄関ドアへの取替工事',
    unitPrice: 396500,
    unit: '箇所',
    category: '開口部の防犯性を高める工事',
    description: '防犯性のある玄関ドアへの取替工事',
  },
  {
    code: 'childcare_security_sash_glass',
    name: '防犯性のあるサッシ及びガラスへの取替工事',
    unitPrice: 57400,
    unit: '㎡',
    category: '開口部の防犯性を高める工事',
    description: '防犯性のあるサッシ及びガラスへの取替工事',
  },
  {
    code: 'childcare_security_grille',
    name: '面格子の取付工事',
    unitPrice: 55400,
    unit: '箇所',
    category: '開口部の防犯性を高める工事',
    description: '面格子の取付工事',
  },

  // カテゴリ4: 収納設備を増設する工事
  {
    code: 'childcare_storage_addition',
    name: '棚等の収納設備を増設する工事',
    unitPrice: 163900,
    unit: '㎡',
    category: '収納設備を増設する工事',
    description: '棚等の収納設備を増設する工事',
  },

  // カテゴリ5: 開口部・界壁・界床の防音性を高める工事
  {
    code: 'childcare_soundproof_window',
    name: '窓の防音性を高める工事',
    unitPrice: 52400,
    unit: '㎡',
    category: '開口部・界壁・界床の防音性を高める工事',
    description: '窓の防音性を高める工事',
  },
  {
    code: 'childcare_soundproof_party_wall',
    name: '界壁の防音性を高める工事',
    unitPrice: 17400,
    unit: '㎡',
    category: '開口部・界壁・界床の防音性を高める工事',
    description: '界壁の防音性を高める工事',
  },
  {
    code: 'childcare_soundproof_party_floor',
    name: '界床の防音性を高める工事',
    unitPrice: 39900,
    unit: '㎡',
    category: '開口部・界壁・界床の防音性を高める工事',
    description: '界床の防音性を高める工事',
  },

  // カテゴリ6: 間取り変更工事
  {
    code: 'childcare_partition_only',
    name: '間仕切壁の設置又は解体のみを行う工事',
    unitPrice: 159400,
    unit: '箇所',
    category: '間取り変更工事',
    description: '間仕切壁の設置又は解体のみを行う工事',
  },
  {
    code: 'childcare_partition_with_renovation',
    name: '間仕切壁の設置又は解体以外の修繕又は模様替えを行う工事',
    unitPrice: 26800,
    unit: '㎡',
    category: '間取り変更工事',
    description: '間仕切壁の設置又は解体以外の修繕又は模様替えを行う工事',
  },
  {
    code: 'childcare_kitchen_relocation',
    name: '上記に伴う調理室の位置の変更',
    unitPrice: 1346900,
    unit: '式',
    category: '間取り変更工事',
    description: '上記に伴う調理室の位置の変更',
  },
  {
    code: 'childcare_bathroom_relocation',
    name: '上記に伴う浴室の位置の変更',
    unitPrice: 971100,
    unit: '式',
    category: '間取り変更工事',
    description: '上記に伴う浴室の位置の変更',
  },
  {
    code: 'childcare_toilet_relocation',
    name: '上記に伴う便所の位置の変更',
    unitPrice: 402100,
    unit: '式',
    category: '間取り変更工事',
    description: '上記に伴う便所の位置の変更',
  },
  {
    code: 'childcare_washroom_relocation',
    name: '上記に伴う洗面所の位置の変更',
    unitPrice: 481200,
    unit: '式',
    category: '間取り変更工事',
    description: '上記に伴う洗面所の位置の変更',
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
