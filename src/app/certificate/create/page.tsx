'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/IssuerInfoForm';
import { certificateStore, createNewCertificate, type PurposeType } from '@/lib/store';

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
  purposeType: PurposeType | '';

  // ステップ2: 工事種別
  selectedWorkTypes: string[];
  subsidyAmount: number;

  // ステップ3: 証明者情報
  issuerInfo: Partial<IssuerInfo> | null;
  issueDate: string;
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
    subsidyAmount: 0,
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
    let loadedFormData = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
          setWasRestored(true);
        }
        loadedFormData = parsed;
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }

    // 証明者設定を読み込む
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

        if (loadedFormData) {
          if (!loadedFormData.issuerInfo || !loadedFormData.issuerInfo.organizationType) {
            loadedFormData = { ...loadedFormData, issuerInfo: issuerSettings };
          }
          setFormData(loadedFormData);
        } else {
          setFormData(prev => ({ ...prev, issuerInfo: issuerSettings }));
        }
      } catch (error) {
        console.error('Failed to parse issuer settings:', error);
        if (loadedFormData) setFormData(loadedFormData);
      }
    } else if (loadedFormData) {
      setFormData(loadedFormData);
    }

    setIsInitialized(true);
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
      if (step >= 1 && step <= 4) setCurrentStep(step);
    }
  }, []);

  const steps = [
    { number: 1, title: '基本情報', description: '申請者・物件情報' },
    { number: 2, title: '工事内容', description: '工事種別の選択' },
    { number: 3, title: '証明者情報', description: '発行者情報' },
    { number: 4, title: '確認・保存', description: 'プレビューと保存' },
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
    setCurrentStep(prev => (prev < 4 ? (prev + 1) as WizardStep : prev));
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

      // IndexedDBに証明書を作成
      const cert = createNewCertificate(formData.purposeType as PurposeType);
      cert.applicantName = formData.applicantName;
      cert.applicantAddress = fullApplicantAddress;
      cert.propertyNumber = formData.propertyNumber;
      cert.propertyAddress = formData.propertyAddress;
      cert.completionDate = formData.completionDate;
      cert.issuerName = issuerName;
      cert.issuerOfficeName = issuerOfficeName;
      cert.issueDate = formData.issueDate;
      cert.issuerOrganizationType = issuerOrganizationType;
      cert.issuerQualificationNumber = issuerQualificationNumber;
      cert.subsidyAmount = formData.subsidyAmount;
      cert.status = status;

      // Dexie に保存
      await certificateStore.updateCertificate(cert.id, cert);

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
                          setFormData({ ...formData, applicantPostalCode: value });
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
                          setFormData({ ...formData, propertyPostalCode: value });
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

                {/* 工事完了日 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-3">工事情報</h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">工事完了年月日 *</label>
                    <input type="date" value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>

                {/* 用途区分 */}
                <div>
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
                          onChange={(e) => setFormData({ ...formData, purposeType: e.target.value as PurposeType })}
                          className="mt-1 mr-3" />
                        <div>
                          <p className="font-medium text-sm">{purpose.label}</p>
                          <p className="text-xs text-gray-600">{purpose.description}</p>
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
              <h2 className="text-xl font-bold mb-4">工事内容の選択</h2>
              <p className="text-sm text-gray-600 mb-4">
                実施した工事種別を選択してください。詳細な工事データは保存後に証明書編集画面で入力できます。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'seismic', label: '耐震改修工事', description: '住宅の耐震性を高める改修' },
                  { value: 'barrierFree', label: 'バリアフリー改修工事', description: '高齢者等の移動を容易にする改修' },
                  { value: 'energySaving', label: '省エネ改修工事', description: '省エネルギー性能を高める改修' },
                  { value: 'cohabitation', label: '同居対応改修工事', description: '多世帯同居に必要な設備の設置' },
                  { value: 'childcare', label: '子育て対応改修工事', description: '子育てしやすい環境への改修' },
                  { value: 'otherRenovation', label: 'その他増改築等工事', description: '大規模修繕・模様替え・増築等' },
                  { value: 'longTermHousing', label: '長期優良住宅化改修工事', description: '長期優良住宅の認定基準を満たす改修' },
                ].map((workType) => {
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

              {/* 補助金 */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">補助金額 (円)</label>
                <input type="number" value={formData.subsidyAmount}
                  onChange={(e) => setFormData({ ...formData, subsidyAmount: parseInt(e.target.value) || 0 })}
                  className="max-w-md w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 100000" />
                <p className="mt-1 text-xs text-gray-500">国や地方公共団体から受けた補助金がある場合</p>
              </div>
            </div>
          )}

          {/* ステップ3: 証明者情報 */}
          {currentStep === 3 && (
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

          {/* ステップ4: 確認・保存 */}
          {currentStep === 4 && (
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

                {/* 工事内容プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">工事内容</h3>
                    <button type="button" onClick={() => goToStep(2)} className="text-xs text-blue-600">編集</button>
                  </div>
                  <p className="text-sm">
                    {formData.selectedWorkTypes.length > 0
                      ? `${formData.selectedWorkTypes.length}種別選択済み`
                      : '(未選択)'}
                    {formData.subsidyAmount > 0 && ` / 補助金: ${formData.subsidyAmount.toLocaleString()}円`}
                  </p>
                </div>

                {/* 証明者情報プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">証明者情報</h3>
                    <button type="button" onClick={() => goToStep(3)} className="text-xs text-blue-600">編集</button>
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
          <button type="button" onClick={nextStep} disabled={currentStep === 4}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
