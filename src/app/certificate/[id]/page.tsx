'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateCertificatePDF } from '@/lib/pdfGenerator';
import { calculateCertificateCost, getWorkTypeBreakdown } from '@/lib/certificateCostCalculator';

type WorkItem = {
  id: string;
  workType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
};

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
  works?: {
    seismic: WorkItem[];
    barrierFree: WorkItem[];
    energySaving: WorkItem[];
    cohabitation: WorkItem[];
    childcare: WorkItem[];
    otherRenovation: WorkItem[];
    longTermHousing: WorkItem[];
  };
};

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
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
      fetchCertificate();
    }
  }, [certificateId]);

  const fetchCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/certificates/${certificateId}`);
      const result = await response.json();

      if (result.success) {
        setCertificate(result.data);
      } else {
        setError(result.error || '証明書の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch certificate:', err);
      setError('証明書の取得中にエラーが発生しました');
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

  const getWorkTypeLabel = (key: string) => {
    const labels: Record<string, string> = {
      seismic: '耐震改修工事',
      barrierFree: 'バリアフリー改修工事',
      energySaving: '省エネ改修工事',
      cohabitation: '同居対応改修工事',
      childcare: '子育て対応改修工事',
      otherRenovation: 'その他増改築等工事',
      longTermHousing: '長期優良住宅化改修工事',
    };
    return labels[key] || key;
  };

  const calculateWorkTotal = (works: WorkItem[]) => {
    return works.reduce((sum, work) => sum + work.totalAmount, 0);
  };

  const calculateGrandTotal = () => {
    if (!certificate?.works) return 0;
    let total = 0;
    Object.values(certificate.works).forEach((workArray) => {
      total += calculateWorkTotal(workArray);
    });
    return total;
  };

  const calculateDeductibleAmount = () => {
    const grandTotal = calculateGrandTotal();
    const subsidyAmount = certificate?.subsidyAmount || 0;
    return Math.max(0, grandTotal - subsidyAmount);
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
            {/* 編集ボタン - 住宅借入金等特別控除の場合は専用編集ページへ */}
            {certificate.purposeType === 'housing_loan' ? (
              <Link
                href={`/certificate/housing-loan-detail?certificateId=${certificate.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                ✏️ 編集
              </Link>
            ) : (
              <button
                onClick={() => {
                  alert('この証明書タイプの編集機能は準備中です');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                ✏️ 編集
              </button>
            )}

            <button
              onClick={async () => {
                if (certificate) {
                  try {
                    // Use API endpoint for housing_loan purpose type PDF download
                    if (certificate.purposeType === 'housing_loan') {
                      window.location.href = `/api/certificates/${certificate.id}/pdf`;
                    } else {
                      generateCertificatePDF(certificate as any);
                    }
                  } catch (error) {
                    console.error('PDF download error:', error);
                    alert('PDFのダウンロードに失敗しました');
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              📄 PDFダウンロード
            </button>
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

        {/* 工事種別分類（第1号〜第6号） - 住宅借入金等特別控除の場合のみ表示 */}
        {certificate.purposeType === 'housing_loan' && certificate.works && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-blue-900">
                工事種別（第1号〜第6号工事）
              </h2>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              住宅借入金等特別控除における工事種別の分類
            </p>
            {(() => {
              const calculation = calculateCertificateCost(
                certificate.works as any,
                certificate.subsidyAmount
              );
              const breakdown = getWorkTypeBreakdown(calculation);

              return (
                <div className="space-y-3">
                  {breakdown.map((work) => (
                    <div
                      key={work.classificationNumber}
                      className={`p-4 rounded-lg border-2 ${
                        work.hasWork
                          ? 'bg-white border-blue-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">
                            {work.hasWork ? '✅' : '⬜'}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {work.classification}: {work.label}
                            </p>
                            {work.hasWork && (
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                ¥{work.amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-5 bg-white rounded-lg border-2 border-blue-400">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">工事費用合計:</span>
                        <span className="text-xl font-bold">
                          ¥{calculation.totalWorkCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">補助金額:</span>
                        <span className="text-xl font-bold text-red-600">
                          -¥{calculation.subsidyAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                        <span className="text-lg font-bold">控除対象額:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ¥{calculation.deductibleAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* 100万円要件のチェック */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {calculation.meetsHousingLoanRequirement ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <span className="text-xl">✓</span>
                            <span className="font-semibold">
                              住宅借入金等特別控除の要件を満たしています（100万円以上）
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <span className="text-xl">⚠</span>
                            <span className="font-semibold">
                              注意: 控除対象額が100万円未満です（現在: {(
                                calculation.deductibleAmount / 10000
                              ).toLocaleString()}万円）
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 工事内容 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">工事内容詳細</h2>
          {certificate.works && (
            <div className="space-y-6">
              {Object.entries(certificate.works).map(([key, workItems]) => {
                if (!workItems || workItems.length === 0) return null;
                return (
                  <div key={key}>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      {getWorkTypeLabel(key)}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              工事種別
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              数量
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              単価
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              金額
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {workItems.map((work) => (
                            <tr key={work.id}>
                              <td className="px-4 py-3 text-gray-900">
                                {work.workType}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {work.quantity.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                ¥{work.unitPrice.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                ¥{work.totalAmount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right text-gray-700"
                            >
                              小計
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              ¥{calculateWorkTotal(workItems).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 金額サマリー */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">金額サマリー</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700">工事費用合計</span>
              <span className="text-xl font-semibold text-gray-900">
                ¥{calculateGrandTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700">補助金額</span>
              <span className="text-xl font-semibold text-red-600">
                -¥{certificate.subsidyAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-gray-900">
                控除対象額
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{calculateDeductibleAmount().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
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
