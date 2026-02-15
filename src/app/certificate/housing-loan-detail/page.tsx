'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  HousingLoanDetailFormData,
  HousingLoanWorkTypes,
  Work1Type,
  Work2Type,
  Work3Type,
  Work4Type,
  Work5Type,
  Work6Type,
} from '@/types/housingLoanDetail';
import {
  defaultWork1,
  defaultWork2,
  defaultWork3,
  defaultWork4,
  defaultWork5,
  defaultWork6,
} from '@/types/housingLoanDetail';
import {
  certificateStore,
  type Certificate,
  type HousingLoanDetail,
  createEmptyHousingLoanDetail,
} from '@/lib/store';
import PreviewSection from './components/PreviewSection';
import WorkTypeFormSection from './components/WorkTypeFormSection';
import CostSection from './components/CostSection';

function HousingLoanDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const certificateId = searchParams.get('certificateId');

  const [certificateInfo, setCertificateInfo] = useState<{
    applicantName: string;
    propertyAddress: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<HousingLoanDetailFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HousingLoanDetailFormData>({
    defaultValues: {
      workTypes: {},
      workDescription: '',
      totalCost: 0,
      hasSubsidy: false,
      subsidyAmount: 0,
    },
  });

  // 証明書情報を取得
  useEffect(() => {
    if (certificateId) {
      certificateStore
        .getCertificate(certificateId)
        .then((cert) => {
          if (cert) {
            setCertificateInfo({
              applicantName: cert.applicantName,
              propertyAddress: cert.propertyAddress,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch certificate:', error);
        });
    }
  }, [certificateId]);

  // 既存の住宅借入金詳細データを取得してフォームに反映
  useEffect(() => {
    if (certificateId) {
      certificateStore
        .getCertificate(certificateId)
        .then((cert) => {
          if (cert && cert.housingLoanDetail) {
            // Store形式からForm形式へマッピング
            const detail = cert.housingLoanDetail;
            const formWorkTypes: HousingLoanWorkTypes = {};

            // 簡易マッピング: work1-work6のselectedフラグがtrueなら空のデフォルトオブジェクトをセット
            if (detail.workTypes.work1?.selected) {
              formWorkTypes.work1 = defaultWork1;
            }
            if (detail.workTypes.work2?.selected) {
              formWorkTypes.work2 = defaultWork2;
            }
            if (detail.workTypes.work3?.selected) {
              formWorkTypes.work3 = defaultWork3;
            }
            if (detail.workTypes.work4?.selected) {
              formWorkTypes.work4 = defaultWork4;
            }
            if (detail.workTypes.work5?.selected) {
              formWorkTypes.work5 = defaultWork5;
            }
            if (detail.workTypes.work6?.selected) {
              formWorkTypes.work6 = defaultWork6;
            }

            setValue('workTypes', formWorkTypes);
            setValue('workDescription', detail.workDescription || '');
            setValue('totalCost', detail.totalCost || 0);
            setValue('hasSubsidy', detail.hasSubsidy || false);
            setValue('subsidyAmount', detail.subsidyAmount || 0);
            console.log('既存データを読み込みました:', detail);
          } else {
            console.log('既存データが見つかりませんでした。新規作成モードです。');
          }
        })
        .catch((error) => {
          console.error('Failed to fetch housing loan detail:', error);
        });
    }
  }, [certificateId, setValue]);

  // 控除対象額の計算（自動）
  const totalCost = watch('totalCost');
  const hasSubsidy = watch('hasSubsidy');
  const subsidyAmount = watch('subsidyAmount');
  const deductibleAmount = hasSubsidy ? totalCost - subsidyAmount : totalCost;

  const onSubmit = async (data: HousingLoanDetailFormData) => {
    // プレビューモードに移行
    setPreviewData(data);
    setShowPreview(true);
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSave = async () => {
    if (!certificateId) {
      alert('証明書IDが指定されていません');
      return;
    }

    if (!previewData) {
      alert('プレビューデータがありません');
      return;
    }

    setIsSaving(true);
    try {
      // Form形式からStore形式へマッピング
      const housingLoanDetail: HousingLoanDetail = {
        workTypes: {
          work1: hasAnyWork1Selected(previewData.workTypes.work1)
            ? { selected: true, description: '' }
            : undefined,
          work2: hasAnyWork2Selected(previewData.workTypes.work2)
            ? { selected: true, description: '' }
            : undefined,
          work3: hasAnyWork3Selected(previewData.workTypes.work3)
            ? { selected: true, description: '' }
            : undefined,
          work4: hasAnyWork4Selected(previewData.workTypes.work4)
            ? { selected: true, description: '' }
            : undefined,
          work5: hasAnyWork5Selected(previewData.workTypes.work5)
            ? { selected: true, description: '' }
            : undefined,
          work6: hasAnyWork6Selected(previewData.workTypes.work6)
            ? { selected: true, description: '' }
            : undefined,
        },
        workDescription: previewData.workDescription || '',
        totalCost: previewData.totalCost,
        hasSubsidy: previewData.hasSubsidy,
        subsidyAmount: previewData.subsidyAmount,
        deductibleAmount,
      };

      await certificateStore.saveHousingLoanDetail(certificateId, housingLoanDetail);

      alert('住宅借入金等特別控除の詳細を保存しました');
      router.push(`/certificate/${certificateId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 各工事種別に選択項目があるかチェックするヘルパー関数
  const hasAnyWork1Selected = (work?: Work1Type): boolean => {
    if (!work) return false;
    return work.extension || work.renovation || work.majorRepair || work.majorRemodeling;
  };

  const hasAnyWork2Selected = (work?: Work2Type): boolean => {
    if (!work) return false;
    return work.floorOverHalf || work.stairOverHalf || work.partitionOverHalf || work.wallOverHalf;
  };

  const hasAnyWork3Selected = (work?: Work3Type): boolean => {
    if (!work) return false;
    return (
      work.livingRoom ||
      work.kitchen ||
      work.bathroom ||
      work.toilet ||
      work.washroom ||
      work.storage ||
      work.entrance ||
      work.corridor
    );
  };

  const hasAnyWork4Selected = (work?: Work4Type): boolean => {
    if (!work) return false;
    return work.buildingStandard || work.earthquakeSafety;
  };

  const hasAnyWork5Selected = (work?: Work5Type): boolean => {
    if (!work) return false;
    return (
      work.pathwayExpansion ||
      work.stairSlope ||
      work.bathroomImprovement ||
      work.toiletImprovement ||
      work.handrails ||
      work.stepElimination ||
      work.doorImprovement ||
      work.floorSlipPrevention
    );
  };

  const hasAnyWork6Selected = (work?: Work6Type): boolean => {
    if (!work) return false;
    // 第6号工事は複雑なので、主要フィールドのいずれかが設定されているかチェック
    return !!(
      work.energyEfficiency ||
      work.lowCarbonCert ||
      work.perfCert ||
      work.energyEfficiency2 ||
      work.longTermCert
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      {/* Sticky Header */}
      <div className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">
              住宅借入金等特別控除 詳細入力
            </h1>
            <Link
              href={certificateId ? `/certificate/${certificateId}` : '/certificate/create'}
              className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium"
            >
              ← 証明書へ戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 sm:p-5 mb-6">
            <h2 className="font-semibold text-lg text-stone-800 mb-3">証明書情報</h2>
            <div className="text-base text-stone-700 space-y-2">
              <p>
                <strong>申請者:</strong> {certificateInfo.applicantName}
              </p>
              <p>
                <strong>物件所在地:</strong> {certificateInfo.propertyAddress}
              </p>
              <p>
                <strong>証明書ID:</strong> {certificateId}
              </p>
            </div>
          </div>
        )}


        {/* プレビューモード */}
        {showPreview && previewData ? (
          <PreviewSection
            previewData={previewData}
            deductibleAmount={deductibleAmount}
            isSaving={isSaving}
            onBackToEdit={handleBackToEdit}
            onConfirmSave={handleConfirmSave}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <WorkTypeFormSection register={register} />
            <CostSection
              register={register}
              totalCost={totalCost}
              hasSubsidy={hasSubsidy}
              subsidyAmount={subsidyAmount}
              deductibleAmount={deductibleAmount}
              certificateId={certificateId}
              setValue={setValue}
            />
          </form>
        )}
      </div>
    </div>
  );
}

export default function HousingLoanDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center">読み込み中...</div>}>
      <HousingLoanDetailContent />
    </Suspense>
  );
}
