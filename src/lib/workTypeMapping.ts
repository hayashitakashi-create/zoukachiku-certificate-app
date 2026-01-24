/**
 * 工事種別と第1号〜第6号工事のマッピング
 *
 * 国土交通省の増改築等工事証明書における工事種別の分類
 * https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk4_000149.html
 */

export type WorkCategory =
  | 'seismic'           // 耐震改修
  | 'barrierFree'       // バリアフリー改修
  | 'energySaving'      // 省エネ改修
  | 'cohabitation'      // 同居対応改修
  | 'longTermHousing'   // 長期優良住宅化改修
  | 'childcare'         // 子育て対応改修
  | 'otherRenovation';  // その他増改築等

export type WorkClassification =
  | '第1号工事'   // 耐震改修工事
  | '第2号工事'   // バリアフリー改修工事
  | '第3号工事'   // 省エネ改修工事
  | '第4号工事'   // 同居対応改修工事
  | '第5号工事'   // 長期優良住宅化改修工事
  | '第6号工事';  // その他の増改築等工事

export interface WorkTypeInfo {
  category: WorkCategory;
  classification: WorkClassification;
  classificationNumber: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

/**
 * 工事種別マッピング定義
 */
export const WORK_TYPE_MAPPING: Record<WorkCategory, WorkTypeInfo> = {
  seismic: {
    category: 'seismic',
    classification: '第1号工事',
    classificationNumber: 1,
    label: '耐震改修工事',
    shortLabel: '耐震改修',
    description: '住宅の耐震性を高める改修工事',
    icon: '🏗️',
  },
  barrierFree: {
    category: 'barrierFree',
    classification: '第2号工事',
    classificationNumber: 2,
    label: 'バリアフリー改修工事',
    shortLabel: 'バリアフリー改修',
    description: '高齢者等の移動を容易にする改修工事',
    icon: '♿',
  },
  energySaving: {
    category: 'energySaving',
    classification: '第3号工事',
    classificationNumber: 3,
    label: '省エネ改修工事',
    shortLabel: '省エネ改修',
    description: '省エネルギー性能を高める改修工事',
    icon: '☀️',
  },
  cohabitation: {
    category: 'cohabitation',
    classification: '第4号工事',
    classificationNumber: 4,
    label: '同居対応改修工事',
    shortLabel: '同居対応改修',
    description: '多世帯同居に必要な設備の設置工事',
    icon: '👨‍👩‍👧‍👦',
  },
  longTermHousing: {
    category: 'longTermHousing',
    classification: '第5号工事',
    classificationNumber: 5,
    label: '長期優良住宅化改修工事',
    shortLabel: '長期優良住宅化改修',
    description: '長期優良住宅の認定基準を満たす改修工事',
    icon: '⭐',
  },
  otherRenovation: {
    category: 'otherRenovation',
    classification: '第6号工事',
    classificationNumber: 6,
    label: 'その他の増改築等工事',
    shortLabel: 'その他増改築等',
    description: '大規模修繕・模様替え・増築等の工事',
    icon: '🔨',
  },
  childcare: {
    category: 'childcare',
    classification: '第6号工事',
    classificationNumber: 6,
    label: '子育て対応改修工事',
    shortLabel: '子育て対応改修',
    description: '子育てしやすい環境への改修工事',
    icon: '👶',
  },
};

/**
 * 工事カテゴリから分類番号を取得
 */
export function getClassificationNumber(category: WorkCategory): 1 | 2 | 3 | 4 | 5 | 6 {
  return WORK_TYPE_MAPPING[category].classificationNumber;
}

/**
 * 工事カテゴリから分類名を取得
 */
export function getClassificationName(category: WorkCategory): WorkClassification {
  return WORK_TYPE_MAPPING[category].classification;
}

/**
 * 工事カテゴリから工事情報を取得
 */
export function getWorkTypeInfo(category: WorkCategory): WorkTypeInfo {
  return WORK_TYPE_MAPPING[category];
}

/**
 * 工事カテゴリのリストを第1号〜第6号順にソート
 */
export function sortWorkCategoriesByClassification(categories: WorkCategory[]): WorkCategory[] {
  return categories.sort((a, b) => {
    const aNum = WORK_TYPE_MAPPING[a].classificationNumber;
    const bNum = WORK_TYPE_MAPPING[b].classificationNumber;
    return aNum - bNum;
  });
}

/**
 * 選択された工事種別を第1号〜第6号にグループ化
 */
export function groupWorksByClassification(categories: WorkCategory[]): Map<WorkClassification, WorkCategory[]> {
  const grouped = new Map<WorkClassification, WorkCategory[]>();

  categories.forEach((category) => {
    const classification = WORK_TYPE_MAPPING[category].classification;
    if (!grouped.has(classification)) {
      grouped.set(classification, []);
    }
    grouped.get(classification)!.push(category);
  });

  return grouped;
}

/**
 * 住宅借入金等特別控除（housing_loan）で利用可能な工事種別
 *
 * 第1号〜第6号のいずれかの工事が必要
 * 工事費用の合計が100万円以上（補助金控除後）
 */
export const HOUSING_LOAN_ELIGIBLE_WORK_TYPES: WorkCategory[] = [
  'seismic',
  'barrierFree',
  'energySaving',
  'cohabitation',
  'longTermHousing',
  'otherRenovation',
  'childcare',
];

/**
 * 住宅借入金等特別控除の最低工事費用（円）
 */
export const HOUSING_LOAN_MINIMUM_COST = 1_000_000; // 100万円
