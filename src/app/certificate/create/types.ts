import type { IssuerInfo } from '@/types/issuer';
import type { HousingLoanWorkTypes } from '@/types/housingLoanDetail';
import type { WorkDataFormState } from '@/components/CostCalculationStep';
import type { PurposeType } from '@/lib/store';

// ステップの定義
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// 工事種別ラベル（工事内容記入用）
export const WORK_TYPE_LABELS: Record<string, string> = {
  seismic: '耐震改修工事',
  barrierFree: 'バリアフリー改修工事',
  energySaving: '省エネ改修工事',
  cohabitation: '同居対応改修工事',
  childcare: '子育て対応改修工事',
  longTermHousing: '長期優良住宅化改修工事',
  otherRenovation: 'その他増改築等工事',
};

// 証明書の用途ごとに対象となる工事種別
export const PURPOSE_WORK_TYPES: Record<PurposeType, string[]> = {
  housing_loan: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing', 'otherRenovation'],
  reform_tax: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing'],
  resale: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing', 'otherRenovation'],
  property_tax: ['seismic', 'barrierFree', 'energySaving', 'longTermHousing'],
};

// 用途ごとの公式様式セクション情報
export const PURPOSE_SECTION_INFO: Record<PurposeType, { category: string; sectionNumber: string; title: string; description: string }> = {
  housing_loan: {
    category: 'Ⅰ．所得税額の特別控除',
    sectionNumber: '１',
    title: '償還期間が10年以上の住宅借入金等を利用して増改築等をした場合（住宅借入金等特別税額控除）',
    description: '住宅ローン控除の対象となる増改築等工事の内容を記入します。',
  },
  reform_tax: {
    category: 'Ⅰ．所得税額の特別控除',
    sectionNumber: '３',
    title: '住宅耐震改修、高齢者等居住改修工事等（バリアフリー改修工事）、一般断熱改修工事等（省エネ改修工事）、多世帯同居改修工事等、耐久性向上改修工事等又は子育て対応改修工事等を含む増改築等をした場合（住宅耐震改修特別税額控除又は住宅特定改修特別税額控除）',
    description: '特定の改修工事に対する税額控除の対象となる工事内容を記入します。',
  },
  resale: {
    category: 'Ⅰ．所得税額の特別控除',
    sectionNumber: '４',
    title: '償還期間が10年以上の住宅借入金等を利用して特定の増改築等がされた住宅用家屋を取得した場合（買取再販住宅の取得に係る住宅借入金等特別税額控除）',
    description: '買取再販住宅の取得に係る工事内容を記入します。',
  },
  property_tax: {
    category: 'Ⅱ．固定資産税の減額',
    sectionNumber: '１',
    title: '住宅耐震改修、高齢者等居住改修工事等（バリアフリー改修工事）、一般断熱改修工事等（省エネ改修工事）又は耐久性向上改修工事等を行った場合（固定資産税の減額措置）',
    description: '固定資産税の減額対象となる改修工事の内容を記入します。',
  },
};

// 固定資産税用フォームデータ
export type PropertyTaxFormData = {
  // 1-1: 耐震改修
  seismicWorkTypes: {
    extension: boolean;    // 増築
    renovation: boolean;   // 改築
    majorRepair: boolean;  // 大規模修繕
    majorRemodeling: boolean; // 大規模模様替
  };
  seismicWorkDescription: string;
  seismicTotalCost: number;    // 全体工事費
  seismicCost: number;         // うち耐震改修費

  // 1-2: 耐震改修→認定長期優良住宅
  seismicLongTermEnabled: boolean;
  seismicLtCertAuthority: string; // 認定主体
  seismicLtCertNumber: string;    // 認定番号
  seismicLtCertDate: string;      // 認定年月日

  // 2: 熱損失防止改修（省エネ）
  energyTypes: {
    ceilingInsulation: boolean;  // 1 天井等の断熱性
    wallInsulation: boolean;     // 2 壁の断熱性
    floorInsulation: boolean;    // 3 床等の断熱性
    solarHeat: boolean;          // 4 太陽熱利用冷温熱装置
    latentHeatRecovery: boolean; // 5 潜熱回収型給湯器
    heatPump: boolean;           // 6 ヒートポンプ式電気給湯器
    fuelCell: boolean;           // 7 燃料電池コージェネレーション
    airConditioner: boolean;     // 8 エアコンディショナー
    solarPower: boolean;         // 9 太陽光発電設備
  };
  energyWorkDescription: string;
  energyTotalCost: number;           // 全体工事費
  energyInsulationCost: number;      // ア 断熱改修工事費
  energyInsulationHasSubsidy: boolean; // イ 補助金有無
  energyInsulationSubsidy: number;   // ウ 補助金額
  energyEquipmentCost: number;       // エ 設備工事費
  energyEquipmentHasSubsidy: boolean; // オ 設備補助金有無
  energyEquipmentSubsidy: number;    // カ 設備補助金額

  // 2: 認定長期優良住宅（省エネpath）
  energyLongTermEnabled: boolean;
  energyLtCertAuthority: string;
  energyLtCertNumber: string;
  energyLtCertDate: string;
};

