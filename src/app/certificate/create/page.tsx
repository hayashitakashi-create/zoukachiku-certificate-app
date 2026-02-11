'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { IssuerInfo } from '@/types/issuer';
import type { HousingLoanWorkTypes } from '@/types/housingLoanDetail';
import { defaultWork1, defaultWork2, defaultWork3, defaultWork4, defaultWork5, defaultWork6 } from '@/types/housingLoanDetail';
import IssuerInfoForm from '@/components/IssuerInfoForm';
import CostCalculationStep, { type WorkDataFormState, convertFormStateToWorkData } from '@/components/CostCalculationStep';
import { certificateStore, type PurposeType } from '@/lib/store';

// ステップの定義
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// 工事種別ラベル（工事内容記入用）
const WORK_TYPE_LABELS: Record<string, string> = {
  seismic: '耐震改修工事',
  barrierFree: 'バリアフリー改修工事',
  energySaving: '省エネ改修工事',
  cohabitation: '同居対応改修工事',
  childcare: '子育て対応改修工事',
  longTermHousing: '長期優良住宅化改修工事',
  otherRenovation: 'その他増改築等工事',
};

// 証明書の用途ごとに対象となる工事種別
const PURPOSE_WORK_TYPES: Record<PurposeType, string[]> = {
  housing_loan: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing', 'otherRenovation'],
  reform_tax: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing'],
  resale: ['seismic', 'barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing', 'otherRenovation'],
  property_tax: ['seismic', 'barrierFree', 'energySaving', 'longTermHousing'],
};

