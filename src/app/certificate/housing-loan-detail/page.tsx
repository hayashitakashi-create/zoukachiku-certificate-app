'use client';

import { useState, useEffect } from 'react';
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

export default function HousingLoanDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const certificateId = searchParams.get('certificateId');

  const [certificateInfo, setCertificateInfo] = useState<{
    applicantName: string;
    propertyAddress: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      fetch(`/api/certificates/${certificateId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setCertificateInfo({
              applicantName: result.data.applicantName,
              propertyAddress: result.data.propertyAddress,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch certificate:', error);
        });
    }
  }, [certificateId]);

  // 控除対象額の計算（自動）
  const totalCost = watch('totalCost');
  const hasSubsidy = watch('hasSubsidy');
  const subsidyAmount = watch('subsidyAmount');
  const deductibleAmount = hasSubsidy ? totalCost - subsidyAmount : totalCost;

  const onSubmit = async (data: HousingLoanDetailFormData) => {
    if (!certificateId) {
      alert('証明書IDが指定されていません');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/housing-loan-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId,
          ...data,
          deductibleAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('住宅借入金等特別控除の詳細を保存しました');
        router.push(`/certificate/${certificateId}`);
      } else {
        alert('保存エラー: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            住宅借入金等特別控除 詳細入力
          </h1>
          <Link
            href={certificateId ? `/certificate/${certificateId}` : '/certificate/create'}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← 証明書へ戻る
          </Link>
        </div>

        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">証明書情報</h2>
            <div className="text-sm text-blue-800 space-y-1">
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

        {/* certificateIdがない場合の警告 */}
        {!certificateId && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              証明書IDが指定されていません。証明書作成フローから開始してください。
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* (1) 実施した工事の種別 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              (1) 実施した工事の種別
            </h2>

            {/* 第1号工事 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">第1号工事</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.extension')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 1 増築</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.renovation')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 2 改築</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.majorRepair')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 3 大規模の修繕</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work1.majorRemodeling')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 4 大規模の模様替</span>
                </label>
              </div>
            </div>

            {/* 第2号工事 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">第2号工事</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.floorInsulation')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 1 床の断熱工事又は模様替</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.windowRenovation')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 2 窓の改修の修繕又は模様替</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.partitionInsulation')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 3 間仕切壁の断熱工事又は模様替</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work2.boundaryRepair')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 4 境の通常の修繕又は模様替</span>
                </label>
              </div>
            </div>

            {/* 第3号工事 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">第3号工事</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.seismic')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 1 耐震</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.kitchen')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 2 調理室</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.bathroom')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 3 浴室</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.toilet')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 4 便所</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.washroom')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 5 洗面所</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.storage')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 6 納戸</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.entrance')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 7 玄関</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work3.corridor')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 8 廊下</span>
                </label>
              </div>
            </div>

            {/* 第4号工事 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">第4号工事（耐震改修工事）</h3>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work4.seismicOrder')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 1 建築基準法に基づく命令及び勧告に対応する改修</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work4.groundSafety')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 2 地盤に対する安全性に係る基準</span>
                </label>
              </div>
            </div>

            {/* 第5号工事 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-4">
                第5号工事（バリアフリー改修工事）
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.pathwayExpansion')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 1 通路又は出入口の拡幅</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.stairSlope')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 2 階段の勾配の緩和</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.bathroomImprovement')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 3 浴室の改良</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.toiletImprovement')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 4 便所の改良</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.handrails')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 5 手すりの設置</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.stepElimination')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 6 床の段差の解消</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.doorImprovement')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 7 出入口戸の改良</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('workTypes.work5.floorSlipPrevention')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>□ 8 床材の滑り改良</span>
                </label>
              </div>
            </div>

            {/* 第6号工事 - 省エネ改修等 */}
            <div className="mb-8 p-4 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-6">
                第6号工事（省エネ改修等その他の増改築等工事）
              </h3>

              {/* エネルギー使用の合理化に資する修繕改修 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-blue-900">
                  エネルギー使用の合理化に資する修繕改修
                </h4>

                <div className="space-y-4">
                  {/* 基本工事（いずれか選択） */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      以下のいずれかと併せて行う工事（1つ以上選択）
                    </p>
                    <div className="space-y-2 ml-4">
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allWindowsInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">
                          □ 1 全ての窓の断熱性を高める工事
                        </span>
                      </label>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allRoomsWindowsInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">
                          □ 2 全ての居室の全ての窓の断熱性を高める工事
                        </span>
                      </label>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.allRoomsFloorCeilingInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">
                          □ 3 全ての居室の床又は天井の断熱性を高める工事
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 併せて行う工事 */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      上記1から3のいずれかと併せて行う工事
                    </p>
                    <div className="space-y-2 ml-4">
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedWindowsInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">□ 1 全ての窓の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedCeilingInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">□ 2 天井等の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedWallInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">□ 3 壁の断熱性を高める工事</span>
                      </label>
                      <label className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.energyEfficiency.combinedFloorInsulation')}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">□ 4 床等の断熱性を高める工事</span>
                      </label>
                    </div>
                  </div>

                  {/* 地域区分 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        地域区分
                        <a
                          href="https://www.mlit.go.jp/common/001500182.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          （地域区分を確認する）
                        </a>
                      </label>
                      <select
                        {...register('workTypes.work6.energyEfficiency.region')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="1">□ 1 地域</option>
                        <option value="2">□ 2 地域</option>
                        <option value="3">□ 3 地域</option>
                        <option value="4">□ 4 地域</option>
                        <option value="5">□ 5 地域</option>
                        <option value="6">□ 6 地域</option>
                        <option value="7">□ 7 地域</option>
                        <option value="8">□ 8 地域</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        改修工事前の一次エネルギー消費量等級
                      </label>
                      <select
                        {...register('workTypes.work6.energyEfficiency.energyGradeBefore')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="1">等級1</option>
                        <option value="2">等級2</option>
                        <option value="3">等級3</option>
                      </select>
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                        <p className="font-semibold mb-2">建築時期による「みなし判定」</p>
                        <ul className="space-y-1 text-gray-700">
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
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-green-900">
                  認定低炭素建築物新築等計画に基づく工事の場合
                </h4>

                {/* 添付 */}
                <div className="mb-4 p-3 bg-white border border-green-200 rounded">
                  {/* 次に該当する修繕又は模様替 */}
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-2 text-gray-700">次に該当する修繕又は模様替</p>
                    <label className="flex items-center space-x-2 ml-3">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.lowCarbonCert.attachment1Window')}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm">□ 1 窓</span>
                    </label>
                  </div>

                  {/* 上記1と併せて行ういずれかに該当する修繕又は模様替 */}
                  <div>
                    <p className="text-xs font-medium mb-2 text-gray-700">上記1と併せて行ういずれかに該当する修繕又は模様替</p>
                    <div className="ml-3 space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment2Window')}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">□ 2 窓</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment3Ceiling')}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">□ 3 天井等</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('workTypes.work6.lowCarbonCert.attachment4Floor')}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">□ 4 床等</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 認定主体 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    低炭素建築物新築等計画の認定主体
                  </label>
                  <input
                    type="text"
                    {...register('workTypes.work6.lowCarbonCert.certAuthority')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder=""
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      低炭素建築物新築等計画の認定番号
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.lowCarbonCert.certNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="第　　　　　号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      低炭素建築物新築等計画の認定年月日
                    </label>
                    <input
                      type="date"
                      {...register('workTypes.work6.lowCarbonCert.certDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 住宅性能証明書 */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-purple-900">
                  住宅性能証明書
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        一次エネルギー消費量等級
                      </label>
                      <select
                        {...register('workTypes.work6.perfCert.energyGrade')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="1">等級1</option>
                        <option value="2">等級2</option>
                        <option value="3">等級3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        断熱等性能等級
                      </label>
                      <select
                        {...register('workTypes.work6.perfCert.insulationGrade')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="1">等級1</option>
                        <option value="2">等級2</option>
                        <option value="3">等級3</option>
                        <option value="4+">等級4以上</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      発行機関名称
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.perfCert.orgName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="名称"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        登録番号
                      </label>
                      <input
                        type="text"
                        {...register('workTypes.work6.perfCert.regNumber')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="第　　　　　号"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        交付番号
                      </label>
                      <input
                        type="text"
                        {...register('workTypes.work6.perfCert.issueNumber')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="第　　　　　号"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      交付年月日
                    </label>
                    <input
                      type="date"
                      {...register('workTypes.work6.perfCert.issueDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* エネルギー使用の合理化（2回目） */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-orange-900">
                  エネルギー使用の合理化（断熱性能向上工事）
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.energyEfficiency2.roomInsulation')}
                        className="mt-1 w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm">□ 1 室の断熱性を高める工事</span>
                    </label>
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.energyEfficiency2.ceilingInsulation')}
                        className="mt-1 w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm">□ 2 天井等の断熱性を高める工事</span>
                    </label>
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.energyEfficiency2.wallInsulation')}
                        className="mt-1 w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm">□ 3 壁の断熱性を高める工事</span>
                    </label>
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        {...register('workTypes.work6.energyEfficiency2.floorInsulation')}
                        className="mt-1 w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-sm">□ 4 床等の断熱性を高める工事</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      地域区分
                      <a
                        href="https://www.mlit.go.jp/common/001500182.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        （地域区分を確認する）
                      </a>
                    </label>
                    <select
                      {...register('workTypes.work6.energyEfficiency2.region')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">選択してください</option>
                      <option value="1">□ 1 地域</option>
                      <option value="2">□ 2 地域</option>
                      <option value="3">□ 3 地域</option>
                      <option value="4">□ 4 地域</option>
                      <option value="5">□ 5 地域</option>
                      <option value="6">□ 6 地域</option>
                      <option value="7">□ 7 地域</option>
                      <option value="8">□ 8 地域</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 改修工事前の断熱等性能等級 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  改修工事前の住宅の断熱等性能等級
                </label>
                <select
                  {...register('workTypes.work6.insulationGradeBefore')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="3">等級3</option>
                  <option value="4+">等級4以上</option>
                </select>
              </div>

              {/* 長期優良住宅建築等計画の認定 */}
              <div className="mb-6 p-4 bg-pink-50 rounded-lg">
                <h4 className="font-semibold mb-4 text-pink-900">
                  長期優良住宅建築等計画の認定
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      認定番号
                    </label>
                    <input
                      type="text"
                      {...register('workTypes.work6.longTermCert.certNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="第　　　　　号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      認定年月日
                    </label>
                    <input
                      type="date"
                      {...register('workTypes.work6.longTermCert.certDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-600">
                  <strong>注意:</strong> 第6号工事は複数の要件が含まれています。
                  該当する項目のみ入力してください。全て入力する必要はありません。
                </p>
              </div>
            </div>
          </div>

          {/* (2) 実施した工事の内容 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              (2) 実施した工事の内容
            </h2>
            <textarea
              {...register('workDescription')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="実施した工事の内容を記入してください"
            />
          </div>

          {/* (3) 実施した工事の費用の概要 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              (3) 実施した工事の費用の概要
            </h2>

            <div className="space-y-6">
              {/* ① 総費用 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ① 第1号工事〜第6号工事に要した費用の額（円）
                </label>
                <input
                  type="number"
                  {...register('totalCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 2,500,000"
                />
                {totalCost > 0 && (
                  <p className="mt-1 text-sm text-gray-600">
                    入力額: {totalCost.toLocaleString()}円
                  </p>
                )}
              </div>

              {/* ② 補助金等の交付の有無 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ② 第1号工事〜第6号工事に係る補助金等の交付の有無
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="true"
                      {...register('hasSubsidy')}
                      onClick={() => setValue('hasSubsidy', true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>有</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="false"
                      {...register('hasSubsidy')}
                      onClick={() => setValue('hasSubsidy', false)}
                      defaultChecked
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>無</span>
                  </label>
                </div>

                {hasSubsidy && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      有の場合: 交付される補助金等の額（円）
                    </label>
                    <input
                      type="number"
                      {...register('subsidyAmount', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: 500,000"
                    />
                    {subsidyAmount > 0 && (
                      <p className="mt-1 text-sm text-gray-600">
                        入力額: {subsidyAmount.toLocaleString()}円
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ③ 控除対象額（自動計算） */}
              <div className="border-t pt-6">
                <label className="block text-lg font-bold text-gray-900 mb-2">
                  ③ ①から②を差し引いた額（100万円以上必要）
                </label>
                <div className="text-3xl font-bold text-blue-600">
                  {deductibleAmount.toLocaleString()}円
                </div>

                {deductibleAmount < 1000000 && deductibleAmount > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      控除対象額が100万円未満です。住宅借入金等特別控除の対象外となります。
                    </p>
                  </div>
                )}

                {deductibleAmount >= 1000000 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      控除対象額が100万円以上です。住宅借入金等特別控除の対象となります。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              type="submit"
              disabled={isSaving || !certificateId}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSaving ? '保存中...' : '詳細情報を保存'}
            </button>
            <p className="text-sm text-gray-600 text-center mt-3">
              保存すると証明書に詳細情報が紐付けられます
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
