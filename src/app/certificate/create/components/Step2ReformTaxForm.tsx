'use client';

import type { StepProps } from '../types';

export default function Step2ReformTaxForm({ formData, setFormData }: StepProps) {
  return (
    <div className="space-y-5">
      {/* ① 耐震改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-3">① 住宅耐震改修</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {([
            ['buildingStandard', '建築基準法施行令第3章及び第5章の4の規定に適合させるもの'],
            ['earthquakeSafety', '地震に対する安全性に係る基準に適合させるもの'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-start space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                checked={formData.reformTaxWorkTypes.seismic[key]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    seismic: { ...prev.reformTaxWorkTypes.seismic, [key]: e.target.checked },
                  },
                }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ② バリアフリー改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-3">② 高齢者等居住改修工事等（バリアフリー改修工事）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {([
            ['pathwayExpansion', '1 通路又は出入口の拡幅'],
            ['stairSlope', '2 階段の勾配の緩和'],
            ['bathroomImprovement', '3 浴室の改良'],
            ['toiletImprovement', '4 便所の改良'],
            ['handrails', '5 手すりの取付'],
            ['stepElimination', '6 床の段差の解消'],
            ['doorImprovement', '7 出入口戸の改良'],
            ['floorSlipPrevention', '8 床材の取替'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                checked={formData.reformTaxWorkTypes.barrierFree[key]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    barrierFree: { ...prev.reformTaxWorkTypes.barrierFree, [key]: e.target.checked },
                  },
                }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ③ 省エネ改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-1">③ 一般断熱改修工事等（省エネ改修工事）</h3>
        <p className="text-xs text-stone-600 mb-3 ml-4">窓の断熱改修工事を実施した場合</p>

        {/* A. 窓の断熱改修工事パターン */}
        <div className="mb-4">
          {/* 1. 窓の断熱性を高める工事 */}
          <p className="text-xs text-stone-700 mb-2">エネルギーの使用の合理化に資する増築、改築、修繕又は模様替</p>
          <div className="ml-4 mb-3">
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                checked={(formData.reformTaxWorkTypes.energySaving as Record<string, boolean | string | object>).windowInsulation === true}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    energySaving: { ...prev.reformTaxWorkTypes.energySaving, windowInsulation: e.target.checked },
                  },
                }))} />
              <span>１　窓の断熱性を高める工事</span>
            </label>
          </div>

          {/* 2-4. 上記１と併せて行う工事 */}
          <p className="text-xs text-stone-700 mb-2">上記１と併せて行う次のいずれかに該当する増築、改築、修繕又は模様替</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
            {([
              ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
              ['wallInsulation', '３　壁の断熱性を高める工事'],
              ['floorInsulation', '４　床等の断熱性を高める工事'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                  checked={(formData.reformTaxWorkTypes.energySaving as Record<string, boolean | string | object>)[key] === true}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      energySaving: { ...prev.reformTaxWorkTypes.energySaving, [key]: e.target.checked },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {/* 地域区分 */}
          <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">地域区分</span>
            <div className="flex flex-wrap gap-2">
              {['1','2','3','4','5','6','7','8'].map(n => (
                <label key={n} className="flex items-center space-x-1 text-sm">
                  <input type="checkbox"
                    checked={formData.reformTaxWorkTypes.energySaving.regionCode === n}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reformTaxWorkTypes: {
                        ...prev.reformTaxWorkTypes,
                        energySaving: { ...prev.reformTaxWorkTypes.energySaving, regionCode: e.target.checked ? n : '' },
                      },
                    }))}
                    className="w-4 h-4 text-amber-600 rounded" />
                  <span>{n}地域</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* B. 認定低炭素建築物パターン */}
        <div className="mb-4 pt-3 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-700 mb-2">B. 認定低炭素建築物の新築等に係る工事</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
            {([
              ['windowInsulation', '1 窓の断熱性を高める工事'],
              ['ceilingInsulation', '2 天井等の断熱性を高める工事'],
              ['wallInsulation', '3 壁の断熱性を高める工事'],
              ['floorInsulation', '4 床等の断熱性を高める工事'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                  checked={formData.reformTaxWorkTypes.energySaving.lowCarbon[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      energySaving: {
                        ...prev.reformTaxWorkTypes.energySaving,
                        lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 ml-2">
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定主体</label>
              <input type="text"
                value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certAuthority}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    energySaving: {
                      ...prev.reformTaxWorkTypes.energySaving,
                      lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certAuthority: e.target.value },
                    },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="○○市長" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定番号</label>
              <input type="text"
                value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    energySaving: {
                      ...prev.reformTaxWorkTypes.energySaving,
                      lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certNumber: e.target.value },
                    },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定年月日</label>
              <input type="date"
                value={formData.reformTaxWorkTypes.energySaving.lowCarbon.certDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    energySaving: {
                      ...prev.reformTaxWorkTypes.energySaving,
                      lowCarbon: { ...prev.reformTaxWorkTypes.energySaving.lowCarbon, certDate: e.target.value },
                    },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* C. 設備型式 */}
        <div className="mb-4 pt-3 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-700 mb-2">C. 設備の型式</p>
          <div className="space-y-2 ml-2">
            {([
              ['solarHeat', '太陽熱利用冷温熱装置'],
              ['latentHeatRecovery', '潜熱回収型給湯器'],
              ['heatPump', 'ヒートポンプ式電気給湯器'],
              ['fuelCell', '燃料電池コージェネレーション'],
              ['gasEngine', 'ガスエンジン給湯器'],
              ['airConditioner', 'エアコンディショナー'],
              ['solarPower', '太陽光発電設備'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-stone-600 w-48 shrink-0">{label}</label>
                <input type="text"
                  value={formData.reformTaxWorkTypes.energySaving.equipmentTypes[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      energySaving: {
                        ...prev.reformTaxWorkTypes.energySaving,
                        equipmentTypes: { ...prev.reformTaxWorkTypes.energySaving.equipmentTypes, [key]: e.target.value },
                      },
                    },
                  }))}
                  className="flex-1 px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="型式を入力" />
              </div>
            ))}
          </div>
        </div>

        {/* D. 追加工事 */}
        <div className="pt-3 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-700 mb-2">D. 追加工事の有無</p>
          <div className="space-y-2 ml-2">
            {([
              ['safetyWork', '安全対策工事'],
              ['roofWaterproofing', '陸屋根防水基礎工事'],
              ['snowProtection', '積雪対策工事'],
              ['saltProtection', '塩害対策工事'],
              ['trunkLineReinforcement', '幹線増強工事'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-stone-600 w-36 shrink-0">{label}</span>
                {['yes', 'no'].map(val => (
                  <label key={val} className="flex items-center gap-1 text-xs">
                    <input type="radio"
                      name={`additionalWork_${key}`}
                      checked={formData.reformTaxWorkTypes.energySaving.additionalWorks[key] === val}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          energySaving: {
                            ...prev.reformTaxWorkTypes.energySaving,
                            additionalWorks: { ...prev.reformTaxWorkTypes.energySaving.additionalWorks, [key]: val },
                          },
                        },
                      }))}
                      className="w-3 h-3" />
                    {val === 'yes' ? '有' : '無'}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ④ 同居対応改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-3">④ 多世帯同居改修工事等</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {([
            ['kitchen', '1 調理室の増設'],
            ['bathroom', '2 浴室の増設'],
            ['toilet', '3 便所の増設'],
            ['entrance', '4 玄関の増設'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                checked={formData.reformTaxWorkTypes.cohabitation[key] as boolean}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    cohabitation: { ...prev.reformTaxWorkTypes.cohabitation, [key]: e.target.checked },
                  },
                }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {/* 改修前後の室数 */}
        <div className="border-t border-stone-100 pt-3">
          <p className="text-xs font-semibold text-stone-700 mb-2">改修工事前後の室数</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-2 py-1 text-left"></th>
                  <th className="px-2 py-1 text-center">調理室</th>
                  <th className="px-2 py-1 text-center">浴室</th>
                  <th className="px-2 py-1 text-center">便所</th>
                  <th className="px-2 py-1 text-center">玄関</th>
                </tr>
              </thead>
              <tbody>
                {(['countBefore', 'countAfter'] as const).map(timing => (
                  <tr key={timing}>
                    <td className="px-2 py-1 font-medium">{timing === 'countBefore' ? '改修前' : '改修後'}</td>
                    {(['kitchen', 'bathroom', 'toilet', 'entrance'] as const).map(room => (
                      <td key={room} className="px-2 py-1 text-center">
                        <input type="number" min={0}
                          value={formData.reformTaxWorkTypes.cohabitation[timing][room] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reformTaxWorkTypes: {
                              ...prev.reformTaxWorkTypes,
                              cohabitation: {
                                ...prev.reformTaxWorkTypes.cohabitation,
                                [timing]: { ...prev.reformTaxWorkTypes.cohabitation[timing], [room]: parseInt(e.target.value) || 0 },
                              },
                            },
                          }))}
                          className="w-16 px-1 py-1 text-center text-sm border-2 border-stone-200 rounded-2xl" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ⑤ 耐久性向上改修工事等 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-3">⑤ 耐久性向上改修工事等</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {([
            ['atticVentilation', '1 小屋裏の換気工事'],
            ['atticInspection', '2 小屋裏点検口の取付工事'],
            ['wallVentilation', '3 外壁の通気構造等工事'],
            ['bathroomWaterproof', '4 浴室又は脱衣室の防水工事'],
            ['foundationAntiDecay', '5 土台の防腐・防蟻工事'],
            ['wallFrameAntiDecay', '6 外壁の軸組等の防腐・防蟻工事'],
            ['underfloorMoisture', '7 床下の防湿工事'],
            ['underfloorInspection', '8 床下点検口の取付工事'],
            ['gutterInstallation', '9 雨どいの取付工事'],
            ['groundAntiTermite', '10 地盤の防蟻工事'],
            ['pipingMaintenance', '11 給水管・給湯管又は排水管の維持管理又は更新の容易化工事'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-start space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                checked={(formData.reformTaxWorkTypes.longTermHousing as Record<string, boolean | string>)[key] === true}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, [key]: e.target.checked },
                  },
                }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {/* 認定情報 */}
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-700 mb-2">長期優良住宅建築等計画の認定情報</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定主体</label>
              <input type="text"
                value={formData.reformTaxWorkTypes.longTermHousing.certAuthority}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certAuthority: e.target.value },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="○○市長" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定番号</label>
              <input type="text"
                value={formData.reformTaxWorkTypes.longTermHousing.certNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certNumber: e.target.value },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">認定年月日</label>
              <input type="date"
                value={formData.reformTaxWorkTypes.longTermHousing.certDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, certDate: e.target.value },
                  },
                }))}
                className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-stone-100">
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
              checked={formData.reformTaxWorkTypes.longTermHousing.isExcellentHousing}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reformTaxWorkTypes: {
                  ...prev.reformTaxWorkTypes,
                  longTermHousing: { ...prev.reformTaxWorkTypes.longTermHousing, isExcellentHousing: e.target.checked },
                },
              }))} />
            <span className="font-medium text-emerald-800">認定長期優良住宅に該当する（⑥耐震及び省エネの両方と併せて行う場合）</span>
          </label>
        </div>
      </div>

      {/* ⑦ 子育て対応改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-1">⑥ 子育て対応改修工事等</h3>
        <p className="text-xs text-stone-600 mb-3 ml-4">子育てに係る特例対象個人の負担を軽減するための次のいずれかに該当する増築、改築、修繕又は模様替</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
          {([
            ['accidentPrevention', '１　住宅内における子どもの事故を防止するための工事'],
            ['counterKitchen', '２　対面式キッチンへの交換工事'],
            ['securityImprovement', '３　開口部の防犯性を高める工事'],
            ['storageIncrease', '４　収納設備を増設する工事'],
            ['soundproofing', '５　開口部・界壁・界床の防音性を高める工事'],
            ['layoutChange', '６　間取り変更工事'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="w-4 h-4 text-amber-600 rounded"
                checked={formData.reformTaxWorkTypes.childcare[key]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reformTaxWorkTypes: {
                    ...prev.reformTaxWorkTypes,
                    childcare: { ...prev.reformTaxWorkTypes.childcare, [key]: e.target.checked },
                  },
                }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 併せて行う第1号〜第6号工事 */}
      <div className="p-4 border border-orange-200 bg-orange-50 rounded-2xl">
        <h3 className="font-bold text-sm mb-1">併せて行う第1号〜第6号工事</h3>
        <p className="text-xs text-stone-500 mb-4">①〜⑦の工事と併せて行った場合に記入してください。</p>

        {/* 第1号工事 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-700 mb-2">第1号工事</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-2">
            {([
              ['extension', '1 増築'],
              ['renovation', '2 改築'],
              ['majorRepair', '3 大規模の修繕'],
              ['majorRemodeling', '4 大規模の模様替'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                  checked={formData.reformTaxWorkTypes.additionalWorks.work1[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      additionalWorks: {
                        ...prev.reformTaxWorkTypes.additionalWorks,
                        work1: { ...prev.reformTaxWorkTypes.additionalWorks.work1, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 第2号工事 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-700 mb-1">第2号工事</p>
          <p className="text-xs text-stone-500 mb-2 ml-2">1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるもののうちその者が区分所有する部分について行う次のいずれかに該当する修繕又は模様替</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
            {([
              ['floor', '1 床の過半の修繕又は模様替'],
              ['stairs', '2 階段の過半の修繕又は模様替'],
              ['partition', '3 間仕切壁の過半の修繕又は模様替'],
              ['wall', '4 壁の過半の修繕又は模様替'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                  checked={formData.reformTaxWorkTypes.additionalWorks.work2[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      additionalWorks: {
                        ...prev.reformTaxWorkTypes.additionalWorks,
                        work2: { ...prev.reformTaxWorkTypes.additionalWorks.work2, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 第3号工事 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-700 mb-1">第3号工事</p>
          <p className="text-xs text-stone-500 mb-2 ml-2">次のいずれか一室の床又は壁の全部の修繕又は模様替</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-2">
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
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                  checked={formData.reformTaxWorkTypes.additionalWorks.work3[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      additionalWorks: {
                        ...prev.reformTaxWorkTypes.additionalWorks,
                        work3: { ...prev.reformTaxWorkTypes.additionalWorks.work3, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 第4号工事 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-700 mb-1">第4号工事（耐震改修工事）</p>
          <p className="text-xs text-red-500 mb-1 ml-2">※①の工事を実施していない場合のみ選択</p>
          <p className="text-xs text-stone-500 mb-2 ml-2">次の規定又は基準に適合させるための修繕又は模様替</p>
          <div className="grid grid-cols-1 gap-2 ml-2">
            {([
              ['buildingStandard', '1 建築基準法施行令第3章及び第5章の4の規定'],
              ['earthquakeSafety', '2 地震に対する安全性に係る基準'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                  checked={formData.reformTaxWorkTypes.additionalWorks.work4[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      additionalWorks: {
                        ...prev.reformTaxWorkTypes.additionalWorks,
                        work4: { ...prev.reformTaxWorkTypes.additionalWorks.work4, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 第5号工事 */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-stone-700 mb-1">第5号工事（バリアフリー改修工事）</p>
          <p className="text-xs text-red-500 mb-1 ml-2">※②の工事を実施していない場合のみ選択</p>
          <p className="text-xs text-stone-500 mb-2 ml-2">高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための次のいずれかに該当する修繕又は模様替</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
            {([
              ['pathwayExpansion', '1 通路又は出入口の拡幅'],
              ['stairSlope', '2 階段の勾配の緩和'],
              ['bathroomImprovement', '3 浴室の改良'],
              ['toiletImprovement', '4 便所の改良'],
              ['handrails', '5 手すりの取付'],
              ['stepElimination', '6 床の段差の解消'],
              ['doorImprovement', '7 出入口の戸の改良'],
              ['floorReplacement', '8 床材の取替'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                  checked={formData.reformTaxWorkTypes.additionalWorks.work5[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reformTaxWorkTypes: {
                      ...prev.reformTaxWorkTypes,
                      additionalWorks: {
                        ...prev.reformTaxWorkTypes.additionalWorks,
                        work5: { ...prev.reformTaxWorkTypes.additionalWorks.work5, [key]: e.target.checked },
                      },
                    },
                  }))} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 第6号工事 */}
        <div>
          <p className="text-xs font-semibold text-stone-700 mb-1">第6号工事（省エネ改修工事）</p>
          <p className="text-xs text-red-500 mb-2 ml-2">※③の工事を実施していない場合のみ選択</p>
          <div className="ml-2 space-y-4">

            {/* A. 全ての居室の全ての窓の断熱改修工事を実施した場合 */}
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-2">全ての居室の全ての窓の断熱改修工事を実施した場合</p>
              <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次のいずれかに該当する修繕若しくは模様替</p>
              <div className="space-y-1 ml-4">
                {([
                  ['1', '１　全ての居室の全ての窓の断熱性を高める工事'],
                  ['2', '２　全ての居室の全ての窓の断熱性を相当程度高める工事'],
                  ['3', '３　全ての居室の全ての窓の断熱性を著しく高める工事'],
                ] as [string, string][]).map(([val, label]) => (
                  <label key={val} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                      checked={formData.reformTaxWorkTypes.additionalWorks.work6.windowInsulationType === val}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, windowInsulationType: e.target.checked ? val : '' },
                          },
                        },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-3 mb-2 ml-2">上記１から３のいずれかと併せて行う次のいずれかに該当する修繕又は模様替</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-4">
                {([
                  ['ceilingInsulation', '４　天井等の断熱性を高める工事'],
                  ['wallInsulation', '５　壁の断熱性を高める工事'],
                  ['floorInsulation', '６　床等の断熱性を高める工事'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                      checked={formData.reformTaxWorkTypes.additionalWorks.work6[key] as boolean}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, [key]: e.target.checked },
                          },
                        },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                <div className="flex flex-wrap gap-2">
                  {['1','2','3','4','5','6','7','8'].map(n => (
                    <label key={n} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.regionCode === n}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, regionCode: e.target.checked ? n : '' },
                            },
                          },
                        }))} />
                      <span>{n}地域</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-4">
                <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                <div className="flex gap-3 mt-1">
                  {['1','2','3'].map(g => (
                    <label key={g} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.energyGradeBefore === g}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, energyGradeBefore: e.target.checked ? g : '' },
                            },
                          },
                        }))} />
                      <span>等級{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* B. 認定低炭素建築物新築等計画に基づく工事の場合 */}
            <div className="border-t border-stone-200 pt-3">
              <p className="text-xs font-semibold text-stone-600 mb-2">認定低炭素建築物新築等計画に基づく工事の場合</p>
              <p className="text-xs text-stone-500 mb-2 ml-2">次に該当する修繕又は模様替</p>
              <div className="ml-4 mb-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon.windowInsulation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reformTaxWorkTypes: {
                        ...prev.reformTaxWorkTypes,
                        additionalWorks: {
                          ...prev.reformTaxWorkTypes.additionalWorks,
                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, windowInsulation: e.target.checked } },
                        },
                      },
                    }))} />
                  <span>１　窓</span>
                </label>
              </div>
              <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ml-4">
                {([
                  ['ceilingInsulation', '２　天井等'],
                  ['wallInsulation', '３　壁'],
                  ['floorInsulation', '４　床等'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                      checked={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, [key]: e.target.checked } },
                          },
                        },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 ml-4">
                {([
                  ['certAuthority', '低炭素建築物新築等計画の認定主体'],
                  ['certNumber', '低炭素建築物新築等計画の認定番号'],
                  ['certDate', '低炭素建築物新築等計画の認定年月日'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-stone-600 mb-1">{label}</label>
                    <input type={key === 'certDate' ? 'date' : 'text'}
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.lowCarbon[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, lowCarbon: { ...prev.reformTaxWorkTypes.additionalWorks.work6.lowCarbon, [key]: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>

            {/* C. 改修工事後の住宅の一定の省エネ性能が住宅性能評価書により証明される場合 */}
            <div className="border-t border-stone-200 pt-3">
              <p className="text-xs font-semibold text-stone-600 mb-2">改修工事後の住宅の一定の省エネ性能が住宅性能評価書により証明される場合</p>
              <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次に該当する修繕若しくは模様替</p>
              <div className="ml-4 mb-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.windowInsulation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reformTaxWorkTypes: {
                        ...prev.reformTaxWorkTypes,
                        additionalWorks: {
                          ...prev.reformTaxWorkTypes.additionalWorks,
                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, windowInsulation: e.target.checked } },
                        },
                      },
                    }))} />
                  <span>１　窓の断熱性を高める工事</span>
                </label>
              </div>
              <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
              <div className="space-y-1 ml-4">
                {([
                  ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
                  ['wallInsulation', '３　壁の断熱性を高める工事'],
                  ['floorInsulation', '４　床等の断熱性を高める工事'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                      checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, [key]: e.target.checked } },
                          },
                        },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                <div className="flex flex-wrap gap-2">
                  {['1','2','3','4','5','6','7','8'].map(n => (
                    <label key={n} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.regionCode === n}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, regionCode: e.target.checked ? n : '' } },
                            },
                          },
                        }))} />
                      <span>{n}地域</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-4">
                <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                <div className="flex gap-3 mt-1">
                  {['1','2','3'].map(g => (
                    <label key={g} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.energyGradeBefore === g}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, energyGradeBefore: e.target.checked ? g : '' } },
                            },
                          },
                        }))} />
                      <span>等級{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-4">
                <span className="text-xs font-semibold text-stone-700">改修工事後の断熱等性能等級</span>
                <div className="flex gap-3 mt-1">
                  {[['1', '１　断熱等性能等級２'], ['2', '２　断熱等性能等級３'], ['3', '３　断熱等性能等級４以上']].map(([val, label]) => (
                    <label key={val} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.energyGradeAfter === val}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, energyGradeAfter: e.target.checked ? val : '' } },
                            },
                          },
                        }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-3 ml-4">
                <p className="text-xs font-semibold text-stone-700 mb-2">住宅性能評価書を交付した登録住宅性能評価機関</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">名称</label>
                    <input type="text"
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalAgencyName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalAgencyName: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">登録番号</label>
                    <input type="text"
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalRegistrationNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalRegistrationNumber: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">住宅性能評価書の交付番号</label>
                    <input type="text"
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalCertNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalCertNumber: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" placeholder="第○○号" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">住宅性能評価書の交付年月日</label>
                    <input type="date"
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.performanceEval.evalCertDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, performanceEval: { ...prev.reformTaxWorkTypes.additionalWorks.work6.performanceEval, evalCertDate: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* D. 増改築による長期優良住宅建築等計画の認定により証明される場合 */}
            <div className="border-t border-stone-200 pt-3">
              <p className="text-xs font-semibold text-stone-600 mb-2">増改築による長期優良住宅建築等計画の認定により証明される場合</p>
              <p className="text-xs text-stone-500 mb-2 ml-2">エネルギーの使用の合理化に著しく貢する次のいずれかに該当する修繕若しくは模様替又はエネルギーの使用の合理化に相当程度貢する次に該当する修繕若しくは模様替</p>
              <div className="ml-4 mb-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                    checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.windowInsulation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reformTaxWorkTypes: {
                        ...prev.reformTaxWorkTypes,
                        additionalWorks: {
                          ...prev.reformTaxWorkTypes.additionalWorks,
                          work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, windowInsulation: e.target.checked } },
                        },
                      },
                    }))} />
                  <span>１　窓の断熱性を高める工事</span>
                </label>
              </div>
              <p className="text-xs text-stone-500 mb-2 ml-2">上記1と併せて行う次のいずれかに該当する修繕又は模様替</p>
              <div className="space-y-1 ml-4">
                {([
                  ['ceilingInsulation', '２　天井等の断熱性を高める工事'],
                  ['wallInsulation', '３　壁の断熱性を高める工事'],
                  ['floorInsulation', '４　床等の断熱性を高める工事'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                      checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, [key]: e.target.checked } },
                          },
                        },
                      }))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-stone-700 shrink-0">地域区分</span>
                <div className="flex flex-wrap gap-2">
                  {['1','2','3','4','5','6','7','8'].map(n => (
                    <label key={n} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.regionCode === n}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, regionCode: e.target.checked ? n : '' } },
                            },
                          },
                        }))} />
                      <span>{n}地域</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-4">
                <span className="text-xs font-semibold text-stone-700">改修工事前の住宅が相当する断熱等性能等級</span>
                <div className="flex gap-3 mt-1">
                  {['1','2','3'].map(g => (
                    <label key={g} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.energyGradeBefore === g}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, energyGradeBefore: e.target.checked ? g : '' } },
                            },
                          },
                        }))} />
                      <span>等級{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-4">
                <span className="text-xs font-semibold text-stone-700">改修工事後の住宅の断熱等性能等級</span>
                <div className="flex gap-3 mt-1">
                  {[['1', '１　断熱等性能等級３'], ['2', '２　断熱等性能等級４以上']].map(([val, label]) => (
                    <label key={val} className="flex items-center space-x-1 text-xs">
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded"
                        checked={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert.energyGradeAfter === val}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxWorkTypes: {
                            ...prev.reformTaxWorkTypes,
                            additionalWorks: {
                              ...prev.reformTaxWorkTypes.additionalWorks,
                              work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, energyGradeAfter: e.target.checked ? val : '' } },
                            },
                          },
                        }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 ml-4">
                {([
                  ['certAuthority', '長期優良住宅建築等計画の認定主体'],
                  ['certNumber', '長期優良住宅建築等計画の認定番号'],
                  ['certDate', '長期優良住宅建築等計画の認定年月日'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-stone-600 mb-1">{label}</label>
                    <input type={key === 'certDate' ? 'date' : 'text'}
                      value={formData.reformTaxWorkTypes.additionalWorks.work6.longTermCert[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reformTaxWorkTypes: {
                          ...prev.reformTaxWorkTypes,
                          additionalWorks: {
                            ...prev.reformTaxWorkTypes.additionalWorks,
                            work6: { ...prev.reformTaxWorkTypes.additionalWorks.work6, longTermCert: { ...prev.reformTaxWorkTypes.additionalWorks.work6.longTermCert, [key]: e.target.value } },
                          },
                        },
                      }))}
                      className="w-full px-2 py-1 text-sm border-2 border-stone-200 rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
