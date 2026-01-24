/**
 * 住宅借入金等特別控除の詳細情報の型定義
 * スクリーンショットに基づく第1号〜第6号工事の選択肢と費用情報
 */

// 第1号工事: 増築、改築、大規模の修繕、大規模の模様替
export interface Work1Type {
  extension: boolean;      // 1 増築
  renovation: boolean;      // 2 改築
  majorRepair: boolean;     // 3 大規模の修繕
  majorRemodeling: boolean; // 4 大規模の模様替
}

// 第2号工事: 区分所有建物の過半の修繕または模様替
export interface Work2Type {
  floorOverHalf: boolean;      // 1 床の過半の修繕又は模様替
  stairOverHalf: boolean;      // 2 階段の過半の修繕又は模様替
  partitionOverHalf: boolean;  // 3 間仕切壁の過半の修繕又は模様替
  wallOverHalf: boolean;       // 4 壁の過半の修繕又は模様替
}

// 第3号工事: 一室の床又は壁の全部の修繕又は模様替
export interface Work3Type {
  livingRoom: boolean; // 1 居室
  kitchen: boolean;    // 2 調理室
  bathroom: boolean;   // 3 浴室
  toilet: boolean;     // 4 便所
  washroom: boolean;   // 5 洗面所
  storage: boolean;    // 6 納戸
  entrance: boolean;   // 7 玄関
  corridor: boolean;   // 8 廊下
}

// 第4号工事: 耐震改修工事
export interface Work4Type {
  buildingStandard: boolean;  // 1 建築基準法施行令第3章及び第5章の4の規定
  earthquakeSafety: boolean;  // 2 地震に対する安全性に係る基準
}

// 第5号工事: バリアフリー改修工事
export interface Work5Type {
  pathwayExpansion: boolean;     // 1 通路又は出入口の拡幅
  stairSlope: boolean;           // 2 階段の勾配の緩和
  bathroomImprovement: boolean;  // 3 浴室の改良
  toiletImprovement: boolean;    // 4 便所の改良
  handrails: boolean;            // 5 手すりの設置
  stepElimination: boolean;      // 6 床の段差の解消
  doorImprovement: boolean;      // 7 出入口戸の改良
  floorSlipPrevention: boolean;  // 8 床材の滑り改良
}

// 第6号工事: 省エネ改修等その他の増改築等工事（非常に複雑）
export interface Work6Type {
  // エネルギー使用の合理化に資する修繕改修
  energyEfficiency: {
    allWindowsInsulation: boolean;             // 1 全ての窓の断熱性...
    allRoomsWindowsInsulation: boolean;        // 2 全ての居室の全ての窓の断熱性...
    allRoomsFloorCeilingInsulation: boolean;   // 3 全ての居室の床又は天井の断熱性...

    // 上記1から3のいずれかと併せて行う工事
    combinedWindowsInsulation: boolean;        // 1 全ての窓の断熱性を高める工事
    combinedCeilingInsulation: boolean;        // 2 天井等の断熱性を高める工事
    combinedWallInsulation: boolean;           // 3 壁の断熱性を高める工事
    combinedFloorInsulation: boolean;          // 4 床等の断熱性を高める工事

    // 地域区分
    region1?: boolean;
    region2?: boolean;
    region3?: boolean;
    region4?: boolean;
    region5?: boolean;
    region6?: boolean;
    region7?: boolean;
    region8?: boolean;

    // 改修工事前の住宅の一次エネルギー消費量等級
    energyGradeBefore?: string;  // "1" | "2" | "3"
  };

  // 認定低炭素建築物新築等計画に基づく工事の場合
  lowCarbonCert?: {
    certAuthority: string;  // 認定主体
    certNumber: string;     // 認定番号
    certDate: string;       // 認定年月日 (YYYY-MM-DD)

    // 添付：次に該当する修繕又は模様替
    attachment1Window: boolean;  // 1 窓

    // 添付：上記1と併せて行ういずれかに該当する修繕又は模様替
    attachment2Window: boolean;    // 2 窓
    attachment3Ceiling: boolean;   // 3 天井等
    attachment4Floor: boolean;     // 4 床等
  };

