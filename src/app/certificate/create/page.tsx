'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/IssuerInfoForm';

// ステップの定義
type WizardStep = 1 | 2 | 3 | 4;

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
  purposeType: 'housing_loan' | 'reform_tax' | 'resale' | 'property_tax' | '';

  // ステップ2: 工事種別
  selectedWorkTypes: string[];
  workData: {
    seismic?: any[];
    barrierFree?: any[];
    energySaving?: any[];
    cohabitation?: any[];
    childcare?: any[];
    otherRenovation?: any[];
    longTermHousing?: any[];
  };
  subsidyAmount: number;

  // ステップ3: 証明者情報（新しい構造）
  issuerInfo: Partial<IssuerInfo> | null;
  issueDate: string;

  // 互換性のため一時的に保持（後で削除予定）
  issuerName?: string;
  issuerOfficeName?: string;
  issuerOrganizationType?: string;
  issuerQualificationNumber?: string;
};

export default function CertificateCreatePage() {
  const router = useRouter();
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
    workData: {},
    subsidyAmount: 0,
    issuerInfo: null,
    issueDate: new Date().toISOString().split('T')[0],
    // 互換性のため
    issuerName: '',
    issuerOfficeName: '',
    issuerOrganizationType: '',
    issuerQualificationNumber: '',
  };

  const [formData, setFormData] = useState<CertificateFormData>(initialFormData);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // 郵便番号から住所を検索する関数
  const fetchAddressFromPostalCode = async (postalCode: string, fieldType: 'applicant' | 'property') => {
    // ハイフンを除去して7桁の数字のみにする
    const cleanedPostalCode = postalCode.replace(/-/g, '');

    if (cleanedPostalCode.length !== 7 || !/^\d{7}$/.test(cleanedPostalCode)) {
      return; // 7桁でない場合は何もしない
    }

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanedPostalCode}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        // 都道府県 + 市区町村 + 町域
        const address = `${result.address1}${result.address2}${result.address3}`;

        // フィールドタイプに応じて適切な住所フィールドを更新
        if (fieldType === 'applicant') {
          setFormData(prev => ({
            ...prev,
            applicantAddress: address
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            propertyAddress: address
          }));
        }
      }
    } catch (error) {
      console.error('郵便番号検索エラー:', error);
    }
  };

  // ローカルストレージからフォームデータと証明者設定を読み込む（初回のみ）
  useEffect(() => {
    // 現在のセッションIDを生成または取得
    let currentSessionId = sessionStorage.getItem('certificate-session-id');
    if (!currentSessionId) {
      currentSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', currentSessionId);
    }

    // 保存されたフォームデータを読み込む
    const savedData = localStorage.getItem('certificate-form-data');
    let loadedFormData = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedSessionId = parsed.sessionId;

        // セッションIDが異なる場合のみ「復元されました」通知を表示
        // 同じセッション内（ページリロードなし）での自動保存の場合は通知しない
        if (savedSessionId && savedSessionId !== currentSessionId) {
          setWasRestored(true);
          console.log('Restored form data from previous session');
        } else {
          console.log('Loaded form data from current session (no notification)');
        }

        loadedFormData = parsed;
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }

    // 証明者のデフォルト設定を読み込む
    const savedSettings = localStorage.getItem('issuer-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);

        // 旧データ形式から新形式への移行
        let issuerSettings: Partial<IssuerInfo> | null = null;
        if (settings.issuerName && !settings.organizationType) {
          // 旧形式のデータの場合、デフォルトで登録建築士事務所として扱う
          issuerSettings = {
            organizationType: 'registered_architect_office',
            architectName: settings.issuerName || '',
            officeName: settings.issuerOfficeName || '',
            architectRegistrationNumber: settings.issuerQualificationNumber || '',
          } as any;
        } else {
          issuerSettings = settings;
        }

        if (loadedFormData) {
          // フォームデータがある場合、証明者情報が空ならデフォルト設定で補完
          if (!loadedFormData.issuerInfo || !loadedFormData.issuerInfo.organizationType) {
            loadedFormData = {
              ...loadedFormData,
              issuerInfo: issuerSettings,
            };
            console.log('Supplemented issuer info from settings');
          }
          setFormData(loadedFormData);
        } else {
          // フォームデータがない場合、証明者設定のみ読み込む
          setFormData((prev) => ({
            ...prev,
            issuerInfo: issuerSettings,
          }));
          console.log('Loaded issuer settings from localStorage:', issuerSettings);
        }
      } catch (error) {
        console.error('Failed to parse saved issuer settings:', error);
        if (loadedFormData) {
          setFormData(loadedFormData);
        }
      }
    } else if (loadedFormData) {
      setFormData(loadedFormData);
    }

    setIsInitialized(true);
  }, []);

  // フォームデータが変更されたらローカルストレージに保存
  useEffect(() => {
    if (isInitialized) {
      const currentSessionId = sessionStorage.getItem('certificate-session-id');
      const dataToSave = {
        ...formData,
        sessionId: currentSessionId, // セッションIDを含めて保存
      };
      localStorage.setItem('certificate-form-data', JSON.stringify(dataToSave));
      console.log('Saved form data to localStorage with session ID');
    }
  }, [formData, isInitialized]);

  // URLクエリパラメータからステップを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const step = parseInt(stepParam) as WizardStep;
      if (step >= 1 && step <= 4) {
        setCurrentStep(step);
      }
    }
  }, []);

  const steps = [
    { number: 1, title: '基本情報', description: '申請者・物件情報' },
    { number: 2, title: '工事内容', description: '工事種別の選択と入力' },
    { number: 3, title: '証明者情報', description: '発行者情報' },
    { number: 4, title: '確認・保存', description: 'プレビューと保存' },
  ];

  const goToStep = useCallback((step: WizardStep) => {
    console.log('goToStep called with step:', step);
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(async () => {
    console.log('nextStep button clicked');

    // ステップ1からステップ2に進む際、証明書を下書き保存
    if (currentStep === 1) {
      // 必須項目チェック
      if (
        !formData.applicantName ||
        !formData.applicantAddress ||
        !formData.propertyAddress ||
        !formData.completionDate ||
        !formData.purposeType
      ) {
        alert('基本情報の必須項目を入力してください');
        return;
      }

      // 住所を結合（市区町村 + 番地・建物名）
      const fullApplicantAddress = formData.applicantAddress + (formData.applicantAddressDetail || '');

      // 既に証明書IDがある場合はスキップ
      let savedCertificateId = certificateId;
      if (!certificateId) {
        try {
          setIsSaving(true);
          const response = await fetch('/api/certificates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicantName: formData.applicantName,
              applicantAddress: fullApplicantAddress,
              propertyNumber: formData.propertyNumber || undefined,
              propertyAddress: formData.propertyAddress,
              completionDate: formData.completionDate,
              purposeType: formData.purposeType,
              selectedWorkTypes: [],
              subsidyAmount: 0,
              status: 'draft',
            }),
          });

          const result = await response.json();
          if (result.success) {
            savedCertificateId = result.data.id;
            setCertificateId(result.data.id);
            console.log('Certificate draft created with ID:', result.data.id);
          } else {
            alert(`エラー: ${result.error}`);
            setIsSaving(false);
            return;
          }
        } catch (error) {
          console.error('Failed to create draft:', error);
          alert('下書き保存中にエラーが発生しました');
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
        }
      }

      // 住宅借入金等特別控除の場合、詳細入力ページに遷移
      if (formData.purposeType === 'housing_loan') {
        if (savedCertificateId) {
          router.push(`/certificate/housing-loan-detail?certificateId=${savedCertificateId}`);
          return;
        } else {
          alert('証明書IDの取得に失敗しました');
          return;
        }
      }
    }

    setCurrentStep((prev) => {
      console.log('Current step before transition:', prev);
      if (prev < 4) {
        const nextStepNum = (prev + 1) as WizardStep;
        console.log('Moving to step:', nextStepNum);
        return nextStepNum;
      } else {
        console.log('Already at final step (step 4)');
        return prev;
      }
    });
  }, [currentStep, formData, certificateId, router]);

  const prevStep = useCallback(() => {
    console.log('prevStep clicked');
    setCurrentStep((prev) => {
      if (prev > 1) {
        const prevStepNum = (prev - 1) as WizardStep;
        console.log('Moving from step', prev, 'to step:', prevStepNum);
        return prevStepNum;
      }
      return prev;
    });
  }, []);

  // フォームデータをクリアして新規作成を開始
  const handleNewForm = useCallback(() => {
    if (confirm('入力中のデータをクリアして新規作成を開始しますか？')) {
      localStorage.removeItem('certificate-form-data');
      // 新しいセッションIDを生成
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', newSessionId);
      setFormData(initialFormData);
      setCurrentStep(1);
      setWasRestored(false); // フラグをリセット
      console.log('Form data cleared for new certificate with new session ID');
    }
  }, [initialFormData]);

  // 証明書を保存する関数
  const saveCertificate = async (status: 'draft' | 'completed' | 'issued') => {
    setIsSaving(true);
    try {
      // 住所を結合（市区町村 + 番地・建物名）
      const fullApplicantAddress = formData.applicantAddress + (formData.applicantAddressDetail || '');

      // issuerInfoオブジェクトから旧形式のフィールドを抽出
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

      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName: formData.applicantName,
          applicantAddress: fullApplicantAddress,
          propertyNumber: formData.propertyNumber || undefined,
          propertyAddress: formData.propertyAddress,
          completionDate: formData.completionDate,
          purposeType: formData.purposeType,
          selectedWorkTypes: formData.selectedWorkTypes,
          subsidyAmount: formData.subsidyAmount,
          issuerName,
          issuerOfficeName,
          issuerOrganizationType,
          issuerQualificationNumber: issuerQualificationNumber || undefined,
          issueDate: formData.issueDate,
          status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 証明書が発行された場合のみローカルストレージをクリア
        if (status === 'issued') {
          localStorage.removeItem('certificate-form-data');
          // 新しいセッションIDを生成
          const newSessionId = Date.now().toString() + Math.random().toString(36);
          sessionStorage.setItem('certificate-session-id', newSessionId);
          setWasRestored(false);
          console.log('Cleared form data from localStorage after issuance');
        }

        alert(
          status === 'draft'
            ? '下書きとして保存しました'
            : '証明書を発行しました'
        );
        // 証明書一覧ページへ遷移（後で実装）
        router.push('/');
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 下書き保存
  const handleSaveDraft = async () => {
    await saveCertificate('draft');
  };

  // 証明書を発行
  const handleIssueCertificate = async () => {
    // バリデーションチェック
    if (
      !formData.applicantName ||
      !formData.applicantAddress ||
      !formData.propertyAddress ||
      !formData.completionDate ||
      !formData.purposeType ||
      formData.selectedWorkTypes.length === 0 ||
      !formData.issuerInfo ||
      !formData.issuerInfo.organizationType ||
      !formData.issueDate
    ) {
      alert('必須項目を全て入力してください');
      return;
    }

    // 住宅借入金等特別控除の場合、工事費用が100万円以上かチェック
    // TODO: 実際の工事データを取得して検証
    // 現在は警告のみ表示
    if (formData.purposeType === 'housing_loan') {
      const confirmed = confirm(
        '注意: 住宅借入金等特別控除を適用するには、補助金控除後の工事費用が100万円以上である必要があります。\n' +
        '工事データを入力済みで、合計金額が要件を満たしていることを確認してください。\n\n' +
        'このまま発行しますか？'
      );
      if (!confirmed) {
        return;
      }
    }

    await saveCertificate('issued');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              増改築等工事証明書 作成
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleNewForm}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                🔄 新規作成
              </button>
              <Link
                href="/settings"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                ⚙️ 設定
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← トップに戻る
              </Link>
            </div>
          </div>
          <p className="text-gray-600">
            各種改修工事の証明書を作成します。必要な情報を順番に入力してください。
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* ステップ */}
                <button
                  type="button"
                  onClick={() => goToStep(step.number as WizardStep)}
                  className={`flex flex-col items-center ${
                    currentStep >= step.number ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                      currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </button>

                {/* 接続線 */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-colors ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[600px]">
          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">基本情報</h2>
              <p className="text-gray-600 mb-6">
                証明書に記載する申請者情報と物件情報を入力してください。
              </p>

              {/* 保存されたデータが復元された場合の通知 */}
              {wasRestored && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    💾 前回入力したデータが復元されました。続きから入力できます。
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* 申請者情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">申請者情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        氏名 *
                      </label>
                      <input
                        type="text"
                        value={formData.applicantName}
                        onChange={(e) =>
                          setFormData({ ...formData, applicantName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="山田 太郎"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号
                      </label>
                      <input
                        type="text"
                        value={formData.applicantPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, applicantPostalCode: value });
                          // 7桁入力されたら住所を自動検索
                          if (value.replace(/-/g, '').length === 7) {
                            fetchAddressFromPostalCode(value, 'applicant');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000001 または 100-0001"
                        maxLength={8}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        7桁入力すると市区町村まで自動入力されます
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        住所（市区町村まで） *
                      </label>
                      <input
                        type="text"
                        value={formData.applicantAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, applicantAddress: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="東京都千代田区千代田"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        郵便番号を入力すると自動で入力されます
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        番地・建物名
                      </label>
                      <input
                        type="text"
                        value={formData.applicantAddressDetail}
                        onChange={(e) =>
                          setFormData({ ...formData, applicantAddressDetail: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1-2-3 〇〇ビル 4階"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        番地、建物名、部屋番号などを入力してください
                      </p>
                    </div>
                  </div>
                </div>

                {/* 家屋番号及び所在地 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">家屋番号及び所在地</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号
                      </label>
                      <input
                        type="text"
                        value={formData.propertyPostalCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, propertyPostalCode: value });
                          // 7桁入力されたら住所を自動検索
                          if (value.replace(/-/g, '').length === 7) {
                            fetchAddressFromPostalCode(value, 'property');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1000001 または 100-0001"
                        maxLength={8}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        7桁入力すると市区町村まで自動入力されます
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        所在地 *
                      </label>
                      <input
                        type="text"
                        value={formData.propertyAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, propertyAddress: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="東京都千代田区千代田 1-2-3"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        郵便番号で自動入力された後、番地等を追記してください
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        家屋番号
                      </label>
                      <input
                        type="text"
                        value={formData.propertyNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, propertyNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="12番地3"
                      />
                    </div>
                  </div>
                </div>

                {/* 工事情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">工事情報</h3>
                  <div className="max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        工事完了年月日 *
                      </label>
                      <input
                        type="date"
                        value={formData.completionDate}
                        onChange={(e) =>
                          setFormData({ ...formData, completionDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 用途区分 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">証明書の用途 *</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    この証明書を使用する税制優遇制度を選択してください
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        value: 'housing_loan',
                        label: '住宅借入金等特別控除',
                        description: '住宅ローン控除',
                      },
                      {
                        value: 'reform_tax',
                        label: '住宅借入金等特別税額控除',
                        description: '改修促進税制（投資型減税）',
                      },
                      {
                        value: 'resale',
                        label: '既存住宅の譲渡所得の特別控除等',
                        description: '譲渡所得控除',
                      },
                      {
                        value: 'property_tax',
                        label: '固定資産税の減額',
                        description: '固定資産税減額措置',
                      },
                    ].map((purpose) => (
                      <label
                        key={purpose.value}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.purposeType === purpose.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="purposeType"
                          value={purpose.value}
                          checked={formData.purposeType === purpose.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              purposeType: e.target.value as any,
                            })
                          }
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium">{purpose.label}</p>
                          <p className="text-sm text-gray-600">{purpose.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: 工事内容 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">工事内容の選択と入力</h2>
              <p className="text-gray-600 mb-6">
                実施した工事種別を選択してください。複数選択可能です。
              </p>

              {/* 工事種別選択 */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold">実施した工事種別 *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      value: 'seismic',
                      label: '耐震改修工事',
                      icon: '🏗️',
                      description: '住宅の耐震性を高める改修',
                    },
                    {
                      value: 'barrierFree',
                      label: 'バリアフリー改修工事',
                      icon: '♿',
                      description: '高齢者等の移動を容易にする改修',
                    },
                    {
                      value: 'energySaving',
                      label: '省エネ改修工事',
                      icon: '☀️',
                      description: '省エネルギー性能を高める改修',
                    },
                    {
                      value: 'cohabitation',
                      label: '同居対応改修工事',
                      icon: '👨‍👩‍👧‍👦',
                      description: '多世帯同居に必要な設備の設置',
                    },
                    {
                      value: 'childcare',
                      label: '子育て対応改修工事',
                      icon: '👶',
                      description: '子育てしやすい環境への改修',
                    },
                    {
                      value: 'otherRenovation',
                      label: 'その他増改築等工事',
                      icon: '🔨',
                      description: '大規模修繕・模様替え・増築等',
                    },
                    {
                      value: 'longTermHousing',
                      label: '長期優良住宅化改修工事',
                      icon: '⭐',
                      description: '長期優良住宅の認定基準を満たす改修',
                    },
                  ].map((workType) => {
                    const isSelected = formData.selectedWorkTypes.includes(workType.value);
                    return (
                      <label
                        key={workType.value}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelected = e.target.checked
                              ? [...formData.selectedWorkTypes, workType.value]
                              : formData.selectedWorkTypes.filter((t) => t !== workType.value);
                            setFormData({
                              ...formData,
                              selectedWorkTypes: newSelected,
                            });
                          }}
                          className="mt-1 mr-3 w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{workType.icon}</span>
                            <p className="font-medium">{workType.label}</p>
                          </div>
                          <p className="text-sm text-gray-600">{workType.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 選択された工事種別の詳細入力 */}
              {formData.selectedWorkTypes.length > 0 && (
                <div className="border-t pt-8 space-y-6">
                  <h3 className="text-lg font-semibold">各工事の詳細</h3>
                  <p className="text-sm text-gray-600">
                    選択した工事種別ごとに、以下のリンクから詳細な工事内容を入力してください。
                    個別計算画面で入力したデータは、この証明書に自動的に反映されます。
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.selectedWorkTypes.includes('seismic') && (
                      <Link
                        href={certificateId ? `/seismic-reform?certificateId=${certificateId}` : "/seismic-reform"}
                        target="_blank"
                        className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">🏗️ 耐震改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('barrierFree') && (
                      <Link
                        href={certificateId ? `/barrier-free-reform?certificateId=${certificateId}` : "/barrier-free-reform"}
                        target="_blank"
                        className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">♿ バリアフリー改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('energySaving') && (
                      <Link
                        href={certificateId ? `/energy-saving-reform?certificateId=${certificateId}` : "/energy-saving-reform"}
                        target="_blank"
                        className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">☀️ 省エネ改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('cohabitation') && (
                      <Link
                        href={certificateId ? `/cohabitation-reform?certificateId=${certificateId}` : "/cohabitation-reform"}
                        target="_blank"
                        className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">👨‍👩‍👧‍👦 同居対応改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('childcare') && (
                      <Link
                        href={certificateId ? `/childcare-reform?certificateId=${certificateId}` : "/childcare-reform"}
                        target="_blank"
                        className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">👶 子育て対応改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('otherRenovation') && (
                      <Link
                        href={certificateId ? `/other-renovation?certificateId=${certificateId}` : "/other-renovation"}
                        target="_blank"
                        className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">🔨 その他増改築等工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('longTermHousing') && (
                      <Link
                        href={certificateId ? `/long-term-housing?certificateId=${certificateId}` : "/long-term-housing"}
                        target="_blank"
                        className="p-4 border-2 border-rose-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">⭐ 長期優良住宅化改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                          {certificateId && (
                            <span className="text-xs text-green-600 font-semibold">✓ 証明書連携</span>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* 注意書き */}
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>注意:</strong> 現在のバージョンでは、各工事の詳細データは個別画面で計算した結果を
                      参照する形式です。将来のバージョンでは、この画面内で直接入力できるようになります。
                    </p>
                  </div>

                  {/* 補助金入力 */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">補助金額</h3>
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        補助金額 (円)
                      </label>
                      <input
                        type="number"
                        value={formData.subsidyAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subsidyAmount: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 100000"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        国や地方公共団体から受けた補助金がある場合は入力してください
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.selectedWorkTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  上記から工事種別を選択してください
                </div>
              )}
            </div>
          )}

          {/* ステップ3: 証明者情報 */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">証明者情報を編集</h2>
                  <Link
                    href="/settings"
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    ⚙️ デフォルト設定
                  </Link>
                </div>
                <p className="text-gray-600">
                  証明書を発行する建築士等の情報を入力・編集してください。組織種別により必要な情報が異なります。
                </p>
              </div>

              {/* 証明者情報フォームコンポーネント */}
              <IssuerInfoForm
                issuerInfo={formData.issuerInfo}
                onChange={(newIssuerInfo) =>
                  setFormData({ ...formData, issuerInfo: newIssuerInfo })
                }
              />

              {/* 発行日 */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📅</span>
                  証明書発行日
                </h3>
                <p className="text-sm text-gray-500 mb-4">証明書を発行する日付を選択してください</p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    発行日 *
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 注意事項 */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-semibold text-blue-900 mb-2">
                  証明書発行の要件
                </h4>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>建築士等の有資格者による証明が必要です</li>
                  <li>工事内容を確認できる書類（図面、写真等）の保管が必要です</li>
                  <li>虚偽の証明は法律により罰せられます</li>
                </ul>
              </div>
            </div>
          )}

          {/* ステップ4: 確認・保存 */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">確認と保存</h2>
              <p className="text-gray-600 mb-6">
                入力内容を確認してください。問題なければ証明書を保存できます。
              </p>

              <div className="space-y-6">
                {/* 基本情報のプレビュー */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">基本情報</h3>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集 →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">申請者氏名</p>
                      <p className="font-medium">
                        {formData.applicantName || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">申請者住所</p>
                      <p className="font-medium">
                        {(formData.applicantAddress + (formData.applicantAddressDetail || '')) || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">家屋番号</p>
                      <p className="font-medium">
                        {formData.propertyNumber || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">物件所在地</p>
                      <p className="font-medium">
                        {formData.propertyAddress || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">工事完了年月日</p>
                      <p className="font-medium">
                        {formData.completionDate || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">証明書の用途</p>
                      <p className="font-medium">
                        {formData.purposeType === 'housing_loan' && '住宅借入金等特別控除'}
                        {formData.purposeType === 'reform_tax' && '住宅借入金等特別税額控除'}
                        {formData.purposeType === 'resale' && '既存住宅の譲渡所得の特別控除等'}
                        {formData.purposeType === 'property_tax' && '固定資産税の減額'}
                        {!formData.purposeType && '（未選択）'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 工事内容のプレビュー */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">工事内容</h3>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集 →
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600 text-sm mb-2">選択された工事種別</p>
                      {formData.selectedWorkTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedWorkTypes.map((workType) => {
                            const workTypeLabels: Record<string, { label: string; icon: string }> = {
                              seismic: { label: '耐震改修工事', icon: '🏗️' },
                              barrierFree: { label: 'バリアフリー改修工事', icon: '♿' },
                              energySaving: { label: '省エネ改修工事', icon: '☀️' },
                              cohabitation: { label: '同居対応改修工事', icon: '👨‍👩‍👧‍👦' },
                              childcare: { label: '子育て対応改修工事', icon: '👶' },
                              otherRenovation: { label: 'その他増改築等工事', icon: '🔨' },
                              longTermHousing: { label: '長期優良住宅化改修工事', icon: '⭐' },
                            };
                            const typeInfo = workTypeLabels[workType];
                            return (
                              <span
                                key={workType}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                <span>{typeInfo?.icon}</span>
                                <span>{typeInfo?.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">工事種別が選択されていません</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">補助金額</p>
                      <p className="font-medium">
                        {formData.subsidyAmount > 0
                          ? `${formData.subsidyAmount.toLocaleString()}円`
                          : '0円'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 証明者情報のプレビュー */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">証明者情報</h3>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集 →
                    </button>
                  </div>
                  {formData.issuerInfo && formData.issuerInfo.organizationType ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">組織種別</p>
                        <p className="font-medium">
                          {formData.issuerInfo.organizationType === 'registered_architect_office' && '登録建築士事務所'}
                          {formData.issuerInfo.organizationType === 'designated_inspection_agency' && '指定確認検査機関'}
                          {formData.issuerInfo.organizationType === 'registered_evaluation_agency' && '登録住宅性能評価機関'}
                          {formData.issuerInfo.organizationType === 'warranty_insurance_corporation' && '住宅瑕疵担保責任保険法人'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">建築士氏名</p>
                        <p className="font-medium">
                          {(formData.issuerInfo as any).architectName || '（未入力）'}
                        </p>
                      </div>
                      {formData.issuerInfo.organizationType === 'registered_architect_office' && (
                        <>
                          <div>
                            <p className="text-gray-600">建築士事務所名</p>
                            <p className="font-medium">
                              {(formData.issuerInfo as any).officeName || '（未入力）'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">建築士登録番号</p>
                            <p className="font-medium">
                              {(formData.issuerInfo as any).architectRegistrationNumber || '（未入力）'}
                            </p>
                          </div>
                        </>
                      )}
                      {(formData.issuerInfo.organizationType === 'designated_inspection_agency' ||
                        formData.issuerInfo.organizationType === 'registered_evaluation_agency' ||
                        formData.issuerInfo.organizationType === 'warranty_insurance_corporation') && (
                        <>
                          <div>
                            <p className="text-gray-600">機関/法人名</p>
                            <p className="font-medium">
                              {(formData.issuerInfo as any).agencyName || (formData.issuerInfo as any).corporationName || '（未入力）'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">建築士登録番号</p>
                            <p className="font-medium">
                              {(formData.issuerInfo as any).architectRegistrationNumber || '（未入力）'}
                            </p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className="text-gray-600">発行日</p>
                        <p className="font-medium">
                          {formData.issueDate || '（未入力）'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">証明者情報が入力されていません</p>
                  )}
                </div>

                {/* バリデーションエラー表示 */}
                {(() => {
                  const errors: string[] = [];
                  if (!formData.applicantName) errors.push('申請者氏名が未入力です');
                  if (!formData.applicantAddress) errors.push('申請者住所が未入力です');
                  if (!formData.propertyAddress) errors.push('物件所在地が未入力です');
                  if (!formData.completionDate) errors.push('工事完了年月日が未入力です');
                  if (!formData.purposeType) errors.push('証明書の用途が未選択です');
                  if (formData.selectedWorkTypes.length === 0)
                    errors.push('工事種別が選択されていません');
                  if (!formData.issuerInfo || !formData.issuerInfo.organizationType)
                    errors.push('証明者情報が未入力です');
                  if (!formData.issueDate) errors.push('発行日が未入力です');

                  return errors.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">
                        ⚠️ 以下の項目を入力してください
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}

                {/* 保存ボタン */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSaving ? '保存中...' : '📝 下書き保存'}
                  </button>
                  <button
                    onClick={handleIssueCertificate}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSaving ? '発行中...' : '📄 証明書を発行'}
                  </button>
                </div>

                {/* 注意事項 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 次のステップ</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 下書き保存: データベースに保存し、後で編集可能</li>
                    <li>• 証明書を発行: PDF形式で証明書を生成・ダウンロード</li>
                    <li>
                      • 発行された証明書は履歴として保管され、いつでも再出力可能です
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 前へ
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={currentStep === 4}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  );
}
