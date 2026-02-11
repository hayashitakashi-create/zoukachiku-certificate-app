'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificateStore, type Certificate } from '@/lib/store';
import { generateHousingLoanPDF } from '@/lib/housingLoanPdfGeneratorV2';
import { generatePropertyTaxPDF } from '@/lib/pdf/propertyTaxPdfGenerator';
import { generateReformTaxPDF } from '@/lib/pdf/reformTaxPdfGenerator';
import { generateResalePDF } from '@/lib/pdf/resalePdfGenerator';

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
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCertificateId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!certificateId) return;
    const loadCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        const cert = await certificateStore.getCertificate(certificateId);
        if (cert) {
          setCertificate(cert);
        } else {
          setError('証明書が見つかりません');
        }
      } catch (err) {
        console.error('Failed to load certificate:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    loadCertificate();
  }, [certificateId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await certificateStore.deleteCertificate(certificateId);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete certificate:', err);
      alert('証明書の削除中にエラーが発生しました');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteWork = async (workKey: string) => {
    const label = getRenovationLabel(workKey);
    if (!confirm(`${label}のデータを削除しますか？`)) return;

    try {
      const categoryMap: Record<string, string> = {
        seismic: 'seismic',
        barrierFree: 'barrierFree',
        energy: 'energySaving',
        cohabitation: 'cohabitation',
        childcare: 'childcare',
        longTermHousing: 'longTermHousing',
        other: 'otherRenovation',
      };
      const category = categoryMap[workKey];
      if (category) {
        await certificateStore.clearWorks(certificateId, category as any);
        // リロード
        const cert = await certificateStore.getCertificate(certificateId);
        if (cert) setCertificate(cert);
        alert('削除しました');
      }
    } catch (err) {
      console.error('Failed to delete work:', err);
      alert('削除中にエラーが発生しました');
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    setGeneratingPdf(true);
    try {
      const baseData = {
        id: certificate.id,
        applicantName: certificate.applicantName,
        applicantAddress: certificate.applicantAddress,
        propertyNumber: certificate.propertyNumber || null,
        propertyAddress: certificate.propertyAddress,
        completionDate: certificate.completionDate,
        purposeType: certificate.purposeType,
        subsidyAmount: certificate.subsidyAmount || 0,
        issuerName: certificate.issuerName || null,
        issuerOfficeName: certificate.issuerOfficeName || null,
        issuerOrganizationType: certificate.issuerOrganizationType || null,
        issuerQualificationNumber: certificate.issuerQualificationNumber || null,
        issueDate: certificate.issueDate || null,
        status: certificate.status,
        issuerInfo: certificate.issuerInfo || null,
      };

      let pdfBytes: Uint8Array;
      let filePrefix: string;

      switch (certificate.purposeType) {
        case 'housing_loan': {
          const detail = certificate.housingLoanDetail;
          pdfBytes = await generateHousingLoanPDF({
            ...baseData,
            housingLoanDetail: detail ? {
              id: certificate.id,
              workTypes: detail.workTypes,
              workDescription: detail.workDescription || null,
              totalCost: detail.totalCost,
              hasSubsidy: detail.subsidyAmount > 0,
              subsidyAmount: detail.subsidyAmount,
              deductibleAmount: detail.deductibleAmount,
            } : null,
          });
          filePrefix = 'housing-loan';
          break;
        }
        case 'property_tax': {
          const works = certificate.works;
          pdfBytes = await generatePropertyTaxPDF({
            ...baseData,
            seismic: works.seismic.summary ? {
              totalAmount: works.seismic.summary.totalAmount,
              subsidyAmount: works.seismic.summary.subsidyAmount,
              deductibleAmount: works.seismic.summary.deductibleAmount,
            } : undefined,
            barrierFree: works.barrierFree.summary ? {
              totalAmount: works.barrierFree.summary.totalAmount,
              subsidyAmount: works.barrierFree.summary.subsidyAmount,
              deductibleAmount: works.barrierFree.summary.deductibleAmount,
            } : undefined,
            energySaving: works.energySaving.summary ? {
              totalAmount: works.energySaving.summary.totalAmount,
              subsidyAmount: works.energySaving.summary.subsidyAmount,
              deductibleAmount: works.energySaving.summary.deductibleAmount,
              hasSolarPower: works.energySaving.summary.hasSolarPower || false,
            } : undefined,
            longTermHousing: works.longTermHousing.summary ? {
              totalAmount: works.longTermHousing.summary.totalAmount,
              subsidyAmount: works.longTermHousing.summary.subsidyAmount,
              deductibleAmount: works.longTermHousing.summary.deductibleAmount,
              isExcellentHousing: works.longTermHousing.summary.isExcellentHousing || false,
            } : undefined,
          });
          filePrefix = 'property-tax';
          break;
        }
        case 'reform_tax': {
          // reformTaxDetail が保存済みならそのまま使用（新フォームから保存された場合）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rtDetail = (certificate as any).reformTaxDetail;
          if (rtDetail) {
            pdfBytes = await generateReformTaxPDF({
              ...baseData,
              ...rtDetail,
            });
          } else {
            // 旧データ互換: works から再計算
            const rtWorks = certificate.works;
            const toWorkCost = (summary: { totalAmount: number; subsidyAmount: number; deductibleAmount: number } | null, limit: number) => {
              if (!summary) return undefined;
              const maxDeduction = Math.min(summary.deductibleAmount, limit);
              return {
                totalAmount: summary.totalAmount,
                subsidyAmount: summary.subsidyAmount,
                deductibleAmount: summary.deductibleAmount,
                maxDeduction,
                excessAmount: Math.max(0, summary.deductibleAmount - maxDeduction),
              };
            };

            const hasSolar = rtWorks.energySaving.summary?.hasSolarPower || false;
            const energyLimit = hasSolar ? 3_500_000 : 2_500_000;

            const ltSummary = rtWorks.longTermHousing.summary;
            const isExcellent = ltSummary?.isExcellentHousing || false;

            let longTermHousingOr: ReturnType<typeof toWorkCost> = undefined;
            let longTermHousingAnd: ReturnType<typeof toWorkCost> & { isExcellentHousing?: boolean } | undefined = undefined;

            if (ltSummary && ltSummary.deductibleAmount > 0) {
              if (isExcellent) {
                const andLimit = hasSolar ? 6_000_000 : 5_000_000;
                const maxDed = Math.min(ltSummary.deductibleAmount, andLimit);
                longTermHousingAnd = {
                  totalAmount: ltSummary.totalAmount,
                  subsidyAmount: ltSummary.subsidyAmount,
                  deductibleAmount: ltSummary.deductibleAmount,
                  maxDeduction: maxDed,
                  excessAmount: Math.max(0, ltSummary.deductibleAmount - maxDed),
                  isExcellentHousing: true,
                };
              } else {
                const orLimit = hasSolar ? 3_500_000 : 2_500_000;
                const maxDed = Math.min(ltSummary.deductibleAmount, orLimit);
                longTermHousingOr = {
                  totalAmount: ltSummary.totalAmount,
                  subsidyAmount: ltSummary.subsidyAmount,
                  deductibleAmount: ltSummary.deductibleAmount,
                  maxDeduction: maxDed,
                  excessAmount: Math.max(0, ltSummary.deductibleAmount - maxDed),
                };
              }
            }

            pdfBytes = await generateReformTaxPDF({
              ...baseData,
              seismic: toWorkCost(rtWorks.seismic.summary, 2_500_000),
              barrierFree: toWorkCost(rtWorks.barrierFree.summary, 2_000_000),
              energySaving: rtWorks.energySaving.summary ? {
                ...toWorkCost(rtWorks.energySaving.summary, energyLimit)!,
                hasSolarPower: hasSolar,
              } : undefined,
              cohabitation: toWorkCost(rtWorks.cohabitation.summary, 2_500_000),
              childcare: toWorkCost(rtWorks.childcare.summary, 2_500_000),
              longTermHousingOr,
              longTermHousingAnd: longTermHousingAnd as typeof longTermHousingAnd & { isExcellentHousing: boolean } | undefined,
              otherRenovation: rtWorks.otherRenovation.summary ? {
                totalAmount: rtWorks.otherRenovation.summary.totalAmount,
                subsidyAmount: rtWorks.otherRenovation.summary.subsidyAmount,
                deductibleAmount: rtWorks.otherRenovation.summary.deductibleAmount,
                maxDeduction: rtWorks.otherRenovation.summary.deductibleAmount,
                excessAmount: 0,
              } : undefined,
            });
          }
          filePrefix = 'reform-tax';
          break;
        }
        case 'resale': {
          const rsWorks = certificate.works;
          // 全工事の合計を計算
          const allSummaries = [
            rsWorks.seismic.summary,
            rsWorks.barrierFree.summary,
            rsWorks.energySaving.summary,
            rsWorks.cohabitation.summary,
            rsWorks.childcare.summary,
            rsWorks.longTermHousing.summary,
            rsWorks.otherRenovation.summary,
          ];
          const totalWorkCost = allSummaries.reduce(
            (sum, s) => sum + (s?.totalAmount ?? 0), 0
          );
          const totalSubsidy = certificate.subsidyAmount || 0;
          const deductible = Math.max(0, totalWorkCost - totalSubsidy);

          const rsDetail = certificate.housingLoanDetail;
          pdfBytes = await generateResalePDF({
            ...baseData,
            totalWorkCost,
            hasSubsidy: totalSubsidy > 0,
            subsidyAmount: totalSubsidy,
            deductibleAmount: deductible,
            housingLoanDetail: rsDetail ? {
              workTypes: rsDetail.workTypes,
              workDescription: rsDetail.workDescription || null,
              totalCost: rsDetail.totalCost,
              hasSubsidy: rsDetail.subsidyAmount > 0,
              subsidyAmount: rsDetail.subsidyAmount,
              deductibleAmount: rsDetail.deductibleAmount,
            } : null,
          });
          filePrefix = 'resale';
          break;
        }
        default:
          alert(`${certificate.purposeType} タイプのPDF生成は現在準備中です`);
          return;
      }

      // ブラウザでダウンロード
      const blob = new Blob([new Uint8Array(pdfBytes) as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${filePrefix}_${certificate.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF生成中にエラーが発生しました');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { draft: '下書き', completed: '完了' };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-stone-100 text-stone-600 px-3 py-1 text-xs font-semibold rounded-full',
      completed: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-sm shadow-amber-600/20',
    };
    return colors[status] || 'bg-stone-100 text-stone-600 px-3 py-1 text-xs font-semibold rounded-full';
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
      longTermHousing: '長期優良住宅化改修工事',
      other: 'その他増改築等工事',
    };
    return labels[key] || key;
  };

  const getRenovationPath = (key: string) => {
    const paths: Record<string, string> = {
      seismic: 'seismic-reform',
      barrierFree: 'barrier-free-reform',
      energy: 'energy-saving-reform',
      cohabitation: 'cohabitation-reform',
      childcare: 'childcare-reform',
      longTermHousing: 'long-term-housing',
      other: 'other-renovation',
    };
    return paths[key] || '';
  };

  // 工事データのサマリーを取得（IndexedDB内のネストデータから）
  const getWorkEntries = () => {
    if (!certificate) return [];
    const works = certificate.works;
    const entries: { key: string; label: string; summary: any; itemCount: number }[] = [];

    const mapping = [
      { key: 'seismic', field: 'seismic' as const },
      { key: 'barrierFree', field: 'barrierFree' as const },
      { key: 'energy', field: 'energySaving' as const },
      { key: 'cohabitation', field: 'cohabitation' as const },
      { key: 'childcare', field: 'childcare' as const },
      { key: 'longTermHousing', field: 'longTermHousing' as const },
      { key: 'other', field: 'otherRenovation' as const },
    ];

    for (const { key, field } of mapping) {
      const workData = works[field];
      if (workData && workData.items.length > 0) {
        entries.push({
          key,
          label: getRenovationLabel(key),
          summary: workData.summary,
          itemCount: workData.items.length,
        });
      }
    }

    return entries;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center">
        <p className="text-stone-600">読み込み中...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">{error || '証明書が見つかりません'}</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-lg shadow-amber-900/20 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const workEntries = getWorkEntries();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      {/* ヘッダー */}
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium">
              &larr; 一覧
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">証明書詳細</h1>
            <span className={getStatusColor(certificate.status)}>
              {getStatusLabel(certificate.status)}
            </span>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Link
              href={`/certificate/${certificateId}/preview`}
              className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-lg shadow-amber-900/20 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
            >
              プレビュー
            </Link>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-lg shadow-amber-900/20 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdf ? 'PDF生成中...' : 'PDF'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full px-5 py-2 text-sm font-semibold transition-all"
            >
              印刷
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white hover:bg-red-600 rounded-full px-5 py-2 text-sm font-semibold transition-all"
            >
              削除
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 基本情報 */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-800">基本情報</h2>
            <Link
              href={`/certificate/create?id=${certificateId}&step=1`}
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-full px-4 py-1.5 text-sm font-medium transition-all no-print"
            >
              編集
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">申請者氏名</label>
              <p className="text-stone-900">{certificate.applicantName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">申請者住所</label>
              <p className="text-stone-900">{certificate.applicantAddress || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">家屋番号</label>
              <p className="text-stone-900">{certificate.propertyNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">物件所在地</label>
              <p className="text-stone-900">{certificate.propertyAddress || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">工事完了年月日</label>
              <p className="text-stone-900">
                {certificate.completionDate
                  ? new Date(certificate.completionDate).toLocaleDateString('ja-JP')
                  : '-'}
              </p>
            </div>
          </div>
        </section>

        {/* 用途区分 */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
          <h2 className="text-lg font-bold text-stone-800 mb-4">用途区分</h2>
          <p className="text-stone-900">{getPurposeTypeLabel(certificate.purposeType)}</p>

          {certificate.purposeType === 'housing_loan' && certificate.housingLoanDetail && (
            <div className="mt-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
              <h3 className="font-semibold text-stone-800 mb-2">住宅借入金等特別控除 詳細</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-sm font-semibold text-stone-500">工事費総額</span>
                  <p className="font-semibold text-stone-900">
                    {certificate.housingLoanDetail.totalCost.toLocaleString()}円
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-500">補助金額</span>
                  <p className="font-semibold text-stone-900">
                    {certificate.housingLoanDetail.subsidyAmount.toLocaleString()}円
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-500">控除対象額</span>
                  <p className="font-bold text-stone-900">
                    {certificate.housingLoanDetail.deductibleAmount.toLocaleString()}円
                  </p>
                </div>
              </div>
              <div className="mt-3 no-print">
                <Link
                  href={`/certificate/housing-loan-detail?certificateId=${certificateId}`}
                  className="text-amber-700 hover:text-amber-800 font-semibold text-sm"
                >
                  詳細を編集 &rarr;
                </Link>
              </div>
            </div>
          )}

          {certificate.purposeType === 'housing_loan' && !certificate.housingLoanDetail && (
            <div className="mt-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 no-print">
              <p className="text-sm text-stone-600 mb-2">住宅借入金等特別控除の詳細がまだ入力されていません。</p>
              <Link
                href={`/certificate/housing-loan-detail?certificateId=${certificateId}`}
                className="text-amber-700 hover:text-amber-800 font-semibold text-sm"
              >
                詳細を入力 &rarr;
              </Link>
            </div>
          )}
        </section>

        {/* 証明者情報 */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-800">証明者情報</h2>
            <Link
              href={`/certificate/create?id=${certificateId}&step=3`}
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-full px-4 py-1.5 text-sm font-medium transition-all no-print"
            >
              編集
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">証明者氏名</label>
              <p className="text-stone-900">{certificate.issuerName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">所属事務所名</label>
              <p className="text-stone-900">{certificate.issuerOfficeName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">組織種別</label>
              <p className="text-stone-900">{certificate.issuerOrganizationType || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">資格番号</label>
              <p className="text-stone-900">{certificate.issuerQualificationNumber || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-500 mb-1">発行日</label>
              <p className="text-stone-900">
                {certificate.issueDate
                  ? new Date(certificate.issueDate).toLocaleDateString('ja-JP')
                  : '-'}
              </p>
            </div>
          </div>
        </section>

        {/* 改修工事一覧 */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
          <h2 className="text-lg font-bold text-stone-800 mb-4">改修工事一覧</h2>

          {workEntries.length > 0 ? (
            <div className="space-y-3 mb-6">
              {workEntries.map((entry) => (
                <div
                  key={entry.key}
                  className="bg-white border-2 border-stone-200 rounded-2xl p-5 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900">{entry.label}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-stone-600">
                        <span>{entry.itemCount}件の工事項目</span>
                        {entry.summary && (
                          <>
                            <span>工事費: {entry.summary.totalAmount.toLocaleString()}円</span>
                            <span>控除対象: {entry.summary.deductibleAmount.toLocaleString()}円</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 no-print">
                      <Link
                        href={`/${getRenovationPath(entry.key)}?certificateId=${certificateId}`}
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDeleteWork(entry.key)}
                        className="bg-red-500 text-white hover:bg-red-600 rounded-full px-5 py-2 text-sm font-semibold transition-all"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500 mb-6">
              <p>まだ改修工事が登録されていません</p>
              <p className="text-sm mt-1 text-stone-400">下記から工事を追加してください</p>
            </div>
          )}

          {/* 工事追加ボタン */}
          <div className="border-t border-stone-200 pt-4 no-print">
            <h3 className="text-sm font-semibold text-stone-500 mb-3">工事を追加</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'seismic', path: 'seismic-reform' },
                { key: 'barrierFree', path: 'barrier-free-reform' },
                { key: 'energy', path: 'energy-saving-reform' },
                { key: 'cohabitation', path: 'cohabitation-reform' },
                { key: 'childcare', path: 'childcare-reform' },
                { key: 'longTermHousing', path: 'long-term-housing' },
                { key: 'other', path: 'other-renovation' },
              ].map(({ key, path }) => (
                <Link
                  key={key}
                  href={`/${path}?certificateId=${certificateId}`}
                  className="flex items-center gap-2 p-3 border-2 border-dashed border-stone-300
                             rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm"
                >
                  <span className="font-medium text-stone-700">{getRenovationLabel(key)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* メタ情報 */}
        <section className="text-xs text-stone-400 space-y-1">
          <p>作成日: {new Date(certificate.createdAt).toLocaleString('ja-JP')}</p>
          <p>更新日: {new Date(certificate.updatedAt).toLocaleString('ja-JP')}</p>
          <p>ID: {certificate.id}</p>
        </section>
      </main>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 mb-2">証明書を削除しますか？</h3>
            <p className="text-sm text-stone-600 mb-6">
              この操作は取り消せません。本当に削除してもよろしいですか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="bg-stone-200 text-stone-700 rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-stone-300 transition-all disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 20mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