  // 住宅性能証明書
  perfCert?: {
    workType1Window?: boolean;      // 1 窓の断熱性を高める工事
    workType2Ceiling?: boolean;     // 2 天井等の断熱性を高める工事
    workType3Wall?: boolean;        // 3 壁の断熱性を高める工事
    workType4Floor?: boolean;       // 4 床等の断熱性を高める工事
    region?: string;                // 地域区分
    energyGradeBefore?: string;     // 改修工事前の住宅が相当する断熱等性能等級
    insulationGradeAfter?: string;  // 改修工事後の住宅の断熱等性能等級
    energyEvaluation?: string;      // 住宅性能評価書を交付した登録住宅性能評価機関
    evalIssueNumber?: string;       // 住宅性能評価書の交付番号
    energyGrade?: string;           // 一次エネルギー消費量等級 "1" | "2" | "3"
    insulationGrade?: string;       // 断熱等性能等級 "1" | "2" | "3" | "4+"
    orgName?: string;               // 発行機関名称
    regNumber?: string;             // 登録番号
    issueNumber?: string;           // 交付番号
    issueDate?: string;             // 交付年月日 (YYYY-MM-DD)
  };

  // エネルギー使用の合理化（再度、似た項目）
  energyEfficiency2?: {
    windowInsulation?: boolean;     // 1 窓の断熱性を高める工事
    ceilingInsulation?: boolean;    // 2 天井等の断熱性を高める工事
    wallInsulation?: boolean;       // 3 壁の断熱性を高める工事
    floorInsulation?: boolean;      // 4 床等の断熱性を高める工事

    region1?: boolean;
    region2?: boolean;
    region3?: boolean;
    region4?: boolean;
    region5?: boolean;
    region6?: boolean;
    region7?: boolean;
    region8?: boolean;

    gradeBefore1?: boolean;
    gradeBefore2?: boolean;
    gradeBefore3?: boolean;
  };

  // 改修工事前の住宅の断熱等性能等級
  insulationGradeBefore3?: boolean;
  insulationGradeBefore4Plus?: boolean;

  // 長期優良住宅建築等計画の認定
  longTermCert?: {
    certAuthority?: string;  // 認定主体
    certNumber?: string;     // 認定番号
    certDate?: string;       // 認定年月日 (YYYY-MM-DD)
  };
}

// 全工事種別の統合型
export interface HousingLoanWorkTypes {
  work1?: Work1Type;
  work2?: Work2Type;
  work3?: Work3Type;
  work4?: Work4Type;
  work5?: Work5Type;
  work6?: Work6Type;
}

// デフォルト値
export const defaultWork1: Work1Type = {
  extension: false,
  renovation: false,
  majorRepair: false,
  majorRemodeling: false,
};

export const defaultWork2: Work2Type = {
  floorOverHalf: false,
  stairOverHalf: false,
  partitionOverHalf: false,
  wallOverHalf: false,
};

export const defaultWork3: Work3Type = {
  livingRoom: false,
  kitchen: false,
  bathroom: false,
  toilet: false,
  washroom: false,
  storage: false,
  entrance: false,
  corridor: false,
};

export const defaultWork4: Work4Type = {
  buildingStandard: false,
  earthquakeSafety: false,
};

export const defaultWork5: Work5Type = {
  pathwayExpansion: false,
  stairSlope: false,
  bathroomImprovement: false,
  toiletImprovement: false,
  handrails: false,
  stepElimination: false,
  doorImprovement: false,
  floorSlipPrevention: false,
};

export const defaultWork6: Work6Type = {
  energyEfficiency: {
    allWindowsInsulation: false,
    allRoomsWindowsInsulation: false,
    allRoomsFloorCeilingInsulation: false,
    combinedWindowsInsulation: false,
    combinedCeilingInsulation: false,
    combinedWallInsulation: false,
    combinedFloorInsulation: false,
  },
};

export const defaultWorkTypes: HousingLoanWorkTypes = {};

// フォームデータ型
export interface HousingLoanDetailFormData {
  workTypes: HousingLoanWorkTypes;
  workDescription?: string;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
}
