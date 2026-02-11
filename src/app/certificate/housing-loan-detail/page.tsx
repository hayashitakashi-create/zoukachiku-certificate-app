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
          <div className="space-y-8">
            {/* プレビュー表示ヘッダー */}
            <div className="bg-gradient-to-r from-amber-700 to-stone-700 text-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8">
              <h2 className="text-3xl font-bold mb-2">入力内容の確認</h2>
              <p className="text-lg">以下の内容で保存します。内容を確認してください。</p>
            </div>

            {/* (1) 実施した工事の種別 - プレビュー */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
                (1) 実施した工事の種別
              </h2>

              {/* 第1号工事 */}
              {(previewData.workTypes?.work1?.extension ||
                previewData.workTypes?.work1?.renovation ||
                previewData.workTypes?.work1?.majorRepair ||
                previewData.workTypes?.work1?.majorRemodeling) && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第1号工事</h3>
                  <div className="space-y-2 ml-4">
                    {previewData.workTypes.work1.extension && <p className="text-base text-amber-800">✓ 1 増築</p>}
                    {previewData.workTypes.work1.renovation && <p className="text-base text-amber-800">✓ 2 改築</p>}
                    {previewData.workTypes.work1.majorRepair && <p className="text-base text-amber-800">✓ 3 大規模の修繕</p>}
                    {previewData.workTypes.work1.majorRemodeling && <p className="text-base text-amber-800">✓ 4 大規模の模様替</p>}
                  </div>
                </div>
              )}

              {/* 第2号工事 */}
              {(previewData.workTypes?.work2?.floorOverHalf ||
                previewData.workTypes?.work2?.stairOverHalf ||
                previewData.workTypes?.work2?.partitionOverHalf ||
                previewData.workTypes?.work2?.wallOverHalf) && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第2号工事</h3>
                  <p className="text-sm text-stone-600 mb-3">
                    1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるもののうちその者が区分所有する部分について行う次のいずれかに該当する修繕又は模様替
                  </p>
                  <div className="space-y-2 ml-4">
                    {previewData.workTypes.work2.floorOverHalf && <p className="text-base text-amber-800">✓ 1 床の過半の修繕又は模様替</p>}
                    {previewData.workTypes.work2.stairOverHalf && <p className="text-base text-amber-800">✓ 2 階段の過半の修繕又は模様替</p>}
                    {previewData.workTypes.work2.partitionOverHalf && <p className="text-base text-amber-800">✓ 3 間仕切壁の過半の修繕又は模様替</p>}
                    {previewData.workTypes.work2.wallOverHalf && <p className="text-base text-amber-800">✓ 4 壁の過半の修繕又は模様替</p>}
                  </div>
                </div>
              )}

              {/* 第3号工事 */}
              {(previewData.workTypes?.work3?.livingRoom ||
                previewData.workTypes?.work3?.kitchen ||
                previewData.workTypes?.work3?.bathroom ||
                previewData.workTypes?.work3?.toilet ||
                previewData.workTypes?.work3?.washroom ||
                previewData.workTypes?.work3?.storage ||
                previewData.workTypes?.work3?.entrance ||
                previewData.workTypes?.work3?.corridor) && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第3号工事</h3>
                  <p className="text-sm text-stone-600 mb-3">
                    次のいずれか一室の床又は壁の全部の修繕又は模様替
                  </p>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {previewData.workTypes.work3.livingRoom && <p className="text-base text-amber-800">✓ 1 居室</p>}
                    {previewData.workTypes.work3.kitchen && <p className="text-base text-amber-800">✓ 2 調理室</p>}
                    {previewData.workTypes.work3.bathroom && <p className="text-base text-amber-800">✓ 3 浴室</p>}
                    {previewData.workTypes.work3.toilet && <p className="text-base text-amber-800">✓ 4 便所</p>}
                    {previewData.workTypes.work3.washroom && <p className="text-base text-amber-800">✓ 5 洗面所</p>}
                    {previewData.workTypes.work3.storage && <p className="text-base text-amber-800">✓ 6 納戸</p>}
                    {previewData.workTypes.work3.entrance && <p className="text-base text-amber-800">✓ 7 玄関</p>}
                    {previewData.workTypes.work3.corridor && <p className="text-base text-amber-800">✓ 8 廊下</p>}
                  </div>
                </div>
              )}

              {/* 第4号工事 */}
              {(previewData.workTypes?.work4?.buildingStandard ||
                previewData.workTypes?.work4?.earthquakeSafety) && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第4号工事（耐震改修工事）</h3>
                  <p className="text-sm text-stone-600 mb-3">
                    次の規定又は基準に適合させるための修繕又は模様替
                  </p>
                  <div className="space-y-2 ml-4">
                    {previewData.workTypes.work4.buildingStandard && <p className="text-base text-amber-800">✓ 1 建築基準法施行令第3章及び第5章の4の規定</p>}
                    {previewData.workTypes.work4.earthquakeSafety && <p className="text-base text-amber-800">✓ 2 地震に対する安全性に係る基準</p>}
                  </div>
                </div>
              )}

              {/* 第5号工事 */}
              {(previewData.workTypes?.work5?.pathwayExpansion ||
                previewData.workTypes?.work5?.stairSlope ||
                previewData.workTypes?.work5?.bathroomImprovement ||
                previewData.workTypes?.work5?.toiletImprovement ||
                previewData.workTypes?.work5?.handrails ||
                previewData.workTypes?.work5?.stepElimination ||
                previewData.workTypes?.work5?.doorImprovement ||
                previewData.workTypes?.work5?.floorSlipPrevention) && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第5号工事（バリアフリー改修工事）</h3>
                  <p className="text-sm text-stone-600 mb-3">
                    高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための次のいずれかに該当する修繕又は模様替
                  </p>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {previewData.workTypes.work5.pathwayExpansion && <p className="text-base text-amber-800">✓ 1 通路又は出入口の拡幅</p>}
                    {previewData.workTypes.work5.stairSlope && <p className="text-base text-amber-800">✓ 2 階段の勾配の緩和</p>}
                    {previewData.workTypes.work5.bathroomImprovement && <p className="text-base text-amber-800">✓ 3 浴室の改良</p>}
                    {previewData.workTypes.work5.toiletImprovement && <p className="text-base text-amber-800">✓ 4 便所の改良</p>}
                    {previewData.workTypes.work5.handrails && <p className="text-base text-amber-800">✓ 5 手すりの設置</p>}
                    {previewData.workTypes.work5.stepElimination && <p className="text-base text-amber-800">✓ 6 床の段差の解消</p>}
                    {previewData.workTypes.work5.doorImprovement && <p className="text-base text-amber-800">✓ 7 出入口戸の改良</p>}
                    {previewData.workTypes.work5.floorSlipPrevention && <p className="text-base text-amber-800">✓ 8 床材の滑り改良</p>}
                  </div>
                </div>
              )}

              {/* 第6号工事 */}
              {previewData.workTypes?.work6 && (
                <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <h3 className="font-bold text-lg text-stone-800 mb-4">第6号工事（省エネ改修工事）</h3>
                  <p className="text-base text-stone-600 ml-4">※ 詳細項目が選択されています</p>
                </div>
              )}
            </div>

            {/* (2) 実施した工事の内容 - プレビュー */}
            {previewData.workDescription && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
                <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
                  (2) 実施した工事の内容
                </h2>
                <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <p className="text-base whitespace-pre-wrap">{previewData.workDescription}</p>
                </div>
              </div>
            )}

            {/* (3) 実施した工事の費用の概要 - プレビュー */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
                (3) 実施した工事の費用の概要
              </h2>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <p className="text-base text-stone-700 mb-2">① 第1号工事〜第6号工事に要した費用の額</p>
                  <p className="text-3xl font-bold text-stone-900">{previewData.totalCost.toLocaleString()}円</p>
                </div>

                <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4">
                  <p className="text-base text-stone-700 mb-2">② 補助金等の交付</p>
                  <p className="text-xl font-semibold text-stone-900">
                    {previewData.hasSubsidy ? '有' : '無'}
                  </p>
                  {previewData.hasSubsidy && (
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      - {previewData.subsidyAmount.toLocaleString()}円
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5">
                  <p className="text-base text-amber-800 mb-2">③ 控除対象額（①から②を差し引いた額）</p>
                  <p className="text-4xl font-bold text-amber-800">{deductibleAmount.toLocaleString()}円</p>
                  {deductibleAmount >= 1000000 ? (
                    <p className="text-base text-amber-800 mt-3">✓ 控除対象額が100万円以上です</p>
                  ) : (
                    <p className="text-base text-red-700 mt-3">⚠ 控除対象額が100万円未満です</p>
                  )}
                </div>
              </div>
            </div>

            {/* プレビューのアクションボタン */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleBackToEdit}
                  className="w-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition-all h-12 sm:h-14 rounded-full text-base font-semibold"
                >
                  ← 入力内容を修正する
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 sm:h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? '保存中...' : '✓ この内容で保存する'}
                </button>
              </div>
              <p className="text-base text-stone-600 text-center mt-4">
                内容を確認の上、保存してください
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* (1) 実施した工事の種別 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
              (1) 実施した工事の種別
            </h2>

            {/* 第1号工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">第1号工事</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.extension')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 1 増築</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.renovation')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 2 改築</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.majorRepair')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 3 大規模の修繕</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.majorRemodeling')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 4 大規模の模様替</span>
                </label>
              </div>
            </div>

            {/* 第2号工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">第2号工事</h3>
              <p className="text-sm text-stone-600 mb-4">
                1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるもののうちその者が区分所有する部分について行う次のいずれかに該当する修繕又は模様替
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.floorOverHalf')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 1 床の過半の修繕又は模様替</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.stairOverHalf')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 2 階段の過半の修繕又は模様替</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.partitionOverHalf')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 3 間仕切壁の過半の修繕又は模様替</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.wallOverHalf')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 4 壁の過半の修繕又は模様替</span>
                </label>
              </div>
            </div>

            {/* 第3号工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">第3号工事</h3>
              <p className="text-sm text-stone-600 mb-4">
                次のいずれか一室の床又は壁の全部の修繕又は模様替
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.livingRoom')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 1 居室</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.kitchen')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 2 調理室</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.bathroom')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 3 浴室</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.toilet')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 4 便所</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.washroom')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 5 洗面所</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.storage')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 6 納戸</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.entrance')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 7 玄関</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.corridor')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 8 廊下</span>
                </label>
              </div>
            </div>

            {/* 第4号工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">第4号工事（耐震改修工事）</h3>
              <p className="text-sm text-stone-600 mb-4">
                次の規定又は基準に適合させるための修繕又は模様替
              </p>
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work4.buildingStandard')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 1 建築基準法施行令第3章及び第5章の4の規定</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work4.earthquakeSafety')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 2 地震に対する安全性に係る基準</span>
                </label>
              </div>
            </div>

            {/* 第5号工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">
                第5号工事（バリアフリー改修工事）
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための次のいずれかに該当する修繕又は模様替
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.pathwayExpansion')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 1 通路又は出入口の拡幅</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.stairSlope')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 2 階段の勾配の緩和</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.bathroomImprovement')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 3 浴室の改良</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.toiletImprovement')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 4 便所の改良</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.handrails')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 5 手すりの設置</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.stepElimination')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 6 床の段差の解消</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.doorImprovement')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 7 出入口戸の改良</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.floorSlipPrevention')}
                    className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="text-base">□ 8 床材の滑り改良</span>
                </label>
              </div>
            </div>

            {/* 第6号工事 - 省エネ改修工事 */}
            <div className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 mb-6 hover:border-amber-200 transition-colors">
              <h3 className="font-bold text-lg text-stone-800 mb-4">
                第6号工事（省エネ改修工事）
              </h3>

              {/* エネルギー使用の合理化に資する修繕改修 */}
              <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <h4 className="font-semibold text-lg mb-5 text-stone-800">
                  エネルギー使用の合理化に資する修繕改修
                </h4>

                <div className="space-y-5">
                  {/* 基本工事（いずれか選択） */}
                  <div>
                    <p className="text-base font-medium mb-3">
                      以下のいずれかと併せて行う工事（1つ以上選択）
                    </p>
                    <div className="space-y-3 ml-4">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allWindowsInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">
                          □ 1 全ての窓の断熱性を高める工事
                        </span>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allRoomsWindowsInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">
                          □ 2 全ての居室の全ての窓の断熱性を高める工事
                        </span>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allRoomsFloorCeilingInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">
                          □ 3 全ての居室の床又は天井の断熱性を高める工事
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 併せて行う工事 */}
                  <div>
                    <p className="text-base font-medium mb-3">
                      上記1から3のいずれかと併せて行う工事
                    </p>
                    <div className="space-y-3 ml-4">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedWindowsInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 1 全ての窓の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedCeilingInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 2 天井等の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedWallInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 3 壁の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedFloorInsulation')}
                          className="mt-1 w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 4 床等の断熱性を高める工事</span>
                      </label>
                    </div>
                  </div>

                  {/* 地域区分 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        地域区分
                        <a
                          href="https://www.mlit.go.jp/common/001500182.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 text-sm"
                        >
                          （地域区分を確認する）
                        </a>
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="1"
                            {...register('workTypes.work6.energyEfficiency.region1')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">1地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="2"
                            {...register('workTypes.work6.energyEfficiency.region2')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">2地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="3"
                            {...register('workTypes.work6.energyEfficiency.region3')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">3地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="4"
                            {...register('workTypes.work6.energyEfficiency.region4')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">4地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="5"
                            {...register('workTypes.work6.energyEfficiency.region5')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">5地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="6"
                            {...register('workTypes.work6.energyEfficiency.region6')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">6地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="7"
                            {...register('workTypes.work6.energyEfficiency.region7')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">7地域</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            value="8"
                            {...register('workTypes.work6.energyEfficiency.region8')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">8地域</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        改修工事前の一次エネルギー消費量等級
                      </label>
                      <select
                        {...register('workTypes.work6.energyEfficiency.energyGradeBefore')}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="1">等級1</option>
                        <option value="2">等級2</option>
                        <option value="3">等級3</option>
                      </select>
                      <div className="mt-3 bg-gradient-to-br from-stone-50 to-amber-50/30 border border-stone-200 rounded-2xl text-sm p-4">
                        <p className="font-semibold mb-2">建築時期による「みなし判定」</p>
                        <ul className="space-y-1 text-stone-700">
                          <li>• 等級3： 平成4年基準（1992年〜）</li>
                          <li>• 等級2： 昭和55年基準（1980年〜）</li>
                          <li>• 等級1： それ以前（無断熱など）</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 認定低炭素建築物新築等計画に基づく工事の場合 */}
              <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/20 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <h4 className="font-semibold text-lg mb-5 text-stone-800">
                  認定低炭素建築物新築等計画に基づく工事の場合
                </h4>

                {/* 添付 */}
                <div className="mb-4 p-3 bg-white border border-stone-200 rounded-2xl">
                  {/* 次に該当する修繕又は模様替 */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-stone-700 mb-3">次に該当する修繕又は模様替</p>
                    <label className="flex items-center space-x-3 ml-3">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.lowCarbonCert.attachment1Window')}
                        className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                      />
                      <span className="text-base">□ 1 窓</span>
                    </label>
                  </div>

                  {/* 上記1と併せて行ういずれかに該当する修繕又は模様替 */}
                  <div>
                    <p className="text-sm font-semibold text-stone-700 mb-3">上記1と併せて行ういずれかに該当する修繕又は模様替</p>
                    <div className="ml-3 space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment2Window')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 2 窓</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment3Ceiling')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 3 天井等</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment4Floor')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 4 床等</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 認定主体 */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    低炭素建築物新築等計画の認定主体
                  </label>
                  <input
                    type="text"
                    {...register('workTypes.work6.lowCarbonCert.certAuthority')}
                    className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                    placeholder=""
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      低炭素建築物新築等計画の認定番号
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.lowCarbonCert.certNumber')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder="第　　　　　号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      低炭素建築物新築等計画の認定年月日
                    </label>
                    <input
                      type="date"
                      {...register('workTypes.work6.lowCarbonCert.certDate')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 改修工事後の住宅の一定の省エネ性能が証明される場合 */}
              <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/20 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <h4 className="font-semibold text-lg mb-5 text-stone-800">
                  改修工事後の住宅の一定の省エネ性能が証明される場合
                </h4>
                <div className="space-y-5">
                  {/* 1. エネルギーの使用の合理化に著しく資する次に該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度資する次に該当する修繕若しくは模様替 */}
                  <div className="p-3 bg-white border border-stone-200 rounded-2xl">
                    <p className="text-base font-medium mb-4">1. エネルギーの使用の合理化に著しく資する次に該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度資する次に該当する修繕若しくは模様替</p>
                    <div className="ml-3 space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.perfCert.workType1Window')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 1 窓の断熱性を高める工事</span>
                      </label>

                      <p className="text-sm font-semibold text-stone-700 mt-4 mb-3">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
                      <div className="ml-4 space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.perfCert.workType2Ceiling')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 2 天井等の断熱性を高める工事</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.perfCert.workType3Wall')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 3 壁の断熱性を高める工事</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.perfCert.workType4Floor')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 4 床等の断熱性を高める工事</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 2. 地域区分 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      2. 地域区分
                      <a
                        href="https://www.mlit.go.jp/common/001500182.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 text-sm"
                      >
                        （地域区分を確認する）
                      </a>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {['1', '2', '3', '4', '5', '6', '7', '8'].map((region) => (
                        <label key={region} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            value={region}
                            {...register('workTypes.work6.perfCert.region')}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-base">{region}地域</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 3. 改修工事前の住宅が相当する断熱等性能等級 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      3. 改修工事前の住宅が相当する断熱等性能等級
                    </label>
                    <div className="flex gap-6">
                      {['1', '2', '3'].map((grade) => (
                        <label key={grade} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            value={grade}
                            {...register('workTypes.work6.perfCert.energyGradeBefore')}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-base">等級{grade}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 4. 改修工事後の住宅の断熱等性能等級 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      4. 改修工事後の住宅の断熱等性能等級
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          value="2"
                          {...register('workTypes.work6.perfCert.insulationGradeAfter')}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-base">断熱等性能等級2</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          value="3"
                          {...register('workTypes.work6.perfCert.insulationGradeAfter')}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-base">断熱等性能等級3</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          value="4+"
                          {...register('workTypes.work6.perfCert.insulationGradeAfter')}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-base">断熱等性能等級4以上</span>
                      </label>
                    </div>
                  </div>

                  {/* 5. 住宅性能評価書を交付した登録住宅性能評価機関 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      5. 住宅性能評価書を交付した登録住宅性能評価機関
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.perfCert.energyEvaluation')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder=""
                    />
                  </div>

                  {/* 6. 住宅性能評価書の交付番号 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      6. 住宅性能評価書の交付番号
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.perfCert.evalIssueNumber')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder="第　　　　　号"
                    />
                  </div>

                  <hr className="my-4 border-stone-200" />

                  {/* 以下は既存の項目（参考用） */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      名称
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.perfCert.orgName')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder="名称"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        登録番号
                      </label>
                      <input
                        type="text"
                        {...register('workTypes.work6.perfCert.regNumber')}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="第　　　　　号"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        住宅性能評価書の交付番号
                      </label>
                      <input
                        type="text"
                        {...register('workTypes.work6.perfCert.issueNumber')}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="第　　　　　号"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      住宅性能評価書の交付年月日
                    </label>
                    <input
                      type="date"
                      {...register('workTypes.work6.perfCert.issueDate')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 増改築による長期優良住宅建築等計画の認定により証明される場合 */}
              <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <h4 className="font-semibold text-lg mb-5 text-stone-800">
                  増改築による長期優良住宅建築等計画の認定により証明される場合
                </h4>
                <div className="space-y-5">
                  {/* エネルギーの使用の合理化に著しく資する... */}
                  <div className="p-3 bg-white border border-stone-200 rounded-2xl">
                    <p className="text-base font-medium mb-4">エネルギーの使用の合理化に著しく資する次に該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度資する次に該当する修繕若しくは模様替</p>
                    <div className="ml-3 space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency2.windowInsulation')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">□ 1 窓の断熱性を高める工事</span>
                      </label>

                      <p className="text-sm font-semibold text-stone-700 mt-4 mb-3">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
                      <div className="ml-4 space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.energyEfficiency2.ceilingInsulation')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 2 天井等の断熱性を高める工事</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.energyEfficiency2.wallInsulation')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 3 壁の断熱性を高める工事</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            {...register('workTypes.work6.energyEfficiency2.floorInsulation')}
                            className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                          />
                          <span className="text-base">□ 4 床等の断熱性を高める工事</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 地域区分 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      2. 地域区分
                      <a
                        href="https://www.mlit.go.jp/common/001500182.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 text-sm"
                      >
                        （地域区分を確認する）
                      </a>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="1"
                          {...register('workTypes.work6.energyEfficiency2.region1')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">1地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="2"
                          {...register('workTypes.work6.energyEfficiency2.region2')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">2地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="3"
                          {...register('workTypes.work6.energyEfficiency2.region3')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">3地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="4"
                          {...register('workTypes.work6.energyEfficiency2.region4')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">4地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="5"
                          {...register('workTypes.work6.energyEfficiency2.region5')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">5地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="6"
                          {...register('workTypes.work6.energyEfficiency2.region6')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">6地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="7"
                          {...register('workTypes.work6.energyEfficiency2.region7')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">7地域</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="8"
                          {...register('workTypes.work6.energyEfficiency2.region8')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">8地域</span>
                      </label>
                    </div>
                  </div>

                  {/* 改修工事前の住宅が相当する断熱等性能等級 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      3. 改修工事前の住宅が相当する断熱等性能等級
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="1"
                          {...register('workTypes.work6.energyEfficiency2.gradeBefore1')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">等級1</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="2"
                          {...register('workTypes.work6.energyEfficiency2.gradeBefore2')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">等級2</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value="3"
                          {...register('workTypes.work6.energyEfficiency2.gradeBefore3')}
                          className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-base">等級3</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 改修工事前の断熱等性能等級 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-700 mb-3">
                  改修工事前の住宅の断熱等性能等級
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('workTypes.work6.insulationGradeBefore3')}
                      className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                    />
                    <span className="text-base">等級3</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('workTypes.work6.insulationGradeBefore4Plus')}
                      className="w-5 h-5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                    />
                    <span className="text-base">等級4以上</span>
                  </label>
                </div>
              </div>

              {/* 長期優良住宅建築等計画の認定主体 */}
              <div className="mb-6 bg-gradient-to-br from-stone-50 to-amber-50/20 rounded-2xl p-4 sm:p-5 border border-stone-200">
                <div className="space-y-5">
                  {/* 認定主体名 */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      長期優良住宅建築等計画の認定主体
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.longTermCert.certAuthority')}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder=""
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        長期優良住宅建築等計画の認定番号
                      </label>
                      <input
                        type="text"
                        {...register('workTypes.work6.longTermCert.certNumber')}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="第　　　　　号"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-3">
                        長期優良住宅建築等計画の認定年月日
                      </label>
                      <input
                        type="date"
                        {...register('workTypes.work6.longTermCert.certDate')}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
                <p className="text-sm text-stone-700">
                  <strong>注意:</strong> 第6号工事は複数の要件が含まれています。
                  該当する項目のみ入力してください。全て入力する必要はありません。
                </p>
              </div>
            </div>
          </div>

          {/* (2) 実施した工事の内容 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
              (2) 実施した工事の内容
            </h2>
            <textarea
              {...register('workDescription')}
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
              placeholder="実施した工事の内容を記入してください"
            />
          </div>

          {/* (3) 実施した工事の費用の概要 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
              (3) 実施した工事の費用の概要
            </h2>

            <div className="space-y-7">
              {/* ① 総費用 */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-3">
                  ① 第1号工事〜第6号工事に要した費用の額（円）
                </label>
                <input
                  type="number"
                  {...register('totalCost', { valueAsNumber: true })}
                  className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                  placeholder="例: 2,500,000"
                />
                {totalCost > 0 && (
                  <p className="mt-2 text-base text-stone-600">
                    入力額: {totalCost.toLocaleString()}円
                  </p>
                )}
              </div>

              {/* ② 補助金等の交付の有無 */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-3">
                  ② 第1号工事〜第6号工事に係る補助金等の交付の有無
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={hasSubsidy === true}
                      onChange={() => setValue('hasSubsidy', true)}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-base">有</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={hasSubsidy === false}
                      onChange={() => setValue('hasSubsidy', false)}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-base">無</span>
                  </label>
                </div>

                {hasSubsidy && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      有の場合: 交付される補助金等の額（円）
                    </label>
                    <input
                      type="number"
                      {...register('subsidyAmount', { valueAsNumber: true })}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder="例: 500,000"
                    />
                    {subsidyAmount > 0 && (
                      <p className="mt-2 text-base text-stone-600">
                        入力額: {subsidyAmount.toLocaleString()}円
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ③ 控除対象額（自動計算） */}
              <div className="border-t border-stone-200 pt-6">
                <label className="block text-lg sm:text-xl font-bold text-stone-900 mb-3">
                  ③ ①から②を差し引いた額（100万円以上必要）
                </label>
                <div className="text-4xl font-bold text-amber-800">
                  {deductibleAmount.toLocaleString()}円
                </div>

                {deductibleAmount < 1000000 && deductibleAmount > 0 && (
                  <div className="mt-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
                    <p className="text-base text-stone-700">
                      控除対象額が100万円未満です。住宅借入金等特別控除の対象外となります。
                    </p>
                  </div>
                )}

                {deductibleAmount >= 1000000 && (
                  <div className="mt-5 bg-gradient-to-br from-stone-50 to-amber-50/20 rounded-2xl border border-stone-100 p-4">
                    <p className="text-base text-stone-700">
                      控除対象額が100万円以上です。住宅借入金等特別控除の対象となります。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* プレビューボタン */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
            <button
              type="submit"
              disabled={!certificateId}
              className="w-full bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 sm:h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              入力内容を確認する →
            </button>
            <p className="text-base text-stone-600 text-center mt-4">
              入力内容をプレビューで確認後、保存できます
            </p>
          </div>
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
