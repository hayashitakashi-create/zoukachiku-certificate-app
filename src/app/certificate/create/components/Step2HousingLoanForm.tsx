'use client';

import { defaultWork1, defaultWork2, defaultWork3, defaultWork4, defaultWork5, defaultWork6 } from '@/types/housingLoanDetail';
import type { StepProps } from '../types';

export default function Step2HousingLoanForm({ formData, setFormData }: StepProps) {
  return (
    <>
    {/* 第1号工事 */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-3">第1号工事</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['extension', '1 増築'],
          ['renovation', '2 改築'],
          ['majorRepair', '3 大規模の修繕'],
          ['majorRemodeling', '4 大規模の模様替'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input type="checkbox"
              checked={formData.housingLoanWorkTypes.work1?.[key] ?? false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                housingLoanWorkTypes: {
                  ...prev.housingLoanWorkTypes,
                  work1: { ...defaultWork1, ...prev.housingLoanWorkTypes.work1, [key]: e.target.checked },
                },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* 第2号工事 */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-1">第2号工事</h3>
      <p className="text-xs text-stone-500 mb-3">1棟の家屋で区分所有する部分について行う次のいずれかに該当する修繕又は模様替</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {([
          ['floorOverHalf', '1 床の過半の修繕又は模様替'],
          ['stairOverHalf', '2 階段の過半の修繕又は模様替'],
          ['partitionOverHalf', '3 間仕切壁の過半の修繕又は模様替'],
          ['wallOverHalf', '4 壁の過半の修繕又は模様替'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input type="checkbox"
              checked={formData.housingLoanWorkTypes.work2?.[key] ?? false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                housingLoanWorkTypes: {
                  ...prev.housingLoanWorkTypes,
                  work2: { ...defaultWork2, ...prev.housingLoanWorkTypes.work2, [key]: e.target.checked },
                },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* 第3号工事 */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-1">第3号工事</h3>
      <p className="text-xs text-stone-500 mb-3">次のいずれか一室の床又は壁の全部の修繕又は模様替</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['livingRoom', '1 居室'],
          ['kitchen', '2 調理室'],
          ['bathroom', '3 浴室'],
          ['toilet', '4 便所'],
          ['washroom', '5 洗面所'],
          ['storage', '6 納戸'],
          ['entrance', '7 玄関'],
          ['corridor', '8 廊下'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input type="checkbox"
              checked={formData.housingLoanWorkTypes.work3?.[key] ?? false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                housingLoanWorkTypes: {
                  ...prev.housingLoanWorkTypes,
                  work3: { ...defaultWork3, ...prev.housingLoanWorkTypes.work3, [key]: e.target.checked },
                },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* 第4号工事（耐震改修工事） */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-1">第4号工事（耐震改修工事）</h3>
      <p className="text-xs text-stone-500 mb-3">次の規定又は基準に適合させるための修繕又は模様替</p>
      <div className="grid grid-cols-1 gap-3">
        {([
          ['buildingStandard', '1 建築基準法施行令第3章及び第5章の4の規定'],
          ['earthquakeSafety', '2 地震に対する安全性に係る基準'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input type="checkbox"
              checked={formData.housingLoanWorkTypes.work4?.[key] ?? false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                housingLoanWorkTypes: {
                  ...prev.housingLoanWorkTypes,
                  work4: { ...defaultWork4, ...prev.housingLoanWorkTypes.work4, [key]: e.target.checked },
                },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* 第5号工事（バリアフリー改修工事） */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-1">第5号工事（バリアフリー改修工事）</h3>
      <p className="text-xs text-stone-500 mb-3">高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための修繕又は模様替</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {([
          ['pathwayExpansion', '1 通路又は出入口の拡幅'],
          ['stairSlope', '2 階段の勾配の緩和'],
          ['bathroomImprovement', '3 浴室の改良'],
          ['toiletImprovement', '4 便所の改良'],
          ['handrails', '5 手すりの取付'],
          ['stepElimination', '6 床の段差の解消'],
          ['doorImprovement', '7 出入口の戸の改良'],
          ['floorSlipPrevention', '8 床材の取替'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input type="checkbox"
              checked={formData.housingLoanWorkTypes.work5?.[key] ?? false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                housingLoanWorkTypes: {
                  ...prev.housingLoanWorkTypes,
                  work5: { ...defaultWork5, ...prev.housingLoanWorkTypes.work5, [key]: e.target.checked },
                },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    {/* 第6号工事（省エネ改修工事） */}
    <div className="mb-5 p-4 border border-stone-200 rounded-2xl">
      <h3 className="font-bold text-sm mb-3">第6号工事（省エネ改修工事）</h3>

      <div className="mb-4">
        <p className="text-xs text-stone-500 mb-2">エネルギーの使用の合理化に著しく資する修繕若しくは模様替</p>
        <div className="space-y-2 ml-2">
          {([
            ['allWindowsInsulation', '1 全ての居室の全ての窓の断熱性を高める工事'],
            ['allRoomsWindowsInsulation', '2 全ての居室の全ての窓の断熱性を相当程度高める工事'],
            ['allRoomsFloorCeilingInsulation', '3 全ての居室の全ての窓の断熱性を著しく高める工事'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2 text-sm">
              <input type="checkbox"
                checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.[key] ?? false}
                onChange={(e) => setFormData(prev => {
                  const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                  return {
                    ...prev,
                    housingLoanWorkTypes: {
                      ...prev.housingLoanWorkTypes,
                      work6: {
                        ...currentWork6,
                        energyEfficiency: {
                          ...currentWork6.energyEfficiency,
                          [key]: e.target.checked,
                        },
                      },
                    },
                  };
                })}
                className="w-4 h-4 text-amber-600 rounded" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-stone-500 mb-2">上記1から3のいずれかと併せて行う次のいずれかに該当する修繕又は模様替</p>
        <div className="space-y-2 ml-2">
          {([
            ['combinedCeilingInsulation', '4 天井等の断熱性を高める工事'],
            ['combinedWallInsulation', '5 壁の断熱性を高める工事'],
            ['combinedFloorInsulation', '6 床等の断熱性を高める工事'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2 text-sm">
              <input type="checkbox"
                checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.[key] ?? false}
                onChange={(e) => setFormData(prev => {
                  const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                  return {
                    ...prev,
                    housingLoanWorkTypes: {
                      ...prev.housingLoanWorkTypes,
                      work6: {
                        ...currentWork6,
                        energyEfficiency: {
                          ...currentWork6.energyEfficiency,
                          [key]: e.target.checked,
                        },
                      },
                    },
                  };
                })}
                className="w-4 h-4 text-amber-600 rounded" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-stone-500 mb-2">地域区分</p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 ml-2">
          {([1,2,3,4,5,6,7,8] as const).map((n) => {
            const key = `region${n}` as keyof typeof defaultWork6.energyEfficiency;
            return (
              <label key={n} className="flex items-center space-x-1 text-sm">
                <input type="checkbox"
                  checked={(formData.housingLoanWorkTypes.work6?.energyEfficiency as Record<string, boolean | string | undefined>)?.[key] === true}
                  onChange={(e) => setFormData(prev => {
                    const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                    return {
                      ...prev,
                      housingLoanWorkTypes: {
                        ...prev.housingLoanWorkTypes,
                        work6: {
                          ...currentWork6,
                          energyEfficiency: {
                            ...currentWork6.energyEfficiency,
                            [key]: e.target.checked,
                          },
                        },
                      },
                    };
                  })}
                  className="w-4 h-4 text-amber-600 rounded" />
                <span>{n}地域</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-stone-500 mb-2">改修工事前の住宅が相当する断熱等性能等級</p>
        <div className="flex gap-4 ml-2">
          {['1', '2', '3'].map((grade) => (
            <label key={grade} className="flex items-center space-x-1 text-sm">
              <input type="checkbox"
                checked={formData.housingLoanWorkTypes.work6?.energyEfficiency?.energyGradeBefore === grade}
                onChange={(e) => setFormData(prev => {
                  const currentWork6 = prev.housingLoanWorkTypes.work6 ?? defaultWork6;
                  return {
                    ...prev,
                    housingLoanWorkTypes: {
                      ...prev.housingLoanWorkTypes,
                      work6: {
                        ...currentWork6,
                        energyEfficiency: {
                          ...currentWork6.energyEfficiency,
                          energyGradeBefore: e.target.checked ? grade : '',
                        },
                      },
                    },
                  };
                })}
                className="w-4 h-4 text-amber-600 rounded" />
              <span>等級{grade}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
