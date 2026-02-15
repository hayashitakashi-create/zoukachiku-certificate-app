'use client';

import type { HousingLoanDetailFormData } from '@/types/housingLoanDetail';

interface PreviewSectionProps {
  previewData: HousingLoanDetailFormData;
  deductibleAmount: number;
  isSaving: boolean;
  onBackToEdit: () => void;
  onConfirmSave: () => void;
}

export default function PreviewSection({
  previewData,
  deductibleAmount,
  isSaving,
  onBackToEdit,
  onConfirmSave,
}: PreviewSectionProps) {
  return (
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
            onClick={onBackToEdit}
            className="w-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition-all h-12 sm:h-14 rounded-full text-base font-semibold"
          >
            ← 入力内容を修正する
          </button>
          <button
            onClick={onConfirmSave}
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
  );
}