export const defaultPropertyTaxForm: PropertyTaxFormData = {
  seismicWorkTypes: { extension: false, renovation: false, majorRepair: false, majorRemodeling: false },
  seismicWorkDescription: '',
  seismicTotalCost: 0,
  seismicCost: 0,
  seismicLongTermEnabled: false,
  seismicLtCertAuthority: '',
  seismicLtCertNumber: '',
  seismicLtCertDate: '',
  energyTypes: {
    ceilingInsulation: false, wallInsulation: false, floorInsulation: false,
    solarHeat: false, latentHeatRecovery: false, heatPump: false,
    fuelCell: false, airConditioner: false, solarPower: false,
  },
  energyWorkDescription: '',
  energyTotalCost: 0,
  energyInsulationCost: 0,
  energyInsulationHasSubsidy: false,
  energyInsulationSubsidy: 0,
  energyEquipmentCost: 0,
  energyEquipmentHasSubsidy: false,
  energyEquipmentSubsidy: 0,
  energyLongTermEnabled: false,
  energyLtCertAuthority: '',
  energyLtCertNumber: '',
  energyLtCertDate: '',
};

// reform_tax 用の(1)工事の種別フォームデータ
export type ReformTaxWorkTypeForm = {
  // ① 耐震改修
  seismic: {
    buildingStandard: boolean;  // 建築基準法施行令の規定
    earthquakeSafety: boolean;  // 地震に対する安全性に係る基準
  };
  // ② バリアフリー改修
  barrierFree: {
    pathwayExpansion: boolean;     // 通路又は出入口の拡幅
    stairSlope: boolean;           // 階段の勾配の緩和
    bathroomImprovement: boolean;  // 浴室の改良
    toiletImprovement: boolean;    // 便所の改良
    handrails: boolean;            // 手すりの取付
    stepElimination: boolean;      // 床の段差の解消
    doorImprovement: boolean;      // 出入口戸の改良
    floorSlipPrevention: boolean;  // 床材の取替
  };
  // ③ 省エネ改修
  energySaving: {
    // A. 窓の断熱改修工事パターン
    windowInsulation: boolean;        // 1 窓の断熱性を高める工事
    ceilingInsulation: boolean;       // 2 天井等
    wallInsulation: boolean;          // 3 壁
    floorInsulation: boolean;         // 4 床等
    regionCode: string;               // 地域区分 (1-8, '' = 未選択)
    // B. 認定低炭素建築物パターン
    lowCarbon: {
      windowInsulation: boolean;
      ceilingInsulation: boolean;
      wallInsulation: boolean;
      floorInsulation: boolean;
      certAuthority: string;
      certNumber: string;
      certDate: string;
    };
    // C. 設備型式
    equipmentTypes: {
      solarHeat: string;              // 太陽熱利用冷温熱装置の型式
      latentHeatRecovery: string;     // 潜熱回収型給湯器の型式
      heatPump: string;               // ヒートポンプ式電気給湯器の型式
      fuelCell: string;               // 燃料電池コージェネレーションの型式
      gasEngine: string;              // ガスエンジン給湯器の型式
      airConditioner: string;         // エアコンディショナーの型式
      solarPower: string;             // 太陽光発電設備の型式
    };
    // D. 追加工事（有/無/未回答）
    additionalWorks: {
      safetyWork: string;             // 安全対策工事 ('yes'|'no'|'')
      roofWaterproofing: string;      // 陸屋根防水基礎工事
      snowProtection: string;         // 積雪対策工事
      saltProtection: string;         // 塩害対策工事
      trunkLineReinforcement: string; // 幹線増強工事
    };
  };
  // ④ 同居対応改修
  cohabitation: {
    kitchen: boolean;    // 1 調理室増設
    bathroom: boolean;   // 2 浴室増設
    toilet: boolean;     // 3 便所増設
    entrance: boolean;   // 4 玄関増設
    countBefore: { kitchen: number; bathroom: number; toilet: number; entrance: number };
    countAfter: { kitchen: number; bathroom: number; toilet: number; entrance: number };
  };
  // ⑤ 耐久性向上改修工事等
  longTermHousing: {
    atticVentilation: boolean;        // 1 小屋裏の換気工事
    atticInspection: boolean;         // 2 小屋裏点検口の取付工事
    wallVentilation: boolean;         // 3 外壁の通気構造等工事
    bathroomWaterproof: boolean;      // 4 浴室又は脱衣室の防水工事
    foundationAntiDecay: boolean;     // 5 土台の防腐・防蟻工事
    wallFrameAntiDecay: boolean;      // 6 外壁の軸組等の防腐・防蟻工事
    underfloorMoisture: boolean;      // 7 床下の防湿工事
    underfloorInspection: boolean;    // 8 床下点検口の取付工事
    gutterInstallation: boolean;      // 9 雨どいの取付工事
    groundAntiTermite: boolean;       // 10 地盤の防蟻工事
    pipingMaintenance: boolean;       // 11 給水管・給湯管又は排水管の維持管理又は更新の容易化工事
    certAuthority: string;            // 認定主体
    certNumber: string;               // 認定番号
    certDate: string;                 // 認定年月日
    isExcellentHousing: boolean;      // 認定長期優良住宅（⑥=耐震AND省エネの両方）
  };
  // ⑥ 子育て対応改修
  childcare: {
    accidentPrevention: boolean;      // 1 子どもの事故を防止するための工事
    counterKitchen: boolean;          // 2 対面式キッチンへの交換工事
    securityImprovement: boolean;     // 3 開口部の防犯性を高める工事
    storageIncrease: boolean;         // 4 収納設備を増設する工事
    soundproofing: boolean;           // 5 開口部・界壁・界床の防音性を高める工事
    layoutChange: boolean;            // 6 間取り変更工事
  };
  // 併せて行う第1号〜第6号工事
  additionalWorks: {
    work1: { extension: boolean; renovation: boolean; majorRepair: boolean; majorRemodeling: boolean };
    work2: { floor: boolean; stairs: boolean; partition: boolean; wall: boolean };
    work3: { livingRoom: boolean; kitchen: boolean; bathroom: boolean; toilet: boolean; washroom: boolean; storage: boolean; entrance: boolean; corridor: boolean };
    work4: { buildingStandard: boolean; earthquakeSafety: boolean };
    work5: { pathwayExpansion: boolean; stairSlope: boolean; bathroomImprovement: boolean; toiletImprovement: boolean; handrails: boolean; stepElimination: boolean; doorImprovement: boolean; floorReplacement: boolean };
    work6: {
      // A. 全居室窓断熱
      windowInsulationType: string;   // '1'|'2'|'3'|''
      ceilingInsulation: boolean;
      wallInsulation: boolean;
      floorInsulation: boolean;
      regionCode: string;
      energyGradeBefore: string;
      // B. 認定低炭素建築物
      lowCarbon: {
        windowInsulation: boolean;
        ceilingInsulation: boolean;
        wallInsulation: boolean;
        floorInsulation: boolean;
        certAuthority: string;
        certNumber: string;
        certDate: string;
      };
      // C. 住宅性能評価書
      performanceEval: {
        windowInsulation: boolean;
        ceilingInsulation: boolean;
        wallInsulation: boolean;
        floorInsulation: boolean;
        regionCode: string;
        energyGradeBefore: string;    // '1'|'2'|'3'
        energyGradeAfter: string;     // '1'|'2'|'3' (等級2/等級3/等級4以上)
        evalAgencyName: string;
        evalRegistrationNumber: string;
        evalCertNumber: string;
        evalCertDate: string;
      };
      // D. 長期優良住宅認定
      longTermCert: {
        windowInsulation: boolean;
        ceilingInsulation: boolean;
        wallInsulation: boolean;
        floorInsulation: boolean;
        regionCode: string;
        energyGradeBefore: string;    // '1'|'2'|'3'
        energyGradeAfter: string;     // '1'|'2' (等級3/等級4以上)
        certAuthority: string;
        certNumber: string;
        certDate: string;
      };
    };
  };
};

