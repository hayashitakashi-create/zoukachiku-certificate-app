'use client';

import { useState, useCallback, useEffect } from 'react';
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
  reform_tax: ['barrierFree', 'energySaving', 'cohabitation', 'childcare', 'longTermHousing'],
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

  // 固定資産税用詳細フォーム
  propertyTaxForm: PropertyTaxFormData;

  // ステップ3: 費用計算
  workDataForm: WorkDataFormState;

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
    propertyTaxForm: { ...defaultPropertyTaxForm },
    workDataForm: {},
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

    const savedData = localStorage.getItem('certificate-form-data');
    let loadedFormData: CertificateFormData | null = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
          setWasRestored(true);
        }
        // 旧データとの互換
        if (!parsed.workDataForm) parsed.workDataForm = {};
        if (!parsed.workDescriptions) parsed.workDescriptions = {};
        if (!parsed.selectedWorkTypes) parsed.selectedWorkTypes = [];
        if (!parsed.housingLoanWorkTypes) parsed.housingLoanWorkTypes = {};
        if (!parsed.propertyTaxForm) parsed.propertyTaxForm = { ...defaultPropertyTaxForm };
        loadedFormData = parsed;
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
      for (const data of Object.values(workData)) {
        if (data.summary) {
          totalSubsidy += data.summary.subsidyAmount;
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              増改築等工事証明書 作成
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleNewForm}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                クリア
              </button>
              <Link href="/" className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800">
                トップに戻る
              </Link>
            </div>
          </div>
        </div>

        {/* ステップインジケーター */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(step.number as WizardStep)}
                  className={`flex flex-col items-center ${currentStep >= step.number ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep === step.number ? 'bg-blue-600 text-white'
                    : currentStep > step.number ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <p className="mt-1 text-xs font-medium">{step.title}</p>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">基本情報</h2>

              {wasRestored && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  前回入力したデータが復元されました。続きから入力できます。
                </div>
              )}

              <div className="space-y-6">
                {/* 申請者情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">申請者情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">氏名 *</label>
                      <input type="text" value={formData.applicantName}
                        onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="山田 太郎" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                      <input type="text" value={formData.applicantPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, applicantPostalCode: value }));
                          if (value.replace(/-/g, '').length === 7) fetchAddressFromPostalCode(value, 'applicant');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000001" maxLength={8} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">住所 *</label>
                      <input type="text" value={formData.applicantAddress}
                        onChange={(e) => setFormData({ ...formData, applicantAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="東京都千代田区千代田" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">番地・建物名</label>
                      <input type="text" value={formData.applicantAddressDetail}
                        onChange={(e) => setFormData({ ...formData, applicantAddressDetail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1-2-3 〇〇ビル 4階" />
                    </div>
                  </div>
                </div>

                {/* 家屋情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">家屋番号及び所在地</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                      <input type="text" value={formData.propertyPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ ...prev, propertyPostalCode: value }));
                          if (value.replace(/-/g, '').length === 7) fetchAddressFromPostalCode(value, 'property');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000001" maxLength={8} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">所在地 *</label>
                      <input type="text" value={formData.propertyAddress}
                        onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="東京都千代田区千代田 1-2-3" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">家屋番号</label>
                      <input type="text" value={formData.propertyNumber}
                        onChange={(e) => setFormData({ ...formData, propertyNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12番地3" />
                    </div>
                  </div>
                </div>

                {/* 用途区分（工事種別の前に配置） */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">証明書の用途 *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { value: 'housing_loan', label: '住宅借入金等特別控除', description: '住宅ローン控除' },
                      { value: 'reform_tax', label: '住宅借入金等特別税額控除', description: '改修促進税制' },
                      { value: 'resale', label: '既存住宅の譲渡所得の特別控除等', description: '譲渡所得控除' },
                      { value: 'property_tax', label: '固定資産税の減額', description: '固定資産税減額措置' },
                    ].map((purpose) => (
                      <label key={purpose.value} className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.purposeType === purpose.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}>
                        <input type="radio" name="purposeType" value={purpose.value}
                          checked={formData.purposeType === purpose.value}
                          onChange={(e) => {
                            const newPurpose = e.target.value as PurposeType;
                            const allowedTypes = PURPOSE_WORK_TYPES[newPurpose];
                            const filteredWorkTypes = formData.selectedWorkTypes.filter(t => allowedTypes.includes(t));
                            setFormData({ ...formData, purposeType: newPurpose, selectedWorkTypes: filteredWorkTypes });
                          }}
                          className="mt-1 mr-3" />
                        <div>
                          <p className="font-medium text-sm">{purpose.label}</p>
                          <p className="text-xs text-gray-600">{purpose.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 工事情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">工事情報</h3>
                  <div className="max-w-md mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">工事完了年月日 *</label>
                    <input type="date" value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>

                  {/* 実施した工事の種別（用途に応じてフィルタリング） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">実施した工事の種別 *</label>
                    {!formData.purposeType ? (
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">先に「証明書の用途」を選択してください。用途に応じた工事種別が表示されます。</p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-3">該当する工事種別をすべて選択してください</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: 'seismic', label: '耐震改修工事', description: '住宅の耐震性を高める改修' },
                            { value: 'barrierFree', label: 'バリアフリー改修工事', description: '高齢者等の移動を容易にする改修' },
                            { value: 'energySaving', label: '省エネ改修工事', description: '省エネルギー性能を高める改修' },
                            { value: 'cohabitation', label: '同居対応改修工事', description: '多世帯同居に必要な設備の設置' },
                            { value: 'childcare', label: '子育て対応改修工事', description: '子育てしやすい環境への改修' },
                            { value: 'longTermHousing', label: '長期優良住宅化改修工事', description: '長期優良住宅の認定基準を満たす改修' },
                            { value: 'otherRenovation', label: 'その他増改築等工事', description: '大規模修繕・模様替え・増築等' },
                          ].filter((workType) => PURPOSE_WORK_TYPES[formData.purposeType as PurposeType]?.includes(workType.value))
                          .map((workType) => {
                            const isSelected = formData.selectedWorkTypes.includes(workType.value);
                            return (
                              <label key={workType.value} className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                              }`}>
                                <input type="checkbox" checked={isSelected}
                                  onChange={(e) => {
                                    const newSelected = e.target.checked
                                      ? [...formData.selectedWorkTypes, workType.value]
                                      : formData.selectedWorkTypes.filter(t => t !== workType.value);
                                    setFormData({ ...formData, selectedWorkTypes: newSelected });
                                  }}
                                  className="mt-1 mr-3 w-4 h-4" />
                                <div>
                                  <p className="font-medium text-sm">{workType.label}</p>
                                  <p className="text-xs text-gray-600">{workType.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: (1) 実施した工事の種別（公式様式 第1号～第6号） */}
          {currentStep === 2 && (
            <div>
              {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-blue-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">（１）実施した工事の種別</h2>
              <p className="text-sm text-gray-600 mb-6">
                公式様式に準拠した工事種別の詳細項目を選択してください。
              </p>

              {/* === 固定資産税用フォーム === */}
              {formData.purposeType === 'property_tax' && (
                <div className="space-y-6">
                  {/* 1-1: 耐震改修 */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-sm mb-1">１－１．耐震改修をした場合</h3>
                    <p className="text-xs text-gray-500 mb-3">地方税法施行令附則第12条第19項に規定する基準に適合する耐震改修</p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">工事の種別</p>
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
                              className="w-4 h-4 text-blue-600 rounded" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">工事の内容</label>
                      <textarea
                        value={formData.propertyTaxForm.seismicWorkDescription}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, seismicWorkDescription: e.target.value },
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="耐震改修工事の内容を記入..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">全体の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.seismicTotalCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, seismicTotalCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">うち耐震改修の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.seismicCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, seismicCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0" />
                      </div>
                    </div>
                  </div>

                  {/* 1-2: 耐震改修→認定長期優良住宅 */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <input type="checkbox"
                        checked={formData.propertyTaxForm.seismicLongTermEnabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, seismicLongTermEnabled: e.target.checked },
                        }))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <div>
                        <h3 className="font-bold text-sm">１－２．耐震改修をした家屋が認定長期優良住宅に該当することとなった場合</h3>
                        <p className="text-xs text-gray-500">地方税法附則第15条の９の２第１項に規定する耐震改修</p>
                      </div>
                    </div>

                    {formData.propertyTaxForm.seismicLongTermEnabled && (
                      <div className="ml-6 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">認定主体</label>
                          <input type="text"
                            value={formData.propertyTaxForm.seismicLtCertAuthority}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertAuthority: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="○○市長" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">認定番号</label>
                          <input type="text"
                            value={formData.propertyTaxForm.seismicLtCertNumber}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertNumber: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="第○○号" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">認定年月日</label>
                          <input type="date"
                            value={formData.propertyTaxForm.seismicLtCertDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertDate: e.target.value },
                            }))}
                            className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2: 熱損失防止改修工事等（省エネ） */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-bold text-sm mb-1">２．熱損失防止改修工事等をした場合</h3>
                    <p className="text-xs text-gray-500 mb-3">熱損失防止改修工事等をした場合又は熱損失防止改修工事等をした家屋が認定長期優良住宅に該当することとなった場合</p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">工事の種別（窓の断熱性を高める工事と併せて行う以下の工事）</p>
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
                              className="w-4 h-4 text-blue-600 rounded" />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">工事の内容</label>
                      <textarea
                        value={formData.propertyTaxForm.energyWorkDescription}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          propertyTaxForm: { ...prev.propertyTaxForm, energyWorkDescription: e.target.value },
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="省エネ改修工事の内容を記入..."
                      />
                    </div>

                    {/* 費用の額 */}
                    <div className="bg-gray-50 p-3 rounded-md space-y-3">
                      <p className="text-xs font-semibold text-gray-700">費用の額</p>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">全体の工事費用（税込）</label>
                        <input type="number"
                          value={formData.propertyTaxForm.energyTotalCost || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, energyTotalCost: Number(e.target.value) || 0 },
                          }))}
                          className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0" />
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">断熱改修工事</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">ア 断熱改修工事の費用</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyInsulationCost || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationCost: Number(e.target.value) || 0 },
                              }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">イ 補助金等の有無</label>
                            <div className="flex gap-4 mt-1">
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="insulationSubsidy"
                                  checked={formData.propertyTaxForm.energyInsulationHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: true },
                                  }))}
                                  className="w-4 h-4 text-blue-600" />
                                <span>有</span>
                              </label>
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="insulationSubsidy"
                                  checked={!formData.propertyTaxForm.energyInsulationHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: false, energyInsulationSubsidy: 0 },
                                  }))}
                                  className="w-4 h-4 text-blue-600" />
                                <span>無</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        {formData.propertyTaxForm.energyInsulationHasSubsidy && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">ウ 補助金等の額</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyInsulationSubsidy || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationSubsidy: Number(e.target.value) || 0 },
                              }))}
                              className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0" />
                          </div>
                        )}
                        {/* ① 差引額（自動計算） */}
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          ① 差引額: <span className="font-bold">
                            {(formData.propertyTaxForm.energyInsulationCost - (formData.propertyTaxForm.energyInsulationHasSubsidy ? formData.propertyTaxForm.energyInsulationSubsidy : 0)).toLocaleString()}円
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">設備工事</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">エ 設備工事の費用</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyEquipmentCost || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentCost: Number(e.target.value) || 0 },
                              }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">オ 補助金等の有無</label>
                            <div className="flex gap-4 mt-1">
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="equipmentSubsidy"
                                  checked={formData.propertyTaxForm.energyEquipmentHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: true },
                                  }))}
                                  className="w-4 h-4 text-blue-600" />
                                <span>有</span>
                              </label>
                              <label className="flex items-center space-x-1 text-sm">
                                <input type="radio" name="equipmentSubsidy"
                                  checked={!formData.propertyTaxForm.energyEquipmentHasSubsidy}
                                  onChange={() => setFormData(prev => ({
                                    ...prev,
                                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: false, energyEquipmentSubsidy: 0 },
                                  }))}
                                  className="w-4 h-4 text-blue-600" />
                                <span>無</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        {formData.propertyTaxForm.energyEquipmentHasSubsidy && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">カ 補助金等の額</label>
                            <input type="number"
                              value={formData.propertyTaxForm.energyEquipmentSubsidy || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentSubsidy: Number(e.target.value) || 0 },
                              }))}
                              className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0" />
                          </div>
                        )}
                        {/* ② 設備差引額（自動計算） */}
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
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
                            <div className={`text-sm p-2 rounded ${check3 ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                              ③ ①が60万円超: <span className="font-bold">{check3 ? '該当' : '非該当'}</span>
                            </div>
                            <div className={`text-sm p-2 rounded ${check4 ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                              ④ ①が50万円超かつ①＋②が60万円超: <span className="font-bold">{check4 ? '該当' : '非該当'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 認定長期優良住宅（省エネpath） */}
                    <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox"
                          checked={formData.propertyTaxForm.energyLongTermEnabled}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            propertyTaxForm: { ...prev.propertyTaxForm, energyLongTermEnabled: e.target.checked },
                          }))}
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm font-medium">認定長期優良住宅に該当する場合</span>
                      </label>
                      {formData.propertyTaxForm.energyLongTermEnabled && (
                        <div className="ml-6 mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">認定主体</label>
                            <input type="text"
                              value={formData.propertyTaxForm.energyLtCertAuthority}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertAuthority: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="○○市長" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">認定番号</label>
                            <input type="text"
                              value={formData.propertyTaxForm.energyLtCertNumber}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertNumber: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="第○○号" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">認定年月日</label>
                            <input type="date"
                              value={formData.propertyTaxForm.energyLtCertDate}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertDate: e.target.value },
                              }))}
                              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* === 所得税控除用フォーム（housing_loan, reform_tax, resale） === */}
              {formData.purposeType !== 'property_tax' && (
              <>
              {/* 第1号工事 */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
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
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第2号工事 */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-sm mb-1">第2号工事</h3>
                <p className="text-xs text-gray-500 mb-3">1棟の家屋で区分所有する部分について行う次のいずれかに該当する修繕又は模様替</p>
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
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第3号工事 */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-sm mb-1">第3号工事</h3>
                <p className="text-xs text-gray-500 mb-3">次のいずれか一室の床又は壁の全部の修繕又は模様替</p>
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
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第4号工事（耐震改修工事） */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-sm mb-1">第4号工事（耐震改修工事）</h3>
                <p className="text-xs text-gray-500 mb-3">次の規定又は基準に適合させるための修繕又は模様替</p>
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
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第5号工事（バリアフリー改修工事） */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-sm mb-1">第5号工事（バリアフリー改修工事）</h3>
                <p className="text-xs text-gray-500 mb-3">高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための修繕又は模様替</p>
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
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第6号工事（省エネ改修工事） */}
              <div className="mb-5 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-sm mb-3">第6号工事（省エネ改修工事）</h3>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">エネルギーの使用の合理化に著しく資する修繕若しくは模様替</p>
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
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">上記1から3のいずれかと併せて行う次のいずれかに該当する修繕又は模様替</p>
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
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">地域区分</p>
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
                            className="w-4 h-4 text-blue-600 rounded" />
                          <span>{n}地域</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">改修工事前の住宅が相当する断熱等性能等級</p>
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
                          className="w-4 h-4 text-blue-600" />
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
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-blue-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">（２）実施した工事の内容</h2>
              <p className="text-sm text-gray-600 mb-6">
                選択した工事種別ごとに、実施した工事の内容を記入してください。
              </p>

              {formData.selectedWorkTypes.length > 0 ? (
                <div className="space-y-5">
                  {formData.selectedWorkTypes.map(cat => (
                    <div key={cat}>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        {WORK_TYPE_LABELS[cat] || cat}
                      </label>
                      <textarea
                        value={formData.workDescriptions[cat] || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          workDescriptions: { ...prev.workDescriptions, [cat]: e.target.value },
                        }))}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`${WORK_TYPE_LABELS[cat] || ''}の内容を記入...`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  工事種別が選択されていません。ステップ1で工事種別を選択してください。
                </div>
              )}
            </div>
          )}

          {/* ステップ4: (3) 実施した工事の費用の額等 */}
          {currentStep === 4 && (
            <div>
              {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
                  <p className="text-sm font-bold text-blue-900 mt-1">
                    {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
                  </p>
                </div>
              )}
              <CostCalculationStep
                selectedWorkTypes={formData.selectedWorkTypes}
                formState={formData.workDataForm}
                onChange={(workDataForm) => setFormData(prev => ({ ...prev, workDataForm }))}
              />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">発行日 *</label>
                <input type="date" value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="max-w-md w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          )}

          {/* ステップ6: 確認・保存 */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-xl font-bold mb-4">確認と保存</h2>

              <div className="space-y-4">
                {/* 基本情報プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">基本情報</h3>
                    <button type="button" onClick={() => goToStep(1)} className="text-xs text-blue-600">編集</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">氏名:</span> {formData.applicantName || '(未入力)'}</div>
                    <div><span className="text-gray-500">住所:</span> {(formData.applicantAddress + (formData.applicantAddressDetail || '')) || '(未入力)'}</div>
                    <div><span className="text-gray-500">所在地:</span> {formData.propertyAddress || '(未入力)'}</div>
                    <div><span className="text-gray-500">完了日:</span> {formData.completionDate || '(未入力)'}</div>
                  </div>
                </div>

                {/* (1) 工事種別プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">(1) 実施した工事の種別</h3>
                    <button type="button" onClick={() => goToStep(2)} className="text-xs text-blue-600">編集</button>
                  </div>
                  <p className="text-sm">
                    {formData.selectedWorkTypes.length > 0
                      ? `${formData.selectedWorkTypes.length}種別選択済み`
                      : '(未選択)'}
                  </p>
                </div>

                {/* (2) 工事内容記述プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">(2) 実施した工事の内容</h3>
                    <button type="button" onClick={() => goToStep(3)} className="text-xs text-blue-600">編集</button>
                  </div>
                  {formData.selectedWorkTypes.some(cat => formData.workDescriptions[cat]) ? (
                    <div className="space-y-1 text-sm">
                      {formData.selectedWorkTypes.map(cat => {
                        const desc = formData.workDescriptions[cat];
                        if (!desc) return null;
                        return (
                          <div key={cat}>
                            <span className="text-gray-500">{WORK_TYPE_LABELS[cat]}:</span>{' '}
                            <span className="whitespace-pre-wrap">{desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">(未入力)</p>
                  )}
                </div>

                {/* (3) 費用サマリープレビュー */}
                {(() => {
                  const costSummary = getCostSummary();
                  return costSummary.totalAmount > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">(3) 工事の費用の額</h3>
                        <button type="button" onClick={() => goToStep(4)} className="text-xs text-blue-600">編集</button>
                      </div>
                      <div className="space-y-1 text-sm">
                        {costSummary.details.map(d => (
                          <div key={d.label} className="flex justify-between">
                            <span className="text-gray-600">{d.label}:</span>
                            <span>{d.total.toLocaleString()}円{d.subsidy > 0 ? ` (補助金: ${d.subsidy.toLocaleString()}円)` : ''}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t font-semibold flex justify-between">
                          <span>合計:</span>
                          <span>{costSummary.totalAmount.toLocaleString()}円</span>
                        </div>
                        {costSummary.totalSubsidy > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span>補助金合計:</span>
                            <span>{costSummary.totalSubsidy.toLocaleString()}円</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">(3) 工事の費用の額</h3>
                        <button type="button" onClick={() => goToStep(4)} className="text-xs text-blue-600">編集</button>
                      </div>
                      <p className="text-sm text-gray-500">(費用データなし)</p>
                    </div>
                  );
                })()}

                {/* 証明者情報プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">証明者情報</h3>
                    <button type="button" onClick={() => goToStep(5)} className="text-xs text-blue-600">編集</button>
                  </div>
                  <p className="text-sm">
                    {formData.issuerInfo?.organizationType
                      ? `${(formData.issuerInfo as any).architectName || '(氏名未入力)'} / ${formData.issueDate || '(日付未入力)'}`
                      : '(未入力)'}
                  </p>
                </div>

                {/* 保存ボタン */}
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => saveCertificate('draft')} disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 font-medium">
                    {isSaving ? '保存中...' : '下書き保存'}
                  </button>
                  <button onClick={() => saveCertificate('completed')} disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium">
                    {isSaving ? '保存中...' : '保存して完了'}
                  </button>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
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
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
            前へ
          </button>
          <button type="button" onClick={nextStep} disabled={currentStep === 6}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
