'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ステップの定義
type WizardStep = 1 | 2 | 3 | 4;

// フォームデータの型定義
type CertificateFormData = {
  // ステップ1: 基本情報
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string;
  propertyAddress: string;
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

  // ステップ3: 証明者情報
  issuerName: string;
  issuerOfficeName: string;
  issuerOrganizationType: string;
  issuerQualificationNumber: string;
  issueDate: string;
};

export default function CertificateCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CertificateFormData>({
    applicantName: '',
    applicantAddress: '',
    propertyNumber: '',
    propertyAddress: '',
    completionDate: '',
    purposeType: '',
    selectedWorkTypes: [],
    workData: {},
    subsidyAmount: 0,
    issuerName: '',
    issuerOfficeName: '',
    issuerOrganizationType: '',
    issuerQualificationNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
  });

  const steps = [
    { number: 1, title: '基本情報', description: '申請者・物件情報' },
    { number: 2, title: '工事内容', description: '工事種別の選択と入力' },
    { number: 3, title: '証明者情報', description: '発行者情報' },
    { number: 4, title: '確認・保存', description: 'プレビューと保存' },
  ];

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  // 証明書を保存する関数
  const saveCertificate = async (status: 'draft' | 'completed' | 'issued') => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName: formData.applicantName,
          applicantAddress: formData.applicantAddress,
          propertyNumber: formData.propertyNumber || undefined,
          propertyAddress: formData.propertyAddress,
          completionDate: formData.completionDate,
          purposeType: formData.purposeType,
          selectedWorkTypes: formData.selectedWorkTypes,
          subsidyAmount: formData.subsidyAmount,
          issuerName: formData.issuerName,
          issuerOfficeName: formData.issuerOfficeName,
          issuerOrganizationType: formData.issuerOrganizationType,
          issuerQualificationNumber: formData.issuerQualificationNumber || undefined,
          issueDate: formData.issueDate,
          status,
        }),
      });

      const result = await response.json();

      if (result.success) {
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
      !formData.issuerName ||
      !formData.issuerOfficeName ||
      !formData.issuerOrganizationType ||
      !formData.issueDate
    ) {
      alert('必須項目を全て入力してください');
      return;
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
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← トップに戻る
            </Link>
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
                        住所 *
                      </label>
                      <input
                        type="text"
                        value={formData.applicantAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, applicantAddress: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="東京都千代田区○○ 1-2-3"
                      />
                    </div>
                  </div>
                </div>

                {/* 物件情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">物件情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                    <div>
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
                        placeholder="東京都千代田区○○ 1-2-3"
                      />
                    </div>
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
                        label: '改修促進税制',
                        description: '投資型減税',
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
                        href="/seismic-reform"
                        target="_blank"
                        className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">🏗️ 耐震改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('barrierFree') && (
                      <Link
                        href="/barrier-free-reform"
                        target="_blank"
                        className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">♿ バリアフリー改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('energySaving') && (
                      <Link
                        href="/energy-saving-reform"
                        target="_blank"
                        className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">☀️ 省エネ改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('cohabitation') && (
                      <Link
                        href="/cohabitation-reform"
                        target="_blank"
                        className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">👨‍👩‍👧‍👦 同居対応改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('childcare') && (
                      <Link
                        href="/childcare-reform"
                        target="_blank"
                        className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">👶 子育て対応改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('otherRenovation') && (
                      <Link
                        href="/other-renovation"
                        target="_blank"
                        className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">🔨 その他増改築等工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {formData.selectedWorkTypes.includes('longTermHousing') && (
                      <Link
                        href="/long-term-housing"
                        target="_blank"
                        className="p-4 border-2 border-rose-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">⭐ 長期優良住宅化改修工事</p>
                            <p className="text-sm text-gray-600">別画面で入力 →</p>
                          </div>
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
              <h2 className="text-2xl font-bold mb-6">証明者情報</h2>
              <p className="text-gray-600 mb-6">
                証明書を発行する建築士等の情報を入力してください。
              </p>

              <div className="space-y-6">
                {/* 証明者基本情報 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">証明者</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        氏名 *
                      </label>
                      <input
                        type="text"
                        value={formData.issuerName}
                        onChange={(e) =>
                          setFormData({ ...formData, issuerName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="山田 一郎"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        所属事務所名 *
                      </label>
                      <input
                        type="text"
                        value={formData.issuerOfficeName}
                        onChange={(e) =>
                          setFormData({ ...formData, issuerOfficeName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="○○建築設計事務所"
                      />
                    </div>
                  </div>
                </div>

                {/* 組織タイプ */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">組織種別 *</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    証明書を発行できる組織の種類を選択してください
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        value: 'registered_architect_office',
                        label: '登録建築士事務所',
                        description: '建築士事務所登録を受けた事務所',
                      },
                      {
                        value: 'designated_inspection_agency',
                        label: '指定確認検査機関',
                        description: '建築基準法に基づく指定機関',
                      },
                      {
                        value: 'registered_evaluation_agency',
                        label: '登録住宅性能評価機関',
                        description: '住宅品質確保法に基づく評価機関',
                      },
                      {
                        value: 'warranty_insurance_corporation',
                        label: '住宅瑕疵担保責任保険法人',
                        description: '保険法人の建築士',
                      },
                    ].map((orgType) => (
                      <label
                        key={orgType.value}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.issuerOrganizationType === orgType.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="issuerOrganizationType"
                          value={orgType.value}
                          checked={formData.issuerOrganizationType === orgType.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              issuerOrganizationType: e.target.value,
                            })
                          }
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium">{orgType.label}</p>
                          <p className="text-sm text-gray-600">{orgType.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 資格番号 */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-4">資格情報</h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      建築士登録番号・資格番号
                    </label>
                    <input
                      type="text"
                      value={formData.issuerQualificationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          issuerQualificationNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: 第123456号"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      一級建築士、二級建築士、木造建築士の登録番号等を入力
                    </p>
                  </div>
                </div>

                {/* 発行日 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">証明書発行日</h3>
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
                    <p className="mt-2 text-sm text-gray-500">
                      証明書を発行する日付を入力してください
                    </p>
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
                        {formData.applicantAddress || '（未入力）'}
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
                        {formData.purposeType === 'reform_tax' && '改修促進税制'}
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
                      onClick={() => goToStep(3)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集 →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">証明者氏名</p>
                      <p className="font-medium">
                        {formData.issuerName || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">所属事務所名</p>
                      <p className="font-medium">
                        {formData.issuerOfficeName || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">組織種別</p>
                      <p className="font-medium">
                        {formData.issuerOrganizationType === 'registered_architect_office' &&
                          '登録建築士事務所'}
                        {formData.issuerOrganizationType === 'designated_inspection_agency' &&
                          '指定確認検査機関'}
                        {formData.issuerOrganizationType === 'registered_evaluation_agency' &&
                          '登録住宅性能評価機関'}
                        {formData.issuerOrganizationType === 'warranty_insurance_corporation' &&
                          '住宅瑕疵担保責任保険法人'}
                        {!formData.issuerOrganizationType && '（未選択）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">資格番号</p>
                      <p className="font-medium">
                        {formData.issuerQualificationNumber || '（未入力）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">発行日</p>
                      <p className="font-medium">
                        {formData.issueDate || '（未入力）'}
                      </p>
                    </div>
                  </div>
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
                  if (!formData.issuerName) errors.push('証明者氏名が未入力です');
                  if (!formData.issuerOfficeName) errors.push('所属事務所名が未入力です');
                  if (!formData.issuerOrganizationType) errors.push('組織種別が未選択です');
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
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← 前へ
          </button>
          <button
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
