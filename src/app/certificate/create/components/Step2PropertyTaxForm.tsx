'use client';

import type { StepProps } from '../types';

export default function Step2PropertyTaxForm({ formData, setFormData }: StepProps) {
  return (
    <div className="space-y-6">
      {/* 1-1: 耐震改修 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-1">１－１．耐震改修をした場合</h3>
        <p className="text-xs text-stone-500 mb-3">地方税法施行令附則第12条第19項に規定する基準に適合する耐震改修</p>

        <div className="mb-4">
          <p className="text-xs font-medium text-stone-700 mb-2">工事の種別</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ['extension', '1 増築'],
              ['renovation', '2 改築'],
              ['majorRepair', '3 大規模の修繕'],
              ['majorRemodeling', '4 大規模の模様替'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox"
                  checked={formData.propertyTaxForm.seismicWorkTypes[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: {
                      ...prev.propertyTaxForm,
                      seismicWorkTypes: { ...prev.propertyTaxForm.seismicWorkTypes, [key]: e.target.checked },
                    },
                  }))}
                  className="w-4 h-4 text-amber-600 rounded" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-700 mb-1">工事の内容</label>
          <textarea
            value={formData.propertyTaxForm.seismicWorkDescription}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              propertyTaxForm: { ...prev.propertyTaxForm, seismicWorkDescription: e.target.value },
            }))}
            rows={2}
            className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
            placeholder="耐震改修工事の内容を記入..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">全体の工事費用（税込）</label>
            <input type="number"
              value={formData.propertyTaxForm.seismicTotalCost || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                propertyTaxForm: { ...prev.propertyTaxForm, seismicTotalCost: Number(e.target.value) || 0 },
              }))}
              className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">うち耐震改修の工事費用（税込）</label>
            <input type="number"
              value={formData.propertyTaxForm.seismicCost || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                propertyTaxForm: { ...prev.propertyTaxForm, seismicCost: Number(e.target.value) || 0 },
              }))}
              className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="0" />
          </div>
        </div>
      </div>

      {/* 1-2: 耐震改修→認定長期優良住宅 */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <div className="flex items-center space-x-2 mb-3">
          <input type="checkbox"
            checked={formData.propertyTaxForm.seismicLongTermEnabled}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              propertyTaxForm: { ...prev.propertyTaxForm, seismicLongTermEnabled: e.target.checked },
            }))}
            className="w-4 h-4 text-amber-600 rounded" />
          <div>
            <h3 className="font-bold text-sm">１－２．耐震改修をした家屋が認定長期優良住宅に該当することとなった場合</h3>
            <p className="text-xs text-stone-500">地方税法附則第15条の９の２第１項に規定する耐震改修</p>
          </div>
        </div>

        {formData.propertyTaxForm.seismicLongTermEnabled && (
          <div className="ml-6 space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">認定主体</label>
              <input type="text"
                value={formData.propertyTaxForm.seismicLtCertAuthority}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertAuthority: e.target.value },
                }))}
                className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="○○市長" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">認定番号</label>
              <input type="text"
                value={formData.propertyTaxForm.seismicLtCertNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertNumber: e.target.value },
                }))}
                className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="第○○号" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">認定年月日</label>
              <input type="date"
                value={formData.propertyTaxForm.seismicLtCertDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  propertyTaxForm: { ...prev.propertyTaxForm, seismicLtCertDate: e.target.value },
                }))}
                className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
            </div>
          </div>
        )}
      </div>

      {/* 2: 熱損失防止改修工事等（省エネ） */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <h3 className="font-bold text-sm mb-1">２．熱損失防止改修工事等をした場合</h3>
        <p className="text-xs text-stone-500 mb-3">熱損失防止改修工事等をした場合又は熱損失防止改修工事等をした家屋が認定長期優良住宅に該当することとなった場合</p>

        <div className="mb-4">
          <p className="text-xs font-medium text-stone-700 mb-2">工事の種別（窓の断熱性を高める工事と併せて行う以下の工事）</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {([
              ['ceilingInsulation', '1 天井等の断熱性を高める工事'],
              ['wallInsulation', '2 壁の断熱性を高める工事'],
              ['floorInsulation', '3 床等の断熱性を高める工事'],
              ['solarHeat', '4 太陽熱利用冷温熱装置の設置工事'],
              ['latentHeatRecovery', '5 潜熱回収型給湯器の設置工事'],
              ['heatPump', '6 ヒートポンプ式電気給湯器の設置工事'],
              ['fuelCell', '7 燃料電池コージェネレーションシステムの設置工事'],
              ['airConditioner', '8 エアコンディショナーの設置工事'],
              ['solarPower', '9 太陽光発電設備の設置工事'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2 text-sm">
                <input type="checkbox"
                  checked={formData.propertyTaxForm.energyTypes[key]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: {
                      ...prev.propertyTaxForm,
                      energyTypes: { ...prev.propertyTaxForm.energyTypes, [key]: e.target.checked },
                    },
                  }))}
                  className="w-4 h-4 text-amber-600 rounded" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-700 mb-1">工事の内容</label>
          <textarea
            value={formData.propertyTaxForm.energyWorkDescription}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              propertyTaxForm: { ...prev.propertyTaxForm, energyWorkDescription: e.target.value },
            }))}
            rows={2}
            className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
            placeholder="省エネ改修工事の内容を記入..."
          />
        </div>

        {/* 費用の額 */}
        <div className="bg-stone-50 p-3 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-stone-700">費用の額</p>
          <div>
            <label className="block text-xs text-stone-600 mb-1">全体の工事費用（税込）</label>
            <input type="number"
              value={formData.propertyTaxForm.energyTotalCost || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                propertyTaxForm: { ...prev.propertyTaxForm, energyTotalCost: Number(e.target.value) || 0 },
              }))}
              className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="0" />
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-medium text-stone-600 mb-2">断熱改修工事</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">ア 断熱改修工事の費用</label>
                <input type="number"
                  value={formData.propertyTaxForm.energyInsulationCost || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationCost: Number(e.target.value) || 0 },
                  }))}
                  className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">イ 補助金等の有無</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center space-x-1 text-sm">
                    <input type="radio" name="insulationSubsidy"
                      checked={formData.propertyTaxForm.energyInsulationHasSubsidy}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: true },
                      }))}
                      className="w-4 h-4 text-amber-600" />
                    <span>有</span>
                  </label>
                  <label className="flex items-center space-x-1 text-sm">
                    <input type="radio" name="insulationSubsidy"
                      checked={!formData.propertyTaxForm.energyInsulationHasSubsidy}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationHasSubsidy: false, energyInsulationSubsidy: 0 },
                      }))}
                      className="w-4 h-4 text-amber-600" />
                    <span>無</span>
                  </label>
                </div>
              </div>
            </div>
            {formData.propertyTaxForm.energyInsulationHasSubsidy && (
              <div className="mt-2">
                <label className="block text-xs text-stone-600 mb-1">ウ 補助金等の額</label>
                <input type="number"
                  value={formData.propertyTaxForm.energyInsulationSubsidy || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyInsulationSubsidy: Number(e.target.value) || 0 },
                  }))}
                  className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
            )}
            {/* ① 差引額（自動計算） */}
            <div className="mt-2 p-2 bg-amber-50 rounded-2xl text-sm">
              ① 差引額: <span className="font-bold">
                {(formData.propertyTaxForm.energyInsulationCost - (formData.propertyTaxForm.energyInsulationHasSubsidy ? formData.propertyTaxForm.energyInsulationSubsidy : 0)).toLocaleString()}円
              </span>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-medium text-stone-600 mb-2">設備工事</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">エ 設備工事の費用</label>
                <input type="number"
                  value={formData.propertyTaxForm.energyEquipmentCost || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentCost: Number(e.target.value) || 0 },
                  }))}
                  className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">オ 補助金等の有無</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center space-x-1 text-sm">
                    <input type="radio" name="equipmentSubsidy"
                      checked={formData.propertyTaxForm.energyEquipmentHasSubsidy}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: true },
                      }))}
                      className="w-4 h-4 text-amber-600" />
                    <span>有</span>
                  </label>
                  <label className="flex items-center space-x-1 text-sm">
                    <input type="radio" name="equipmentSubsidy"
                      checked={!formData.propertyTaxForm.energyEquipmentHasSubsidy}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentHasSubsidy: false, energyEquipmentSubsidy: 0 },
                      }))}
                      className="w-4 h-4 text-amber-600" />
                    <span>無</span>
                  </label>
                </div>
              </div>
            </div>
            {formData.propertyTaxForm.energyEquipmentHasSubsidy && (
              <div className="mt-2">
                <label className="block text-xs text-stone-600 mb-1">カ 補助金等の額</label>
                <input type="number"
                  value={formData.propertyTaxForm.energyEquipmentSubsidy || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyEquipmentSubsidy: Number(e.target.value) || 0 },
                  }))}
                  className="w-full max-w-xs px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
            )}
            {/* ② 設備差引額（自動計算） */}
            <div className="mt-2 p-2 bg-amber-50 rounded-2xl text-sm">
              ② 設備差引額: <span className="font-bold">
                {(formData.propertyTaxForm.energyEquipmentCost - (formData.propertyTaxForm.energyEquipmentHasSubsidy ? formData.propertyTaxForm.energyEquipmentSubsidy : 0)).toLocaleString()}円
              </span>
            </div>
          </div>

          {/* ③④ 費用確認 */}
          {(() => {
            const d1 = formData.propertyTaxForm.energyInsulationCost - (formData.propertyTaxForm.energyInsulationHasSubsidy ? formData.propertyTaxForm.energyInsulationSubsidy : 0);
            const d2 = formData.propertyTaxForm.energyEquipmentCost - (formData.propertyTaxForm.energyEquipmentHasSubsidy ? formData.propertyTaxForm.energyEquipmentSubsidy : 0);
            const check3 = d1 > 600000;
            const check4 = d1 > 500000 && (d1 + d2) > 600000;
            return (
              <div className="border-t pt-3 space-y-1">
                <div className={`text-sm p-2 rounded-2xl ${check3 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                  ③ ①が60万円超: <span className="font-bold">{check3 ? '該当' : '非該当'}</span>
                </div>
                <div className={`text-sm p-2 rounded-2xl ${check4 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                  ④ ①が50万円超かつ①＋②が60万円超: <span className="font-bold">{check4 ? '該当' : '非該当'}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 認定長期優良住宅（省エネpath） */}
        <div className="mt-4 p-3 border border-dashed border-stone-300 rounded-2xl">
          <label className="flex items-center space-x-2">
            <input type="checkbox"
              checked={formData.propertyTaxForm.energyLongTermEnabled}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                propertyTaxForm: { ...prev.propertyTaxForm, energyLongTermEnabled: e.target.checked },
              }))}
              className="w-4 h-4 text-amber-600 rounded" />
            <span className="text-sm font-medium">認定長期優良住宅に該当する場合</span>
          </label>
          {formData.propertyTaxForm.energyLongTermEnabled && (
            <div className="ml-6 mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">認定主体</label>
                <input type="text"
                  value={formData.propertyTaxForm.energyLtCertAuthority}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertAuthority: e.target.value },
                  }))}
                  className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="○○市長" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">認定番号</label>
                <input type="text"
                  value={formData.propertyTaxForm.energyLtCertNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertNumber: e.target.value },
                  }))}
                  className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="第○○号" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">認定年月日</label>
                <input type="date"
                  value={formData.propertyTaxForm.energyLtCertDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    propertyTaxForm: { ...prev.propertyTaxForm, energyLtCertDate: e.target.value },
                  }))}
                  className="w-full max-w-md px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