// 用途ごとの公式様式セクション情報
const PURPOSE_SECTION_INFO: Record<PurposeType, { category: string; sectionNumber: string; title: string; description: string }> = {
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
type PropertyTaxFormData = {
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

const defaultPropertyTaxForm: PropertyTaxFormData = {
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
type ReformTaxWorkTypeForm = {
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
type ReformTaxCostCategory = {
  totalAmount: number;      // ア: 工事費総額
  hasSubsidy: boolean;      // イ: 補助金の有無
  subsidyAmount: number;    // イ: 補助金額
};

type ReformTaxCostCompound5 = {
  baseTotalAmount: number;            // ア
  baseHasSubsidy: boolean;            // イ有無
  baseSubsidyAmount: number;          // イ額
  durabilityTotalAmount: number;      // エ
  durabilityHasSubsidy: boolean;      // オ有無
  durabilitySubsidyAmount: number;    // オ額
};

type ReformTaxCostCompound6 = {
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

type ReformTaxCostForm = {
  seismic: ReformTaxCostCategory;            // ①: ア-オ
  barrierFree: ReformTaxCostCategory;        // ②: ア-オ
  energySaving: ReformTaxCostCategory & { hasSolarPower: boolean }; // ③: ア-オ
  cohabitation: ReformTaxCostCategory;       // ④: ア-オ
  longTermOr: ReformTaxCostCompound5;        // ⑤: ア-ケ（9フィールド）
  longTermAnd: ReformTaxCostCompound6;       // ⑥: ア-シ（12フィールド）
  childcare: ReformTaxCostCategory;          // ⑦: ア-オ
  otherRenovation: ReformTaxCostCategory;    // ⑳: ア-ウ（上限なし）
};

const defaultReformTaxCostCategory: ReformTaxCostCategory = {
  totalAmount: 0,
  hasSubsidy: false,
  subsidyAmount: 0,
};

const defaultReformTaxCostCompound5: ReformTaxCostCompound5 = {
  baseTotalAmount: 0, baseHasSubsidy: false, baseSubsidyAmount: 0,
  durabilityTotalAmount: 0, durabilityHasSubsidy: false, durabilitySubsidyAmount: 0,
};

const defaultReformTaxCostCompound6: ReformTaxCostCompound6 = {
  seismicTotalAmount: 0, seismicHasSubsidy: false, seismicSubsidyAmount: 0,
  energyTotalAmount: 0, energyHasSubsidy: false, energySubsidyAmount: 0,
  durabilityTotalAmount: 0, durabilityHasSubsidy: false, durabilitySubsidyAmount: 0,
};

const defaultReformTaxCostForm: ReformTaxCostForm = {
  seismic: { ...defaultReformTaxCostCategory },
  barrierFree: { ...defaultReformTaxCostCategory },
  energySaving: { ...defaultReformTaxCostCategory, hasSolarPower: false },
  cohabitation: { ...defaultReformTaxCostCategory },
  longTermOr: { ...defaultReformTaxCostCompound5 },
  longTermAnd: { ...defaultReformTaxCostCompound6 },
  childcare: { ...defaultReformTaxCostCategory },
  otherRenovation: { ...defaultReformTaxCostCategory },
};

const defaultReformTaxWorkTypeForm: ReformTaxWorkTypeForm = {
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
type CertificateFormData = {
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

export default function CertificateCreatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);

  // 初期値
  const initialFormData: CertificateFormData = {
    applicantName: '',
    applicantPostalCode: '',
    applicantAddress: '',
    applicantAddressDetail: '',
    propertyNumber: '',
    propertyPostalCode: '',
    propertyAddress: '',
    propertyAddressDetail: '',
    completionDate: '',
    purposeType: '',
    selectedWorkTypes: [],
    housingLoanWorkTypes: {},
    reformTaxWorkTypes: { ...defaultReformTaxWorkTypeForm },
    propertyTaxForm: { ...defaultPropertyTaxForm },
    workDataForm: {},
    reformTaxCost: { ...defaultReformTaxCostForm },
    housingLoanCost: { totalCost: 0, hasSubsidy: false, subsidyAmount: 0 },
    workDescriptions: {},
    issuerInfo: null,
    issueDate: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState<CertificateFormData>(initialFormData);

  // 郵便番号から住所を検索
  const fetchAddressFromPostalCode = async (postalCode: string, fieldType: 'applicant' | 'property') => {
    const cleanedPostalCode = postalCode.replace(/-/g, '');
    if (cleanedPostalCode.length !== 7 || !/^\d{7}$/.test(cleanedPostalCode)) return;

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanedPostalCode}`);
      const data = await response.json();
      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        const address = `${result.address1}${result.address2}${result.address3}`;
        if (fieldType === 'applicant') {
          setFormData(prev => ({ ...prev, applicantAddress: address }));
        } else {
          setFormData(prev => ({ ...prev, propertyAddress: address }));
        }
      }
    } catch (error) {
      console.error('郵便番号検索エラー:', error);
    }
  };

  // ローカルストレージから下書きと証明者設定を復元（初回のみ）
  useEffect(() => {
    let currentSessionId = sessionStorage.getItem('certificate-session-id');
    if (!currentSessionId) {
      currentSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', currentSessionId);
    }

    const FORM_SCHEMA_VERSION = 3; // v3: work6 B/C/D pattern separation
    const savedData = localStorage.getItem('certificate-form-data');
    let loadedFormData: CertificateFormData | null = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // スキーマバージョンが古い場合は旧データを破棄
        if ((parsed._schemaVersion || 0) < FORM_SCHEMA_VERSION) {
          console.log('Form schema upgraded: clearing incompatible draft data');
          localStorage.removeItem('certificate-form-data');
          // loadedFormData = null のまま → デフォルトで初期化
        } else {
        if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
          setWasRestored(true);
        }
        // 旧データとの互換
        if (!parsed.workDataForm) parsed.workDataForm = {};
        if (!parsed.workDescriptions) parsed.workDescriptions = {};
        if (!parsed.selectedWorkTypes) parsed.selectedWorkTypes = [];
        if (!parsed.housingLoanWorkTypes) parsed.housingLoanWorkTypes = {};
        // reformTaxWorkTypes: deep merge with defaults to handle new nested structures
        {
          const def = defaultReformTaxWorkTypeForm;
          const rt = parsed.reformTaxWorkTypes || {};
          parsed.reformTaxWorkTypes = {
            seismic: { ...def.seismic, ...rt.seismic },
            barrierFree: { ...def.barrierFree, ...rt.barrierFree },
            energySaving: {
              ...def.energySaving,
              ...rt.energySaving,
              lowCarbon: { ...def.energySaving.lowCarbon, ...(rt.energySaving?.lowCarbon || {}) },
              equipmentTypes: { ...def.energySaving.equipmentTypes, ...(rt.energySaving?.equipmentTypes || {}) },
              additionalWorks: { ...def.energySaving.additionalWorks, ...(rt.energySaving?.additionalWorks || {}) },
            },
            cohabitation: {
              ...def.cohabitation,
              ...rt.cohabitation,
              countBefore: { ...def.cohabitation.countBefore, ...(rt.cohabitation?.countBefore || {}) },
              countAfter: { ...def.cohabitation.countAfter, ...(rt.cohabitation?.countAfter || {}) },
            },
            longTermHousing: { ...def.longTermHousing, ...rt.longTermHousing },
            childcare: { ...def.childcare, ...rt.childcare },
            additionalWorks: {
              work1: { ...def.additionalWorks.work1, ...(rt.additionalWorks?.work1 || {}) },
              work2: { ...def.additionalWorks.work2, ...(rt.additionalWorks?.work2 || {}) },
              work3: { ...def.additionalWorks.work3, ...(rt.additionalWorks?.work3 || {}) },
              work4: { ...def.additionalWorks.work4, ...(rt.additionalWorks?.work4 || {}) },
              work5: { ...def.additionalWorks.work5, ...(rt.additionalWorks?.work5 || {}) },
              work6: { ...def.additionalWorks.work6, ...(rt.additionalWorks?.work6 || {}) },
            },
          };
        }
        // reformTaxCost: deep merge with defaults for new compound structures
        {
          const def = defaultReformTaxCostForm;
          const rc = parsed.reformTaxCost || {};
          parsed.reformTaxCost = {
            seismic: { ...def.seismic, ...rc.seismic },
            barrierFree: { ...def.barrierFree, ...rc.barrierFree },
            energySaving: { ...def.energySaving, ...rc.energySaving },
            cohabitation: { ...def.cohabitation, ...rc.cohabitation },
            longTermOr: { ...def.longTermOr, ...(rc.longTermOr || {}) },
            longTermAnd: { ...def.longTermAnd, ...(rc.longTermAnd || {}) },
            childcare: { ...def.childcare, ...rc.childcare },
            otherRenovation: { ...def.otherRenovation, ...rc.otherRenovation },
          };
        }
        if (!parsed.propertyTaxForm) parsed.propertyTaxForm = { ...defaultPropertyTaxForm };
        if (!parsed.housingLoanCost) parsed.housingLoanCost = { totalCost: 0, hasSubsidy: false, subsidyAmount: 0 };
        loadedFormData = parsed;
        } // end else (schema version OK)
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }

    // 証明者設定を読み込む（API優先、localStorageフォールバック）
    // fromApi=true の場合、issuerInfoがnullでもloadedFormDataの値を上書きする（他ユーザーのデータ漏洩防止）
    const applyIssuerSettings = (issuerSettings: Partial<IssuerInfo> | null, fromApi: boolean) => {
      if (loadedFormData) {
        if (fromApi) {
          // 認証済み → APIの結果で常に上書き（nullでも上書きして前ユーザーのデータを消す）
          setFormData({ ...loadedFormData, issuerInfo: issuerSettings });
        } else if (issuerSettings && (!loadedFormData.issuerInfo || !loadedFormData.issuerInfo.organizationType)) {
          setFormData({ ...loadedFormData, issuerInfo: issuerSettings });
        } else {
          setFormData(loadedFormData);
        }
      } else if (issuerSettings) {
        setFormData(prev => ({ ...prev, issuerInfo: issuerSettings }));
      }
    };

    const loadIssuerSettings = async () => {
      try {
        const res = await fetch('/api/issuer-settings');
        if (res.ok) {
          // 認証済み → DB結果を信頼（nullでもlocalStorageにフォールバックしない）
          const data = await res.json();
          applyIssuerSettings(data.issuerInfo ?? null, true);
          // 他ユーザーのデータ漏洩防止のためlocalStorageをクリア
          localStorage.removeItem('issuer-settings');
          setIsInitialized(true);
          return;
        }
        if (res.status !== 401) {
          // 401以外のエラー → フォールバックせず終了
          if (loadedFormData) setFormData(loadedFormData);
          setIsInitialized(true);
          return;
        }
        // 401（未認証）→ 下のlocalStorageフォールバックへ
      } catch {
        // ネットワークエラー → 下のlocalStorageフォールバックへ
      }

      // 未認証またはネットワークエラー時のみlocalStorageから読み込み
      const savedSettings = localStorage.getItem('issuer-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          let issuerSettings: Partial<IssuerInfo> | null = null;
          if (settings.issuerName && !settings.organizationType) {
            issuerSettings = {
              organizationType: 'registered_architect_office',
              architectName: settings.issuerName || '',
              officeName: settings.issuerOfficeName || '',
              architectRegistrationNumber: settings.issuerQualificationNumber || '',
            } as any;
          } else {
            issuerSettings = settings;
          }
          applyIssuerSettings(issuerSettings, false);
        } catch (error) {
          console.error('Failed to parse issuer settings:', error);
          if (loadedFormData) setFormData(loadedFormData);
        }
      } else if (loadedFormData) {
        setFormData(loadedFormData);
      }
      setIsInitialized(true);
    };

    loadIssuerSettings();
  }, []);

  // フォームデータが変更されたらlocalStorageに自動保存
  useEffect(() => {
    if (isInitialized) {
      const currentSessionId = sessionStorage.getItem('certificate-session-id');
      localStorage.setItem('certificate-form-data', JSON.stringify({
        ...formData,
        sessionId: currentSessionId,
        _schemaVersion: 3,
      }));
    }
  }, [formData, isInitialized]);

  // URLクエリからステップを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const step = parseInt(stepParam) as WizardStep;
      if (step >= 1 && step <= 6) setCurrentStep(step);
    }
  }, []);

  // 計算ページからの結果をlocalStorageから取り込む
  // ※ isInitialized が true になるまで実行しない（初期化中に実行すると
  //    localStorage のキーを消費した後、初期化完了時に formData が上書きされてしまう）
  const applyCalcResults = useCallback(() => {
    if (!isInitialized) return;

    const lsKeyMap: Record<string, 'seismic' | 'barrierFree' | 'energySaving' | 'cohabitation' | 'childcare' | 'otherRenovation'> = {
      calc_result_seismic: 'seismic',
      calc_result_barrierFree: 'barrierFree',
      calc_result_energySaving: 'energySaving',
      calc_result_cohabitation: 'cohabitation',
      calc_result_childcare: 'childcare',
      calc_result_otherRenovation: 'otherRenovation',
    };

    let updated = false;

    setFormData(prev => {
      const costUpdates: Partial<ReformTaxCostForm> = {};

      for (const [lsKey, category] of Object.entries(lsKeyMap)) {
        const val = localStorage.getItem(lsKey);
        if (val !== null) {
          const amount = parseInt(val) || 0;
          (costUpdates as Record<string, unknown>)[category] = {
            ...prev.reformTaxCost[category as keyof ReformTaxCostForm],
            totalAmount: amount,
          };
          localStorage.removeItem(lsKey);
          updated = true;
        }
      }

      // longTermHousing → longTermOr.durabilityTotalAmount に反映
      const lthVal = localStorage.getItem('calc_result_longTermHousing');
      if (lthVal !== null) {
        const amount = parseInt(lthVal) || 0;
        costUpdates.longTermOr = { ...prev.reformTaxCost.longTermOr, durabilityTotalAmount: amount };
        localStorage.removeItem('calc_result_longTermHousing');
        updated = true;
      }

      if (!updated) return prev;
      return { ...prev, reformTaxCost: { ...prev.reformTaxCost, ...costUpdates } };
    });
  }, [isInitialized]);

  // ページ表示時・フォーカス復帰時に計算結果を取り込む
  useEffect(() => {
    applyCalcResults();
    window.addEventListener('focus', applyCalcResults);
    return () => window.removeEventListener('focus', applyCalcResults);
  }, [applyCalcResults]);

  const steps = [
    { number: 1, title: '基本情報', description: '申請者・物件情報' },
    { number: 2, title: '(1) 工事種別', description: '実施した工事の種別' },
    { number: 3, title: '(2) 工事内容', description: '実施した工事の内容' },
    { number: 4, title: '(3) 費用の額', description: '工事の費用の額等' },
    { number: 5, title: '証明者情報', description: '発行者情報' },
    { number: 6, title: '確認・保存', description: 'プレビューと保存' },
  ];

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      if (!formData.applicantName || !formData.applicantAddress || !formData.propertyAddress ||
          !formData.completionDate || !formData.purposeType) {
        alert('基本情報の必須項目を入力してください');
        return;
      }
    }
    setCurrentStep(prev => (prev < 6 ? (prev + 1) as WizardStep : prev));
  }, [currentStep, formData]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as WizardStep : prev));
  }, []);

  const handleNewForm = useCallback(() => {
    if (confirm('入力中のデータをクリアして新規作成を開始しますか？')) {
      localStorage.removeItem('certificate-form-data');
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', newSessionId);
      setFormData(initialFormData);
      setCurrentStep(1);
      setWasRestored(false);
    }
  }, [initialFormData]);

  // 費用サマリー（確認画面用）
  const getCostSummary = useCallback(() => {
    const workData = convertFormStateToWorkData(formData.workDataForm);
    let totalAmount = 0;
    let totalSubsidy = 0;
    const details: { label: string; total: number; subsidy: number }[] = [];

    const labels: Record<string, string> = {
      seismic: '耐震改修', barrierFree: 'バリアフリー改修', energySaving: '省エネ改修',
      cohabitation: '同居対応改修', childcare: '子育て対応改修',
      longTermHousing: '長期優良住宅化改修', otherRenovation: 'その他増改築',
    };

    for (const [cat, data] of Object.entries(workData)) {
      if (data.summary && data.summary.totalAmount > 0) {
        details.push({
          label: labels[cat] || cat,
          total: data.summary.totalAmount,
          subsidy: data.summary.subsidyAmount,
        });
        totalAmount += data.summary.totalAmount;
        totalSubsidy += data.summary.subsidyAmount;
      }
    }

    return { totalAmount, totalSubsidy, details };
  }, [formData.workDataForm]);

  // 用途に応じた工事種別一覧（selectedWorkTypesの代わりに使用）
  const effectiveWorkTypes = useMemo(() => {
    if (!formData.purposeType) return [];
    return PURPOSE_WORK_TYPES[formData.purposeType as PurposeType] || [];
  }, [formData.purposeType]);

  // IndexedDBに保存
  const saveCertificate = async (status: 'draft' | 'completed') => {
    setIsSaving(true);
    try {
      const fullApplicantAddress = formData.applicantAddress + (formData.applicantAddressDetail || '');

      // issuerInfo から各フィールドを抽出
      let issuerName = '';
      let issuerOfficeName = '';
      let issuerOrganizationType = '';
      let issuerQualificationNumber = '';

      if (formData.issuerInfo && formData.issuerInfo.organizationType) {
        const info = formData.issuerInfo as any;
        issuerName = info.architectName || '';
        switch (info.organizationType) {
          case 'registered_architect_office':
            issuerOfficeName = info.officeName || '';
            issuerOrganizationType = '登録建築士事務所';
            issuerQualificationNumber = info.architectRegistrationNumber || '';
            break;
          case 'designated_inspection_agency':
            issuerOfficeName = info.agencyName || '';
            issuerOrganizationType = '指定確認検査機関';
            issuerQualificationNumber = info.architectRegistrationNumber || '';
            break;
          case 'registered_evaluation_agency':
            issuerOfficeName = info.agencyName || '';
            issuerOrganizationType = '登録住宅性能評価機関';
            issuerQualificationNumber = info.architectRegistrationNumber || '';
            break;
          case 'warranty_insurance_corporation':
            issuerOfficeName = info.corporationName || '';
            issuerOrganizationType = '住宅瑕疵担保責任保険法人';
            issuerQualificationNumber = info.architectRegistrationNumber || '';
            break;
        }
      }

      // WorkData変換
      const workData = convertFormStateToWorkData(formData.workDataForm);

      // 補助金合計を計算
      let totalSubsidy = 0;
      let totalWorkCost = 0;
      for (const data of Object.values(workData)) {
        if (data.summary) {
          totalSubsidy += data.summary.subsidyAmount;
          totalWorkCost += data.summary.totalAmount;
        }
      }

      // housingLoanDetail の構築（housing_loan, resale の場合）
      // 公式様式①②③の値を使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let housingLoanDetail: any = null;
      if (formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') {
        const hlCost = formData.housingLoanCost;
        const hlSubsidy = hlCost.hasSubsidy ? hlCost.subsidyAmount : 0;
        const deductible = Math.max(0, hlCost.totalCost - hlSubsidy);
        // saveCertificateでも使う
        totalWorkCost = hlCost.totalCost;
        totalSubsidy = hlSubsidy;
        housingLoanDetail = {
          workTypes: formData.housingLoanWorkTypes,
          workDescription: formData.workDescriptions['_all'] || Object.values(formData.workDescriptions || {}).filter(Boolean).join('、'),
          totalCost: hlCost.totalCost,
          hasSubsidy: hlCost.hasSubsidy,
          subsidyAmount: hlSubsidy,
          deductibleAmount: deductible,
        };
      }

      // reform_tax 用: reformTaxCost から WorkCostData を計算して works + reformTaxDetail に保存
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let reformTaxDetail: any = undefined;
      if (formData.purposeType === 'reform_tax') {
        const rc = formData.reformTaxCost;
        const wt = formData.reformTaxWorkTypes;
        const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');
        const isAnd = wt.longTermHousing.isExcellentHousing;

        const buildCost = (cat: { totalAmount: number; hasSubsidy: boolean; subsidyAmount: number }, limit: number, needOver50: boolean) => {
          const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
          const afterSub = cat.totalAmount - sub;
          const deductible = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
          const maxDed = limit > 0 ? Math.min(deductible, limit) : deductible;
          const excess = Math.max(0, deductible - maxDed);
          return {
            totalAmount: cat.totalAmount,
            subsidyAmount: sub,
            deductibleAmount: deductible,
            maxDeduction: maxDed,
            excessAmount: excess,
          };
        };

        const seismicCost = buildCost(rc.seismic, 2_500_000, false);
        const bfCost = buildCost(rc.barrierFree, 2_000_000, true);
        const energyLimit = hasSolar ? 3_500_000 : 2_500_000;
        const esCost = buildCost(rc.energySaving, energyLimit, true);
        const cohabCost = buildCost(rc.cohabitation, 2_500_000, true);
        const ccCost = buildCost(rc.childcare, 2_500_000, true);
        // ⑳ その他増改築等（第1号～第6号工事）
        const orSub = rc.otherRenovation.hasSubsidy ? rc.otherRenovation.subsidyAmount : 0;
        const orAfterSub = Math.max(0, rc.otherRenovation.totalAmount - orSub);

        // ⑤ compound (OR)
        const lt5 = rc.longTermOr;
        const lt5BaseSub = lt5.baseHasSubsidy ? lt5.baseSubsidyAmount : 0;
        const lt5BaseAfter = lt5.baseTotalAmount - lt5BaseSub;
        const lt5BaseDed = lt5BaseAfter > 500_000 ? lt5BaseAfter : 0;
        const lt5DurSub = lt5.durabilityHasSubsidy ? lt5.durabilitySubsidyAmount : 0;
        const lt5DurAfter = lt5.durabilityTotalAmount - lt5DurSub;
        const lt5DurDed = lt5DurAfter > 500_000 ? lt5DurAfter : 0;
        const lt5Ki = lt5BaseDed + lt5DurDed;
        const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
        const lt5Ku = Math.min(lt5Ki, lt5Limit);
        const lt5Ke = Math.max(0, lt5Ki - lt5Ku);
        const lt5Total = lt5.baseTotalAmount + lt5.durabilityTotalAmount;
        const lt5SubTotal = lt5BaseSub + lt5DurSub;

        // ⑥ compound (AND)
        const lt6 = rc.longTermAnd;
        const lt6SesSub = lt6.seismicHasSubsidy ? lt6.seismicSubsidyAmount : 0;
        const lt6SesAfter = lt6.seismicTotalAmount - lt6SesSub;
        const lt6SesDed = lt6SesAfter > 500_000 ? lt6SesAfter : 0;
        const lt6EnSub = lt6.energyHasSubsidy ? lt6.energySubsidyAmount : 0;
        const lt6EnAfter = lt6.energyTotalAmount - lt6EnSub;
        const lt6EnDed = lt6EnAfter > 500_000 ? lt6EnAfter : 0;
        const lt6DurSub = lt6.durabilityHasSubsidy ? lt6.durabilitySubsidyAmount : 0;
        const lt6DurAfter = lt6.durabilityTotalAmount - lt6DurSub;
        const lt6DurDed = lt6DurAfter > 500_000 ? lt6DurAfter : 0;
        const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
        const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
        const lt6Sa = Math.min(lt6Ko, lt6Limit);
        const lt6Shi = Math.max(0, lt6Ko - lt6Sa);
        const lt6Total = lt6.seismicTotalAmount + lt6.energyTotalAmount + lt6.durabilityTotalAmount;
        const lt6SubTotal = lt6SesSub + lt6EnSub + lt6DurSub;

        // works に WorkSummary として保存（WorkData構造に合わせる）
        const toSummary = (cost: { totalAmount: number; subsidyAmount: number; deductibleAmount: number }) => ({
          totalAmount: cost.totalAmount,
          subsidyAmount: cost.subsidyAmount,
          deductibleAmount: cost.deductibleAmount,
        });
        workData.seismic.summary = rc.seismic.totalAmount > 0 ? toSummary(seismicCost) : null;
        workData.barrierFree.summary = rc.barrierFree.totalAmount > 0 ? toSummary(bfCost) : null;
        workData.energySaving.summary = rc.energySaving.totalAmount > 0 ? { ...toSummary(esCost), hasSolarPower: hasSolar } : null;
        workData.cohabitation.summary = rc.cohabitation.totalAmount > 0 ? toSummary(cohabCost) : null;
        if (lt5Total > 0) {
          workData.longTermHousing.summary = { totalAmount: lt5Total, subsidyAmount: lt5SubTotal, deductibleAmount: lt5Ki, isExcellentHousing: false };
        } else if (lt6Total > 0) {
          workData.longTermHousing.summary = { totalAmount: lt6Total, subsidyAmount: lt6SubTotal, deductibleAmount: lt6Ko, isExcellentHousing: true };
        } else {
          workData.longTermHousing.summary = null;
        }
        workData.childcare.summary = rc.childcare.totalAmount > 0 ? toSummary(ccCost) : null;

        // reformTaxDetail 構築（ReformTaxData 相当）
        reformTaxDetail = {
          seismic: rc.seismic.totalAmount > 0 ? seismicCost : undefined,
          barrierFree: rc.barrierFree.totalAmount > 0 ? bfCost : undefined,
          energySaving: rc.energySaving.totalAmount > 0 ? { ...esCost, hasSolarPower: hasSolar } : undefined,
          cohabitation: rc.cohabitation.totalAmount > 0 ? cohabCost : undefined,
          longTermHousingOr: lt5Total > 0 ? {
            totalAmount: lt5Total, subsidyAmount: lt5SubTotal, deductibleAmount: lt5Ki,
            maxDeduction: lt5Ku, excessAmount: lt5Ke,
          } : undefined,
          longTermHousingAnd: lt6Total > 0 ? {
            totalAmount: lt6Total, subsidyAmount: lt6SubTotal, deductibleAmount: lt6Ko,
            maxDeduction: lt6Sa, excessAmount: lt6Shi, isExcellentHousing: true,
          } : undefined,
          childcare: rc.childcare.totalAmount > 0 ? ccCost : undefined,
          otherRenovation: rc.otherRenovation.totalAmount > 0 ? {
            totalAmount: rc.otherRenovation.totalAmount,
            subsidyAmount: orSub,
            deductibleAmount: orAfterSub,
          } : undefined,
          workDescription: formData.workDescriptions['_all'] || '',
        };

        // 合計再計算
        totalWorkCost = 0;
        totalSubsidy = 0;
        for (const data of Object.values(workData)) {
          if ((data as { summary: { totalAmount: number; subsidyAmount: number } | null }).summary) {
            totalWorkCost += (data as { summary: { totalAmount: number; subsidyAmount: number } }).summary.totalAmount;
            totalSubsidy += (data as { summary: { totalAmount: number; subsidyAmount: number } }).summary.subsidyAmount;
          }
        }
      }

      // IndexedDBに証明書を新規作成して保存
      const cert = await certificateStore.createCertificate(formData.purposeType as PurposeType, session?.user?.id);
      await certificateStore.updateCertificate(cert.id, {
        applicantName: formData.applicantName,
        applicantAddress: fullApplicantAddress,
        propertyNumber: formData.propertyNumber,
        propertyAddress: formData.propertyAddress,
        completionDate: formData.completionDate,
        issuerName,
        issuerOfficeName,
        issueDate: formData.issueDate,
        issuerOrganizationType,
        issuerQualificationNumber,
        issuerInfo: formData.issuerInfo as any || null,
        subsidyAmount: totalSubsidy,
        works: workData,
        workDescriptions: formData.workDescriptions,
        housingLoanDetail,
        reformTaxDetail,
        status,
      });

      // ローカルストレージの下書きをクリア
      localStorage.removeItem('certificate-form-data');
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', newSessionId);
      setWasRestored(false);

      alert(status === 'draft' ? '下書きを保存しました' : '証明書を保存しました');
      router.push('/');
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">
              増改築等工事証明書 作成
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleNewForm}
                className="px-4 py-2 text-sm text-stone-700 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors"
              >
                クリア
              </button>
              <Link href="/" className="px-4 py-2 text-sm text-amber-700 hover:text-amber-800 font-semibold">
                トップに戻る
              </Link>
            </div>
          </div>
        </div>

        {/* ステップインジケーター */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(step.number as WizardStep)}
                  className={`flex flex-col items-center ${currentStep >= step.number ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep === step.number ? 'bg-gradient-to-r from-amber-700 to-stone-700 text-white shadow-lg shadow-amber-900/20'
                    : currentStep > step.number ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-500'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <p className="mt-1 text-xs font-medium">{step.title}</p>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.number ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-6">
          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">基本情報</h2>

              {wasRestored && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
                  前回入力したデータが復元されました。続きから入力できます。
                </div>
              )}

              <div className="space-y-6">
                {/* 申請者情報 */}
                <div className="border-b border-stone-200 pb-6">
                  <h3 className="text-lg font-semibold mb-3">申請者情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">氏名 *</label>
                      <input type="text" value={formData.applicantName}
                        onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="山田 太郎" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">郵便番号</label>
                      <input type="text" value={formData.applicantPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, applicantPostalCode: value }));
                          if (value.replace(/-/g, '').length === 7) fetchAddressFromPostalCode(value, 'applicant');
                        }}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="1000001" maxLength={8} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">住所 *</label>
                      <input type="text" value={formData.applicantAddress}
                        onChange={(e) => setFormData({ ...formData, applicantAddress: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="東京都千代田区千代田" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">番地・建物名</label>
                      <input type="text" value={formData.applicantAddressDetail}
                        onChange={(e) => setFormData({ ...formData, applicantAddressDetail: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="1-2-3 〇〇ビル 4階" />
                    </div>
                  </div>
                </div>

                {/* 家屋情報 */}
                <div className="border-b border-stone-200 pb-6">
                  <h3 className="text-lg font-semibold mb-3">家屋番号及び所在地</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">郵便番号</label>
                      <input type="text" value={formData.propertyPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, propertyPostalCode: value }));
                          if (value.replace(/-/g, '').length === 7) fetchAddressFromPostalCode(value, 'property');
                        }}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="1000001" maxLength={8} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">所在地 *</label>
                      <input type="text" value={formData.propertyAddress}
                        onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="東京都千代田区千代田 1-2-3" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1">家屋番号</label>
                      <input type="text" value={formData.propertyNumber}
                        onChange={(e) => setFormData({ ...formData, propertyNumber: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="12番地3" />
                    </div>
                  </div>
                </div>

                {/* 用途区分（工事種別の前に配置） */}
                <div className="border-b border-stone-200 pb-6">
                  <h3 className="text-lg font-semibold mb-3">証明書の用途 *</h3>
                  <p className="text-sm text-stone-600 mb-4">証明する工事の内容に該当するものを選択してください。</p>

                  {/* Ⅰ．所得税額の特別控除 */}
                  <div className="mb-4">
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-2 inline-block">Ⅰ．所得税額の特別控除</div>
                    <div className="space-y-2">
                      {[
                        { value: 'housing_loan', label: '住宅ローン減税（増改築）をした場合', sub: '（住宅借入金等特別税額控除）', page: '様式 1ページ' },
                        { value: 'reform_tax', label: 'リフォーム促進税制＞省エネ改修・子育て対応改修をした場合＞耐震改修・その他増改築をした場合', sub: '（住宅耐震改修特別税額控除又は住宅特定改修特別税額控除）', page: '様式 9ページ' },
                        { value: 'resale', label: '買取再販住宅の要件を満たす工事', sub: '（買取再販住宅の取得に係る住宅借入金等特別税額控除）', page: '様式 17ページ' },
                      ].map((purpose) => (
                        <label key={purpose.value} className={`flex items-start p-3 border-2 rounded-2xl cursor-pointer transition-colors ${
                          formData.purposeType === purpose.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-300'
                        }`}>
                          <input type="radio" name="purposeType" value={purpose.value}
                            checked={formData.purposeType === purpose.value}
                            onChange={(e) => {
                              setFormData({ ...formData, purposeType: e.target.value as PurposeType });
                            }}
                            className="mt-1 mr-3 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{purpose.label}</p>
                            {purpose.sub && <p className="text-xs text-stone-500 mt-0.5">{purpose.sub}</p>}
                            <p className="text-xs text-stone-400 mt-0.5">{purpose.page}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ⅱ．固定資産税の減額 */}
                  <div>
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2 inline-block">Ⅱ．固定資産税の減額</div>
                    <div className="space-y-2">
                      {[
                        { value: 'property_tax', label: '固定資産税減額に資する耐震・省エネ・長期優良住宅化リフォーム', page: '様式 20ページ' },
                      ].map((purpose) => (
                        <label key={purpose.value} className={`flex items-start p-3 border-2 rounded-2xl cursor-pointer transition-colors ${
                          formData.purposeType === purpose.value ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-emerald-300'
                        }`}>
                          <input type="radio" name="purposeType" value={purpose.value}
                            checked={formData.purposeType === purpose.value}
                            onChange={(e) => {
                              setFormData({ ...formData, purposeType: e.target.value as PurposeType });
                            }}
                            className="mt-1 mr-3 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{purpose.label}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{purpose.page}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 工事情報 */}
                <div className="border-b border-stone-200 pb-6">
                  <h3 className="text-lg font-semibold mb-3">工事情報</h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-stone-700 mb-1">工事完了年月日 *</label>
                    <input type="date" value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: (1) 実施した工事の種別（公式様式 第1号～第6号） */}
          {currentStep === 2 && (
            <div>
              {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-semibold text-amber-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-amber-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">（１）実施した工事の種別</h2>
              <p className="text-sm text-stone-600 mb-6">
                公式様式に準拠した工事種別の詳細項目を選択してください。
              </p>

              {/* === 固定資産税用フォーム === */}
              {formData.purposeType === 'property_tax' && (
                <div className="space-y-6">
                  {/* 1-1: 耐震改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-1">１－１．耐震改修をした場合</h3>
                    <p className="text-xs text-stone-500 mb-3">地方税法施行令附則第12条第19項に規定する基準に適合する耐震改修</p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-stone-700 mb-2">工事の種別</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {([
                          ['extension', '1 増築'],
                          ['renovation', '2 改築'],
                          ['majorRepair', '3 大規模の修繕'],
                          ['majorRemodeling', '4 大規模の模様替'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox"
                              checked={formData.propertyTaxForm.seismicWorkTypes[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: {
                                  ...prev.propertyTaxForm,
                                  seismicWorkTypes: { ...prev.propertyTaxForm.seismicWorkTypes, [key]: e.target.checked },
                                },
                              }))}
                              className="w-4 h-4 text-amber-600 rounded" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-stone-700 mb-1">工事の内容</label>
                      <textarea
                        value={formData.propertyTaxForm.seismicWorkDescription}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, seismicWorkDescription: e.target.value },
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="耐震改修工事の内容を記入..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">全体の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.seismicTotalCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, seismicTotalCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">うち耐震改修の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.seismicCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, seismicCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="0" />
                      </div>
                    </div>
                  </div>

                  {/* 1-2: 耐震改修→認定長期優良住宅 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <input type="checkbox"
                        checked={formData.propertyTaxForm.seismicLongTermEnabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, seismicLongTermEnabled: e.target.checked },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <div>
                        <h3 className="font-bold text-sm">１－２．耐震改修をした家屋が認定長期優良住宅に該当することとなった場合</h3>
                        <p className="text-xs text-stone-500">地方税法附則第15条の９の２第１項に規定する耐震改修</p>
                      </div>
                    </div>

                    {formData.propertyTaxForm.seismicLongTermEnabled && (
                      <div className="ml-6 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">認定主体</label>
                          <input type="text"
                            value={formData.propertyTaxForm.seismicLtCertAuthority}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertAuthority: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                            placeholder="○○市長" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">認定番号</label>
                          <input type="text"
                            value={formData.propertyTaxForm.seismicLtCertNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertNumber: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                            placeholder="第○○号" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1">認定年月日</label>
                          <input type="date"
                            value={formData.propertyTaxForm.seismicLtCertDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertDate: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2: 熱損失防止改修工事等（省エネ） */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-1">２．熱損失防止改修工事等をした場合</h3>
                    <p className="text-xs text-stone-500 mb-3">熱損失防止改修工事等をした場合又は熱損失防止改修工事等をした家屋が認定長期優良住宅に該当することとなった場合</p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-stone-700 mb-2">工事の種別（窓の断熱性を高める工事と併せて行う以下の工事）</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {([
                          ['ceilingInsulation', '1 天井等の断熱性を高める工事'],
                          ['wallInsulation', '2 壁の断熱性を高める工事'],
                          ['floorInsulation', '3 床等の断熱性を高める工事'],
                          ['solarHeat', '4 太陽熱利用冷温熱装置の設置工事'],
                          ['latentHeatRecovery', '5 潜熱回収型給湯器の設置工事'],
                          ['heatPump', '6 ヒートポンプ式電気給湯器の設置工事'],
                          ['fuelCell', '7 燃料電池コージェネレーションシステムの設置工事'],
                          ['airConditioner', '8 エアコンディショナーの設置工事'],
                          ['solarPower', '9 太陽光発電設備の設置工事'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox"
                              checked={formData.propertyTaxForm.energyTypes[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: {
                                  ...prev.propertyTaxForm,
                                  energyTypes: { ...prev.propertyTaxForm.energyTypes, [key]: e.target.checked },
                                },
                              }))}
                              className="w-4 h-4 text-amber-600 rounded" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-stone-700 mb-1">工事の内容</label>
                      <textarea
                        value={formData.propertyTaxForm.energyWorkDescription}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, energyWorkDescription: e.target.value },
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="省エネ改修工事の内容を記入..."
                      />
                    </div>

                    {/* 費用の額 */}
                    <div className="bg-stone-50 p-3 rounded-2xl space-y-3">
                      <p className="text-xs font-semibold text-stone-700">費用の額</p>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">全体の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.energyTotalCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, energyTotalCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="0" />
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-stone-600 mb-2">断熱改修工事</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-stone-600 mb-1">ア 断熱改修工事の費用</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyInsulationCost || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationCost: Number(e.target.value) || 0 },
                              }))}
                              className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-600 mb-1">イ 補助金等の有無</label>
                            <div className="flex gap-4 mt-1">
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="insulationSubsidy"
                                  checked={formData.propertyTaxForm.energyInsulationHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: true },
                                  }))}
                                  className="w-4 h-4 text-amber-600" />
                                <span>有</span>
                              </label>
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="insulationSubsidy"
                                  checked={!formData.propertyTaxForm.energyInsulationHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: false, energyInsulationSubsidy: 0 },
                                  }))}
                                  className="w-4 h-4 text-amber-600" />
                                <span>無</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        {formData.propertyTaxForm.energyInsulationHasSubsidy && (
                          <div className="mt-2">
                            <label className="block text-xs text-stone-600 mb-1">ウ 補助金等の額</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyInsulationSubsidy || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationSubsidy: Number(e.target.value) || 0 },
                              }))}
                              className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0" />
                          </div>
                        )}
                        {/* ① 差引額（自動計算） */}
                        <div className="mt-2 p-2 bg-amber-50 rounded-2xl text-sm">
                          ① 差引額: <span className="font-bold">
                            {(formData.propertyTaxForm.energyInsulationCost - (formData.propertyTaxForm.energyInsulationHasSubsidy ? formData.propertyTaxForm.energyInsulationSubsidy : 0)).toLocaleString()}円
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-stone-600 mb-2">設備工事</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-stone-600 mb-1">エ 設備工事の費用</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyEquipmentCost || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentCost: Number(e.target.value) || 0 },
                              }))}
                              className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-600 mb-1">オ 補助金等の有無</label>
                            <div className="flex gap-4 mt-1">
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="equipmentSubsidy"
                                  checked={formData.propertyTaxForm.energyEquipmentHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: true },
                                  }))}
                                  className="w-4 h-4 text-amber-600" />
                                <span>有</span>
                              </label>
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="equipmentSubsidy"
                                  checked={!formData.propertyTaxForm.energyEquipmentHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: false, energyEquipmentSubsidy: 0 },
                                  }))}
                                  className="w-4 h-4 text-amber-600" />
                                <span>無</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        {formData.propertyTaxForm.energyEquipmentHasSubsidy && (
                          <div className="mt-2">
                            <label className="block text-xs text-stone-600 mb-1">カ 補助金等の額</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyEquipmentSubsidy || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentSubsidy: Number(e.target.value) || 0 },
                              }))}
                              className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0" />
                          </div>
                        )}
                        {/* ② 設備差引額（自動計算） */}
                        <div className="mt-2 p-2 bg-amber-50 rounded-2xl text-sm">
                          ② 設備差引額: <span className="font-bold">
                            {(formData.propertyTaxForm.energyEquipmentCost - (formData.propertyTaxForm.energyEquipmentHasSubsidy ? formData.propertyTaxForm.energyEquipmentSubsidy : 0)).toLocaleString()}円
                          </span>
                        </div>
                      </div>

                      {/* ③④ 費用確認 */}
                      {(() => {
                        const d1 = formData.propertyTaxForm.energyInsulationCost - (formData.propertyTaxForm.energyInsulationHasSubsidy ? formData.propertyTaxForm.energyInsulationSubsidy : 0);
                        const d2 = formData.propertyTaxForm.energyEquipmentCost - (formData.propertyTaxForm.energyEquipmentHasSubsidy ? formData.propertyTaxForm.energyEquipmentSubsidy : 0);
                        const check3 = d1 > 600000;
                        const check4 = d1 > 500000 && (d1 + d2) > 600000;
                        return (
                          <div className="border-t pt-3 space-y-1">
                            <div className={`text-sm p-2 rounded-2xl ${check3 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                              ③ ①が60万円超: <span className="font-bold">{check3 ? '該当' : '非該当'}</span>
                            </div>
                            <div className={`text-sm p-2 rounded-2xl ${check4 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                              ④ ①が50万円超かつ①＋②が60万円超: <span className="font-bold">{check4 ? '該当' : '非該当'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 認定長期優良住宅（省エネpath） */}
                    <div className="mt-4 p-3 border border-dashed border-stone-300 rounded-2xl">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox"
                          checked={formData.propertyTaxForm.energyLongTermEnabled}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, energyLongTermEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 text-amber-600 rounded" />
                        <span className="text-sm font-medium">認定長期優良住宅に該当する場合</span>
                      </label>
                      {formData.propertyTaxForm.energyLongTermEnabled && (
                        <div className="ml-6 mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">認定主体</label>
                            <input type="text"
                              value={formData.propertyTaxForm.energyLtCertAuthority}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertAuthority: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="○○市長" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">認定番号</label>
                            <input type="text"
                              value={formData.propertyTaxForm.energyLtCertNumber}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertNumber: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="第○○号" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">認定年月日</label>
                            <input type="date"
                              value={formData.propertyTaxForm.energyLtCertDate}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertDate: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* === reform_tax 専用フォーム（セクションIII 工事の種別） === */}
              {formData.purposeType === 'reform_tax' && (
                <div className="space-y-5">
                  {/* ① 耐震改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-3">① 住宅耐震改修</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {([
                        ['buildingStandard', '建築基準法施行令第3章及び第5章の4の規定に適合させるもの'],
                        ['earthquakeSafety', '地震に対する安全性に係る基準に適合させるもの'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-start space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                            checked={formData.reformTaxWorkTypes.seismic[key]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                seismic: { ...prev.reformTaxWorkTypes.seismic, [key]: e.target.checked },
                              },
                            }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ② バリアフリー改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-3">② 高齢者等居住改修工事等（バリアフリー改修工事）</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {([
                        ['pathwayExpansion', '1 通路又は出入口の拡幅'],
                        ['stairSlope', '2 階段の勾配の緩和'],
                        ['bathroomImprovement', '3 浴室の改良'],
                        ['toiletImprovement', '4 便所の改良'],
                        ['handrails', '5 手すりの取付'],
                        ['stepElimination', '6 床の段差の解消'],
                        ['doorImprovement', '7 出入口戸の改良'],
                        ['floorSlipPrevention', '8 床材の取替'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                            checked={formData.reformTaxWorkTypes.barrierFree[key]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                barrierFree: { ...prev.reformTaxWorkTypes.barrierFree, [key]: e.target.checked },
                              },
                            }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ③ 省エネ改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-1">③ 一般断熱改修工事等（省エネ改修工事）</h3>
                    <p className="text-xs text-stone-600 mb-3 ml-4">窓の断熱改修工事を実施した場合</p>

                    {/* A. 窓の断熱改修工事パターン */}
                    <div className="mb-4">
                      {/* 1. 窓の断熱性を高める工事 */}
                      <p className="text-xs text-stone-700 mb-2">エネルギーの使用の合理化に資する増築、改築、修繕又は模様替</p>
                      <div className="ml-4 mb-3">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                            checked={(formData.reformTaxWorkTypes.energySaving as Record<string, boolean | string | object>).windowInsulation === true}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                energySaving: { ...prev.reformTaxWorkTypes.energySaving, windowInsulation: e.target.checked },
                              },
                            }))} />
                          <span>１　窓の断熱性を高める工事</span>
                        </label>
                      </div>

                      {/* 2-4. 上記１と併せて行う工事 */}
                      <p className="text-xs text-stone-700 mb-2">上記１と併せて行う次のいずれかに該当する増築、改築、修繕又は模様替</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                        {([
                          ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
                          ['wallInsulation', '３　壁の断熱性を高める工事'],
                          ['floorInsulation', '４　床等の断熱性を高める工事'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                              checked={(formData.reformTaxWorkTypes.energySaving as Record<string, boolean | string | object>)[key] === true}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  energySaving: { ...prev.reformTaxWorkTypes.energySaving, [key]: e.target.checked },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>

                      {/* 地域区分 */}
                      <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">地域区分</span>
                        <div className="flex flex-wrap gap-2">
                          {['1','2','3','4','5','6','7','8'].map(n => (
                            <label key={n} className="flex items-center space-x-1 text-sm">
                              <input type="checkbox"
                                checked={formData.reformTaxWorkTypes.energySaving.regionCode === n}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxWorkTypes: {
                                    ...prev.reformTaxWorkTypes,
                                    energySaving: { ...prev.reformTaxWorkTypes.energySaving, regionCode: e.target.checked ? n : '' },
                                  },
                                }))}
                                className="w-4 h-4 text-amber-600 rounded" />
                              <span>{n}地域</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* B. 認定低炭素建築物パターン */}
                    <div className="mb-4 pt-3 border-t border-stone-100">
                      <p className="text-xs font-semibold text-stone-700 mb-2">B. 認定低炭素建築物の新築等に係る工事</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                        {([
                          ['windowInsulation', '1 窓の断熱性を高める工事'],
                          ['ceilingInsulation', '2 天井等の断熱性を高める工事'],
                          ['wallInsulation', '3 壁の断熱性を高める工事'],
                          ['floorInsulation', '4 床等の断熱性を高める工事'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                              checked={formData.reformTaxWorkTypes.energySaving.lowCarbon[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  energySaving: {
                                    ...prev.reformTaxWorkTypes.energySaving,
                                    lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 ml-2">
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定主体</label>
                          <input type="text"
                            value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certAuthority}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                energySaving: {
                                  ...prev.reformTaxWorkTypes.energySaving,
                                  lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certAuthority: e.target.value },
                                },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="○○市長" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定番号</label>
                          <input type="text"
                            value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                energySaving: {
                                  ...prev.reformTaxWorkTypes.energySaving,
                                  lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certNumber: e.target.value },
                                },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定年月日</label>
                          <input type="date"
                            value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                energySaving: {
                                  ...prev.reformTaxWorkTypes.energySaving,
                                  lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certDate: e.target.value },
                                },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                        </div>
                      </div>
                    </div>

                    {/* C. 設備型式 */}
                    <div className="mb-4 pt-3 border-t border-stone-100">
                      <p className="text-xs font-semibold text-stone-700 mb-2">C. 設備の型式</p>
                      <div className="space-y-2 ml-2">
                        {([
                          ['solarHeat', '太陽熱利用冷温熱装置'],
                          ['latentHeatRecovery', '潜熱回収型給湯器'],
                          ['heatPump', 'ヒートポンプ式電気給湯器'],
                          ['fuelCell', '燃料電池コージェネレーション'],
                          ['gasEngine', 'ガスエンジン給湯器'],
                          ['airConditioner', 'エアコンディショナー'],
                          ['solarPower', '太陽光発電設備'],
                        ] as const).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <label className="text-xs text-stone-600 w-48 shrink-0">{label}</label>
                            <input type="text"
                              value={formData.reformTaxWorkTypes.energySaving.equipmentTypes[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  energySaving: {
                                    ...prev.reformTaxWorkTypes.energySaving,
                                    equipmentTypes: { ...prev.reformTaxWorkTypes.energySaving.equipmentTypes, [key]: e.target.value },
                                  },
                                },
                              }))}
                              className="flex-1 px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="型式を入力" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* D. 追加工事 */}
                    <div className="pt-3 border-t border-stone-100">
                      <p className="text-xs font-semibold text-stone-700 mb-2">D. 追加工事の有無</p>
                      <div className="space-y-2 ml-2">
                        {([
                          ['safetyWork', '安全対策工事'],
                          ['roofWaterproofing', '陸屋根防水基礎工事'],
                          ['snowProtection', '積雪対策工事'],
                          ['saltProtection', '塩害対策工事'],
                          ['trunkLineReinforcement', '幹線増強工事'],
                        ] as const).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-stone-600 w-36 shrink-0">{label}</span>
                            {['yes', 'no'].map(val => (
                              <label key={val} className="flex items-center gap-1 text-xs">
                                <input type="radio"
                                  name={`additionalWork_${key}`}
                                  checked={formData.reformTaxWorkTypes.energySaving.additionalWorks[key] === val}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      energySaving: {
                                        ...prev.reformTaxWorkTypes.energySaving,
                                        additionalWorks: { ...prev.reformTaxWorkTypes.energySaving.additionalWorks, [key]: val },
                                      },
                                    },
                                  }))}
                                  className="w-3 h-3" />
                                {val === 'yes' ? '有' : '無'}
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ④ 同居対応改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-3">④ 多世帯同居改修工事等</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {([
                        ['kitchen', '1 調理室の増設'],
                        ['bathroom', '2 浴室の増設'],
                        ['toilet', '3 便所の増設'],
                        ['entrance', '4 玄関の増設'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                            checked={formData.reformTaxWorkTypes.cohabitation[key] as boolean}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                cohabitation: { ...prev.reformTaxWorkTypes.cohabitation, [key]: e.target.checked },
                              },
                            }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {/* 改修前後の室数 */}
                    <div className="border-t border-stone-100 pt-3">
                      <p className="text-xs font-semibold text-stone-700 mb-2">改修工事前後の室数</p>
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full">
                          <thead>
                            <tr className="bg-stone-50">
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-center">調理室</th>
                              <th className="px-2 py-1 text-center">浴室</th>
                              <th className="px-2 py-1 text-center">便所</th>
                              <th className="px-2 py-1 text-center">玄関</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(['countBefore', 'countAfter'] as const).map(timing => (
                              <tr key={timing}>
                                <td className="px-2 py-1 font-medium">{timing === 'countBefore' ? '改修前' : '改修後'}</td>
                                {(['kitchen', 'bathroom', 'toilet', 'entrance'] as const).map(room => (
                                  <td key={room} className="px-2 py-1 text-center">
                                    <input type="number" min={0}
                                      value={formData.reformTaxWorkTypes.cohabitation[timing][room] || ''}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        reformTaxWorkTypes: {
                                          ...prev.reformTaxWorkTypes,
                                          cohabitation: {
                                            ...prev.reformTaxWorkTypes.cohabitation,
                                            [timing]: { ...prev.reformTaxWorkTypes.cohabitation[timing], [room]: parseInt(e.target.value) || 0 },
                                          },
                                        },
                                      }))}
                                      className="w-16 px-1 py-1 text-center text-sm border-2 border-stone-200 rounded-2xl" />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* ⑤ 耐久性向上改修工事等 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-3">⑤ 耐久性向上改修工事等</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {([
                        ['atticVentilation', '1 小屋裏の換気工事'],
                        ['atticInspection', '2 小屋裏点検口の取付工事'],
                        ['wallVentilation', '3 外壁の通気構造等工事'],
                        ['bathroomWaterproof', '4 浴室又は脱衣室の防水工事'],
                        ['foundationAntiDecay', '5 土台の防腐・防蟻工事'],
                        ['wallFrameAntiDecay', '6 外壁の軸組等の防腐・防蟻工事'],
                        ['underfloorMoisture', '7 床下の防湿工事'],
                        ['underfloorInspection', '8 床下点検口の取付工事'],
                        ['gutterInstallation', '9 雨どいの取付工事'],
                        ['groundAntiTermite', '10 地盤の防蟻工事'],
                        ['pipingMaintenance', '11 給水管・給湯管又は排水管の維持管理又は更新の容易化工事'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-start space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                            checked={(formData.reformTaxWorkTypes.longTermHousing as Record<string, boolean | string>)[key] === true}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, [key]: e.target.checked },
                              },
                            }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {/* 認定情報 */}
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <p className="text-xs font-semibold text-stone-700 mb-2">長期優良住宅建築等計画の認定情報</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定主体</label>
                          <input type="text"
                            value={formData.reformTaxWorkTypes.longTermHousing.certAuthority}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certAuthority: e.target.value },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="○○市長" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定番号</label>
                          <input type="text"
                            value={formData.reformTaxWorkTypes.longTermHousing.certNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certNumber: e.target.value },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 mb-1">認定年月日</label>
                          <input type="date"
                            value={formData.reformTaxWorkTypes.longTermHousing.certDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certDate: e.target.value },
                              },
                            }))}
                            className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                          checked={formData.reformTaxWorkTypes.longTermHousing.isExcellentHousing}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reformTaxWorkTypes: {
                              ...prev.reformTaxWorkTypes,
                              longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, isExcellentHousing: e.target.checked },
                            },
                          }))} />
                        <span className="font-medium text-emerald-800">認定長期優良住宅に該当する（⑥耐震及び省エネの両方と併せて行う場合）</span>
                      </label>
                    </div>
                  </div>

                  {/* ⑦ 子育て対応改修 */}
                  <div className="p-4 border border-stone-200 rounded-2xl">
                    <h3 className="font-bold text-sm mb-1">⑥ 子育て対応改修工事等</h3>
                    <p className="text-xs text-stone-600 mb-3 ml-4">子育てに係る特例対象個人の負担を軽減するための次のいずれかに該当する増築、改築、修繕又は模様替</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                      {([
                        ['accidentPrevention', '１　住宅内における子どもの事故を防止するための工事'],
                        ['counterKitchen', '２　対面式キッチンへの交換工事'],
                        ['securityImprovement', '３　開口部の防犯性を高める工事'],
                        ['storageIncrease', '４　収納設備を増設する工事'],
                        ['soundproofing', '５　開口部・界壁・界床の防音性を高める工事'],
                        ['layoutChange', '６　間取り変更工事'],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                            checked={formData.reformTaxWorkTypes.childcare[key]}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxWorkTypes: {
                                ...prev.reformTaxWorkTypes,
                                childcare: { ...prev.reformTaxWorkTypes.childcare, [key]: e.target.checked },
                              },
                            }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 併せて行う第1号〜第6号工事 */}
                  <div className="p-4 border border-orange-200 bg-orange-50 rounded-2xl">
                    <h3 className="font-bold text-sm mb-1">併せて行う第1号〜第6号工事</h3>
                    <p className="text-xs text-stone-500 mb-4">①〜⑦の工事と併せて行った場合に記入してください。</p>

                    {/* 第1号工事 */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-700 mb-2">第1号工事</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-2">
                        {([
                          ['extension', '1 増築'],
                          ['renovation', '2 改築'],
                          ['majorRepair', '3 大規模の修繕'],
                          ['majorRemodeling', '4 大規模の模様替'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                              checked={formData.reformTaxWorkTypes.additionalWorks.work1[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  additionalWorks: {
                                    ...prev.reformTaxWorkTypes.additionalWorks,
                                    work1: { ...prev.reformTaxWorkTypes.additionalWorks.work1, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 第2号工事 */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-700 mb-1">第2号工事</p>
                      <p className="text-xs text-stone-500 mb-2 ml-2">1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるもののうちその者が区分所有する部分について行う次のいずれかに該当する修繕又は模様替</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                        {([
                          ['floor', '1 床の過半の修繕又は模様替'],
                          ['stairs', '2 階段の過半の修繕又は模様替'],
                          ['partition', '3 間仕切壁の過半の修繕又は模様替'],
                          ['wall', '4 壁の過半の修繕又は模様替'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                              checked={formData.reformTaxWorkTypes.additionalWorks.work2[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  additionalWorks: {
                                    ...prev.reformTaxWorkTypes.additionalWorks,
                                    work2: { ...prev.reformTaxWorkTypes.additionalWorks.work2, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 第3号工事 */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-700 mb-1">第3号工事</p>
                      <p className="text-xs text-stone-500 mb-2 ml-2">次のいずれか一室の床又は壁の全部の修繕又は模様替</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-2">
                        {([
                          ['livingRoom', '1 居室'],
                          ['kitchen', '2 調理室'],
                          ['bathroom', '3 浴室'],
                          ['toilet', '4 便所'],
                          ['washroom', '5 洗面所'],
                          ['storage', '6 納戸'],
                          ['entrance', '7 玄関'],
                          ['corridor', '8 廊下'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                              checked={formData.reformTaxWorkTypes.additionalWorks.work3[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  additionalWorks: {
                                    ...prev.reformTaxWorkTypes.additionalWorks,
                                    work3: { ...prev.reformTaxWorkTypes.additionalWorks.work3, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 第4号工事 */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-700 mb-1">第4号工事（耐震改修工事）</p>
                      <p className="text-xs text-red-500 mb-1 ml-2">※①の工事を実施していない場合のみ選択</p>
                      <p className="text-xs text-stone-500 mb-2 ml-2">次の規定又は基準に適合させるための修繕又は模様替</p>
                      <div className="grid grid-cols-1 gap-2 ml-2">
                        {([
                          ['buildingStandard', '1 建築基準法施行令第3章及び第5章の4の規定'],
                          ['earthquakeSafety', '2 地震に対する安全性に係る基準'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                              checked={formData.reformTaxWorkTypes.additionalWorks.work4[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  additionalWorks: {
                                    ...prev.reformTaxWorkTypes.additionalWorks,
                                    work4: { ...prev.reformTaxWorkTypes.additionalWorks.work4, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 第5号工事 */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-700 mb-1">第5号工事（バリアフリー改修工事）</p>
                      <p className="text-xs text-red-500 mb-1 ml-2">※②の工事を実施していない場合のみ選択</p>
                      <p className="text-xs text-stone-500 mb-2 ml-2">高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための次のいずれかに該当する修繕又は模様替</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                        {([
                          ['pathwayExpansion', '1 通路又は出入口の拡幅'],
                          ['stairSlope', '2 階段の勾配の緩和'],
                          ['bathroomImprovement', '3 浴室の改良'],
                          ['toiletImprovement', '4 便所の改良'],
                          ['handrails', '5 手すりの取付'],
                          ['stepElimination', '6 床の段差の解消'],
                          ['doorImprovement', '7 出入口の戸の改良'],
                          ['floorReplacement', '8 床材の取替'],
                        ] as const).map(([key, label]) => (
                          <label key={key} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                              checked={formData.reformTaxWorkTypes.additionalWorks.work5[key]}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxWorkTypes: {
                                  ...prev.reformTaxWorkTypes,
                                  additionalWorks: {
                                    ...prev.reformTaxWorkTypes.additionalWorks,
                                    work5: { ...prev.reformTaxWorkTypes.additionalWorks.work5, [key]: e.target.checked },
                                  },
                                },
                              }))} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 第6号工事 */}
                    <div>
                      <p className="text-xs font-semibold text-stone-700 mb-1">第6号工事（省エネ改修工事）</p>
                      <p className="text-xs text-red-500 mb-2 ml-2">※③の工事を実施していない場合のみ選択</p>
                      <div className="ml-2 space-y-4">

                        {/* A. 全ての居室の全ての窓の断熱改修工事を実施した場合 */}
                        <div>
                          <p className="text-xs font-semibold text-stone-600 mb-2">全ての居室の全ての窓の断熱改修工事を実施した場合</p>
                          <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次のいずれかに該当する修繕若しくは模様替</p>
                          <div className="space-y-1 ml-4">
                            {([
                              ['1', '１　全ての居室の全ての窓の断熱性を高める工事'],
                              ['2', '２　全ての居室の全ての窓の断熱性を相当程度高める工事'],
                              ['3', '３　全ての居室の全ての窓の断熱性を著しく高める工事'],
                            ] as [string, string][]).map(([val, label]) => (
                              <label key={val} className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                  checked={formData.reformTaxWorkTypes.additionalWorks.work6.windowInsulationType === val}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, windowInsulationType: e.target.checked ? val : '' },
                                      },
                                    },
                                  }))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-stone-500 mt-3 mb-2 ml-2">上記１から３のいずれかと併せて行う次のいずれかに該当する修繕又は模様替</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-4">
                            {([
                              ['ceilingInsulation', '４　天井等の断熱性を高める工事'],
                              ['wallInsulation', '５　壁の断熱性を高める工事'],
                              ['floorInsulation', '６　床等の断熱性を高める工事'],
                            ] as const).map(([key, label]) => (
                              <label key={key} className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                  checked={formData.reformTaxWorkTypes.additionalWorks.work6[key] as boolean}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, [key]: e.target.checked },
                                      },
                                    },
                                  }))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                            <div className="flex flex-wrap gap-2">
                              {['1','2','3','4','5','6','7','8'].map(n => (
                                <label key={n} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.regionCode === n}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, regionCode: e.target.checked ? n : '' },
                                        },
                                      },
                                    }))} />
                                  <span>{n}地域</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 ml-4">
                            <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                            <div className="flex gap-3 mt-1">
                              {['1','2','3'].map(g => (
                                <label key={g} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.energyGradeBefore === g}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, energyGradeBefore: e.target.checked ? g : '' },
                                        },
                                      },
                                    }))} />
                                  <span>等級{g}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* B. 認定低炭素建築物新築等計画に基づく工事の場合 */}
                        <div className="border-t border-stone-200 pt-3">
                          <p className="text-xs font-semibold text-stone-600 mb-2">認定低炭素建築物新築等計画に基づく工事の場合</p>
                          <p className="text-xs text-stone-500 mb-2 ml-2">次に該当する修繕又は模様替</p>
                          <div className="ml-4 mb-2">
                            <label className="flex items-center space-x-2 text-sm">
                              <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                checked={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon.windowInsulation}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxWorkTypes: {
                                    ...prev.reformTaxWorkTypes,
                                    additionalWorks: {
                                      ...prev.reformTaxWorkTypes.additionalWorks,
                                      work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, windowInsulation: e.target.checked } },
                                    },
                                  },
                                }))} />
                              <span>１　窓</span>
                            </label>
                          </div>
                          <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-4">
                            {([
                              ['ceilingInsulation', '２　天井等'],
                              ['wallInsulation', '３　壁'],
                              ['floorInsulation', '４　床等'],
                            ] as const).map(([key, label]) => (
                              <label key={key} className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                  checked={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon[key]}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, [key]: e.target.checked } },
                                      },
                                    },
                                  }))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 ml-4">
                            {([
                              ['certAuthority', '低炭素建築物新築等計画の認定主体'],
                              ['certNumber', '低炭素建築物新築等計画の認定番号'],
                              ['certDate', '低炭素建築物新築等計画の認定年月日'],
                            ] as const).map(([key, label]) => (
                              <div key={key}>
                                <label className="block text-xs text-stone-600 mb-1">{label}</label>
                                <input type={key === 'certDate' ? 'date' : 'text'}
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon[key]}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, [key]: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* C. 改修工事後の住宅の一定の省エネ性能が住宅性能評価書により証明される場合 */}
                        <div className="border-t border-stone-200 pt-3">
                          <p className="text-xs font-semibold text-stone-600 mb-2">改修工事後の住宅の一定の省エネ性能が住宅性能評価書により証明される場合</p>
                          <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次に該当する修繕若しくは模様替</p>
                          <div className="ml-4 mb-2">
                            <label className="flex items-center space-x-2 text-sm">
                              <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.windowInsulation}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxWorkTypes: {
                                    ...prev.reformTaxWorkTypes,
                                    additionalWorks: {
                                      ...prev.reformTaxWorkTypes.additionalWorks,
                                      work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, windowInsulation: e.target.checked } },
                                    },
                                  },
                                }))} />
                              <span>１　窓の断熱性を高める工事</span>
                            </label>
                          </div>
                          <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
                          <div className="space-y-1 ml-4">
                            {([
                              ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
                              ['wallInsulation', '３　壁の断熱性を高める工事'],
                              ['floorInsulation', '４　床等の断熱性を高める工事'],
                            ] as const).map(([key, label]) => (
                              <label key={key} className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                  checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval[key]}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, [key]: e.target.checked } },
                                      },
                                    },
                                  }))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                            <div className="flex flex-wrap gap-2">
                              {['1','2','3','4','5','6','7','8'].map(n => (
                                <label key={n} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.regionCode === n}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, regionCode: e.target.checked ? n : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>{n}地域</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 ml-4">
                            <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                            <div className="flex gap-3 mt-1">
                              {['1','2','3'].map(g => (
                                <label key={g} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.energyGradeBefore === g}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, energyGradeBefore: e.target.checked ? g : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>等級{g}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 ml-4">
                            <span className="text-xs font-semibold text-stone-700">改修工事後の断熱等性能等級</span>
                            <div className="flex gap-3 mt-1">
                              {[['1', '１　断熱等性能等級２'], ['2', '２　断熱等性能等級３'], ['3', '３　断熱等性能等級４以上']].map(([val, label]) => (
                                <label key={val} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.energyGradeAfter === val}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, energyGradeAfter: e.target.checked ? val : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 ml-4">
                            <p className="text-xs font-semibold text-stone-700 mb-2">住宅性能評価書を交付した登録住宅性能評価機関</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">名称</label>
                                <input type="text"
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalAgencyName}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalAgencyName: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                              </div>
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">登録番号</label>
                                <input type="text"
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalRegistrationNumber}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalRegistrationNumber: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">住宅性能評価書の交付番号</label>
                                <input type="text"
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalCertNumber}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalCertNumber: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                              </div>
                              <div>
                                <label className="block text-xs text-stone-600 mb-1">住宅性能評価書の交付年月日</label>
                                <input type="date"
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalCertDate}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalCertDate: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* D. 増改築による長期優良住宅建築等計画の認定により証明される場合 */}
                        <div className="border-t border-stone-200 pt-3">
                          <p className="text-xs font-semibold text-stone-600 mb-2">増改築による長期優良住宅建築等計画の認定により証明される場合</p>
                          <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次に該当する修繕若しくは模様替</p>
                          <div className="ml-4 mb-2">
                            <label className="flex items-center space-x-2 text-sm">
                              <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.windowInsulation}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxWorkTypes: {
                                    ...prev.reformTaxWorkTypes,
                                    additionalWorks: {
                                      ...prev.reformTaxWorkTypes.additionalWorks,
                                      work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, windowInsulation: e.target.checked } },
                                    },
                                  },
                                }))} />
                              <span>１　窓の断熱性を高める工事</span>
                            </label>
                          </div>
                          <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
                          <div className="space-y-1 ml-4">
                            {([
                              ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
                              ['wallInsulation', '３　壁の断熱性を高める工事'],
                              ['floorInsulation', '４　床等の断熱性を高める工事'],
                            ] as const).map(([key, label]) => (
                              <label key={key} className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                  checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert[key]}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, [key]: e.target.checked } },
                                      },
                                    },
                                  }))} />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                            <div className="flex flex-wrap gap-2">
                              {['1','2','3','4','5','6','7','8'].map(n => (
                                <label key={n} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.regionCode === n}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, regionCode: e.target.checked ? n : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>{n}地域</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 ml-4">
                            <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                            <div className="flex gap-3 mt-1">
                              {['1','2','3'].map(g => (
                                <label key={g} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.energyGradeBefore === g}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, energyGradeBefore: e.target.checked ? g : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>等級{g}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 ml-4">
                            <span className="text-xs font-semibold text-stone-700">改修工事後の住宅の断熱等性能等級</span>
                            <div className="flex gap-3 mt-1">
                              {[['1', '１　断熱等性能等級３'], ['2', '２　断熱等性能等級４以上']].map(([val, label]) => (
                                <label key={val} className="flex items-center space-x-1 text-xs">
                                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.energyGradeAfter === val}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxWorkTypes: {
                                        ...prev.reformTaxWorkTypes,
                                        additionalWorks: {
                                          ...prev.reformTaxWorkTypes.additionalWorks,
                                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, energyGradeAfter: e.target.checked ? val : '' } },
                                        },
                                      },
                                    }))} />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 ml-4">
                            {([
                              ['certAuthority', '長期優良住宅建築等計画の認定主体'],
                              ['certNumber', '長期優良住宅建築等計画の認定番号'],
                              ['certDate', '長期優良住宅建築等計画の認定年月日'],
                            ] as const).map(([key, label]) => (
                              <div key={key}>
                                <label className="block text-xs text-stone-600 mb-1">{label}</label>
                                <input type={key === 'certDate' ? 'date' : 'text'}
                                  value={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert[key]}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxWorkTypes: {
                                      ...prev.reformTaxWorkTypes,
                                      additionalWorks: {
                                        ...prev.reformTaxWorkTypes.additionalWorks,
                                        work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, [key]: e.target.value } },
                                      },
                                    },
                                  }))}
                                  className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* === 所得税控除用フォーム（housing_loan, resale） === */}
              {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') && (
              <>
              {/* 第1号工事 */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-3">第1号工事</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['extension', '1 増築'],
                    ['renovation', '2 改築'],
                    ['majorRepair', '3 大規模の修繕'],
                    ['majorRemodeling', '4 大規模の模様替'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox"
                        checked={formData.housingLoanWorkTypes.work1?.[key] ?? false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          housingLoanWorkTypes: {
                            ...prev.housingLoanWorkTypes,
                            work1: { ...defaultWork1, ...prev.housingLoanWorkTypes.work1, [key]: e.target.checked },
                          },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第2号工事 */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-1">第2号工事</h3>
                <p className="text-xs text-stone-500 mb-3">1棟の家屋で区分所有する部分について行う次のいずれかに該当する修繕又は模様替</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    ['floorOverHalf', '1 床の過半の修繕又は模様替'],
                    ['stairOverHalf', '2 階段の過半の修繕又は模様替'],
                    ['partitionOverHalf', '3 間仕切壁の過半の修繕又は模様替'],
                    ['wallOverHalf', '4 壁の過半の修繕又は模様替'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox"
                        checked={formData.housingLoanWorkTypes.work2?.[key] ?? false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          housingLoanWorkTypes: {
                            ...prev.housingLoanWorkTypes,
                            work2: { ...defaultWork2, ...prev.housingLoanWorkTypes.work2, [key]: e.target.checked },
                          },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第3号工事 */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-1">第3号工事</h3>
                <p className="text-xs text-stone-500 mb-3">次のいずれか一室の床又は壁の全部の修繕又は模様替</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['livingRoom', '1 居室'],
                    ['kitchen', '2 調理室'],
                    ['bathroom', '3 浴室'],
                    ['toilet', '4 便所'],
                    ['washroom', '5 洗面所'],
                    ['storage', '6 納戸'],
                    ['entrance', '7 玄関'],
                    ['corridor', '8 廊下'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox"
                        checked={formData.housingLoanWorkTypes.work3?.[key] ?? false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          housingLoanWorkTypes: {
                            ...prev.housingLoanWorkTypes,
                            work3: { ...defaultWork3, ...prev.housingLoanWorkTypes.work3, [key]: e.target.checked },
                          },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第4号工事（耐震改修工事） */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-1">第4号工事（耐震改修工事）</h3>
                <p className="text-xs text-stone-500 mb-3">次の規定又は基準に適合させるための修繕又は模様替</p>
                <div className="grid grid-cols-1 gap-3">
                  {([
                    ['buildingStandard', '1 建築基準法施行令第3章及び第5章の4の規定'],
                    ['earthquakeSafety', '2 地震に対する安全性に係る基準'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox"
                        checked={formData.housingLoanWorkTypes.work4?.[key] ?? false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          housingLoanWorkTypes: {
                            ...prev.housingLoanWorkTypes,
                            work4: { ...defaultWork4, ...prev.housingLoanWorkTypes.work4, [key]: e.target.checked },
                          },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第5号工事（バリアフリー改修工事） */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-1">第5号工事（バリアフリー改修工事）</h3>
                <p className="text-xs text-stone-500 mb-3">高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための修繕又は模様替</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    ['pathwayExpansion', '1 通路又は出入口の拡幅'],
                    ['stairSlope', '2 階段の勾配の緩和'],
                    ['bathroomImprovement', '3 浴室の改良'],
                    ['toiletImprovement', '4 便所の改良'],
                    ['handrails', '5 手すりの取付'],
                    ['stepElimination', '6 床の段差の解消'],
                    ['doorImprovement', '7 出入口の戸の改良'],
                    ['floorSlipPrevention', '8 床材の取替'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox"
                        checked={formData.housingLoanWorkTypes.work5?.[key] ?? false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          housingLoanWorkTypes: {
                            ...prev.housingLoanWorkTypes,
                            work5: { ...defaultWork5, ...prev.housingLoanWorkTypes.work5, [key]: e.target.checked },
                          },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第6号工事（省エネ改修工事） */}
              <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
                <h3 className="font-bold text-sm mb-3">第6号工事（省エネ改修工事）</h3>

                <div className="mb-4">
                  <p className="text-xs text-stone-500 mb-2">エネルギーの使用の合理化に著しく資する修繕若しくは模様替</p>
                  <div className="space-y-2 ml-2">
                    {([
                      ['allWindowsInsulation', '1 全ての居室の全ての窓の断熱性を高める工事'],
                      ['allRoomsWindowsInsulation', '2 全ての居室の全ての窓の断熱性を相当程度高める工事'],
                      ['allRoomsFloorCeilingInsulation', '3 全ての居室の全ての窓の断熱性を著しく高める工事'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox"
                          checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.[key] ?? false}
                          onChange={(e) => setFormData(prev => {
                            const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                            return {
                              ...prev,
                              housingLoanWorkTypes: {
                                ...prev.housingLoanWorkTypes,
                                work6: {
                                  ...currentWork6,
                                  energyEfficiency: {
                                    ...currentWork6.energyEfficiency,
                                    [key]: e.target.checked,
                                  },
                                },
                              },
                            };
                          })}
                          className="w-4 h-4 text-amber-600 rounded" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-stone-500 mb-2">上記1から3のいずれかと併せて行う次のいずれかに該当する修繕又は模様替</p>
                  <div className="space-y-2 ml-2">
                    {([
                      ['combinedCeilingInsulation', '4 天井等の断熱性を高める工事'],
                      ['combinedWallInsulation', '5 壁の断熱性を高める工事'],
                      ['combinedFloorInsulation', '6 床等の断熱性を高める工事'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox"
                          checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.[key] ?? false}
                          onChange={(e) => setFormData(prev => {
                            const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                            return {
                              ...prev,
                              housingLoanWorkTypes: {
                                ...prev.housingLoanWorkTypes,
                                work6: {
                                  ...currentWork6,
                                  energyEfficiency: {
                                    ...currentWork6.energyEfficiency,
                                    [key]: e.target.checked,
                                  },
                                },
                              },
                            };
                          })}
                          className="w-4 h-4 text-amber-600 rounded" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-stone-500 mb-2">地域区分</p>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 ml-2">
                    {([1,2,3,4,5,6,7,8] as const).map((n) => {
                      const key = `region${n}` as keyof typeof defaultWork6.energyEfficiency;
                      return (
                        <label key={n} className="flex items-center space-x-1 text-sm">
                          <input type="checkbox"
                            checked={(formData.housingLoanWorkTypes.work6?.energyEfficiency as Record<string, boolean | string | undefined>)?.[key] === true}
                            onChange={(e) => setFormData(prev => {
                              const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                              return {
                                ...prev,
                                housingLoanWorkTypes: {
                                  ...prev.housingLoanWorkTypes,
                                  work6: {
                                    ...currentWork6,
                                    energyEfficiency: {
                                      ...currentWork6.energyEfficiency,
                                      [key]: e.target.checked,
                                    },
                                  },
                                },
                              };
                            })}
                            className="w-4 h-4 text-amber-600 rounded" />
                          <span>{n}地域</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-stone-500 mb-2">改修工事前の住宅が相当する断熱等性能等級</p>
                  <div className="flex gap-4 ml-2">
                    {['1', '2', '3'].map((grade) => (
                      <label key={grade} className="flex items-center space-x-1 text-sm">
                        <input type="radio" name="energyGradeBefore"
                          value={grade}
                          checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.energyGradeBefore === grade}
                          onChange={() => setFormData(prev => {
                            const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                            return {
                              ...prev,
                              housingLoanWorkTypes: {
                                ...prev.housingLoanWorkTypes,
                                work6: {
                                  ...currentWork6,
                                  energyEfficiency: {
                                    ...currentWork6.energyEfficiency,
                                    energyGradeBefore: grade,
                                  },
                                },
                              },
                            };
                          })}
                          className="w-4 h-4 text-amber-600" />
                        <span>等級{grade}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* ステップ3: (2) 実施した工事の内容 */}
          {currentStep === 3 && (
            <div>
              {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-semibold text-amber-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-amber-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">（２）実施した工事の内容</h2>
              <p className="text-sm text-stone-600 mb-6">
                実施した増改築等の内容を記入してください。
              </p>

              <textarea
                value={formData.workDescriptions['_all'] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workDescriptions: { ...prev.workDescriptions, '_all': e.target.value },
                }))}
                rows={8}
                className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="例：居室の窓の断熱改修工事（内窓の設置）、天井・壁・床の断熱改修工事（断熱材の施工）等"
              />
            </div>
          )}

          {/* ステップ4: (3) 実施した工事の費用の額等 */}
          {currentStep === 4 && (
            <div>
              {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-semibold text-amber-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-amber-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}

              {/* housing_loan / resale: 公式様式の①②③ */}
              {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') ? (
                <div>
                  <h2 className="text-xl font-bold mb-2">（３）実施した工事の費用の額等</h2>
                  <p className="text-sm text-stone-600 mb-6">
                    公式様式に準拠した費用項目を入力してください。
                  </p>

                  <div className="space-y-6">
                    {/* ① 費用の額 */}
                    <div className="p-4 border border-stone-200 rounded-2xl">
                      <label className="block text-sm font-semibold text-stone-800 mb-1">
                        ① 第１号工事～第６号工事に要した費用の額
                      </label>
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="number"
                          min={0}
                          value={formData.housingLoanCost.totalCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            housingLoanCost: { ...prev.housingLoanCost, totalCost: parseInt(e.target.value) || 0 },
                          }))}
                          className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="0"
                        />
                        <span className="text-sm text-stone-600">円</span>
                      </div>
                    </div>

                    {/* ② 補助金等の交付の有無 */}
                    <div className="p-4 border border-stone-200 rounded-2xl">
                      <label className="block text-sm font-semibold text-stone-800 mb-3">
                        ② 第１号工事～第６号工事に係る補助金等の交付の有無
                      </label>
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="housingLoanSubsidy"
                            checked={formData.housingLoanCost.hasSubsidy}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              housingLoanCost: { ...prev.housingLoanCost, hasSubsidy: true },
                            }))}
                            className="w-4 h-4"
                          />
                          有
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="housingLoanSubsidy"
                            checked={!formData.housingLoanCost.hasSubsidy}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              housingLoanCost: { ...prev.housingLoanCost, hasSubsidy: false, subsidyAmount: 0 },
                            }))}
                            className="w-4 h-4"
                          />
                          無
                        </label>
                      </div>
                      {formData.housingLoanCost.hasSubsidy && (
                        <div className="pl-4 border-l-2 border-stone-300">
                          <label className="block text-sm text-stone-700 mb-1">
                            「有」の場合　交付される補助金等の額
                          </label>
                          <div className="flex items-center gap-2 max-w-md">
                            <input
                              type="number"
                              min={0}
                              value={formData.housingLoanCost.subsidyAmount || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                housingLoanCost: { ...prev.housingLoanCost, subsidyAmount: parseInt(e.target.value) || 0 },
                              }))}
                              className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0"
                            />
                            <span className="text-sm text-stone-600">円</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ③ 控除対象額（自動計算） */}
                    {(() => {
                      const cost = formData.housingLoanCost;
                      const deductible = Math.max(0, cost.totalCost - (cost.hasSubsidy ? cost.subsidyAmount : 0));
                      const over100man = deductible > 1000000;
                      return (
                        <div className={`p-4 border rounded-2xl ${over100man ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}>
                          <label className="block text-sm font-semibold text-stone-800 mb-1">
                            ③ ①から②を差し引いた額（100万円を超える場合）
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-stone-900">
                              {deductible.toLocaleString()}
                            </span>
                            <span className="text-sm text-stone-600">円</span>
                          </div>
                          {!over100man && cost.totalCost > 0 && (
                            <p className="mt-2 text-xs text-amber-600">
                              ※ 100万円以下のため、住宅借入金等特別税額控除の対象外です。
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : formData.purposeType === 'reform_tax' ? (
                /* reform_tax: 公式様式準拠の費用フォーム */
                (() => {
                  const rc = formData.reformTaxCost;
                  const wt = formData.reformTaxWorkTypes;
                  const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');

                  // 各カテゴリのウ・エ・オ自動計算
                  const calc = (cat: ReformTaxCostCategory, limit: number, needOver50: boolean) => {
                    const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
                    const afterSub = cat.totalAmount - sub;
                    const deductible = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
                    const maxDed = limit > 0 ? Math.min(deductible, limit) : deductible;
                    const excess = Math.max(0, deductible - maxDed);
                    return { afterSub, deductible, maxDed, excess };
                  };

                  const seismicCalc = calc(rc.seismic, 2_500_000, false);
                  const bfCalc = calc(rc.barrierFree, 2_000_000, true);
                  const energyLimit = hasSolar ? 3_500_000 : 2_500_000;
                  const esCalc = calc(rc.energySaving, energyLimit, true);
                  const cohabCalc = calc(rc.cohabitation, 2_500_000, true);
                  const ccCalc = calc(rc.childcare, 2_500_000, true);

                  // ⑳ その他増改築等（第1号～第6号工事）
                  const orCat = rc.otherRenovation;
                  const orSub = orCat.hasSubsidy ? orCat.subsidyAmount : 0;
                  const orAfterSub = Math.max(0, orCat.totalAmount - orSub);

                  // ⑤ compound calc (OR: 耐震又は省エネ)
                  const lt5 = rc.longTermOr;
                  const lt5BaseSub = lt5.baseHasSubsidy ? lt5.baseSubsidyAmount : 0;
                  const lt5BaseAfter = lt5.baseTotalAmount - lt5BaseSub;
                  const lt5BaseDed = lt5BaseAfter > 500_000 ? lt5BaseAfter : 0;
                  const lt5DurSub = lt5.durabilityHasSubsidy ? lt5.durabilitySubsidyAmount : 0;
                  const lt5DurAfter = lt5.durabilityTotalAmount - lt5DurSub;
                  const lt5DurDed = lt5DurAfter > 500_000 ? lt5DurAfter : 0;
                  const lt5Ki = lt5BaseDed + lt5DurDed;
                  const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
                  const lt5Ku = Math.min(lt5Ki, lt5Limit);
                  const lt5Ke = Math.max(0, lt5Ki - lt5Ku);

                  // ⑥ compound calc (AND: 耐震及び省エネ)
                  const lt6 = rc.longTermAnd;
                  const lt6SesSub = lt6.seismicHasSubsidy ? lt6.seismicSubsidyAmount : 0;
                  const lt6SesAfter = lt6.seismicTotalAmount - lt6SesSub;
                  const lt6SesDed = lt6SesAfter > 500_000 ? lt6SesAfter : 0;
                  const lt6EnSub = lt6.energyHasSubsidy ? lt6.energySubsidyAmount : 0;
                  const lt6EnAfter = lt6.energyTotalAmount - lt6EnSub;
                  const lt6EnDed = lt6EnAfter > 500_000 ? lt6EnAfter : 0;
                  const lt6DurSub = lt6.durabilityHasSubsidy ? lt6.durabilitySubsidyAmount : 0;
                  const lt6DurAfter = lt6.durabilityTotalAmount - lt6DurSub;
                  const lt6DurDed = lt6DurAfter > 500_000 ? lt6DurAfter : 0;
                  const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
                  const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
                  const lt6Sa = Math.min(lt6Ko, lt6Limit);
                  const lt6Shi = Math.max(0, lt6Ko - lt6Sa);

                  // ⑧⑨⑩ パターン1: ①+②+③+④+⑦
                  const p1Ded = seismicCalc.deductible + bfCalc.deductible + esCalc.deductible + cohabCalc.deductible + ccCalc.deductible;
                  const p1Max = seismicCalc.maxDed + bfCalc.maxDed + esCalc.maxDed + cohabCalc.maxDed + ccCalc.maxDed;
                  const p1Exc = seismicCalc.excess + bfCalc.excess + esCalc.excess + cohabCalc.excess + ccCalc.excess;
                  // ⑪⑫⑬ パターン2: ②+④+⑤キ/ク/ケ+⑦ (OR)
                  const p2Ded = bfCalc.deductible + cohabCalc.deductible + lt5Ki + ccCalc.deductible;
                  const p2Max = bfCalc.maxDed + cohabCalc.maxDed + lt5Ku + ccCalc.maxDed;
                  const p2Exc = bfCalc.excess + cohabCalc.excess + lt5Ke + ccCalc.excess;
                  // ⑭⑮⑯ パターン3: ②+④+⑥コ/サ/シ+⑦ (AND)
                  const p3Ded = bfCalc.deductible + cohabCalc.deductible + lt6Ko + ccCalc.deductible;
                  const p3Max = bfCalc.maxDed + cohabCalc.maxDed + lt6Sa + ccCalc.maxDed;
                  const p3Exc = bfCalc.excess + cohabCalc.excess + lt6Shi + ccCalc.excess;

                  // ⑰⑱⑲ 最大値選択
                  const r17 = Math.min(Math.max(p1Max, p2Max, p3Max), 10_000_000);
                  const r18 = Math.max(p1Ded, p2Ded, p3Ded);
                  let r19: number;
                  if (r18 === p3Ded && p3Ded > 0) r19 = p3Exc;
                  else if (r18 === p2Ded && p2Ded > 0) r19 = p2Exc;
                  else r19 = p1Exc;

                  // ㉑㉒㉓ 最終計算 — ㉑ = MIN(⑱, ⑲ + ⑳ウ)
                  const r21 = r18 <= 0 ? 0 : Math.min(r18, r19 + orAfterSub);
                  const r22 = Math.max(0, 10_000_000 - r17);
                  const r23 = Math.min(r21, r22);

                  // カテゴリ入力フォームの共通レンダラー
                  // カテゴリ → 計算ページの対応
                  const calcPageMap: Record<string, string> = {
                    seismic: '/seismic-reform',
                    barrierFree: '/barrier-free-reform',
                    energySaving: '/energy-saving-reform',
                    cohabitation: '/cohabitation-reform',
                    childcare: '/childcare-reform',
                    otherRenovation: '/other-renovation',
                  };

                  const renderCategory = (
                    key: 'seismic' | 'barrierFree' | 'energySaving' | 'cohabitation' | 'childcare',
                    label: string,
                    calcResult: { afterSub: number; deductible: number; maxDed: number; excess: number },
                    limitLabel: string,
                    needOver50: boolean,
                  ) => {
                    const cat = rc[key] as ReformTaxCostCategory;
                    return (
                      <div key={key} className="p-4 border border-stone-200 rounded-2xl">
                        <h4 className="font-bold text-sm mb-3">{label}</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-stone-700">ア　標準的な費用の額</label>
                              {calcPageMap[key] && (
                                <a href={calcPageMap[key]} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-amber-600 hover:text-amber-800 underline">計算ページへ →</a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 max-w-sm">
                              <input type="number" min={0}
                                value={cat.totalAmount || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxCost: {
                                    ...prev.reformTaxCost,
                                    [key]: { ...prev.reformTaxCost[key], totalAmount: parseInt(e.target.value) || 0 },
                                  },
                                }))}
                                className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                                placeholder="0" />
                              <span className="text-sm text-stone-600">円</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">イ　補助金等の交付の有無</label>
                            <div className="flex items-center gap-4 mb-2">
                              <label className="flex items-center gap-1 text-sm">
                                <input type="radio" checked={cat.hasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], hasSubsidy: true } },
                                  }))}
                                  className="w-4 h-4" />
                                有
                              </label>
                              <label className="flex items-center gap-1 text-sm">
                                <input type="radio" checked={!cat.hasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], hasSubsidy: false, subsidyAmount: 0 } },
                                  }))}
                                  className="w-4 h-4" />
                                無
                              </label>
                            </div>
                            {cat.hasSubsidy && (
                              <div className="pl-4 border-l-2 border-stone-300">
                                <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                                <div className="flex items-center gap-2 max-w-sm">
                                  <input type="number" min={0}
                                    value={cat.subsidyAmount || ''}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], subsidyAmount: parseInt(e.target.value) || 0 } },
                                    }))}
                                    className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                                    placeholder="0" />
                                  <span className="text-sm text-stone-600">円</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-stone-600">ウ　アからイを差し引いた額{needOver50 ? '（50万円を超える場合）' : ''}</span>
                              <span className={`font-medium ${needOver50 && calcResult.afterSub > 0 && calcResult.deductible === 0 ? 'text-amber-600' : ''}`}>
                                {calcResult.deductible.toLocaleString()}円
                                {needOver50 && calcResult.afterSub > 0 && calcResult.deductible === 0 && ' (50万円以下)'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">エ　ウと{limitLabel}のうちいずれか少ない金額</span>
                              <span className="font-medium">{calcResult.maxDed.toLocaleString()}円</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">オ　ウからエを差し引いた額</span>
                              <span className="font-medium">{calcResult.excess.toLocaleString()}円</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  // compound input helper
                  const renderCompoundInput = (
                    compoundKey: 'longTermOr' | 'longTermAnd',
                    field: string,
                    label: string,
                  ) => {
                    const val = (rc[compoundKey] as Record<string, number | boolean>)[field];
                    if (typeof val === 'boolean') return null;
                    return (
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">{label}</label>
                        <div className="flex items-center gap-2 max-w-sm">
                          <input type="number" min={0}
                            value={(val as number) || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxCost: {
                                ...prev.reformTaxCost,
                                [compoundKey]: { ...prev.reformTaxCost[compoundKey], [field]: parseInt(e.target.value) || 0 },
                              },
                            }))}
                            className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                            placeholder="0" />
                          <span className="text-sm text-stone-600">円</span>
                        </div>
                      </div>
                    );
                  };

                  const renderCompoundSubsidy = (
                    compoundKey: 'longTermOr' | 'longTermAnd',
                    hasField: string,
                    amountField: string,
                    label: string,
                  ) => {
                    const hasSub = (rc[compoundKey] as Record<string, number | boolean>)[hasField] as boolean;
                    return (
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">{label}</label>
                        <div className="flex items-center gap-4 mb-2">
                          <label className="flex items-center gap-1 text-sm">
                            <input type="radio" checked={hasSub}
                              onChange={() => setFormData(prev => ({
                                ...prev,
                                reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [hasField]: true } },
                              }))}
                              className="w-4 h-4" />
                            有
                          </label>
                          <label className="flex items-center gap-1 text-sm">
                            <input type="radio" checked={!hasSub}
                              onChange={() => setFormData(prev => ({
                                ...prev,
                                reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [hasField]: false, [amountField]: 0 } },
                              }))}
                              className="w-4 h-4" />
                            無
                          </label>
                        </div>
                        {hasSub && (
                          <div className="pl-4 border-l-2 border-stone-300">
                            <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                            <div className="flex items-center gap-2 max-w-sm">
                              <input type="number" min={0}
                                value={((rc[compoundKey] as Record<string, number | boolean>)[amountField] as number) || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [amountField]: parseInt(e.target.value) || 0 } },
                                }))}
                                className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                                placeholder="0" />
                              <span className="text-sm text-stone-600">円</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div>
                      <h2 className="text-xl font-bold mb-2">（３）費用の額等</h2>
                      <p className="text-sm text-stone-600 mb-6">
                        工事カテゴリ別の費用と補助金を入力してください。控除対象額・上限適用・超過額は自動計算されます。
                      </p>

                      <div className="space-y-4">
                        {renderCategory('seismic', '① 住宅耐震改修', seismicCalc, '250万円', false)}
                        {renderCategory('barrierFree', '② 高齢者等居住改修工事等', bfCalc, '200万円', true)}
                        <div>
                          {renderCategory('energySaving', '③ 一般断熱改修工事等', esCalc, `${hasSolar ? '350' : '250'}万円`, true)}
                          <div className="mt-2 ml-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox"
                                checked={rc.energySaving.hasSolarPower}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  reformTaxCost: { ...prev.reformTaxCost, energySaving: { ...prev.reformTaxCost.energySaving, hasSolarPower: e.target.checked } },
                                }))}
                                className="w-4 h-4 text-amber-600 rounded" />
                              <span className="text-stone-700">太陽光発電設備を設置（上限350万円に変更）</span>
                            </label>
                          </div>
                        </div>
                        {renderCategory('cohabitation', '④ 多世帯同居改修工事等', cohabCalc, '250万円', true)}

                        {/* ⑤ 耐久性向上改修工事等（OR: いずれかと併せて） */}
                        <div className="p-4 border border-stone-200 rounded-2xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm">⑤ 耐久性向上改修工事等（対象住宅耐震改修又は対象一般断熱改修工事等のいずれかと併せて行う場合）</h4>
                            <a href="/long-term-housing" target="_blank" rel="noopener noreferrer"
                              className="text-xs text-amber-600 hover:text-amber-800 underline whitespace-nowrap ml-2">計算ページへ →</a>
                          </div>
                          <div className="space-y-3">
                            {renderCompoundInput('longTermOr', 'baseTotalAmount', 'ア　当該住宅耐震改修又は当該一般断熱改修工事等に係る標準的な費用の額')}
                            {renderCompoundSubsidy('longTermOr', 'baseHasSubsidy', 'baseSubsidyAmount', 'イ　当該住宅耐震改修又は当該一般断熱改修工事等に係る補助金等の交付の有無')}
                            <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">ウ　アからイを差し引いた額（50万円を超える場合）</span>
                                <span className="font-medium">{lt5BaseDed.toLocaleString()}円</span>
                              </div>
                            </div>
                            {renderCompoundInput('longTermOr', 'durabilityTotalAmount', 'エ　当該耐久性向上改修工事等に係る標準的な費用の額')}
                            {renderCompoundSubsidy('longTermOr', 'durabilityHasSubsidy', 'durabilitySubsidyAmount', 'オ　当該耐久性向上改修工事等に係る補助金等の交付の有無')}
                            <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">カ　エからオを差し引いた額（50万円を超える場合）</span>
                                <span className="font-medium">{lt5DurDed.toLocaleString()}円</span>
                              </div>
                            </div>
                            <div className="bg-amber-50 rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-700 font-medium">キ　ウ及びカの合計額</span>
                                <span className="font-bold">{lt5Ki.toLocaleString()}円</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">ク　キと{hasSolar ? '350' : '250'}万円のうちいずれか少ない金額</span>
                                <span className="font-medium">{lt5Ku.toLocaleString()}円</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">ケ　キからクを差し引いた額</span>
                                <span className="font-medium">{lt5Ke.toLocaleString()}円</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ⑥ 耐久性向上改修工事等（AND: 両方と併せて） */}
                        <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-2xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm">⑥ 耐久性向上改修工事等（対象住宅耐震改修及び対象一般断熱改修工事等の両方と併せて行う場合）</h4>
                            <a href="/long-term-housing" target="_blank" rel="noopener noreferrer"
                              className="text-xs text-amber-600 hover:text-amber-800 underline whitespace-nowrap ml-2">計算ページへ →</a>
                          </div>
                          <div className="space-y-3">
                            {renderCompoundInput('longTermAnd', 'seismicTotalAmount', 'ア　当該住宅耐震改修に係る標準的な費用の額')}
                            {renderCompoundSubsidy('longTermAnd', 'seismicHasSubsidy', 'seismicSubsidyAmount', 'イ　当該住宅耐震改修に係る補助金等の交付の有無')}
                            <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">ウ　アからイを差し引いた額（50万円を超える場合）</span>
                                <span className="font-medium">{lt6SesDed.toLocaleString()}円</span>
                              </div>
                            </div>
                            {renderCompoundInput('longTermAnd', 'energyTotalAmount', 'エ　当該一般断熱改修工事等に係る標準的な費用の額')}
                            {renderCompoundSubsidy('longTermAnd', 'energyHasSubsidy', 'energySubsidyAmount', 'オ　当該一般断熱改修工事等に係る補助金等の交付の有無')}
                            <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">カ　エからオを差し引いた額（50万円を超える場合）</span>
                                <span className="font-medium">{lt6EnDed.toLocaleString()}円</span>
                              </div>
                            </div>
                            {renderCompoundInput('longTermAnd', 'durabilityTotalAmount', 'キ　当該耐久性向上改修工事等に係る標準的な費用の額')}
                            {renderCompoundSubsidy('longTermAnd', 'durabilityHasSubsidy', 'durabilitySubsidyAmount', 'ク　当該耐久性向上改修工事等に係る補助金等の交付の有無')}
                            <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">ケ　キからクを差し引いた額（50万円を超える場合）</span>
                                <span className="font-medium">{lt6DurDed.toLocaleString()}円</span>
                              </div>
                            </div>
                            <div className="bg-emerald-100 rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-700 font-medium">コ　ウ、カ及びケの合計額</span>
                                <span className="font-bold">{lt6Ko.toLocaleString()}円</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">サ　コと{hasSolar ? '600' : '500'}万円のうちいずれか少ない金額</span>
                                <span className="font-medium">{lt6Sa.toLocaleString()}円</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-600">シ　コからサを差し引いた額</span>
                                <span className="font-medium">{lt6Shi.toLocaleString()}円</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {renderCategory('childcare', '⑦ 子育て対応改修工事等', ccCalc, '250万円', true)}

                        {/* ⑳ その他増改築等（第1号～第6号工事） */}
                        <div className="p-4 border border-stone-200 rounded-2xl">
                          <h4 className="font-bold text-sm mb-3">⑳ 改修工事と併せて行われた第1号工事～第6号工事</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-stone-700">ア　第1号工事～第6号工事に要した費用の額</label>
                                <a href="/other-renovation" target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-amber-600 hover:text-amber-800 underline">計算ページへ →</a>
                              </div>
                              <div className="flex items-center gap-2 max-w-sm">
                                <input type="number" min={0}
                                  value={orCat.totalAmount || ''}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    reformTaxCost: {
                                      ...prev.reformTaxCost,
                                      otherRenovation: { ...prev.reformTaxCost.otherRenovation, totalAmount: parseInt(e.target.value) || 0 },
                                    },
                                  }))}
                                  className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                                  placeholder="0" />
                                <span className="text-sm text-stone-600">円</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-stone-700 mb-1">イ　補助金等の交付の有無</label>
                              <div className="flex items-center gap-4 mb-2">
                                <label className="flex items-center gap-1 text-sm">
                                  <input type="radio" checked={orCat.hasSubsidy}
                                    onChange={() => setFormData(prev => ({
                                      ...prev,
                                      reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, hasSubsidy: true } },
                                    }))}
                                    className="w-4 h-4" />
                                  有
                                </label>
                                <label className="flex items-center gap-1 text-sm">
                                  <input type="radio" checked={!orCat.hasSubsidy}
                                    onChange={() => setFormData(prev => ({
                                      ...prev,
                                      reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, hasSubsidy: false, subsidyAmount: 0 } },
                                    }))}
                                    className="w-4 h-4" />
                                  無
                                </label>
                              </div>
                              {orCat.hasSubsidy && (
                                <div className="pl-4 border-l-2 border-stone-300">
                                  <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                                  <div className="flex items-center gap-2 max-w-sm">
                                    <input type="number" min={0}
                                      value={orCat.subsidyAmount || ''}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, subsidyAmount: parseInt(e.target.value) || 0 } },
                                      }))}
                                      className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                                      placeholder="0" />
                                    <span className="text-sm text-stone-600">円</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-stone-600">ウ　アからイを差し引いた額</span>
                                <span className="font-medium">{orAfterSub.toLocaleString()}円</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ⑧-⑲ パターン比較 */}
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <h4 className="font-bold text-sm mb-3">パターン比較（自動計算）</h4>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-4 gap-2 font-medium text-stone-600 text-xs border-b pb-1">
                            <div></div><div className="text-right">ウ合計</div><div className="text-right">エ合計</div><div className="text-right">オ合計</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="text-stone-700">⑧⑨⑩ P1</div>
                            <div className="text-right">{p1Ded.toLocaleString()}</div>
                            <div className="text-right">{p1Max.toLocaleString()}</div>
                            <div className="text-right">{p1Exc.toLocaleString()}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="text-stone-700">⑪⑫⑬ P2 (⑤)</div>
                            <div className="text-right">{p2Ded.toLocaleString()}</div>
                            <div className="text-right">{p2Max.toLocaleString()}</div>
                            <div className="text-right">{p2Exc.toLocaleString()}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="text-stone-700">⑭⑮⑯ P3 (⑥)</div>
                            <div className="text-right">{p3Ded.toLocaleString()}</div>
                            <div className="text-right">{p3Max.toLocaleString()}</div>
                            <div className="text-right">{p3Exc.toLocaleString()}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 border-t pt-1 font-semibold">
                            <div>⑰⑱⑲ 最大</div>
                            <div className="text-right">{r18.toLocaleString()}</div>
                            <div className="text-right">{r17.toLocaleString()}</div>
                            <div className="text-right">{r19.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* ㉑㉒㉓ 最終計算 */}
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <h4 className="font-bold text-sm mb-3">最終控除額計算</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-700">㉑ MIN(⑱, ⑲ + ⑳ウ)</span>
                            <span className="font-medium">{r21.toLocaleString()}円</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-700">㉒ 残り控除可能額（1,000万 - ⑰）</span>
                            <span className="font-medium">{r22.toLocaleString()}円</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-bold">
                            <span>㉓ 5%控除分 = MIN(㉑, ㉒)</span>
                            <span className="text-emerald-700">{r23.toLocaleString()}円</span>
                          </div>
                          <div className="mt-2 pt-2 border-t text-xs text-stone-600">
                            <div>10%控除対象: {r17.toLocaleString()}円 → 税額控除: {Math.round(r17 * 0.1).toLocaleString()}円</div>
                            <div>5%控除対象: {r23.toLocaleString()}円 → 税額控除: {Math.round(r23 * 0.05).toLocaleString()}円</div>
                            <div className="font-semibold mt-1">合計税額控除: {(Math.round(r17 * 0.1) + Math.round(r23 * 0.05)).toLocaleString()}円</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* その他の用途: 従来の詳細費用計算 */
                <CostCalculationStep
                  selectedWorkTypes={effectiveWorkTypes}
                  formState={formData.workDataForm}
                  onChange={(workDataForm) => setFormData(prev => ({ ...prev, workDataForm }))}
                />
              )}
            </div>
          )}

          {/* ステップ5: 証明者情報 */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-4">証明者情報</h2>
              <IssuerInfoForm
                issuerInfo={formData.issuerInfo}
                onChange={(newIssuerInfo) => setFormData({ ...formData, issuerInfo: newIssuerInfo })}
              />
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-stone-700 mb-1">発行日 *</label>
                <input type="date" value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="max-w-md w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
            </div>
          )}

          {/* ステップ6: 確認・保存 */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-xl font-bold mb-4">確認と保存</h2>

              <div className="space-y-4">
                {/* 基本情報プレビュー */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">基本情報</h3>
                    <button type="button" onClick={() => goToStep(1)} className="text-xs text-amber-600">編集</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-stone-500">氏名:</span> {formData.applicantName || '(未入力)'}</div>
                    <div><span className="text-stone-500">住所:</span> {(formData.applicantAddress + (formData.applicantAddressDetail || '')) || '(未入力)'}</div>
                    <div><span className="text-stone-500">所在地:</span> {formData.propertyAddress || '(未入力)'}</div>
                    <div><span className="text-stone-500">完了日:</span> {formData.completionDate || '(未入力)'}</div>
                  </div>
                </div>

                {/* (1) 工事種別プレビュー */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">(1) 実施した工事の種別</h3>
                    <button type="button" onClick={() => goToStep(2)} className="text-xs text-amber-600">編集</button>
                  </div>
                  <p className="text-sm">
                    {formData.purposeType
                      ? `${PURPOSE_SECTION_INFO[formData.purposeType as PurposeType]?.sectionNumber || ''}．入力済み`
                      : '(未選択)'}
                  </p>
                </div>

                {/* (2) 工事内容記述プレビュー */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">(2) 実施した工事の内容</h3>
                    <button type="button" onClick={() => goToStep(3)} className="text-xs text-amber-600">編集</button>
                  </div>
                  {formData.workDescriptions['_all'] ? (
                    <p className="text-sm whitespace-pre-wrap">{formData.workDescriptions['_all']}</p>
                  ) : (
                    <p className="text-sm text-stone-500">(未入力)</p>
                  )}
                </div>

                {/* (3) 費用サマリープレビュー */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">(3) 工事の費用の額</h3>
                    <button type="button" onClick={() => goToStep(4)} className="text-xs text-amber-600">編集</button>
                  </div>
                  {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') ? (
                    (() => {
                      const hlCost = formData.housingLoanCost;
                      const sub = hlCost.hasSubsidy ? hlCost.subsidyAmount : 0;
                      const deductible = Math.max(0, hlCost.totalCost - sub);
                      return hlCost.totalCost > 0 ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-600">① 費用の額:</span>
                            <span>{hlCost.totalCost.toLocaleString()}円</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600">② 補助金:</span>
                            <span>{hlCost.hasSubsidy ? `${sub.toLocaleString()}円` : 'なし'}</span>
                          </div>
                          <div className="pt-2 border-t font-semibold flex justify-between">
                            <span>③ 控除対象額:</span>
                            <span>{deductible.toLocaleString()}円</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">(費用データなし)</p>
                      );
                    })()
                  ) : formData.purposeType === 'reform_tax' ? (
                    (() => {
                      const rc = formData.reformTaxCost;
                      const wt = formData.reformTaxWorkTypes;
                      const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');

                      const calcCat = (cat: { totalAmount: number; hasSubsidy: boolean; subsidyAmount: number }, limit: number, needOver50: boolean) => {
                        const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
                        const afterSub = cat.totalAmount - sub;
                        const ded = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
                        const maxD = limit > 0 ? Math.min(ded, limit) : ded;
                        return { total: cat.totalAmount, maxDed: maxD };
                      };

                      const cats: { label: string; result: { total: number; maxDed: number } }[] = [];
                      if (rc.seismic.totalAmount > 0) cats.push({ label: '① 住宅耐震改修', result: calcCat(rc.seismic, 2_500_000, false) });
                      if (rc.barrierFree.totalAmount > 0) cats.push({ label: '② 高齢者等居住改修工事等', result: calcCat(rc.barrierFree, 2_000_000, true) });
                      if (rc.energySaving.totalAmount > 0) cats.push({ label: '③ 一般断熱改修工事等', result: calcCat(rc.energySaving, hasSolar ? 3_500_000 : 2_500_000, true) });
                      if (rc.cohabitation.totalAmount > 0) cats.push({ label: '④ 多世帯同居改修工事等', result: calcCat(rc.cohabitation, 2_500_000, true) });
                      // ⑤ (OR)
                      {
                        const lt5t = rc.longTermOr.baseTotalAmount + rc.longTermOr.durabilityTotalAmount;
                        if (lt5t > 0) {
                          const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
                          const lt5BaseSub = rc.longTermOr.baseHasSubsidy ? rc.longTermOr.baseSubsidyAmount : 0;
                          const lt5BaseDed = (rc.longTermOr.baseTotalAmount - lt5BaseSub) > 500_000 ? (rc.longTermOr.baseTotalAmount - lt5BaseSub) : 0;
                          const lt5DurSub = rc.longTermOr.durabilityHasSubsidy ? rc.longTermOr.durabilitySubsidyAmount : 0;
                          const lt5DurDed = (rc.longTermOr.durabilityTotalAmount - lt5DurSub) > 500_000 ? (rc.longTermOr.durabilityTotalAmount - lt5DurSub) : 0;
                          const lt5Ki = lt5BaseDed + lt5DurDed;
                          cats.push({ label: '⑤ 耐久性向上(OR)', result: { total: lt5t, maxDed: Math.min(lt5Ki, lt5Limit) } });
                        }
                      }
                      // ⑥ (AND)
                      {
                        const lt6t = rc.longTermAnd.seismicTotalAmount + rc.longTermAnd.energyTotalAmount + rc.longTermAnd.durabilityTotalAmount;
                        if (lt6t > 0) {
                          const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
                          const lt6SesSub = rc.longTermAnd.seismicHasSubsidy ? rc.longTermAnd.seismicSubsidyAmount : 0;
                          const lt6SesAfterP = rc.longTermAnd.seismicTotalAmount - lt6SesSub;
                          const lt6SesDed = lt6SesAfterP > 500_000 ? lt6SesAfterP : 0;
                          const lt6EnSub = rc.longTermAnd.energyHasSubsidy ? rc.longTermAnd.energySubsidyAmount : 0;
                          const lt6EnDed = (rc.longTermAnd.energyTotalAmount - lt6EnSub) > 500_000 ? (rc.longTermAnd.energyTotalAmount - lt6EnSub) : 0;
                          const lt6DurSub = rc.longTermAnd.durabilityHasSubsidy ? rc.longTermAnd.durabilitySubsidyAmount : 0;
                          const lt6DurDed = (rc.longTermAnd.durabilityTotalAmount - lt6DurSub) > 500_000 ? (rc.longTermAnd.durabilityTotalAmount - lt6DurSub) : 0;
                          const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
                          cats.push({ label: '⑥ 耐久性向上(AND)', result: { total: lt6t, maxDed: Math.min(lt6Ko, lt6Limit) } });
                        }
                      }
                      if (rc.childcare.totalAmount > 0) cats.push({ label: '⑦ 子育て対応改修工事等', result: calcCat(rc.childcare, 2_500_000, true) });
                      if (rc.otherRenovation.totalAmount > 0) {
                        const orSub = rc.otherRenovation.hasSubsidy ? rc.otherRenovation.subsidyAmount : 0;
                        const orAfter = Math.max(0, rc.otherRenovation.totalAmount - orSub);
                        cats.push({ label: '⑳ 第1号～第6号工事', result: { total: rc.otherRenovation.totalAmount, maxDed: orAfter } });
                      }

                      return cats.length > 0 ? (
                        <div className="space-y-1 text-sm">
                          {cats.map(c => (
                            <div key={c.label} className="flex justify-between">
                              <span className="text-stone-600">{c.label}:</span>
                              <span>ア {c.result.total.toLocaleString()}円 → エ {c.result.maxDed.toLocaleString()}円</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t font-semibold flex justify-between">
                            <span>ア合計:</span>
                            <span>{cats.reduce((s, c) => s + c.result.total, 0).toLocaleString()}円</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">(費用データなし)</p>
                      );
                    })()
                  ) : (
                    (() => {
                      const costSummary = getCostSummary();
                      return costSummary.totalAmount > 0 ? (
                        <div className="space-y-1 text-sm">
                          {costSummary.details.map(d => (
                            <div key={d.label} className="flex justify-between">
                              <span className="text-stone-600">{d.label}:</span>
                              <span>{d.total.toLocaleString()}円{d.subsidy > 0 ? ` (補助金: ${d.subsidy.toLocaleString()}円)` : ''}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t font-semibold flex justify-between">
                            <span>合計:</span>
                            <span>{costSummary.totalAmount.toLocaleString()}円</span>
                          </div>
                          {costSummary.totalSubsidy > 0 && (
                            <div className="flex justify-between text-emerald-700">
                              <span>補助金合計:</span>
                              <span>{costSummary.totalSubsidy.toLocaleString()}円</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">(費用データなし)</p>
                      );
                    })()
                  )}
                </div>

                {/* 証明者情報プレビュー */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">証明者情報</h3>
                    <button type="button" onClick={() => goToStep(5)} className="text-xs text-amber-600">編集</button>
                  </div>
                  <p className="text-sm">
                    {formData.issuerInfo?.organizationType
                      ? `${(formData.issuerInfo as any).architectName || '(氏名未入力)'} / ${formData.issueDate || '(日付未入力)'}`
                      : '(未入力)'}
                  </p>
                </div>

                {/* 保存ボタン */}
                <div className="flex gap-3 pt-4 border-t border-stone-200">
                  <button onClick={() => saveCertificate('draft')} disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
                    {isSaving ? '保存中...' : '下書き保存'}
                  </button>
                  <button onClick={() => saveCertificate('completed')} disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-full shadow-xl shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 disabled:hover:scale-100">
                    {isSaving ? '保存中...' : '保存して完了'}
                  </button>
                </div>

                <div className="text-xs text-amber-800 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-amber-200">
                  保存後、証明書の詳細画面から工事データの入力・PDF生成ができます。
                  データはお使いのブラウザ内に保存されます。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          <button type="button" onClick={prevStep} disabled={currentStep === 1}
            className="px-6 py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
            前へ
          </button>
          <button type="button" onClick={nextStep} disabled={currentStep === 6}
            className="px-6 py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-full shadow-xl shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 disabled:hover:scale-100">
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
