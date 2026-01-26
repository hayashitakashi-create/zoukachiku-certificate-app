'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Printer, FileDown } from 'lucide-react';
import Layout from '@/components/Layout';
import { HousingLoanWorkTypes } from '@/types/housingLoanDetail';
import { HousingLoanDetailDisplay, HousingLoanDetailNoData } from '@/components/HousingLoanDetailDisplay';

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
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [housingLoanDetail, setHousingLoanDetail] = useState<any>(null);
  const [housingLoanLoading, setHousingLoanLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    type: string;
    data: any;
    loading: boolean;
  }>({
    open: false,
    type: '',
    data: null,
    loading: false,
  });

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

  const handleOpenPreview = async (renovationType: string) => {
    setPreviewModal({
      open: true,
      type: renovationType,
      data: null,
      loading: true,
    });

    try {
      const response = await fetch(`/api/certificates/${certificateId}/${renovationType}`);
      const result = await response.json();

      if (result.success) {
        setPreviewModal({
          open: true,
          type: renovationType,
          data: result.data,
          loading: false,
        });
      } else {
        alert('データの取得に失敗しました: ' + result.error);
        setPreviewModal({
          open: false,
          type: '',
          data: null,
          loading: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch renovation details:', err);
      alert('データ取得中にエラーが発生しました');
      setPreviewModal({
        open: false,
        type: '',
        data: null,
        loading: false,
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewModal({
      open: false,
      type: '',
      data: null,
      loading: false,
    });
  };

  const handleOpenPurposeModal = async () => {
    setShowPurposeModal(true);

    // housing_loanの場合、詳細データを取得
    if (certificate && certificate.purposeType === 'housing_loan') {
      setHousingLoanLoading(true);
      try {
        const response = await fetch(`/api/housing-loan-detail?certificateId=${certificateId}`);
        const result = await response.json();

        if (result.success) {
          setHousingLoanDetail(result.data);
        } else {
          setHousingLoanDetail(null);
        }
      } catch (err) {
        console.error('Failed to fetch housing loan detail:', err);
        setHousingLoanDetail(null);
      } finally {
        setHousingLoanLoading(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDFDownload = async () => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/pdf`);

      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF生成中にエラーが発生しました');
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
      reform_tax: '住宅借入金等特別税額控除',
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
    <>
      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          /* 印刷時に非表示にする要素 */
          .no-print {
            display: none !important;
          }

          /* 印刷時のページ設定 */
          @page {
            size: A4;
            margin: 20mm;
          }

          /* 背景色を削除 */
          body {
            background: white !important;
          }

          /* ヘッダーのボタンを非表示 */
          header button,
          header a {
            display: none !important;
          }

          /* カラー調整 */
          .bg-gradient-to-br {
            background: white !important;
          }

          /* 影を削除 */
          .shadow,
          .shadow-sm,
          .shadow-md,
          .shadow-lg {
            box-shadow: none !important;
          }

          /* ページ分割の最適化 */
          .bg-white {
            page-break-inside: avoid;
          }

          /* リンクの色を黒に */
          a {
            color: black !important;
            text-decoration: none !important;
          }
        }
      `}</style>

      <Layout
        title="証明書詳細"
        actions={
          <>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: '#F1F5F9',
                color: '#475569',
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              一覧に戻る
            </Link>
            <Link
              href={`/certificate/${certificateId}/preview`}
              className="px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
              }}
            >
              <Eye className="w-5 h-5" />
              プレビュー
            </Link>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
              }}
            >
              <Printer className="w-5 h-5" />
              印刷
            </button>
            <button
              onClick={handlePDFDownload}
              className="px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
              }}
            >
              <FileDown className="w-5 h-5" />
              PDF出力
            </button>
          </>
        }
      >
      <div className="max-w-7xl mx-auto">
        {/* ステータスとアクションボタン */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 text-base font-semibold rounded-full ${getStatusColor(
                certificate.status
              )}`}
            >
              {getStatusLabel(certificate.status)}
            </span>
            <span className="text-base text-gray-500">
              作成日: {new Date(certificate.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          <div className="flex gap-3 no-print">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              🗑️ 削除
            </button>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">基本情報</h2>
            <div className="flex gap-2 no-print">
              <Link
                href={`/certificate/create?id=${certificateId}&step=1`}
                className="px-4 py-2 bg-blue-600 text-white text-base rounded hover:bg-blue-700 transition-colors"
              >
                編集
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                申請者氏名
              </label>
              <p className="text-lg text-gray-900">{certificate.applicantName}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                申請者住所
              </label>
              <p className="text-lg text-gray-900">{certificate.applicantAddress}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                物件番号
              </label>
              <p className="text-lg text-gray-900">{certificate.propertyNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                物件所在地
              </label>
              <p className="text-lg text-gray-900">{certificate.propertyAddress}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                工事完了年月日
              </label>
              <p className="text-lg text-gray-900">
                {new Date(certificate.completionDate).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
        </div>

        {/* 用途区分 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">用途区分</h2>
            <div className="flex gap-2 no-print">
              <button
                onClick={handleOpenPurposeModal}
                className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 text-base rounded hover:bg-blue-200 transition-colors"
              >
                📋 詳細
              </button>
              <Link
                href={`/certificate/create?id=${certificateId}&step=1`}
                className="px-4 py-2 bg-blue-600 text-white text-base rounded hover:bg-blue-700 transition-colors"
              >
                編集
              </Link>
            </div>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-600 mb-1">
              証明書の用途
            </label>
            <p className="text-lg text-gray-900">
              {getPurposeTypeLabel(certificate.purposeType)}
            </p>
          </div>
        </div>

        {/* 証明者情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">証明者情報</h2>
            <div className="flex gap-2 no-print">
              <Link
                href="/settings"
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 text-base rounded hover:bg-gray-200 transition-colors"
              >
                デフォルト設定
              </Link>
              <Link
                href={`/certificate/create?id=${certificateId}&step=3`}
                className="px-4 py-2 bg-blue-600 text-white text-base rounded hover:bg-blue-700 transition-colors"
              >
                編集
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                証明者氏名
              </label>
              <p className="text-lg text-gray-900">{certificate.issuerName || '-'}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                所属事務所名
              </label>
              <p className="text-lg text-gray-900">{certificate.issuerOfficeName || '-'}</p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                組織種別
              </label>
              <p className="text-lg text-gray-900">
                {certificate.issuerOrganizationType || '-'}
              </p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                資格番号
              </label>
              <p className="text-lg text-gray-900">
                {certificate.issuerQualificationNumber || '-'}
              </p>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                発行日
              </label>
              <p className="text-lg text-gray-900">
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
            <h2 className="text-2xl font-bold text-gray-800">改修工事一覧</h2>
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
                      <div className="flex gap-2 ml-4 no-print">
                        <button
                          onClick={() => handleOpenPreview(key)}
                          className={`px-3 py-1 bg-${color}-100 text-${color}-700 border border-${color}-300 text-sm rounded hover:bg-${color}-200 transition-colors`}
                        >
                          📋 詳細
                        </button>
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
          <div className="border-t pt-4 no-print">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">工事を追加</h3>
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
                    className={`flex items-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                      hasData
                        ? `border-${color}-300 bg-${color}-50 hover:bg-${color}-100`
                        : `border-gray-300 hover:border-${color}-400 hover:bg-${color}-50`
                    }`}
                  >
                    <span className="text-2xl">{getRenovationIcon(key)}</span>
                    <span className="text-base font-medium text-gray-700">
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              証明書を削除しますか？
            </h3>
            <p className="text-base text-gray-600 mb-6">
              この操作は取り消せません。本当に削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-6 py-2.5 text-base bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2.5 text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用途区分詳細モーダル */}
      {showPurposeModal && certificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* モーダルヘッダー */}
            <div className="sticky top-0 bg-blue-50 border-b-2 border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">用途区分の詳細</h2>
                    <p className="text-sm text-gray-600 mt-1">税制優遇制度について</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPurposeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4">
                  <h3 className="font-bold text-blue-900 text-xl mb-2">
                    {getPurposeTypeLabel(certificate.purposeType)}
                  </h3>
                  <p className="text-sm text-blue-800">Excel Row 378-379: 証明書の用途区分</p>
                </div>

                {/* housing_loan */}
                {certificate.purposeType === 'housing_loan' && (
                  housingLoanLoading ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">⏳</div>
                      <p className="text-gray-600">読み込み中...</p>
                    </div>
                  ) : housingLoanDetail ? (
                    <HousingLoanDetailDisplay data={housingLoanDetail} />
                  ) : (
                    <HousingLoanDetailNoData />
                  )
                )}

                {/* reform_tax */}
                {certificate.purposeType === 'reform_tax' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-gray-700">
                        住宅ローンを利用せず、自己資金で特定の改修工事（バリアフリー、省エネ、同居対応、子育て対応）を行った場合に、標準的な工事費用相当額の10%を所得税額から控除できる制度（投資型減税）です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>特定改修工事の標準的な工事費用相当額が50万円を超えること</li>
                        <li>自己の居住用住宅であること</li>
                        <li>工事後6か月以内に居住を開始すること</li>
                        <li>床面積が50㎡以上であること</li>
                        <li>対象工事: バリアフリー、省エネ、同居対応、子育て対応改修</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">控除額</h4>
                      <p className="text-gray-700">
                        標準的な工事費用相当額（上限1,000万円）の10%を、その年の所得税額から控除できます。<br />
                        ※太陽光発電設備を設置した場合は、上限が350万円となります。
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="text-sm text-green-800">
                        <strong>対象改修工事:</strong>
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-green-800">
                        <li>バリアフリー改修工事</li>
                        <li>省エネ改修工事（太陽光発電含む）</li>
                        <li>同居対応改修工事</li>
                        <li>子育て対応改修工事</li>
                      </ul>
                      <p className="text-sm text-green-800 mt-2">
                        ※耐震改修工事・その他増改築等工事は対象外です
                      </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Excel構造:</strong> この用途を選択した場合、Row 378-460に各改修工事の費用詳細が記載され、標準単価による控除対象額が計算されます。
                      </p>
                    </div>
                  </div>
                )}

                {/* resale */}
                {certificate.purposeType === 'resale' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-gray-700">
                        中古住宅の売買において、既存住宅売買瑕疵保険に加入するために必要な証明書です。住宅の性能が一定の基準を満たしていることを証明します。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">活用目的</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>既存住宅売買瑕疵保険の加入</li>
                        <li>住宅ローン減税の適用（築年数要件の緩和）</li>
                        <li>登録免許税・不動産取得税の軽減</li>
                        <li>贈与税の非課税枠拡大</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded p-4">
                      <p className="text-sm text-purple-800">
                        <strong>証明内容:</strong> 耐震性能、劣化対策、維持管理・更新の容易性などが一定の基準を満たしていることを証明します。
                      </p>
                    </div>
                  </div>
                )}

                {/* property_tax */}
                {certificate.purposeType === 'property_tax' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-gray-700">
                        耐震改修工事を行った住宅について、固定資産税を一定期間減額する制度です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>昭和57年1月1日以前から存在する住宅であること</li>
                        <li>現行の耐震基準に適合する耐震改修を行うこと</li>
                        <li>工事費用が50万円を超えること</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">減額内容</h4>
                      <p className="text-gray-700">
                        家屋の固定資産税額（120㎡相当分まで）の2分の1を、改修後一定期間減額します。
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-4">
                      <p className="text-sm text-orange-800">
                        <strong>手続き:</strong> 工事完了後3か月以内に市区町村へ申告が必要です。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 閉じるボタン */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowPurposeModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細プレビューモーダル */}
      {previewModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* モーダルヘッダー */}
            <div className={`sticky top-0 bg-${getRenovationColor(previewModal.type)}-50 border-b-2 border-${getRenovationColor(previewModal.type)}-200 p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getRenovationIcon(previewModal.type)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {getRenovationLabel(previewModal.type)}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">工事内容の詳細</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6">
              {previewModal.loading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : previewModal.data ? (
                <>
                  {/* 工事項目一覧 */}
                  {previewModal.data.works && previewModal.data.works.length > 0 ? (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg text-gray-800 mb-3">工事項目一覧</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 rounded-lg">
                          <thead className={`bg-${getRenovationColor(previewModal.type)}-100`}>
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                工事名
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                                単価
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">
                                単位
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                                数量
                              </th>
                              {previewModal.data.works[0].ratio !== null && (
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                                  割合
                                </th>
                              )}
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">
                                計算額
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewModal.data.works.map((work: any, index: number) => (
                              <tr key={work.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600 border-b">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 border-b">
                                  {work.workName || work.workDescription || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right border-b">
                                  ¥{Number(work.unitPrice || work.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center border-b">
                                  {work.unit || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right border-b">
                                  {work.quantity ? Number(work.quantity).toLocaleString() : '-'}
                                </td>
                                {work.ratio !== null && (
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-b">
                                    {work.ratio ? `${Number(work.ratio)}%` : '-'}
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right border-b">
                                  ¥{Number(work.calculatedAmount || work.amount || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 mb-6">
                      <p className="text-2xl mb-2">📝</p>
                      <p>工事項目が登録されていません</p>
                    </div>
                  )}

                  {/* サマリー情報 */}
                  {previewModal.data.summary && (
                    <div className={`bg-${getRenovationColor(previewModal.type)}-50 border border-${getRenovationColor(previewModal.type)}-200 rounded-lg p-5`}>
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">計算サマリー</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">工事費総額</p>
                          <p className="text-xl font-bold text-gray-900">
                            ¥{Number(previewModal.data.summary.totalAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">補助金額</p>
                          <p className="text-xl font-bold text-gray-900">
                            ¥{Number(previewModal.data.summary.subsidyAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="text-xs text-gray-600 mb-1">控除対象額</p>
                          <p className="text-xl font-bold text-green-700">
                            ¥{Number(previewModal.data.summary.deductibleAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                    <button
                      onClick={handleClosePreview}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      閉じる
                    </button>
                    <Link
                      href={`/${getRenovationPath(previewModal.type)}?certificateId=${certificateId}`}
                      className={`px-6 py-2 bg-${getRenovationColor(previewModal.type)}-600 text-white rounded-md hover:bg-${getRenovationColor(previewModal.type)}-700 transition-colors`}
                    >
                      ✏️ 編集する
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-gray-600">データの取得に失敗しました</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </Layout>
    </>
  );
}