// reform_tax 用の(3)費用の額等フォームデータ
export type ReformTaxCostCategory = {
  totalAmount: number;      // ア: 工事費総額
  hasSubsidy: boolean;      // イ: 補助金の有無
  subsidyAmount: number;    // イ: 補助金額
};

export type ReformTaxCostCompound5 = {
  baseTotalAmount: number;            // ア
  baseHasSubsidy: boolean;            // イ有無
  baseSubsidyAmount: number;          // イ額
  durabilityTotalAmount: number;      // エ
  durabilityHasSubsidy: boolean;      // オ有無
  durabilitySubsidyAmount: number;    // オ額
};

export type ReformTaxCostCompound6 = {
  seismicTotalAmount: number;         // ア
  seismicHasSubsidy: boolean;         // イ有無
  seismicSubsidyAmount: number;       // イ額
  energyTotalAmount: number;          // エ
  energyHasSubsidy: boolean;          // オ有無
  energySubsidyAmount: number;        // オ額
  durabilityTotalAmount: number;      // キ
  durabilityHasSubsidy: boolean;      // ク有無
  durabilitySubsidyAmount: number;    // ク額
};

export type ReformTaxCostForm = {
  seismic: ReformTaxCostCategory;            // ①: ア-オ
  barrierFree: ReformTaxCostCategory;        // ②: ア-オ
  energySaving: ReformTaxCostCategory & { hasSolarPower: boolean }; // ③: ア-オ
  cohabitation: ReformTaxCostCategory;       // ④: ア-オ
  longTermOr: ReformTaxCostCompound5;        // ⑤: ア-ケ（9フィールド）
  longTermAnd: ReformTaxCostCompound6;       // ⑥: ア-シ（12フィールド）
  childcare: ReformTaxCostCategory;          // ⑦: ア-オ
  otherRenovation: ReformTaxCostCategory;    // ⑳: ア-ウ（上限なし）
};

