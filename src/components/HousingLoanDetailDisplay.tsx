/**
 * 住宅借入金等特別控除の詳細データ表示コンポーネント
 */

import React from 'react';
import { HousingLoanWorkTypes } from '@/types/housingLoanDetail';

type HousingLoanDetailDisplayProps = {
  data: {
    id: string;
    certificateId: string;
    workTypes: HousingLoanWorkTypes;
    workDescription?: string | null;
    totalCost: number;
    hasSubsidy: boolean;
    subsidyAmount: number;
    deductibleAmount: number;
    createdAt: string;
    updatedAt: string;
  };
  loading?: boolean;
};

export function HousingLoanDetailDisplay({
  data,
  loading = false,
}: HousingLoanDetailDisplayProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  const workTypes = data.workTypes as any;

  return (
    <div className="space-y-6">
      {/* (1) 実施した工事の種別 */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">
          (1) 実施した工事の種別
        </h3>
        <div className="space-y-4">
          {/* 第1号工事 */}
          {workTypes.work1 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">第1号工事</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {workTypes.work1.extension && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>1 増築</span>
                  </div>
                )}
                {workTypes.work1.renovation && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>2 改築</span>
                  </div>
                )}
                {workTypes.work1.majorRepair && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>3 大規模の修繕</span>
                  </div>
                )}
                {workTypes.work1.majorRemodeling && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>4 大規模の模様替</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第2号工事 */}
          {workTypes.work2 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">第2号工事</h4>
              <p className="text-xs text-green-700 mb-2">
                1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるものの過半について行う次のいずれかに該当する修繕又は模様替
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {workTypes.work2.floorOverHalf && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>1 床の過半の修繕又は模様替</span>
                  </div>
                )}
                {workTypes.work2.stairOverHalf && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>2 階段の過半の修繕又は模様替</span>
                  </div>
                )}
                {workTypes.work2.partitionOverHalf && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>3 間仕切壁の過半の修繕又は模様替</span>
                  </div>
                )}
                {workTypes.work2.wallOverHalf && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>4 壁の過半の修繕又は模様替</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第3号工事 */}
          {workTypes.work3 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">第3号工事</h4>
              <p className="text-xs text-purple-700 mb-2">
                次のいずれかに該当する一室の床又は壁の全部の修繕又は模様替
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {workTypes.work3.livingRoom && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>1 居室</span>
                  </div>
                )}
                {workTypes.work3.kitchen && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>2 調理室</span>
                  </div>
                )}
                {workTypes.work3.bathroom && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>3 浴室</span>
                  </div>
                )}
                {workTypes.work3.toilet && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>4 便所</span>
                  </div>
                )}
                {workTypes.work3.washroom && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>5 洗面所</span>
                  </div>
                )}
                {workTypes.work3.storage && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>6 納戸</span>
                  </div>
                )}
                {workTypes.work3.entrance && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>7 玄関</span>
                  </div>
                )}
                {workTypes.work3.corridor && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">✓</span>
                    <span>8 廊下</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第4号工事 */}
          {workTypes.work4 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">第4号工事（耐震改修工事）</h4>
              <div className="space-y-2 text-sm">
                {workTypes.work4.buildingStandard && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>1 補強金物等法令に適合させる耐震改修又は耐震診断の4の規定</span>
                  </div>
                )}
                {workTypes.work4.earthquakeSafety && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✓</span>
                    <span>2 地震に対する安全性に係る基準</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第5号工事 */}
          {workTypes.work5 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">
                第5号工事（バリアフリー改修工事）
              </h4>
              <p className="text-xs text-yellow-700 mb-2">
                高齢者等が自立した日常生活を営むのに必要な構造及び設備の改修工事
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {workTypes.work5.pathwayExpansion && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>1 廊下等の出入口の拡幅</span>
                  </div>
                )}
                {workTypes.work5.stairSlope && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>2 階段の勾配の緩和</span>
                  </div>
                )}
                {workTypes.work5.bathroomImprovement && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>3 浴室の改良</span>
                  </div>
                )}
                {workTypes.work5.toiletImprovement && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>4 便所の改良</span>
                  </div>
                )}
                {workTypes.work5.handrails && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>5 手すりの設置</span>
                  </div>
                )}
                {workTypes.work5.stepElimination && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>6 床の段差の解消</span>
                  </div>
                )}
                {workTypes.work5.doorImprovement && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>7 出入口戸の改良</span>
                  </div>
                )}
                {workTypes.work5.floorSlipPrevention && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">✓</span>
                    <span>8 床材の滑り改良</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 第6号工事 (省エネ改修工事) - 簡略表示 */}
          {workTypes.work6 && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">
                第6号工事（省エネ改修工事）
              </h4>
              <p className="text-xs text-indigo-700 mb-2">
                エネルギー使用の合理化に資する修繕改修等
              </p>
              <div className="text-sm text-indigo-600">
                ※詳細な構成については入力フォームをご確認ください
              </div>
            </div>
          )}
        </div>
      </div>

      {/* (2) 実施した工事の内容 */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">
          (2) 実施した工事の内容
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap">
            {data.workDescription || '（未記入）'}
          </p>
        </div>
      </div>

      {/* (3) 実施した工事の費用の概要 */}
      <div>
        <h3 className="font-semibold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-blue-200">
          (3) 実施した工事の費用の概要
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">① 第1号〜第6号工事に要した費用の額（円）</p>
            <p className="text-2xl font-bold text-blue-900">
              ¥{Number(data.totalCost).toLocaleString()}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 mb-1">② 補助金等の交付</p>
            <p className="text-lg font-semibold text-yellow-900">
              {data.hasSubsidy ? '有' : '無'}
            </p>
            {data.hasSubsidy && (
              <p className="text-xl font-bold text-yellow-900 mt-2">
                ¥{Number(data.subsidyAmount).toLocaleString()}
              </p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">③ ①から②を差し引いた額（100万円以上必要）</p>
            <p className="text-2xl font-bold text-green-900">
              ¥{Number(data.deductibleAmount).toLocaleString()}
            </p>
            {Number(data.deductibleAmount) < 1000000 && (
              <p className="text-xs text-red-600 mt-1">⚠️ 100万円未満です</p>
            )}
          </div>
        </div>
      </div>

      {/* 編集リンク */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Excel構造:</strong> この用途を選択した場合、Row 380以降に住宅ローンの詳細情報（借入金の種類、工事内容等）が記載されます。
        </p>
      </div>
    </div>
  );
}

export function HousingLoanDetailNoData() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📝</div>
      <p className="text-gray-600 mb-4">
        住宅借入金等特別控除の詳細情報が入力されていません
      </p>
      <p className="text-sm text-gray-500">
        証明書作成時に詳細情報を入力してください
      </p>
    </div>
  );
}
