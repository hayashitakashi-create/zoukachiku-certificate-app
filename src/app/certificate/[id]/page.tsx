'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Certificate = {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type RenovationSummary = {
  id: string;
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  workCount: number;
};

type CombinedCalculation = {
  renovations: {
    seismic?: any;
    barrierFree?: any;
    energy?: any;
    cohabitation?: any;
    childcare?: any;
    other?: any;
  };
  combined: {
    totalDeductible: number;
    maxControlAmount: number;
    excessAmount: number;
    finalDeductible: number;
    remaining: number;
  };
  summary: {
    hasRenovations: boolean;
    renovationTypes: string[];
    totalWorkCost: number;
    maxTaxDeduction: number;
    remainingLimit: number;
  };
};

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [combinedCalculation, setCombinedCalculation] = useState<CombinedCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [certificateId, setCertificateId] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCertificateId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (certificateId) {
      fetchCertificateData();
    }
  }, [certificateId]);

  const fetchCertificateData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 証明書基本情報と統合計算結果を並行取得
      const [certResponse, calcResponse] = await Promise.all([
        fetch(`/api/certificates/${certificateId}`),
        fetch(`/api/certificates/${certificateId}/calculate-combined`),
      ]);

      const certResult = await certResponse.json();
      const calcResult = await calcResponse.json();

      if (certResult.success) {
        setCertificate(certResult.data);
      } else {
        setError(certResult.error || '証明書の取得に失敗しました');
      }

      if (calcResult.success) {
        setCombinedCalculation(calcResult.data);
      }
    } catch (err) {
      console.error('Failed to fetch certificate data:', err);
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/certificates/${certificateId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        router.push('/');
      } else {
        alert(result.error || '証明書の削除に失敗しました');
      }
    } catch (err) {
      console.error('Failed to delete certificate:', err);
      alert('証明書の削除中にエラーが発生しました');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteRenovation = async (renovationType: string) => {
    if (!confirm(`${getRenovationLabel(renovationType)}のデータを削除しますか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/certificates/${certificateId}/${renovationType}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        alert('削除しました');
        fetchCertificateData(); // データを再取得
      } else {
        alert('削除に失敗しました: ' + result.error);
      }
    } catch (err) {
      console.error('Failed to delete renovation:', err);
      alert('削除中にエラーが発生しました');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '下書き',
      issued: '発行済み',
      completed: '完了',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPurposeTypeLabel = (purposeType: string) => {
    const labels: Record<string, string> = {
      housing_loan: '住宅借入金等特別控除',
      reform_tax: '特定増改築等住宅借入金等特別控除',
      resale: '既存住宅に係る特定の改修工事をした場合の所得税額の特別控除',
      property_tax: '固定資産税の減額',
    };
    return labels[purposeType] || purposeType;
  };

  const getRenovationLabel = (key: string) => {
    const labels: Record<string, string> = {
      seismic: '耐震改修工事',
      barrierFree: 'バリアフリー改修工事',
      energy: '省エネ改修工事',
      cohabitation: '同居対応改修工事',
      childcare: '子育て対応改修工事',
      other: 'その他増改築等工事',
    };
    return labels[key] || key;
  };

  const getRenovationColor = (key: string) => {
    const colors: Record<string, string> = {
      seismic: 'blue',
      barrierFree: 'green',
      energy: 'orange',
      cohabitation: 'purple',
      childcare: 'pink',
      other: 'indigo',
    };
    return colors[key] || 'gray';
  };

  const getRenovationIcon = (key: string) => {
    const icons: Record<string, string> = {
      seismic: '🏗️',
      barrierFree: '♿',
      energy: '🌱',
      cohabitation: '👨‍👩‍👧‍👦',
      childcare: '👶',
      other: '🔨',
    };
    return icons[key] || '📋';
  };

  const getRenovationPath = (key: string) => {
    const paths: Record<string, string> = {
      seismic: 'seismic-reform',
      barrierFree: 'barrier-free-reform',
      energy: 'energy-saving-reform',
      cohabitation: 'cohabitation-reform',
      childcare: 'childcare-reform',
      other: 'other-renovation',
    };
    return paths[key] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error || '証明書が見つかりません'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">証明書詳細</h1>
              <p className="mt-2 text-gray-600">
                増改築等工事証明書の詳細情報
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                ← 一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ステータスとアクションボタン */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                certificate.status
              )}`}
            >
              {getStatusLabel(certificate.status)}
            </span>
            <span className="text-sm text-gray-500">
              作成日: {new Date(certificate.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              🗑️ 削除
            </button>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                申請者氏名
              </label>
              <p className="text-gray-900">{certificate.applicantName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                申請者住所
              </label>
              <p className="text-gray-900">{certificate.applicantAddress}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                物件番号
              </label>
              <p className="text-gray-900">{certificate.propertyNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                物件所在地
              </label>
              <p className="text-gray-900">{certificate.propertyAddress}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                工事完了年月日
              </label>
              <p className="text-gray-900">
                {new Date(certificate.completionDate).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                用途区分
              </label>
              <p className="text-gray-900">
                {getPurposeTypeLabel(certificate.purposeType)}
              </p>
            </div>
          </div>
        </div>

        {/* 証明者情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">証明者情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                証明者氏名
              </label>
              <p className="text-gray-900">{certificate.issuerName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                所属事務所名
              </label>
              <p className="text-gray-900">{certificate.issuerOfficeName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                組織種別
              </label>
              <p className="text-gray-900">
                {certificate.issuerOrganizationType || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                資格番号
              </label>
              <p className="text-gray-900">
                {certificate.issuerQualificationNumber || '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                発行日
              </label>
              <p className="text-gray-900">
                {certificate.issueDate
                  ? new Date(certificate.issueDate).toLocaleDateString('ja-JP')
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 改修工事一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">改修工事一覧</h2>
          </div>

          {/* 登録済み改修工事 */}
          {combinedCalculation && combinedCalculation.summary.hasRenovations ? (
            <div className="space-y-4 mb-6">
              {Object.entries(combinedCalculation.renovations).map(([key, renovation]) => {
                if (!renovation) return null;
                const color = getRenovationColor(key);
                return (
                  <div
                    key={key}
                    className={`border-2 border-${color}-200 bg-${color}-50 rounded-lg p-4`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getRenovationIcon(key)}</span>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-${color}-900 text-lg`}>
                            {getRenovationLabel(key)}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className={`text-${color}-600 text-xs`}>工事費用</p>
                              <p className={`font-semibold text-${color}-900`}>
                                ¥{renovation.totalCost.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className={`text-${color}-600 text-xs`}>補助金控除後</p>
                              <p className={`font-semibold text-${color}-900`}>
                                ¥{renovation.afterSubsidy.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className={`text-${color}-600 text-xs`}>控除対象額</p>
                              <p className={`font-semibold text-${color}-900`}>
                                ¥{renovation.deductibleAmount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className={`text-${color}-600 text-xs`}>上限適用後</p>
                              <p className={`font-bold text-${color}-900`}>
                                ¥{renovation.maxDeduction.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link
                          href={`/${getRenovationPath(key)}?certificateId=${certificateId}`}
                          className={`px-3 py-1 bg-${color}-600 text-white text-sm rounded hover:bg-${color}-700 transition-colors`}
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDeleteRenovation(key)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📝</p>
              <p>まだ改修工事が登録されていません</p>
              <p className="text-sm mt-1">下記から工事を追加してください</p>
            </div>
          )}

          {/* 工事追加ボタン */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">工事を追加</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'seismic', path: 'seismic-reform' },
                { key: 'barrierFree', path: 'barrier-free-reform' },
                { key: 'energy', path: 'energy-saving-reform' },
                { key: 'cohabitation', path: 'cohabitation-reform' },
                { key: 'childcare', path: 'childcare-reform' },
                { key: 'other', path: 'other-renovation' },
              ].map(({ key, path }) => {
                const color = getRenovationColor(key);
                const hasData = combinedCalculation?.renovations[key as keyof typeof combinedCalculation.renovations];
                return (
                  <Link
                    key={key}
                    href={`/${path}?certificateId=${certificateId}`}
                    className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${
                      hasData
                        ? `border-${color}-300 bg-${color}-50 hover:bg-${color}-100`
                        : `border-gray-300 hover:border-${color}-400 hover:bg-${color}-50`
                    }`}
                  >
                    <span className="text-xl">{getRenovationIcon(key)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {getRenovationLabel(key)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 統合計算結果 */}
        {combinedCalculation && combinedCalculation.summary.hasRenovations && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-bold text-blue-900">統合計算結果</h2>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Excel Row 442-460: 複数改修種別の統合計算（1,000万円上限適用）
            </p>

            <div className="bg-white rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">⑱ 最大工事費（補助金差引後）</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ¥{combinedCalculation.combined.totalDeductible.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">⑰ 最大控除額（10%控除分）</p>
                  <p className="text-2xl font-bold text-green-900">
                    ¥{combinedCalculation.combined.maxControlAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ※1,000万円上限適用済み
                  </p>
                </div>
              </div>

              {combinedCalculation.combined.excessAmount > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-sm text-yellow-700 font-semibold">
                        ⑲ 超過額: ¥{combinedCalculation.combined.excessAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        控除対象額が1,000万円の上限を超えています
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">㉑ 最終控除対象額</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ⑱とその他増改築の合算
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">
                    ¥{combinedCalculation.combined.finalDeductible.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">㉒ 残り控除可能額</p>
                  <p className="text-lg font-semibold text-gray-700">
                    ¥{combinedCalculation.combined.remaining.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  1,000万円 - ⑰ = 残り控除可能額
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              証明書を削除しますか？
            </h3>
            <p className="text-gray-600 mb-6">
              この操作は取り消せません。本当に削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