export const defaultReformTaxCostCategory: ReformTaxCostCategory = {
  totalAmount: 0,
  hasSubsidy: false,
  subsidyAmount: 0,
};

export const defaultReformTaxCostCompound5: ReformTaxCostCompound5 = {
  baseTotalAmount: 0, baseHasSubsidy: false, baseSubsidyAmount: 0,
  durabilityTotalAmount: 0, durabilityHasSubsidy: false, durabilitySubsidyAmount: 0,
};

export const defaultReformTaxCostCompound6: ReformTaxCostCompound6 = {
  seismicTotalAmount: 0, seismicHasSubsidy: false, seismicSubsidyAmount: 0,
  energyTotalAmount: 0, energyHasSubsidy: false, energySubsidyAmount: 0,
  durabilityTotalAmount: 0, durabilityHasSubsidy: false, durabilitySubsidyAmount: 0,
};

export const defaultReformTaxCostForm: ReformTaxCostForm = {
  seismic: { ...defaultReformTaxCostCategory },
  barrierFree: { ...defaultReformTaxCostCategory },
  energySaving: { ...defaultReformTaxCostCategory, hasSolarPower: false },
  cohabitation: { ...defaultReformTaxCostCategory },
  longTermOr: { ...defaultReformTaxCostCompound5 },
  longTermAnd: { ...defaultReformTaxCostCompound6 },
  childcare: { ...defaultReformTaxCostCategory },
  otherRenovation: { ...defaultReformTaxCostCategory },
};

