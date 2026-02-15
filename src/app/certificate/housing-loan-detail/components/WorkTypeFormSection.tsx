'use client';

import type { UseFormRegister } from 'react-hook-form';
import type { HousingLoanDetailFormData } from '@/types/housingLoanDetail';

interface WorkTypeFormSectionProps {
  register: UseFormRegister<HousingLoanDetailFormData>;
}

export default function WorkTypeFormSection({ register }: WorkTypeFormSectionProps) {
  return (
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
  );
}