export const defaultReformTaxWorkTypeForm: ReformTaxWorkTypeForm = {
  seismic: { buildingStandard: false, earthquakeSafety: false },
  barrierFree: {
    pathwayExpansion: false, stairSlope: false, bathroomImprovement: false,
    toiletImprovement: false, handrails: false, stepElimination: false,
    doorImprovement: false, floorSlipPrevention: false,
  },
  energySaving: {
    windowInsulation: false, ceilingInsulation: false,
    wallInsulation: false, floorInsulation: false, regionCode: '',
    lowCarbon: {
      windowInsulation: false, ceilingInsulation: false,
      wallInsulation: false, floorInsulation: false,
      certAuthority: '', certNumber: '', certDate: '',
    },
    equipmentTypes: {
      solarHeat: '', latentHeatRecovery: '', heatPump: '',
      fuelCell: '', gasEngine: '', airConditioner: '', solarPower: '',
    },
    additionalWorks: {
      safetyWork: '', roofWaterproofing: '', snowProtection: '',
      saltProtection: '', trunkLineReinforcement: '',
    },
  },
  cohabitation: {
    kitchen: false, bathroom: false, toilet: false, entrance: false,
    countBefore: { kitchen: 0, bathroom: 0, toilet: 0, entrance: 0 },
    countAfter: { kitchen: 0, bathroom: 0, toilet: 0, entrance: 0 },
  },
  longTermHousing: {
    atticVentilation: false, atticInspection: false, wallVentilation: false,
    bathroomWaterproof: false, foundationAntiDecay: false, wallFrameAntiDecay: false,
    underfloorMoisture: false, underfloorInspection: false, gutterInstallation: false,
    groundAntiTermite: false, pipingMaintenance: false,
    certAuthority: '', certNumber: '', certDate: '',
    isExcellentHousing: false,
  },
  childcare: {
    accidentPrevention: false, counterKitchen: false, securityImprovement: false,
    storageIncrease: false, soundproofing: false, layoutChange: false,
  },
  additionalWorks: {
    work1: { extension: false, renovation: false, majorRepair: false, majorRemodeling: false },
    work2: { floor: false, stairs: false, partition: false, wall: false },
    work3: { livingRoom: false, kitchen: false, bathroom: false, toilet: false, washroom: false, storage: false, entrance: false, corridor: false },
    work4: { buildingStandard: false, earthquakeSafety: false },
    work5: { pathwayExpansion: false, stairSlope: false, bathroomImprovement: false, toiletImprovement: false, handrails: false, stepElimination: false, doorImprovement: false, floorReplacement: false },
    work6: {
      windowInsulationType: '', ceilingInsulation: false, wallInsulation: false, floorInsulation: false,
      regionCode: '', energyGradeBefore: '',
      lowCarbon: {
        windowInsulation: false, ceilingInsulation: false, wallInsulation: false, floorInsulation: false,
        certAuthority: '', certNumber: '', certDate: '',
      },
      performanceEval: {
        windowInsulation: false, ceilingInsulation: false, wallInsulation: false, floorInsulation: false,
        regionCode: '', energyGradeBefore: '', energyGradeAfter: '',
        evalAgencyName: '', evalRegistrationNumber: '', evalCertNumber: '', evalCertDate: '',
      },
      longTermCert: {
        windowInsulation: false, ceilingInsulation: false, wallInsulation: false, floorInsulation: false,
        regionCode: '', energyGradeBefore: '', energyGradeAfter: '',
        certAuthority: '', certNumber: '', certDate: '',
      },
    },
  },
};

// フォームデータの型定義
export type CertificateFormData = {
  // ステップ1: 基本情報
  applicantName: string;
  applicantPostalCode: string;
  applicantAddress: string;
  applicantAddressDetail: string;
  propertyNumber: string;
  propertyPostalCode: string;
  propertyAddress: string;
  propertyAddressDetail: string;
  completionDate: string;
  purposeType: PurposeType | '';

  // ステップ1: 工事種別（高レベル）
  selectedWorkTypes: string[];

  // ステップ2: 工事種別詳細（公式様式の第1号～第6号）
  housingLoanWorkTypes: HousingLoanWorkTypes;

  // reform_tax 用の工事種別詳細
  reformTaxWorkTypes: ReformTaxWorkTypeForm;

  // 固定資産税用詳細フォーム
  propertyTaxForm: PropertyTaxFormData;

  // ステップ3: 費用計算（property_tax用）
  workDataForm: WorkDataFormState;

  // reform_tax 用の(3)費用の額等（公式様式準拠）
  reformTaxCost: ReformTaxCostForm;

  // ステップ3: 費用計算（housing_loan, resale用 — 公式様式①②③）
  housingLoanCost: {
    totalCost: number;       // ① 第１号～第６号工事に要した費用の額
    hasSubsidy: boolean;     // ② 補助金等の交付の有無
    subsidyAmount: number;   // ② 交付される補助金等の額
  };

  // ステップ4: 実施した工事の内容
  workDescriptions: Record<string, string>;

  // ステップ5: 証明者情報
  issuerInfo: Partial<IssuerInfo> | null;
  issueDate: string;
};

// ステップコンポーネント共通props
export type StepProps = {
  formData: CertificateFormData;
  setFormData: React.Dispatch<React.SetStateAction<CertificateFormData>>;
};
